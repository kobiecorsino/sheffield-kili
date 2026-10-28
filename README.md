# Sheffield to the Summit

Fundraising site for Aaron, Kobie and Lui's Kilimanjaro climb (August 2027) for Dig Deep.

Live at **https://kobiecorsino.github.io/sheffield-kili/**

## How it updates

Enthuse's Cloudflare bot protection blocks requests from GitHub's servers, so the totals are read from a normal browser instead:

1. Every hour, a scheduled Claude task on Kobie's computer opens Enthuse in the Claude app's browser and runs `scripts/browser-snapshot.js`.
2. It folds the result into `data.json` with `node scripts/merge.mjs snapshot.json` and pushes it here.
3. Every push to `main` runs `.github/workflows/update-site.yml`, which rebuilds the site and publishes it to GitHub Pages.

This only runs while the computer is on and the Claude desktop app is open; otherwise the site keeps the last figures.
Check the latest result at https://kobiecorsino.github.io/sheffield-kili/status.txt

To update by hand: edit `data.json` on GitHub and commit; the site republishes in about a minute.

## Files

- `src/index.html`: the page design and text
- `data.json`: totals and supporter messages (updated automatically; you can also edit it by hand)
- `assets/`: photos
- `scripts/browser-snapshot.js`: reads totals and supporter messages (run in a browser tab on dig-deep.enthuse.com)
- `scripts/merge.mjs`: merges a snapshot into `data.json`
- `scripts/update.mjs`: server-side reader (blocked by Cloudflare when run from GitHub; kept for its tested parsing helpers)
- `scripts/build.mjs`: builds the page into `_site/`
- `test/`: checks the readers and merge (`node --test test/parse.test.mjs test/merge.test.mjs`)

## Notes

- To hide a supporter message, delete it from `data.json`. It won't come back unless it's still in Enthuse's most recent donations.
