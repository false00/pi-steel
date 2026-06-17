# Security policy

`@false00/pi-steel` is a browser automation package for the Pi coding agent. It can navigate to arbitrary sites, capture page contents, and interact with remote browser sessions through Steel.

## Supported security posture

We aim to keep the package:

- explicit about configuration requirements
- conservative with session lifecycle behavior
- transparent about missing or invalid credentials
- free of hard-coded secrets and surprise filesystem writes outside documented cache/config paths

## Reporting a vulnerability

If you find a security issue, report it privately to the maintainer before opening a public issue.

Current maintainer contact from `package.json`:

- `false00 <jortega@curl.red>`

Please include:

- package version
- affected tool name or file path
- reproduction steps
- impact assessment
- whether the issue involves secrets, browser session leakage, unintended filesystem writes, or broken isolation between sessions

## Scope

Security-sensitive areas include:

- Steel API key and `.env` handling
- session creation, pinning, reuse, and teardown
- browser connect URLs and viewer URLs
- artifact persistence under `~/.cache/.steel-browser/`
- any behavior that can cause Pi to misread a failure as success
- extension startup behavior on fresh installs

## Secrets handling expectations

- Never commit real Steel API keys, browser session URLs, or authenticated cookies
- Keep `~/.config/steel/.env` out of version control
- Prefer `steel login` or a local config file over embedding secrets in commands or prompts
- Restrict permissions on local config files when practical

## Operational guidance

For production or daily-driver use:

- confirm whether you are targeting Steel cloud or a self-hosted base URL
- review prompts before approving broad browsing or click automation
- clear cached artifacts when handling sensitive browsing tasks
- validate custom base URLs carefully

## Disclosure expectations

Please allow time for investigation and a fix before public disclosure, especially for issues involving:

- secret leakage
- session hijacking or session persistence bugs
- unsafe fresh-install behavior
- arbitrary file overwrite behavior
- package-install or extension-loading trust issues
