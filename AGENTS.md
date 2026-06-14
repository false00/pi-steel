# `@false00/pi-steel`

Fork of `@steel-experiments/pi-steel` — Steel browser automation extension for the Pi coding agent.

## Project structure

- `dist/` — compiled JavaScript output (entry: `dist/index.js`)
- `dist/tools/` — individual Steel tool implementations (screenshot, scrape, computer, navigate, click, etc.)
- Source is TypeScript compiled directly to `dist/` (no separate `src/` directory)

## Key conventions

- **Default export** in `dist/index.js` — the extension function registered with Pi
- **Tool naming** — all tools prefixed `steel_` (e.g. `steel_screenshot`, `steel_scrape`)
- **Session modes** — `agent` (default), `session`, `turn` — controlled via `STEEL_SESSION_MODE`
- **Config priority** — `.env` file > constructor params > env vars > Steel CLI config
- **Error handling** — tools use `withToolError()` wrapper for consistent error reporting
- **Read tool instructions** — all artifact paths in tool output are prefixed with an explicit instruction to use the Read tool (e.g. `Use the Read tool to view the image: /path`), and `steel_scrape` shows `[Output truncated. Read the full content with the Read tool: /path]` when the inline response is truncated.

## Documentation rules

- **Documentation must always match code.** When adding/changing a tool parameter, default value, output format, or behavior, update all of:
  1. The tool's `description` string in `dist/tools/<tool>.js`
  2. `README.md` — the changes section, tools table, and any relevant prose
  3. `AGENTS.md` — if the change affects how an agent should interact with the package

- **Verify before finishing.** After any code change, grep for stale references:
  - Old default values (`fullPage: true`, etc.)
  - Wrong file paths (`.artifacts/scrapes/`, etc.)
  - Outdated parameter names or descriptions

- **Tool descriptions are agent-facing documentation.** The `description` field on each tool is what the LLM sees. Keep them accurate and concise.

## Project quirks

- **No `tsconfig.json`** — This fork has no TypeScript source files; `dist/` JS is the source of truth. The `npm test` and `prepublishOnly` scripts reference `tsc -p tsconfig.json` which fails. Always use `npm publish --ignore-scripts` to skip the broken preflight.
- **`dist/` is committed** — Changes are made directly to the `.js` files in `dist/`. There is no `src/` or separate build step.

## Commit & publish policy

- **Never commit without explicit user approval.** Wait for the user to say "commit" or "stage and commit". Do not commit automatically.
- **Never push or publish without explicit user approval.**

### Publishing workflow

When the user asks to publish:

1. **Check the current npm version** in `package.json`
2. **Check the latest git tag** — should match `v{version}` format
3. **Verify the git tag matches the npm version.** If version was bumped, the tag must also be updated. If they don't match, create the tag:
   ```
   git tag v{version}
   ```
4. **Dry-run first:** `npm pack --dry-run` to verify the package contents include `dist/`, `AGENTS.md`, `README.md`, `LICENSE`
5. **Use `npm version patch|minor|major` to bump version** — this updates `package.json` and creates a matching git tag in one step. Do NOT edit `package.json` manually.
6. **Publish with `--ignore-scripts`** (the test/preflight scripts require a `tsconfig.json` that doesn't exist):
   ```
   npm publish --ignore-scripts
   ```
7. If 2FA is enabled, npm will prompt for browser authentication before completing.
8. **Increment the package version** if the scope of changes warrants it. Follow semver:
   - Patch (`0.1.15 → 0.1.16`) for bug fixes and minor doc changes
   - Minor (`0.1.15 → 0.2.0`) for new tools or behavioral changes
   - Major (`0.1.15 → 1.0.0`) for breaking changes
9. **Bump the package name** if the fork's direction diverges significantly from upstream or if ownership changes — but only if it genuinely makes sense to do so. Ask the user before renaming.
