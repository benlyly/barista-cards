import { useEffect, useRef } from "react";

/**
 * Живая кофейная жидкость в треугольной «чашке».
 * Поверхность — цепочка пружин (spring + damping); курсор работает как магнит (феррофлюид).
 * Холст обрезан по треугольнику через CSS clip-path.
 */
type Kind = "tea" | "coffee";

const PALETTE: Record<Kind, { stops: string[]; glow: string; magnet: string; line: string; shadow: string; bg: string }> = {
  coffee: {
    stops: ["hsl(32 70% 58%)", "hsl(26 62% 40%)", "hsl(20 58% 20%)", "hsl(16 50% 7%)"],
    glow: "35 90% 70%",
    magnet: "30 95% 65%",
    line: pal.line,
    shadow: pal.shadow,
    bg: "hsl(20 30% 4%)",
  },
  tea: {
    stops: ["hsl(78 70% 62%)", "hsl(95 55% 42%)", "hsl(130 50% 22%)", "hsl(150 45% 7%)"],
    glow: "75 90% 70%",
    magnet: "80 95% 65%",
    line: "hsla(70 95% 85% / 0.75)",
    shadow: "hsla(75 95% 70% / 0.8)",
    bg: "hsl(150 25% 4%)",
  },
};

export function LiquidCup({
  className = "",
  level = 0.42,
  kind = "coffee",
  clip = "polygon(0 0, 100% 0, 50% 100%)",
  outline = "0.5,0.5 99.5,0.5 50,99.3",
}: {
  className?: string;
  level?: number;
  kind?: Kind;
  /** CSS clip-path polygon for the canvas */
  clip?: string;
  /** Outline points in a 0..100 box; empty string hides it */
  outline?: string;
}) {
  const pal = PALETTE[kind];
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
        v[i] = v[i]! + (pull - h[i]!) * 0.02;
        v[i] = v[i]! * 0.9;
      }
      // распространение волн между соседями
      for (let k = 0; k < 2; k++) {
        for (let i = 1; i < N - 1; i++) {
          v[i] = v[i]! + (h[i - 1]! + h[i + 1]! - 2 * h[i]!) * 0.08;
        }
      }
      // импульс от резкого движения мыши
      if (mouse.power > 0.2 && Math.abs(mouse.vx) > 2) {
        const idx = Math.round(Math.max(0, Math.min(N - 1, mouse.x / dx)));
        v[idx] = v[idx]! + Math.max(-6, Math.min(6, mouse.vx)) * 0.15;
      }
      mouse.vx *= 0.8;
      for (let i = 0; i < N; i++) h[i] = h[i]! + v[i]!;

      draw(base, dx);
      raf = requestAnimationFrame(step);
    };

    const surfaceY = (i: number, base: number, dx: number) => {
      const x = i * dx;
      const idle =
        Math.sin(x * 0.018 + t * 1.6) * H * 0.012 +
        Math.sin(x * 0.041 - t * 2.3) * H * 0.006 +
        Math.sin(t * 0.9) * H * 0.008 * ((x / W) * 2 - 1); // покачивание чашки
      return base + idle + h[i]!;
    };

    const draw = (base: number, dx: number) => {
      ctx.clearRect(0, 0, W, H);
      const pts: [number, number][] = [];
      const P = (i: number) => pts[i]!;
      for (let i = 0; i < N; i++) pts.push([i * dx, surfaceY(i, base, dx)]);
      const top = Math.min(...pts.map((p) => p[1]));

      const path = new Path2D();
      path.moveTo(0, H);
      path.lineTo(P(0)[0], P(0)[1]);
      for (let i = 1; i < N - 1; i++) {
        const mx = (P(i)[0] + P(i + 1)[0]) / 2;
        const my = (P(i)[1] + P(i + 1)[1]) / 2;
        path.quadraticCurveTo(P(i)[0], P(i)[1], mx, my);
      }
      path.lineTo(P(N - 1)[0], P(N - 1)[1]);
      path.lineTo(W, H);
      path.closePath();

      // тело: от карамельной пенки к глубокому эспрессо
      const body = ctx.createLinearGradient(0, top, 0, H);
      body.addColorStop(0, pal.stops[0]!);
      body.addColorStop(0.08, pal.stops[1]!);
      body.addColorStop(0.45, pal.stops[2]!);
      body.addColorStop(1, pal.stops[3]!);
      ctx.fillStyle = body;
      ctx.fill(path);

      // объёмный блик
      ctx.save();
      ctx.clip(path);
      const glow = ctx.createRadialGradient(W * 0.35, base + H * 0.08, 0, W * 0.35, base + H * 0.08, W * 0.5);
      glow.addColorStop(0, `hsla(${pal.glow} / 0.35)`);
      glow.addColorStop(1, `hsla(${pal.glow} / 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
      // точка магнита — тёплое свечение
      if (mouse.power > 0.02) {
        const mg = ctx.createRadialGradient(mouse.x, base, 0, mouse.x, base, W * 0.2);
        mg.addColorStop(0, `hsla(${pal.magnet} / ${0.35 * mouse.power})`);
        mg.addColorStop(1, `hsla(${pal.magnet} / 0)`);
        ctx.fillStyle = mg;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();

      // глянцевая линия поверхности
      ctx.beginPath();
      ctx.moveTo(P(0)[0], P(0)[1]);
      for (let i = 1; i < N - 1; i++) {
        const mx = (P(i)[0] + P(i + 1)[0]) / 2;
        const my = (P(i)[1] + P(i + 1)[1]) / 2;
        ctx.quadraticCurveTo(P(i)[0], P(i)[1], mx, my);
      }
      ctx.strokeStyle = pal.line;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = pal.shadow;
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
  }, [level, pal]);

  return (
    <div className={`relative ${className}`} aria-hidden>
      <canvas
        ref={ref}
        className="block size-full"
        style={{ clipPath: clip, background: pal.bg }}
      />
      {outline && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full">
          <polygon points={outline} fill="none" stroke="hsl(40 60% 65%)" strokeWidth="1.2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
    </div>
  );
}
