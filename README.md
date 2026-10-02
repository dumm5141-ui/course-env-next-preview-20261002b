# Canonical creator content seed

The exact two courses are **Practical Object Design** and **Browser Algorithms**. Course JSON metadata lives in `courses/`, nested Markdown/groups/problems in `learning/<course-id>/`, and standalone challenges in `challenges/`. A group's optional `group.json` sets stable identity, title and ordering; folder titles otherwise replace underscores with spaces. Problems retain their `problem.json` ID when moved. Starter files/tests and creator reference implementations occupy separate directories.

The platform imports the folder tree as the canonical curriculum. Its bulk visibility and FREE/PAID operations update problem metadata through revision-protected Git commits. Do not embed secrets in course files, starters, references or environment closures. A public Git repository exposes its content regardless of platform access settings.

## Creator environment CI

`.github/workflows/build-environment.yml` runs `environment/publish.ts` on push or manual dispatch. It validates canonical content through the platform, builds the locked x86_64 Nix environment, signs and exports its native closure, uploads immutable binary-cache files and a SHA-256-addressed descriptor, and binds the exact producing commit using GitHub Actions OIDC. The application itself never builds Nix.

Configure an x86_64 Linux runner with Nix (flakes/nix-command) and Node 24, restricted to this trusted creator repository, carrying the `creator-environment` label. Do not run pull-request code with publication/signing credentials. GitHub-hosted installation of Nix can replace this runner setup if the creator chooses it; that account/runner setup is external to the platform.

When the platform creates a template repository, it writes `PLATFORM_URL` and `PLATFORM_RESOURCE_IDS` into the committed workflow from the selected platform origin and associated resource IDs. These values are public and contain no credentials, so a creator should not need to configure them after hosting. If the workflow is copied to an independently created repository, configure them explicitly:

- `PLATFORM_URL`: canonical HTTPS platform origin, matching its `BASE_URL`.
- `PLATFORM_RESOURCE_IDS`: comma-separated public IDs of the associated courses/challenges. Connect and sync them first.
- `CACHE_PUBLIC_URL`: HTTPS base for the native cache and descriptors; allow unauthenticated GET and browser CORS.
- `CACHE_UPLOAD_URL`: authenticated HTTP PUT base serving the same relative objects. It must honor `If-None-Match: *` and return 412 for existing objects. Uploaded bytes are fetched back and hashed before association.
- `NIX_PUBLIC_KEY`: output of the native Nix public-key generator.

Repository secrets:

- `NIX_SIGNING_KEY`: native Nix secret signing key (64 bytes encoded after the key name).
- `CACHE_UPLOAD_TOKEN`: token restricted to publishing the cache prefix, not application/Git credentials.

Generate signing keys privately using `nix-store --generate-binary-cache-key <key-name> <private-file> <public-file>`. Never commit the private file. Configure the cache and descriptor origin in the platform's `ENVIRONMENT_ARTIFACT_ORIGINS`. This script defines a concrete immutable HTTP storage contract; choosing/provisioning its public host and proving its cost allowance remain operator actions, not a bundled storage service.

The GitHub App needs Workflows write permission to initialize the generated workflow. The CI endpoint accepts signed short-lived tokens only from the currently associated repository ID/name, branch and this exact workflow, for push/manual-dispatch events at the exact commit. Fork/PR tokens, expired tokens, incorrect audiences and stale/replaced associations cannot bind an environment. Retrying an identical descriptor is idempotent; rebinding a revision to different bytes fails. Missing configuration, missing OIDC, a failed identity check or any failed resource binding exits the workflow visibly; there is no catalogue query, hardcoded platform/resource fallback or skipped bind.

From the application repository, `npm run check:starter` checks both courses, safe file projection, generated fixtures, failing incomplete starters and passing creator reference solutions. This is host validation, not proof of real browser execution or account-backed CI publication.
