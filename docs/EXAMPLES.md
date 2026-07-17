# Example prompts

Common things to ask Pi after installing `@false00/pi-steel`:

```text
Go to https://news.ycombinator.com and tell me the top story
Search Google for Steel browser automation pricing and summarize the pricing page
Open github.com and capture a screenshot of the home page
Navigate to a docs page and scrape it as markdown
Find the login button on the page
Fill the email and password fields, but stop before submitting
Scroll the results pane on Google Maps
Keep using the same browser in the next prompt
Release the Steel session when you're done
```

## Example setup flow

1. Install the package:

```bash
pi install npm:@false00/pi-steel
```

2. Add credentials to `~/.config/steel/.env`:

```env
api_key=your-steel-api-key
# base_url=https://your-selfhosted-steel-instance.example
```

3. Start Pi and use the package:

```bash
pi -e npm:@false00/pi-steel
```

The default runtime mode is `session`, so the browser should stay alive across prompts unless you explicitly opt into `agent` or `turn`.

## Useful prompt patterns

### Readable scraping

```text
Go to example.com/docs and scrape the page as markdown
```

### Structured extraction

```text
Open the pricing page and extract plan names, monthly prices, and key limits into structured JSON
```

### Screenshot-first browsing

```text
Open the page, take a screenshot, and then summarize what is visible
```

### Session persistence

```text
Log into the site and keep using the same browser in the next prompt
```

If you explicitly launched Pi with `STEEL_SESSION_MODE=agent` or `STEEL_SESSION_MODE=turn`, ask Pi to run `steel_pin_session` before the next prompt.
