import { useCallback, useEffect, useRef, useState } from 'react';
import Crosshair from './components/Crosshair';
import DossierPanel from './components/DossierPanel';
import HelpOverlay from './components/HelpOverlay';
import Hud from './components/Hud';
import IntroText from './components/IntroText';
import MusicToggle from './components/MusicToggle';
import Tooltip from './components/Tooltip';
import { PROJECTS } from './data/content';
import { GameEngine } from './game/engine';
import { defsForScreen, nextScreen } from './game/navigation';
import type { Planet, Screen } from './game/types';
import { useGameEngine } from './hooks/useGameEngine';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [screen, setScreen] = useState<Screen>({ page: 'main' });
  const [hovered, setHovered] = useState<Planet | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [shotOnce, setShotOnce] = useState(
    () => localStorage.getItem('space-port-shot') === 'true',
  );
  const reducedMotion = usePrefersReducedMotion();

  const screenRef = useRef(screen);
  screenRef.current = screen;
  const engineRef = useRef<GameEngine | null>(null);

  const handlePlanetHit = useCallback((planet: Planet) => {
    const engine = engineRef.current;
    if (!engine) return;

    const current = screenRef.current;
    const next = nextScreen(current, planet.defId);

    // Project planet: no wipe — the dossier slides over the drifting field.
    if (current.page !== 'detail' && next?.page === 'detail') {
      engine.audio.explosion();
      engine.setLocked(true); // shooting disabled while the panel is open
      setScreen(next);
      return;
    }

    // Page change: lock input, wipe, then swap planet sets.
    if (next) {
      engine.setLocked(true);
      engine.beginWipe({ x: planet.x, y: planet.y }, planet.color, () => {
        setScreen(next);
        engine.setLocked(false);
      });
      return;
    }

    // Everything else (resume, socials) opens its link directly.
    if (planet.url) window.open(planet.url, '_blank', 'noopener');
  }, []);

  const engine = useGameEngine(canvasRef, {
    onHover: setHovered,
    onPlanetHit: handlePlanetHit,
    onUiCommand: (cmd) => {
      if (cmd === 'help') setHelpOpen((open) => !open);
      if (cmd === 'home' || cmd === 'projects' || cmd === 'contact') {
        setHelpOpen(false);
        setScreen({ page: cmd === 'home' ? 'main' : cmd });
      }
    },
    onCancel: () => setHelpOpen(false),
  });

  useEffect(() => {
    engineRef.current = engine;
  }, [engine]);

  // Spawn the planet set for the active screen once per page change.
  const spawnedPage = useRef<string>('init');
  useEffect(() => {
    if (!engine) return;
    const page = screen.page === 'detail' ? screen.from : screen.page;
    if (spawnedPage.current === page) return;

    spawnedPage.current = page;
    engine.setPlanets(defsForScreen(page));
  }, [engine, screen]);

  // Reduced-motion + mobile layout flags.
  useEffect(() => {
    engine?.setReducedMotion(reducedMotion);
  }, [engine, reducedMotion]);

  useEffect(() => {
    if (!engine) return;
    const mq = window.matchMedia('(max-width: 1024px)');
    const apply = () => engine.setMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [engine]);

  useEffect(() => {
    if (!engine) return;
    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [engine]);

  const markShot = useCallback(() => {
    if (!shotOnce) {
      localStorage.setItem('space-port-shot', 'true');
      setShotOnce(true);
    }
  }, [shotOnce]);

  const detailProject =
    screen.page === 'detail' ? PROJECTS.find((p) => p.id === screen.projectId) : undefined;

  return (
    <main className="stage">
      <canvas ref={canvasRef} className="game-canvas" onPointerDown={markShot} />
      <Crosshair />
      <Tooltip planet={hovered} />
      {screen.page === 'main' && <IntroText />}
      <Hud screen={screen} shotOnce={shotOnce} />

      {detailProject && (
        <DossierPanel
          project={detailProject}
          onClose={() => {
            engine?.setLocked(false);
            setScreen({ page: screen.page === 'detail' ? screen.from : 'main' });
          }}
        />
      )}
      {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}
      <MusicToggle audio={engine?.audio ?? null} />
    </main>
  );
}
