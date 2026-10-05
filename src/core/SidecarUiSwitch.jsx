import { lazy, Suspense, useEffect, useState } from 'react';
import './switch.css';
import { S, notify } from './state';

// Labels: Premium is the classic Sidecar, Basic is Core (internal names and ?ui=classic|core unchanged).
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

  // Core always opens on the mock sign-in (SignIn.jsx): signing out keeps the conversation underneath
  const openCore = () => { S.auth = null; notify(); setUi('core'); };

  return (
    <div className="wiq-ui-root">
      <div className="wiq-ui-strip">
        <div className="wiq-ui-switch" role="group" aria-label="Interface">
          <button type="button" aria-pressed={ui === 'classic'} onClick={() => setUi('classic')}>Premium</button>
          <button type="button" aria-pressed={ui === 'core'} onClick={openCore}>Basic</button>
        </div>
      </div>
      <div className="wiq-ui-body">
        {seen.classic && <div className="wiq-ui-pane" hidden={ui !== 'classic'}>{classic}</div>}
        {seen.core && (
          <div className="wiq-ui-pane" hidden={ui !== 'core'}>
            <Suspense fallback={<div className="wiq-ui-loading">Loading WrenchIQ Basic…</div>}>
              <CoreAssistantApp />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}
