
import React, { useEffect, useRef } from 'react';

interface ExplosionTransitionProps {
    centerX: number;
    centerY: number;
    color: string;
    onAnimationComplete: () => void;
}

const ExplosionTransition: React.FC<ExplosionTransitionProps> = ({ centerX, centerY, color, onAnimationComplete }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let radius = 0;
        const maxRadius = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
        const speed = maxRadius / 60;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            radius += speed;

            if (radius < maxRadius) {
                requestAnimationFrame(animate);
            } else {
                onAnimationComplete();
            }
        };

        animate();
    }, [centerX, centerY, color, onAnimationComplete]);

    return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
};

export default ExplosionTransition;