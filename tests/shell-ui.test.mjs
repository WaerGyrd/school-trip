import { test, after } from "node:test";
import assert from "node:assert/strict";
import { openPage, closeAll } from "./harness.mjs";
after(closeAll);

test("menu opens with numbered contents", async () => {
  const { page, close } = await openPage({ hash: "#/schedule" });
  await page.click("#menuBtn");
  assert.ok(await page.evaluate(() => document.body.classList.contains("menu-open")));
  assert.match(await page.locator("#drawer").innerText(), /목차/);
  const navs = await page.$$eval("#drawer [data-nav]", as => as.map(a => a.dataset.nav));
  assert.deepEqual(navs, ["schedule", "route", "notice", "learn", "photo", "teachers"]);
  const labels = await page.$$eval("#drawer [data-nav]", as => as.map(a => a.innerText.replace(/\s+/g, "")));
  assert.deepEqual(labels, ["01일정", "02이동경로", "03공지사항", "04배워가기", "05포토존", "06쌤소개"]);
  await close();
});

test("new notice shows menu dot until notice page", async () => {
  const { page, close } = await openPage({ hash: "#/schedule" });
  assert.equal(await page.isVisible("#menuDot"), false);
  await page.evaluate(() => window.__pushNotice({ id: "z", cls: 0, title: "새 공지", body: "b", authorName: "김", authorUid: "x", createdAt: Date.now() }));
  await page.waitForSelector("#menuDot", { state: "visible" });
  assert.ok(await page.isVisible('#drawer [data-nav="notice"] .dot'));
  await page.evaluate(() => (location.hash = "#/notice"));
  await page.waitForSelector("#menuDot", { state: "hidden" });
  await close();
});

test("bell button is gone", async () => {
  const { page, close } = await openPage({ hash: "#/" });
  assert.equal(await page.$("#bellBtn"), null);
  await close();
});

test("teacher sees name and logout in menu", async () => {
  const { page, close } = await openPage({ hash: "#/schedule", fake: { teacher: { name: "김영한", classNo: 0 } } });
  await page.waitForFunction(() => document.querySelector("#drawerExtra").innerText.includes("로그아웃"));
  assert.match(await page.locator("#drawerExtra").innerText(), /김영한/);
  await close();
});

test("site fonts load", async () => {
  const { page, close } = await openPage({ hash: "#/schedule" });
  const ff = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  assert.match(ff, /Free/);
  assert.ok(await page.evaluate(async () => { await document.fonts.load("16px A2Z", "가"); return document.fonts.check("16px A2Z", "가"); }));
  await close();
});

test("top bar shows page title and logo links home", async () => {
  const { page, close } = await openPage({ hash: "#/notice" });
  assert.equal((await page.locator("#topTitle").innerText()).trim(), "공지 사항");
  assert.equal(await page.getAttribute("#topLogo", "href"), "#/");
  await close();
});
