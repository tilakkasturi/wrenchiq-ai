// Free-text matching helpers. Pure functions, no state.

const STOP = new Set(['when', 'only', 'that', 'with', 'time', 'work', 'service', 'and', 'the', 'all', 'from', 'over', 'just', 'this', 'have', 'been', 'some', 'into', 'than', 'then', 'them', 'they', 'what', 'your', 'you', 'are', 'was', 'for', 'not']);
export const stems = l => l.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 4 && !STOP.has(w)).map(w => w.slice(0, 4));

const RXG = {
  Yes: /\b(yes|yeah|yep|yup|sure|correct|it does|they do|definitely)\b/i,
  No: /\b(no|nope|nah|not really|never)\b/i,
  'Not sure': /not sure|idk|don'?t know|dunno/i,
  None: /\b(none|nothing|nope|no)\b/i,
  'A/C service': /\ba\/?c\b|air ?con/i,
  'Body work': /\bbody\b/i,
  Other: /\bother\b/i,
  Alignment: /align/i,
  Tires: /\btires?\b/i,
  Diesel: /diesel/i,
  'Depends on the job': /depend|varies/i,
  OEM: /\boem\b|original/i,
  Formal: /formal|professional/i,
  'Friendly and plain': /friendly|plain|casual|warm/i,
  'Short and direct': /short|direct|brief|terse/i,
  Grinding: /grind/i,
  Squeal: /squeal|squeak|screech/i,
};

export function scoreOpts(opts, text) {
  const t = text.toLowerCase();
  return opts.map(o => {
    let s = 0;
    const rx = RXG[o];
    if (rx && rx.test(t)) s = 10;
    else stems(o).forEach(x => { if (t.includes(x)) s++; });
    return { o, s };
  }).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
}

export function matchOne(opts, text) {
  const sc = scoreOpts(opts, text);
  if (!sc.length) return null;
  const top = sc.filter(x => x.s === sc[0].s);
  if (top.length > 1) return { amb: top.map(x => x.o) };
  return { o: sc[0].o };
}

export const words = t => t.split(/\s+/).filter(w => w.replace(/[^a-z]/gi, '').length >= 3);
export const numIn = t => {
  const m = t.replace(/,/g, '').match(/\$?\s*(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
};
