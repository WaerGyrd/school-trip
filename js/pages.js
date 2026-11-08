import { $, esc, hashNum, ls, toast, vnNow, fmtTime, openForm, openModal, closeModal, compressImage } from "./util.js";
import * as S from "./store.js";

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
const resetBar = id => ed() ? `<div class="resetbar"><button class="mini danger" data-act="reset" data-id="${id}">↺ 기본값으로 되돌리기</button></div>` : "";
const addBtn = (act, label) => ed() ? `<div class="addbar"><button class="btn ghost" data-act="${act}">＋ ${label}</button></div>` : "";
const pen = (act, attrs = "") => ed() ? `<button class="mini" data-act="${act}" ${attrs}>✏️</button>` : "";
const offlineBanner = () => S.configured ? "" : `<div class="banner-warn">⚠️ 아직 Firebase가 연결되지 않았어요. 연결하기 전에는 이 기능을 쓸 수 없어요.</div>`;

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
  const st = S.settings();
  const diff = Math.round((Date.parse("2026-11-18") - Date.parse(vnNow().date)) / 864e5);
  const dd = diff > 0 ? "D-" + diff : diff === 0 ? "D-DAY" : diff >= -2 ? "여행 중 ✈️" : "추억이 되었어요";
  const links = [
    ["#/schedule", "📅", "일정"], ["#/route", "🗺️", "이동 경로"],
    ["#/notice", "📢", "공지 사항"], ["#/learn", "📚", "배워 가기"],
    ["#/quiz", "❓", "O/X 퀴즈"], ["#/photo", "📸", "포토존"],
    ["#/teachers", "💖", "쌤 소개"]
  ];
  ctx.view.innerHTML = `
    <section class="hero" style="--hero:url('assets/hero.jpg')">
      <div class="hero-in">
        <img class="logo" src="assets/logo.png" alt="KISH" onerror="this.remove()">
        <span class="dday">${dd}</span>
        <h1>호치민 · 붕따우<br>고1 수학여행</h1>
        <div>2026.11.18 (수) ~ 11.20 (금) · 2박 3일</div>
      </div>
    </section>
    <div class="page">
      <div class="card">
        <p style="margin:0;white-space:pre-line">${esc(st.home.desc)}</p>
        ${ed() ? '<div class="row end"><button class="mini" data-act="editHome">✏️ 소개 글 수정</button></div>' : ""}
      </div>
      <div class="links">
        ${links.map((l, i) => `<a href="${l[0]}" ${i === links.length - 1 ? 'style="grid-column:1/-1"' : ""}>${l[1]}<br>${l[2]}</a>`).join("")}
      </div>
      <div class="dev">만든 사람 · 10229 조수민 · 10524 이동선</div>
    </div>`;
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
const teamBadge = t => t === "A" ? '<span class="badge b-A">A팀</span>' : t === "B" ? '<span class="badge b-B">B팀</span>' : t === "tbd" ? '<span class="badge b-tbd">미정</span>' : "";
const teamBadgeC = t => t === "A" ? '<span class="badge b-A">A</span>' : t === "B" ? '<span class="badge b-B">B</span>' : '<span class="badge b-tbd">미정</span>';

export function pageSchedule(ctx) {
  const days = S.get("schedule");
  const now = vnNow();
  const di = dayIndex(days, ctx.args[0]);
  const day = days[di - 1];
  if (!day) return page(ctx, '<div class="empty">일정이 없어요.</div>');

  const teams = (S.settings().teams && S.settings().teams[di]) || {};
  const myc = ls.get("myclass", 0);
  const myTeam = myc ? teams[myc] || "" : "";
  const explicit = ["all", "A", "B"].includes(ctx.args[1]);
  const team = explicit ? ctx.args[1] : (myTeam === "A" || myTeam === "B" ? myTeam : "all");
  const suffix = explicit ? "/" + ctx.args[1] : "";

  const list = day.items.map((it, i) => ({ it, i }))
    .filter(({ it }) => team === "all" || ["all", "tbd", team].includes(it.team))
    .sort((a, b) => (a.it.t || "").localeCompare(b.it.t || "") || (a.it.e || "").localeCompare(b.it.e || ""));

  const rows = list.map(({ it, i }) => {
    const isNow = day.date === now.date && it.t && it.e && it.t <= now.time && now.time < it.e;
    return `<li class="tl-item ${isNow ? "now" : ""}">
      <div class="tl-time">${esc(it.t || "")}${it.e ? `<small>~${esc(it.e)}</small>` : ""}</div>
      <div class="tl-body"><b>${esc(it.title)}</b>${teamBadge(it.team)}${isNow ? '<span class="now-tag">지금</span>' : ""} ${pen("editItem", `data-i="${i}"`)}
        ${it.desc ? `<p>${esc(it.desc)}</p>` : ""}</div></li>`;
  }).join("");

  const hasTeams = day.items.some(i => i.team === "A" || i.team === "B");
  const teamCard = (hasTeams || ed()) ? `
    <div class="card"><b>반별 팀 배정</b>
      ${ed() ? `${pen("editTeams")} <button class="mini" data-act="teamPreset">1~3반 A · 4~6반 B 적용</button>` : ""}
      <div class="row" style="margin-top:8px">${CLASSES.map(c => `<span>${c}반 ${teamBadgeC(teams[c])}</span>`).join(" ")}</div>
      <div class="sub" style="margin-top:6px">${myc ? `내 반(${myc}반): ${myTeam ? myTeam + "팀" : "미정"}` : "메뉴(☰)에서 '내 반'을 고르면 내 팀 일정이 먼저 열려요."}</div>
    </div>` : "";

  const html = `
    <h2>📅 일정</h2>
    <div class="daybtns">${days.map((d, i) => `<a class="${i + 1 === di ? "on" : ""}" href="#/schedule/${i + 1}${suffix}">${esc(d.label)}<br>DAY ${i + 1}${d.date === now.date ? '<span class="today-b">TODAY</span>' : ""}</a>`).join("")}</div>
    <div class="tabs">${[["all", "전체"], ["A", "A팀"], ["B", "B팀"]].map(([k, l]) => `<a class="tab ${team === k ? "on" : ""}" href="#/schedule/${di}/${k}">${l}</a>`).join("")}</div>
    <div class="card"><b>${esc(day.title)}</b> ${pen("editDay")}${day.info ? `<div class="sub" style="margin-top:4px">${esc(day.info)}</div>` : ""}</div>
    ${teamCard}
    ${rows ? `<ul class="tl">${rows}</ul>` : '<div class="empty">표시할 일정이 없어요.</div>'}
    ${addBtn("addItem", "일정 추가")}
    ${resetBar("schedule")}`;

  const dayMut = fn => mut("schedule", a => fn(a[di - 1]));
  const saveTeams = map => {
    const cur = S.settings();
    const t = clone(cur.teams || {});
    t[di] = map;
    return save("settings", { ...cur, teams: t });
  };

  page(ctx, html, {
    reset: d => doReset(d.id),
    editItem: d => openForm({
      title: "일정 수정", fields: ITEM_FIELDS, values: day.items[d.i],
      onSave: v => dayMut(x => { x.items[d.i] = v; }),
      onDelete: () => dayMut(x => { x.items.splice(d.i, 1); })
    }),
    addItem: () => openForm({
      title: "일정 추가", fields: ITEM_FIELDS, values: { team: "all" },
      onSave: v => dayMut(x => { x.items.push(v); })
    }),
    editDay: () => openForm({
      title: "이 날 정보 수정",
      fields: [
        { k: "label", label: "날짜 표시 (예: 11/18 (수))", req: true },
        { k: "title", label: "제목", req: true },
        { k: "info", label: "안내 문구", type: "textarea", rows: 3 }
      ],
      values: day,
      onSave: v => dayMut(x => { Object.assign(x, v); })
    }),
    editTeams: () => openForm({
      title: `DAY ${di} 팀 배정`,
      fields: CLASSES.map(c => ({ k: "c" + c, label: c + "반", type: "select", options: [["", "미정"], ["A", "A팀"], ["B", "B팀"]] })),
      values: Object.fromEntries(CLASSES.map(c => ["c" + c, teams[c] || ""])),
      onSave: v => { const m = {}; CLASSES.forEach(c => { if (v["c" + c]) m[c] = v["c" + c]; }); return saveTeams(m); }
    }),
    teamPreset: () => {
      if (!confirm("1~3반은 A팀, 4~6반은 B팀으로 지정할까요?")) return;
      saveTeams({ 1: "A", 2: "A", 3: "A", 4: "B", 5: "B", 6: "B" });
    }
  });
}

/* ---------- 이동 경로 ---------- */
const mapHtml = r => r.img
  ? `<img src="${esc(r.img)}" alt="지도" loading="lazy">`
  : (r.fromQ && r.toQ
    ? `<iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?saddr=${enc(r.fromQ)}&amp;daddr=${enc(r.toQ)}&amp;output=embed"></iframe>`
    : '<div class="sub">지도가 아직 없어요.</div>');
const dirUrl = r => `https://www.google.com/maps/dir/?api=1&amp;origin=${enc(r.fromQ || "")}&amp;destination=${enc(r.toQ || "")}&amp;travelmode=driving`;

export function pageRoute(ctx) {
  const days = S.get("schedule");
  const routes = S.get("routes");
  const di = dayIndex(days, ctx.args[0]);
  const list = routes.map((r, i) => ({ r, i })).filter(({ r }) => Number(r.day) === di);

  const fields = [
    { k: "day", label: "날짜", type: "select", options: days.map((d, i) => [String(i + 1), `DAY ${i + 1} (${d.label})`]) },
    { k: "title", label: "제목 (예: 공항 → 아리랑 식당)", req: true },
    { k: "fromQ", label: "출발지 (구글맵 검색어 · 정확한 이름이나 주소)" },
    { k: "toQ", label: "도착지 (구글맵 검색어)" },
    { k: "time", label: "소요 시간 (예: 약 40분)" },
    { k: "dist", label: "거리 (예: 약 12km)" },
    { k: "note", label: "메모", type: "textarea", rows: 3 },
    { k: "img", label: "지도 이미지 경로 (선택 · 예: assets/routes/day1.png)" },
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

  const cards = list.map(({ r, i }) => `
    <details class="route" data-k="r${i}">
      <summary>${esc(r.title)}${r.todo ? '<span class="badge b-todo">장소 확인 필요</span>' : ""}</summary>
      <div class="route-body">
        <div class="kv">⏱ 소요 시간: ${r.time ? esc(r.time) : "조사 중"}</div>
        <div class="kv">📏 거리: ${r.dist ? esc(r.dist) : "조사 중"}</div>
        ${r.note ? `<div class="kv">📝 ${esc(r.note)}</div>` : ""}
        <div class="map-wrap">${mapHtml(r)}</div>
        <a class="btn primary" target="_blank" rel="noopener" href="${dirUrl(r)}">구글맵에서 길찾기</a>
        ${ed() ? `<div class="row" style="margin-top:10px"><button class="mini" data-act="editRoute" data-i="${i}">✏️ 수정</button><button class="mini" data-act="up" data-i="${i}">▲</button><button class="mini" data-act="down" data-i="${i}">▼</button></div>` : ""}
      </div>
    </details>`).join("");

  const html = `
    <h2>🗺️ 이동 경로</h2>
    <div class="daybtns">${days.map((d, i) => `<a class="${i + 1 === di ? "on" : ""}" href="#/route/${i + 1}">${esc(d.label)}<br>DAY ${i + 1}</a>`).join("")}</div>
    ${cards || '<div class="empty">이 날의 이동 경로가 아직 없어요.</div>'}
    ${addBtn("addRoute", "경로 추가")}
    ${resetBar("routes")}`;

  page(ctx, html, {
    reset: d => doReset(d.id),
    editRoute: d => openForm({
      title: "경로 수정", fields, values: { ...routes[d.i], day: String(routes[d.i].day) },
      onSave: v => mut("routes", a => { a[d.i] = fix(v); }),
      onDelete: () => mut("routes", a => { a.splice(d.i, 1); })
    }),
    addRoute: () => openForm({
      title: "경로 추가", fields, values: { day: String(di) },
      onSave: v => mut("routes", a => { a.push(fix(v)); })
    }),
    up: d => move(Number(d.i), -1),
    down: d => move(Number(d.i), 1)
  });
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
        toast(n ? "공지를 수정했어요" : "공지를 올렸어요 📢", 2000);
        return true;
      } catch (e) { alert("저장하지 못했어요.\n" + (e.message || e)); return false; }
    }
  });
}

export function pageNotice(ctx) {
  const f = ctx.args[0] || "all";
  const t = S.state.teacher;
  let list = S.state.notices.slice();
  if (f === "common") list = list.filter(n => n.cls === 0);
  else if (/^[1-6]$/.test(f)) list = list.filter(n => n.cls === 0 || n.cls === Number(f));
  list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  const tabs = [["all", "전체"], ["common", "공통"], ...CLASSES.map(c => [String(c), c + "반"])];
  const canEdit = n => t && (n.authorUid === t.uid || t.classNo === 0);

  const cards = list.map(n => `
    <article class="card notice ${n.pinned ? "pinned" : ""}">
      <h4>${n.pinned ? "📌 " : ""}${esc(n.title)} <span class="badge ${n.cls === 0 ? "b-c" : ""}">${n.cls === 0 ? "공통" : n.cls + "반"}</span></h4>
      <div class="body">${esc(n.body)}</div>
      <div class="meta">${esc(n.authorName || "")} · ${fmtTime(n.createdAt)}${n.updatedAt ? " (수정됨)" : ""}</div>
      ${canEdit(n) ? `<div class="row end"><button class="mini" data-act="editN" data-id="${n.id}">✏️ 수정</button><button class="mini danger" data-act="delN" data-id="${n.id}">삭제</button></div>` : ""}
    </article>`).join("");

  const html = `
    <h2>📢 공지 사항</h2>
    ${offlineBanner()}
    <div class="tabs">${tabs.map(([k, l]) => `<a class="tab ${f === k ? "on" : ""}" href="#/notice/${k}">${l}</a>`).join("")}</div>
    <div class="banner-warn">🚨 담임 선생님 긴급 연락처는 📌 고정 공지로 올라와요.</div>
    ${t ? '<div class="addbar"><button class="btn primary" data-act="newN">＋ 공지 쓰기</button></div>' : '<div class="sub">선생님은 메뉴(☰)에서 로그인하면 공지를 쓸 수 있어요.</div>'}
    ${cards || `<div class="empty">${S.state.noticesReady || !S.configured ? "공지가 아직 없어요." : "불러오는 중…"}</div>`}`;

  page(ctx, html, {
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
  { k: "img", label: "사진 경로 (예: assets/learn/war.jpg)" },
  { k: "summary", label: "한 줄 소개", type: "textarea", rows: 3 }
];
const TOPIC_FIELDS = [
  { k: "title", label: "제목", req: true },
  { k: "body", label: "내용", type: "textarea", rows: 6 }
];
const spotImg = s => s.img ? `<img class="spot-img" src="${esc(s.img)}" alt="" onerror="this.style.display='none'">` : "";

export function pageLearn(ctx) {
  const spots = S.get("learn");
  const si = ctx.args[0] !== undefined ? parseInt(ctx.args[0], 10) : -1;

  if (si >= 0 && spots[si]) {
    const s = spots[si];
    const topics = (s.topics || []).map((tp, k) => `
      <details class="topic" data-k="t${k}" ${String(ctx.args[1]) === String(k) ? "open" : ""}>
        <summary>${esc(tp.title)}</summary>
        <p>${esc(tp.body)}</p>${pen("editTopic", `data-k="${k}"`)}
      </details>`).join("");
    const html = `
      <p><a href="#/learn">← 목록으로</a></p>
      <div class="card">
        ${spotImg(s)}
        <h3 style="margin:0">${esc(s.name)} <small class="sub">${esc(s.en || "")}</small> ${pen("editSpot", `data-i="${si}"`)}</h3>
        <p>${esc(s.summary || "")}</p>
        ${topics || '<div class="sub">내용을 준비 중이에요.</div>'}
        ${addBtn("addTopic", "내용 추가")}
      </div>
      <div class="card"><b>❓ 다 읽었나요?</b><p class="sub">퀴즈로 확인해 봐요!</p><a class="btn primary" href="#/quiz">퀴즈 풀기</a></div>
      ${resetBar("learn")}`;
    return page(ctx, html, {
      reset: d => doReset(d.id),
      editSpot: d => openForm({
        title: "장소 수정", fields: SPOT_FIELDS, values: s,
        onSave: v => mut("learn", a => { a[d.i] = { ...a[d.i], ...v }; }),
        onDelete: async () => { const ok = await mut("learn", a => { a.splice(d.i, 1); }); if (ok) location.hash = "#/learn"; return ok; }
      }),
      editTopic: d => openForm({
        title: "내용 수정", fields: TOPIC_FIELDS, values: s.topics[d.k],
        onSave: v => mut("learn", a => { a[si].topics[d.k] = v; }),
        onDelete: () => mut("learn", a => { a[si].topics.splice(d.k, 1); })
      }),
      addTopic: () => openForm({
        title: "내용 추가", fields: TOPIC_FIELDS,
        onSave: v => mut("learn", a => { (a[si].topics = a[si].topics || []).push(v); })
      })
    });
  }

  const cards = spots.map((s, i) => `
    <div class="card">
      ${spotImg(s)}
      <h3 style="margin:0">${esc(s.name)} <small class="sub">${esc(s.en || "")}</small></h3>
      <p>${esc(s.summary || "")}</p>
      <div class="row"><a class="btn primary" href="#/learn/${i}">자세히 보기</a>${pen("editSpot", `data-i="${i}"`)}</div>
    </div>`).join("");
  const html = `
    <h2>📚 배워 가기</h2>
    ${cards || '<div class="empty">아직 내용이 없어요.</div>'}
    ${addBtn("addSpot", "장소 추가")}
    <div class="card"><b>❓ O/X 퀴즈</b><p class="sub">배운 내용을 퀴즈로 확인하고 랭킹에 도전해요!</p><a class="btn primary" href="#/quiz">퀴즈 풀기</a></div>
    ${resetBar("learn")}`;
  page(ctx, html, {
    reset: d => doReset(d.id),
    editSpot: d => openForm({
      title: "장소 수정", fields: SPOT_FIELDS, values: spots[d.i],
      onSave: v => mut("learn", a => { a[d.i] = { ...a[d.i], ...v }; }),
      onDelete: () => mut("learn", a => { a.splice(d.i, 1); })
    }),
    addSpot: () => openForm({
      title: "장소 추가", fields: SPOT_FIELDS,
      onSave: v => mut("learn", a => { a.push({ ...v, topics: [] }); })
    })
  });
}

/* ---------- O/X 퀴즈 ---------- */
let run = null;
let scores = [];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const QUIZ_FIELDS = [
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
      ? `<ol class="rank">${scores.map((s, i) => `<li><span class="no">${["🥇", "🥈", "🥉"][i] || i + 1}</span><span class="nm">${esc(s.cls)}반 ${esc(s.name)}</span><span class="sc">${s.score}/${s.total}</span>${S.isTeacher() ? `<button class="mini danger" data-act="delScore" data-id="${s.id}">✕</button>` : ""}</li>`).join("")}</ol>`
      : '<div class="empty">아직 기록이 없어요. 첫 도전자가 되어 보세요!</div>';

  const qHtml = () => {
    if (!qs.length) return '<div class="card empty">퀴즈 문제가 아직 없어요.</div>';
    if (!run) return `<div class="card qbox"><h3>❓ O/X 퀴즈</h3><p>모두 ${qs.length}문제! 맞힌 개수로 랭킹이 정해져요.</p><button class="btn primary" data-act="start">시작하기</button></div>`;
    if (run.i < run.qs.length) {
      const q = run.qs[run.i];
      const last = run.i === run.qs.length - 1;
      return `<div class="card qbox">
        <div class="progress"><i style="width:${(run.i / run.qs.length) * 100}%"></i></div>
        <div class="sub">${run.i + 1} / ${run.qs.length}</div>
        <div class="qtext">${esc(q.q)}</div>
        ${run.ans === null
          ? '<div class="ox"><button class="o" data-act="ans" data-v="1">O</button><button class="x" data-act="ans" data-v="0">X</button></div>'
          : `<div class="fb ${run.ok ? "ok" : "no"}">${run.ok ? "정답! 🎉" : "아쉬워요 😢"}</div><p>${esc(q.exp || "")}</p><button class="btn primary" data-act="next">${last ? "결과 보기" : "다음 문제"}</button>`}
      </div>`;
    }
    const my = ls.get("myclass", 0) || 1;
    return `<div class="card qbox"><h3>결과</h3>
      <div class="qtext">${run.score} / ${run.qs.length} 점</div>
      ${run.saved ? '<p class="fb ok">랭킹에 등록했어요! 🏆</p>' : `
        <p>이름을 적고 랭킹에 등록해 보세요.</p>
        <div class="row" style="justify-content:center">
          <select id="qcls" style="padding:9px;border-radius:10px;border:1px solid #ddd">${CLASSES.map(c => `<option value="${c}" ${c === my ? "selected" : ""}>${c}반</option>`).join("")}</select>
          <input id="qname" maxlength="12" placeholder="이름" style="padding:9px;border-radius:10px;border:1px solid #ddd;width:140px">
        </div>
        <div style="margin-top:10px"><button class="btn primary" data-act="saveScore">랭킹 등록</button></div>`}
      <div style="margin-top:10px"><button class="btn ghost" data-act="start">다시 풀기</button></div>
    </div>`;
  };
  const drawQ = () => { const el = $("#qarea"); if (el) el.innerHTML = qHtml(); };

  const editCard = ed() ? `
    <div class="card"><h3>퀴즈 문제 편집</h3>
      ${qs.map((q, i) => `<div class="qrow"><span>${i + 1}. ${esc(q.q)} <b>${q.a ? "O" : "X"}</b></span><button class="mini" data-act="editQ" data-i="${i}">✏️</button></div>`).join("")}
      ${addBtn("addQ", "문제 추가")}
    </div>${resetBar("quiz")}` : "";

  page(ctx, `
    <h2>❓ O/X 퀴즈</h2>
    ${offlineBanner()}
    <div id="qarea"></div>
    <div class="card"><h3 style="margin-top:0">🏆 랭킹 TOP 20</h3><div id="rank">${rankHtml()}</div></div>
    ${editCard}`, {
    reset: d => doReset(d.id),
    start: () => { run = { qs: shuffle(qs), i: 0, score: 0, ans: null, ok: false, saved: false }; drawQ(); },
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
        run.saved = true; drawQ(); toast("랭킹에 등록했어요 🏆", 2000);
      } catch (e) { alert("등록하지 못했어요.\n" + (e.message || e)); }
    },
    delScore: async d => { if (confirm("이 기록을 삭제할까요?")) { try { await S.deleteScore(d.id); } catch (e) { alert(e.message || e); } } },
    editQ: d => openForm({
      title: "문제 수정", fields: QUIZ_FIELDS, values: { q: qs[d.i].q, a: String(qs[d.i].a), exp: qs[d.i].exp || "" },
      onSave: v => mut("quiz", a => { a[d.i] = { q: v.q, a: v.a === "true", exp: v.exp }; }),
      onDelete: () => mut("quiz", a => { a.splice(d.i, 1); })
    }),
    addQ: () => openForm({
      title: "문제 추가", fields: QUIZ_FIELDS, values: { a: "true" },
      onSave: v => mut("quiz", a => { a.push({ q: v.q, a: v.a === "true", exp: v.exp }); })
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
