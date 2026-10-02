<!--
3C narrative: one labor or part line of am3c-narrative-user.md (the code indents each line by two spaces).
Loaded by src/services/am3cLLMService.js buildUserMessage() with promptSection().
  labor: description
  part:  description, partNumber (may be empty), qty
-->

## labor
- {{description}}

## part
- {{description}} | P/N: {{#if partNumber}}{{partNumber}}{{else}}N/A{{/if}} | Qty: {{qty}}
