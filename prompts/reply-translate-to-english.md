<!--
Reply translation — the single user message that translates one chat reply into English
(POST /api/ro-chat/translate).
Loaded by: server/services/translateService.js (translateToEnglish), via prompt('reply-translate-to-english', vars).
Variables:
  text   the reply to translate, already trimmed
-->
Translate the following text into English. Respond with ONLY the translation — no quotes, no explanation, no "Here's the translation:" preamble.

Text:
{{text}}
