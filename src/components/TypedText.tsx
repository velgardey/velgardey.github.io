import React, { useState, useEffect, useRef } from 'react';
import { Planet } from '../App';

interface TypedTextProps {
    text: string;
    style?: React.CSSProperties;
    collidable?: boolean;
    planets?: Planet[];
    bullets?: Array<{ id: number; x: number; y: number; angle: number }>;
}

const TypedText: React.FC<TypedTextProps> = ({ text, style, collidable = false, planets = [], bullets = [] }) => {
    const [displayText, setDisplayText] = useState('');
    const [cursorVisible, setCursorVisible] = useState(true);
    const [opacity, setOpacity] = useState(1);
    const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const textRef = useRef(text);
    const indexRef = useRef(0);

    useEffect(() => {
        textRef.current = text;
        indexRef.current = 0;
        setDisplayText('');
    }, [text]);

    useEffect(() => {
        const typingInterval = setInterval(() => {
            if (indexRef.current < textRef.current.length) {
                setDisplayText(textRef.current.slice(0, indexRef.current + 1));
                indexRef.current++;
            } else {
                clearInterval(typingInterval);
                setTimeout(() => {
                    const fadeOutInterval = setInterval(() => {
                        setOpacity((prevOpacity) => {
                            if (prevOpacity <= 0) {
                                clearInterval(fadeOutInterval);
                                return 0;
                            }
                            return prevOpacity - 0.1;
                        });
                    }, 100);
                }, 2000);
            }
        }, 100);

        const cursorInterval = setInterval(() => {
            setCursorVisible(prev => !prev);
        }, 500);

        return () => {
            clearInterval(typingInterval);
            clearInterval(cursorInterval);
        };
    }, []);

    useEffect(() => {
        if (collidable) {
            const checkCollisions = () => {
                letterRefs.current.forEach((letterRef) => {
                    if (letterRef) {
                        const rect = letterRef.getBoundingClientRect();
                        const letterX = rect.left + rect.width / 2;
                        const letterY = rect.top + rect.height / 2;

                        planets.forEach(planet => {
                            const dx = letterX - planet.x;
                            const dy = letterY - planet.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance < planet.radius + 10) {
                                letterRef.style.color = planet.color;
                            }
                        });

                        bullets.forEach(bullet => {
                            const dx = letterX - bullet.x;
                            const dy = letterY - bullet.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance < 10) {
                                letterRef.style.transform = 'scale(1.5)';
                                setTimeout(() => {
                                    if (letterRef) letterRef.style.transform = 'scale(1)';
                                }, 200);
                            }
                        });
                    }
                });
            };

            const animationFrame = requestAnimationFrame(checkCollisions);
            return () => cancelAnimationFrame(animationFrame);
        }
    }, [collidable, planets, bullets]);

    return (
        <div style={{...style, opacity}}>
            {displayText.split('').map((char, index) => (
                <span
                    key={index}
                    ref={(el) => letterRefs.current[index] = el}
                    style={{ display: 'inline-block', transition: 'all 0.2s', marginRight: char === ' ' ? '0.25em' : '0' }}
                >
                    {char}
                </span>
            ))}
            <span style={{ opacity: cursorVisible ? 1 : 0 }}>|</span>
        </div>
    );
};

export default TypedText;