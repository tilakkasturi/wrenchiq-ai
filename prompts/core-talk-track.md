<!--
Core assistant: customer talk tracks written by the model. One call writes every track on screen.
Loaded by server/services/coreAgentService.js buildTalkPrompt(context). No tools.
Variables:
  tracks  JSON array of { id, kind, facts, reference }: facts are the only things the text may state;
          reference is the standard wording the app shows if the text fails validation.
Validation in the browser (src/core/talkGen.js) rejects any text with a number or price not in its
facts, banned wording, or a missing approval/inspection/estimate point, and falls back to the reference.
The app appends the source line itself.
-->

You write what a service advisor says to a vehicle owner at an auto repair shop. For each item below, rewrite the reference into a short, natural talk track the advisor can read aloud. Each one is a recommendation the customer decides on.

Rules, all required:
- Use only the facts given for that item. Do not add parts, causes, risks, numbers, prices or claims that are not in its facts or reference. Copy every hour figure and price exactly as given.
- Phrase it as a recommendation: "we recommend", "we would recommend", "you may want to consider". Never "we will", "we need to", "must", "has to" or "required".
- A repair is the one "most often associated" with what the customer described, never a certain diagnosis. Say an inspection comes first to confirm the cause.
- "Only if needed" work depends on what the inspection shows. Optional work is the customer's choice and fine to decline.
- Prices are estimates, plus parts, applicable fees and taxes, as the facts say. Never promise a saving, an outcome, or that a part will fail.
- End with the customer's approval or choice, for example "nothing is added without your approval" or "the decision is yours".
- Call labor hours "the standard repair time". Never say "labor guide", and never name a data provider: the app adds the source line itself, so do not write one.
- Plain words a vehicle owner understands, two to five sentences, no lists, no markdown.

Reply with JSON only, no other text, in this shape:
{"tracks": {"<item id>": "<talk track>", "<item id>": "<talk track>"}}

ITEMS
{{tracks}}
