{
  description = "Reproducible learner toolchain for Practical Object Design and Browser Algorithms";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  outputs = { nixpkgs, ... }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
      nextjsCounterRuntime = pkgs.buildNpmPackage {
        pname = "nextjs-counter-runtime";
        version = "15.5.26";
        src = ./nextjs-counter-runtime;
        npmDepsHash = "sha256-NxXzxbFcS3qLM2k+zDdKtayT5wcU5FDEmbDb6AVffgU=";
        dontNpmBuild = true;
        installPhase = ''
          mkdir -p $out/lib/nextjs-counter $out/bin
          cp -R node_modules $out/lib/nextjs-counter/
          cat > $out/bin/next <<EOF
#!${pkgs.bash}/bin/bash
export NODE_PATH="$out/lib/nextjs-counter/node_modules"
exec ${pkgs.nodejs_24}/bin/node "$out/lib/nextjs-counter/node_modules/next/dist/bin/next" "\$@"
EOF
          chmod +x $out/bin/next
          cat > $out/bin/nextjs-counter-prepare <<EOF
#!${pkgs.bash}/bin/bash
set -eu
runtime="$out/lib/nextjs-counter/node_modules"
if [ -e node_modules ] || [ -L node_modules ]; then
  if [ -L node_modules ] && [ "\$(readlink node_modules)" = "\$runtime" ]; then
    exit 0
  fi
  printf '%s\n' 'Cannot prepare the immutable Next.js dependencies: node_modules already exists.' >&2
  exit 1
fi
ln -s "\$runtime" node_modules
EOF
          chmod +x $out/bin/nextjs-counter-prepare
        '';
      };
    in {
      packages.${system}.default = pkgs.buildEnv {
        name = "course-toolchain";
        paths = [ nextjsCounterRuntime pkgs.nodejs_24 pkgs.python312 ];
        pathsToLink = [ "/bin" ];
      };
    };
}
