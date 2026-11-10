import { $, $$, esc, ls, toast, beep } from "./util.js?v=20261110c";
import * as S from "./store.js?v=20261110c";
import * as P from "./pages.js?v=20261110c";

const PAGES = {
  home: P.pageHome, schedule: P.pageSchedule, route: P.pageRoute, notice: P.pageNotice,
  learn: P.pageLearn, quiz: P.pageQuiz, photo: P.pagePhoto, teachers: P.pageTeachers
};
// 어떤 데이터가 바뀌면 어떤 화면을 다시 그릴지
const DEPS = {
  home: [], schedule: ["schedule", "settings", "auth"], route: ["routes", "schedule", "auth"],
  notice: ["notice", "auth"], learn: ["learn", "auth"], quiz: ["quiz", "auth"], photo: ["auth"], teachers: ["teachers", "auth"]
};
const TITLES = { schedule: "수학여행 일정", route: "이동 경로", notice: "공지 사항", learn: "배워 가기", quiz: "O & X 퀴즈", photo: "포토존", teachers: "10학년부 선생님들 소개" };
const LABELS = { schedule: "일정", routes: "이동 경로", learn: "배워 가기", quiz: "퀴즈", teachers: "선생님 소개", settings: "설정·팀 배정" };

const view = $("#view");
let unread = 0;

/* ---------- 상단 바 ---------- */
// variant: plain(제목+로고) / overlay(사진 위, 햄버거만) / bare(제목 없이 로고만)
export function setTop({ title = "", variant = "plain" } = {}) {
  const bar = $("#topbar");
  bar.className = "tb-" + variant;
  $("#topTitle").textContent = title;
}
const leaves = [];
let cur = "home";
let ready = false;

/* ---------- 오래된 서비스워커 정리 ---------- */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {});
}

/* ---------- 화면 그리기 ---------- */
function render(nav) {
  if (!ready) return;
  const y = window.scrollY;
  const opened = nav ? [] : $$("details[open][data-k]", view).map(d => d.dataset.k);
  leaves.splice(0).forEach(f => { try { f(); } catch (e) {} });

  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  cur = PAGES[parts[0]] ? parts[0] : "home";
  document.body.classList.remove("menu-open");
  $$("#drawer [data-nav]").forEach(a => a.classList.toggle("on", a.dataset.nav === cur));

  setTop({ title: TITLES[cur] || "", variant: cur === "home" ? "overlay" : "plain" });
  if (cur === "notice") { unread = 0; setBadge(); }
  const ctx = { view, args: parts.slice(1), nav: !!nav, leave: f => leaves.push(f), setTop };
  view.onclick = null;
  try { PAGES[cur](ctx); }
  catch (e) {
    console.error(e);
    view.innerHTML = `<div class="page"><div class="banner-warn">화면을 그리다 문제가 생겼어요.<br>${esc(e.message || e)}</div></div>`;
  }
  opened.forEach(k => { const d = view.querySelector(`details[data-k="${k}"]`); if (d) d.open = true; });
  syncEditSwitch();
  window.scrollTo(0, nav ? 0 : y);
}

// 다시 그리기 (팝업이 열려 있으면 닫힌 뒤에)
let dirty = false, tmr = null;
function refresh() {
  clearTimeout(tmr);
  tmr = setTimeout(() => {
    if (!$("#modal").hidden) { dirty = true; return; }
    render(false);
  }, 120);
}
new MutationObserver(() => {
  if ($("#modal").hidden && dirty) { dirty = false; render(false); }
}).observe($("#modal"), { attributes: true, attributeFilter: ["hidden"] });

/* ---------- 메뉴 ---------- */
$("#menuBtn").onclick = () => document.body.classList.toggle("menu-open");
$("#scrim").onclick = () => document.body.classList.remove("menu-open");
$("#drawer").addEventListener("click", e => { if (e.target.closest("a")) document.body.classList.remove("menu-open"); });
window.addEventListener("hashchange", () => render(true));
// 휴대폰 ↔ 노트북 폭을 넘나들면 배치가 다른 화면만 다시 그림 (리스너는 여기 하나만)
window.matchMedia("(min-width: 900px)").addEventListener("change", () => { if (cur === "route" || cur === "learn") render(false); });

/* ---------- 메뉴 아래쪽 (내 반 · 알림 설정 · 로그인) ---------- */
function drawerExtra() {
  const t = S.state.teacher, u = S.state.user;
  const my = ls.get("myclass", 0);
  const who = t ? (t.classNo > 0 ? t.classNo + "반" : t.classNo === 0 ? "(전체 관리자)" : "") : "";
  $("#drawerExtra").innerHTML = `
    <label class="dx">내 반
      <select id="dxClass"><option value="0">선택 안 함</option>${[1, 2, 3, 4, 5, 6].map(c => `<option value="${c}" ${c === my ? "selected" : ""}>${c}반</option>`).join("")}</select>
    </label>
    <label class="dx chk"><input type="checkbox" id="dxAlert" ${ls.get("alert", true) ? "checked" : ""}> 새 공지 알림 소리·진동</label>
    <label class="dx chk"><input type="checkbox" id="dxMine" ${ls.get("onlymine", false) ? "checked" : ""}> 내 반 + 공통 공지만 알림</label>
    <hr>
    ${t ? `
      <div class="dx-user">${esc(t.name)} 선생님 ${who}</div>
      <label class="dx chk sw-row">편집 모드 <button class="switch" role="switch" aria-checked="${S.state.editMode}" aria-label="편집 모드" data-toggle-edit></button></label>
      <button class="btn ghost" id="dxOut">로그아웃</button>`
    : u ? `
      <div class="banner-warn">로그인은 됐지만 교사로 등록되지 않았어요. (Firestore의 teachers 문서를 확인하세요)</div>
      <button class="btn ghost" id="dxOut">로그아웃</button>`
    : `
      <form id="dxLogin">
        <label class="dx">교사 및 관리자 로그인
          <input id="dxEmail" type="text" placeholder="아이디 (예: t1@kish.app)" autocapitalize="none" autocomplete="username">
          <input id="dxPw" type="password" placeholder="비밀번호" autocomplete="current-password" style="margin-top:6px">
        </label>
        <button class="btn primary" type="submit">로그인</button>
      </form>`}`;

  $("#dxClass").onchange = e => { ls.set("myclass", Number(e.target.value)); refresh(); };
  $("#dxAlert").onchange = e => ls.set("alert", e.target.checked);
  $("#dxMine").onchange = e => ls.set("onlymine", e.target.checked);
  const outBtn = $("#dxOut"); if (outBtn) outBtn.onclick = () => { S.logout(); toast("로그아웃했어요", 2000); };
  const form = $("#dxLogin");
  if (form) form.onsubmit = async e => {
    e.preventDefault();
    try {
      await S.login($("#dxEmail").value.trim(), $("#dxPw").value);
      document.body.classList.remove("menu-open");
      toast("로그인했어요", 2000);
    } catch (err) {
      alert("로그인하지 못했어요. 아이디와 비밀번호를 확인해 주세요.\n(" + (err.code || err.message) + ")");
    }
  };
}

function adminBar() {
  const t = S.state.teacher;
  $("#adminbar").hidden = !(t && S.state.editMode);   // 편집 모드가 켜져 있을 때만 아래 띠 표시
  document.body.classList.toggle("editing", !!(t && S.state.editMode));
  if (t) $("#adminText").textContent = `편집 모드 켜짐 · ${t.name} 선생님`;
}

/* ---------- 편집 모드 스위치 (홈·메뉴·아래 띠) ---------- */
const wantEdit = () => ls.get("editmode", false);   // 기본은 꺼짐, 마지막 선택을 기억
function toggleEdit() {
  const v = !S.state.editMode;
  ls.set("editmode", v);
  S.setEditMode(v);
}
function syncEditSwitch() {
  const t = !!S.state.teacher;
  $$(".edit-switch").forEach(el => { el.hidden = !t; });
  $$("[data-toggle-edit]").forEach(b => b.setAttribute("aria-checked", String(!!S.state.editMode)));
}
document.addEventListener("click", e => {
  if (e.target.closest("[data-toggle-edit]")) { e.preventDefault(); toggleEdit(); }
});
$("#adminToggle").onclick = toggleEdit;

/* ---------- 알림 (사이트가 열려 있을 때) ---------- */
let flashT = null;
const baseTitle = document.title;
function setBadge() {
  $("#menuDot").hidden = unread <= 0;
  $('#drawer [data-nav="notice"] .dot').hidden = unread <= 0;
}
function flash(msg) {
  if (!document.hidden) return;
  clearInterval(flashT);
  let on = false;
  flashT = setInterval(() => { document.title = (on = !on) ? msg : baseTitle; }, 1000);
}
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) { clearInterval(flashT); document.title = baseTitle; }
});

S.on("notice", n => {
  const my = ls.get("myclass", 0);
  if (ls.get("onlymine", false) && my && n.cls !== 0 && n.cls !== my) return;
  if (cur !== "notice") { unread++; setBadge(); }
  toast("새 공지: " + n.title, 6000);
  if (ls.get("alert", true)) {
    beep();
    try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {}
  }
  flash("새 공지가 있어요!");
});
S.on("content", ({ id, by }) => {
  toast(`${LABELS[id] || id}이(가) 업데이트되었어요${by ? " (" + by + ")" : ""}`, 4000);
});

/* ---------- 데이터가 바뀌면 화면 갱신 ---------- */
S.on("data", ev => {
  const key = ev && ev.src === "content" ? ev.id : ev && ev.src;
  if ((DEPS[cur] || []).includes(key)) refresh();
});
S.on("auth", () => {
  // store.js 는 로그인하면 편집 모드를 켜므로, 저장된 선택(기본 꺼짐)으로 맞춘다
  if (S.state.teacher && S.state.editMode !== wantEdit()) { S.setEditMode(wantEdit()); return; }
  drawerExtra(); adminBar(); syncEditSwitch();
  if (S.state.user && !S.state.teacher) toast("로그인은 됐지만 교사로 등록되지 않은 계정이에요.", 7000);
});
S.on("ready", () => { ready = true; render(true); });

// 일정의 "지금" 표시를 1분마다 갱신
setInterval(() => { if (cur === "schedule") refresh(); }, 60000);

/* ---------- 시작 ---------- */
view.innerHTML = '<div class="empty">불러오는 중…</div>';
drawerExtra();
adminBar();
S.init();
