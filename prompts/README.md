# Prompts

Every prompt WrenchIQ sends to a language model lives here, one Markdown file per prompt. Code never
inlines prompt wording: it computes the data (lists, JSON, numbers) and renders a file from here.

- Server code: `import { prompt, promptSection } from 'server/services/promptLoader.js'` — files are
  re-read when they change, no restart needed.
- Browser code: `import { prompt, promptSection } from 'src/services/promptLoader.js'` — bundled at
  build time, hot-reloaded in the dev server.
- Rendering: `server/lib/promptTemplate.js`.

## Template syntax

| Syntax | Meaning |
|---|---|
| `{{name}}`, `{{shop.name}}` | value of a variable (a missing one throws) |
| `{{#if name}} … {{else}} … {{/if}}` | block only when the variable is truthy (empty array = false) |
| `{{#unless name}} … {{/unless}}` | block only when it is falsy |
| `## key` | section: one file holding several short prompts (tool descriptions, canned tasks); read with `promptSection(file, key)` |
| `<!-- … -->` at the top | note for editors (who loads the file, which variables it takes); stripped before sending |

Runs of 3+ blank lines collapse to one blank line and the result is trimmed.

Naming: kebab-case, `<feature>-<role>.md`, e.g. `core-ro-agent-system.md`, `three-c-score.md`.
