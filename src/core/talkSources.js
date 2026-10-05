// Where each customer talk-track claim comes from (resources/talk_track/talk_track_sources.json):
// the labor guide for hours, the OEM schedule for maintenance, plus the standard confirm/approval
// lines. Real labor-guide export rows cite the provider; synthetic demo rows never do.
import SOURCES from '../../resources/talk_track/talk_track_sources.json';
import { liveStore, refillObject, resourceLoaded } from './liveResource';

export const SRC = refillObject(liveStore('talkSources', () => ({})), SOURCES);

/** Advisor-facing: "the Mitchell 1 labor guide" for a real export row, "the labor guide" for a synthetic one. */
export const laborCite = it => (it && it.synthetic === false ? SRC.laborGuide.cite : SRC.laborGuide.citeSynthetic);

/** Customer-facing words for labor hours ("the standard repair time"), never "labor guide". */
export const timeSay = () => SRC.repairTime.say;
/** The reference closing a customer talk track that quotes hours: the provider for real rows, an estimate note otherwise. */
export const timeSource = (...rows) => (rows.some(r => r && r.synthetic === false) && !rows.some(r => r && r.synthetic) ? SRC.repairTime.source : SRC.repairTime.sourceSynthetic);

/** The maintenance schedule by name: the make's OEM schedule, or the general one. */
export const scheduleCite = (match, make) => (match === 'GENERIC'
  ? SRC.maintenance.generic
  : make ? SRC.maintenance.oem.replace('{make}', make) : SRC.maintenance.oemNoMake);

export const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

resourceLoaded('talk track sources');
if (import.meta.hot) import.meta.hot.accept();
