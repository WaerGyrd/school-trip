// 테스트용 가짜 Firestore. window.__FAKE 를 읽고, 쓰기는 window.__WRITES 에 기록만 한다.
const F = () => window.__FAKE || {};
const W = () => (window.__WRITES = window.__WRITES || []);
const L = () => (window.__LISTENERS = window.__LISTENERS || {});
const ts = v => {
  const d = v instanceof Date ? v : new Date(v ?? Date.now());
  return { toDate: () => d, seconds: Math.floor(d / 1000) };
};
export const getFirestore = () => ({});
export const doc = (db, ...p) => ({ path: p.join("/") });
export const collection = (db, ...p) => ({ path: p.join("/") });
export const query = c => ({ path: c.path });
export const orderBy = () => ({});
export const limit = () => ({});
export const serverTimestamp = () => ts();
export const increment = n => ({ __inc: n });

function listOf(path) {
  const f = F();
  if (path === "announcements") return f.notices || [];
  if (path === "scores") return f.scores || [];
  if (path === "photos") return f.photos || [];
  return [];
}
const docSnap = d => ({ id: d.id, data: () => ({ ...d, createdAt: d.createdAt ? ts(d.createdAt) : undefined }), metadata: { hasPendingWrites: false } });
function collSnap(path, added = []) {
  return {
    docs: listOf(path).map(docSnap),
    docChanges: () => added.map(d => ({ type: "added", doc: docSnap(d) })),
  };
}
export function onSnapshot(ref, cb) {
  if (F().offline) return () => {};
  const path = ref.path;
  (L()[path] = L()[path] || []).push(cb);
  setTimeout(() => {
    if (path.startsWith("content/")) {
      const id = path.slice(8);
      const v = (F().content || {})[id];
      const data = v === undefined ? null : { json: JSON.stringify(v) };
      cb({ exists: () => !!data, data: () => data, metadata: { hasPendingWrites: false } });
    } else cb(collSnap(path));
  }, 0);
  return () => {};
}
// 테스트에서 새 공지 도착을 흉내낼 때 사용
window.__pushNotice = n => {
  const f = F();
  f.notices = [n, ...(f.notices || [])];
  (L().announcements || []).forEach(cb => cb(collSnap("announcements", [n])));
};
export const getDoc = async ref => {
  const t = F().teacher;
  const ok = ref.path === "teachers/t1" && t;
  return { exists: () => !!ok, data: () => t };
};
export const setDoc = async (ref, data) => { W().push({ op: "set", path: ref.path, data }); };
export const updateDoc = async (ref, data) => { W().push({ op: "update", path: ref.path, data }); };
export const deleteDoc = async ref => { W().push({ op: "delete", path: ref.path }); };
export const addDoc = async (ref, data) => { W().push({ op: "add", path: ref.path, data }); return { id: "new" + W().length }; };
// 방문자 통계: stats/{날짜} 문서들
export const getDocs = async ref => {
  const f = F();
  const src = ref.path === "stats" ? (f.stats || {}) : {};
  return { docs: Object.entries(src).map(([id, d]) => ({ id, data: () => d })) };
};
