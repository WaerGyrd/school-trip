import { test, after } from "node:test";
import assert from "node:assert/strict";
import { openPage, closeAll } from "./harness.mjs";
import { fmtNoticeTime } from "../js/util.js";
after(closeAll);
const N = [
  { id: "a", cls: 0, title: "담임 선생님 비상 연락망", body: "비상시 연락", authorName: "김영한", authorUid: "t1", pinned: true, createdAt: "2026-11-18T07:30:00+07:00" },
  { id: "b", cls: 1, title: "버스 좌석 확인", body: "확인해 주세요", authorName: "배일환", authorUid: "x", createdAt: "2026-11-18T16:04:00+07:00" },
  { id: "c", cls: 2, title: "이거 누구꺼", body: "<img src=x onerror=alert(1)>", authorName: "조지용", authorUid: "x", createdAt: "2026-11-18T13:04:00+07:00" },
];

test("notice time format", () => {
  assert.equal(fmtNoticeTime({ toDate: () => new Date("2026-11-18T16:04:00+07:00") }), "26년 11월 18일 16:04");
  assert.equal(fmtNoticeTime(null), "방금");
});

test("all notices with pinned first and class badges", async () => {
  const { page, close } = await openPage({ hash: "#/notice", fake: { notices: N } });
  assert.match(await page.locator("#view .stitle").innerText(), /최근 공지 사항/);
  const cards = page.locator("#view .ntc");
  assert.equal(await cards.count(), 3);
  assert.ok(await cards.first().evaluate(e => e.classList.contains("pin")));
  const b1 = page.locator("#view .ntc .b-1");
  assert.equal(await b1.evaluate(e => getComputedStyle(e).backgroundColor), "rgb(184, 149, 46)");
  assert.equal(await cards.nth(1).evaluate(e => getComputedStyle(e).backgroundColor), "rgb(255, 255, 255)");
  assert.match(await cards.nth(1).innerText(), /1반 배일환 선생님/);
  assert.match(await cards.first().innerText(), /26년 11월 18일 07:30/);
  await close();
});

test("class filter shows common + that class", async () => {
  const { page, close } = await openPage({ hash: "#/notice/2", fake: { notices: N } });
  assert.match(await page.locator("#view .stitle").innerText(), /10-2 공지사항/);
  assert.equal(await page.locator("#view .ntc").count(), 2);
  assert.equal(await page.getAttribute("#view .chips a.on", "href"), "#/notice");
  await close();
});

test("notice html is shown as text", async () => {
  const { page, close } = await openPage({ hash: "#/notice", fake: { notices: N } });
  assert.equal(await page.locator("#view .ntc img").count(), 0);
  assert.match(await page.locator("#view").innerText(), /<img src=x/);
  await close();
});

test("two columns on laptop", async () => {
  const { page, close } = await openPage({ hash: "#/notice", width: 1440, height: 900, fake: { notices: N } });
  const ys = await page.$$eval("#view .ntc", e => e.map(x => Math.round(x.getBoundingClientRect().top)));
  assert.equal(ys[0], ys[1]);
  await close();
});

test("teacher can write and edit own notice", async () => {
  const { page, close } = await openPage({ hash: "#/notice", fake: { notices: N, teacher: { name: "김영한", classNo: 0 } } });
  await page.waitForSelector('#view [data-act="newN"]');
  assert.ok(await page.isVisible('#view .ntc.pin [data-act="editN"]'));
  assert.ok(await page.isVisible('#view .ntc.pin [data-act="delN"]'));
  await close();
});
