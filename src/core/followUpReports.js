// How follow-up answers read on the repair order: one descriptive sentence per answer from
// resources/repair_order/follow_up_reports.json ("The check engine light is flashing."), never
// "Warning light: Flashing" or "Idle: Yes".
import FILE from '../../resources/repair_order/follow_up_reports.json';
import { liveStore, refillObject, resourceLoaded } from './liveResource';

export const REPORTS = refillObject(liveStore('followUpReports', () => ({})), FILE);

/** The sentence for one answer, or "Question: answer." when the file has none. */
export function reportSentence(q, answer) {
  const s = REPORTS.reports && REPORTS.reports[q.id] && REPORTS.reports[q.id][answer];
  return s || q.short + ': ' + answer + '.';
}

resourceLoaded('follow-up reports');
if (import.meta.hot) import.meta.hot.accept();
