// The Core labor guide, built from the files in resources/labor_guide/ rather than from code.
// - *.xml: labor rows in the provider's export shape (Note, Skill, LaborHours, Warranty,
//   LaborTypeName, LaborComponent). Top-level files are real exports; synthetic/ holds made-up rows
//   in the same shape. For the demo every row applies to every vehicle.
// - labor_guide_enrichment.json: WrenchIQ's own fields per row (id, display name, symptom keywords,
//   parts, customer talk track), matched to an XML row by component + note.
// - labor_guide_rules.json: guardrail relations between rows, read by laborRules.js.
// The scheduled-maintenance labor file is not a repair and is left out of the ranking table.
import ENRICH from '../../resources/labor_guide/labor_guide_enrichment.json';

const FILES = import.meta.glob(
  ['/resources/labor_guide/*.xml', '/resources/labor_guide/synthetic/*.xml', '!/resources/labor_guide/**/*scheduled_maintenance*'],
  { query: '?raw', import: 'default', eager: true },
);

const unescape = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const tag = (block, name) => {
  const m = block.match(new RegExp('<' + name + '>([\\s\\S]*?)</' + name + '>'));
  return m ? unescape(m[1]).trim() : '';
};

/** Rows of one labor-guide XML export. Empty tags (<Warranty/>) read as ''. */
export function parseLaborXml(text) {
  const out = [];
  for (const m of String(text).matchAll(/<labor>([\s\S]*?)<\/labor>/g)) {
    const b = m[1];
    out.push({
      note: tag(b, 'Note'), skill: tag(b, 'Skill'), hours: parseFloat(tag(b, 'LaborHours')), warranty: tag(b, 'Warranty'),
      laborType: tag(b, 'LaborTypeName'), component: tag(b, 'LaborComponent'),
    });
  }
  return out;
}

const keyOf = (component, note) => component + '|' + note;
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const titleCase = s => s.toLowerCase().replace(/^\w/, c => c.toUpperCase());

/** The demo rows first, then real exports, then the other synthetic files, so ties keep a stable order. */
const order = p => (/synthetic_core_demo/.test(p) ? 0 : /\/synthetic\//.test(p) ? 2 : 1);

export function buildLaborGuide(files = FILES, enrich = ENRICH.rows) {
  const byKey = new Map(enrich.map(e => [keyOf(e.component, e.note), e]));
  const rows = [];
  Object.keys(files).sort((a, b) => order(a) - order(b) || a.localeCompare(b)).forEach(path => {
    const file = path.split('/').pop(), synthetic = /\/synthetic\//.test(path);
    parseLaborXml(files[path]).forEach(x => {
      const e = byKey.get(keyOf(x.component, x.note)) || {};
      const id = e.id || slug(x.component + ' ' + x.note);
      rows.push({
        id, name: e.name || titleCase(x.note), hours: x.hours, row: e.row || 'XML-' + id,
        skill: x.skill, warranty: x.warranty, laborType: x.laborType, component: x.component, note: x.note,
        strong: e.strong || [], kw: e.kw || [], parts: e.parts || [], talk: e.talk, synthetic, file,
      });
    });
  });
  return rows;
}

export const REP = buildLaborGuide();

const sourceLine = r => (r.synthetic
  ? 'Synthetic labor guide row ' + r.row + ' (made-up estimate, not a published guide; used for every vehicle in this demo).'
  : 'Labor guide row ' + r.row + ' from ' + r.file + ' (' + r.laborType + (r.skill ? ', skill ' + r.skill : '') + (r.warranty ? ', warranty ' + r.warranty + ' h' : '') + '; used for every vehicle in this demo).');

export const REPMAP = Object.fromEntries(REP.map(r => [r.id, {
  id: r.id, name: r.name, hours: r.hours, src: 'lg', ref: r.row, parts: r.parts,
  skill: r.skill, warranty: r.warranty, laborType: r.laborType, component: r.component, note: r.note, talk: r.talk, synthetic: r.synthetic,
  detail: sourceLine(r) + ' Operation: ' + r.note + '. Labor time: ' + r.hours.toFixed(1) + ' h.',
}]));
