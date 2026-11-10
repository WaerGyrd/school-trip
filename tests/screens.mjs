// 모든 화면을 휴대폰(390×844)·노트북(1440×900)으로 찍어서 out 폴더에 저장한다.
// 사용: node tests/screens.mjs <저장 폴더>
import fs from "fs";
import { openPage, closeAll } from "./harness.mjs";
const out = process.argv[2] || "screens";
fs.mkdirSync(out, { recursive: true });
const notices = [
  { id: "a", cls: 0, title: "담임 선생님 비상 연락망", body: "비상시에 담임 선생님께 연락하세요.", authorName: "김영한", authorUid: "x", pinned: true, createdAt: "2026-11-18T07:30:00+07:00" },
  { id: "b", cls: 1, title: "버스 좌석 다시 확인", body: "출발 전에 짝꿍이랑 같이 앉았는지 확인하고 담임 선생님께 알려주세요.", authorName: "배일환", authorUid: "x", createdAt: "2026-11-18T16:04:00+07:00" },
  { id: "c", cls: 2, title: "이거 누구꺼", body: "버스 좌석에 에어팟이 있었어요. 본인 거면 선생님께 찾아오세요!", authorName: "조지용", authorUid: "x", createdAt: "2026-11-18T13:04:00+07:00" },
  { id: "d", cls: 0, title: "소지품 챙기세요", body: "버스에 놓고 내리는 물건이 없게 꼼꼼히 체크하고 내리세요.", authorName: "김영한", authorUid: "x", createdAt: "2026-11-18T13:00:00+07:00" }
];
const scores = ["김OO", "이OO", "박OO", "최OO", "정OO"].map((n, i) => ({ id: "s" + i, name: n, cls: [2, 5, 1, 3, 6][i], score: [10, 9, 9, 8, 7][i], total: 10 }));
const SCREENS = [["home", "#/"], ["menu", "#/schedule"], ["schedule", "#/schedule"], ["schedule-day", "#/schedule/2"], ["route", "#/route/3/0"], ["notice", "#/notice"], ["learn", "#/learn"], ["place", "#/learn/1/0"], ["quiz", "#/quiz"], ["quiz-play", "#/quiz"], ["photo", "#/photo"], ["teachers", "#/teachers"], ["teacher-mode", "#/schedule/2"]];
for (const [w, h, tag] of [[390, 844, "p"], [1440, 900, "l"]]) {
  for (const [name, hash] of SCREENS) {
    if (tag === "l" && name === "menu") continue;
    const fake = { notices, scores, ...(name === "teacher-mode" ? { teacher: { name: "김영한", classNo: 0 } } : {}) };
    const { page, close } = await openPage({ width: w, height: h, hash, fake });
    if (name === "menu") { await page.click("#menuBtn"); await page.waitForTimeout(350); }
    if (name === "quiz-play") { await page.click('[data-act="start"]'); await page.click('.ox [data-v="1"]'); }
    if (name === "teacher-mode") await page.waitForSelector("#adminbar:not([hidden])");
    await page.screenshot({ path: `${out}/${tag}-${name}.png` });
    await close();
  }
}
await closeAll();
console.log("saved to", out);
