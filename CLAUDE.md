# Agent Environment

## Pre-installed Tools
- `gcc-wrapper`
- `gnumake`
- `pkg-config-wrapper`
- `direnv`
- `nix-direnv`
- `nil`
- `nixpkgs-fmt`
- `nodejs`
- `pnpm`
- `bun`
- `wget`
- `unzip`
- `file`
- `tree`
- `gh`
- `just`
- `tmux`
- `openssh`
- `xdg-utils`
- `curl`
- `jq`
- `python3`
- `chromium`
- `ripgrep`
- `fd`
- `uv`
- `git`
- `gemini-cli-bin`
- `jules`
- `zlib`
- `gcc`

## nix-ld Native Libraries (available to unpatched binaries)
- `gcc`
- `zlib`
- `fuse`
- `icu4c`
- `nss`
- `openssl`
- `curl`
- `expat`
- `at-spi2-core`
- `at-spi2-core`
- `dbus`
- `libdrm`
- `mesa`
- `libxkbcommon`
- `libx11`
- `libxcomposite`
- `libxdamage`
- `libxext`
- `libxfixes`
- `libxrandr`
- `libxcb`
- `gtk+3`
- `pango`
- `cairo`
- `alsa-lib`
- `cups`
- `libglvnd`

## Runtime Capabilities
- GitHub namespace: peanutbutterbulk (git@github.com)
- Local Forgejo: forgejo@192.168.200.1:2223
- When hosting locally use ports 11420—11425
- `sudo` — full NOPASSWD root access
- `nix flakes` and `nix-command` enabled 
- `nix-ld` enabled — pip wheels and pre-compiled binaries work without patching
- nix build sandbox disabled — `nix build` / `nix develop` work inside container
- `direnv` + `nix-direnv` — drop `.envrc` for per-project shells
- `uv` — prefer over pip for Python deps
## When to Stop and Ask

Stop, commit whatever is in a working state, and surface the question if:

- A requirement is ambiguous enough that two reasonable interpretations lead to different interfaces
- Completing the task requires modifying files outside the current package

## Definition of Done

- All tests pass — skipped tests do not count
- PR description explains *why* the change exists, not just what it does

## Commit Discipline

- One logical change per commit
- Branch for anything touching a public interface or crossing package boundaries; push directly to main for contained changes

## Testing

TDD for any module where the interface is defined before implementation. Test-After only for exploratory spikes intended to be refactored or discarded. Spikes promoted to production code require tests before promotion is complete.

Integration tests are expected alongside unit tests for anything crossing a process or I/O boundary.

## Comments

Every file opens with 2–5 lines explaining its purpose and, if non-obvious, why it exists as a separate unit. Inline comments for non-obvious choices only.

## Error Handling

Defensive. Prefer returning structured errors over exceptions for expected failure modes. Log with enough context to reproduce the failure.

