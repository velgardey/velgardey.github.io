import { useEffect, useState } from 'react';
import type { AudioManager } from '../game/audio';

/** Bottom-right round toggle for sound. Starts audio inside the click gesture. */
export default function MusicToggle({ audio }: { audio: AudioManager | null }) {
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (audio) setMuted(audio.muted);
  }, [audio]);

  const toggle = async () => {
    if (!audio) return;
    await audio.init();
    setMuted(audio.toggleMute());
  };

  return (
    <button
      type="button"
      className="music-toggle"
      onClick={toggle}
      aria-pressed={!muted}
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none" />
        {muted ? (
          <>
            <line x1="16" y1="9" x2="22" y2="15" />
            <line x1="22" y1="9" x2="16" y2="15" />
          </>
        ) : (
          <>
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9.5 9.5 0 0 1 0 13" />
          </>
        )}
      </svg>
    </button>
  );
}
