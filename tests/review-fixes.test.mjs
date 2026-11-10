import { test, after } from "node:test";
import assert from "node:assert/strict";
import { openPage, closeAll, noHorizontalScroll } from "./harness.mjs";
import { DEFAULTS } from "../js/data.js";
after(closeAll);
const T = { name: "김영한", classNo: 0 };
const URL = "집결 위치: https://maps.app.goo.gl/AbCdEfGhIjKlMnOpQrStUv12345AbCdEfGhIjKlMnOpQrStUv";
const clone = o => JSON.parse(JSON.stringify(o));

test("crossing the laptop width does not multiply re-renders", async () => {
  for (const hash of ["#/route/1", "#/learn/1"]) {
    const { page, close } = await openPage({ hash });
    await page.evaluate(() => { window.__renders = 0; new MutationObserver(() => window.__renders++).observe(document.querySelector("#view"), { childList: true }); });
    for (let i = 0; i < 6; i++) { await page.setViewportSize({ width: i % 2 ? 390 : 1440, height: 844 }); await page.waitForTimeout(120); }
    const n = await page.evaluate(() => window.__renders);
    assert.ok(n <= 6, `${hash}: ${n} re-renders for 6 crossings`);
    await close();
  }
});

test("long URLs in teacher text do not cause sideways scroll", async () => {
  const sch = clone(DEFAULTS.schedule); sch[1].items[0].desc = URL; sch[1].title = URL;
  const learn = clone(DEFAULTS.learn); learn[1].topics[0].body = URL;
  const teachers = clone(DEFAULTS.teachers); teachers[0].intro = URL;
  const quiz = DEFAULTS.quiz.map(q => ({ ...q, q: URL, exp: URL }));
  const fake = { content: { schedule: sch, learn, teachers, quiz } };
  for (const hash of ["#/schedule/2", "#/learn/1/0", "#/teachers"]) {
    const { page, close } = await openPage({ hash, fake });
    assert.ok(await noHorizontalScroll(page), hash);
    await close();
  }
  const { page, close } = await openPage({ hash: "#/quiz", fake });
  await page.click('[data-act="start"]'); await page.click('.ox [data-v="1"]');
  assert.ok(await noHorizontalScroll(page), "quiz");
  await close();
});

test("save toast has no emoji", async () => {
  const { page, close } = await openPage({ hash: "#/", fake: { teacher: T } });
  await page.click('#view [data-act="editHome"]');
  await page.click("#mfSave");
  await page.waitForSelector("#toasts .toast");
  const t = await page.locator("#toasts").innerText();
  assert.doesNotMatch(t, /[\p{Extended_Pictographic}]/u, t);
  await close();
});

test("padlet link must be http(s)", async () => {
  const { page, close } = await openPage({ hash: "#/photo", fake: { content: { settings: { home: { desc: "x" }, teams: {}, padlet: "javascript:alert(1)" } } } });
  assert.equal(await page.locator("#view a.pbtn").count(), 0);
  assert.equal(await page.locator("#view .pbtn.off").count(), 1);
  await close();
});

test("missing route image does not show a broken icon", async () => {
  const routes = clone(DEFAULTS.routes); routes[0].img = "assets/routes/day1.png";
  const { page, close } = await openPage({ hash: "#/route/1/0", fake: { content: { routes } } });
  await page.waitForTimeout(300);
  const broken = await page.$$eval("#view img", imgs => imgs.filter(i => i.complete && i.naturalWidth === 0 && i.offsetParent !== null).length);
  assert.equal(broken, 0);
  await close();
});

test("line breaks in teacher text are kept", async () => {
  const learn = clone(DEFAULTS.learn); learn[1].topics[0].body = "첫 줄\n둘째 줄";
  const { page, close } = await openPage({ hash: "#/learn/1/0", fake: { content: { learn } } });
  assert.match(await page.locator("#view .exp p").innerText(), /첫 줄\n둘째 줄/);
  await close();
});

test("quiz scores are escaped", async () => {
  const scores = [{ id: "x", name: "a", cls: 1, score: "<img src=x>", total: "<b>10</b>" }];
  const { page, close } = await openPage({ hash: "#/quiz", fake: { scores } });
  assert.equal(await page.locator("#view .rank img, #view .rank b").count(), 0);
  await close();
});
