// src/components/Spacecraft.tsx

import React from 'react';

interface SpacecraftProps {
    rotation: number;
}

const Spacecraft: React.FC<SpacecraftProps> = ({ rotation }) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    return (
        <svg
            width="40"
            height="40"
            viewBox="-20 -20 40 40"
            style={{
                position: 'absolute',
                left: `${centerX}px`,
                top: `${centerY}px`,
                transform: `translate(-50%, -50%) rotate(${rotation}rad)`,
            }}
        >
            <polygon points="0,-20 17.32,10 -17.32,10" fill="#F35B04" />
        </svg>
    );
};

export default Spacecraft;