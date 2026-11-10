import { test, after } from "node:test";
import assert from "node:assert/strict";
import { openPage, closeAll } from "./harness.mjs";
import { DEFAULTS } from "../js/data.js";
after(closeAll);
const PADLET = DEFAULTS.settings.padlet;
const T = { name: "김영한", classNo: 0 };
const lastSettingsWrite = page => page.evaluate(() => { const w = (window.__WRITES || []).filter(x => x.path === "content/settings").pop(); return w && JSON.parse(w.data.json); });

test("photo zone links to the default padlet", async () => {
  const { page, close } = await openPage({ hash: "#/photo" });
  const a = page.locator("#view a.pbtn");
  assert.equal(await a.getAttribute("href"), PADLET);
  assert.equal(await a.getAttribute("target"), "_blank");
  assert.match(await a.getAttribute("rel"), /noopener/);
  assert.equal(await page.locator('#view input[type="file"]').count(), 0);
  await close();
});

test("old saved settings without padlet still use the default", async () => {
  const { page, close } = await openPage({ hash: "#/photo", fake: { content: { settings: { home: { desc: "옛 소개" }, teams: {} } } } });
  assert.equal(await page.getAttribute("#view a.pbtn", "href"), PADLET);
  await close();
});

test("empty padlet shows not ready, custom link is used", async () => {
  let { page, close } = await openPage({ hash: "#/photo", fake: { content: { settings: { home: { desc: "x" }, teams: {}, padlet: "" } } } });
  assert.equal(await page.locator("#view a.pbtn").count(), 0);
  assert.match(await page.locator("#view .pbtn.off").innerText(), /준비 중/);
  await close();
  ({ page, close } = await openPage({ hash: "#/photo", fake: { content: { settings: { home: { desc: "x" }, teams: {}, padlet: "https://padlet.com/x" } } } }));
  assert.equal(await page.getAttribute("#view a.pbtn", "href"), "https://padlet.com/x");
  await close();
});

test("teacher saves padlet link without losing home text", async () => {
  const { page, close } = await openPage({ hash: "#/photo", fake: { teacher: T } });
  await page.waitForSelector('#view [data-act="editPadlet"]');
  await page.click('#view [data-act="editPadlet"]');
  await page.fill('#mf [name="padlet"]', "https://padlet.com/new");
  await page.click("#mfSave");
  const j = await lastSettingsWrite(page);
  assert.equal(j.padlet, "https://padlet.com/new");
  assert.equal(j.home.desc, DEFAULTS.settings.home.desc);
  await close();
});

test("saving home text keeps the padlet link", async () => {
  const { page, close } = await openPage({ hash: "#/", fake: { teacher: T, content: { settings: { home: { desc: "a" }, teams: {}, padlet: "https://padlet.com/keep" } } } });
  await page.waitForSelector('#view [data-act="editHome"]');
  await page.click('#view [data-act="editHome"]');
  await page.fill('#mf [name="desc"]', "새 소개");
  await page.click("#mfSave");
  const j = await lastSettingsWrite(page);
  assert.equal(j.padlet, "https://padlet.com/keep");
  assert.equal(j.home.desc, "새 소개");
  await close();
});

test("teacher cards", async () => {
  const { page, close } = await openPage({ hash: "#/teachers", width: 1440, height: 900 });
  assert.equal(await page.locator("#view .tc").count(), 7);
  const ys = await page.$$eval("#view .tc", e => e.slice(0, 3).map(x => Math.round(x.getBoundingClientRect().top)));
  assert.equal(new Set(ys).size, 1);
  assert.equal(await page.locator("#view .tc").first().evaluate(e => getComputedStyle(e).backgroundImage), "none");
  await close();
});
