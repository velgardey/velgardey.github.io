import React from 'react';

interface PlanetProps {
    x: number;
    y: number;
    radius: number;
    label: string;
    color: string;
}

const Planet: React.FC<PlanetProps> = React.memo(({ x, y, radius, label, color }) => {
    const fontSize = Math.min(radius / 3, 16);
    const words = label.split(' ');

    return (
        <g role="button" aria-label={label} tabIndex={0}>
            <defs>
                <filter id={`glow-${label}`}>
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
                <radialGradient id={`gradient-${label}`}>
                    <stop offset="0%" stopColor={color} />
                    <stop offset="100%" stopColor={`${color}88`} />
                </radialGradient>
            </defs>
            <circle
                cx={x}
                cy={y}
                r={radius}
                fill={`url(#gradient-${label})`}
                filter={`url(#glow-${label})`}
                stroke="white"
                strokeWidth="2"
            />
            <text
                x={x}
                y={y}
                textAnchor="middle"
                fill="white"
                fontSize={fontSize}
                fontWeight="bold"
                filter={`url(#glow-${label})`}
            >
                {words.map((word, index) => (
                    <tspan key={index} x={x} dy={index === 0 ? -fontSize/2 : fontSize}>
                        {word}
                    </tspan>
                ))}
            </text>
        </g>
    );
});

export default Planet;