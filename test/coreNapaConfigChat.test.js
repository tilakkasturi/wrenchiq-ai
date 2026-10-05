import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/core/partsApi.js', () => ({
  searchNapa: vi.fn(),
  getNapaConfig: vi.fn(async () => ({ ok: true, config: { connection: { catalogApiUrl: { value: 'http://napa.test' }, dcId: { value: '59' } }, terms: [] } })),
}));

import { S } from '../src/core/state.js';
import { Cp } from '../src/core/harness.js';

describe('Shop profile: NAPA configuration', () => {
  it.each(['show me NAPA config for my shop', 'how are we connected to napa?', 'NAPA settings'])('"%s" shows the configuration card', async q => {
    S.chats.profile = { items: [], chips: [], nextId: 1 };
    Cp.send(q);
    await Cp.run(async () => {});
    expect(S.chats.profile.items.some(i => i.kind === 'cards' && i.card.type === 'napaConfig')).toBe(true);
  });
});
