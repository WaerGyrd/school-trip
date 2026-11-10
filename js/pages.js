import { $, esc, hashNum, ls, toast, vnNow, fmtTime, fmtNoticeTime, openForm, openModal, closeModal, compressImage } from "./util.js";
import * as S from "./store.js";
import { icon } from "./icons.js";
import { pickRound } from "./quiz.js";

const clone = o => JSON.parse(JSON.stringify(o));
const ed = () => S.isEditing();
const enc = encodeURIComponent;
const CLASSES = [1, 2, 3, 4, 5, 6];

/* ---------- 공통 도구 ---------- */
function bind(ctx, acts) {
  ctx.view.onclick = e => {
    const b = e.target.closest("[data-act]");
    if (!b || !ctx.view.contains(b)) return;
    const fn = acts[b.dataset.act];
    if (fn) { e.preventDefault(); fn(b.dataset, b); }
  };
}
function page(ctx, html, acts = {}) {
  ctx.view.innerHTML = `<div class="page">${html}</div>`;
  bind(ctx, acts);
}
async function save(id, val) {
  try { await S.saveContent(id, val); toast("저장했어요 ✅", 2000); return true; }
  catch (e) { alert("저장하지 못했어요.\n" + (e.message || e)); return false; }
}
const mut = (id, fn) => { const a = clone(S.get(id)); fn(a); return save(id, a); };
async function doReset(id) {
  if (!S.isOverridden(id)) return alert("이미 기본값이에요.");
  if (!confirm("이 페이지의 수정 내용을 모두 지우고 기본값으로 되돌릴까요?")) return;
  try { await S.resetContent(id); toast("기본값으로 되돌렸어요", 2000); } catch (e) { alert(e.message || e); }
}
const resetBar = id => ed() ? `<div class="resetbar"><button class="mini danger" data-act="reset" data-id="${id}">기본값으로 되돌리기</button></div>` : "";
const addBtn = (act, label) => ed() ? `<div class="addbar"><button class="btn ghost" data-act="${act}">${label}</button></div>` : "";
const pen = (act, attrs = "") => ed() ? `<button class="edit" data-act="${act}" ${attrs}>수정</button>` : "";
const offlineBanner = () => S.configured ? "" : `<div class="banner-warn">아직 Firebase가 연결되지 않았어요. 연결하기 전에는 이 기능을 쓸 수 없어요.</div>`;

const dayIndex = (days, arg) => {
  let di = parseInt(arg, 10);
  if (!(di >= 1 && di <= days.length)) {
    const t = days.findIndex(d => d.date === vnNow().date);
    di = t >= 0 ? t + 1 : 1;
  }
  return di;
};

/* ---------- 메인 ---------- */
export function pageHome(ctx) {
  ctx.setTop({ variant: "overlay" });
  const st = S.settings();
  ctx.view.innerHTML = `
    <section class="home">
      <img class="wm" src="assets/kish-wordmark.png" alt="KISH 10학년 수학여행" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'wm wm-txt',textContent:'KISH 10학년 수학여행'}))">
      <div class="hcm">Ho Chi<br>Minh City</div>
      <div class="bub"><img src="assets/logo.png" alt="" onerror="this.remove()"><p>${esc(st.home.desc)}</p></div>
      ${ed() ? '<div class="home-edit">' + pen("editHome") + "</div>" : ""}
      <div class="dev">개발자: 10229 조수민, 10524 이동선</div>
    </section>`;
  bind(ctx, {
    editHome: () => openForm({
      title: "메인 소개 글",
      fields: [{ k: "desc", label: "소개 글", type: "textarea", rows: 5 }],
      values: { desc: st.home.desc },
      onSave: v => { const cur = S.settings(); return save("settings", { ...cur, home: { ...cur.home, desc: v.desc } }); }
    })
  });
}

/* ---------- 일정 ---------- */
const TEAM_OPTS = [["all", "공통(모두)"], ["A", "A팀"], ["B", "B팀"], ["tbd", "미정"]];
const ITEM_FIELDS = [
  { k: "t", label: "시작 시간", type: "time", req: true },
  { k: "e", label: "끝나는 시간", type: "time" },
  { k: "title", label: "제목", req: true },
  { k: "desc", label: "설명", type: "textarea", rows: 3 },
  { k: "team", label: "대상", type: "select", options: TEAM_OPTS }
];
const DAY_FIELDS = [
  { k: "label", label: "날짜 표시 (예: 11/18 (수))", req: true },
  { k: "title", label: "큰 제목 (예: 붕따우)", req: true },
  { k: "summary", label: "일정 티켓에 보일 주요 장소" },
  { k: "tagline", label: "상세 화면 한 줄 설명" },
  { k: "info", label: "안내 문구", type: "textarea", rows: 3 }
];
const WEEK = { "월": "월요일", "화": "화요일", "수": "수요일", "목": "목요일", "금": "금요일", "토": "토요일", "일": "일요일" };
const DAY_COLOR = ["var(--d1)", "var(--d2)", "var(--d3)"];
const DAY_LIGHT = ["var(--d1l)", "var(--d2l)", "var(--d3l)"];
// 예전에 저장된 "DAY 1 · ..." 형식 제목도 깔끔하게
export const dayTitle = d => String(d.title || "").replace(/^DAY\s*\d+\s*·\s*/, "");
const mmdd = d => (d.date || "").slice(5).replace("-", ".");
const wday = d => (String(d.label || "").match(/\((.)\)/) || [])[1] || "";
const tbdBadge = t => t === "tbd" ? ' <span class="badge b-todo">미정</span>' : "";

function tripRange(days) {
  if (!days.length) return "";
  const f = s => (s || "").replaceAll("-", ". ");
  const a = days[0].date, b = days[days.length - 1].date;
  return `${f(a)} – ${f(b).slice(6)} · ${days.length - 1}박 ${days.length}일`;
}

export function pageSchedule(ctx) {
  const days = S.get("schedule");
  if (!days.length) return page(ctx, '<div class="empty">일정이 없어요.</div>');
  const di = parseInt(ctx.args[0], 10);
  if (!(di >= 1 && di <= days.length)) return scheduleList(ctx, days);
  return scheduleDay(ctx, days, di);
}

function scheduleList(ctx, days) {
  const tks = days.map((d, i) => `
    <a class="tk" href="#/schedule/${i + 1}">
      <div class="stub"><div class="d">${esc(mmdd(d))}</div><div class="w">${esc(WEEK[wday(d)] || "")}</div><span class="badge" style="background:${DAY_COLOR[i % 3]}">DAY ${i + 1}</span></div>
      <div class="body"><b>${esc(dayTitle(d)).replaceAll(" → ", "<br>→ ").replace("<br>", " ")}</b>${d.summary ? `<p>${esc(d.summary)}</p>` : ""}</div>
      ${icon("right", "go")}
    </a>`).join("");
  ctx.view.innerHTML = `
    <section class="sched-list">
      <p class="lead">${esc(tripRange(days))}</p>
      <div class="tks">${tks}</div>
      ${resetBar("schedule")}
      <div class="dev">개발자: 10229 조수민, 10524 이동선</div>
    </section>`;
  bind(ctx, { reset: d => doReset(d.id) });
}

function scheduleDay(ctx, days, di) {
  ctx.setTop({ variant: "bare" });
  const day = days[di - 1];
  const now = vnNow();
  const teams = (S.settings().teams && S.settings().teams[di]) || {};
  const myc = ls.get("myclass", 0);
  const myTeam = myc ? teams[myc] || "" : "";
  const hasTeams = day.items.some(i => i.team === "A" || i.team === "B");
  const team = !hasTeams ? "all" : ["A", "B"].includes(ctx.args[1]) ? ctx.args[1] : (myTeam === "B" ? "B" : "A");

  const list = day.items.map((it, i) => ({ it, i }))
    .filter(({ it }) => team === "all" || ["all", "tbd", team].includes(it.team))
    .sort((a, b) => (a.it.t || "").localeCompare(b.it.t || "") || (a.it.e || "").localeCompare(b.it.e || ""));
  const li = ({ it, i }) => {
    const isNow = day.date === now.date && it.t && it.e && it.t <= now.time && now.time < it.e;
    return `<li class="${isNow ? "now" : ""}">
      <span class="t">${esc(it.t || "")}${it.e ? `<small>~${esc(it.e)}</small>` : ""}</span><span class="dt"></span>
      <div class="x"><b>${esc(it.title)}</b>${tbdBadge(it.team)}${isNow ? '<span class="now-tag">지금</span>' : ""} ${pen("editItem", `data-i="${i}"`)}${it.desc ? `<p>${esc(it.desc)}</p>` : ""}</div></li>`;
  };
  const am = list.filter(x => (x.it.t || "") < "12:00"), pm = list.filter(x => (x.it.t || "") >= "12:00");
  const half = (name, arr) => `<div class="half"><div class="part">${name}</div>${arr.length ? `<ul class="tl">${arr.map(li).join("")}</ul>` : '<p class="mute">일정이 없어요.</p>'}</div>`;

  const teamCard = ed() ? `
    <div class="edit-card"><b>DAY ${di} 반별 팀 배정</b> ${pen("editTeams")} <button class="mini" data-act="teamPreset">1~3반 A · 4~6반 B 적용</button>
      <div class="row" style="margin-top:8px">${CLASSES.map(c => `<span>${c}반 ${teams[c] ? teams[c] + "팀" : "미정"}</span>`).join(" · ")}</div></div>` : "";

  page(ctx, `
    <a class="back-link" href="#/schedule">← 전체 일정</a>
    <div class="dayhd">
      <span class="eyebrow" style="color:${DAY_LIGHT[(di - 1) % 3]}">DAY ${di} · ${esc(mmdd(day))} ${esc(wday(day))}</span>
      <h2>${esc(dayTitle(day))} ${pen("editDay")}</h2>
      ${day.tagline ? `<p>${esc(day.tagline)}</p>` : ""}
      ${day.info ? `<p class="info">${esc(day.info)}</p>` : ""}
    </div>
    ${hasTeams ? `<div class="tabs2">${["A", "B"].map(k => `<a class="${team === k ? "on" : ""}" href="#/schedule/${di}/${k}">${k}팀</a>`).join("")}${myc && myTeam ? `<span class="mute my">내 반(${myc}반) ${myTeam}팀</span>` : ""}</div>` : ""}
    ${teamCard}
    <div class="halves">${half("오전", am)}${half("오후", pm)}</div>
    ${addBtn("addItem", "일정 추가")}
    ${resetBar("schedule")}`, {
    reset: d => doReset(d.id),
    editItem: d => openForm({
      title: "일정 수정", fields: ITEM_FIELDS, values: day.items[d.i],
      onSave: v => dayMut(x => { x.items[d.i] = v; }),
      onDelete: () => dayMut(x => { x.items.splice(d.i, 1); })
    }),
    addItem: () => openForm({ title: "일정 추가", fields: ITEM_FIELDS, values: { team: "all" }, onSave: v => dayMut(x => { x.items.push(v); }) }),
    editDay: () => openForm({ title: "이 날 정보 수정", fields: DAY_FIELDS, values: { ...day, title: dayTitle(day) }, onSave: v => dayMut(x => { Object.assign(x, v); }) }),
    editTeams: () => openForm({
      title: `DAY ${di} 팀 배정`,
      fields: CLASSES.map(c => ({ k: "c" + c, label: c + "반", type: "select", options: [["", "미정"], ["A", "A팀"], ["B", "B팀"]] })),
      values: Object.fromEntries(CLASSES.map(c => ["c" + c, teams[c] || ""])),
      onSave: v => { const m = {}; CLASSES.forEach(c => { if (v["c" + c]) m[c] = v["c" + c]; }); return saveTeams(m); }
    }),
    teamPreset: () => { if (confirm("1~3반은 A팀, 4~6반은 B팀으로 지정할까요?")) saveTeams({ 1: "A", 2: "A", 3: "A", 4: "B", 5: "B", 6: "B" }); }
  });

  function dayMut(fn) { return mut("schedule", a => fn(a[di - 1])); }
  function saveTeams(map) {
    const cur = S.settings();
    const t = clone(cur.teams || {});
    t[di] = map;
    return save("settings", { ...cur, teams: t });
  }
}

/* ---------- 이동 경로 ---------- */
const mapHtml = r => r.img
  ? `<img class="map" src="${esc(r.img)}" alt="지도" loading="lazy">`
  : (r.fromQ && r.toQ
    ? `<iframe class="map" loading="lazy" title="지도" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?saddr=${enc(r.fromQ)}&amp;daddr=${enc(r.toQ)}&amp;output=embed"></iframe>`
    : '<div class="mute">지도가 아직 없어요.</div>');
const dirUrl = r => `https://www.google.com/maps/dir/?api=1&amp;origin=${enc(r.fromQ || "")}&amp;destination=${enc(r.toQ || "")}&amp;travelmode=driving`;
const isLap = () => window.matchMedia("(min-width: 900px)").matches;
// "A팀 · 전쟁 박물관 → 역사 박물관" → { team: "A팀", name: "전쟁 박물관 → 역사 박물관" }
const splitTeam = t => { const m = String(t || "").match(/^([AB]팀)\s*·\s*(.*)$/); return m ? { team: m[1], name: m[2] } : { team: "", name: String(t || "") }; };

export function pageRoute(ctx) {
  const days = S.get("schedule");
  const routes = S.get("routes");
  const today = days.findIndex(d => d.date === vnNow().date);
  let di = parseInt(ctx.args[0], 10);
  if (!(di >= 1 && di <= days.length)) di = today >= 0 ? today + 1 : 1;
  const list = routes.map((r, i) => ({ r, i })).filter(({ r }) => Number(r.day) === di);
  const lap = isLap();
  let sel = parseInt(ctx.args[1], 10);
  if (!(sel >= 0 && sel < list.length)) sel = lap && list.length ? 0 : -1;

  const fields = [
    { k: "day", label: "날짜", type: "select", options: days.map((d, i) => [String(i + 1), `DAY ${i + 1} (${d.label})`]) },
    { k: "dep", label: "출발 시간 (예: 08:00)" },
    { k: "title", label: "제목 (예: 호텔 → 송빈 성당, A팀이면 'A팀 · ' 붙이기)", req: true },
    { k: "fromQ", label: "출발지 (구글맵 검색어 또는 '위도,경도')" },
    { k: "toQ", label: "도착지 (구글맵 검색어 또는 '위도,경도')" },
    { k: "time", label: "소요 시간 (예: 약 40분)" },
    { k: "dist", label: "거리 (예: 약 12km)" },
    { k: "note", label: "메모", type: "textarea", rows: 3 },
    { k: "img", label: "지도 이미지 경로 (선택)" },
    { k: "todo", label: "장소 확인 필요 표시", type: "check" }
  ];
  const fix = v => ({ ...v, day: Number(v.day) });
  const move = (i, dir) => {
    const arr = clone(routes);
    const dayNo = arr[i].day;
    let j = i + dir;
    while (j >= 0 && j < arr.length && arr[j].day !== dayNo) j += dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    save("routes", arr);
  };
  const detail = r => `
    ${mapHtml(r)}
    <div class="kv"><div>소요 시간<b>${r.time ? esc(r.time) : "확인 중"}</b></div><div>거리<b>${r.dist ? esc(r.dist) : "확인 중"}</b></div></div>
    ${r.note ? `<p class="note">${esc(r.note)}</p>` : ""}
    <a class="lk" target="_blank" rel="noopener" href="${dirUrl(r)}">구글맵에서 길찾기 ${icon("out")}</a>`;
  const editRow = i => ed() ? `<div class="row" style="margin-top:10px"><button class="edit" data-act="editRoute" data-i="${i}">수정</button><button class="mini" data-act="up" data-i="${i}">위로</button><button class="mini" data-act="down" data-i="${i}">아래로</button></div>` : "";

  const items = list.map(({ r, i }, k) => {
    const { team, name } = splitTeam(r.title);
    const small = [team, r.dep ? r.dep + " 출발" : ""].filter(Boolean).join(" · ");
    const open = k === sel;
    return `<div class="ri ${open ? "sel" : ""}">
      <a href="#/route/${di}${open && !lap ? "" : "/" + k}">
        <span class="no">${k + 1}</span>
        <span class="nm">${small ? `<small>${esc(small)}</small>` : ""}<b>${esc(name)}</b>${ed() && r.todo ? ' <span class="badge b-todo">장소 확인 필요</span>' : ""}</span>
        <span class="tm">${r.time ? esc(r.time) : "확인 중"}</span>
      </a>
      ${open && !lap ? `<div class="bd">${detail(r)}${editRow(i)}</div>` : ""}
    </div>`;
  }).join("");
  const cur = sel >= 0 ? list[sel] : null;
  const side = lap && cur ? (() => { const { team, name } = splitTeam(cur.r.title); return `
    <div class="rview"><span class="eyebrow">${sel + 1}${team ? " · " + esc(team) : ""}${cur.r.dep ? " · " + esc(cur.r.dep) + " 출발" : ""}</span>
      <h3>${esc(name)}</h3>${detail(cur.r)}${editRow(cur.i)}</div>`; })() : "";

  page(ctx, `
    <div class="seg">${days.map((d, i) => `<a class="${i + 1 === di ? "on" : ""}" href="#/route/${i + 1}"><b>${i + 1}일차</b><small>${esc(mmdd(d))} ${esc(wday(d))}</small></a>`).join("")}</div>
    <div class="rsplit">
      <div class="rt">${items || '<div class="empty">이 날의 이동 경로가 아직 없어요.</div>'}</div>
      ${side}
    </div>
    ${addBtn("addRoute", "경로 추가")}
    ${resetBar("routes")}`, {
    reset: d => doReset(d.id),
    editRoute: d => openForm({
      title: "경로 수정", fields, values: { ...routes[d.i], day: String(routes[d.i].day) },
      onSave: v => mut("routes", a => { a[d.i] = fix(v); }),
      onDelete: () => mut("routes", a => { a.splice(d.i, 1); })
    }),
    addRoute: () => openForm({ title: "경로 추가", fields, values: { day: String(di) }, onSave: v => mut("routes", a => { a.push(fix(v)); }) }),
    up: d => move(Number(d.i), -1),
    down: d => move(Number(d.i), 1)
  });

  // 휴대폰 ↔ 노트북 폭이 바뀌면 다시 그림
  const mq = window.matchMedia("(min-width: 900px)");
  const re = () => pageRoute(ctx);
  mq.addEventListener("change", re);
  ctx.leave(() => mq.removeEventListener("change", re));
}

/* ---------- 공지 ---------- */
function noticeForm(n) {
  const t = S.state.teacher;
  const opts = [["0", "공통 (전체)"]];
  if (t.classNo === 0) CLASSES.forEach(c => opts.push([String(c), c + "반"]));
  else if (t.classNo >= 1) opts.push([String(t.classNo), t.classNo + "반"]);
  openForm({
    title: n ? "공지 수정" : "새 공지",
    fields: [
      { k: "cls", label: "받는 곳", type: "select", options: opts },
      { k: "title", label: "제목", req: true },
      { k: "body", label: "내용", type: "textarea", rows: 6, req: true },
      { k: "pinned", label: "맨 위에 고정 (긴급 연락처 등)", type: "check" }
    ],
    values: n ? { cls: String(n.cls), title: n.title, body: n.body, pinned: !!n.pinned } : { cls: String(t.classNo >= 1 ? t.classNo : 0) },
    onSave: async v => {
      try {
        const data = { cls: Number(v.cls), title: v.title, body: v.body, pinned: !!v.pinned };
        if (n) await S.updateNotice(n.id, data); else await S.addNotice(data);
        toast(n ? "공지를 수정했어요" : "공지를 올렸어요", 2000);
        return true;
      } catch (e) { alert("저장하지 못했어요.\n" + (e.message || e)); return false; }
    }
  });
}

export function pageNotice(ctx) {
  const f = ctx.args[0] === "common" || /^[1-6]$/.test(ctx.args[0]) ? ctx.args[0] : "all";
  const t = S.state.teacher;
  let list = S.state.notices.slice();
  if (f === "common") list = list.filter(n => n.cls === 0);
  else if (f !== "all") list = list.filter(n => n.cls === 0 || n.cls === Number(f));
  list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  const tabs = [["common", "공통"], ...CLASSES.map(c => [String(c), c + "반"])];
  const canEdit = n => t && (n.authorUid === t.uid || t.classNo === 0);
  const heading = f === "all" ? "최근 공지 사항" : f === "common" ? "공통 공지사항" : `10-${f} 공지사항`;
  const who = n => n.cls === 0 ? `${n.authorName || ""} 선생님` : `${n.cls}반 ${n.authorName || ""} 선생님`;

  const cards = list.map(n => `
    <article class="ntc paper ${n.pinned ? "pin" : ""}">
      <div class="who"><span class="badge ${n.cls === 0 ? "b-common" : "b-" + n.cls}">${n.cls === 0 ? "공통" : n.cls + "반"}</span>${esc(who(n))}${n.pinned ? '<span class="pinl">고정</span>' : ""}</div>
      <h4>${esc(n.title)}</h4>
      <p>${esc(n.body)}</p>
      <time>${fmtNoticeTime(n.createdAt)}${n.updatedAt ? " (수정됨)" : ""}</time>
      ${canEdit(n) ? `<div class="row end"><button class="edit" data-act="editN" data-id="${n.id}">수정</button><button class="mini danger" data-act="delN" data-id="${n.id}">삭제</button></div>` : ""}
    </article>`).join("");

  page(ctx, `
    ${offlineBanner()}
    <div class="chips">${tabs.map(([k, l]) => `<a class="chip ${f === k ? "on" : ""}" href="#/notice${f === k ? "" : "/" + k}">${l}</a>`).join("")}</div>
    ${t ? '<div class="addbar"><button class="btn primary" data-act="newN">공지 쓰기</button></div>' : ""}
    <div class="stitle">${heading}</div>
    ${cards ? `<div class="ngrid">${cards}</div>` : `<div class="empty">${S.state.noticesReady || !S.configured ? "공지가 아직 없어요." : "불러오는 중…"}</div>`}
    ${t ? "" : '<p class="mute small-note">선생님은 메뉴에서 로그인하면 공지를 쓸 수 있어요.</p>'}`, {
    newN: () => noticeForm(null),
    editN: d => { const n = S.state.notices.find(x => x.id === d.id); if (n) noticeForm(n); },
    delN: async d => {
      if (!confirm("이 공지를 삭제할까요?")) return;
      try { await S.deleteNotice(d.id); toast("삭제했어요", 2000); } catch (e) { alert(e.message || e); }
    }
  });
}

/* ---------- 배워 가기 ---------- */
const SPOT_FIELDS = [
  { k: "name", label: "이름", req: true },
  { k: "en", label: "영어 이름" },
  { k: "when", label: "언제 가는지 (예: 3일차 · 호치민)" },
  { k: "label", label: "주제 (예: 베트남 전쟁)" },
  { k: "img", label: "사진 경로 (예: assets/learn/war.jpg)" },
  { k: "summary", label: "한 줄 소개", type: "textarea", rows: 3 }
];
const TOPIC_FIELDS = [
  { k: "title", label: "질문", req: true },
  { k: "body", label: "설명", type: "textarea", rows: 6 }
];
const bgUrl = img => img ? `style="background-image:url('${esc(img)}')"` : "";
const two = n => String(n).padStart(2, "0");

export function pageLearn(ctx) {
  const spots = S.get("learn");
  const si = ctx.args[0] !== undefined ? parseInt(ctx.args[0], 10) : -1;
  if (si >= 0 && spots[si]) return learnDetail(ctx, spots, si);

  const cards = spots.map((s, i) => `
    <a class="lc" href="#/learn/${i}" ${bgUrl(s.img)}>${s.when ? `<small>${esc(s.when)}</small>` : ""}<b>${esc(s.name)}</b></a>`).join("");
  const edits = ed() ? `<div class="edit-card">장소 수정: ${spots.map((s, i) => `<button class="edit" data-act="editSpot" data-i="${i}">${esc(s.name)}</button>`).join(" ")}</div>` : "";
  page(ctx, `
    <div class="lgrid">${cards}<a class="lc qz" href="#/quiz"><span class="oxm">O X</span><small>다 읽었으면</small><b>O &amp; X 퀴즈</b></a></div>
    ${edits}
    ${addBtn("addSpot", "장소 추가")}
    ${resetBar("learn")}`, {
    reset: d => doReset(d.id),
    editSpot: d => openForm({
      title: "장소 수정", fields: SPOT_FIELDS, values: spots[d.i],
      onSave: v => mut("learn", a => { a[d.i] = { ...a[d.i], ...v }; }),
      onDelete: () => mut("learn", a => { a.splice(d.i, 1); })
    }),
    addSpot: () => openForm({ title: "장소 추가", fields: SPOT_FIELDS, onSave: v => mut("learn", a => { a.push({ ...v, topics: [] }); }) })
  });
}

function learnDetail(ctx, spots, si) {
  ctx.setTop({ variant: "overlay" });
  const s = spots[si];
  const topics = s.topics || [];
  const lap = isLap();
  let k = parseInt(ctx.args[1], 10);
  if (!(k >= 0 && k < topics.length)) k = lap && topics.length ? 0 : -1;
  const where = /박물관/.test(s.name) ? "박물관" : s.name;
  const lead = `${s.label ? esc(s.label) + ", " : ""}${esc(where)} 가기 전 딱 ${topics.length}가지만 알자!`;
  const exp = j => `
    <div class="exp paper"><a class="back" href="#/learn/${si}" aria-label="닫기">${icon("back")}</a>
      <span class="k">${two(j + 1)}</span><h3>${esc(topics[j].title)}</h3><p>${esc(topics[j].body)}</p>
      ${ed() ? `<div class="row end">${pen("editTopic", `data-k="${j}"`)}</div>` : ""}</div>`;
  const pills = topics.map((tp, j) => j === k && !lap ? exp(j)
    : `<a class="pill ${j === k ? "on" : ""}" href="#/learn/${si}/${j}"><span><small>${two(j + 1)}</small>${esc(tp.title)}</span>${icon("right")}</a>`).join("");

  ctx.view.innerHTML = `
    <section class="place" ${bgUrl(s.img)}>
      <div class="page pcols">
        <div>
          ${s.when ? `<span class="eyebrow">${esc(s.when)}</span>` : ""}
          <h1 class="pt">${esc(s.name)} ${pen("editSpot")}</h1>
          <p class="lead2">${lead}</p>
          <div class="pills">${pills || '<p class="mute">내용을 준비 중이에요.</p>'}</div>
          ${addBtn("addTopic", "질문 추가")}
          <a class="btn quiz-go" href="#/quiz">퀴즈 풀러 가기</a>
        </div>
        ${lap && k >= 0 ? exp(k) : ""}
      </div>
    </section>`;
  bind(ctx, {
    editSpot: () => openForm({
      title: "장소 수정", fields: SPOT_FIELDS, values: s,
      onSave: v => mut("learn", a => { a[si] = { ...a[si], ...v }; }),
      onDelete: async () => { const ok = await mut("learn", a => { a.splice(si, 1); }); if (ok) location.hash = "#/learn"; return ok; }
    }),
    editTopic: d => openForm({
      title: "내용 수정", fields: TOPIC_FIELDS, values: topics[d.k],
      onSave: v => mut("learn", a => { a[si].topics[d.k] = v; }),
      onDelete: () => mut("learn", a => { a[si].topics.splice(d.k, 1); })
    }),
    addTopic: () => openForm({ title: "질문 추가", fields: TOPIC_FIELDS, onSave: v => mut("learn", a => { (a[si].topics = a[si].topics || []).push(v); }) })
  });
  const mq = window.matchMedia("(min-width: 900px)");
  const re = () => learnDetail(ctx, S.get("learn"), si);
  mq.addEventListener("change", re);
  ctx.leave(() => mq.removeEventListener("change", re));
}

/* ---------- O/X 퀴즈 ---------- */
let run = null;
let scores = [];
const PLACE_NAME = { palace: "통일궁", war: "전쟁 박물관", history: "역사 박물관" };
const QUIZ_FIELDS = [
  { k: "place", label: "장소", type: "select", options: [["palace", "통일궁"], ["war", "전쟁 박물관"], ["history", "역사 박물관"]] },
  { k: "q", label: "문제", type: "textarea", rows: 3, req: true },
  { k: "a", label: "정답", type: "select", options: [["true", "O (맞다)"], ["false", "X (틀리다)"]] },
  { k: "exp", label: "해설", type: "textarea", rows: 3 }
];

export function pageQuiz(ctx) {
  if (ctx.nav) run = null;
  const qs = S.get("quiz");

  const rankHtml = () => !S.configured
    ? '<div class="empty">Firebase 연결 후 랭킹이 보여요.</div>'
    : scores.length
      ? `<ol class="rank">${scores.map((s, i) => `<li><span>${i + 1}</span><span>${esc(s.cls)}반 ${esc(s.name)}</span><span class="sc">${s.score}/${s.total}</span>${S.isTeacher() ? `<button class="mini danger" data-act="delScore" data-id="${s.id}">삭제</button>` : ""}</li>`).join("")}</ol>`
      : '<div class="empty">아직 기록이 없어요. 첫 도전자가 되어 보세요!</div>';

  const qHtml = () => {
    if (!qs.length) return '<div class="qcard paper empty">퀴즈 문제가 아직 없어요.</div>';
    if (!run) return `<div class="qcard paper qstart"><span class="k">배워가기 복습</span><h3>O &amp; X 퀴즈</h3><p>문제 ${qs.length}개 중에서 10문제가 무작위로 나와요. 맞힌 개수로 랭킹이 정해져요.</p><button class="btn primary" data-act="start">시작하기</button></div>`;
    if (run.i < run.qs.length) {
      const q = run.qs[run.i];
      const last = run.i === run.qs.length - 1;
      return `<div class="qcard paper">
        <div class="prog"><i style="width:${(run.i / run.qs.length) * 100}%"></i></div>
        <div class="qn">${run.i + 1} / ${run.qs.length}${PLACE_NAME[q.place] ? ` · ${PLACE_NAME[q.place]}` : ""}</div>
        <div class="qt">${esc(q.q)}</div>
        ${run.ans === null
          ? '<div class="ox"><button data-act="ans" data-v="1">O</button><button data-act="ans" data-v="0">X</button></div>'
          : `<div class="fb ${run.ok ? "ok" : "no"}">${run.ok ? "정답이에요" : "아쉬워요"} · 정답 ${q.a ? "O" : "X"}</div><p class="qexp">${esc(q.exp || "")}</p><button class="btn primary" data-act="next">${last ? "결과 보기" : "다음 문제"}</button>`}
      </div>`;
    }
    const my = ls.get("myclass", 0) || 1;
    return `<div class="qcard paper qstart"><span class="k">결과</span>
      <div class="qscore">${run.score} / ${run.qs.length}</div>
      ${run.saved ? '<p class="fb ok">랭킹에 등록했어요!</p>' : `
        <p>이름을 적고 랭킹에 등록해 보세요.</p>
        <div class="row">
          <select id="qcls">${CLASSES.map(c => `<option value="${c}" ${c === my ? "selected" : ""}>${c}반</option>`).join("")}</select>
          <input id="qname" maxlength="12" placeholder="이름">
          <button class="btn primary" data-act="saveScore">등록</button>
        </div>`}
      <button class="btn ghost" data-act="start" style="margin-top:12px">다시 풀기</button>
    </div>`;
  };
  const drawQ = () => { const el = $("#qarea"); if (el) el.innerHTML = qHtml(); };

  const editCard = ed() ? `
    <div class="edit-card"><b>퀴즈 문제 편집 (${qs.length}개)</b>
      ${qs.map((q, i) => `<div class="qrow"><span>${i + 1}. [${PLACE_NAME[q.place] || "-"}] ${esc(q.q)} <b>${q.a ? "O" : "X"}</b></span><button class="edit" data-act="editQ" data-i="${i}">수정</button></div>`).join("")}
      ${addBtn("addQ", "문제 추가")}
    </div>${resetBar("quiz")}` : "";

  page(ctx, `
    ${offlineBanner()}
    <div class="qcols">
      <div id="qarea"></div>
      <div class="rankbox"><div class="stitle">랭킹</div><div id="rank">${rankHtml()}</div></div>
    </div>
    ${editCard}`, {
    reset: d => doReset(d.id),
    start: () => { run = { qs: pickRound(qs), i: 0, score: 0, ans: null, ok: false, saved: false }; drawQ(); },
    ans: d => {
      if (!run || run.ans !== null) return;
      const q = run.qs[run.i];
      run.ans = d.v === "1";
      run.ok = run.ans === !!q.a;
      if (run.ok) run.score++;
      drawQ();
    },
    next: () => { run.i++; run.ans = null; drawQ(); },
    saveScore: async () => {
      const name = $("#qname").value.trim();
      if (!name) return alert("이름을 적어 주세요.");
      try {
        await S.addScore({ name, cls: Number($("#qcls").value), score: run.score, total: run.qs.length });
        run.saved = true; drawQ(); toast("랭킹에 등록했어요", 2000);
      } catch (e) { alert("등록하지 못했어요.\n" + (e.message || e)); }
    },
    delScore: async d => { if (confirm("이 기록을 삭제할까요?")) { try { await S.deleteScore(d.id); } catch (e) { alert(e.message || e); } } },
    editQ: d => openForm({
      title: "문제 수정", fields: QUIZ_FIELDS, values: { place: qs[d.i].place || "palace", q: qs[d.i].q, a: String(qs[d.i].a), exp: qs[d.i].exp || "" },
      onSave: v => mut("quiz", a => { a[d.i] = { place: v.place, q: v.q, a: v.a === "true", exp: v.exp }; }),
      onDelete: () => mut("quiz", a => { a.splice(d.i, 1); })
    }),
    addQ: () => openForm({
      title: "문제 추가", fields: QUIZ_FIELDS, values: { a: "true", place: "palace" },
      onSave: v => mut("quiz", a => { a.push({ place: v.place, q: v.q, a: v.a === "true", exp: v.exp }); })
    })
  });

  drawQ();
  ctx.leave(S.watchScores(list => { scores = list; const el = $("#rank"); if (el) el.innerHTML = rankHtml(); }));
}

/* ---------- 포토존 ---------- */
let photos = [];

export function pagePhoto(ctx) {
  const f = /^[1-6]$/.test(ctx.args[0]) ? ctx.args[0] : "all";
  const tabs = [["all", "전체"], ...CLASSES.map(c => [String(c), c + "반"])];

  const draw = () => {
    const el = $("#board");
    if (!el) return;
    const list = f === "all" ? photos : photos.filter(p => String(p.cls) === f);
    const best = new Set();
    CLASSES.forEach(c => {
      const ps = photos.filter(p => p.cls === c && (p.likes || 0) > 0);
      if (ps.length) best.add(ps.reduce((a, b) => ((b.likes || 0) > (a.likes || 0) ? b : a)).id);
    });
    const lk = ls.get("liked", {});
    el.innerHTML = list.length
      ? `<div class="cork" style="--cork:url('assets/cork.jpg')">${list.map(p => `
        <figure class="polaroid" style="--rot:${(hashNum(p.id) % 7) - 3}deg">
          <img src="${esc(p.img)}" alt="" loading="lazy" data-act="view" data-id="${p.id}">
          <figcaption class="pol-cap">${esc(p.caption || "")}</figcaption>
          <div class="pol-foot">
            <span>${esc(p.cls)}반 ${best.has(p.id) ? '<span class="badge b-best">🏆BEST</span>' : ""}</span>
            <span><button class="like ${lk[p.id] ? "on" : ""}" data-act="like" data-id="${p.id}">${lk[p.id] ? "❤️" : "🤍"} ${p.likes || 0}</button>${S.isTeacher() ? `<button class="mini danger" data-act="delP" data-id="${p.id}">✕</button>` : ""}</span>
          </div>
        </figure>`).join("")}</div>`
      : '<div class="empty">아직 사진이 없어요.<br>첫 사진을 올려 보세요! 📸</div>';
  };

  page(ctx, `
    <h2>📸 포토존</h2>
    ${offlineBanner()}
    <div class="tabs">${tabs.map(([k, l]) => `<a class="tab ${f === k ? "on" : ""}" href="#/photo/${k}">${l}</a>`).join("")}</div>
    <div class="addbar"><button class="btn primary" data-act="upload">📷 사진 올리기</button></div>
    <div class="sub" style="margin-bottom:8px">하트(🤍)를 눌러 마음에 드는 사진에 투표해요. 반마다 하트가 가장 많은 사진에 🏆BEST가 붙어요.</div>
    <div id="board"></div>`, {
    upload: () => openForm({
      title: "사진 올리기",
      saveText: "올리기",
      fields: [
        { k: "cls", label: "반", type: "select", options: CLASSES.map(c => [String(c), c + "반"]) },
        { k: "caption", label: "한 줄 설명 (선택, 60자까지)", ph: "예: 붕따우 바다에서!" },
        { k: "file", label: "사진", type: "file", req: true }
      ],
      values: { cls: f !== "all" ? f : String(ls.get("myclass", 0) || 1) },
      onSave: async v => {
        if (!v.file) { alert("사진을 골라 주세요."); return false; }
        try {
          const img = await compressImage(v.file);
          await S.addPhoto({ img, cls: Number(v.cls), caption: (v.caption || "").slice(0, 60) });
          toast("사진을 올렸어요 📸", 2000);
          return true;
        } catch (e) { alert("올리지 못했어요.\n" + (e.message || e)); return false; }
      }
    }),
    view: d => {
      const p = photos.find(x => x.id === d.id);
      if (!p) return;
      openModal(`<img class="photo-big" src="${esc(p.img)}" alt=""><p>${esc(p.caption || "")}</p><div class="row end"><button class="btn ghost" id="pvClose">닫기</button></div>`);
      $("#pvClose").onclick = closeModal;
    },
    like: async d => {
      const lk = ls.get("liked", {});
      const was = !!lk[d.id];
      if (was) delete lk[d.id]; else lk[d.id] = 1;
      ls.set("liked", lk); draw();
      try { await S.likePhoto(d.id, was ? -1 : 1); }
      catch (e) {
        if (was) lk[d.id] = 1; else delete lk[d.id];
        ls.set("liked", lk); draw();
        alert("투표하지 못했어요.\n" + (e.message || e));
      }
    },
    delP: async d => { if (confirm("이 사진을 삭제할까요?")) { try { await S.deletePhoto(d.id); } catch (e) { alert(e.message || e); } } }
  });

  draw();
  ctx.leave(S.watchPhotos(list => { photos = list; draw(); }));
}

/* ---------- 쌤 소개 ---------- */
const T_FIELDS = [
  { k: "name", label: "이름", req: true },
  { k: "role", label: "담당 (예: 1반 담임)" },
  { k: "subject", label: "담당 과목 (예: 수학)" },
  { k: "nick", label: "파워퍼프걸 별명 (예: 블로섬 쌤)" },
  { k: "intro", label: "소개", type: "textarea", rows: 5 }
];

export function pageTeachers(ctx) {
  const list = S.get("teachers");
  page(ctx, `
    <h2>💖 쌤 소개</h2>
    <div class="card">쌤들이 <b>파워퍼프걸</b>로 변신했어요! 💖💙💚<br><span class="sub">카드 색깔로 쌤들을 만나 보세요.</span></div>
    <div class="tgrid">${list.map((t, i) => `
      <div class="tcard c${i % 3}">
        <h3>${esc(t.name)}</h3>
        <div class="nick">${esc([t.role, t.nick].filter(Boolean).join(" · "))}</div>
        ${t.subject ? `<div class="nick">📖 ${esc(t.subject)}</div>` : ""}
        <p>${t.intro ? esc(t.intro) : "소개를 준비 중이에요 ✨"}</p>
        ${pen("editT", `data-i="${i}"`)}
      </div>`).join("")}</div>
    ${addBtn("addT", "쌤 추가")}
    ${resetBar("teachers")}`, {
    reset: d => doReset(d.id),
    editT: d => openForm({
      title: "쌤 소개 수정", fields: T_FIELDS, values: list[d.i],
      onSave: v => mut("teachers", a => { a[d.i] = v; }),
      onDelete: () => mut("teachers", a => { a.splice(d.i, 1); })
    }),
    addT: () => openForm({
      title: "쌤 추가", fields: T_FIELDS,
      onSave: v => mut("teachers", a => { a.push(v); })
    })
  });
}
