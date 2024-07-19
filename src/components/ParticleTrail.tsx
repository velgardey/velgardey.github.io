import React, { useEffect, useRef, useMemo } from 'react';

interface ParticleTrailProps {
    x: number;
    y: number;
}

const ParticleTrail: React.FC<ParticleTrailProps> = React.memo(({ x, y }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Array<{ x: number; y: number; size: number; color: string; life: number }>>([]);

    const createParticle = useMemo(() => () => ({
        x,
        y,
        size: Math.random() * 3 + 1,
        color: `hsla(${Math.random() * 60 + 15}, 100%, 50%, ${Math.random() * 0.5 + 0.5})`,
        life: 30
    }), [x, y]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particlesRef.current.push(createParticle());

            particlesRef.current.forEach((particle, index) => {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = particle.color;
                ctx.fill();

                particle.life--;
                if (particle.life <= 0) {
                    particlesRef.current.splice(index, 1);
                }
            });

            requestAnimationFrame(animate);
        };

        animate();

        return () => {
            particlesRef.current = [];
        };
    }, [createParticle]);

    return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />;
});

export default ParticleTrail;