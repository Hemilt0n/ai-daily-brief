# AI Daily Brief

A daily AI news digest that publishes to GitHub Pages at 8:00 AM China time.

## How it works
- GitHub Actions runs on a schedule
- Fetches AI news sources via RSS
- Generates a daily markdown + HTML page
- Publishes via GitHub Pages (docs/)

## Setup
1. Add secrets in GitHub repo settings:
   - `OPENAI_API_KEY` (optional; if omitted, summaries use RSS descriptions)
2. Enable GitHub Pages:
   - Settings → Pages → Source: **Deploy from a branch** → Branch: **main** → Folder: **/docs**

## Run locally
```bash
npm install
npm run generate
```

## Sources (editable)
Edit `sources.json` to customize feeds.
