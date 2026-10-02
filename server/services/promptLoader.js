/**
 * WrenchIQ — server-side prompt loader. Every LLM prompt the server sends is a file in /prompts
 * (see prompts/README.md). Files are re-read when they change on disk,
 * so a prompt edit needs no server restart.
 */
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { renderPrompt, splitSections } from '../lib/promptTemplate.js';

const DIR = path.resolve(fileURLToPath(new URL('../../prompts/', import.meta.url)));
const cache = new Map(); // name -> { mtimeMs, text }

/** The raw template text of prompts/<name>.md. */
export function promptText(name) {
  const file = path.join(DIR, name + '.md');
  const { mtimeMs } = statSync(file);
  const hit = cache.get(name);
  if (hit && hit.mtimeMs === mtimeMs) return hit.text;
  const text = readFileSync(file, 'utf8');
  cache.set(name, { mtimeMs, text });
  return text;
}

/** prompts/<name>.md rendered with vars ({{var}}, {{#if var}}…{{/if}}). */
export function prompt(name, vars = {}) {
  return renderPrompt(promptText(name), vars, name);
}

/** One section ("## key") of prompts/<name>.md, rendered with vars. */
export function promptSection(name, key, vars = {}) {
  const sec = splitSections(promptText(name), name);
  if (!(key in sec)) throw new Error(`prompt "${name}": no section ${key}`);
  return renderPrompt(sec[key], vars, name + '#' + key);
}
