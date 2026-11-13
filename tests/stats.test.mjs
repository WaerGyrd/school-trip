import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { openPage, closeAll } from "./harness.mjs";
after(closeAll);
const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
const T = { name: "조수민", classNo: 0 };
const STATS = { "2026-11-11": { visitors: 30, hours: { "08": 4, "20": 9 } }, [today]: { visitors: 12, hours: { "09": 5, "10": 7 } } };
const LAP = { width: 1440, height: 900 };
const statWrites = page => page.evaluate(() => (window.__WRITES || []).filter(w => w.path.startsWith("stats/")));

test("a visit is counted once per device per hour", async () => {
  const { page, close } = await openPage({ hash: "#/" });
  await page.waitForTimeout(300);
  let w = await statWrites(page);
  assert.equal(w.length, 1);
  assert.equal(w[0].path, "stats/" + today);
  assert.deepEqual(w[0].data.visitors, { __inc: 1 });
  assert.equal(Object.values(w[0].data.hours)[0].__inc, 1);
  await page.reload(); await page.waitForTimeout(800);
  assert.equal((await statWrites(page)).length, 0, "same hour, not counted again");
  await close();
});

test("students and phones never see the stats", async () => {
  let { page, close } = await openPage({ hash: "#/", ...LAP, fake: { stats: STATS } });
  assert.ok(await page.locator("#view .stats-pill").isHidden(), "student on laptop");
  await close();
  ({ page, close } = await openPage({ hash: "#/", fake: { teacher: T, stats: STATS } }));
  await page.waitForTimeout(300);
  assert.ok(await page.locator("#view .stats-pill").isHidden(), "teacher on phone");
  await close();
});

test("teacher on laptop sees a date × hour table", async () => {
  const { page, close } = await openPage({ hash: "#/", ...LAP, fake: { teacher: T, stats: STATS } });
  await page.locator("#view .stats-pill").click();
  const panel = page.locator("#view .stats-panel");
  await panel.waitFor();
  assert.match(await panel.innerText(), /오늘 방문자 수 \/ 총 방문자 수/);
  assert.match(await panel.locator(".st-today").innerText(), /^12명$/);
  assert.match(await panel.locator(".st-total").innerText(), /42명/);
  const rows = panel.locator("table.st-hm tbody tr");
  assert.equal(await rows.count(), 2, "one row per day");
  assert.equal(await rows.nth(0).locator("td").count(), 24, "24 hours");
  assert.equal((await rows.nth(1).locator("td").nth(9).innerText()).trim(), "5");
  assert.match(await rows.nth(0).locator("th").innerText(), /11\.11[\s\S]*30명/);
  assert.match(await panel.locator(".st-peak").innerText(), /가장 붐빈 시간: 11\.11 20시 9명/);
  await close();
});

test("excel export lists every day and hour", async () => {
  const { page, close } = await openPage({ hash: "#/", ...LAP, fake: { teacher: T, stats: STATS } });
  await page.locator("#view .stats-pill").click();
  await page.locator("#view .stats-panel").waitFor();
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click('#view [data-act="statsCsv"]')]);
  assert.match(dl.suggestedFilename(), /^kish-trip-visitors-\d{8}\.csv$/);
  const csv = fs.readFileSync(await dl.path(), "utf8");
  assert.ok(csv.startsWith("﻿"), "BOM so Excel reads Korean");
  const lines = csv.replace("\uFEFF", "").split(/\r?\n/);
  assert.ok(lines.includes("날짜,방문자 수,가장 붐빈 시간,그 시간 방문자"));
  assert.ok(lines.includes("2026-11-11,30,20시,9"));
  assert.ok(lines.includes("날짜," + Array.from({ length: 24 }, (_, h) => h + "시").join(",")));
  const row = lines.find(l => l.startsWith(today + ",") && l.split(",").length === 25).split(",");
  assert.equal(row[1 + 9], "5"); assert.equal(row[1 + 10], "7"); assert.equal(row[1 + 13], "0");
  await close();
});
