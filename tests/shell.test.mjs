import { test, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { openPage, closeAll, noHorizontalScroll, textHasEmoji, ROUTES, LONG_NOTICES, ROOT } from "./harness.mjs";
after(closeAll);

const sha = f => crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, f))).digest("hex");

test("store files untouched", () => {
  assert.equal(sha("js/store.js"), "25167e31cc7cbcffbbaf189fde14dd0325383628909c38dfe768d2f0623ce5fb");
  assert.equal(sha("js/firebase-config.js"), "18641e1cf14fabd775de0aef6ce6bace2271d8d901eb3debbf8ee7e4b0647c3e");
});

for (const [w, h] of [[390, 844], [1440, 900]]) {
  test(`every route renders ${w}`, async () => {
    for (const hash of ROUTES) {
      const { page, close } = await openPage({ width: w, height: h, hash, fake: { notices: LONG_NOTICES } });
      const txt = await page.locator("#view").innerText();
      assert.ok(txt.trim().length > 0, `${hash} empty`);
      assert.ok(!txt.includes("문제가 생겼어요"), `${hash} crashed: ${txt.slice(0, 200)}`);
      await close();
    }
  });
}

test("no horizontal scroll at 390", async () => {
  for (const hash of ROUTES) {
    const { page, close } = await openPage({ hash, fake: { notices: LONG_NOTICES } });
    assert.ok(await noHorizontalScroll(page), `${hash} scrolls sideways`);
    await close();
  }
});

test("no emoji", async () => {
  const bad = {};
  for (const hash of ROUTES) {
    const { page, close } = await openPage({ hash, fake: { notices: LONG_NOTICES } });
    const e = await textHasEmoji(page);
    if (e.length) bad[hash] = e.join("");
    await close();
  }
  assert.deepEqual(bad, {});
});

test("offline defaults", async () => {
  const { page, close } = await openPage({ hash: "#/schedule/1", fake: { offline: true }, wait: false });
  await page.waitForFunction(() => document.querySelector("#view").innerText.includes("통일궁"), null, { timeout: 5000 });
  await page.goto(page.url().replace(/#.*/, "#/notice"));
  await page.waitForTimeout(3500);
  assert.match(await page.locator("#view").innerText(), /불러오는 중/);
  await close();
});
