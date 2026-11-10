import { createRequire } from "module";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STUBS = path.join(ROOT, "tests", "stubs");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".json": "application/json" };

let server, port, browser;
async function ensure() {
  if (!server) {
    server = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { "content-type": MIME[path.extname(p)] || "application/octet-stream" });
      fs.createReadStream(p).pipe(res);
    });
    await new Promise(r => server.listen(0, "127.0.0.1", r));
    port = server.address().port;
  }
  if (!browser) browser = await chromium.launch();
}

export async function openPage({ width = 390, height = 844, hash = "#/", fake = {}, wait = true, reducedMotion = false } = {}) {
  await ensure();
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: reducedMotion ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  // 나중에 등록한 route가 먼저 처리되므로: 외부 차단을 먼저, Firebase 가짜 모듈을 나중에 등록
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
  await page.route("https://www.gstatic.com/firebasejs/**", route => {
    const name = route.request().url().split("/").pop();
    route.fulfill({ contentType: "text/javascript", body: fs.readFileSync(path.join(STUBS, name), "utf8") });
  });
  page.on("pageerror", e => console.error("[pageerror]", e.message));
  await page.addInitScript(f => { window.__FAKE = f; }, fake);
  await page.goto(`http://127.0.0.1:${port}/index.html${hash}`);
  if (wait) await page.waitForFunction(() => { const v = document.querySelector("#view"); return v && v.children.length && !v.querySelector(":scope > .empty"); }, null, { timeout: 8000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  // 첫 데이터·로그인 이벤트로 화면이 한 번 더 그려지므로(app.js refresh 120ms) 잠깐 기다린다
  if (wait) await page.waitForTimeout(400);
  return { page, close: () => ctx.close() };
}
export async function closeAll() {
  if (browser) await browser.close();
  if (server) server.close();
  browser = server = null;
}
export const noHorizontalScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
export const textHasEmoji = page => page.evaluate(() => {
  const re = /[\p{Extended_Pictographic}\u{1F000}-\u{1FAFF}☀-➿]/gu;
  const txt = document.body.innerText + " " + document.title;
  return [...new Set(txt.match(re) || [])];
});
export const ROUTES = ["#/", "#/schedule", "#/schedule/2", "#/route", "#/route/3", "#/notice", "#/learn", "#/learn/1", "#/quiz", "#/photo", "#/teachers"];
export const LONG_NOTICES = [
  { id: "n1", cls: 0, title: "아주 긴 공지 제목입니다 ".repeat(4), body: "내용".repeat(80), authorName: "김영한", authorUid: "x", pinned: true, createdAt: "2026-11-18T07:30:00+07:00" },
  { id: "n2", cls: 1, title: "버스 좌석 다시 확인", body: "출발 전에 확인해 주세요.", authorName: "배일환", authorUid: "x", createdAt: "2026-11-18T16:04:00+07:00" },
];
export { ROOT };
