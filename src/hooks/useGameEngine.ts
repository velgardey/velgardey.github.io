import { useEffect, useRef, useState, type RefObject } from 'react';
import { GameEngine, type EngineHooks } from '../game/engine';

/**
 * Create the engine for a canvas element and start its loop. Hooks are read
 * through a ref so callers can pass fresh closures without re-mounting.
 */
export function useGameEngine(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  hooks: EngineHooks,
): GameEngine | null {
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const hooksRef = useRef(hooks);
  hooksRef.current = hooks;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const instance = new GameEngine(canvas, {
      onHover: (planet, x, y) => hooksRef.current.onHover(planet, x, y),
      onPlanetHit: (planet) => hooksRef.current.onPlanetHit(planet),
    });
    instance.start();
    setEngine(instance);
    return () => instance.destroy();
  }, [canvasRef]);

  return engine;
}
