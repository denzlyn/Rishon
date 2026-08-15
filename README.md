# Rewrite

A single-page app that rewrites pasted text in your own writing style. Paste text, hit "Rewrite," compare the original and the rewrite side by side.

React + Vite + Tailwind on the frontend, one Netlify function calling the Anthropic API on the backend. No login, no database, no history - it's a single-purpose tool.

## Local setup

```bash
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
```

Run it with the Netlify CLI so the function works locally too (plain `vite dev` won't serve `/api/rewrite`):

```bash
npx netlify dev
```

## Deploying to Netlify

1. Push this repo to GitHub.
2. Go to [netlify.com](https://netlify.com) → "Add new site" → "Import an existing project" → connect the repo.
3. Build command: `npm run build`. Publish directory: `dist`. Netlify auto-detects the function in `netlify/functions/`.
4. In Site settings → Environment variables, add `ANTHROPIC_API_KEY` with your real key.
5. Deploy.

## Notes

- The style rules live in `netlify/functions/rewrite.js` as the system prompt. Edit them there if you want to change how it rewrites.
- The function calls the `claude-sonnet-4-6` model. If Anthropic ever returns a "model not found" error, open `netlify/functions/rewrite.js` and swap the `MODEL` constant for a currently valid model id.
- Nothing is stored anywhere. Refreshing the page clears both boxes.
