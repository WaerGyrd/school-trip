import { test, after } from "node:test";
import assert from "node:assert/strict";
import { openPage, closeAll } from "./harness.mjs";
after(closeAll);
const T = { name: "김영한", classNo: 0 };
const overlap = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

test("PC: credit stays in the same place when a teacher signs in", async () => {
  const s = await openPage({ hash: "#/", width: 1440, height: 900 });
  const plain = await s.page.locator(".home .dev").boundingBox();
  await s.close();
  const t = await openPage({ hash: "#/", width: 1440, height: 900, fake: { teacher: T, edit: false } });
  assert.ok(await t.page.evaluate(() => document.body.classList.contains("teacher") && !document.body.classList.contains("editing")));
  const dev = await t.page.locator(".home .dev").boundingBox();
  assert.ok(Math.abs(dev.y - plain.y) <= 1 && Math.abs(dev.x - plain.x) <= 1, `student ${plain.y}, teacher ${dev.y}`);
  const pill = await t.page.locator(".stats-pill").boundingBox();
  assert.ok(!overlap(dev, pill), "stats button does not cover the credit");
  await t.close();
});

test("PC editing: stats button and credit don't collide", async () => {
  const t = await openPage({ hash: "#/", width: 1440, height: 900, fake: { teacher: T } });
  assert.ok(await t.page.evaluate(() => document.body.classList.contains("editing")), "edit mode on");
  const dev = await t.page.locator(".home .dev").boundingBox(), pill = await t.page.locator(".stats-pill").boundingBox();
  assert.ok(!overlap(dev, pill));
  const bar = await t.page.locator("#adminbar").boundingBox();
  if (bar && bar.height) assert.ok(dev.y + dev.height <= bar.y);
  await t.close();
});

test("edit bar says only '선생님', never the account name", async () => {
  const t = await openPage({ hash: "#/", fake: { teacher: { name: "홍길동", classNo: 0 } } });
  assert.equal((await t.page.locator("#adminText").innerText()).trim(), "편집 모드 켜짐 · 선생님");
  await t.close();
});
