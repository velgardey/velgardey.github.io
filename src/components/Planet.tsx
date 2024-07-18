// src/components/Planet.tsx

import React from 'react';

interface PlanetProps {
    x: number;
    y: number;
    radius: number;
    label: string;
    color: string;
}

const Planet: React.FC<PlanetProps> = ({ x, y, radius, label, color }) => {
    const fontSize = Math.min(radius / 3, 14); // Limit font size
    const words = label.split(' ');

    return (
        <g>
            <circle cx={x} cy={y} r={radius} fill={color} />
            <text
                x={x}
                y={y}
                textAnchor="middle"
                fill="white"
                fontSize={fontSize}
                fontWeight="bold"
            >
                {words.map((word, index) => (
                    <tspan key={index} x={x} dy={index === 0 ? -fontSize/2 : fontSize}>
                        {word}
                    </tspan>
                ))}
            </text>
        </g>
    );
};

export default Planet;