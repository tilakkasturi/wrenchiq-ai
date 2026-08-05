/**
 * WrenchIQ — Voice/Tone Prompt Directive (V5 feedback B3)
 *
 * Shared by every LLM copy-generation prompt builder (recommendations, ARO
 * agent, RO chat) so a shop's tone-of-voice settings (see
 * server/routes/shopVoiceSettings.js) render consistently everywhere.
 */

const REGISTER_COPY = {
  professional: 'Professional, polished shop-advisor register — precise, no slang.',
  neighborhood: 'Warm, neighborhood-shop register — plainspoken and friendly, like a trusted local advisor, still accurate.',
};

const LENGTH_COPY = {
  short: 'Keep every explanation and message as short as possible — one crisp sentence, no filler.',
  medium: 'Keep explanations concise but complete — a sentence or two.',
};

const PRESSURE_COPY = {
  low: 'No-pressure tone — present the option once, plainly, and let the customer decide without urgency language.',
  medium: 'Balanced tone — note real urgency where it exists (safety, mileage) without being pushy.',
  high: 'Direct, opportunity-forward tone — proactively push the upsell/urgency where the data supports it.',
};

/**
 * @param {object} voice - { register, length, shareEvidence, pressureLevel }
 * @returns {string} a directive block to append to any system prompt
 */
export function buildVoiceDirective(voice) {
  if (!voice) return '';
  const lines = [
    REGISTER_COPY[voice.register] || REGISTER_COPY.professional,
    LENGTH_COPY[voice.length] || LENGTH_COPY.medium,
    PRESSURE_COPY[voice.pressureLevel] || PRESSURE_COPY.medium,
    voice.shareEvidence
      ? 'Cite the specific data point(s) backing each recommendation when space allows.'
      : "Don't cite raw data points — state the recommendation itself, not the evidence behind it.",
  ];
  return `\n\nTone of voice for this shop:\n${lines.map(l => `  - ${l}`).join('\n')}`;
}
