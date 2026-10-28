import { useEffect, useRef } from "react";
type Kind = "tea" | "coffee";
type Vertex = "left" | "center" | "right";
const PALETTE: Record<Kind, { stops: [string, string, string, string]; caustic: string; surface: string; meniscus: string; meniscusShadow: string }> = {
tea: {
stops: ["rgba(206, 222, 128, 0.35)", "rgba(138, 178, 70, 0.60)", "rgba(42, 98, 44, 0.82)", "rgba(8, 32, 18, 0.96)"],
caustic: "rgba(210, 245, 140, 0.42)",
surface: "rgba(232, 248, 170, 0.25)",
meniscus: "rgba(240, 252, 200, 0.95)",
meniscusShadow: "rgba(180, 235, 110, 0.80)",
},
coffee: {
stops: ["rgba(225, 155, 85, 0.35)", "rgba(155, 85, 35, 0.65)", "rgba(75, 35, 12, 0.85)", "rgba(22, 9, 3, 0.96)"],
caustic: "rgba(255, 180, 95, 0.38)",
surface: "rgba(255, 205, 140, 0.22)",
meniscus: "rgba(255, 225, 175, 0.95)",
meniscusShadow: "rgba(245, 155, 75, 0.80)",
},
};
export function LiquidCup({ className = "", level = 0.45, kind = "coffee", clip = "polygon(0 0, 100% 0, 50% 100%)", vertex = "center", outline = null }: { className?: string; level?: number; kind?: Kind; clip?: string; vertex?: Vertex; outline?: string | null }) {
const ref = useRef<HTMLCanvasElement>(null);
useEffect(() => {
const canvas = ref.current;
const ctx = canvas?.getContext("2d", { alpha: true });
if (!canvas || !ctx) return;
const pal = PALETTE[kind];
const N = 64;
const h = new Float32Array(N);
const v = new Float32Array(N);
let W = 0, H = 0, raf = 0, t = 0;
const mouse = { x: -1e4, y: -1e4, px: -1e4, vx: 0, has: false };
const resize = () => {
const r = canvas.getBoundingClientRect();
const dpr = Math.min(window.devicePixelRatio || 1, 2);
W = r.width; H = r.height;
canvas.width = Math.max(1, Math.round(W * dpr));
canvas.height = Math.max(1, Math.round(H * dpr));
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
};
resize();
const ro = new ResizeObserver(resize);
ro.observe(canvas);
const onMove = (e: PointerEvent) => {
const r = canvas.getBoundingClientRect();
mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
if (!mouse.has) { mouse.px = mouse.x; mouse.has = true; }
};
window.addEventListener("pointermove", onMove, { passive: true });
const onLeave = () => { mouse.has = false; mouse.vx = 0; };
document.addEventListener("pointerleave", onLeave);
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const trace = (offset: number) => {
const dx = W / (N - 1);
const base = H * (1 - level) + offset;
ctx.moveTo(0, base + h[0]!);
for (let i = 0; i < N - 1; i++) {
const x0 = i * dx; const y0 = base + h[i]!;
const x1 = (i + 1) * dx; const y1 = base + h[i + 1]!;
ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
}
ctx.lineTo(W, base + h[N - 1]!);
};
const body = () => {
ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, H * (1 - level) + h[0]!);
trace(0); ctx.lineTo(W, H); ctx.closePath();
};
const step = () => {
t += reduce ? 0.003 : 0.014;
const base = H * (1 - level), dx = W / (N - 1), scale = Math.min(Math.max(H / 120, 0.5), 1.5);
if (mouse.has) {
const rawDelta = mouse.x - mouse.px; mouse.px = mouse.x; mouse.vx += (rawDelta - mouse.vx) * 0.25;
} else { mouse.vx *= 0.88; }
const vx = Math.max(-28, Math.min(28, mouse.vx));
const band = Math.max(H * 0.4, 40), dy = mouse.y - base;
const near = mouse.has && mouse.x > -30 && mouse.x < W + 30 ? Math.exp(-(dy * dy) / (2 * band * band)) : 0;
const sigma = Math.max(W * 0.15, 20);
for (let i = 0; i < N; i++) {
const d = i * dx - mouse.x; const g = Math.exp(-(d * d) / (2 * sigma * sigma));
if (!reduce && near > 0.01) {
v[i] = v[i]! - vx * (d / sigma) * g * near * 0.04 + Math.abs(vx) * g * near * 0.008;
}
const ripple = reduce ? 0 : (Math.sin(t * 2.4 + i * 0.16) * 0.6 + Math.cos(t * 1.1 - i * 0.24) * 0.4 + Math.sin(t * 4.2 + i * 0.6) * 0.15) * scale;
v[i] = v[i]! + (-0.03 * (h[i]! - ripple) - 0.018 * v[i]!); h[i] = h[i]! + v[i]!;
}
for (let pass = 0; pass < 2; pass++) {
for (let i = 1; i < N - 1; i++) {
const s = 0.18 * (h[i - 1]! + h[i + 1]! - 2 * h[i]!); v[i] = v[i]! + s; h[i] = h[i]! + s;
}
}
const lim = H * 0.25;
for (let i = 0; i < N; i++) h[i] = Math.max(-lim, Math.min(lim, h[i]!));
ctx.clearRect(0, 0, W, H);
body();
const grad = ctx.createLinearGradient(0, base - 10, 0, H);
grad.addColorStop(0, pal.stops[0]); grad.addColorStop(0.18, pal.stops[1]);
grad.addColorStop(0.55, pal.stops[2]); grad.addColorStop(1, pal.stops[3]);
ctx.fillStyle = grad; ctx.fill();
ctx.save(); body(); ctx.clip(); ctx.globalCompositeOperation = "lighter";
const cx = vertex === "left" ? 0 : vertex === "right" ? W : W / 2;
const pulse = 1 + Math.sin(t * 1.5) * 0.05;
const caustic = ctx.createRadialGradient(cx, H, 2, cx, H, H * 0.75 * pulse);
caustic.addColorStop(0, pal.caustic); caustic.addColorStop(0.5, pal.caustic.replace(/[\d.]+\)$/, "0.12)")); caustic.addColorStop(1, "rgba(0, 0, 0, 0)");
ctx.fillStyle = caustic; ctx.fillRect(0, 0, W, H);
const sub = ctx.createLinearGradient(0, base - 2, 0, base + 18);
sub.addColorStop(0, pal.surface); sub.addColorStop(1, "rgba(0, 0, 0, 0)");
ctx.fillStyle = sub; ctx.fillRect(0, base - 20, W, 50); ctx.restore();
ctx.save(); ctx.beginPath(); trace(0); ctx.strokeStyle = pal.meniscus; ctx.lineWidth = 1.0; ctx.shadowBlur = 6; ctx.shadowColor = pal.meniscusShadow; ctx.stroke(); ctx.restore();
ctx.beginPath(); trace(1.8); ctx.strokeStyle = "rgba(255, 255, 255, 0.28)"; ctx.lineWidth = 0.65; ctx.stroke();
raf = requestAnimationFrame(step);
};
raf = requestAnimationFrame(step);
return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener("pointermove", onMove); document.removeEventListener("pointerleave", onLeave); };
}, [kind, level, vertex]);
return (
<div className={`relative ${className}`}>
<canvas ref={ref} className="block size-full" style={{ clipPath: clip }} />
{outline && (
<svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full">
<polygon points={outline} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
</svg>
)}
</div>
);
}
