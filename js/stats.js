// 방문자 통계 (선생님 노트북 화면에서만 보임)
// Firestore stats/{YYYY-MM-DD} = { visitors: 그날 방문한 기기 수, hours: { "09": 그 시간에 들어온 기기 수, ... } }
import { getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc, getDocs, collection, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ls, vnNow } from "./util.js?v=20261113b";
import { configured } from "./store.js?v=20261113b";

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

// 엑셀에서 바로 열리는 CSV (한글이 깨지지 않게 BOM 포함)
export function toCsv(rows) {
  const out = ["날짜별 방문자 수", "날짜,방문자 수", ...rows.map(r => `${r.day},${r.visitors}`), "",
    "시간대별 방문자 수", "날짜,시간,방문자 수"];
  for (const r of rows) for (const h of HOURS) out.push(`${r.day},${h}시,${Number(r.hours[h]) || 0}`);
  return "﻿" + out.join("\r\n") + "\r\n";
}
