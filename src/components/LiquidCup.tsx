import { useEffect, useRef } from "react";

type Kind = "tea" | "coffee";
type Vertex = "left" | "center" | "right";

/**
 * Glass-infusion palette: light-transmitting liquid, thin at the surface
 * (alpha 0.4) and dense at the very bottom (alpha 0.95).
 */
const PALETTE: Record<
  Kind,
  {
    stops: [string, string, string, string];
    caustic: string;
    surface: string;
    meniscus: string;
    meniscusShadow: string;
  }
> = {
  tea: {
    stops: [
      "rgba(206, 222, 128, 0.40)",
      "rgba(138, 178, 70, 0.62)",
      "rgba(52, 110, 54, 0.84)",
      "rgba(10, 38, 22, 0.95)",
    ],
    caustic: "rgba(220, 246, 150, 0.38)",
    surface: "rgba(232, 248, 170, 0.22)",
    meniscus: "rgba(240, 252, 200, 0.92)",
    meniscusShadow: "rgba(196, 240, 130, 0.85)",
  },
  coffee: {
    stops: [
      "rgba(222, 160, 92, 0.40)",
      "rgba(160, 92, 40, 0.66)",
      "rgba(86, 42, 16, 0.86)",
      "rgba(26, 11, 4, 0.95)",
    ],
    caustic: "rgba(255, 184, 106, 0.34)",
    surface: "rgba(255, 210, 150, 0.2)",
    meniscus: "rgba(255, 226, 182, 0.92)",
    meniscusShadow: "rgba(255, 168, 86, 0.85)",
  },
};

export function LiquidCup({
  className = "",
  level = 0.45,
  kind = "coffee",
  clip = "polygon(0 0, 100% 0, 50% 100%)",
  vertex = "center",
  outline = null,
}: {
  className?: string;
  level?: number;
  kind?: Kind;
  clip?: string;
  /** Where the lowest point of the vessel sits — the caustic glow lives there. */
  vertex?: Vertex;
  outline?: string | null;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const pal = PALETTE[kind];

    const N = 72;
    const h = new Array<number>(N).fill(0);
    const v = new Array<number>(N).fill(0);
    let W = 0;
    let H = 0;
    let raf = 0;
    let t = 0;
    const mouse = { x: -1e4, y: -1e4, px: -1e4, vx: 0, has: false };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      if (!mouse.has) {
        mouse.px = mouse.x;
        mouse.has = true;
      }
    };
    const onLeave = () => {
      mouse.has = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const trace = (offset: number) => {
      const dx = W / (N - 1);
      const base = H * (1 - level) + offset;
      ctx.moveTo(0, base + h[0]!);
      for (let i = 0; i < N - 1; i++) {
        const x0 = i * dx;
        const y0 = base + h[i]!;
        const x1 = (i + 1) * dx;
        const y1 = base + h[i + 1]!;
        ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      }
      ctx.lineTo(W, base + h[N - 1]!);
    };
    const body = () => {
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(0, H * (1 - level) + h[0]!);
      trace(0);
      ctx.lineTo(W, H);
      ctx.closePath();
    };

    const step = () => {
      t += reduce ? 0.004 : 0.016;
      const base = H * (1 - level);
      const dx = W / (N - 1);
      const scale = Math.min(Math.max(H / 110, 0.6), 1.6);

      // Mouse velocity vector: liquid answers to the sweep, not to the cursor position.
      if (mouse.has) {
        const raw = mouse.x - mouse.px;
        mouse.px = mouse.x;
        mouse.vx += (raw - mouse.vx) * 0.35;
      } else {
        mouse.vx *= 0.85;
      }
      const vx = Math.max(-36, Math.min(36, mouse.vx));
      const band = Math.max(H * 0.45, 30);
      const dy = mouse.y - base;
      const near =
        mouse.has && mouse.x > -40 && mouse.x < W + 40 ? Math.exp(-(dy * dy) / (2 * band * band)) : 0;
      const sigma = Math.max(W * 0.12, 16);

      for (let i = 0; i < N; i++) {
        const d = i * dx - mouse.x;
        const g = Math.exp(-(d * d) / (2 * sigma * sigma));
        if (!reduce && near > 0.01) {
          // bow wave ahead of the sweep, trough behind it, slight dip under the path
          v[i] = v[i]! - vx * (d / sigma) * g * near * 0.05 + Math.abs(vx) * g * near * 0.012;
        }
        // calm breathing micro-ripple
        const ripple = reduce
          ? 0
          : (Math.sin(t * 3.1 + i * 0.55) * 0.55 +
              Math.cos(t * 2.3 - i * 0.37) * 0.45 +
              Math.sin(t * 5.4 + i * 0.92) * 0.22) *
            scale;
        v[i] = v[i]! + (-0.028 * (h[i]! - ripple) - 0.016 * v[i]!);
        h[i] = h[i]! + v[i]!;
      }
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 1; i < N - 1; i++) {
          const s = 0.2 * (h[i - 1]! + h[i + 1]! - 2 * h[i]!);
          v[i] = v[i]! + s;
          h[i] = h[i]! + s;
        }
      }
      const lim = H * 0.28;
      for (let i = 0; i < N; i++) h[i] = Math.max(-lim, Math.min(lim, h[i]!));

      ctx.clearRect(0, 0, W, H);

      // 1. light-transmitting body
      body();
      const grad = ctx.createLinearGradient(0, base - 6, 0, H);
      grad.addColorStop(0, pal.stops[0]);
      grad.addColorStop(0.22, pal.stops[1]);
      grad.addColorStop(0.6, pal.stops[2]);
      grad.addColorStop(1, pal.stops[3]);
      ctx.fillStyle = grad;
      ctx.fill();

      // 2. caustic glow at the lowest vertex + subsurface band under the meniscus
      ctx.save();
      body();
      ctx.clip();
      ctx.globalCompositeOperation = "lighter";
      const cx = vertex === "left" ? 0 : vertex === "right" ? W : W / 2;
      const pulse = 1 + Math.sin(t * 1.3) * 0.06;
      const caustic = ctx.createRadialGradient(cx, H, 0, cx, H, H * (1 - level) * 0 + H * 0.62 * pulse);
      caustic.addColorStop(0, pal.caustic);
      caustic.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = caustic;
      ctx.fillRect(0, 0, W, H);
      const sub = ctx.createLinearGradient(0, base - 4, 0, base + 22);
      sub.addColorStop(0, pal.surface);
      sub.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = sub;
      ctx.fillRect(0, base - 30, W, 60);
      ctx.restore();

      // 3. razor-thin meniscus with depth
      ctx.save();
      ctx.beginPath();
      trace(0);
      ctx.strokeStyle = pal.meniscus;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 8;
      ctx.shadowColor = pal.meniscusShadow;
      ctx.stroke();
      ctx.restore();

      // 4. glass reflection, 2px below the water line
      ctx.beginPath();
      trace(2);
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 0.75;
      ctx.stroke();

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [kind, level, vertex]);

  return (
    <div className={`relative ${className}`}>
      <canvas ref={ref} className="block size-full" style={{ clipPath: clip }} />
      {outline && (
        <svg
          className="pointer-events-none absolute inset-0 size-full text-foreground/15"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polygon
            points={outline}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
    </div>
  );
}
