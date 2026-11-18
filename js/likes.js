// 선생님 소개 좋아요 (누적)
// Firestore likes/{선생님 id} = { count: 지금까지 받은 좋아요 수 }. 한 기기에서 선생님마다 한 번씩만 누를 수 있다.
import { getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc, collection, onSnapshot, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ls } from "./util.js?v=20261118a";
import { configured } from "./store.js?v=20261118a";

const counts = {};
const pending = {};
let started = false, onChange = null;
const notify = () => { if (onChange) onChange(); };

export const countOf = id => (counts[id] || 0) + (pending[id] || 0);
export const liked = id => !!ls.get("like_" + id, false);

// 화면이 바뀔 때마다 새 콜백으로 갈아끼운다 (리스너는 하나만 유지)
export function watchLikes(cb) {
  onChange = cb;
  if (started || !configured) return;
  started = true;
  try {
    onSnapshot(collection(getFirestore(getApp()), "likes"), snap => {
      snap.docs.forEach(d => { counts[d.id] = Number((d.data() || {}).count) || 0; pending[d.id] = 0; });
      notify();
    }, () => {});
  } catch (e) { /* 규칙이 없으면 0으로 보임 */ }
}

export async function addLike(id) {
  if (liked(id) || !configured) return false;
  ls.set("like_" + id, true);
  pending[id] = (pending[id] || 0) + 1;
  notify();
  try {
    await setDoc(doc(getFirestore(getApp()), "likes", id), { count: increment(1) }, { merge: true });
    return true;
  } catch (e) {
    ls.set("like_" + id, false);
    pending[id] = Math.max(0, (pending[id] || 0) - 1);
    notify();
    return false;
  }
}
