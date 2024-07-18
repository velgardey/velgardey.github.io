import React, { useState, useCallback, useEffect, useRef } from 'react';
import Spacecraft from './components/Spacecraft';
import AnimatedBullet from './components/AnimatedBullet';
import Planet from './components/Planet';
import ExplosionTransition from './components/ExplosionTransition';

export interface Planet {
    x: number;
    y: number;
    radius: number;
    label: string;
    color: string;
    vx: number;
    vy: number;
}

const App: React.FC = () => {
    const [bullets, setBullets] = useState<Array<{ id: number; x: number; y: number; angle: number }>>([]);
    const [bulletIdCounter, setBulletIdCounter] = useState(0);
    const [currentPage, setCurrentPage] = useState<string>('main');
    const [isExploding, setIsExploding] = useState(false);
    const [explosionCenter, setExplosionCenter] = useState<{x: number, y: number} | null>(null);
    const [spacecraftRotation, setSpacecraftRotation] = useState(0);
    // const [planets, setPlanets] = useState<Planet[]>([
    //     { x: 200, y: 200, radius: 40, label: 'Projects', color: '#3A86FF', vx: 0.2, vy: 0.1 },
    //     { x: 600, y: 200, radius: 40, label: 'Resume', color: '#8338EC', vx: -0.1, vy: 0.2 },
    //     { x: 400, y: 400, radius: 40, label: 'Contact', color: '#FF006E', vx: 0.1, vy: -0.1 },
    // ]);
    const [nextPlanets, setNextPlanets] = useState<Planet[] | null>(null);
    const [planets, setPlanets] = useState<Planet[]>([]);
    const animationFrameRef = useRef<number>();

    const createRandomPlanet = (label: string, color: string): Planet => {
        const radius = 40;
        const x = Math.random() * (window.innerWidth - 2 * radius) + radius;
        const y = Math.random() * (window.innerHeight - 2 * radius) + radius;
        const speed = 0.25;
        const angle = Math.random() * Math.PI * 2;
        return {
            x, y, radius, label, color,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        };
    };

    const initializePlanets = useCallback(() => {
        const initialPlanets = [
            createRandomPlanet('Projects', '#3A86FF'),
            createRandomPlanet('Resume', '#8338EC'),
            createRandomPlanet('Contact', '#FF006E'),
        ];
        setPlanets(initialPlanets);
    }, []);

    useEffect(() => {
        initializePlanets();
    }, [initializePlanets]);

    const handleCollision = (p1: Planet, p2: Planet) => {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < p1.radius + p2.radius) {
            const angle = Math.atan2(dy, dx);
            const sin = Math.sin(angle);
            const cos = Math.cos(angle);

            // Rotate velocities
            const vx1 = p1.vx * cos + p1.vy * sin;
            const vy1 = p1.vy * cos - p1.vx * sin;
            const vx2 = p2.vx * cos + p2.vy * sin;
            const vy2 = p2.vy * cos - p2.vx * sin;

            // Swap the velocities
            const temp_vx1 = vx2;
            const temp_vy1 = vy1;
            const temp_vx2 = vx1;
            const temp_vy2 = vy2;

            // Rotate velocities back
            p1.vx = temp_vx1 * cos - temp_vy1 * sin;
            p1.vy = temp_vy1 * cos + temp_vx1 * sin;
            p2.vx = temp_vx2 * cos - temp_vy2 * sin;
            p2.vy = temp_vy2 * cos + temp_vx2 * sin;

            // Move planets apart to prevent sticking
            const overlap = (p1.radius + p2.radius - distance) / 2;
            p1.x -= overlap * cos;
            p1.y -= overlap * sin;
            p2.x += overlap * cos;
            p2.y += overlap * sin;
        }
    };

    const movePlanets = useCallback(() => {
        setPlanets(prevPlanets => {
            const newPlanets = prevPlanets.map(planet => {
                let newX = planet.x + planet.vx;
                let newY = planet.y + planet.vy;

                if (newX - planet.radius < 0 || newX + planet.radius > window.innerWidth) {
                    planet.vx *= -1;
                    newX = planet.x + planet.vx;
                }
                if (newY - planet.radius < 0 || newY + planet.radius > window.innerHeight) {
                    planet.vy *= -1;
                    newY = planet.y + planet.vy;
                }

                return { ...planet, x: newX, y: newY };
            });

            // Check for collisions
            for (let i = 0; i < newPlanets.length; i++) {
                for (let j = i + 1; j < newPlanets.length; j++) {
                    handleCollision(newPlanets[i], newPlanets[j]);
                }
            }

            return newPlanets;
        });

        animationFrameRef.current = requestAnimationFrame(movePlanets);
    }, []);

    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(movePlanets);
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [movePlanets]);

    const handlePlanetHit = useCallback((planet: Planet) => {
        setIsExploding(true);
        setExplosionCenter({x: planet.x, y: planet.y});

        const projectUrls: { [key: string]: string } = {
            'WebSocket Chat': 'http://13.235.103.165/',
            'Hangman': 'https://velgarde.github.io/hangman/',
            'TicTacToe': 'https://velgarde.github.io/tic-tac-toe/',
        };

        if (planet.label in projectUrls) {
            window.open(projectUrls[planet.label], '_blank');
        }

        if (planet.label === 'Projects') {
            setNextPlanets([
                { x: 200, y: 200, radius: 40, label: 'WebSocket Chat', color: '#3A86FF', vx: 0.2, vy: 0.1 },
                { x: 600, y: 200, radius: 40, label: 'Hangman', color: '#8338EC', vx: -0.1, vy: 0.2 },
                { x: 400, y: 400, radius: 40, label: 'TicTacToe', color: '#FF006E', vx: 0.1, vy: -0.1 },
                { x: 800, y: 400, radius: 40, label: 'Back', color: '#FB5607', vx: -0.2, vy: -0.2 },
            ]);
            setCurrentPage('projects');
        } else if (planet.label === 'Back') {
            setNextPlanets([
                { x: 200, y: 200, radius: 40, label: 'Projects', color: '#3A86FF', vx: 0.2, vy: 0.1 },
                { x: 600, y: 200, radius: 40, label: 'Resume', color: '#8338EC', vx: -0.1, vy: 0.2 },
                { x: 400, y: 400, radius: 40, label: 'Contact', color: '#FF006E', vx: 0.1, vy: -0.1 },
            ]);
            setCurrentPage('main');
        }
        setBullets([]);
    }, []);

    const handleExplosionComplete = useCallback(() => {
        setIsExploding(false);
        setExplosionCenter(null);
        if (nextPlanets) {
            setPlanets(nextPlanets);
            setNextPlanets(null);
        }
    }, [nextPlanets]);

    const handleBulletOffscreen = useCallback((id: number) => {
        setBullets(prevBullets => prevBullets.filter(bullet => bullet.id !== id));
    }, []);

    useEffect(() => {
        const movePlanets = () => {
            setPlanets(prevPlanets =>
                prevPlanets.map(planet => {
                    let newX = planet.x + planet.vx;
                    let newY = planet.y + planet.vy;

                    if (newX - planet.radius < 0 || newX + planet.radius > window.innerWidth) {
                        planet.vx *= -1;
                        newX = planet.x + planet.vx;
                    }
                    if (newY - planet.radius < 0 || newY + planet.radius > window.innerHeight) {
                        planet.vy *= -1;
                        newY = planet.y + planet.vy;
                    }

                    return { ...planet, x: newX, y: newY };
                })
            );
        };
        const intervalId = setInterval(movePlanets, 16);
        return () => clearInterval(intervalId);
    }, []);

    const handleClick = (e: React.MouseEvent) => {
        if (isExploding) return;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        setBullets(prevBullets => [...prevBullets, { id: bulletIdCounter, x: centerX, y: centerY, angle }]);
        setBulletIdCounter(prev => prev + 1);
    };



    const handleMouseMove = (e: React.MouseEvent) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        setSpacecraftRotation(angle + Math.PI / 2);
    };

    return (
        <div
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            style={{
                width: '100vw',
                height: '100vh',
                background: 'black',
                cursor: 'none',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            <SpaceBackground />
            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                {planets.map((planet, index) => (
                    <Planet key={index} {...planet} />
                ))}
                {bullets.map((bullet) => (
                    <AnimatedBullet
                        key={bullet.id}
                        startX={bullet.x}
                        startY={bullet.y}
                        angle={bullet.angle}
                        planets={planets}
                        onPlanetHit={handlePlanetHit}
                        onBulletOffscreen={() => handleBulletOffscreen(bullet.id)}
                    />
                ))}
            </svg>
            <Spacecraft rotation={spacecraftRotation} />
            {isExploding && explosionCenter && (
                <ExplosionTransition
                    centerX={explosionCenter.x}
                    centerY={explosionCenter.y}
                    color={planets.find(p => p.label === currentPage)?.color || '#FFFFFF'}
                    onAnimationComplete={handleExplosionComplete}
                />
            )}
            <Crosshair />
        </div>
    );
};
const SpaceBackground: React.FC = () => {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'black',
            overflow: 'hidden'
        }}>
            {[...Array(100)].map((_, i) => (
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        width: '2px',
                        height: '2px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animation: `twinkle ${Math.random() * 5 + 5}s linear infinite`
                    }}
                />
            ))}
        </div>
    );
};
const Crosshair: React.FC = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <svg
            style={{
                position: 'fixed',
                pointerEvents: 'none',
                left: position.x - 15,
                top: position.y - 15,
            }}
            width="30"
            height="30"
            viewBox="0 0 30 30"
        >
            <circle cx="15" cy="15" r="13" stroke="white" strokeWidth="2" fill="none" />
            <line x1="15" y1="0" x2="15" y2="30" stroke="white" strokeWidth="2" />
            <line x1="0" y1="15" x2="30" y2="15" stroke="white" strokeWidth="2" />
        </svg>
    );
};

export default App;