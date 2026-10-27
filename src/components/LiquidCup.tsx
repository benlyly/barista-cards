import { useEffect, useRef } from "react";

type Kind = "tea" | "coffee";

// Обновленная премиальная палитра с поддержкой прозрачности и каустических бликов
const PALETTE: Record<Kind, { 
  stops: string[]; 
  glow: string; 
  line: string; 
  surfaceGlow: string;
  bg: string;
}> = {
  coffee: {
    // Градиент от прозрачно-янтарной карамели на поверхности к плотному эспрессо на дне
    stops: [
      "hsla(28, 85%, 55%, 0.35)",  // Поверхность (тонкий прозрачный слой)
      "hsla(24, 75%, 38%, 0.70)",  // Середина (насыщенный карамельный)
      "hsla(18, 70%, 18%, 0.92)",  // Глубина (плотный кофе)
      "hsla(14, 80%, 6%, 0.98)"    // Дно (почти черный)
    ],
    glow: "hsla(32, 90%, 60%, 0.18)",         // Внутренний объемный блик света
    line: "hsla(34, 95%, 80%, 0.85)",         // Контур поверхностного натяжения (блик)
    surfaceGlow: "hsla(28, 90%, 65%, 0.25)",  // Мягкое свечение под мениском
    bg: "transparent",                        // Убираем глухой фон, чтобы ромб дышал
  },
  tea: {
    // Градиент от прозрачно-золотистого улуна к благородному глубокому нефриту
    stops: [
      "hsla(74, 80%, 60%, 0.30)",  // Поверхность
      "hsla(90, 65%, 42%, 0.65)",  // Середина
      "hsla(135, 60%, 20%, 0.88)", // Глубина
      "hsla(155, 70%, 6%, 0.96)"   // Дно
    ],
    glow: "hsla(82, 85%, 65%, 0.15)",
    line: "hsla(74, 95%, 85%, 0.85)",
    surfaceGlow: "hsla(82, 90%, 65%, 0.22)",
    bg: "transparent",
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
  clip?: string;
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
    const h = new Float32Array(N);
    const v = new Float32Array(N);
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
      t += reduce ? 0.003 : 0.012; // Сделали шаг времени чуть мягче для легкости воды
      mouse.x += (mouse.tx - mouse.x) * 0.10;
      mouse.y += (mouse.ty - mouse.y) * 0.10;
      mouse.power += (mouse.target - mouse.power) * 0.05;

      const base = H * (1 - level);
      const dx = W / (N - 1);

      for (let i = 0; i < N; i++) {
        const px = i * dx;
        const dist = Math.abs(px - mouse.x);
        
        // Ослабили силу притяжения курсора (с 0.45 до 0.18), чтобы жидкость не казалась "желеобразной"
        const pull = Math.exp(-(dist * dist) / (2 * 54 * 54)) * (mouse.y - base) * 0.18 * mouse.power;
        
        // Более сложные, накладывающиеся мелкие брызги и волны (эффект легкой водной глади)
        const wave = Math.sin(t * 2.6 + i * 0.18) * (reduce ? 0 : 2.5) + 
                     Math.cos(t * 1.5 - i * 0.28) * (reduce ? 0 : 1.5) +
                     Math.sin(t * 4.0 + i * 0.4) * (reduce ? 0 : 0.4); // мелкая рябь
                     
        const targetH = pull + wave;
        // Изменили жесткость пружин (0.045 -> 0.035), сделав колебания более длительными и текучими
        const force = -0.035 * (h[i] - targetH) - 0.03 * v[i];
        v[i] += force;
        h[i] += v[i];
      }

      // Сглаживание натяжения воды между соседями
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 1; i < N - 1; i++) {
          const spread = 0.24 * (h[i - 1] + h[i + 1] - 2 * h[i]);
          v[i] += spread;
          h[i] += spread;
        }
      }

      ctx.clearRect(0, 0, W, H);

      // ГЕНЕРАЦИЯ ПУТИ ВОДНОЙ МАССЫ
      const generateLiquidPath = () => {
        ctx.beginPath();
        ctx.moveTo(0, H);
        ctx.lineTo(0, base + h[0]);
        for (let i = 0; i < N - 1; i++) {
          const x0 = i * dx;
          const y0 = base + h[i];
          const x1 = (i + 1) * dx;
          const y1 = base + h[i + 1];
          const mx = (x0 + x1) / 2;
          const my = (y0 + y1) / 2;
          ctx.quadraticCurveTo(x0, y0, mx, my);
        }
        ctx.lineTo(W, base + h[N - 1]);
        ctx.lineTo(W, H);
        ctx.closePath();
      };

      // 1. ОТРИСОВКА ВНУТРЕННЕГО ОБЪЕМНОГО БЛИКА (Каустика отражения света через стекло)
      if (mouse.power > 0.01) {
        ctx.save();
        generateLiquidPath();
        ctx.clip();
        const radialGlow = ctx.createRadialGradient(mouse.x, mouse.y, 5, mouse.x, mouse.y, 90);
        radialGlow.addColorStop(0, pal.glow);
        radialGlow.addColorStop(1, "transparent");
        ctx.fillStyle = radialGlow;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      // 2. ОТРИСОВКА ОСНОВНОГО СТЕКЛЯННОГО ГРАДИЕНТА ЖИДКОСТИ
      generateLiquidPath();
      const grad = ctx.createLinearGradient(0, base - 10, 0, H);
      grad.addColorStop(0, pal.stops[0]);
      grad.addColorStop(0.15, pal.stops[1]);
      grad.addColorStop(0.55, pal.stops[2]);
      grad.addColorStop(1, pal.stops[3]);
      ctx.fillStyle = grad;
      ctx.fill();

      // 3. МЯГКОЕ СВЕЧЕНИЕ ПОД ПОВЕРХНОСТЬЮ ВОДЫ
      ctx.save();
      generateLiquidPath();
      ctx.clip();
      const surfaceBlur = ctx.createLinearGradient(0, base - 5, 0, base + 25);
      surfaceBlur.addColorStop(0, pal.surfaceGlow);
      surfaceBlur.addColorStop(1, "transparent");
      ctx.fillStyle = surfaceBlur;
      ctx.fillRect(0, base - 10, W, 40);
      ctx.restore();

      // 4. ТОНКАЯ ЛИНЕЙНАЯ КАРТИНА ПОВЕРХНОСТНОГО НАТЯЖЕНИЯ (Мениск)
      ctx.beginPath();
      ctx.moveTo(0, base + h[0]);
      for (let i = 0; i < N - 1; i++) {
        const x0 = i * dx;
        const y0 = base + h[i];
        const x1 = (i + 1) * dx;
        const y1 = base + h[i + 1];
        const mx = (x0 + x1) / 2;
        const my = (y0 + y1) / 2;
        ctx.quadraticCurveTo(x0, y0, mx, my);
      }
      ctx.lineTo(W, base + h[N - 1]);
      
      // Рисуем премиальный тонкий стеклянный блик на кромке воды
      ctx.strokeStyle = pal.line;
      ctx.lineWidth = 1.2; // Тоньше и благороднее
      ctx.shadowColor = pal.line;
      ctx.shadowBlur = 4;  // Легкий неоновый микро-блик света
      ctx.stroke();
      
      // Сброс тени, чтобы не нагружать GPU
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [kind, level, pal]);

  return (
    <div className={`relative ${className}`}>
      {/* Добавили элегантный бэкграунд-градиент за канвасом для глубины "стеклянного бокала" */}
      <div 
        className="absolute inset-0 transition-opacity duration-700 pointer-events-none"
        style={{ 
          clipPath: clip,
          background: kind === "coffee" 
            ? "radial-gradient(circle at 50% 100%, hsla(24, 60%, 10%, 0.4) 0%, transparent 80%)"
            : "radial-gradient(circle at 50% 100%, hsla(95, 50%, 8%, 0.4) 0%, transparent 80%)",
        }}
      />
      
      <canvas ref={ref} className="block size-full relative z-10" style={{ clipPath: clip }} />
      
      {outline && (
        <svg className="pointer-events-none absolute inset-0 size-full z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Сделали контур рамки более утонченным (0.8 -> 0.5) */}
          <polygon points={outline} fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white/15" />
        </svg>
      )}
    </div>
  );
}
