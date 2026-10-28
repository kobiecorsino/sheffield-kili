// Builds the website into _site/ by putting data.json into src/index.html.
// Run with: node scripts/build.mjs
// The page shows data.checkedAt (when Enthuse was last read) as "Totals updated …".

import { readFile, writeFile, mkdir, cp, rm } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const data = JSON.parse(await readFile(new URL("data.json", root), "utf8"));
// Show visitors when the totals were last checked (even if nothing had changed).
data.updatedAt = process.env.CHECKED_AT || data.checkedAt || data.updatedAt;

const template = await readFile(new URL("src/index.html", root), "utf8");
if (!template.includes("/*__DATA__*/null")) throw new Error("src/index.html is missing the /*__DATA__*/null placeholder");
const json = JSON.stringify(data).replace(/</g, "\\u003c");
const html = template.replace("/*__DATA__*/null", json);

const out = new URL("_site/", root);
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await writeFile(new URL("index.html", out), html);
await cp(new URL("assets/", root), new URL("assets/", out), { recursive: true });
await writeFile(new URL(".nojekyll", out), "");
console.log("Built _site/index.html");
