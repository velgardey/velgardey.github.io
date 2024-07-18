import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useMediaQuery } from 'react-responsive';
import Spacecraft from './components/Spacecraft';
import AnimatedBullet from './components/AnimatedBullet';
import Planet from './components/Planet';
import ExplosionTransition from './components/ExplosionTransition';
import TypedText from './components/TypedText';

export interface Planet {
    x: number;
    y: number;
    radius: number;
    label: string;
    color: string;
    vx: number;
    vy: number;
    link?: string;
}

const App: React.FC = () => {
    const [bullets, setBullets] = useState<Array<{ id: number; x: number; y: number; angle: number }>>([]);
    const [bulletIdCounter, setBulletIdCounter] = useState(0);
    const [currentPage, setCurrentPage] = useState<string>('main');
    const [isExploding, setIsExploding] = useState(false);
    const [explosionCenter, setExplosionCenter] = useState<{x: number, y: number} | null>(null);
    const [spacecraftRotation, setSpacecraftRotation] = useState(0);
    const [nextPlanets, setNextPlanets] = useState<Planet[] | null>(null);
    const [planets, setPlanets] = useState<Planet[]>([]);
    const [showFirstText, setShowFirstText] = useState(false);
    const [showSecondText, setShowSecondText] = useState(false);
    const animationFrameRef = useRef<number>();
    const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

    const calculatePlanetRadius = useCallback((label: string) => {
        const baseRadius = isMobile ? 30 : 40;
        const textLength = label.length;
        return Math.max(baseRadius, textLength * 5);
    }, [isMobile]);

    const createRandomPlanet = useCallback((label: string, color: string, link?: string): Planet => {
        const radius = calculatePlanetRadius(label);
        const x = Math.random() * (window.innerWidth - 2 * radius) + radius;
        const y = Math.random() * (window.innerHeight - 2 * radius) + radius;
        const speed = 0.25;
        const angle = Math.random() * Math.PI * 2;
        return {
            x, y, radius, label, color, link,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        };
    }, [calculatePlanetRadius]);

    const initializePlanets = useCallback(() => {
        const initialPlanets = [
            createRandomPlanet('Projects', '#3A86FF'),
            createRandomPlanet('Resume', '#8338EC', 'https://drive.google.com/your-resume-link'),
            createRandomPlanet('Contact', '#FF006E'),
        ];
        setPlanets(initialPlanets);
    }, [createRandomPlanet]);

    useEffect(() => {
        initializePlanets();
        const timer1 = setTimeout(() => setShowFirstText(true), 1000);
        const timer2 = setTimeout(() => {
            setShowFirstText(false);
            setShowSecondText(true);
        }, 6000);
        const timer3 = setTimeout(() => {
            setShowSecondText(false);
        }, 11000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [initializePlanets]);

    const handleCollision = useCallback((p1: Planet, p2: Planet) => {
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
            [p1.vx, p1.vy, p2.vx, p2.vy] = [
                vx2 * cos - vy1 * sin,
                vy1 * cos + vx2 * sin,
                vx1 * cos - vy2 * sin,
                vy2 * cos + vx1 * sin
            ];

            // Move planets apart to prevent sticking
            const overlap = (p1.radius + p2.radius - distance) / 2;
            p1.x -= overlap * cos;
            p1.y -= overlap * sin;
            p2.x += overlap * cos;
            p2.y += overlap * sin;
        }
    }, []);

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
    }, [handleCollision]);

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

        if (planet.link) {
            window.open(planet.link, '_blank');
        }

        if (planet.label === 'Projects') {
            setNextPlanets([
                createRandomPlanet('WebSocket Chat', '#3A86FF', 'http://13.235.103.165/'),
                createRandomPlanet('Hangman', '#8338EC', 'https://velgarde.github.io/hangman/'),
                createRandomPlanet('TicTacToe', '#FF006E', 'https://velgarde.github.io/tic-tac-toe/'),
                createRandomPlanet('Back', '#FB5607'),
            ]);
            setCurrentPage('projects');
        } else if (planet.label === 'Contact') {
            setNextPlanets([
                createRandomPlanet('LinkedIn', '#0077B5', 'https://www.linkedin.com/in/mrigankadey/'),
                createRandomPlanet('GitHub', '#6e5494', 'https://github.com/Velgarde'),
                createRandomPlanet('Twitter', '#1DA1F2', 'https://x.com/velgardey'),
                createRandomPlanet('Discord', '#7289DA', 'https://discordapp.com/users/468278174849957899'),
                createRandomPlanet('Instagram', '#E1306C', 'https://www.instagram.com/velgardey/'),
                createRandomPlanet('Back', '#FB5607'),
            ]);
            setCurrentPage('contact');
        } else if (planet.label === 'Back') {
            setNextPlanets([
                createRandomPlanet('Projects', '#3A86FF'),
                createRandomPlanet('Resume', '#8338EC', 'https://drive.google.com/your-resume-link'),
                createRandomPlanet('Contact', '#FF006E'),
            ]);
            setCurrentPage('main');
        }
        setBullets([]);
    }, [createRandomPlanet]);

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

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        setSpacecraftRotation(angle + Math.PI / 2);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const touch = e.touches[0];
        const angle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX);
        setSpacecraftRotation(angle + Math.PI / 2);
    }, []);

    const handleInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (isExploding) return;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const angle = Math.atan2(clientY - centerY, clientX - centerX);
        setBullets(prevBullets => [...prevBullets, { id: bulletIdCounter, x: centerX, y: centerY, angle }]);
        setBulletIdCounter(prev => prev + 1);
    }, [bulletIdCounter, isExploding]);

    const memoizedPlanets = useMemo(() => planets.map((planet, index) => (
        <Planet key={index} {...planet} />
    )), [planets]);

    const memoizedBullets = useMemo(() => bullets.map((bullet) => (
        <AnimatedBullet
            key={bullet.id}
            startX={bullet.x}
            startY={bullet.y}
            angle={bullet.angle}
            planets={planets}
            onPlanetHit={handlePlanetHit}
            onBulletOffscreen={() => handleBulletOffscreen(bullet.id)}
        />
    )), [bullets, planets, handlePlanetHit, handleBulletOffscreen]);

    return (
        <div
            onClick={handleInteraction}
            onTouchStart={handleInteraction}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            style={{
                width: '100vw',
                height: '100vh',
                background: 'black',
                cursor: 'none',
                overflow: 'hidden',
                position: 'relative',
                fontFamily: '"Space Mono", monospace',
            }}
        >
            <SpaceBackground />
            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                {memoizedPlanets}
                {memoizedBullets}
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
            {showFirstText && (
                <TypedText
                    text="Hi, I am Mriganka Dey"
                    style={{
                        position: 'absolute',
                        top: '10%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: isMobile ? '24px' : '48px',
                        color: 'white',
                        zIndex: 1000,
                    }}
                />
            )}
            {showSecondText && (
                <TypedText
                    text="You are in my portfolio"
                    style={{
                        position: 'absolute',
                        top: '10%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: isMobile ? '24px' : '48px',
                        color: 'white',
                        zIndex: 1000,
                    }}
                />
            )}
        </div>
    );
};

const SpaceBackground: React.FC = React.memo(() => {
    const stars = useMemo(() => [...Array(200)].map((_, i) => ({
        key: i,
        style: {
            position: 'absolute' as const,
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
            backgroundColor: `rgba(255, 255, 255, ${Math.random() * 0.7 + 0.3})`,
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `twinkle ${Math.random() * 10 + 10}s linear infinite`
        }
    })), []);

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
            {stars.map(star => <div key={star.key} style={star.style} />)}
        </div>
    );
});

const Crosshair: React.FC = React.memo(() => {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
        };

        const handleTouchMove = (e: TouchEvent) => {
            setPosition({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, []);

    return (
        <svg
            style={{
                position: 'fixed',
                pointerEvents: 'none',
                left: position.x - 15,
                top: position.y - 15,
                zIndex: 9999,
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
});

export default App;