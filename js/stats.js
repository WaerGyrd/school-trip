// 방문자 통계 (선생님 노트북 화면에서만 보임)
// Firestore stats/{YYYY-MM-DD} = { visitors: 그날 방문한 기기 수, hours: { "09": 그 시간에 들어온 기기 수, ... } }
import { getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc, getDocs, collection, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ls, vnNow } from "./util.js?v=20261113f";
import { configured } from "./store.js?v=20261113f";

const db = () => getFirestore(getApp());
export const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));

// 사이트를 열 때 한 번 호출: 같은 기기는 하루에 한 번(방문자), 시간대별로 한 번(시간 통계)만 센다
export async function recordVisit() {
  if (!configured) return;
  try {
    const now = vnNow();
    const day = now.date, hh = now.time.slice(0, 2), hourKey = day + "T" + hh;
    if (ls.get("v_hour", "") === hourKey) return;
    const data = { hours: { [hh]: increment(1) } };
    if (ls.get("v_day", "") !== day) data.visitors = increment(1);
    await setDoc(doc(db(), "stats", day), data, { merge: true });
    ls.set("v_day", day);
    ls.set("v_hour", hourKey);
  } catch (e) { /* 보안 규칙이 아직 없으면 조용히 넘어감 */ }
}

// [{ day, visitors, hours }] 날짜순
export async function loadStats() {
  const snap = await getDocs(collection(db(), "stats"));
  return snap.docs.map(d => { const v = d.data() || {}; return { day: d.id, visitors: Number(v.visitors) || 0, hours: v.hours || {} }; })
    .filter(r => /^\d{4}-\d{2}-\d{2}$/.test(r.day))
    .sort((a, b) => a.day.localeCompare(b.day));
}

// 그날 가장 붐빈 시간 { h: "20", n: 46 } (기록 없으면 null)
export function peakOf(r) {
  let best = null;
  for (const h of HOURS) { const n = Number(r.hours[h]) || 0; if (n > 0 && (!best || n > best.n)) best = { h, n }; }
  return best;
}

// 엑셀에서 바로 열리는 CSV (한글이 깨지지 않게 BOM 포함)
// 위: 날짜별 요약 / 아래: 날짜(줄) × 0~23시(칸)
export function toCsv(rows) {
  const out = ["날짜별 방문자 수", "날짜,방문자 수,가장 붐빈 시간,그 시간 방문자"];
  for (const r of rows) { const p = peakOf(r); out.push(`${r.day},${r.visitors},${p ? Number(p.h) + "시" : ""},${p ? p.n : ""}`); }
  out.push(`합계,${rows.reduce((a, r) => a + r.visitors, 0)}`, "",
    "날짜 × 시간대별 방문자 수 (한 사람이 여러 시간에 들어오면 시간마다 따로 세서 가로로 더하면 하루 방문자 수보다 커요)",
    "날짜," + HOURS.map(h => Number(h) + "시").join(","));
  for (const r of rows) out.push(r.day + "," + HOURS.map(h => Number(r.hours[h]) || 0).join(","));
  return "\uFEFF" + out.join("\r\n") + "\r\n";
}
