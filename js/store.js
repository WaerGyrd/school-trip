import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, collection, onSnapshot, setDoc, deleteDoc, addDoc, updateDoc, getDoc,
  query, orderBy, limit, serverTimestamp, increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";
import { DEFAULTS } from "./data.js";

// firebase-config.js 를 아직 안 고쳤으면 "연결 전 모드"로 동작해요 (기본 내용만 보임)
export const configured = !String(firebaseConfig.apiKey).startsWith("여기에");

export const state = { user: null, teacher: null, content: {}, notices: [], noticesReady: false, editMode: false, ready: false };

const handlers = {};
export const on = (ev, fn) => { (handlers[ev] = handlers[ev] || []).push(fn); };
const emit = (ev, data) => (handlers[ev] || []).forEach(fn => { try { fn(data); } catch (e) { console.error(e); } });

let db = null, auth = null;
const IDS = ["schedule", "routes", "learn", "quiz", "teachers", "settings"];
const chk = () => { if (!db) throw new Error("Firebase가 아직 연결되지 않았어요. (js/firebase-config.js 를 확인하세요)"); };

// 저장된 내용이 있으면 그걸, 없으면 data.js 기본값을 돌려줘요
export function get(id) {
  const v = state.content[id];
  return v !== undefined ? v : DEFAULTS[id];
}
export const isOverridden = id => state.content[id] !== undefined;
export function settings() {
  const s = state.content.settings || {};
  return { home: { ...DEFAULTS.settings.home, ...(s.home || {}) }, teams: s.teams || DEFAULTS.settings.teams || {} };
}
export const isTeacher = () => !!state.teacher;
export const isSuper = () => !!state.teacher && state.teacher.classNo === 0;
export const isEditing = () => isTeacher() && state.editMode;
export function setEditMode(v) {
  state.editMode = !!v && isTeacher();
  emit("auth");
  emit("data", { src: "auth" });
}

function markReady() {
  if (state.ready) return;
  state.ready = true;
  emit("ready");
}

export function init() {
  if (!configured) { markReady(); return; }
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

  // 안 오면 3초 뒤에 기본 내용으로 먼저 보여줘요
  setTimeout(markReady, 3000);

  // 1) 일정·경로·퀴즈 등 "수정 가능한 내용"
  let pending = IDS.length;
  IDS.forEach(id => {
    let first = true;
    const firstDone = () => { if (first) { first = false; if (--pending === 0) markReady(); } };
    onSnapshot(doc(db, "content", id), snap => {
      const d = snap.exists() ? snap.data() : null;
      let val;
      if (d) { try { val = JSON.parse(d.json); } catch (e) { val = undefined; } }
      if (val === undefined || val === null) delete state.content[id]; else state.content[id] = val;
      const remote = !first && !snap.metadata.hasPendingWrites && !(d && state.user && d.byUid === state.user.uid);
      if (remote) emit("content", { id, by: d ? d.by : "" });
      emit("data", { src: "content", id });
      firstDone();
    }, err => { console.error(err); firstDone(); });
  });

  // 2) 로그인 상태
  onAuthStateChanged(auth, async u => {
    state.user = u;
    state.teacher = null;
    if (u) {
      try {
        const s = await getDoc(doc(db, "teachers", u.uid));
        if (s.exists()) {
          const c = s.data().classNo;
          state.teacher = { uid: u.uid, name: s.data().name || "선생님", classNo: typeof c === "number" ? c : -1 };
        }
      } catch (e) { console.error(e); }
    }
    state.editMode = !!state.teacher;
    emit("auth");
    emit("data", { src: "auth" });
  });

  // 3) 공지
  let firstN = true;
  onSnapshot(query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(100)), snap => {
    state.notices = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    state.noticesReady = true;
    if (!firstN) {
      snap.docChanges().forEach(ch => {
        if (ch.type === "added" && !ch.doc.metadata.hasPendingWrites) {
          const n = { id: ch.doc.id, ...ch.doc.data() };
          if (!(state.user && n.authorUid === state.user.uid)) emit("notice", n);
        }
      });
    }
    firstN = false;
    emit("data", { src: "notice" });
  }, err => { console.error(err); state.noticesReady = true; emit("data", { src: "notice" }); });
}

/* ---------- 로그인 ---------- */
export const login = (email, pw) => { chk(); return signInWithEmailAndPassword(auth, email, pw); };
export const logout = () => (auth ? signOut(auth) : null);

/* ---------- 수정 가능한 내용 ---------- */
export async function saveContent(id, value) {
  chk();
  if (!state.teacher) throw new Error("교사 로그인이 필요해요");
  await setDoc(doc(db, "content", id), {
    json: JSON.stringify(value),
    updatedAt: serverTimestamp(),
    by: state.teacher.name,
    byUid: state.user.uid
  });
}
export const resetContent = id => { chk(); return deleteDoc(doc(db, "content", id)); };

/* ---------- 공지 ---------- */
export const addNotice = data => {
  chk();
  return addDoc(collection(db, "announcements"), { ...data, authorUid: state.user.uid, authorName: state.teacher.name, createdAt: serverTimestamp() });
};
export const updateNotice = (id, data) => { chk(); return updateDoc(doc(db, "announcements", id), { ...data, updatedAt: serverTimestamp() }); };
export const deleteNotice = id => { chk(); return deleteDoc(doc(db, "announcements", id)); };

/* ---------- 사진 ---------- */
export function watchPhotos(cb) {
  if (!db) { cb([]); return () => {}; }
  return onSnapshot(query(collection(db, "photos"), orderBy("createdAt", "desc"), limit(80)),
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))),
    e => { console.error(e); cb([]); });
}
export const addPhoto = d => { chk(); return addDoc(collection(db, "photos"), { ...d, likes: 0, createdAt: serverTimestamp() }); };
export const likePhoto = (id, delta) => { chk(); return updateDoc(doc(db, "photos", id), { likes: increment(delta) }); };
export const deletePhoto = id => { chk(); return deleteDoc(doc(db, "photos", id)); };

/* ---------- 퀴즈 랭킹 ---------- */
export function watchScores(cb) {
  if (!db) { cb([]); return () => {}; }
  return onSnapshot(query(collection(db, "scores"), orderBy("score", "desc"), limit(20)),
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))),
    e => { console.error(e); cb([]); });
}
export const addScore = d => { chk(); return addDoc(collection(db, "scores"), { ...d, createdAt: serverTimestamp() }); };
export const deleteScore = id => { chk(); return deleteDoc(doc(db, "scores", id)); };
