import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { ROOT } from "./harness.mjs";
import { DEFAULTS } from "../js/data.js";

const size = f => fs.statSync(path.join(ROOT, f)).size;
const PADLET = "https://padlet.com/xumm1n3/2026-kish-s025bxzekoi8mpfapohx";

test("images are small enough", () => {
  for (const f of ["assets/hero.jpg", "assets/logo.png", "assets/kish-wordmark.png", "assets/cork.jpg", "assets/learn/palace.jpg", "assets/learn/war.jpg", "assets/learn/history.jpg"])
    assert.ok(size(f) <= 500 * 1024, `${f} ${size(f)}`);
});
test("hero is wide enough", () => {
  const b = fs.readFileSync(path.join(ROOT, "assets/hero.jpg"));
  let i = 2, w = 0;
  while (i < b.length) { const m = b[i + 1], len = b.readUInt16BE(i + 2); if (m >= 0xc0 && m <= 0xc2) { w = b.readUInt16BE(i + 7); break; } i += 2 + len; }
  assert.ok(w >= 1400, `width ${w}`);
});
test("fonts are subset woff2", () => {
  for (const f of ["a2z", "freesentation"]) assert.ok(size(`assets/fonts/${f}.woff2`) <= 800 * 1024, f);
  assert.ok(size("assets/fonts/forward.woff2") <= 30 * 1024);
});
test("padlet default", () => assert.equal(DEFAULTS.settings.padlet, PADLET));
test("routes use coordinates, not vague city names", () => {
  for (const r of DEFAULTS.routes) for (const q of [r.fromQ, r.toQ]) assert.ok(!["Vung Tau Vietnam", "Ho Tram Vietnam"].includes(q), `${r.title}: ${q}`);
});
test("day 3 team classes", () => {
  const d = DEFAULTS.schedule[2].items;
  assert.ok(d.find(i => i.team === "A").desc.includes("10-1·2·3반"));
  assert.ok(d.find(i => i.team === "B").desc.includes("10-4·5·6반"));
});
test("three learn places with four topics each", () => {
  assert.equal(DEFAULTS.learn.length, 3);
  for (const s of DEFAULTS.learn) assert.equal(s.topics.length, 4, s.name);
});

test("schedule follows the 2026-235 family letter", () => {
  const [d1, d2, d3] = DEFAULTS.schedule;
  const find = (d, t) => d.items.find(i => i.t === t);
  assert.equal(find(d1, "05:30").e, "07:00");
  assert.match(find(d1, "13:00").title, /통일궁/);
  assert.match(find(d1, "18:00").desc, /Holiday Inn Resort Ho Tram/);
  assert.equal(find(d2, "07:00").e, "08:30");
  assert.match(find(d2, "08:30").desc, /땀탕 광장/);
  assert.ok(d2.items.some(i => i.team === "A" && i.t === "10:30" && /선월드/.test(i.title)));
  assert.ok(d2.items.some(i => i.team === "B" && i.t === "10:30" && /바이저우 성모 성지/.test(i.desc)));
  assert.ok(d2.items.some(i => i.t === "19:00" && /장기자랑/.test(i.title)));
  assert.ok(d3.items.some(i => i.team === "A" && i.t === "13:00" && i.e === "15:00"));
  assert.equal(find(d3, "15:00").e, "17:00");
  assert.match(find(d3, "15:00").desc, /햄버거/);
  assert.match(d3.info, /박물관 1곳만/);
});
