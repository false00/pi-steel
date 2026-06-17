# Changelog

All notable changes to `@false00/pi-steel` are documented here.

## 0.2.0 - 2026-06-17

### Added
- `SECURITY.md`, `CONTRIBUTING.md`, and operator docs under `docs/`
- Smoke, runtime, and package tests under `tests/`
- GitHub CI workflow for install, test, and pack verification

### Changed
- Package metadata now includes homepage, bugs URL, publish config, docs/test directories, and expanded published files
- README was rewritten with badges, support docs, stability guidance, and clearer configuration/setup instructions
- `npm test` now runs a real test suite; `prepublishOnly` now validates the package with tests plus `npm pack --dry-run`
- Bundled `.d.ts` files now use local Pi-compatible type shims instead of requiring the Pi runtime package as an installed npm dependency
- Steel client initialization is now lazy, so a missing API key no longer prevents the extension from loading
- First-time installs now auto-create a `~/.config/steel/.env` template and return actionable guidance telling the user to update it
- Tool error handling now preserves already-classified errors instead of double-wrapping them

### Security
- Updated dependency metadata and lockfile to remove vulnerable Pi runtime npm dependencies from the local install tree
- Updated `playwright-core` and `steel-sdk`
- Forced safe transitive versions for vulnerable packages via `overrides`

## 0.1.18 - 2026-06-16

- Previous release before the packaging, startup, test, and documentation hardening in the current unreleased work.
