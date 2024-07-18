import React, { useState, useEffect } from 'react';

interface PageTransitionProps {
    isTransitioning: boolean;
    onTransitionComplete: () => void;
}

const PageTransition: React.FC<PageTransitionProps> = ({ isTransitioning, onTransitionComplete }) => {
    const [opacity, setOpacity] = useState(0);

    useEffect(() => {
        if (isTransitioning) {
            let frame = 0;
            const animate = () => {
                frame++;
                setOpacity(frame / 60); // 60 frames for 1 second transition
                if (frame < 60) {
                    requestAnimationFrame(animate);
                } else {
                    onTransitionComplete();
                }
            };
            requestAnimationFrame(animate);
        } else {
            setOpacity(0);
        }
    }, [isTransitioning, onTransitionComplete]);

    if (!isTransitioning && opacity === 0) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: `rgba(255, 255, 255, ${opacity})`,
                zIndex: 9999,
            }}
        />
    );
};

export default PageTransition;