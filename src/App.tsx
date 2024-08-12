import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useMediaQuery } from 'react-responsive';
import Spacecraft from './components/Spacecraft';
import AnimatedBullet from './components/AnimatedBullet';
import Planet from './components/Planet';
import ExplosionTransition from './components/ExplosionTransition';
import TypedText from './components/TypedText';
import useSound from 'use-sound';
import shootSound from './assets/audio/shoot.wav';
import hitSound from './assets/audio/explosion.wav';
import BackgroundMusic from './components/BackgroundMusic';
import ParticleSystem from './components/ParticleSystem';
import ParticleTrail from './components/ParticleTrail';
import LoadingScreen from './components/LoadingScreen';

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
    const [permanentTitle, setPermanentTitle] = useState<string | null>(null);
    const [permanentTitleOpacity, setPermanentTitleOpacity] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [spacecraftPosition, setSpacecraftPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const animationFrameRef = useRef<number>();
    const isMobile = useMediaQuery({ query: '(max-width: 1024px)' });
    const particleCount = useMemo(() => isMobile ? 50 : 100, [isMobile]);
    const starCount = useMemo(() => isMobile ? 150 : 300, [isMobile]);
    const lastTouchTimeRef = useRef(0);

    const [playShootSound] = useSound(shootSound);
    const [playHitSound] = useSound(hitSound);

    const calculatePlanetRadius = useCallback((label: string) => {
        const baseRadius = isMobile ? 30 : 60;
        const textLength = label.length;
        return Math.max(baseRadius, Math.min(baseRadius * 1.5, baseRadius + textLength * (isMobile ? 1 : 2)));
    }, [isMobile]);
    
    const createRandomPlanet = useCallback((label: string, color: string, link?: string): Planet => {
        const radius = calculatePlanetRadius(label);
        const spacecraftRadius = 30; // Adjust this value based on your spacecraft size
        let x, y;
        do {
            x = Math.random() * (window.innerWidth - 2 * radius) + radius;
            y = Math.random() * (window.innerHeight - 2 * radius) + radius;
        } while (Math.sqrt(Math.pow(x - window.innerWidth / 2, 2) + Math.pow(y - window.innerHeight / 2, 2)) < radius + spacecraftRadius);
        
        const speed = isMobile ? 0.3 : 0.5;
        const angle = Math.random() * Math.PI * 2;
        return {
            x, y, radius, label, color, link,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        };
    }, [calculatePlanetRadius, isMobile]);

    const initializePlanets = useCallback(() => {
        const initialPlanets = [
            createRandomPlanet('Projects', '#3A86FF'),
            createRandomPlanet('Resume', '#8338EC', 'https://drive.google.com/file/d/1ioZ9AmWRulxvjZvDBzTtgvacD6isvvW4/view?usp=sharing'),
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
            // Start fading in the permanent title
            const fadeInInterval = setInterval(() => {
                setPermanentTitleOpacity(prev => {
                    if (prev >= 1) {
                        clearInterval(fadeInInterval);
                        return 1;
                    }
                    return prev + 0.1;
                });
            }, 100);
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

            const vx1 = p1.vx * cos + p1.vy * sin;
            const vy1 = p1.vy * cos - p1.vx * sin;
            const vx2 = p2.vx * cos + p2.vy * sin;
            const vy2 = p2.vy * cos - p2.vx * sin;

            [p1.vx, p1.vy, p2.vx, p2.vy] = [
                vx2 * cos - vy1 * sin,
                vy1 * cos + vx2 * sin,
                vx1 * cos - vy2 * sin,
                vy2 * cos + vx1 * sin
            ];

            const overlap = (p1.radius + p2.radius - distance) / 2;
            p1.x -= overlap * cos;
            p1.y -= overlap * sin;
            p2.x += overlap * cos;
            p2.y += overlap * sin;
        }
    }, []);

    const handlePlanetCollision = useCallback((planet: Planet, objectX: number, objectY: number, objectRadius: number) => {
        const dx = planet.x - objectX;
        const dy = planet.y - objectY;
        const distance = Math.sqrt(dx * dx + dy * dy);
    
        if (distance < planet.radius + objectRadius) {
            const angle = Math.atan2(dy, dx);
            const sin = Math.sin(angle);
            const cos = Math.cos(angle);
    
            // Rotate planet's velocity
            const vx1 = planet.vx * cos + planet.vy * sin;
            const vy1 = planet.vy * cos - planet.vx * sin;
    
            // Update planet's velocity (assuming the object is stationary)
            const bounceFactorX = isMobile ? 1.5 : 1.2;
            const bounceFactorY = isMobile ? 1.5 : 1.2;
            planet.vx = (-vx1 * cos + vy1 * sin) * bounceFactorX;
            planet.vy = (-vy1 * cos - vx1 * sin) * bounceFactorY;
    
            // Move the planet outside the collision radius
            const overlap = planet.radius + objectRadius - distance;
            planet.x += overlap * cos * 1.1;
            planet.y += overlap * sin * 1.1;
    
            // Ensure the planet maintains a minimum speed
            const minSpeed = isMobile ? 0.7 : 0.5;
            const currentSpeed = Math.sqrt(planet.vx * planet.vx + planet.vy * planet.vy);
            if (currentSpeed < minSpeed) {
                const factor = minSpeed / currentSpeed;
                planet.vx *= factor;
                planet.vy *= factor;
            }
    
            return true; // Collision occurred
        }
        return false; // No collision
    }, [isMobile]);

    const movePlanets = useCallback(() => {
        setPlanets(prevPlanets => {
            const newPlanets = prevPlanets.map(planet => {
                let newX = planet.x + planet.vx;
                let newY = planet.y + planet.vy;
    
                if (newX - planet.radius < 0 || newX + planet.radius > window.innerWidth) {
                    planet.vx *= -1;
                    newX = Math.max(planet.radius, Math.min(window.innerWidth - planet.radius, newX));
                }
                if (newY - planet.radius < 0 || newY + planet.radius > window.innerHeight) {
                    planet.vy *= -1;
                    newY = Math.max(planet.radius, Math.min(window.innerHeight - planet.radius, newY));
                }
    
                // Check collision with spacecraft
                const collided = handlePlanetCollision(planet, window.innerWidth / 2, window.innerHeight / 2, 30);
    
                if (!collided) {
                    // Only update position if no collision occurred
                    planet.x = newX;
                    planet.y = newY;
                }
    
                // Maintain constant speed
                const speed = Math.sqrt(planet.vx * planet.vx + planet.vy * planet.vy);
                const targetSpeed = isMobile ? 0.7 : 0.5;
                if (Math.abs(speed - targetSpeed) > 0.1) {
                    const factor = targetSpeed / speed;
                    planet.vx *= factor;
                    planet.vy *= factor;
                }
    
                return planet;
            });
    
            for (let i = 0; i < newPlanets.length; i++) {
                for (let j = i + 1; j < newPlanets.length; j++) {
                    handleCollision(newPlanets[i], newPlanets[j]);
                }
            }
    
            return newPlanets;
        });
    
        animationFrameRef.current = requestAnimationFrame(movePlanets);
    }, [handleCollision, handlePlanetCollision, isMobile]);

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
        playHitSound();

        if (planet.link) {
            window.open(planet.link, '_blank');
        }

        if (planet.label === 'Projects') {
            setNextPlanets([
                createRandomPlanet('CHET', '#3A86FF', 'http://13.235.103.165/'),
                createRandomPlanet('Chess Rogue', '#75d34d', 'https://velgarde.github.io/chess-rogue/'),
                createRandomPlanet('Hangman', '#8338EC', 'https://velgarde.github.io/hangman/'),
                createRandomPlanet('Tic-Tac-Toe', '#FF006E', 'https://velgarde.github.io/tic-tac-toe/'),
                createRandomPlanet('Back', '#FB5607'),
            ]);
            setCurrentPage('projects');
            setPermanentTitle('Projects');
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
            setPermanentTitle('Contact');
        } else if (planet.label === 'Back') {
            setNextPlanets([
                createRandomPlanet('Projects', '#3A86FF'),
                createRandomPlanet('Resume', '#8338EC', 'https://drive.google.com/file/d/1ioZ9AmWRulxvjZvDBzTtgvacD6isvvW4/view?usp=sharing'),
                createRandomPlanet('Contact', '#FF006E'),
            ]);
            setCurrentPage('main');
            setPermanentTitle(null);
        }
        setBullets([]);
        setPermanentTitleOpacity(0);
    }, [createRandomPlanet, playHitSound]);

    const handleExplosionComplete = useCallback(() => {
        setIsExploding(false);
        setExplosionCenter(null);
        if (nextPlanets) {
            setPlanets(nextPlanets);
            setNextPlanets(null);
        }
        // Start fading in the permanent title
        const fadeInInterval = setInterval(() => {
            setPermanentTitleOpacity(prev => {
                if (prev >= 1) {
                    clearInterval(fadeInInterval);
                    return 1;
                }
                return prev + 0.1;
            });
        }, 100);
    }, [nextPlanets]);

    const handleBulletOffscreen = useCallback((id: number) => {
        setBullets(prevBullets => prevBullets.filter(bullet => bullet.id !== id));
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        setSpacecraftRotation(angle + Math.PI / 2);
        setSpacecraftPosition({ x: centerX, y: centerY });
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        const centerX = touch.clientX;
        const centerY = touch.clientY;
        const angle = Math.atan2(touch.clientY - window.innerHeight / 2, touch.clientX - window.innerWidth / 2);
        setSpacecraftRotation(angle + Math.PI / 2);
        setSpacecraftPosition({ x: centerX, y: centerY });
    }, []);

    const handleInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (isExploding) return;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        let clientX, clientY;
    
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
    
            // Prevent rapid firing on mobile
            const now = Date.now();
            if (now - lastTouchTimeRef.current < 500) {
                return;
            }
            lastTouchTimeRef.current = now;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
    
        const angle = Math.atan2(clientY - centerY, clientX - centerX);
        setSpacecraftRotation(angle + Math.PI / 2);
    
        const newBullet = { id: bulletIdCounter, x: centerX, y: centerY, angle };
        setBullets(prevBullets => [...prevBullets, newBullet]);
        setBulletIdCounter(prev => prev + 1);
    
        playShootSound();
    }, [bulletIdCounter, isExploding, playShootSound]);

    const handleResize = useCallback(() => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        setSpacecraftPosition({ x: centerX, y: centerY });
        initializePlanets();
    }, [initializePlanets]);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [handleResize]);

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

const renderPageContent = useCallback(() => {
    const commonStyle: React.CSSProperties = {
        position: 'absolute',
        top: '10%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: isMobile ? '24px' : '48px',
        color: 'white',
        zIndex: 1000,
        transition: 'opacity 0.5s ease-in-out',
        textAlign: 'center',
    };

    const maxWidth = isMobile ? '90%' : '70%';

    switch (currentPage) {
        case 'main':
            return (
                <>
                    {showFirstText && (
                        <TypedText
                            text="Hi , I  am  Mriganka  Dey"
                            style={commonStyle}
                            collidable={true}
                            planets={planets}
                            bullets={bullets}
                            maxWidth={maxWidth}
                        />
                    )}
                    {showSecondText && (
                        <TypedText
                            text="Welcome  to  my  portfolio"
                            style={commonStyle}
                            collidable={true}
                            planets={planets}
                            bullets={bullets}
                            maxWidth={maxWidth}
                        />
                    )}
                </>
            );
        case 'projects':
            return (
                <TypedText
                    text="Explore  my  projects"
                    style={commonStyle}
                    collidable={true}
                    planets={planets}
                    bullets={bullets}
                    maxWidth={maxWidth}
                />
            );
        case 'contact':
            return (
                <TypedText
                    text="Get  in  touch  with  me"
                    style={commonStyle}
                    collidable={true}
                    planets={planets}
                    bullets={bullets}
                    maxWidth={maxWidth}
                />
            );
        default:
            return null;
    }
}, [currentPage, showFirstText, showSecondText, isMobile, planets, bullets]);

    useEffect(() => {
        // Simulate loading time
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            {isLoading && <LoadingScreen />}
            <div
                onClick={handleInteraction}
                onTouchStart={handleInteraction}
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                style={{
                    width: '100vw',
                    height: '100vh',
                    background: 'linear-gradient(to bottom, #000000, #1a1a2e)',
                    cursor: 'none',
                    overflow: 'hidden',
                    position: 'relative',
                    fontFamily: '"Space Mono", monospace',
                    fontSize: isMobile ? '14px' : '16px',
                }}
            >
                <BackgroundMusic />
                <SpaceBackground starCount={starCount} />
                <AmbientLight />
                <ParticleSystem particleCount={particleCount} />
                <ParticleTrail x={spacecraftPosition.x} y={spacecraftPosition.y} />
                <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                    {memoizedPlanets}
                    {memoizedBullets}
                </svg>
                <Spacecraft
                    rotation={spacecraftRotation}
                    x={spacecraftPosition.x}
                    y={spacecraftPosition.y}
                />
                {isExploding && explosionCenter && (
                    <ExplosionTransition
                        centerX={explosionCenter.x}
                        centerY={explosionCenter.y}
                        color={planets.find(p => p.x === explosionCenter.x && p.y === explosionCenter.y)?.color || '#FFFFFF'}
                        onAnimationComplete={handleExplosionComplete}
                    />
                )}
                {!isMobile && <Crosshair />}
                {renderPageContent()}
                {permanentTitle && (
                    <div style={{
                        position: 'absolute',
                        bottom: '5%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: isMobile ? '24px' : '36px',
                        color: 'white',
                        fontWeight: 'bold',
                        textShadow: '0 0 10px rgba(255,255,255,0.5)',
                        opacity: permanentTitleOpacity,
                        transition: 'opacity 0.5s ease-in-out',
                    }}>
                        {permanentTitle}
                    </div>
                )}
            </div>
        </>
    );
};

const SpaceBackground: React.FC<{ starCount: number }> = React.memo(({ starCount }) => {
    const stars = useMemo(() => [...Array(starCount)].map((_, i) => ({
        key: i,
        style: {
            position: 'absolute' as const,
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            backgroundColor: `rgba(255, 255, 255, ${Math.random() * 0.7 + 0.3})`,
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `twinkle ${Math.random() * 10 + 10}s linear infinite`,
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
            transform: `translateZ(${Math.random() * 100}px)`,
        }
    })), [starCount]);

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%)',
            overflow: 'hidden',
            perspective: '400px',
        }}>
            {stars.map(star => <div key={star.key} style={star.style} />)}
        </div>
    );
});
const AmbientLight: React.FC = React.memo(() => {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 70%)',
            pointerEvents: 'none'
        }} />
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
                left: position.x - 20,
                top: position.y - 20,
                zIndex: 9999,
            }}
            width="40"
            height="40"
            viewBox="0 0 40 40"
        >
            {/* Outer circle */}
            <circle cx="20" cy="20" r="18" stroke="#00FFFF" strokeWidth="1" fill="none" opacity="0.5">
                <animate attributeName="r" from="15" to="20" dur="1s" repeatCount="indefinite" />
            </circle>

            {/* Inner circle */}
            <circle cx="20" cy="20" r="5" fill="#00FFFF" opacity="0.7">
                <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.5s" repeatCount="indefinite" />
            </circle>

            {/* Crosshair lines */}
            <line x1="20" y1="0" x2="20" y2="15" stroke="#00FFFF" strokeWidth="1" />
            <line x1="20" y1="25" x2="20" y2="40" stroke="#00FFFF" strokeWidth="1" />
            <line x1="0" y1="20" x2="15" y2="20" stroke="#00FFFF" strokeWidth="1" />
            <line x1="25" y1="20" x2="40" y2="20" stroke="#00FFFF" strokeWidth="1" />

            {/* Diagonal lines */}
            <line x1="5" y1="5" x2="15" y2="15" stroke="#00FFFF" strokeWidth="1" opacity="0.5" />
            <line x1="35" y1="5" x2="25" y2="15" stroke="#00FFFF" strokeWidth="1" opacity="0.5" />
            <line x1="5" y1="35" x2="15" y2="25" stroke="#00FFFF" strokeWidth="1" opacity="0.5" />
            <line x1="35" y1="35" x2="25" y2="25" stroke="#00FFFF" strokeWidth="1" opacity="0.5" />
        </svg>
    );
});

export default App;