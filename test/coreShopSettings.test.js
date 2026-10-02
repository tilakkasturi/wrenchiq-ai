import { describe, it, expect, beforeEach } from 'vitest';
import { S, newRO } from '../src/core/state.js';
import { SHOP } from '../src/core/data.js';
import { setting, setSetting, isDefault, maintMode, fullSchedule } from '../src/core/shopSettings.js';
import { maintState } from '../src/core/logic.js';
import { TOOLS } from '../src/core/roTools.js';

const C = { events: [], cards: [], event(t) { this.events.push(t); }, card(x) { this.cards.push(x); } };

beforeEach(() => {
  S.profile = {};
  S.ro = { ...newRO(), year: '2018', make: 'Toyota', model: 'Corolla', mileage: '61000' };
});

describe('scheduled maintenance setting', () => {
  it('defaults to prioritized, from the shop profile resource', () => {
    expect(SHOP.maintenancePresentation).toBe('prioritized');
    expect(maintMode()).toBe('prioritized');
    expect(isDefault('maint.presentation')).toBe(true);
  });
  it('the shop can change it; an unknown stored value falls back to the default', () => {
    setSetting('maint.presentation', 'all');
    expect(maintMode()).toBe('all');
    expect(isDefault('maint.presentation')).toBe(false);
    S.profile['maint.presentation'] = { value: 'nonsense' };
    expect(setting('maint.presentation')).toBe('prioritized');
  });
  it('prioritized: the agent tool returns items by severity with the instruction', async () => {
    const r = await TOOLS.get_maintenance_due({}, C);
    expect(r.presentation.setting).toBe('prioritized');
    expect(r.by_severity.length).toBeGreaterThan(0);
    expect(r.items).toBeUndefined();
  });
  it('all: the agent tool returns every scheduled item in schedule order, no tiers', async () => {
    setSetting('maint.presentation', 'all');
    const ms = maintState();
    const r = await TOOLS.get_maintenance_due({}, C);
    expect(r.presentation).toMatchObject({ setting: 'all', instruction: expect.stringMatching(/every item/) });
    expect(r.by_severity).toBeUndefined();
    expect(r.items.map(i => i.id)).toEqual(ms.ids);
    expect(r.advisor_script).toMatch(/schedule lists the 60,000 mile service/);
  });
  it('the full list still marks what today\'s order already has', () => {
    const ms = maintState();
    S.ro.accepted.add(ms.ids[0]);
    const f = fullSchedule(ms, { accepted: [...S.ro.accepted], make: 'Toyota' });
    expect(f.items).toHaveLength(ms.ids.length);
    expect(f.openIds).not.toContain(ms.ids[0]);
  });
});
