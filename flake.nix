{
  description = "Dating texting assistant dev shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = nixpkgs.legacyPackages.${system}; in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_20
            nodePackages.npm
            prisma-engines
            openssl
            docker-compose  # for container testing layer
          ];

          env = {
            # Prisma looks for engines via this; nix provides them
            PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING = "1";
            PRISMA_QUERY_ENGINE_LIBRARY =
              "${pkgs.prisma-engines}/lib/libquery_engine.node";
            PRISMA_QUERY_ENGINE_BINARY =
              "${pkgs.prisma-engines}/bin/query-engine";
            PRISMA_SCHEMA_ENGINE_BINARY =
              "${pkgs.prisma-engines}/bin/schema-engine";
          };
        };
      });
}
