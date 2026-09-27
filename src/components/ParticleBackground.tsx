import { useEffect, useRef } from "react";

type Drop = {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  thickness: number;
};

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let drops: Drop[] = [];
    let animationId = 0;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const buildDrops = () => {
      // Density scales with viewport area, capped for performance.
      const count = Math.min(160, Math.floor((width * height) / 9000));
      drops = Array.from({ length: count }, () => makeDrop());
    };

    const makeDrop = (): Drop => ({
      x: Math.random() * width,
      y: Math.random() * height - height,
      length: 12 + Math.random() * 26,
      speed: 3.5 + Math.random() * 6,
      opacity: 0.08 + Math.random() * 0.28,
      thickness: 0.6 + Math.random() * 1.1,
    });

    const resetDrop = (d: Drop) => {
      d.x = Math.random() * width;
      d.y = -d.length - Math.random() * 40;
      d.length = 12 + Math.random() * 26;
      d.speed = 3.5 + Math.random() * 6;
      d.opacity = 0.08 + Math.random() * 0.28;
      d.thickness = 0.6 + Math.random() * 1.1;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const d of drops) {
        // Green-tinted streaks matching the app's primary hue.
        ctx.strokeStyle = `rgba(74, 222, 128, ${d.opacity})`;
        ctx.lineWidth = d.thickness;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x, d.y + d.length);
        ctx.stroke();

        d.y += d.speed;
        if (d.y > height + d.length) resetDrop(d);
      }
      animationId = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      buildDrops();
    };

    buildDrops();

    if (prefersReduced) {
      // Render a single static frame instead of animating.
      ctx.clearRect(0, 0, width, height);
      for (const d of drops) {
        ctx.strokeStyle = `rgba(74, 222, 128, ${d.opacity})`;
        ctx.lineWidth = d.thickness;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x, d.y + d.length);
        ctx.stroke();
      }
    } else {
      draw();
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
