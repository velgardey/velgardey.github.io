import React from 'react';

interface Project {
    name: string;
    tagline: string;
    tech: string;
    url: string;
}

const PROJECTS: Project[] = [
    {
        name: 'Yok',
        tagline: 'Deploy any static site from your terminal — one-command cross-platform CLI, AWS-backed build pipeline (ECS, S3), Kafka + ClickHouse log streaming, self-updating via GoReleaser.',
        tech: 'Go · Express · Kafka · ClickHouse · AWS',
        url: 'https://github.com/velgardey/yok',
    },
    {
        name: 'Melior',
        tagline: 'Self-improving, skill-native coding agent harness on LangGraph: plan-validate-execute-reflect loop with typed skill contracts, a correction queue, and a hermetic offline bench.',
        tech: 'Python · LangGraph',
        url: 'https://github.com/velgardey/melior',
    },
    {
        name: 'Find Your Flick',
        tagline: 'Social movie-recommendation platform — Gemini-powered picks over 100+ taste data points, shared watchlists with realtime sync, in-house player with cross-device progress.',
        tech: 'Next.js · TypeScript · Prisma · Gemini · Redis',
        url: 'https://github.com/velgardey/find-your-flick',
    },
    {
        name: 'CHET',
        tagline: 'Embeddable realtime chat — WebSocket-first server on EC2 behind Nginx (wss://), Redis fan-out + caching, PM2-managed. Drop-in widget for any website.',
        tech: 'TypeScript · Node.js · WebSockets · Redis · AWS',
        url: 'https://github.com/velgardey/chet',
    },
    {
        name: 'Chess Rogue',
        tagline: 'A dynamic chess game where each round randomizes piece roles, creating an ever-changing strategy challenge.',
        tech: 'TypeScript',
        url: 'https://github.com/velgardey/chess-rogue',
    },
    {
        name: 'Task Master',
        tagline: 'A web experience to simplify the process of task noting and alerts.',
        tech: 'TypeScript',
        url: 'https://github.com/velgardey/task-master',
    },
    {
        name: 'Store It',
        tagline: 'C++ backend that breaks a large file into smaller chunks, loads them locally, and recombines the file from the chunks.',
        tech: 'C++ · JavaScript',
        url: 'https://github.com/velgardey/store-it',
    },
    {
        name: 'Hangman',
        tagline: 'A fun and interactive website for playing the classic Hangman game online.',
        tech: 'TypeScript',
        url: 'https://github.com/velgardey/hangman',
    },
    {
        name: 'Birthday Scrapbook',
        tagline: 'Personalized scrapbooks that make your special person\'s day even more memorable.',
        tech: 'TypeScript',
        url: 'https://github.com/velgardey/birthday-scrapbook',
    },
    {
        name: 'Tic-Tac-Toe',
        tagline: 'A simple and engaging website for playing the classic Tic-Tac-Toe game online.',
        tech: 'JavaScript',
        url: 'https://github.com/velgardey/tic-tac-toe',
    },
    {
        name: 'Linux Share',
        tagline: 'A Rust CLI tool for Linux that seamlessly shares files using both Bluetooth and WiFi Direct, similar to Apple\'s AirDrop.',
        tech: 'Rust',
        url: 'https://github.com/velgardey/linux-share',
    },
    {
        name: 'Myuzik',
        tagline: 'A Rust CLI tool to download, manage, and create playlists from YouTube links.',
        tech: 'Rust',
        url: 'https://github.com/velgardey/myuzik',
    },
    {
        name: 'Fractal Tree',
        tagline: 'Interactive fractal-tree visualizer — recursive branching with adjustable depth and angle.',
        tech: 'JavaScript · Canvas',
        url: 'https://github.com/velgardey/fractal-tree',
    },
    {
        name: 'Cellular Automata',
        tagline: 'Rule-driven cellular automata playground (Conway-style grids with configurable rules).',
        tech: 'JavaScript · Canvas',
        url: 'https://github.com/velgardey/cellular-automata',
    },
    {
        name: 'Perlin Noise',
        tagline: 'Perlin-noise terrain/flow-field renderer — smooth value-noise visualization.',
        tech: 'JavaScript · Canvas',
        url: 'https://github.com/velgardey/perlin-noise',
    },
];

const LANG_COLORS: Record<string, string> = {
    Go: '#8ce8ff',
    TypeScript: '#3d9bf0',
    'Next.js': '#41e0a4',
    Python: '#f5c542',
    Rust: '#ff8c5a',
    JavaScript: '#f3e04d',
    'C++': '#f06d6d',
};

const Projects: React.FC = () => (
    <div
        style={{
            position: 'absolute',
            top: '22%',
            left: '5vw',
            right: '5vw',
            maxHeight: '72vh',
            overflowY: 'auto',
            zIndex: 1000,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '18px',
            padding: '4px 8px 24px',
            scrollbarWidth: 'thin',
        }}
    >
        {PROJECTS.map((p) => (
            <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    display: 'block',
                    textDecoration: 'none',
                    background: 'rgba(20, 20, 45, 0.82)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: '12px',
                    padding: '16px 18px',
                    cursor: 'none',
                    transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = 'rgba(120, 200, 255, 0.6)';
                    e.currentTarget.style.boxShadow = '0 0 18px rgba(120, 200, 255, 0.25)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
                    e.currentTarget.style.boxShadow = 'none';
                }}
            >
                <div
                    style={{
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        marginBottom: '8px',
                        textShadow: '0 0 10px rgba(255,255,255,0.4)',
                        fontFamily: '"Space Mono", monospace',
                    }}
                >
                    {p.name}
                </div>
                <div
                    style={{
                        color: 'rgba(255,255,255,0.82)',
                        fontSize: '13px',
                        lineHeight: 1.5,
                        marginBottom: '10px',
                        fontFamily: '"Space Mono", monospace',
                    }}
                >
                    {p.tagline}
                </div>
                <div style={{ color: 'rgba(140, 200, 255, 0.9)', fontSize: '12px', fontFamily: '"Space Mono", monospace' }}>
                    {p.tech.split(' · ').map((t) => (
                        <span key={t} style={{ marginRight: '10px', whiteSpace: 'nowrap' }}>
                            <span style={{ color: LANG_COLORS[t] ?? '#ffffff', marginRight: '4px' }}>◉</span>
                            {t}
                        </span>
                    ))}
                </div>
            </a>
        ))}
    </div>
);

export default Projects;