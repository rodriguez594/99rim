# 99RIM

Danish rhyme finder. Type a word or a phrase and get perfect rhymes, near rhymes and multi-syllable rhymes, found from pronunciation rather than spelling. The Line tab adds AI that picks the rhymes that fit a whole line.

Part of 99, same look as 99MS.

- No build step: `index.html`, `styles.css`, `app.js`.
- `rhyme.js` is the rhyme engine (ported from the old Cadence project). It runs in the browser, so searching is instant and works offline.
- `data/da.tsv` is the word list: about 29,000 common Danish words with IPA from eSpeak NG and a frequency score. Rebuild it with `python3 tools/build_da.py path/to/cadence/data/dictionary.json`.
- `sw.js` and `manifest.webmanifest` make it installable on a phone and usable offline.
- Your saved words and lyrics stay in the browser (localStorage). There is no login yet.

## Run locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Hosting

GitHub Pages from the `main` branch, root folder (Settings → Pages). For the custom domain, add a `CNAME` file containing the domain, and point the domain's DNS at GitHub Pages.

## AI (Line tab)

The app finds the rhymes itself. Claude only chooses among them and suggests next lines, so it can't make up words that don't rhyme. It runs as a Supabase Edge Function so the API key never reaches the browser.

1. Create a Supabase project (or use the 99MS one).
2. `supabase functions deploy rim-ai --no-verify-jwt`
3. `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`
4. Optional: `supabase secrets set ALLOWED_ORIGIN=https://your-domain` so only the app can call it.
5. In `app.js`, set `AI.url` to `https://<project>.supabase.co/functions/v1/rim-ai` and `AI.anonKey` to the project's anon key.

Until `AI.url` is set, the Line tab shows the rhymes for the line's last word without AI.

The function uses `claude-opus-5-5` at low effort. Set the `RIM_MODEL` secret to use a different model. Each request costs money, and the function only has a simple per-IP limit (20 per minute), so watch usage once it's public.
