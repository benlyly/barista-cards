import { useEffect, useRef } from "react";

/**
 * Живая кофейная жидкость в треугольной «чашке».
 * Поверхность — цепочка пружин (spring + damping); курсор работает как магнит (феррофлюид).
 * Холст обрезан по треугольнику через CSS clip-path.
 */
export function LiquidCup({ className = "", level = 0.42 }: { className?: string; level?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const N = 64;
    const h = new Float32Array(N); // смещение поверхности
    const v = new Float32Array(N); // скорость
    let W = 0;
    let H = 0;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0, power: 0, target: 0, vx: 0 };
    let raf = 0;
    let t = 0;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const nx = e.clientX - r.left;
      mouse.vx = nx - mouse.tx;
      mouse.tx = nx;
      mouse.ty = e.clientY - r.top;
      const inside = nx > -40 && nx < r.width + 40 && mouse.ty > -60 && mouse.ty < r.height + 40;
      mouse.target = inside ? 1 : 0;
    };
    const onLeave = () => (mouse.target = 0);
    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const step = () => {
      t += reduce ? 0.004 : 0.016;
      // инерция курсора
      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;
      mouse.power += (mouse.target - mouse.power) * 0.06;

      const base = H * (1 - level);
      const dx = W / (N - 1);

      for (let i = 0; i < N; i++) {
        const x = i * dx;
        // магнит: притяжение к курсору, гауссово по расстоянию
        const dist = x - mouse.x;
        const sigma = W * 0.11;
        const g = Math.exp(-(dist * dist) / (2 * sigma * sigma));
        const yDist = Math.max(0, base - mouse.y);
        const pull = -Math.min(H * 0.32, yDist * 0.75 + 18) * g * mouse.power;
        // пружина к цели + затухание
        v[i] += (pull - h[i]) * 0.02;
        v[i] *= 0.9;
      }
      // распространение волн между соседями
      for (let k = 0; k < 2; k++) {
        for (let i = 1; i < N - 1; i++) {
          v[i] += (h[i - 1] + h[i + 1] - 2 * h[i]) * 0.08;
        }
      }
      // импульс от резкого движения мыши
      if (mouse.power > 0.2 && Math.abs(mouse.vx) > 2) {
        const idx = Math.round(Math.max(0, Math.min(N - 1, mouse.x / dx)));
        v[idx] += Math.max(-6, Math.min(6, mouse.vx)) * 0.15;
      }
      mouse.vx *= 0.8;
      for (let i = 0; i < N; i++) h[i] += v[i];

      draw(base, dx);
      raf = requestAnimationFrame(step);
    };

    const surfaceY = (i: number, base: number, dx: number) => {
      const x = i * dx;
      const idle =
        Math.sin(x * 0.018 + t * 1.6) * H * 0.012 +
        Math.sin(x * 0.041 - t * 2.3) * H * 0.006 +
        Math.sin(t * 0.9) * H * 0.008 * ((x / W) * 2 - 1); // покачивание чашки
      return base + idle + h[i];
    };

    const draw = (base: number, dx: number) => {
      ctx.clearRect(0, 0, W, H);
      const pts: [number, number][] = [];
      for (let i = 0; i < N; i++) pts.push([i * dx, surfaceY(i, base, dx)]);
      const top = Math.min(...pts.map((p) => p[1]));

      const path = new Path2D();
      path.moveTo(0, H);
      path.lineTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < N - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2;
        const my = (pts[i][1] + pts[i + 1][1]) / 2;
        path.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
      }
      path.lineTo(pts[N - 1][0], pts[N - 1][1]);
      path.lineTo(W, H);
      path.closePath();

      // тело: от карамельной пенки к глубокому эспрессо
      const body = ctx.createLinearGradient(0, top, 0, H);
      body.addColorStop(0, "hsl(32 70% 58%)");
      body.addColorStop(0.08, "hsl(26 62% 40%)");
      body.addColorStop(0.45, "hsl(20 58% 20%)");
      body.addColorStop(1, "hsl(16 50% 7%)");
      ctx.fillStyle = body;
      ctx.fill(path);

      // объёмный блик
      ctx.save();
      ctx.clip(path);
      const glow = ctx.createRadialGradient(W * 0.35, base + H * 0.08, 0, W * 0.35, base + H * 0.08, W * 0.5);
      glow.addColorStop(0, "hsla(35 90% 70% / 0.35)");
      glow.addColorStop(1, "hsla(35 90% 70% / 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
      // точка магнита — тёплое свечение
      if (mouse.power > 0.02) {
        const mg = ctx.createRadialGradient(mouse.x, base, 0, mouse.x, base, W * 0.2);
        mg.addColorStop(0, `hsla(30 95% 65% / ${0.35 * mouse.power})`);
        mg.addColorStop(1, "hsla(30 95% 65% / 0)");
        ctx.fillStyle = mg;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();

      // глянцевая линия поверхности
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < N - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2;
        const my = (pts[i][1] + pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
      }
      ctx.strokeStyle = "hsla(38 95% 82% / 0.75)";
      ctx.lineWidth = 1.6;
      ctx.shadowColor = "hsla(38 95% 70% / 0.8)";
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [level]);

  return (
    <div className={`relative ${className}`} aria-hidden>
      <canvas
        ref={ref}
        className="block size-full"
        style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)", background: "hsl(20 30% 4%)" }}
      />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full">
        <polygon points="0.5,0.5 99.5,0.5 50,99.3" fill="none" stroke="hsl(36 60% 60%)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
