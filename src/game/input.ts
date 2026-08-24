export type Command = 'mute' | 'help' | 'home' | 'projects' | 'contact';

export interface GameInput {
  /** Aim tracking (fine pointers). */
  onPointerMove(x: number, y: number): void;
  /** A tap/click that was quick and didn't drag. */
  onShoot(x: number, y: number): void;
  /** Dragging (touch) steers the ship itself. */
  onDragMove(x: number, y: number): void;
  onFocusNext(): void;
  onActivate(): void;
  onCancel(): void;
  onCommand(cmd: Command): void;
}

const DRAG_THRESHOLD_PX = 12;
const TAP_MAX_MS = 400;

/**
 * Attach unified pointer + keyboard listeners. Uses Pointer Events so mouse and
 * touch share one code path. Returns a cleanup function.
 */
export function attachInput(surface: HTMLElement, h: GameInput): () => void {
  let downX = 0;
  let downY = 0;
  let downTime = 0;
  let dragging = false;

  const isTouch = (e: PointerEvent) => e.pointerType !== 'mouse';

  const onPointerDown = (e: PointerEvent) => {
    downX = e.clientX;
    downY = e.clientY;
    downTime = performance.now();
    dragging = false;
  };

  const onPointerMove = (e: PointerEvent) => {
    h.onPointerMove(e.clientX, e.clientY);

    if (e.buttons > 0 && isTouch(e)) {
      if (!dragging && Math.hypot(e.clientX - downX, e.clientY - downY) > DRAG_THRESHOLD_PX) {
        dragging = true;
      }
      if (dragging) h.onDragMove(e.clientX, e.clientY);
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    const quick = performance.now() - downTime < TAP_MAX_MS;
    const still = Math.hypot(e.clientX - downX, e.clientY - downY) <= DRAG_THRESHOLD_PX;
    if (!dragging && quick && still) h.onShoot(e.clientX, e.clientY);
    dragging = false;
  };

  const keyMap: Record<string, Command> = {
    m: 'mute',
    M: 'mute',
    '?': 'help',
    h: 'help',
    H: 'help',
    '1': 'home',
    '2': 'projects',
    '3': 'contact',
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const command = keyMap[e.key];
    if (command) {
      h.onCommand(command);
      return;
    }
    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        h.onFocusNext();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        h.onActivate();
        break;
      case 'Escape':
        h.onCancel();
        break;
    }
  };

  surface.addEventListener('pointerdown', onPointerDown);
  surface.addEventListener('pointermove', onPointerMove);
  surface.addEventListener('pointerup', onPointerUp);
  window.addEventListener('keydown', onKeyDown);

  return () => {
    surface.removeEventListener('pointerdown', onPointerDown);
    surface.removeEventListener('pointermove', onPointerMove);
    surface.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('keydown', onKeyDown);
  };
}
