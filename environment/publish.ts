import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const CACHE_CONFIGURATION = [
  "CACHE_PUBLIC_URL",
  "CACHE_UPLOAD_URL",
  "NIX_PUBLIC_KEY",
  "NIX_SIGNING_KEY",
  "CACHE_UPLOAD_TOKEN",
] as const;

export type PublishConfig = {
  revision: string;
  platform: string;
  repository: string;
  resources: string[];
  mode: "builtin" | "cache";
  cachePublicUrl?: string;
  cacheUploadUrl?: string;
  nixPublicKey?: string;
  nixSigningKey?: string;
  cacheUploadToken?: string;
};

function required(env: NodeJS.ProcessEnv, name: string) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Configure ${name}.`);
  return value;
}

function validateHttpsUrl(value: string, name: string, allowPath = false) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid HTTPS URL.`);
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (!allowPath && url.pathname !== "/") ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      `${name} must be an HTTPS URL without credentials, query strings or fragments.`,
    );
  }
  return allowPath ? url.href.replace(/\/?$/, "/") : url.origin;
}

function parseResources(value: string) {
  const resources = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!resources.length || resources.length > 100) {
    throw new Error("PLATFORM_RESOURCE_IDS must contain between 1 and 100 resource IDs.");
  }
  if (
    new Set(resources).size !== resources.length ||
    resources.some((id) => !/^[a-f0-9]{32}$/.test(id))
  ) {
    throw new Error(
      "PLATFORM_RESOURCE_IDS must contain unique 32-character hexadecimal public IDs.",
    );
  }
  return resources;
}

/**
 * Resolve CI configuration without reading module-scoped environment state.
 * Built-in mode is an explicit pinned native.json artifact mode. It is not a
 * fallback: platform, repository, resource IDs and Actions OIDC are required
 * before the workflow can bind anything.
 */
export function resolvePublishConfig(env: NodeJS.ProcessEnv = process.env): PublishConfig {
  const revision = required(env, "GITHUB_SHA");
  if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error("Invalid Git revision.");

  const platform = validateHttpsUrl(required(env, "PLATFORM_URL"), "PLATFORM_URL");
  const repository = required(env, "GITHUB_REPOSITORY");
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error("GITHUB_REPOSITORY must use the owner/repository form.");
  }
  const resources = parseResources(required(env, "PLATFORM_RESOURCE_IDS"));

  const configured = CACHE_CONFIGURATION.filter((name) => Boolean(env[name]?.trim()));
  if (configured.length !== 0 && configured.length !== CACHE_CONFIGURATION.length) {
    throw new Error(
      `Configure all cache variables together (${CACHE_CONFIGURATION.join(", ")}), or omit them all for the pinned native.json mode.`,
    );
  }
  if (configured.length === 0) {
    return { revision, platform, repository, resources, mode: "builtin" };
  }

  return {
    revision,
    platform,
    repository,
    resources,
    mode: "cache",
    cachePublicUrl: validateHttpsUrl(required(env, "CACHE_PUBLIC_URL"), "CACHE_PUBLIC_URL", true),
    cacheUploadUrl: validateHttpsUrl(required(env, "CACHE_UPLOAD_URL"), "CACHE_UPLOAD_URL", true),
    nixPublicKey: required(env, "NIX_PUBLIC_KEY"),
    nixSigningKey: required(env, "NIX_SIGNING_KEY"),
    cacheUploadToken: required(env, "CACHE_UPLOAD_TOKEN"),
  };
}

function responseText(body: string) {
  return body.length > 1000 ? `${body.slice(0, 1000)}…` : body;
}

async function bind(
  config: PublishConfig,
  artifact?: { version: number; digest: string; manifestUrl: string },
) {
  const idTokenUrl = required(process.env, "ACTIONS_ID_TOKEN_REQUEST_URL");
  const idToken = required(process.env, "ACTIONS_ID_TOKEN_REQUEST_TOKEN");
  const identityUrl = new URL(idTokenUrl);
  if (identityUrl.protocol !== "https:")
    throw new Error("GitHub Actions identity URL must use HTTPS.");
  identityUrl.searchParams.set("audience", config.platform);
  const identityResponse = await fetch(identityUrl, {
    headers: { Authorization: `Bearer ${idToken}` },
    redirect: "error",
    signal: AbortSignal.timeout(60000),
  });
  if (!identityResponse.ok) {
    throw new Error(
      `Unable to obtain GitHub workflow identity (${identityResponse.status}): ${responseText(await identityResponse.text())}`,
    );
  }
  const identity = (await identityResponse.json()) as { value?: unknown };
  if (typeof identity.value !== "string" || !identity.value) {
    throw new Error("GitHub workflow identity response did not contain a token.");
  }

  for (const resourceId of config.resources) {
    const response = await fetch(`${config.platform}/api/environment-artifacts/ci`, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(60000),
      headers: { Authorization: `Bearer ${identity.value}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        resourceId,
        revision: config.revision,
        ...(artifact ? { artifact } : {}),
      }),
    });
    if (!response.ok) {
      throw new Error(
        `Environment binding failed for ${resourceId} (${response.status}): ${responseText(await response.text())}`,
      );
    }
    console.log(
      `Platform ${artifact ? "binding" : "validation"} succeeded for resource ${resourceId}.`,
    );
  }
}

async function run() {
  const config = resolvePublishConfig();
  if (config.mode === "cache") {
    const { cachePublicUrl, cacheUploadUrl, nixPublicKey, nixSigningKey, cacheUploadToken } =
      config;
    if (
      !cachePublicUrl ||
      !cacheUploadUrl ||
      !nixPublicKey ||
      !nixSigningKey ||
      !cacheUploadToken
    ) {
      throw new Error("Complete cache configuration is required in cache mode.");
    }
    const scratch = await mkdtemp(join(tmpdir(), "creator-cache-"));
    try {
      await bind(config);
      const keyPath = join(scratch, "signing-key");
      const [keyName, keyBytes] = nixSigningKey.split(":");
      const raw = Buffer.from(keyBytes ?? "", "base64");
      if (
        raw.length !== 64 ||
        `${keyName}:${raw.subarray(32).toString("base64")}` !== nixPublicKey
      ) {
        throw new Error("Nix signing key and public key do not match.");
      }
      await writeFile(keyPath, nixSigningKey, { mode: 0o600 });
      const nix = (args: string[]) =>
        execFileSync("nix", ["--extra-experimental-features", "nix-command flakes", ...args], {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "inherit"],
        }).trim();
      const storePath = nix([
        "build",
        "path:./environment",
        "--no-update-lock-file",
        "--no-link",
        "--print-out-paths",
      ]);
      if (!/^\/nix\/store\/[0-9abcdfghijklmnpqrsvwxyz]{32}-[A-Za-z0-9+._?=-]+$/.test(storePath)) {
        throw new Error("Expected one native environment store path.");
      }
      nix(["store", "sign", "--recursive", "--key-file", keyPath, storePath]);
      const cache = join(scratch, "cache");
      nix(["copy", "--to", `file://${cache}`, storePath]);
      async function publish(path: string, bytes: Uint8Array) {
        const response = await fetch(new URL(path, cacheUploadUrl), {
          method: "PUT",
          redirect: "error",
          signal: AbortSignal.timeout(120000),
          headers: {
            Authorization: `Bearer ${cacheUploadToken}`,
            "If-None-Match": "*",
            "Content-Type": "application/octet-stream",
          },
          body: Buffer.from(bytes),
        });
        if (!response.ok && response.status !== 412) {
          throw new Error(
            `Artifact upload failed (${response.status}): ${responseText(await response.text())}`,
          );
        }
        const published = await fetch(new URL(path, cachePublicUrl), {
          redirect: "error",
          signal: AbortSignal.timeout(120000),
        });
        if (!published.ok) throw new Error("Published artifact is not readable at its public URL.");
        const hash = (value: Uint8Array) => createHash("sha256").update(value).digest("hex");
        if (hash(new Uint8Array(await published.arrayBuffer())) !== hash(bytes)) {
          throw new Error("Storage overwrote or served mismatching immutable bytes.");
        }
      }
      async function walk(prefix = "") {
        for (const entry of await readdir(join(cache, prefix), { withFileTypes: true })) {
          const path = prefix ? `${prefix}/${entry.name}` : entry.name;
          if (entry.isDirectory()) await walk(path);
          else if (entry.isFile()) await publish(path, await readFile(join(cache, path)));
        }
      }
      await walk();
      const manifest = {
        version: 1,
        architecture: "x86_64",
        runtime: "trynix-qemu-wasm",
        storePaths: [storePath],
        caches: [{ url: cachePublicUrl, key: nixPublicKey }],
        environment: { PATH: `${storePath}/bin:/usr/bin:/bin` },
      };
      const bytes = Buffer.from(JSON.stringify(manifest, null, 2));
      const digest = createHash("sha256").update(bytes).digest("hex");
      const path = `manifests/${digest}.json`;
      await publish(path, bytes);
      await bind(config, {
        version: 1,
        digest: `sha256:${digest}`,
        manifestUrl: new URL(path, cachePublicUrl).href,
      });
      console.log("Canonical content validated; native closure published; exact revision bound.");
    } finally {
      await rm(scratch, { recursive: true, force: true });
    }
    return;
  }

  const manifestBytes = await readFile(join(process.cwd(), "environment", "native.json"));
  const digest = `sha256:${createHash("sha256").update(manifestBytes).digest("hex")}`;
  const manifestUrl = `https://raw.githubusercontent.com/${config.repository}/${config.revision}/environment/native.json`;
  console.log(`Using explicitly selected pinned native.json environment artifact: ${digest}`);
  console.log(`Manifest URL: ${manifestUrl}`);
  await bind(config, { version: 1, digest, manifestUrl });
  console.log(
    `Canonical content validated and bound ${config.resources.length} resource(s) to ${digest}.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await run();
}
