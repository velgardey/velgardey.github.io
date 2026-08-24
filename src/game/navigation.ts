import { BACK_PLANET, CONTACT_PLANETS, NAV_PLANETS, PROJECTS } from '../data/content';
import type { PageId, PlanetDef, Screen } from './types';

/**
 * Pure navigation state machine.
 * Returns the next screen for a hit planet id, or null when the planet has no
 * routing effect (external links, unknown ids, project hits while a dossier
 * is already open).
 */
export function nextScreen(screen: Screen, planetId: string): Screen | null {
  if (planetId === 'back') {
    return { page: screen.page === 'detail' ? screen.from : 'main' };
  }

  if (screen.page === 'main') {
    if (planetId === 'projects') return { page: 'projects' };
    if (planetId === 'contact') return { page: 'contact' };
    return null;
  }

  if (screen.page === 'projects') {
    const project = PROJECTS.find((p) => p.id === planetId);
    if (project) return { page: 'detail', projectId: planetId, from: 'projects' };
  }

  return null;
}

/** Planet set (plus Back) that populates each non-detail screen. */
export function defsForScreen(page: PageId): PlanetDef[] {
  switch (page) {
    case 'main':
      return [...NAV_PLANETS];
    case 'projects':
      return [
        ...PROJECTS.map((p): PlanetDef => ({ id: p.id, label: p.label, color: p.color, url: p.url })),
        BACK_PLANET,
      ];
    case 'contact':
      return [...CONTACT_PLANETS, BACK_PLANET];
  }
}

export function titleForScreen(screen: Screen): string {
  if (screen.page === 'detail') {
    return PROJECTS.find((p) => p.id === screen.projectId)?.label ?? 'Project';
  }
  return { main: 'Home', projects: 'Projects', contact: 'Contact' }[screen.page];
}
