import { test, after } from "node:test";
import assert from "node:assert/strict";
import { openPage, closeAll } from "./harness.mjs";
import { pickRound } from "../js/quiz.js";
import { DEFAULTS } from "../js/data.js";
after(closeAll);

test("question bank has 30 balanced questions", () => {
  const q = DEFAULTS.quiz;
  assert.equal(q.length, 30);
  const o = q.filter(x => x.a === true).length;
  assert.ok(o >= 14 && o <= 16, `O count ${o}`);
  for (const p of ["palace", "war", "history"]) assert.equal(q.filter(x => x.place === p).length, 10, p);
  for (const x of q) assert.ok(x.q && x.exp && typeof x.a === "boolean");
});

test("pickRound gives 10 distinct with at least 3 per place", () => {
  for (let i = 0; i < 1000; i++) {
    const r = pickRound(DEFAULTS.quiz);
    assert.equal(r.length, 10);
    assert.equal(new Set(r).size, 10);
    for (const p of ["palace", "war", "history"]) assert.ok(r.filter(x => x.place === p).length >= 3);
  }
});

test("pickRound handles small banks without place", () => {
  const bank = [{ q: "a", a: true }, { q: "b", a: false }];
  assert.equal(pickRound(bank).length, 2);
});

test("playing a question gives feedback", async () => {
  const { page, close } = await openPage({ hash: "#/quiz" });
  await page.click('#view [data-act="start"]');
  assert.match(await page.locator("#view .qn").innerText(), /^1 \/ 10/);
  await page.click('#view .ox [data-v="1"]');
  assert.match(await page.locator("#view .fb").innerText(), /정답이에요|아쉬워요/);
  await close();
});

test("ranking list with top three bold", async () => {
  const scores = [1, 2, 3, 4].map(i => ({ id: "s" + i, name: "학생" + i, cls: i, score: 11 - i, total: 10 }));
  const { page, close } = await openPage({ hash: "#/quiz", fake: { scores } });
  assert.equal(await page.locator("#view .rank li").count(), 4);
  assert.equal(await page.locator("#view .rank li").first().evaluate(e => getComputedStyle(e).fontWeight), "700");
  await close();
});

test("question and ranking side by side on laptop", async () => {
  const { page, close } = await openPage({ hash: "#/quiz", width: 1440, height: 900 });
  const a = await page.locator("#view .qcard").boundingBox(), b = await page.locator("#view .rankbox").boundingBox();
  assert.ok(Math.abs(a.y - b.y) < 40, `${a.y} ${b.y}`);
  await close();
});
