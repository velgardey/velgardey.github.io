import React, { useState, useEffect, useRef } from 'react';
import { Planet } from '../App';

interface TypedTextProps {
    text: string;
    style?: React.CSSProperties;
    collidable?: boolean;
    planets?: Planet[];
    bullets?: Array<{ id: number; x: number; y: number; angle: number }>;
    maxWidth?: number | string;
}

const TypedText: React.FC<TypedTextProps> = ({ text, style, collidable = false, planets = [], bullets = [], maxWidth = '80%' }) => {
    const [displayText, setDisplayText] = useState('');
    const [cursorVisible, setCursorVisible] = useState(true);
    const [opacity, setOpacity] = useState(1);
    const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const textRef = useRef(text);
    const indexRef = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);

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
    }, [text]);

    useEffect(() => {
        if (collidable) {
            const checkCollisions = () => {
                wordRefs.current.forEach((wordRef) => {
                    if (wordRef) {
                        const rect = wordRef.getBoundingClientRect();
                        const wordX = rect.left + rect.width / 2;
                        const wordY = rect.top + rect.height / 2;

                        planets.forEach(planet => {
                            const dx = wordX - planet.x;
                            const dy = wordY - planet.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance < planet.radius + 10) {
                                wordRef.style.color = planet.color;
                            }
                        });

                        bullets.forEach(bullet => {
                            const dx = wordX - bullet.x;
                            const dy = wordY - bullet.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance < 10) {
                                wordRef.style.transform = 'scale(1.5)';
                                setTimeout(() => {
                                    if (wordRef) wordRef.style.transform = 'scale(1)';
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

    const words = displayText.split(' ');

    return (
        <div ref={containerRef} style={{...style, opacity, maxWidth, width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'center'}}>
            {words.map((word, index) => (
                <span
                    key={index}
                    ref={(el) => wordRefs.current[index] = el}
                    style={{
                        display: 'inline-block',
                        transition: 'all 0.2s',
                        marginRight: '0.25em',
                        marginBottom: '0.25em'
                    }}
                >
                    {word}
                </span>
            ))}
            {cursorVisible && <span>|</span>}
        </div>
    );
};

export default TypedText;