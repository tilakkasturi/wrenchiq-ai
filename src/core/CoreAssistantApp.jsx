import { useEffect, useRef, useState } from 'react';
import { useCore, S, loadProfile } from './state';
import { FIXEDMAP } from './data';
import { boot, setMode, newJob, setUseAgent, runDemo, demoList } from './harness';
import ChatPanel from './components/ChatPanel';
import MemoryPanel from './components/MemoryPanel';
import RepairOrderPanel from './components/RepairOrderPanel';
import './core.css';

// Everything the side panel shows, as one string, to notice when it changed.
const panelSig = () => JSON.stringify(S.mode === 'ro'
  ? [S.ro.year, S.ro.make, S.ro.model, S.ro.engine, S.ro.mileage, S.ro.vin, S.ro.symptom, S.ro.answers, [...S.ro.accepted], S.ro.hoursOv, S.profile]
  : S.profile);

export default function CoreAssistantApp() {
  useCore();
  const [view, setView] = useState('chat');
  const [dot, setDot] = useState(false);
  const prev = useRef({ sig: panelSig(), mode: S.mode });

  useEffect(() => { if (!S.booted) { loadProfile(); boot(); } }, []);

  // Phone width: the panel is a tab, so mark it when it changes while the chat is showing.
  const sig = panelSig();
  useEffect(() => {
    const p = prev.current;
    if (p.mode === S.mode && p.sig !== sig && view === 'chat') setDot(true);
    prev.current = { sig, mode: S.mode };
  }, [sig, view]);

  const mode = S.mode;
  const sideLabel = mode === 'ro' ? 'Repair order' : 'Shop memory';
  const pick = m => { setView('chat'); setDot(false); setMode(m); };
  const showSide = () => { setView('side'); setDot(false); };

  return (
    <div className="wiq-core">
      <div className="app">
        <header className="top">
          <div className="brand">
            <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M16 3.5 26.8 9.75v12.5L16 28.5 5.2 22.25V9.75Z" /><circle cx="16" cy="16" r="4.6" /></svg>
            <div><b>WrenchIQ Core</b><small>Agentic shop assistant</small></div>
          </div>
          <nav className="modes" role="tablist" aria-label="Mode">
            <button role="tab" aria-selected={mode === 'profile'} onClick={() => pick('profile')}>Shop profile</button>
            <button role="tab" aria-selected={mode === 'ro'} onClick={() => pick('ro')}>Repair order</button>
          </nav>
          <div className="proto"><i>Prototype</i><span>Sample data. Nothing is sent to a shop system.</span></div>
        </header>

        <div className="mobtabs">
          <button aria-pressed={view === 'chat'} onClick={() => setView('chat')}>Chat</button>
          <button aria-pressed={view === 'side'} className={dot ? 'dot' : ''} onClick={showSide}>{sideLabel}</button>
        </div>

        <div className="stage" data-view={view}>
          {mode === 'profile' ? (
            <>
              <ChatPanel key="profile" mode="profile" title="Shop profile" placeholder="Tell me how your shop works, in your own words"
                note={<span className="small muted mono">{Object.keys(S.profile).filter(k => !FIXEDMAP[k]).length} saved</span>} />
              <MemoryPanel />
            </>
) : (
            <>
              <ChatPanel key="ro" mode="ro" title="Repair order conversation" placeholder="Describe the vehicle and the problem, or paste a VIN"
                note={<div className="seg" role="group" aria-label="Assistant">
                  <button aria-pressed={S.useAgent} onClick={() => setUseAgent(true)} title="Gemma reads your message and calls tools">Agent</button>
                  <button aria-pressed={!S.useAgent} onClick={() => setUseAgent(false)} title="Fixed keyword rules, no language model">Scripted</button>
                </div>}
                action={<>
                  <select className="demo-pick" value="" aria-label="Run a demo" onChange={e => { if (e.target.value) runDemo(e.target.value); }}>
                    <option value="">Demo…</option>
                    {demoList().map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                  </select>
                  <button className="btn sm" onClick={newJob}>New job</button>
                </>} />
              <RepairOrderPanel />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
