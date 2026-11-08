export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const hashNum = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

// 브라우저에 저장하는 작은 메모 (내 반, 알림 설정 등)
export const ls = {
  get(k, d) { try { const v = localStorage.getItem("kt_" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("kt_" + k, JSON.stringify(v)); } catch (e) {} }
};

// 화면 위쪽에 잠깐 뜨는 알림
export function toast(msg, ms = 3500) {
  const box = $("#toasts");
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => el.classList.add("hide"), ms);
  setTimeout(() => el.remove(), ms + 500);
}

// 알림 소리 (화면을 한 번 터치한 뒤부터 소리가 나요)
let actx;
export function beep() {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.connect(g); g.connect(actx.destination);
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.15, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.4);
    o.start(); o.stop(actx.currentTime + 0.4);
  } catch (e) {}
}

// 베트남(+07:00) 기준 현재 날짜/시간
export function vnNow() {
  const d = new Date();
  return {
    date: d.toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }),
    time: d.toLocaleTimeString("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" })
  };
}

export function fmtTime(ts) {
  if (ts && ts.toDate) return ts.toDate().toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  return "방금";
}

// 팝업
export function openModal(html) {
  $("#modalBox").innerHTML = html;
  $("#modal").hidden = false;
  return $("#modalBox");
}
export function closeModal() {
  $("#modal").hidden = true;
  $("#modalBox").innerHTML = "";
}

function fieldHtml(f, v) {
  v = v ?? f.def ?? "";
  const label = esc(f.label);
  const req = f.req ? "required" : "";
  if (f.type === "textarea") return `<label>${label}<textarea name="${f.k}" rows="${f.rows || 4}" ${req}>${esc(v)}</textarea></label>`;
  if (f.type === "select") return `<label>${label}<select name="${f.k}">${f.options.map(([val, lab]) => `<option value="${esc(val)}" ${String(val) === String(v) ? "selected" : ""}>${esc(lab)}</option>`).join("")}</select></label>`;
  if (f.type === "check") return `<label class="chk"><input type="checkbox" name="${f.k}" ${v ? "checked" : ""}> ${label}</label>`;
  if (f.type === "file") return `<label>${label}<input type="file" name="${f.k}" accept="image/*" ${req}></label>`;
  return `<label>${label}<input name="${f.k}" type="${f.type || "text"}" value="${esc(v)}" placeholder="${esc(f.ph || "")}" ${req}></label>`;
}

// 입력 팝업 (제목, 입력칸 목록, 저장 함수)
export function openForm({ title, fields, values = {}, onSave, onDelete, saveText = "저장" }) {
  const box = openModal(`
    <h3>${esc(title)}</h3>
    <form id="mf" autocomplete="off">
      ${fields.map(f => fieldHtml(f, values[f.k])).join("")}
      <div class="row end">
        ${onDelete ? '<button type="button" class="btn danger" id="mfDel">삭제</button>' : ""}
        <span class="grow"></span>
        <button type="button" class="btn ghost" id="mfCancel">취소</button>
        <button type="submit" class="btn primary" id="mfSave">${esc(saveText)}</button>
      </div>
    </form>`);
  const form = $("#mf", box);
  $("#mfCancel", box).onclick = closeModal;
  if (onDelete) {
    $("#mfDel", box).onclick = async () => {
      if (!confirm("정말 삭제할까요?")) return;
      const ok = await onDelete();
      if (ok !== false) closeModal();
    };
  }
  form.onsubmit = async e => {
    e.preventDefault();
    const out = {};
    for (const f of fields) {
      const el = form.elements[f.k];
      if (f.type === "check") out[f.k] = el.checked;
      else if (f.type === "file") out[f.k] = el.files[0] || null;
      else if (f.type === "number") out[f.k] = Number(el.value);
      else out[f.k] = el.value.trim();
    }
    const btn = $("#mfSave", box);
    btn.disabled = true;
    const ok = await onSave(out);
    if (ok === false) btn.disabled = false; else closeModal();
  };
  const first = form.querySelector("input:not([type=file]),textarea,select");
  if (first) first.focus();
  return box;
}

// 사진을 작게 줄여서 글자(base64)로 바꿔요 (Firebase 무료 요금제용)
export function compressImage(file, max = 900, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const r = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * r), h = Math.round(img.height * r);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      let q = quality, out = c.toDataURL("image/jpeg", q);
      while (out.length > 650000 && q > 0.3) { q -= 0.1; out = c.toDataURL("image/jpeg", q); }
      URL.revokeObjectURL(url);
      resolve(out);
    };
    img.onerror = () => reject(new Error("사진을 읽을 수 없어요"));
    img.src = url;
  });
}
