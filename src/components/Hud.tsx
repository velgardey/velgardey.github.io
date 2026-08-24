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
      {/* key remount restarts the fade-up animation on every page change */}
      <h1 key={title} className="page-title">
        {title}
      </h1>
      <p className="sr-only" aria-live="polite">
        {title === 'Home' ? 'Main space' : `${title} screen`}
      </p>
    </div>
  );
}
