import { test, after } from "node:test";
import assert from "node:assert/strict";
import { openPage, closeAll } from "./harness.mjs";
import { DEFAULTS } from "../js/data.js";
after(closeAll);
const box = (page, sel) => page.locator(sel).boundingBox();

test("home phone layout", async () => {
  const { page, close } = await openPage({ hash: "#/" });
  assert.ok(await page.isVisible("#view .wm"));
  assert.equal((await page.locator(".hcm").innerText()).replace(/\s+/g, " ").trim(), "Ho Chi Minh City");
  assert.equal((await page.locator(".bub p").innerText()).trim(), DEFAULTS.settings.home.desc);
  assert.equal((await page.locator(".dev").innerText()).trim(), "개발자: 10229 조수민, 10524 이동선");
  const b = await box(page, ".bub"), d = await box(page, ".dev"), h = await box(page, ".hcm");
  assert.ok(b.y + b.height < d.y, "bubble overlaps credit");
  assert.ok(h.height <= 120, `title too tall ${h.height}`);
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".hcm")).fontFamily.includes("Forward")), true);
  await close();
});

test("home laptop layout", async () => {
  const { page, close } = await openPage({ hash: "#/", width: 1440, height: 900 });
  const b = await box(page, ".bub"), d = await box(page, ".dev");
  assert.ok(b.x > 720, `bubble x ${b.x}`);
  assert.ok(d.x < 100, `credit x ${d.x}`);
  await close();
});

test("teacher can edit home text", async () => {
  const { page, close } = await openPage({ hash: "#/", fake: { teacher: { name: "김영한", classNo: 0 } } });
  await page.waitForSelector("#view .edit");
  await page.click("#view .edit");
  assert.match(await page.locator("#modalBox h3").innerText(), /메인 소개 글/);
  await close();
});
