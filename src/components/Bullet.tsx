import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';

interface BulletProps {
  engine: Matter.Engine;
  x: number;
  y: number;
  angle: number;
}

const Bullet: React.FC<BulletProps> = ({ engine, x, y, angle }) => {
  const bulletRef = useRef<SVGLineElement>(null);

  useEffect(() => {
    if (!bulletRef.current) return;

    const bullet = Matter.Bodies.rectangle(x, y, 20, 2, {
      label: 'bullet',
      angle,
      friction: 0,
      frictionAir: 0,
      restitution: 1,
      render: {
        fillStyle: '#FFFFFF',
      },
    });

    Matter.Body.setVelocity(bullet, {
      x: Math.cos(angle) * 10,
      y: Math.sin(angle) * 10,
    });

    Matter.Composite.add(engine.world, bullet);

    const removeTimeout = setTimeout(() => {
      Matter.Composite.remove(engine.world, bullet);
    }, 2000); // Remove bullet after 2 seconds

    return () => {
      clearTimeout(removeTimeout);
      Matter.Composite.remove(engine.world, bullet);
    };
  }, [engine, x, y, angle]);

  return (
      <line
          ref={bulletRef}
          x1={x}
          y1={y}
          x2={x + Math.cos(angle) * 20}
          y2={y + Math.sin(angle) * 20}
          stroke="white"
          strokeWidth="2"
      />
  );
};

export default Bullet;