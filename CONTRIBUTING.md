# Contributing to `@false00/pi-steel`

Thanks for contributing.

This package gives Pi browser automation capabilities through Steel, so correctness, clear errors, and accurate documentation matter more than clever abstractions.

## Principles

- Prefer predictable runtime behavior over hidden magic
- Keep docs aligned with shipped code
- Do not guess about Steel SDK or Pi runtime behavior
- Treat startup, auth, and session lifecycle changes as user-facing changes
- Keep tool descriptions concise and accurate because agents read them directly

## Repository layout

```text
dist/        Runtime source of truth committed directly to the repo
docs/        Compatibility notes, examples, and troubleshooting
tests/       Smoke, runtime, and package-structure checks
.github/     CI workflow
README.md    User-facing package documentation
AGENTS.md    Maintainer / agent operating guide
SECURITY.md  Vulnerability reporting and security expectations
```

## Local development

Requirements:

- Node.js 20+
- A Steel account or self-hosted Steel deployment if you want to run live browser flows

Install dependencies:

```bash
npm install
```

When testing the local extension in Pi, prefer:

```bash
pi --no-extensions -e .
```

This avoids tool conflicts if you also have the published package installed in your normal Pi config.

Run the full suite:

```bash
npm test
```

Run individual suites:

```bash
npm run test:smoke
npm run test:runtime
npm run test:package
```

## Change checklist

Before handing work off or opening a PR:

1. Update runtime code in `dist/`
2. Update relevant tool descriptions in `dist/tools/*.js` when behavior changes
3. Update `README.md` for any user-visible change
4. Update `AGENTS.md` if maintainer or agent guidance changed
5. Update or add tests
6. Run `npm test`
7. Run `npm pack --dry-run` if packaging or published files changed

## Testing philosophy

This repo keeps tests lightweight and focused on shipped behavior:

- **Smoke tests** verify the extension loads and registers cleanly
- **Runtime tests** verify configuration failures are deferred until tool use and return actionable guidance
- **Package tests** verify metadata, published-file intent, and dependency posture

## Documentation style

Keep docs:

- operationally useful
- honest about limitations
- aligned with actual behavior
- specific about file paths, commands, and environment variables

## Security

Please read [SECURITY.md](SECURITY.md) before reporting vulnerabilities or changing auth, config, or browser-session behavior.

## Release policy

Do not commit, push, or publish from agent sessions unless the user explicitly asks for it.
