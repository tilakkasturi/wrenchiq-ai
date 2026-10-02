// Browser-side prompt loader. The prompts in /prompts are bundled at build time (and hot-reload in
// the dev server); rendering is shared with the server (server/lib/promptTemplate.js).
import { renderPrompt, splitSections } from '../../server/lib/promptTemplate.js';

const FILES = import.meta.glob('/prompts/*.md', { query: '?raw', import: 'default', eager: true });
const BY_NAME = Object.fromEntries(Object.entries(FILES).map(([p, text]) => [p.split('/').pop().replace(/\.md$/, ''), text]));

/** prompts/<name>.md rendered with vars. */
export function prompt(name, vars = {}) {
  const text = BY_NAME[name];
  if (text === undefined) throw new Error('No prompt named "' + name + '" in /prompts');
  return renderPrompt(text, vars, name);
}

/** One section ("## key") of prompts/<name>.md, rendered with vars. */
export function promptSection(name, key, vars = {}) {
  const text = BY_NAME[name];
  if (text === undefined) throw new Error('No prompt named "' + name + '" in /prompts');
  const sec = splitSections(text, name);
  if (!(key in sec)) throw new Error('prompt "' + name + '": no section ' + key);
  return renderPrompt(sec[key], vars, name + '#' + key);
}
