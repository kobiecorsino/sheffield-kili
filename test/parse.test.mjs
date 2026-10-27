// Run with: node --test test/parse.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseTotals, parseDonations, shortName } from "../scripts/update.mjs";

test("reads totals from a fundraising page", async () => {
  const html = await readFile(new URL("page-sample.html", import.meta.url), "utf8");
  assert.deepEqual(parseTotals(html), { raised: 553, target: 2990, donors: 23 });
});

test("reads supporter messages and skips empty or 'Donation from' ones", async () => {
  const html = await readFile(new URL("donations-sample.html", import.meta.url), "utf8");
  const d = parseDonations(html, "Aaron");
  assert.equal(d.length, 3);
  assert.deepEqual(d[0], { id: "17358247", name: "Joseph G.", msg: "Climb da big mountain", amount: 10, to: "Aaron", at: "2026-10-26T14:12:04Z" });
  assert.equal(d[1].msg, "😀enjoy xx");
  assert.equal(d[1].name, "Ellen O.");
  assert.equal(d[2].name, "Jeanette G.");
  assert.equal(d[2].amount, null);
});

test("shortens names", () => {
  assert.equal(shortName("Lisa-Marie Fletcher"), "Lisa-Marie F.");
  assert.equal(shortName("Anonymous"), "Anonymous");
  assert.equal(shortName("Mary Adrianne Ros"), "Mary R.");
});
