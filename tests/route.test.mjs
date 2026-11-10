import { test, after } from "node:test";
import assert from "node:assert/strict";
import { openPage, closeAll } from "./harness.mjs";
import { DEFAULTS } from "../js/data.js";
after(closeAll);
const DAY3 = DEFAULTS.routes.filter(r => r.day === 3).length;

test("day tabs and collapsed list on phone", async () => {
  let { page, close } = await openPage({ hash: "#/route" });
  assert.equal(await page.locator("#view .seg a").count(), 3);
  await close();
  ({ page, close } = await openPage({ hash: "#/route/3" }));
  assert.equal(await page.locator("#view .ri").count(), DAY3);
  assert.equal(await page.locator("#view .ri iframe, #view .ri img.map").count(), 0);
  assert.equal((await page.locator("#view .seg a.on").innerText()).replace(/\s+/g, " ").trim().slice(0, 3), "3일차");
  await close();
});

test("selected route opens its map on phone", async () => {
  const { page, close } = await openPage({ hash: "#/route/3/0" });
  assert.equal(await page.locator("#view .ri").first().locator("iframe").count(), 1);
  assert.equal(await page.locator("#view .ri iframe").count(), 1);
  assert.match(await page.locator("#view .ri").first().innerText(), /호텔 → 송빈 성당/);
  await close();
});

test("laptop shows the map in a side panel", async () => {
  const { page, close } = await openPage({ hash: "#/route/3/0", width: 1440, height: 900 });
  assert.equal(await page.locator("#view .ri iframe").count(), 0);
  assert.equal(await page.locator("#view .rview iframe").count(), 1);
  assert.ok(await page.locator("#view .ri").first().evaluate(e => e.classList.contains("sel")));
  await close();
});

test("tapping a route selects it", async () => {
  const { page, close } = await openPage({ hash: "#/route/3" });
  await page.locator("#view .ri a").nth(1).click();
  await page.waitForFunction(() => location.hash === "#/route/3/1");
  await close();
});

test("place-check badge only in edit mode", async () => {
  let { page, close } = await openPage({ hash: "#/route/1" });
  assert.doesNotMatch(await page.locator("#view").innerText(), /장소 확인 필요/);
  await close();
  ({ page, close } = await openPage({ hash: "#/route/1", fake: { teacher: { name: "김", classNo: 0 } } }));
  await page.waitForSelector("#view .b-todo");
  await close();
});

test("teacher can edit a route", async () => {
  const { page, close } = await openPage({ hash: "#/route/3/0", fake: { teacher: { name: "김", classNo: 0 } } });
  await page.waitForSelector('#view [data-act="editRoute"]');
  await page.click('#view [data-act="editRoute"]');
  assert.match(await page.locator("#modalBox h3").innerText(), /경로 수정/);
  await close();
});
