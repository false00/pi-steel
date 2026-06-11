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

- **`steel_screenshot` now returns the file path in tool output** — the screenshot path is included in the visible text response so the LLM can use `read` on it to view the image. Upstream only included the path in `details` metadata that the LLM never sees.
- **`steel_screenshot` defaults to `fullPage: true`** — captures the entire page by default instead of just the viewport. Pass `fullPage: false` if you only need the viewport.
- **`steel_computer` now returns the screenshot path in tool output** — same fix as `steel_screenshot`. When a computer action captures a screenshot, the path is visible in the text response.
- **`steel_scrape` now saves full content to disk** — the full scraped content (before truncation) is written to `.artifacts/scrapes/` as a file. The file path is included in the visible text response, so the LLM can `read` the full content when the inline output is truncated.

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
| `steel_scrape` | Extract page content as text, markdown, or html (full content saved to `.artifacts/scrapes/` with path in output) |
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

Every `steel_scrape` call saves the full content to `.artifacts/scrapes/` and includes the file path in the tool output. If the inline response is truncated, the LLM can read the file to get the complete content.

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
- Steel authentication via either:
  - `STEEL_API_KEY`, or
  - `steel login` config in `~/.config/steel/config.json`

### Environment variables

**Connection**

| Variable | Purpose |
|----------|---------|
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

## Agent instructions

If you use Pi, add the following to `~/.pi/agent/AGENTS.md` to help the agent use Steel effectively:

```markdown
## Using the Steel fork

This agent uses `@false00/pi-steel` (fork of `@steel-experiments/pi-steel`).

Install:
```
pi install npm:@false00/pi-steel
```

Or for a single run:
```
pi -e npm:@false00/pi-steel "do something"
```

## How to read page content — use screenshots first

**Always start with `steel_screenshot`.** It captures the full page and you read the image inline. This is the most reliable way to understand what's on screen.

Fall back to text extraction only when the page is too long, you need structured data, or the screenshot has no readable text.

### 1. `steel_screenshot` (primary — try this first)

Captures a full-page screenshot by default. **The tool output includes the file path (e.g., `.artifacts/screenshots/steel-screenshot-xxx.png`). Use the `read` tool on that path to view the image** — you can read text, headlines, and UI directly from it.

Pass `fullPage: false` if you only need the viewport.

### 2. `steel_scrape` with explicit format (fallback for long pages)

Always specify the format:
- `steel_scrape format: "text"` — plain rendered text via `innerText`, best for articles
- `steel_scrape format: "markdown"` — use when headings, links, structure matter (search results, news listings)
- `steel_scrape format: "html"` — only for raw DOM debugging

If the output is truncated (shows `[truncated N chars]`), **read the file at the given `Path:` to get the full content** — the complete scrape is saved to `.artifacts/scrapes/`.

**Never call `steel_scrape` without specifying format.**

### 3. `steel_extract` with valid JSON Schema (best for structured data)

Schema must be proper JSON Schema:
```json
{
  "type": "object",
  "properties": {
    "headlines": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```

## Navigation & interaction

- `steel_navigate` — go to a URL
- `steel_click` — click elements (describe them, e.g. "the 'Accept All' button")
- `steel_type` — type into fields
- `steel_scroll` — scroll to load content
- `steel_get_url` / `steel_get_title` — check current page state
- `steel_pin_session` — keep browser alive across prompts

## Worked examples

- **"latest news"** → `steel_navigate` to a news site → `steel_screenshot` → `read` the returned file path to see headlines in the image → summarize.
- **"search for X"** → `steel_navigate` to google.com → `steel_type` the query → `steel_screenshot` → `read` the image to see results → `steel_click` on a result → `steel_screenshot` again → `read` to read the article.
- **"get all links"** → `steel_extract` with proper schema.
```

## Development

```bash
npm install
npm run build
npm test
```

Publish preflight:

```bash
npm pack --dry-run
```

The package manifest in `package.json` exposes the compiled extension entrypoint via `pi.extensions`, which lets Pi load the package root directly after install.

## License

MIT — same as upstream. Original work copyright (c) 2026 Steel (nibzard & Steel Experiments contributors).
