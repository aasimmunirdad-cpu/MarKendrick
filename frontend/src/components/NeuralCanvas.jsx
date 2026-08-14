import { useEffect, useRef } from "react";

export default function NeuralCanvas({ className = "" }) {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let w, h, dpr, raf;
    let particles = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(110, Math.floor((w * h) / 16000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.7,
      }));
    };

    const step = () => {
      ctx.clearRect(0, 0, w, h);
      const { x: mx, y: my } = mouse.current;

      for (const p of particles) {
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 180 && dist > 0.1) {
          const f = (180 - dist) / 180;
          p.vx += (dx / dist) * f * 0.03;
          p.vy += (dy / dist) * f * 0.03;
        }
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx + (Math.random() - 0.5) * 0.12;
        p.y += p.vy + (Math.random() - 0.5) * 0.12;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) {
            const alpha = (1 - d / 130) * 0.35;
            const nearMouse =
              Math.hypot((a.x + b.x) / 2 - mx, (a.y + b.y) / 2 - my) < 160;
            ctx.strokeStyle = nearMouse
              ? `rgba(255, 59, 48, ${alpha + 0.25})`
              : `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        const nearMouse = Math.hypot(p.x - mx, p.y - my) < 160;
        ctx.fillStyle = nearMouse ? "rgba(255, 59, 48, 0.95)" : "rgba(255, 255, 255, 0.7)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(step);
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => { mouse.current = { x: -9999, y: -9999 }; };

    resize();
    step();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} data-testid="neural-canvas" className={`w-full h-full ${className}`} aria-hidden="true" />;
}
