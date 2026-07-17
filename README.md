# @false00/pi-steel

[![npm version](https://img.shields.io/npm/v/@false00/pi-steel.svg)](https://www.npmjs.com/package/@false00/pi-steel)
[![license](https://img.shields.io/npm/l/@false00/pi-steel.svg)](LICENSE)
[![CI](https://github.com/false00/pi-steel/actions/workflows/ci.yml/badge.svg)](https://github.com/false00/pi-steel/actions/workflows/ci.yml)

Production-focused Steel browser automation for the Pi coding agent.

> Fork of [`@steel-experiments/pi-steel`](https://www.npmjs.com/package/@steel-experiments/pi-steel). Original credit belongs to nibzard and the Steel Experiments team.

`@false00/pi-steel` exposes **17 Pi tools** for browser navigation, screenshots, scraping, structured extraction, form interaction, low-level computer actions, and browser-session lifecycle control.

| Resource | Link |
|---|---|
| npm | [`@false00/pi-steel`](https://www.npmjs.com/package/@false00/pi-steel) |
| GitHub | [github.com/false00/pi-steel](https://github.com/false00/pi-steel) |
| License | [MIT](LICENSE) |
| Changelog | [CHANGELOG.md](CHANGELOG.md) |
| Security policy | [SECURITY.md](SECURITY.md) |
| Compatibility notes | [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md) |
| Examples | [docs/EXAMPLES.md](docs/EXAMPLES.md) |
| Troubleshooting | [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) |
| Contributing guide | [CONTRIBUTING.md](CONTRIBUTING.md) |

## Why this package

This fork is aimed at people who want Pi browsing to feel stable, readable, and operationally friendly instead of feeling like a thin demo wrapper.

What it emphasizes:

- **Pi-friendly output** — screenshot, scrape, PDF, and computer tools return artifact paths in plain tool output so agents can actually read them
- **Safer fresh installs** — missing Steel credentials no longer break extension loading; the package creates a template `~/.config/steel/.env` and tells the user what to update
- **Cleaner local state** — artifacts live under `~/.cache/.steel-browser/` instead of cluttering project directories
- **Session lifecycle control** — session-persistent browsing by default plus explicit pin/release tools and opt-in stricter cleanup modes
- **Publishable package hygiene** — CI, dependency review, vulnerability scanning, changelog, security policy, contributing guide, docs, and package tests

## Changes from upstream

This fork currently adds or changes the following behavior:

- **`.env` file support** — `~/.config/steel/.env` is read as the highest-priority config source for `api_key` and `base_url`
- **Fresh-install template creation** — if the file is missing, `pi-steel` creates a template and tells the user to update it
- **Lazy Steel initialization** — the extension loads even when credentials are missing; the failure is deferred until the first Steel tool call
- **Clearer error guidance** — configuration failures tell the user to update `~/.config/steel/.env` or run `steel login`
- **Session persistence by default** — when `STEEL_SESSION_MODE` is unset, Pi keeps the same Steel browser alive for the active Pi session
- **Fail-fast blank-page interaction errors** — selector-based tools report session continuity problems immediately instead of spending a full selector timeout on `about:blank`
- **Read-tool-friendly artifact paths** — screenshot, scrape, PDF, and computer outputs include explicit file paths in visible tool output
- **Full scrape persistence** — `steel_scrape` writes the complete content to disk before truncating inline output
- **Artifact directory relocation** — screenshots, scrapes, and PDFs are stored under `~/.cache/.steel-browser/`
- **`/clear_webcache` command** — deletes cached Steel artifacts from the local cache directory
- **Security workflows** — GitHub Actions now run production dependency audit, dependency review on pull requests, and CodeQL analysis

## Tool coverage

| Area | Tool count |
|---|---:|
| Navigation | 4 |
| Content extraction | 4 |
| Interaction | 7 |
| Session management | 2 |
| **Total** | **17** |

### Navigation

| Tool | Description |
|---|---|
| `steel_navigate` | Open a URL with normalization and retry logic |
| `steel_go_back` | Navigate back in browser history |
| `steel_get_url` | Read the current page URL |
| `steel_get_title` | Read the current page title |

### Content extraction

| Tool | Description |
|---|---|
| `steel_scrape` | Extract page content as text, markdown, or html |
| `steel_screenshot` | Capture a screenshot artifact |
| `steel_pdf` | Generate a PDF artifact |
| `steel_extract` | Extract structured data using a JSON schema |

### Interaction

| Tool | Description |
|---|---|
| `steel_click` | Click an element with captcha recovery |
| `steel_type` | Type text into a field |
| `steel_fill_form` | Fill multiple fields in one call |
| `steel_scroll` | Scroll the page or a nested container |
| `steel_find_elements` | Discover likely interactive elements |
| `steel_wait` | Wait for an element state |
| `steel_computer` | Low-level computer actions via Steel's cloud endpoint |

### Session management

| Tool | Description |
|---|---|
| `steel_pin_session` | Keep the browser session alive across prompts |
| `steel_release_session` | Close the browser and restore the default session mode |

## Install

Install into Pi as a package:

```bash
pi install npm:@false00/pi-steel
```

Use it for a single run:

```bash
pi -e npm:@false00/pi-steel
```

For local development from this repository:

```bash
pi --no-extensions -e .
```

If you already have `@false00/pi-steel` installed in Pi, `--no-extensions` prevents tool-name conflicts between the installed package and the repo-local copy.

## Quick start

After installing, configure Steel once and then ask Pi to browse in plain English.

### 1. Configure Steel

Create or update `~/.config/steel/.env`:

```env
api_key=your-steel-api-key
# base_url=https://your-selfhosted-steel-instance.example
```

Alternatively, run:

```bash
steel login
```

### 2. Start Pi

```bash
pi -e npm:@false00/pi-steel
```

By default, `pi-steel` keeps the same Steel browser session alive for the active Pi session, so cross-prompt browsing behaves more like a normal web browser.

### 3. Ask Pi to browse

```text
Go to hacker news and tell me the top story
Open the docs page and scrape it as markdown
Take a screenshot of the pricing page
Find the login button on the current page
```

## Fresh-install behavior

If Steel is not configured yet:

- the extension should still load
- `~/.config/steel/.env` is created automatically when missing
- the first Steel tool call returns an actionable configuration error instead of breaking the entire extension load

That means users should no longer hit this old startup failure mode on fresh installs:

```text
Failed to load extension ... STEEL_API_KEY is required ...
```

Instead, they should be told to update `~/.config/steel/.env` or run `steel login`.

## Configuration

### Requirements

- Node.js 20+
- A Pi runtime with extension support
- Steel authentication via one of:
  - `~/.config/steel/.env`
  - `STEEL_API_KEY`
  - `steel login` config in `~/.config/steel/config.json`
  - a self-hosted Steel `base_url`

### Configuration priority

1. `~/.config/steel/.env`
2. Constructor options when embedding the client directly
3. Environment variables
4. Steel CLI config

### Environment variables

**Connection**

| Variable | Purpose |
|---|---|
| `STEEL_API_KEY` | Steel API key |
| `STEEL_BASE_URL` | Steel API base URL |
| `STEEL_BROWSER_API_URL` | Browser API endpoint |
| `STEEL_LOCAL_API_URL` | Local Steel instance URL |
| `STEEL_API_URL` | Alternative API URL |
| `STEEL_CONFIG_DIR` | Custom Steel config directory |

**Session**

| Variable | Purpose |
|---|---|
| `STEEL_SESSION_MODE` | Lifecycle mode: `agent`, `session`, or `turn` |
| `STEEL_SESSION_TIMEOUT_MS` | Session timeout |
| `STEEL_SESSION_HEADLESS` | Run browser headless |
| `STEEL_SESSION_REGION` | Browser region |
| `STEEL_SESSION_PROFILE_ID` | Persistent browser profile |
| `STEEL_SESSION_PERSIST_PROFILE` | Save profile changes |
| `STEEL_SESSION_CREDENTIALS` | Session credentials |
| `STEEL_SESSION_NAMESPACE` | Session namespace |

**Proxy**

| Variable | Purpose |
|---|---|
| `STEEL_USE_PROXY` | Enable proxy |
| `STEEL_PROXY_URL` | Proxy URL |

**Captcha**

| Variable | Purpose |
|---|---|
| `STEEL_SOLVE_CAPTCHA` | Enable captcha solving |
| `STEEL_CAPTCHA_MAX_RETRIES` | Max captcha retry attempts |
| `STEEL_CAPTCHA_WAIT_MS` | Captcha solve wait time |
| `STEEL_CAPTCHA_POLL_INTERVAL_MS` | Captcha poll interval |

**Tools**

| Variable | Purpose |
|---|---|
| `STEEL_TOOL_TIMEOUT_MS` | Default tool timeout |
| `STEEL_NAVIGATE_RETRY_COUNT` | Navigation retry attempts |

## Session modes

| Mode | Behavior |
|---|---|
| `session` (default) | Session stays alive until Pi switches or shuts down |
| `agent` | One session per Pi prompt, closed after `agent_end` |
| `turn` | Session closes after each Pi turn |

Selector-based interaction tools operate on the current browser page only. With the default `session` mode, Pi should usually keep the same browser alive across prompts. If you explicitly switch to `agent` or `turn` and the current URL becomes `about:blank`, tools such as `steel_click` should tell you to navigate first or re-enable persistence.

Set the mode with an environment variable only when you want stricter cleanup semantics than the default:

```bash
STEEL_SESSION_MODE=agent pi -e npm:@false00/pi-steel
```

You can also switch persistence at runtime with `steel_pin_session` and `steel_release_session`. `steel_pin_session` is mainly useful when you started Pi in `agent` or `turn` mode and want to promote the active browser to session persistence without restarting.

## Runtime behavior

### Output model

- `steel_scrape` defaults to `text`
- ask for `markdown` when headings, lists, or links matter
- ask for `html` only when raw DOM markup is actually needed
- full scrape output is always written to disk before inline truncation
- screenshot, scrape, PDF, and computer outputs include artifact paths in visible tool output

### Error model

- tool failures are thrown back to Pi as real tool errors
- configuration errors are classified separately and include `.env` / `steel login` guidance
- already-classified errors are preserved instead of being wrapped repeatedly

## Operational docs

For setup help and examples, see:

- [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md)
- [docs/EXAMPLES.md](docs/EXAMPLES.md)
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

## Repository layout

```text
dist/                     Runtime extension code committed directly to the repo
  index.js                Pi extension entrypoint
  steel-client.js         Steel client and session lifecycle logic
  tools/                  Individual tool definitions

docs/                     Compatibility notes, examples, troubleshooting
.github/                  GitHub workflow directory
.github/workflows/        CI, dependency review, and CodeQL security workflows

tests/                    Smoke, runtime, and package-structure tests

README.md                 User-facing package documentation
AGENTS.md                 Maintainer and agent instructions
CONTRIBUTING.md           Contributor workflow
SECURITY.md               Security and disclosure policy
CHANGELOG.md              Release history
```

## Development

```bash
npm install
npm test
npm run test:smoke
npm run test:runtime
npm run test:package
npm pack --dry-run
```

### Build note

This fork treats `dist/` as the source of truth. There is no separate TypeScript build step required for normal development or publishing.

## Publishing

```bash
npm test
npm pack --dry-run
npm publish --ignore-scripts
```

Versioning and release-discipline notes live in [AGENTS.md](AGENTS.md).

## Support and feedback

When reporting problems, include:

- package version
- Pi version
- Node.js version
- tool name
- whether you are using Steel cloud or a self-hosted base URL
- the relevant error message

## License

MIT — see [LICENSE](LICENSE).
