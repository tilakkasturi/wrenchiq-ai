import { S } from '../state';
import { talkState } from '../talkGen';

/** Where the talk track's wording came from: model text that passed every check, or the standard template. */
export function TalkTag({ track }) {
  const st = talkState(track);
  if (!track || !S.useAgent) return null;
  return <span className={'tag ' + (st === 'checked' ? 'adv' : 'low')} title={st === 'checked' ? 'Written by the model and checked: every number is in the facts, no banned wording, approval and source in place' : st === 'pending' ? 'Being written; standard wording until it is checked' : 'Standard wording'}>{st === 'checked' ? 'AI-written · checked' : st === 'pending' ? 'Writing…' : 'Standard wording'}</span>;
}
