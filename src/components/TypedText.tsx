// src/components/TypedText.tsx

import React, { useState, useEffect } from 'react';

interface TypedTextProps {
    text: string;
    style?: React.CSSProperties;
}

const TypedText: React.FC<TypedTextProps> = ({ text, style }) => {
    const [displayText, setDisplayText] = useState('');
    const [cursorVisible, setCursorVisible] = useState(true);
    const [opacity, setOpacity] = useState(1);

    useEffect(() => {
        let i = 0;
        const typingInterval = setInterval(() => {
            if (i < text.length) {
                setDisplayText(text.slice(0, i + 1));
                i++;
            } else {
                clearInterval(typingInterval);

                // Start fade out after full text is displayed
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
                }, 2000); // Wait for 2 seconds before starting fade out
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

    return (
        <div style={{...style, opacity}}>
            {displayText}
            <span style={{ opacity: cursorVisible ? 1 : 0 }}>|</span>
        </div>
    );
};

export default TypedText;