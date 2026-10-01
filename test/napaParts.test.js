import { describe, it, expect } from 'vitest';
import { searchTermFor, positionOf, pickKeywords, toRow, matchModel } from '../server/services/napaPartsService.js';

const kw = names => names.map(KeywordDesc => ({ KeywordDesc, VehCode: 'Y' }));

describe('napaPartsService (no network)', () => {
  it('maps suggested part names to NAPA search terms', () => {
    expect(searchTermFor('Front brake pads (set)')).toBe('brake pad');
    expect(searchTermFor('Front brake rotors (2)')).toBe('rotor');
    expect(searchTermFor('Spark plugs (set)')).toBe('spark plug');
    expect(searchTermFor('Wheel bearing hub assembly')).toBe('wheel bearing');
  });
  it('reads front/rear from the name', () => {
    expect(positionOf('Front brake pads (set)')).toBe('front');
    expect(positionOf('Rear brake pads (set)')).toBe('rear');
    expect(positionOf('Ignition coil')).toBeNull();
  });
  it('picks the front pad keyword over kits and rear pads', () => {
    const all = kw(['Brake Pad and Brake Rotor Kit - Front', 'Brake Pads - Front', 'Brake Pads - Rear', 'Brake Pad and Brake Rotor Kit - Rear']);
    expect(pickKeywords(all, 'brake pad', 'front')).toEqual(['Brake Pads - Front']);
    expect(pickKeywords(all, 'brake pad', 'rear')).toEqual(['Brake Pads - Rear']);
  });
  it('prefers the plain part over connectors and wires', () => {
    expect(pickKeywords(kw(['Spark Plug Wire Set', 'Spark Plug', 'Spark Plug Boot - Coil on Plug']), 'spark plug', null)).toEqual(['Spark Plug']);
  });
  it('does not pick heavy-duty or truck keywords', () => {
    expect(pickKeywords(kw(['Truck Tool Box Hardware', 'Air Brake Chamber Mounting Hardware']), 'brake hardware', null)).toEqual([]);
  });
  it('reports a missing catalog price as null, not zero', () => {
    expect(toRow({ LineCode: 'GRT', PartNumber: '4886711', Description: 'NAPA Gold Front Brake Rotor Vented', ListPrice: 0 }, 'Brake Rotor - Front').listPrice).toBeNull();
  });
  it('maps a NAPA part to a row with price and brand', () => {
    const row = toRow({ LineCode: 'PSG', PartNumber: 'SG8330X', Description: 'NAPA SilentGUARD Front Disc Brake Pads Ceramic', ListPrice: 94.6, Core: 0, PerCarQty: 1, Warranty: 'Limited Lifetime', Comment: 'OE Material ; @PSGSG8330X@', Attribute: 'Brand : NAPA; Quality Level : Best; Sub Brand : SilentGUARD;' }, 'Brake Pads - Front');
    expect(row).toMatchObject({ supplier: 'NAPA', lineCode: 'PSG', partNumber: 'SG8330X', listPrice: 94.6, quality: 'Best', brand: 'NAPA · SilentGUARD', note: 'OE Material' });
  });

  describe('matching NAPA model names for trucks and SUVs', () => {
    const models = names => names.map((desc, id) => ({ id, desc }));
    it('finds the F-150 under NAPA\'s long name', () => {
      expect(matchModel(models(['F250 Super Duty 3/4 Ton - Pickup', 'F150 1/2 Ton - Pickup', 'Escape']), 'F-150', 'Ford Truck').desc).toBe('F150 1/2 Ton - Pickup');
    });
    it('prefers the light-duty Silverado for plain "Silverado"', () => {
      const list = models(['Silverado 2500HD 3/4 Ton - Pickup', 'Silverado 3500HD 1 Ton - Pickup', 'Silverado 1500 1/2 Ton']);
      expect(matchModel(list, 'Silverado', 'Chevrolet Truck').desc).toBe('Silverado 1500 1/2 Ton');
      expect(matchModel(list, 'Silverado 1500', 'Chevrolet Truck').desc).toBe('Silverado 1500 1/2 Ton');
    });
    it('matches the Mazda3 as "3" and exact names directly', () => {
      expect(matchModel(models(['CX-3', '3', '6']), 'Mazda3', 'Mazda').desc).toBe('3');
      expect(matchModel(models(['Corolla', 'Corolla iM']), 'Corolla', 'Toyota').desc).toBe('Corolla');
    });
    it('returns null when nothing fits', () => {
      expect(matchModel(models(['Fiesta', 'Focus']), 'F-150', 'Ford')).toBeNull();
    });
  });
});
