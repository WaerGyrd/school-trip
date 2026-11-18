import { test, after } from "node:test";
import assert from "node:assert/strict";
import { openPage, closeAll, noHorizontalScroll, textHasEmoji } from "./harness.mjs";
after(closeAll);
const ORDER = ["김영한", "배일환", "조지용", "이수선", "이재이", "한현", "김영훈"];

test("students see all 7 teacher cards in order, with picture and traits", async () => {
  const { page, close } = await openPage({ hash: "#/teachers" });
  assert.equal(await page.locator("#view .wip-sign").count(), 0, "sign removed");
  const cards = page.locator("#view .tcard");
  assert.equal(await cards.count(), 7);
  assert.deepEqual(await cards.locator("h3").allInnerTexts(), ORDER);
  assert.match(await cards.nth(0).innerText(), /워커홀릭[\s\S]*한국사 원탑/);
  assert.match(await cards.nth(6).innerText(), /별명 풔니후니[\s\S]*릴스 챌린저/);
  assert.doesNotMatch(await cards.nth(6).innerText(), /이유 모름/);
  assert.equal(await page.locator("#view .tc-like").count(), 0, "no like buttons");
  const imgs = await page.locator("#view .tcard img").evaluateAll(a => a.map(i => i.complete && i.naturalWidth > 0));
  assert.deepEqual(imgs, Array(7).fill(true), "all characters load");
  const bgs = await cards.evaluateAll(a => a.map(c => getComputedStyle(c).backgroundColor));
  assert.equal(new Set(bgs).size, 7, "each teacher has their own colour");
  assert.equal(await cards.nth(2).locator(".tc-traits svg").count(), 1, "heart drawn as an icon");
  assert.deepEqual(await textHasEmoji(page), []);
  assert.ok(await noHorizontalScroll(page));
  await close();
});


test("PC shows the cards two per row", async () => {
  const { page, close } = await openPage({ hash: "#/teachers", width: 1440, height: 900 });
  const [a, b, c] = await Promise.all([0, 1, 2].map(i => page.locator(".tcard").nth(i).boundingBox()));
  assert.equal(Math.round(a.y), Math.round(b.y));
  assert.ok(c.y > a.y + a.height - 1);
  assert.ok(a.width >= 480, `card width ${a.width}`);
  await close();
});
