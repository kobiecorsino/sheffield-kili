// Run with: node --test test/merge.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { merge } from "../scripts/merge.mjs";

const people = { "aaron-mojica": { raised: 10, target: 2990, donors: 1 }, "kobie-corsino": { raised: 0, target: 2990, donors: 0 }, "lui-papena": { raised: 0, target: 2990, donors: 0 } };

test("keeps old messages, drops duplicates (with or without ids), newest first", () => {
  const old = { updatedAt: "A", people, wall: [
    { name: "Aileen L.", msg: "Good work", to: "Kobie", at: "2026-10-27T08:00:00Z" },
    { id: "1", name: "Old O.", msg: "Older", to: "Aaron", at: "2026-10-01T00:00:00Z" } ] };
  const snap = { checkedAt: "B", people, wall: [
    { id: "9", name: "Aileen L.", msg: "Good work", to: "Kobie", at: "2026-10-27T08:00:00Z" },
    { id: "10", name: "New N.", msg: "New", to: "Lui", at: "2026-10-28T00:00:00Z" } ] };
  const { changed, data } = merge(old, snap);
  assert.equal(changed, true);
  assert.deepEqual(data.wall.map(w => w.msg), ["New", "Good work", "Older"]);
  assert.equal(data.updatedAt, "B");
  assert.equal(data.checkedAt, "B");
});

test("unchanged snapshot keeps updatedAt but records the check", () => {
  const old = { updatedAt: "A", people, wall: [] };
  const { changed, data } = merge(old, { checkedAt: "B", people, wall: [] });
  assert.equal(changed, false);
  assert.equal(data.updatedAt, "A");
  assert.equal(data.checkedAt, "B");
});

test("refuses a snapshot with missing totals", () => {
  assert.throws(() => merge({ people, wall: [] }, { checkedAt: "B", people: { "aaron-mojica": people["aaron-mojica"] }, wall: [] }));
});
