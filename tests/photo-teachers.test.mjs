import { test, after } from "node:test";
import assert from "node:assert/strict";
import { openPage, closeAll } from "./harness.mjs";
import { DEFAULTS } from "../js/data.js";
after(closeAll);
const PADLET = DEFAULTS.settings.padlet;
const T = { name: "김영한", classNo: 0 };
const lastSettingsWrite = page => page.evaluate(() => { const w = (window.__WRITES || []).filter(x => x.path === "content/settings").pop(); return w && JSON.parse(w.data.json); });

test("saving team assignment keeps the padlet link", async () => {
  const { page, close } = await openPage({ hash: "#/schedule/2", fake: { teacher: T, content: { settings: { home: { desc: "a" }, teams: {}, padlet: "https://padlet.com/keep" } } } });
  page.on("dialog", d => d.accept());
  await page.waitForSelector('#view [data-act="teamPreset"]');
  await page.click('#view [data-act="teamPreset"]');
  await page.waitForFunction(() => (window.__WRITES || []).some(w => w.path === "content/settings"));
  const j = await lastSettingsWrite(page);
  assert.equal(j.padlet, "https://padlet.com/keep");
  assert.equal(j.teams[2][1], "A");
  await close();
});

