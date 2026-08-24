import { useEffect, useRef } from 'react';

/** Custom mouse cursor; hidden on touch since there is nothing to track. */
export default function Crosshair() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const move = (e: PointerEvent) => {
      const show = e.pointerType === 'mouse';
      el.style.opacity = show ? '1' : '0';
      if (!show) return;
      el.style.transform = `translate3d(${e.clientX - 20}px, ${e.clientY - 20}px, 0)`;
    };

    // Firing pulse: brief kick on every shot.
    let pulseTimer: ReturnType<typeof setTimeout> | undefined;
    const fire = () => {
      el.classList.add('firing');
      clearTimeout(pulseTimer);
      pulseTimer = setTimeout(() => el.classList.remove('firing'), 180);
    };
    window.addEventListener('pointerdown', fire);

    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', fire);
      clearTimeout(pulseTimer);
    };
  }, []);

  return (
    <div ref={ref} className="crosshair" aria-hidden="true">
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="17" stroke="#00ffff" strokeWidth="1" fill="none" opacity="0.45">
          <animate attributeName="r" values="14;18;14" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="20" cy="20" r="4" fill="#00ffff" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.35;0.8" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <line x1="20" y1="0" x2="20" y2="12" stroke="#00ffff" strokeWidth="1.5" />
        <line x1="20" y1="28" x2="20" y2="40" stroke="#00ffff" strokeWidth="1.5" />
        <line x1="0" y1="20" x2="12" y2="20" stroke="#00ffff" strokeWidth="1.5" />
        <line x1="28" y1="20" x2="40" y2="20" stroke="#00ffff" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
