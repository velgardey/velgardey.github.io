import { HINT_TEXT } from '../data/content';
import type { Screen } from '../game/types';
import { titleForScreen } from '../game/navigation';

interface HudProps {
  screen: Screen;
  shotOnce: boolean;
}

/** Bottom-centre page title plus the first-run control hint. */
export default function Hud({ screen, shotOnce }: HudProps) {
  const title = titleForScreen(screen);

  return (
    <div className="hud">
      {!shotOnce && <p className="hint">{HINT_TEXT}</p>}
      {/* key remount restarts the staggered letter animation on page change */}
      <h1 key={title} className="page-title" aria-label={title}>
        {[...title].map((ch, i) => (
          <span
            key={`${ch}-${i}`}
            aria-hidden="true"
            className="title-letter"
            style={{ animationDelay: `${i * 45}ms` }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        ))}
      </h1>
      <p className="sr-only" aria-live="polite">
        {title === 'Home' ? 'Main space' : `${title} screen`}
      </p>
    </div>
  );
}
