/**
 * WrenchIQ — prompt templates. Every LLM prompt lives as a Markdown file in /prompts; this renders one.
 *
 * Syntax (deliberately small, so a prompt file reads like the prompt):
 *   {{name}}                      the value of vars.name (dotted paths allowed: {{shop.name}})
 *   {{#if name}} ... {{/if}}      the block only when vars.name is truthy (an empty array is falsy)
 *   {{#if name}} ... {{else}} ... {{/if}}
 *   {{#unless name}} ... {{/unless}}
 *   ## key                        (sections) a file can hold several short prompts, each under a
 *                                 "## key" heading; promptSections() returns { key: text }. Used for
 *                                 tool descriptions and canned task messages.
 * Blocks may nest. A leading block of HTML comments (<!-- ... -->) is a note for editors and is
 * stripped. A placeholder with no value throws, so a renamed variable fails loudly instead of
 * sending the model a hole. Shared by the server (promptLoader.js) and the browser
 * (src/services/promptLoader.js), so both read prompts the same way.
 */

const get = (vars, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), vars);
const truthy = v => (Array.isArray(v) ? v.length > 0 : !!v);

/** Strip the editor note(s) at the top of a prompt file. */
export function stripNotes(text) {
  return String(text).replace(/^﻿?(?:\s*<!--[\s\S]*?-->)+\s*/, '');
}

function renderBlocks(t, vars, name) {
  // innermost blocks first, so nesting works without a parser
  const rx = /\{\{#(if|unless) ([\w.]+)\}\}((?:(?!\{\{#(?:if|unless) )[\s\S])*?)\{\{\/\1\}\}/;
  let m;
  while ((m = t.match(rx))) {
    const [all, kind, key, body] = m;
    const [yes, no = ''] = body.split('{{else}}');
    const on = truthy(get(vars, key)) === (kind === 'if');
    t = t.replace(all, on ? yes : no);
  }
  if (/\{\{[#/]|\{\{else\}\}/.test(t)) throw new Error(`prompt "${name}": unbalanced {{#if}} / {{/if}} block`);
  return t;
}

/** Render a prompt template with vars. */
export function renderPrompt(text, vars = {}, name = '(inline)') {
  let t = renderBlocks(stripNotes(text), vars, name);
  t = t.replace(/\{\{([\w.]+)\}\}/g, (_, key) => {
    const v = get(vars, key);
    if (v === undefined || v === null) throw new Error(`prompt "${name}": no value for {{${key}}}`);
    return String(v);
  });
  return t.replace(/\n{3,}/g, '\n\n').trim();
}

/** Split a sectioned prompt file ("## key" headings) into { key: raw template text }. */
export function splitSections(text, name = '(inline)') {
  const out = {};
  let key = null;
  for (const line of stripNotes(text).split('\n')) {
    const m = line.match(/^## (\S+)\s*$/);
    if (m) { key = m[1]; if (key in out) throw new Error(`prompt "${name}": duplicate section ${key}`); out[key] = []; }
    else if (key) out[key].push(line);
  }
  return Object.fromEntries(Object.entries(out).map(([k, l]) => [k, l.join('\n').trim()]));
}
