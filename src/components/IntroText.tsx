import { useEffect, useState } from 'react';
import { PROFILE } from '../data/content';

/** Types the greeting, then reveals the tagline. Pure DOM text — selectable and screen-reader friendly. */
export default function IntroText() {
  const [typed, setTyped] = useState('');
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    const greeting = `Hi, I'm ${PROFILE.name}`;
    let char = 0;
    const typer = setInterval(() => {
      char += 1;
      setTyped(greeting.slice(0, char));
      if (char >= greeting.length) {
        clearInterval(typer);
        setTimeout(() => setShowTagline(true), 500);
      }
    }, 55);
    return () => clearInterval(typer);
  }, []);

  return (
    <div className="intro">
      <h2 className="intro-greeting">
        {typed}
        <span className="caret" aria-hidden="true" />
      </h2>
      {showTagline && (
        <p className="intro-tagline">
          {PROFILE.tagline}
          {' — '}shoot a planet to explore
        </p>
      )}
    </div>
  );
}
