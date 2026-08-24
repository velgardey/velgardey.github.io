import { describe, expect, it } from 'vitest';
import { BACK_PLANET, CONTACT_PLANETS, NAV_PLANETS, PROJECTS } from './content';
import type { PlanetDef } from './content';

const isHex = (c: string) => /^#[0-9a-f]{6}$/i.test(c);
const valid = (defs: PlanetDef[]) =>
  defs.every((d) => d.id && d.label.trim() && isHex(d.color) && (!d.url || URL.canParse(d.url)));

describe('content integrity', () => {
  it('all planet sets have unique ids, labels, hex colors, valid urls', () => {
    expect(valid(NAV_PLANETS)).toBe(true);
    expect(valid(CONTACT_PLANETS)).toBe(true);
    expect(valid(PROJECTS)).toBe(true);
    expect(valid([BACK_PLANET])).toBe(true);
  });

  it('ids are unique within each set', () => {
    for (const set of [NAV_PLANETS, CONTACT_PLANETS, PROJECTS]) {
      expect(new Set(set.map((d) => d.id)).size).toBe(set.length);
    }
  });

  it('every project has copy and tech', () => {
    expect(PROJECTS.every((p) => p.oneLiner && p.description && p.tech.length > 0)).toBe(true);
  });
});
