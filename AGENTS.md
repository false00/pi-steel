# `@false00/pi-steel`

Fork of `@steel-experiments/pi-steel` — Steel browser automation extension for the Pi coding agent.

## Project structure

- `dist/` — runtime source of truth (entry: `dist/index.js`)
- `dist/tools/` — individual Steel tool implementations
- `dist/pi-types.d.ts` — local Pi-compatible type shims used by the published `.d.ts` files
- `docs/` — compatibility notes, examples, troubleshooting
- `tests/` — smoke, runtime, and package-structure checks
- `.github/workflows/ci.yml` — install, audit, test, pack verification, and dependency review
- `.github/workflows/security.yml` — CodeQL vulnerability scanning

## Key conventions

- **Default export** in `dist/index.js` — the extension function registered with Pi
- **Tool naming** — all tools use the `steel_` prefix
- **Session modes** — `session` (default), `agent`, `turn` — controlled via `STEEL_SESSION_MODE`
- **Fresh-session interaction guard** — selector-based interaction tools should fail fast on `about:blank` and tell the user to navigate first or enable persistence with `steel_pin_session` or `STEEL_SESSION_MODE=session`
- **Config priority** — `.env` file > constructor params > env vars > Steel CLI config
- **Lazy Steel initialization** — missing credentials must not break extension loading; configuration errors should happen on first Steel tool use instead
- **Fresh-install UX** — if `~/.config/steel/.env` is missing, create a template and tell the user to update it or run `steel login`
- **Error handling** — tools use `withToolError()` and should preserve already-classified errors instead of double-wrapping them
- **Artifact visibility** — user-visible tool output must include artifact paths for screenshots, scrapes, PDFs, and computer screenshots
- **Security automation** — CI runs `npm audit --omit=dev --audit-level=high`; pull requests run dependency review; CodeQL scans the JavaScript runtime code

## Documentation rules

Documentation must always match code.

When changing a tool parameter, default, output format, runtime behavior, or setup expectation, update all relevant places:

1. the tool `description` in `dist/tools/<tool>.js`
2. `README.md`
3. `AGENTS.md`
4. docs under `docs/` when the change affects setup, examples, compatibility, or troubleshooting
5. tests when the behavior is observable

## Testing rules

Before finishing runtime or packaging changes, run:

```bash
npm test
```

Useful focused suites:

```bash
npm run test:smoke
npm run test:runtime
npm run test:package
```

### What the tests are expected to cover

- **Smoke** — extension loads, registers tools, and creates a config template on fresh installs
- **Runtime** — missing credentials are deferred to tool execution and include actionable `.env` guidance
- **Package** — metadata, published files, and dependency posture stay aligned with the repository policy

## Project quirks

- **`dist/` is committed** — edit the JavaScript in `dist/` directly
- **No separate build pipeline** — this fork treats `dist/` as the source of truth
- **Published typings are local** — the package should not require the Pi runtime npm package just to resolve `.d.ts` files

## Verification checklist

After code changes, grep for stale references such as:

- old default values
- outdated file paths like legacy `.artifacts/` locations
- old startup behavior that still claims missing `STEEL_API_KEY` should fail extension load
- outdated references to external Pi runtime type packages in `dist/*.d.ts`

## Commit & publish policy

- **Never commit without explicit user approval.**
- **Never push or publish without explicit user approval.**

### Publishing workflow

When the user asks to publish:

1. Check the current npm version in `package.json`
2. Check the latest git tag — it should match `v{version}`
3. If needed, create the matching tag:
   ```bash
   git tag v{version}
   ```
4. Run:
   ```bash
   npm test
   npm pack --dry-run
   ```
5. Bump the version with `npm version patch|minor|major`
6. Publish with:
   ```bash
   npm publish --ignore-scripts
   ```
7. If 2FA is enabled, complete npm's browser authentication flow

### Semver guidance

- **Patch** for bug fixes, dependency hardening, doc fixes, and non-breaking setup/runtime improvements
- **Minor** for new tools or meaningful behavior additions
- **Major** for breaking changes to tool names, parameters, outputs, or expected runtime behavior
