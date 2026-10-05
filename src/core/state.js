// Module-level session store for the Core assistant. Plain mutable state plus a version
// counter, read from React with useCore(). Lives outside the components so a conversation
// survives switching to the classic UI and back.
import { useSyncExternalStore } from 'react';

const newChat = () => ({ items: [], chips: [], nextId: 1 });
/** Random id for labeling Langfuse traces; not security-sensitive. */
export const newId = () => (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2));
export const newRO = () => ({
  vin: '', year: '', make: '', model: '', engine: '', mileage: '', symptom: '',
  answers: {}, accepted: new Set(), dismissed: new Set(), awaiting: null, lastTop: [],
  shownMaint: '', started: false, custom: {}, hoursOv: {}, nextCustom: 1, rateNudged: false,
  parts: { added: [], lastQ: '' },
  autoPriced: new Set(), // repairs whose parts were already looked up when added
  needCyl: [], // per-cylinder parts (spark plugs, coils) waiting for the engine: { forLine, part, res, fit }
  agent: { history: [], model: '', sessionId: newId() }, // sessionId groups this RO's agent steps in Langfuse
});

export const S = {
  mode: 'profile',
  booted: false,
  auth: null, // mock sign-in: { email, at } once the shop user clicked Log in (SignIn.jsx)
  demo: null, // click-through demo in progress: { id, step }
  useAgent: true, // Repair order mode: the agent answers (true) or the scripted rules do (false)
  profile: {},
  skipped: new Set(),
  pro: { awaiting: null, started: false },
  ro: newRO(),
  chats: { profile: newChat(), ro: newChat() },
  // PartsTech tab: the session shown there (a 'partstech' chat card) and whether the tab is showing.
  // PartsTech lives in its own tab, in a frame that stays loaded while other tabs are in front.
  pt: { card: null, open: false },
};

const listeners = new Set();
let version = 0;
export const notify = () => { version++; listeners.forEach(l => l()); };
const subscribe = cb => { listeners.add(cb); return () => listeners.delete(cb); };
export const useCore = () => { useSyncExternalStore(subscribe, () => version); return S; };

const LS = 'wrenchiq-core-profile';
export function loadProfile() {
  try {
    const r = localStorage.getItem(LS);
    if (r) { const o = JSON.parse(r); if (o && typeof o === 'object') S.profile = o; }
  } catch (_) { /* storage can be blocked; run without it */ }
}
export function persistProfile() {
  try { localStorage.setItem(LS, JSON.stringify(S.profile)); } catch (_) { /* see above */ }
}
