# Compatibility notes

Verified from this repository after the current hardening pass:

| Component | Verified value |
|---|---|
| Node.js | `>=20` |
| Local test runner | Node built-in `node:test` |
| `playwright-core` | `^1.61.0` |
| `steel-sdk` | `^0.18.0` |

## Notes

- This fork treats `dist/` as the runtime source of truth.
- There is no TypeScript build step required to use or publish the package.
- `npm test` validates runtime/package behavior without requiring live Steel credentials.
- Live browsing still requires Steel credentials or a self-hosted Steel base URL.

## Fresh-install compatibility behavior

On a fresh install with no Steel credentials configured:

- the extension should still load
- a template `~/.config/steel/.env` file should be created if it does not already exist
- the first Steel tool call should fail with actionable guidance telling the user to update that file or run `steel login`

That behavior is intentional and covered by tests.
