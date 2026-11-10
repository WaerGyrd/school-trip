const F = () => window.__FAKE || {};
export const getAuth = () => ({});
export function onAuthStateChanged(auth, cb) {
  setTimeout(() => cb(F().teacher ? { uid: "t1" } : null), 0);
  return () => {};
}
export const signInWithEmailAndPassword = () => Promise.reject({ code: "auth/fake" });
export const signOut = () => Promise.resolve();
