// Chat log API handed to the harness. The harness emits events (message, trace, card,
// question chips, log line); this turns them into items the UI renders.
import { S, notify } from './state';

export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const REDUCED = typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createChat(mode, getHandler) {
  const chat = () => S.chats[mode];
  const push = item => { item.id = chat().nextId++; chat().items.push(item); notify(); return item; };
  let chain = Promise.resolve();

  const api = {
    user(text) { chat().chips = []; return push({ kind: 'user', text }); },
    async agent(text, why) {
      const typing = push({ kind: 'typing' });
      await sleep(REDUCED ? 0 : Math.min(260 + text.length * 5, 850));
      chat().items = chat().items.filter(i => i !== typing);
      push({ kind: 'agent', text, why });
    },
    event(text) { push({ kind: 'event', text }); },
    // typing indicator while a slow call is in flight; call the returned function to remove it
    typing() {
      const it = push({ kind: 'typing' });
      return () => { chat().items = chat().items.filter(i => i !== it); notify(); };
    },
    async trace(labels) {
      const it = push({ kind: 'trace', labels, run: -1, done: 0 });
      for (let i = 0; i < labels.length; i++) {
        it.run = i; notify();
        await sleep(REDUCED ? 0 : 170);
        it.done = i + 1;
      }
      it.run = -1; notify();
    },
    card(card) { push({ kind: 'cards', card }); },
    chips(list) { chat().chips = list; notify(); },
    run(fn) { chain = chain.then(fn).catch(e => console.error(e)); return chain; },
    // silent: the text is an internal token, so no user bubble
    send(text, { silent = false } = {}) {
      if (silent) { chat().chips = []; notify(); } else api.user(text);
      return api.run(() => getHandler()(text));
    },
    clear() { chat().items = []; chat().chips = []; notify(); },
  };
  return api;
}
