import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { openPage, closeAll, ROOT } from "./harness.mjs";
import { CITY_INTRO } from "../js/data.js";
after(closeAll);
const OLD = { settings: { home: { desc: "호치민과 붕따우에서 보내는 2박 3일! (테스트 메시지)" }, teams: {} } };

test("school logo is a clean circle (no white halo)", async () => {
  const { page, close } = await openPage({ hash: "#/schedule" });
  const r = await page.evaluate(async () => {
    const img = new Image(); img.src = "assets/logo.png"; await img.decode();
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const g = c.getContext("2d"); g.drawImage(img, 0, 0);
    const a = (x, y) => g.getImageData(Math.round(x), Math.round(y), 1, 1).data[3];
    const w = img.width, R = w / 2, k = Math.SQRT1_2;
    return { corner: a(1, 1), diag: a(R - (R + 2) * k, R - (R + 2) * k), edgeOut: a(R, 0), center: a(R, R), ring: a(R, 4) };
  });
  assert.equal(r.corner, 0); assert.ok(r.diag <= 10, `diag ${r.diag}`);
  assert.equal(r.center, 255); assert.ok(r.ring >= 250, `ring ${r.ring}`);
  await close();
});

test("speech bubble always shows the Ho Chi Minh intro", async () => {
  const { page, close } = await openPage({ hash: "#/", fake: { content: OLD, teacher: { name: "김", classNo: 0 } } });
  assert.equal((await page.locator(".bub p").innerText()).trim(), CITY_INTRO);
  assert.equal(await page.locator('#view [data-act="editHome"]').count(), 0);
  await close();
});

test("login label says teachers and admins", async () => {
  const { page, close } = await openPage({ hash: "#/schedule" });
  assert.match(await page.locator("#drawerExtra").innerText(), /교사 및 관리자 로그인/);
  await close();
});

test("title types in on first visit only", async () => {
  const { page, close } = await openPage({ hash: "#/" });
  assert.equal((await page.locator(".hcm").innerText()).replace(/\s+/g, " ").trim(), "Ho Chi Minh City");
  assert.ok(await page.locator(".hcm.typing").count() === 1, "typing class on first visit");
  const delays = await page.$$eval(".hcm .ch", s => s.map(e => getComputedStyle(e).animationDelay));
  assert.ok(delays.length >= 13 && new Set(delays).size > 5, "letters appear one by one");
  await page.evaluate(() => (location.hash = "#/schedule"));
  await page.waitForTimeout(300);
  await page.evaluate(() => (location.hash = "#/"));
  await page.waitForTimeout(300);
  assert.equal(await page.locator(".hcm.typing").count(), 0, "no replay");
  await close();
});

test("reduced motion skips typing", async () => {
  const { page, close } = await openPage({ hash: "#/", reducedMotion: true });
  assert.equal(await page.locator(".hcm .ch").first().evaluate(e => getComputedStyle(e).opacity), "1");
  await close();
});

test("teachers page is named 10학년부 선생님들 소개", async () => {
  const { page, close } = await openPage({ hash: "#/teachers" });
  assert.equal((await page.locator("#topTitle").innerText()).trim(), "10학년부 선생님들 소개");
  assert.match(await page.locator('#drawer [data-nav="teachers"]').innerText(), /10학년부 선생님들 소개/);
  await close();
});

test("laptop home: wordmark centred, bigger credit", async () => {
  const { page, close } = await openPage({ hash: "#/", width: 1440, height: 900 });
  const b = await page.locator(".home .wm").boundingBox();
  assert.ok(Math.abs(b.x + b.width / 2 - 720) <= 20, `wordmark centre ${b.x + b.width / 2}`);
  assert.ok(parseFloat(await page.locator(".home .dev").evaluate(e => getComputedStyle(e).fontSize)) >= 16);
  await close();
});

test("phone home: credit is bold", async () => {
  const { page, close } = await openPage({ hash: "#/" });
  assert.equal(await page.locator(".home .dev").evaluate(e => getComputedStyle(e).fontWeight), "700");
  await close();
});

test("files carry a version so phones fetch the new design", () => {
  const html = fs.readFileSync(`${ROOT}/index.html`, "utf8");
  const v = (html.match(/css\/style\.css\?v=([\w.-]+)/) || [])[1];
  assert.ok(v, "css has ?v=");
  assert.ok(html.includes(`js/app.js?v=${v}`));
  for (const f of ["js/app.js", "js/pages.js"]) {
    const src = fs.readFileSync(`${ROOT}/${f}`, "utf8");
    for (const m of src.matchAll(/from "\.\/([\w-]+\.js)(\?v=[\w.-]+)?"/g)) assert.equal(m[2], `?v=${v}`, `${f} imports ${m[1]} without ?v=${v}`);
  }
});
