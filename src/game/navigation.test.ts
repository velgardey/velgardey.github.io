import { describe, expect, it } from 'vitest';
import { CONTACT_PLANETS, NAV_PLANETS, PROJECTS } from '../data/content';
import { defsForScreen, nextScreen, titleForScreen } from './navigation';
import type { Screen } from './types';

const main: Screen = { page: 'main' };

describe('nextScreen', () => {
  it('walks main → projects → detail → back → projects → back → main', () => {
    const projects = nextScreen(main, 'projects');
    expect(projects).toEqual({ page: 'projects' });

    const detail = nextScreen(projects!, 'yok');
    expect(detail).toEqual({ page: 'detail', projectId: 'yok', from: 'projects' });

    expect(nextScreen(detail!, 'back')).toEqual({ page: 'projects' });
    expect(nextScreen({ page: 'projects' }, 'back')).toEqual({ page: 'main' });
  });

  it('returns null for url planets and unknown ids', () => {
    expect(nextScreen(main, 'resume')).toBeNull();
    expect(nextScreen(main, 'nope')).toBeNull();
    expect(nextScreen({ page: 'contact' }, 'linkedin')).toBeNull();
    // project ids only resolve to detail from a non-detail screen
    const detail: Screen = { page: 'detail', projectId: 'yok', from: 'main' };
    expect(nextScreen(detail, 'chess-rogue')).toBeNull();
  });

  it('routes contact page', () => {
    expect(nextScreen(main, 'contact')).toEqual({ page: 'contact' });
  });
});

describe('defsForScreen', () => {
  it('maps pages to planet sets including Back', () => {
    expect(defsForScreen('main')).toHaveLength(NAV_PLANETS.length);
    expect(defsForScreen('projects')).toHaveLength(PROJECTS.length + 1);
    expect(defsForScreen('contact')).toHaveLength(CONTACT_PLANETS.length + 1);
    expect(defsForScreen('projects').at(-1)?.id).toBe('back');
  });

  it('project planets carry their url', () => {
    const yok = defsForScreen('projects').find((d) => d.id === 'yok');
    expect(yok?.url).toContain('github.com/velgardey/yok');
  });
});

describe('titleForScreen', () => {
  it('titles each screen', () => {
    expect(titleForScreen(main)).toBe('Home');
    expect(titleForScreen({ page: 'projects' })).toBe('Projects');
    expect(titleForScreen({ page: 'contact' })).toBe('Contact');
    expect(titleForScreen({ page: 'detail', projectId: 'yok', from: 'projects' })).toBe(
      PROJECTS.find((p) => p.id === 'yok')!.label,
    );
  });
});
