import { describe, it, expect } from 'vitest';
import { renderPrompt, splitSections } from '../server/lib/promptTemplate.js';

describe('prompt templates', () => {
  it('fills placeholders, including dotted paths', () => {
    expect(renderPrompt('Hi {{name}} at {{shop.name}}', { name: 'Ana', shop: { name: 'Cornerstone' } })).toBe('Hi Ana at Cornerstone');
  });
  it('throws on a missing value instead of sending a hole', () => {
    expect(() => renderPrompt('Rate {{rate}}', {}, 'x')).toThrow(/prompt "x": no value for \{\{rate\}\}/);
    expect(renderPrompt('Rate {{rate}}', { rate: 0 })).toBe('Rate 0');
  });
  it('if / else / unless blocks, nested; empty arrays are false', () => {
    const t = '{{#if a}}A{{#if b}}B{{else}}notB{{/if}}{{/if}}{{#unless c}}-noC{{/unless}}{{#if list}}L{{/if}}';
    expect(renderPrompt(t, { a: 1, b: 0, c: false, list: [] })).toBe('AnotB-noC');
    expect(renderPrompt(t, { a: 0, c: true, list: [1] })).toBe('L');
  });
  it('strips the editor note at the top and collapses blank runs', () => {
    expect(renderPrompt('<!-- used by x.js -->\n\nLine 1\n\n\n\nLine 2', {})).toBe('Line 1\n\nLine 2');
  });
  it('rejects unbalanced blocks', () => {
    expect(() => renderPrompt('{{#if a}}open', { a: 1 }, 'bad')).toThrow(/unbalanced/);
  });
  it('splits ## sections', () => {
    expect(splitSections('<!-- note -->\n## a\nOne {{x}}\n\n## b.c\nTwo\n')).toEqual({ a: 'One {{x}}', 'b.c': 'Two' });
    expect(() => splitSections('## a\n1\n## a\n2', 'd')).toThrow(/duplicate section a/);
  });
});
