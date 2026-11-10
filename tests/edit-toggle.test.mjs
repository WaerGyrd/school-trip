import { test, after } from "node:test";
import assert from "node:assert/strict";
import { openPage, closeAll } from "./harness.mjs";
after(closeAll);
const DEV = { name: "조수민", classNo: "0" };   // 문서에 classNo 를 문자열로 넣은 경우
const OFF = { teacher: DEV, edit: false };

test("any teacher can post to every class", async () => {
  const { page, close } = await openPage({ hash: "#/notice", fake: { teacher: DEV } });
  await page.click('#view [data-act="newN"]');
  const opts = await page.$$eval('#mf [name="cls"] option', o => o.map(x => x.textContent.trim()));
  assert.deepEqual(opts, ["공통 (전체)", "1반", "2반", "3반", "4반", "5반", "6반"]);
  await close();
});

test("teacher picks who the notice is from", async () => {
  const { page, close } = await openPage({ hash: "#/notice", fake: { teacher: DEV } });
  await page.click('#view [data-act="newN"]');
  const names = await page.$$eval('#mf [name="signedAs"] option', o => o.map(x => x.value));
  assert.equal(names[0], "조수민");
  assert.ok(names.includes("배일환"));
  await page.selectOption('#mf [name="signedAs"]', "배일환");
  await page.selectOption('#mf [name="cls"]', "2");
  await page.fill('#mf [name="title"]', "제목"); await page.fill('#mf [name="body"]', "내용");
  await page.click("#mfSave");
  const w = await page.evaluate(() => window.__WRITES.find(x => x.op === "add" && x.path === "announcements"));
  assert.equal(w.data.signedAs, "배일환"); assert.equal(w.data.cls, 2);
  await close();
});

test("card shows the chosen teacher name", async () => {
  const n = [{ id: "a", cls: 2, title: "t", body: "b", authorName: "조수민", signedAs: "배일환", authorUid: "t1", createdAt: "2026-11-18T10:00:00+07:00" }];
  const { page, close } = await openPage({ hash: "#/notice", fake: { notices: n } });
  assert.match(await page.locator("#view .ntc .who").innerText(), /2반 배일환 선생님/);
  await close();
});

test("edit mode is off after login, switch on home turns it on and is remembered", async () => {
  let { page, close } = await openPage({ hash: "#/", fake: OFF });
  const sw = page.locator('#view .switch[data-toggle-edit]');
  await sw.waitFor();
  assert.equal(await sw.getAttribute("aria-checked"), "false");
  assert.ok(await page.locator("#adminbar").isHidden());
  await page.evaluate(() => (location.hash = "#/schedule/2"));
  await page.waitForTimeout(300);
  assert.equal(await page.locator("#view .edit").count(), 0, "no edit buttons while off");
  await page.evaluate(() => (location.hash = "#/"));
  await page.waitForTimeout(300);
  await page.locator('#view .switch[data-toggle-edit]').click();
  assert.equal(await page.locator('#view .switch[data-toggle-edit]').getAttribute("aria-checked"), "true");
  assert.ok(await page.locator("#adminbar").isVisible());
  const bar = await page.locator("#adminbar").boundingBox(), dev = await page.locator(".home .dev").boundingBox();
  assert.ok(dev.y + dev.height <= bar.y, "credit not covered by the edit bar");
  await page.evaluate(() => (location.hash = "#/schedule/2"));
  await page.waitForSelector("#view .edit");
  await page.reload(); await page.waitForTimeout(800);
  assert.ok(await page.locator("#view .edit").count() > 0, "remembered after reload");
  await close();
});

test("students do not see the switch", async () => {
  const { page, close } = await openPage({ hash: "#/" });
  assert.ok(await page.locator('#view .switch[data-toggle-edit]').isHidden());
  await close();
});

test("home is not redrawn by the login event (typing keeps playing)", async () => {
  const { page, close } = await openPage({ hash: "#/", fake: OFF, wait: false });
  await page.waitForSelector(".hcm.typing");
  const el = await page.$(".hcm.typing");
  await page.waitForTimeout(800);
  assert.ok(await el.evaluate(e => e.isConnected), "home was re-rendered");
  await close();
});
