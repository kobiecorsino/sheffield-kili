// Runs inside a browser tab that is open on https://dig-deep.enthuse.com
// (it must be that origin, because Enthuse doesn't allow other sites to read it).
// Returns a small JSON snapshot: { checkedAt, people: {slug: {raised, target, donors}}, wall: [...] }
// Used by the hourly Claude task; scripts/merge.mjs then folds it into data.json.
await (async () => {
  const PEOPLE = [
    { slug: "aaron-mojica", pageId: 1671526, short: "Aaron" },
    { slug: "kobie-corsino", pageId: 1671558, short: "Kobie" },
    { slug: "lui-papena", pageId: 1671669, short: "Lui" },
  ];
  const money = s => Number(String(s).replace(/[£,\s]/g, ""));
  const decode = s => { const t = document.createElement("textarea"); t.innerHTML = s.replace(/<[^>]+>/g, ""); return t.value.replace(/\s+/g, " ").trim(); };
  const shortName = n => {
    const parts = n.trim().split(/\s+/);
    const cap = w => w.replace(/(^|[-'’])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
    if (parts.length < 2 || /^anonymous$/i.test(n.trim())) return cap(parts[0] || "Anonymous");
    return `${cap(parts[0])} ${parts[parts.length - 1][0].toUpperCase()}.`;
  };
  const people = {}, wall = [];
  for (const p of PEOPLE) {
    const page = await fetch(`/pf/${p.slug}`, { cache: "no-store" }).then(r => { if (!r.ok) throw new Error(`${p.slug}: HTTP ${r.status}`); return r.text(); });
    const val = label => page.match(new RegExp(label + `\\s*<br\\s*/?>\\s*<span class="target-list-value[^"]*">\\s*£?([\\d,.]+)`, "i"))?.[1];
    const raised = val("Raised so far");
    if (!raised) throw new Error(`${p.slug}: couldn't find 'Raised so far'`);
    people[p.slug] = { raised: money(raised), target: money(val("Target") || 2990), donors: money(val("Number of donors") || 0) };
    const html = await fetch(`/donations/get-more-donations?skipCount=0&takeCount=20&fromProfile=false&fromCompanyProfile=false&crowdfunderId=32187&charityId=336224&fromPageId=${p.pageId}`, { cache: "no-store" }).then(r => r.text());
    for (const card of html.split(/js-donor-card/).slice(1)) {
      const id = card.match(/js-reply-div-(\d+)/)?.[1];
      const at = card.match(/datetime="([^"]+)"/)?.[1];
      const name = card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1];
      const msg = id && card.match(new RegExp(`js-donation-message-${id}"[^>]*>([\\s\\S]*?)</p>`))?.[1];
      const qty = card.match(/<span class="qty">\s*£([\d,.]+)/)?.[1];
      if (!id || !at || !name) continue;
      const text = msg ? decode(msg) : "";
      if (!text || /^donation from /i.test(text)) continue;
      wall.push({ id, name: shortName(decode(name)), msg: text, amount: qty ? money(qty) : null, to: p.short, at });
    }
  }
  return JSON.stringify({ checkedAt: new Date().toISOString(), people, wall });
})()
