import { test, after } from "node:test";
import assert from "node:assert/strict";
import { openPage, closeAll } from "./harness.mjs";
after(closeAll);
const T = { teacher: { name: "김영한", classNo: 0 } };

test("tickets list", async () => {
  const { page, close } = await openPage({ hash: "#/schedule" });
  const tks = page.locator("#view .tk");
  assert.equal(await tks.count(), 3);
  const txt = await tks.allInnerTexts();
  ["11.18", "11.19", "11.20"].forEach((d, i) => { assert.match(txt[i], new RegExp(d.replace(".", "\\."))); assert.match(txt[i], new RegExp(`DAY ${i + 1}`)); });
  assert.equal(await tks.nth(1).getAttribute("href"), "#/schedule/2");
  const a = await tks.first().boundingBox(), c = await tks.last().boundingBox();
  const mid = (a.y + c.y + c.height) / 2;
  assert.ok(Math.abs(mid - 844 / 2) <= 80, `tickets centre ${mid}`);
  await close();
});

test("tickets in one row on laptop", async () => {
  const { page, close } = await openPage({ hash: "#/schedule", width: 1440, height: 900 });
  const ys = await page.$$eval("#view .tk", els => els.map(e => Math.round(e.getBoundingClientRect().top)));
  assert.equal(new Set(ys).size, 1, ys.join());
  await close();
});

test("day 2 defaults to team A, deep link to B", async () => {
  let { page, close } = await openPage({ hash: "#/schedule/2" });
  assert.equal(await page.locator("#view .tabs2 a").count(), 2);
  assert.equal((await page.locator("#view .tabs2 a.on").innerText()).trim(), "A팀");
  assert.match(await page.locator("#view .dayhd").innerText(), /DAY 2[\s\S]*붕따우/);
  let t = (await page.locator("#view .tl").allInnerTexts()).join("\n");
  assert.match(t, /썬월드 워터파크/); assert.doesNotMatch(t, /시내 투어/);
  await close();
  ({ page, close } = await openPage({ hash: "#/schedule/2/B" }));
  t = (await page.locator("#view .tl").allInnerTexts()).join("\n");
  assert.match(t, /붕따우 시내 투어/); assert.doesNotMatch(t, /썬월드/);
  await close();
});

test("day 1 has no team tabs and both halves", async () => {
  const { page, close } = await openPage({ hash: "#/schedule/1" });
  assert.equal(await page.locator("#view .tabs2").count(), 0);
  const t = await page.locator("#view").innerText();
  assert.match(t, /오전/); assert.match(t, /오후/);
  await close();
});

test("halves side by side on laptop", async () => {
  const { page, close } = await openPage({ hash: "#/schedule/2", width: 1440, height: 900 });
  const ys = await page.$$eval("#view .half", els => els.map(e => Math.round(e.getBoundingClientRect().top)));
  assert.equal(ys.length, 2); assert.equal(ys[0], ys[1]);
  await close();
});

test("teacher edits an item", async () => {
  const { page, close } = await openPage({ hash: "#/schedule/2", fake: T });
  await page.waitForSelector("#view .tl .edit");
  await page.click("#view .tl .edit");
  assert.match(await page.locator("#modalBox h3").innerText(), /일정 수정/);
  await close();
});

test("old saved title with DAY prefix is cleaned", async () => {
  const { DEFAULTS } = await import("../js/data.js");
  const sch = JSON.parse(JSON.stringify(DEFAULTS.schedule)); sch[0].title = "DAY 1 · 하노이 → 호치민 → 호짬";
  const { page, close } = await openPage({ hash: "#/schedule", fake: { content: { schedule: sch } } });
  assert.doesNotMatch(await page.locator("#view .tk").first().innerText(), /DAY 1 ·/);
  await close();
});
