import React, { useEffect, useRef, useState } from 'react';
import { Planet } from '../App';

interface AnimatedBulletProps {
    startX: number;
    startY: number;
    angle: number;
    planets: Planet[];
    onPlanetHit: (planet: Planet) => void;
    onBulletOffscreen: () => void;
}

const AnimatedBullet: React.FC<AnimatedBulletProps> = ({
    startX,
    startY,
    angle,
    planets,
    onPlanetHit,
    onBulletOffscreen
}) => {
    const bulletRef = useRef<SVGGElement>(null);
    const [position, setPosition] = useState({ x: startX, y: startY });
    const [isCollided, setIsCollided] = useState(false);
    const speed = 15;

    useEffect(() => {
        if (isCollided) {
            const timeout = setTimeout(() => {
                onBulletOffscreen();
            }, 100);
            return () => clearTimeout(timeout);
        }

        const animationFrame = requestAnimationFrame(() => {
            const newX = position.x + Math.cos(angle) * speed;
            const newY = position.y + Math.sin(angle) * speed;

            for (const planet of planets) {
                const dx = newX - planet.x;
                const dy = newY - planet.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < planet.radius) {
                    setIsCollided(true);
                    onPlanetHit(planet);
                    return;
                }
            }

            if (
                newX < 0 ||
                newX > window.innerWidth ||
                newY < 0 ||
                newY > window.innerHeight
            ) {
                onBulletOffscreen();
                return;
            }

            setPosition({ x: newX, y: newY });
        });

        return () => cancelAnimationFrame(animationFrame);
    }, [position, angle, planets, onPlanetHit, onBulletOffscreen, isCollided]);

    if (isCollided) return null;

    return (
        <g ref={bulletRef}>
            <defs>
                <radialGradient id="bulletGradient">
                    <stop offset="0%" stopColor="#00FFFF" />
                    <stop offset="100%" stopColor="#0000FF" />
                </radialGradient>
                <filter id="bulletGlow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <circle
                cx={position.x}
                cy={position.y}
                r="3"
                fill="url(#bulletGradient)"
                filter="url(#bulletGlow)"
            />
            <line
                x1={position.x - Math.cos(angle) * 10}
                y1={position.y - Math.sin(angle) * 10}
                x2={position.x}
                y2={position.y}
                stroke="url(#bulletGradient)"
                strokeWidth="2"
                opacity="0.7"
            />
        </g>
    );
}

export default AnimatedBullet;