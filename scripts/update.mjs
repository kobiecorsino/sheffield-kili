// Reads the three Enthuse fundraising pages and updates data.json.
// Run with: node scripts/update.mjs
// If Enthuse can't be reached, data.json is left as it was and the site keeps the last good figures.

import { readFile, writeFile } from "node:fs/promises";

const PEOPLE = [
  { slug: "aaron-mojica", pageId: 1671526, short: "Aaron" },
  { slug: "kobie-corsino", pageId: 1671558, short: "Kobie" },
  { slug: "lui-papena", pageId: 1671669, short: "Lui" },
];
const BASE = "https://dig-deep.enthuse.com";
const CROWDFUNDER_ID = 32187, CHARITY_ID = 336224;
const WALL_LIMIT = 40;
const DATA_FILE = new URL("../data.json", import.meta.url);

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
};

async function get(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      const body = await res.text();
      if (!res.ok) {
        const blocked = /just a moment|cf-chl|challenge-platform|attention required/i.test(body);
        throw new Error(`HTTP ${res.status}${blocked ? " (blocked by Cloudflare bot protection)" : ""}`);
      }
      return body;
    } catch (err) {
      if (attempt === 3) throw new Error(`${url}: ${err.message}`);
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
}

export function decode(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&pound;/g, "£").replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}
const money = s => Number(String(s).replace(/[£,\s]/g, ""));

// "Target £2,990 · Raised so far £553 · Number of donors 23"
export function parseTotals(html) {
  const raised = html.match(/Raised so far\s*<br\s*\/?>\s*<span class="target-list-value[^"]*">\s*£([\d,.]+)/i);
  const target = html.match(/Target\s*<br\s*\/?>\s*<span class="target-list-value[^"]*">\s*£([\d,.]+)/i);
  const donors = html.match(/Number of donors\s*<br\s*\/?>\s*<span class="target-list-value[^"]*">\s*([\d,]+)/i);
  if (!raised) throw new Error("couldn't find 'Raised so far' on the page");
  return { raised: money(raised[1]), target: target ? money(target[1]) : 2990, donors: donors ? money(donors[1]) : 0 };
}

// Shorten "Lisa-Marie Fletcher" to "Lisa-Marie F."; keep "Anonymous" as is.
export function shortName(n) {
  const parts = n.trim().split(/\s+/);
  const cap = w => w.replace(/(^|[-'’])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  if (parts.length < 2 || /^anonymous$/i.test(n.trim())) return cap(parts[0] || "Anonymous");
  return `${cap(parts[0])} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export function parseDonations(html, to) {
  const out = [];
  for (const card of html.split(/js-donor-card/).slice(1)) {
    const id = card.match(/js-reply-div-(\d+)/)?.[1];
    const at = card.match(/datetime="([^"]+)"/)?.[1];
    const name = card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1];
    const msg = id && card.match(new RegExp(`js-donation-message-${id}"[^>]*>([\\s\\S]*?)</p>`))?.[1];
    const qty = card.match(/<span class="qty">\s*£([\d,.]+)/)?.[1];
    if (!id || !at || !name) continue;
    const text = msg ? decode(msg) : "";
    if (!text || /^donation from /i.test(text)) continue; // only show real supporter messages
    out.push({ id, name: shortName(decode(name)), msg: text, amount: qty ? money(qty) : null, to, at });
  }
  return out;
}

async function main() {
  const old = JSON.parse(await readFile(DATA_FILE, "utf8"));
  const people = {};
  let wall = [];
  for (const p of PEOPLE) {
    people[p.slug] = parseTotals(await get(`${BASE}/pf/${p.slug}`));
    const dHtml = await get(`${BASE}/donations/get-more-donations?skipCount=0&takeCount=20&fromProfile=false&fromCompanyProfile=false&crowdfunderId=${CROWDFUNDER_ID}&charityId=${CHARITY_ID}&fromPageId=${p.pageId}`);
    wall = wall.concat(parseDonations(dHtml, p.short));
  }
  // keep older messages that have scrolled off Enthuse's "recent" list
  const key = w => w.id || `${w.to}|${w.name}|${w.msg}`;
  const seen = new Set(wall.flatMap(w => [w.id, `${w.to}|${w.name}|${w.msg}`]));
  for (const w of old.wall || []) if (!seen.has(key(w)) && !seen.has(`${w.to}|${w.name}|${w.msg}`)) wall.push(w);
  wall.sort((a, b) => new Date(b.at) - new Date(a.at));
  wall = wall.slice(0, WALL_LIMIT);

  const changed = JSON.stringify({ people, wall }) !== JSON.stringify({ people: old.people, wall: old.wall });
  // Only rewrite the file when something changed, so the repo isn't committed to every hour.
  if (changed) await writeFile(DATA_FILE, JSON.stringify({ updatedAt: new Date().toISOString(), people, wall }, null, 2) + "\n");
  const total = Object.values(people).reduce((s, p) => s + p.raised, 0);
  console.log(`${changed ? "Updated" : "No change"}: £${total} raised, ${wall.length} supporter messages.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => { console.error("Update failed, keeping the previous figures:", err.message); process.exit(1); });
}
