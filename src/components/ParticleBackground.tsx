import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  radius: number;
  driftX: number;
  driftY: number;
  sway: number;
  swayOffset: number;
  swaySpeed: number;
  opacity: number;
  pulse: number;
  pulseSpeed: number;
  hue: number;
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
    let particles: Particle[] = [];
    let animationId = 0;
    let frame = 0;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const buildParticles = () => {
      const count = Math.min(70, Math.floor((width * height) / 22000));
      particles = Array.from({ length: count }, () => makeParticle());
    };

    const makeParticle = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 1.5 + Math.random() * 3.5,
      driftX: (Math.random() - 0.5) * 0.15,
      driftY: -(0.15 + Math.random() * 0.35),
      sway: 0.3 + Math.random() * 0.5,
      swayOffset: Math.random() * Math.PI * 2,
      swaySpeed: 0.003 + Math.random() * 0.005,
      opacity: 0.15 + Math.random() * 0.35,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.015,
      // Alternate between the two green hues used across the app.
      hue: Math.random() > 0.5 ? 142 : 160,
    });

    const resetParticle = (p: Particle) => {
      p.x = Math.random() * width;
      p.y = height + p.radius + Math.random() * 60;
      p.radius = 1.5 + Math.random() * 3.5;
      p.driftX = (Math.random() - 0.5) * 0.15;
      p.driftY = -(0.15 + Math.random() * 0.35);
      p.sway = 0.3 + Math.random() * 0.5;
      p.swayOffset = Math.random() * Math.PI * 2;
      p.swaySpeed = 0.003 + Math.random() * 0.005;
      p.opacity = 0.15 + Math.random() * 0.35;
      p.pulse = Math.random() * Math.PI * 2;
      p.pulseSpeed = 0.01 + Math.random() * 0.015;
      p.hue = Math.random() > 0.5 ? 142 : 160;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      frame++;

      for (const p of particles) {
        p.x += p.driftX + Math.sin(frame * p.swaySpeed + p.swayOffset) * p.sway;
        p.y += p.driftY;
        p.pulse += p.pulseSpeed;

        if (p.y < -p.radius * 4) resetParticle(p);
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;

        const pulseFactor = 0.7 + 0.3 * Math.sin(p.pulse);
        const r = p.radius * pulseFactor;
        const alpha = p.opacity * pulseFactor;

        // Soft glow halo
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4);
        gradient.addColorStop(0, `hsla(${p.hue}, 71%, 55%, ${alpha})`);
        gradient.addColorStop(0.4, `hsla(${p.hue}, 71%, 50%, ${alpha * 0.3})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 71%, 45%, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 4, 0, Math.PI * 2);
        ctx.fill();

        // Bright core
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${alpha * 1.4})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      buildParticles();
    };

    buildParticles();

    if (prefersReduced) {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4);
        gradient.addColorStop(0, `hsla(${p.hue}, 71%, 55%, ${p.opacity})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 71%, 45%, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.opacity * 1.4})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
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
      className="pointer-events-none fixed inset-0 z-30 h-full w-full mix-blend-screen"
    />
  );
}
