import { useEffect, useRef } from 'react';
import type { ProjectInfo } from '../data/content';

interface DossierPanelProps {
  project: ProjectInfo;
  onClose: () => void;
}

/** Project "dossier" card shown after shooting a project planet. */
export default function DossierPanel({ project, onClose }: DossierPanelProps) {
  const backRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    backRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <section
        className="dossier"
        role="dialog"
        aria-modal="true"
        aria-label={`${project.label} details`}
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h2 style={{ color: project.color }}>{project.label}</h2>
          <p className="one-liner">{project.oneLiner}</p>
        </header>

        <p className="description">{project.description}</p>

        <ul className="chips">
          {project.tech.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>

        <footer>
          <a className="btn primary" href={project.url} target="_blank" rel="noopener noreferrer">
            Open Project ↗
          </a>
          <button ref={backRef} type="button" className="btn" onClick={onClose}>
            Back
          </button>
        </footer>
      </section>
    </div>
  );
}
