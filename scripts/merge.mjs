// Folds a browser snapshot (from scripts/browser-snapshot.js) into data.json.
// Usage: node scripts/merge.mjs snapshot.json
// Prints "changed" or "unchanged". Always records the check time in data.json's checkedAt.

import { readFile, writeFile } from "node:fs/promises";

const WALL_LIMIT = 40;
const DATA_FILE = new URL("../data.json", import.meta.url);

export function merge(old, snap) {
  const slugs = ["aaron-mojica", "kobie-corsino", "lui-papena"];
  for (const s of slugs) {
    const p = snap.people?.[s];
    if (!p || !Number.isFinite(p.raised) || !Number.isFinite(p.donors) || !Number.isFinite(p.target)) throw new Error(`snapshot is missing totals for ${s}`);
  }
  const sig = w => `${w.to}|${w.name}|${w.msg}`;
  let wall = [...(snap.wall || [])];
  const seen = new Set(wall.flatMap(w => [w.id, sig(w)]));
  for (const w of old.wall || []) if (!(w.id && seen.has(w.id)) && !seen.has(sig(w))) wall.push(w);
  wall.sort((a, b) => new Date(b.at) - new Date(a.at));
  wall = wall.slice(0, WALL_LIMIT);
  const people = Object.fromEntries(slugs.map(s => [s, { raised: snap.people[s].raised, target: snap.people[s].target, donors: snap.people[s].donors }]));
  const changed = JSON.stringify({ people, wall }) !== JSON.stringify({ people: old.people, wall: old.wall });
  return { changed, data: { updatedAt: changed ? snap.checkedAt : old.updatedAt, checkedAt: snap.checkedAt, people, wall } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const snap = JSON.parse(await readFile(process.argv[2], "utf8"));
  const old = JSON.parse(await readFile(DATA_FILE, "utf8"));
  const { changed, data } = merge(old, snap);
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2) + "\n");
  const total = Object.values(data.people).reduce((s, p) => s + p.raised, 0);
  console.log(`${changed ? "changed" : "unchanged"}: £${total} raised, ${data.wall.length} supporter messages`);
}
