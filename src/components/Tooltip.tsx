import { useEffect, useRef } from 'react';
import { CONTACT_PLANETS, NAV_PLANETS, PROJECTS } from '../data/content';
import type { Planet } from '../game/types';

const BLURBS: Record<string, string> = {
  projects: 'See what I have built',
  resume: 'Open my résumé',
  contact: 'Find me online',
  back: 'Return to the previous view',
  ...Object.fromEntries(PROJECTS.map((p) => [p.id, p.oneLiner])),
  ...Object.fromEntries(CONTACT_PLANETS.map((p) => [p.id, 'Say hello'])),
  ...Object.fromEntries(NAV_PLANETS.map((p) => [p.id, BLURBS[p.id] ?? ''])),
};

/** Floating card near the cursor describing the hovered planet. */
export default function Tooltip({ planet }: { planet: Planet | null }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const flipX = e.clientX > window.innerWidth - 260;
      const flipY = e.clientY > window.innerHeight - 120;
      el.style.transform = `translate3d(${e.clientX + (flipX ? -16 : 16)}px, ${
        e.clientY + (flipY ? -16 : 16)
      }px, 0) translate(${flipX ? '-100%' : '0'}, ${flipY ? '-100%' : '0'})`;
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  if (!planet) return null;
  const blurb = BLURBS[planet.defId];

  return (
    <div ref={ref} className="tooltip" role="status">
      <strong>{planet.label}</strong>
      {blurb && <span>{blurb}</span>}
    </div>
  );
}
