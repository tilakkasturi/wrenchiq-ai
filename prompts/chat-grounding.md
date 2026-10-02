<!--
Grounding fragments shared by the RO chat and shop chat system prompts (ro-chat-system.md, shop-chat-system.md).
Loaded section by section by server/services/chatFormatters.js:
  canned-jobs-none                 formatCannedJobsList, empty menu (no variables)
  canned-job                       formatCannedJobsList, one line per job: description, category, laborCost,
                                   laborHours, parts (joined "desc $cost" list, '' when none), total
  shop-profile-none                formatShopProfileSummary, no persisted profile (no variables)
  shop-profile                     formatShopProfileSummary: roCount, customerCount, avgRoValue, marginPct,
                                   jobs, parts, customers, seasonal (joined lists, '' when empty)
  shop-profile-part                one top part: name, price, hasPrice, supplier
  shop-profile-customer            one repeat customer: name, visits, since, spend
  shop-profile-season              one season: name, range, topJob, focus (joined "name Nx" list, '' when none)
-->

## canned-jobs-none
none on file

## canned-job
- {{description}} ({{#if category}}{{category}}{{else}}uncategorized{{/if}}): labor ${{laborCost}} ({{laborHours}} hrs) + parts [{{#if parts}}{{parts}}{{else}}no parts{{/if}}] = ${{total}} total

## shop-profile-none
none on file yet — no Shop Profile has been persisted for this shop (Settings → Predii Learn → Shop Profile → Persist Shop Profile)

## shop-profile
Overall: {{roCount}} ROs, {{customerCount}} customers, avg RO value ${{avgRoValue}}, margin {{marginPct}}%.
Top repair jobs: {{#if jobs}}{{jobs}}{{else}}none{{/if}}
Top parts: {{#if parts}}{{parts}}{{else}}none{{/if}}
Top repeat customers: {{#if customers}}{{customers}}{{else}}none{{/if}}
Seasonal patterns: {{#if seasonal}}{{seasonal}}{{else}}none{{/if}}

## shop-profile-part
{{name}}{{#if hasPrice}} ~${{price}}{{/if}}{{#if supplier}} via {{supplier}}{{/if}}

## shop-profile-customer
{{name}} ({{visits}} visits, customer since {{since}}, ${{spend}} lifetime)

## shop-profile-season
{{name}} ({{range}}): top job {{#if topJob}}{{topJob}}{{else}}n/a{{/if}}{{#if focus}}, focus: {{focus}}{{/if}}
