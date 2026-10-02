/**
 * WrenchIQ — Voice/Tone Prompt Directive (V5 feedback B3)
 *
 * Shared by every LLM copy-generation prompt builder (recommendations, ARO
 * agent, RO chat) so a shop's tone-of-voice settings (see
 * server/routes/shopVoiceSettings.js) render consistently everywhere.
 * The wording lives in prompts/voice-directive.md.
 */
import { prompt } from './promptLoader.js';

/**
 * @param {object} voice - { register, length, shareEvidence, pressureLevel }
 * @returns {string} the directive text ('' when no voice settings)
 */
export function voiceDirectiveText(voice) {
  if (!voice) return '';
  return prompt('voice-directive', {
    neighborhood:  voice.register === 'neighborhood',
    short:         voice.length === 'short',
    pressureLow:   voice.pressureLevel === 'low',
    pressureHigh:  voice.pressureLevel === 'high',
    shareEvidence: !!voice.shareEvidence,
  });
}

/**
 * @param {object} voice - { register, length, shareEvidence, pressureLevel }
 * @returns {string} a directive block to append to any system prompt
 */
export function buildVoiceDirective(voice) {
  const text = voiceDirectiveText(voice);
  return text ? `\n\n${text}` : '';
}
