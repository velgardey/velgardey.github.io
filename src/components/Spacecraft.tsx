import React from 'react';


interface SpacecraftProps {
    rotation: number;
    x: number;
    y: number;
}

const Spacecraft: React.FC<SpacecraftProps> = ({ rotation, x, y }) => {
    return (
        <svg
            width="50"
            height="50"
            viewBox="-25 -25 50 50"
            style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                transform: `translate(-50%, -50%) rotate(${rotation}rad)`,
            }}
        >
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            <polygon points="0,-25 21.65,12.5 -21.65,12.5" fill="#F35B04" filter="url(#glow)" />
            <circle cx="0" cy="0" r="5" fill="#FFD700" />
            <line x1="0" y1="-25" x2="0" y2="12.5" stroke="#FFD700" strokeWidth="2" />
        </svg>
    );
};

export default React.memo(Spacecraft);