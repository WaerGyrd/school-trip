import { test, after } from "node:test";
import assert from "node:assert/strict";
import { openPage, closeAll } from "./harness.mjs";
after(closeAll);
const URL = "https://www.instagram.com/kish10_trip/";

test("photo zone became the support team's Instagram", async () => {
  const { page, close } = await openPage({ hash: "#/photo" });
  assert.equal((await page.locator("#topTitle").innerText()).trim(), "지원단 인스타그램");
  assert.match(await page.locator("#view").innerText(), /수학여행 지원단 인스타그램/);
  const qr = page.locator('#view img.ig-qr');
  assert.equal(await qr.getAttribute("src"), "assets/instagram-qr.png");
  assert.ok(await qr.evaluate(i => i.complete && i.naturalWidth > 0));
  assert.equal((await page.locator("#view .ig-id").innerText()).trim(), "@kish10_trip");
  const a = page.locator("#view a.ig-go");
  assert.equal(await a.getAttribute("href"), URL);
  assert.equal(await a.getAttribute("target"), "_blank");
  assert.doesNotMatch(await page.locator("#view").innerText(), /패들렛/);
  assert.match(await page.locator("#view .ig-txt").innerText(), /수학여행 일정과 이벤트가 여기서 공지됩니다\./);
  await close();
});

test("menu says 지원단 인스타그램", async () => {
  const { page, close } = await openPage({ hash: "#/schedule" });
  assert.match(await page.locator('#drawer [data-nav="photo"]').innerText(), /지원단 인스타그램/);
  await close();
});
