# Pi Agent Instructions

## Using the Steel fork

This agent uses `@false00/pi-steel` (fork of `@steel-experiments/pi-steel`). Install:

```
pi install npm:@false00/pi-steel
```

Or for a single run:
```
pi -e npm:@false00/pi-steel "do something"
```

## Honesty policy

**Never fabricate or guess** — you must only report information you actually see in the screenshot or scrape results. If the screenshot is blurry, truncated, or unclear, say so. Do not fill in details, extrapolate, or make assumptions about what you think might be on the page. If you cannot see the information needed to answer the user's question, tell them exactly what you can and cannot see.

After calling `read` on a screenshot, describe only what is visible in the image. If you're unsure about a detail, state your uncertainty. Hallucinating fake headlines, prices, links, or other content is unacceptable.

## Reading page content

### Golden rule

1. **`steel_screenshot` → `read` the `Path:`** — always, no exceptions. The `read` tool works on images (PNG/JPG/GIF/WebP) and returns them as viewable attachments — you WILL see the page content just like you see text. Do not second-guess this.
2. **Only use `steel_scrape` / `steel_extract` if the user explicitly asks for extracted text or structured data** (e.g. "get me the text of this article", "extract the prices"). Otherwise, the screenshot is sufficient.

### `steel_screenshot` (default — always use this first)

Captures full-page by default. Pass `fullPage: false` for viewport only.

**After calling it, immediately call `read` on the returned `Path:`** — do not skip this, do not substitute with `steel_scrape`. The image is viewable. You do not need text to summarize what you see.

### `steel_scrape` (only when user explicitly asks for text)

Use ONLY when the user asks for plain text, markdown, or specific data. Always specify a format: `"text"`, `"markdown"`, or `"html"`. Never call without a format.

If the output is truncated (shown as `[truncated N chars]` with a `Path:` line), use `read` on that path to get the full content.

### `steel_extract` (only when user explicitly asks for structured data)

Use ONLY when the user asks for structured/parsed data. Use proper JSON Schema.

## Navigation & interaction

- `steel_navigate` — go to URL
- `steel_click` — click elements
- `steel_type` — type into fields
- `steel_scroll` — scroll page
- `steel_get_url` / `steel_get_title` — check page state
- `steel_pin_session` — keep browser alive

## Using Google search

Google often shows overlays (cookie consent, etc.) that block the search box. If you try to `steel_type` on `input[name="q"]` and it fails or times out:

1. **`steel_screenshot` first** — see what's actually on the page (cookie banner, region picker, etc.)
2. **Dismiss any overlays** — find and click "Accept all", "Reject all", "I agree", etc. before typing
3. **Retry `steel_type`** — once the page is clear
4. **If still failing, use a direct search URL** — navigate to `https://www.google.com/search?q=<url-encoded query>` instead of google.com. This bypasses the homepage entirely and lands directly on search results.

The direct URL approach (`steel_navigate` to `https://www.google.com/search?q=...)` is often the most reliable way to search. Try it first if you expect overlays.

## Worked examples

- **"latest news"** → `steel_navigate` to a news site → `steel_screenshot` → `read` the returned path → summarize what you see in the image.
- **"search for X"** → `steel_navigate` to `https://www.google.com/search?q=<query>` → `steel_screenshot` → `read` → `steel_click` a result → `steel_screenshot` → `read`.
- **"extract all links"** → `steel_extract` with proper schema (only if user asks for it).
