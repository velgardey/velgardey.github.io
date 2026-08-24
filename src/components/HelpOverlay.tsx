import { useEffect, useRef } from 'react';

interface HelpOverlayProps {
  onClose: () => void;
}

const CONTROLS: Array<[string, string]> = [
  ['Click / tap', 'Shoot a planet'],
  ['Hover', 'Preview where a planet leads'],
  ['Tab', 'Cycle target planets'],
  ['Enter / Space', 'Fire at the focused planet'],
  ['1 · 2 · 3', 'Jump to Home · Projects · Contact'],
  ['M', 'Mute or unmute sound'],
  ['Esc', 'Close panels'],
  ['?', 'This help'],
];

export default function HelpOverlay({ onClose }: HelpOverlayProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <section
        className="help"
        role="dialog"
        aria-modal="true"
        aria-label="Controls"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Flight manual</h2>
        <dl>
          {CONTROLS.map(([key, action]) => (
            <div key={key} className="control-row">
              <dt>
                <kbd>{key}</kbd>
              </dt>
              <dd>{action}</dd>
            </div>
          ))}
        </dl>
        <button ref={closeRef} type="button" className="btn" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  );
}
