import { lazy, Suspense, useEffect, useState } from 'react';
import './switch.css';

// Wraps the Sidecar. The classic Sidecar is passed in untouched; Core is an add-on loaded only
// when asked for. A thin strip above both holds the Classic | Core pill, so it never covers the
// Sidecar header icons. Both views stay mounted once visited so switching back keeps their state.
const CoreAssistantApp = lazy(() => import('./CoreAssistantApp'));
const KEY = 'wrenchiq-sidecar-ui';

function initialUi() {
  try {
    const q = new URLSearchParams(window.location.search).get('ui');
    if (q === 'core' || q === 'classic') return q;
    return localStorage.getItem(KEY) === 'core' ? 'core' : 'classic';
  } catch (_) {
    return 'classic';
  }
}

export default function SidecarUiSwitch({ classic }) {
  const [ui, setUi] = useState(initialUi);
  const [seen, setSeen] = useState({ classic: ui === 'classic', core: ui === 'core' });

  useEffect(() => {
    setSeen(s => (s[ui] ? s : { ...s, [ui]: true }));
    try { localStorage.setItem(KEY, ui); } catch (_) { /* storage blocked, choice just won't persist */ }
  }, [ui]);

  return (
    <div className="wiq-ui-root">
      <div className="wiq-ui-strip">
        <div className="wiq-ui-switch" role="group" aria-label="Interface">
          <button type="button" aria-pressed={ui === 'classic'} onClick={() => setUi('classic')}>Classic</button>
          <button type="button" aria-pressed={ui === 'core'} onClick={() => setUi('core')}>Core</button>
        </div>
      </div>
      <div className="wiq-ui-body">
        {seen.classic && <div className="wiq-ui-pane" hidden={ui !== 'classic'}>{classic}</div>}
        {seen.core && (
          <div className="wiq-ui-pane" hidden={ui !== 'core'}>
            <Suspense fallback={<div className="wiq-ui-loading">Loading WrenchIQ Core…</div>}>
              <CoreAssistantApp />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}
