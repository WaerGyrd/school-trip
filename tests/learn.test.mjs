import { test, after } from "node:test";
import assert from "node:assert/strict";
import { openPage, closeAll } from "./harness.mjs";
after(closeAll);

test("learn list has three places and a quiz card", async () => {
  const { page, close } = await openPage({ hash: "#/learn" });
  const cards = page.locator("#view .lc");
  assert.equal(await cards.count(), 4);
  const t = (await cards.allInnerTexts()).join("|");
  for (const w of ["통일궁", "전쟁 박물관", "역사 박물관", "퀴즈"]) assert.match(t, new RegExp(w));
  assert.equal(await cards.last().getAttribute("href"), "#/quiz");
  const broken = await page.$$eval("#view img", imgs => imgs.filter(i => i.complete && i.naturalWidth === 0).length);
  assert.equal(broken, 0);
  const ov = await cards.first().evaluate(e => getComputedStyle(e, "::before").backgroundColor);
  assert.equal(ov, "rgba(0, 0, 0, 0.6)");
  await close();
});

test("place detail opens a question in place on phone", async () => {
  const { page, close } = await openPage({ hash: "#/learn/1/0" });
  assert.equal((await page.locator("#view .exp h3").innerText()).trim(), "왜 싸웠을까?");
  assert.match(await page.locator("#view .exp p").innerText(), /국제전/);
  assert.match(await page.locator("#view .lead2").innerText(), /딱 4가지만 알자!/);
  assert.equal(await page.locator("#view .pill").count(), 3);
  await close();
});

test("laptop shows first answer on the right", async () => {
  const { page, close } = await openPage({ hash: "#/learn/1", width: 1440, height: 900 });
  assert.equal((await page.locator("#view .exp h3").innerText()).trim(), "왜 싸웠을까?");
  const p = await page.locator("#view .pills").boundingBox(), e = await page.locator("#view .exp").boundingBox();
  assert.ok(e.x > p.x + p.width, "answer is right of questions");
  await close();
});

test("back icon closes the answer", async () => {
  const { page, close } = await openPage({ hash: "#/learn/1/2" });
  await page.click("#view .exp .back");
  await page.waitForFunction(() => location.hash === "#/learn/1" && !document.querySelector("#view .exp"), null, { timeout: 3000 });
  await close();
});

test("teacher can edit a topic", async () => {
  const { page, close } = await openPage({ hash: "#/learn/0/0", fake: { teacher: { name: "김", classNo: 0 } } });
  await page.waitForSelector('#view [data-act="editTopic"]');
  await page.click('#view [data-act="editTopic"]');
  assert.match(await page.locator("#modalBox h3").innerText(), /내용 수정/);
  await close();
});
