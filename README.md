# Sheffield to the Summit

Fundraising site for Aaron, Kobie and Lui's Kilimanjaro climb (August 2027) for Dig Deep.

Live at **https://kobiecorsino.github.io/sheffield-kili/**

## How it updates

Every hour, a GitHub Action (`.github/workflows/update-site.yml`):

1. reads the three Enthuse pages (totals, donor counts and recent supporter messages),
2. saves any changes to `data.json`,
3. rebuilds the site and publishes it to GitHub Pages.

If Enthuse can't be reached, the site keeps the last good figures and tries again next hour.

To update straight away: **Actions → Update totals and publish site → Run workflow**.

## Files

- `src/index.html`: the page design and text
- `data.json`: totals and supporter messages (updated automatically; you can also edit it by hand)
- `assets/`: photos
- `scripts/update.mjs`: reads Enthuse and updates `data.json`
- `scripts/build.mjs`: builds the page into `_site/`
- `test/`: checks the Enthuse reader against saved samples (`node --test test/parse.test.mjs`)

## Notes

- GitHub pauses hourly workflows on public repos after 60 days without repository activity. If updates stop, open the Actions tab and re-enable the workflow.
- To hide a supporter message, delete it from `data.json`. It won't come back unless it's still in Enthuse's most recent donations.
