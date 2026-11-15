import { test, after } from "node:test";
import assert from "node:assert/strict";
import { openPage, closeAll, noHorizontalScroll, textHasEmoji } from "./harness.mjs";
after(closeAll);

test("students see a 'coming soon' sign instead of the teacher cards", async () => {
  const { page, close } = await openPage({ hash: "#/teachers" });
  assert.equal(await page.locator("#view .tc").count(), 0, "cards hidden");
  const sign = page.locator("#view .wip-sign");
  assert.equal(await sign.count(), 1);
  assert.match(await sign.innerText(), /제작 중이에요/);
  const art = page.locator("#view .wip-art img");
  assert.equal(await art.getAttribute("src"), "assets/teachers-ppg.jpg");
  assert.ok(await art.evaluate(i => i.complete && i.naturalWidth > 0), "illustration loads");
  assert.equal(await sign.evaluate(e => getComputedStyle(e).backgroundImage), "none", "no gradient");
  assert.ok(await noHorizontalScroll(page));
  assert.deepEqual(await textHasEmoji(page), []);
  await close();
});

test("teachers still see the cards, not the sign", async () => {
  const { page, close } = await openPage({ hash: "#/teachers", fake: { teacher: { name: "김영한", classNo: 0 } } });
  assert.equal(await page.locator("#view .wip-sign").count(), 0);
  assert.equal(await page.locator("#view .tc").count(), 7);
  await close();
});

test("laptop home: developer credit is large and white", async () => {
  const { page, close } = await openPage({ hash: "#/", width: 1440, height: 900 });
  const st = await page.locator(".home .dev").evaluate(e => { const c = getComputedStyle(e); return { fs: parseFloat(c.fontSize), color: c.color }; });
  assert.ok(st.fs >= 22, `font ${st.fs}`);
  assert.equal(st.color, "rgb(255, 255, 255)");
  await close();
});
