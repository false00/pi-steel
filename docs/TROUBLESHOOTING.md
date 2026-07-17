# Troubleshooting

## Fresh install: missing `STEEL_API_KEY`

Old behavior could fail while loading the extension itself with an error like:

```text
Failed to load extension ... SteelClient initialization: Validation failed. STEEL_API_KEY is required...
```

Current behavior is different by design:

- the extension should still load
- `~/.config/steel/.env` should be created automatically if missing
- the first Steel tool call should return a configuration error that tells you to update that file or run `steel login`

Recommended fix:

1. Open `~/.config/steel/.env`
2. Set your API key:

```env
api_key=your-steel-api-key
```

3. If you use self-hosted Steel, also set:

```env
base_url=https://your-selfhosted-steel-instance.example
```

4. Retry the tool call

## Invalid base URL

If you see an error about the Steel base URL, make sure:

- the URL uses `http` or `https`
- it does not include a trailing `/v1` unless that is the only form you have; `pi-steel` will normalize CLI-style URLs when possible

## Session or navigation failures

`pi-steel` now defaults to session persistence across prompts. If a selector-based interaction tool still fails on `about:blank`, Pi likely switched sessions, restarted the browser, or was explicitly started in `agent` or `turn` mode. Navigate again in the same prompt, or re-enable persistence with `steel_pin_session` or `STEEL_SESSION_MODE=session`.

Try, in order:

1. Retry once
2. Narrow the target page or selector
3. Increase relevant timeout environment variables
4. Release and recreate the Steel session
5. Confirm your Steel account, region, proxy, or self-hosted endpoint is healthy

## Artifact cleanup

Use the slash command below to remove cached screenshots, scrapes, and PDFs:

```text
/clear_webcache
```

## Self-hosted `steel_computer`

`steel_computer` requires Steel's cloud computer-actions endpoint. Self-hosted deployments do not support it.
