# @false00/pi-steel

> Fork of [`@steel-experiments/pi-steel`](https://pi.dev/packages/@steel-experiments/pi-steel) by [nibzard](https://pi.dev/nibzard) and the Steel Experiments team. All credit for the original work belongs to them.

| | Upstream | This fork |
|---|---|---|
| npm | [`@steel-experiments/pi-steel`](https://www.npmjs.com/package/@steel-experiments/pi-steel) | [`@false00/pi-steel`](https://www.npmjs.com/package/@false00/pi-steel) |
| GitHub | [github.com/steel-dev/pi-steel](https://github.com/steel-dev/pi-steel) | [github.com/false00/pi-steel](https://github.com/false00/pi-steel) |
| Pi registry | [`@steel-experiments/pi-steel`](https://pi.dev/packages/@steel-experiments/pi-steel) | — |

[Steel](https://steel.dev) browser automation tools for the [Pi](https://github.com/badlogic/pi-mono) coding agent.

This package publishes the Steel extension as a reusable Pi package so it can be installed directly into Pi or consumed by other runtimes such as Takopi-based wrappers.

## Changes from upstream

- **`.env` file support** — `~/.config/steel/.env` is read as the highest-priority config source for `api_key` and `base_url`. Auto-created on first run with discovered values so you don't have to set env vars every time.
- **Tool output paths with explicit Read tool instructions** — `steel_screenshot`, `steel_computer`, and `steel_scrape` all append the file path with an explicit instruction to use the Read tool (e.g. `Use the Read tool to view the image: /path/to/file`). Upstream hid these paths in `details` metadata that the agent never sees.
- **`steel_scrape` saves full content to disk** — the untruncated scraped content is written to `~/.cache/.steel-browser/scrapes/` before the inline output is trimmed. When the response shows `[truncated N chars]`, the output includes `[Output truncated. Read the full content with the Read tool: /path/to/file]`.
- **`steel_computer` requires a paid Steel plan** — the computer actions endpoint (`/v1/sessions/{id}/computer`) is only available on Steel's cloud plan. Self-hosted instances do not support it. The tool will return a clear error explaining this.
- **Artifact directories moved** — screenshots and PDFs are saved under `~/.cache/.steel-browser/` instead of `$CWD/.artifacts/`, keeping build artifacts out of project directories.
- **`/clear_webcache` command** — a slash command that deletes all cached artifacts (screenshots, scrapes, PDFs) from `~/.cache/.steel-browser/`. Shows a notification with the count of deleted files.

## Quick start

```bash
pi install npm:@false00/pi-steel
```

Then just ask Pi to browse:

```
> Go to hacker news and find the top story
```

Pi will use `steel_navigate` to open the page, `steel_screenshot`/`steel_scrape` to read the content, and return what it finds. All session management happens automatically.

## Tools

### Navigation

| Tool | Description |
|------|-------------|
| `steel_navigate` | Open a URL with automatic scheme normalization and retry logic |
| `steel_go_back` | Navigate back in browser history |
| `steel_get_url` | Read the current page URL |
| `steel_get_title` | Read the current page title |

### Content extraction

| Tool | Description |
|------|-------------|
| `steel_scrape` | Extract page content as text, markdown, or html (full content saved to disk with path in output) |
| `steel_screenshot` | Capture a screenshot artifact (path in output) |
| `steel_pdf` | Generate a PDF artifact |
| `steel_extract` | Extract structured data using a JSON schema |

### Interaction

| Tool | Description |
|------|-------------|
| `steel_click` | Click an element with captcha recovery |
| `steel_type` | Type text into a field |
| `steel_fill_form` | Fill multiple form fields at once |
| `steel_scroll` | Scroll the page or a nested container |
| `steel_find_elements` | Find interactive elements by selector |
| `steel_wait` | Wait for an element to appear |
| `steel_computer` | Low-level computer action with screenshot (path in output) |

### Session management

| Tool | Description |
|------|-------------|
| `steel_pin_session` | Keep the browser session alive across prompts |
| `steel_release_session` | Close the browser and reset to default session mode |

`steel_scrape` defaults to `text`. Ask for `markdown` when headings, lists, and links matter. Ask for `html` only when raw DOM markup is actually needed.

Every `steel_scrape` call saves the full content to `~/.cache/.steel-browser/scrapes/` and includes the file path in the tool output. If the inline response is truncated, the output includes an explicit instruction to use the Read tool to view the full content.

`steel_scroll` can scroll the page or a nested container. For apps like Google Maps, pass a selector for the results pane instead of relying on window scrolling.

## Install

Install into Pi as a package:

```bash
pi install npm:@false00/pi-steel
```

Or load it for a single run:

```bash
pi -e npm:@false00/pi-steel
```

For local development from this repo:

```bash
pi -e .
```

## Session modes

Steel sessions have a lifecycle tied to how Pi uses them. The default works for most cases, but you can tune it:

| Mode | Behavior |
|------|----------|
| `agent` (default) | One session per Pi prompt, closed after `agent_end` |
| `session` | Session stays alive until Pi switches or shuts down |
| `turn` | Session closed after each Pi turn — aggressive, can break multi-step workflows |

Set the mode via environment variable:

```bash
STEEL_SESSION_MODE=session pi -e npm:@false00/pi-steel
```

You can also change session persistence at runtime with `steel_pin_session` and `steel_release_session`.

## Configuration

### Required

- Node.js 20+
- A Pi runtime that supports extensions
- Steel authentication via one of:
  - `.env` file in `~/.config/steel/` (highest priority), or
  - `STEEL_API_KEY`, or
  - `steel login` config in `~/.config/steel/config.json`

You can also create a `~/.config/steel/.env` file to set your API key and base URL:

```env
api_key=your-steel-api-key
base_url=https://your-selfhosted-steel-instance.com
```

Values in this file take precedence over all other configuration sources, including environment variables and constructor parameters.

### Environment variables

**Connection**

| Variable | Purpose |
|----------|---------|
| `~/.config/steel/.env` | `api_key` and `base_url` values (highest priority) |
| `STEEL_BASE_URL` | Steel API base URL |
| `STEEL_BROWSER_API_URL` | Browser API endpoint |
| `STEEL_LOCAL_API_URL` | Local Steel instance URL |
| `STEEL_API_URL` | Alternative API URL |
| `STEEL_CONFIG_DIR` | Custom config directory |

**Session**

| Variable | Purpose |
|----------|---------|
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
|----------|---------|
| `STEEL_USE_PROXY` | Enable proxy |
| `STEEL_PROXY_URL` | Proxy URL |

**Captcha**

| Variable | Purpose |
|----------|---------|
| `STEEL_SOLVE_CAPTCHA` | Enable captcha solving |
| `STEEL_CAPTCHA_MAX_RETRIES` | Max captcha retry attempts |
| `STEEL_CAPTCHA_WAIT_MS` | Captcha solve wait time |
| `STEEL_CAPTCHA_POLL_INTERVAL_MS` | Captcha poll interval |

**Tools**

| Variable | Purpose |
|----------|---------|
| `STEEL_TOOL_TIMEOUT_MS` | Default tool timeout |
| `STEEL_NAVIGATE_RETRY_COUNT` | Navigation retry attempts |

`pi-steel` reads Steel CLI config for auth and local API resolution, and it normalizes CLI-style API URLs such as `http://localhost:3000/v1` to the SDK-compatible base URL form.

## Development

```bash
npm install
npm run build   # requires tsconfig.json — only if you have TS source
npm test        # requires tsconfig.json — may not work in this fork
```

### Publishing

This fork's `dist/` is the source of truth (no TS source files). The `npm test` and `prepublishOnly` scripts require a `tsconfig.json` that doesn't exist in this repo, so publish with `--ignore-scripts`.

```bash
# 1. Bump version and create git tag
npm version patch   # or minor / major

# 2. Verify package contents
npm pack --dry-run

# 3. Publish (skips broken prepublishOnly script)
npm publish --ignore-scripts
```

If 2FA is enabled, npm will prompt you to authenticate in the browser before publishing.

The package manifest in `package.json` exposes the compiled extension entrypoint via `pi.extensions`, which lets Pi load the package root directly after install.

## License

MIT — same as upstream. Original work copyright (c) 2026 Steel (nibzard & Steel Experiments contributors).
