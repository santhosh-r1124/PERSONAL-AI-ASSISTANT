import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  opacityDir: number;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create particles
    const PARTICLE_COUNT = 55;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.8 + 0.4,
        opacity: Math.random() * 0.5 + 0.1,
        opacityDir: Math.random() > 0.5 ? 0.003 : -0.003,
      });
    }

    // Two slowly drifting gradient orbs
    let orb1x = canvas.width * 0.2;
    let orb1y = canvas.height * 0.3;
    let orb2x = canvas.width * 0.8;
    let orb2y = canvas.height * 0.7;
    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      t += 0.002;
      orb1x = canvas.width * 0.2 + Math.sin(t * 0.7) * canvas.width * 0.12;
      orb1y = canvas.height * 0.3 + Math.cos(t * 0.5) * canvas.height * 0.12;
      orb2x = canvas.width * 0.8 + Math.cos(t * 0.6) * canvas.width * 0.1;
      orb2y = canvas.height * 0.7 + Math.sin(t * 0.8) * canvas.height * 0.1;

      // Draw orbs
      const grad1 = ctx.createRadialGradient(orb1x, orb1y, 0, orb1x, orb1y, 320);
      grad1.addColorStop(0, "rgba(124, 58, 237, 0.12)");
      grad1.addColorStop(0.5, "rgba(147, 51, 234, 0.06)");
      grad1.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad1;
      ctx.beginPath();
      ctx.arc(orb1x, orb1y, 320, 0, Math.PI * 2);
      ctx.fill();

      const grad2 = ctx.createRadialGradient(orb2x, orb2y, 0, orb2x, orb2y, 260);
      grad2.addColorStop(0, "rgba(79, 14, 163, 0.1)");
      grad2.addColorStop(0.5, "rgba(109, 40, 217, 0.05)");
      grad2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.arc(orb2x, orb2y, 260, 0, Math.PI * 2);
      ctx.fill();

      // Draw connection lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(124, 58, 237, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw and update particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity += p.opacityDir;
        if (p.opacity > 0.6 || p.opacity < 0.05) p.opacityDir *= -1;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Glow effect
        ctx.shadowBlur = 6;
        ctx.shadowColor = `rgba(147, 51, 234, ${p.opacity * 0.8})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167, 139, 250, ${p.opacity})`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      {/* Canvas particles */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />
      {/* Blur/depth layer */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.08) 0%, transparent 60%)",
        }}
      />
    </>
  );
}
