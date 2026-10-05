import { describe, it, expect, afterEach, vi } from 'vitest';

afterEach(() => { delete process.env.NAPA_STORE_ID; delete process.env.NAPA_STORE_PASSWORD; delete process.env.NAPA_DC_ID; vi.resetModules(); });

describe('NAPA configuration view', () => {
  it('reports the connection settings in use and where each came from', async () => {
    process.env.NAPA_DC_ID = '61';
    const { napaConfig } = await import('../server/services/napaPartsService.js');
    const c = napaConfig();
    expect(c.connection.dcId).toEqual({ value: '61', source: 'env NAPA_DC_ID', label: null });
    expect(c.connection.countryId).toMatchObject({ value: '1', source: 'default', label: 'United States' });
    expect(c.connection.catalogApiUrl.value).toMatch(/^https?:\/\//);
    expect(c.terms.length).toBeGreaterThan(20);
    expect(c.terms[0]).toEqual({ match: 'hardware', term: 'brake hardware kit' });
  });
  it('never returns the store credentials, only whether they are configured', async () => {
    process.env.NAPA_STORE_ID = 'STORE-SECRET-ID';
    process.env.NAPA_STORE_PASSWORD = 'pw-SECRET-123';
    const { napaConfig } = await import('../server/services/napaPartsService.js');
    const json = JSON.stringify(napaConfig());
    expect(json).not.toContain('STORE-SECRET-ID');
    expect(json).not.toContain('pw-SECRET-123');
    expect(napaConfig().storeCredentials.configured).toBe(true);
  });
});
