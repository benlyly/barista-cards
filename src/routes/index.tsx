<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>master.club — Кинетический Ромб</title>
  <!-- Tailwind CSS для люксового темного UI -->
  <script src="https://tailwindcss.com"></script>
  <!-- Motion (Framer Motion) для чистой физики пружин -->
  <script src="https://unpkg.com"></script>
  <style>
    @import url('https://googleapis.com');
    body {
      font-family: 'Montserrat', sans-serif;
      background-color: #070708;
    }
    /* Точные маски обрезки половин горизонтального ромба */
    .clip-tea { clip-path: polygon(100% 0, 100% 100%, 0 50%); }
    .clip-coffee { clip-path: polygon(0 0, 100% 50%, 0 100%); }
  </style>
</head>
<body class="h-[100svh] w-full text-white overflow-hidden select-none touch-none relative flex flex-col items-center justify-between py-[8%]">

  <!-- ЛЮКС-ФОН: Абстрактный световой эмбиент и аналоговое пленочное зерно -->
  <div class="absolute inset-0 pointer-events-none z-0">
    <!-- Чайное нефритовое свечение слева -->
    <div class="absolute top-1/2 left-[-15%] size-[60vw] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(90,130,40,0.06)_0%,transparent,70%)] blur-[90px]"></div>
    <!-- Кофейное карамельное свечение справа -->
    <div class="absolute top-1/2 right-[-15%] size-[60vw] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(140,80,30,0.06)_0%,transparent,70%)] blur-[90px]"></div>
    <!-- Слой процедурного шума (матовая бумага Touche Cover) -->
    <div class="absolute inset-0 opacity-[0.025] mix-blend-overlay" style="background-image: url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://w3.org id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E&quot;);"></div>
    <!-- Глубокая виньетка -->
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.85)_100%)]"></div>
  </div>

  <!-- ШАПКА -->
  <header class="z-10 flex flex-col items-center text-center opacity-80 pointer-events-none">
    <h1 class="text-2xl font-light tracking-[0.5em] uppercase sm:text-4xl text-zinc-100 pl-[0.5em]">Мастер</h1>
    <div class="mt-2.5 flex items-center gap-3">
      <span class="h-[0.5px] w-6 bg-zinc-800 sm:w-12"></span>
      <span class="text-[0.55rem] tracking-[0.35em] text-zinc-400 uppercase sm:text-[0.65rem]">клуб бариста и чайных мастеров</span>
      <span className="h-[0.5px] w-6 bg-zinc-800 sm:w-12"></span>
    </div>
  </header>

  <!-- ЦЕНТРАЛЬНЫЙ АНТИСТРЕСС-УЗЕЛ: Магнитный Ромб -->
  <div id="drag-zone" class="relative z-10 flex aspect-square w-[clamp(160px,22vw,240px)] items-center justify-center cursor-grab active:cursor-grabbing">
    
    <!-- Тонкая вертикальная струна-разделитель -->
    <div id="center-string" class="absolute inset-y-[-100%] w-[1px] bg-gradient-to-b from-white/0 via-white/20 to-white/0 pointer-events-none"></div>

    <!-- ЛЕВАЯ КАРТА-МАГНИТ (ЧАЙ) -->
    <div id="card-tea" class="absolute inset-y-0 left-0 w-1/2" style="transform-origin: 100% 50%;">
      <div class="size-full relative clip-tea bg-zinc-900/10 backdrop-blur-[1px]">
        <canvas id="canvas-tea" class="absolute inset-0 size-full"></canvas>
        <!-- Тонкий векторный контур грани -->
        <svg class="absolute inset-0 size-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="100,0 100,100 0,50" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.5" vector-effect="non-scaling-stroke"/>
        </svg>
      </div>
    </div>

    <!-- ПРАВАЯ КАРТА-МАГНИТ (КОФЕ) -->
    <div id="card-coffee" class="absolute inset-y-0 right-0 w-1/2" style="transform-origin: 0% 50%;">
      <div class="size-full relative clip-coffee bg-zinc-900/10 backdrop-blur-[1px]">
        <canvas id="canvas-coffee" class="absolute inset-0 size-full"></canvas>
        <svg class="absolute inset-0 size-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="0,0 100,50 0,100" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.5" vector-effect="non-scaling-stroke"/>
        </svg>
      </div>
    </div>

  </div>

  <!-- ФУТЕР -->
  <footer class="z-10 flex flex-col items-center text-center opacity-80 pointer-events-none">
    <p class="font-sans text-[0.75rem] font-light tracking-[0.12em] text-zinc-500 italic sm:text-[0.85rem]">"...find the one whose love you drink..."</p>
  </footer>

  <!-- СКРИПТ: Физика жидкостей, Магнитный отрыв и Импульс столкновения -->
  <script>
    const { animate, useMotionValue, useTransform } = Motion;

    // Глобальный управляющий сдвиг (координата натяжения магнита)
    const pullX = useMotionValue(0);

    // Связываем физику отрыва половин: левая летит влево быстрее, правая отстает
    const cardTea = document.getElementById("card-tea");
    const cardCoffee = document.getElementById("card-coffee");
    const centerString = document.getElementById("center-string");

    pullX.on("change", (v) => {
      // Магнитное разделение траекторий с инерционным микро-поворотом (tilt)
      const tX = v < 0 ? v * 1.3 - 15 : v * 0.35;
      const cX = v > 0 ? v * 1.3 + 15 : v * 0.35;
      const tRot = (v / 150) * -6;
      const cRot = (v / 150) * -6;

      cardTea.style.transform = `translateX(${tX}px) rotate(${v < 0 ? tRot : tRot * 0.3}deg)`;
      cardTea.style.opacity = Math.max(0.3, 1 - Math.abs(v) / 350);
      
      cardCoffee.style.transform = `translateX(${cX}px) rotate(${v > 0 ? cRot : cRot * 0.3}deg)`;
      cardCoffee.style.opacity = Math.max(0.3, 1 - Math.abs(v) / 350);

      centerString.style.transform = `translateX(${v * 0.5}px)`;
      centerString.style.opacity = Math.max(0, 1 - Math.abs(v) / 80);
    });

    // --- НАСТРОЙКА ХОЛСТОВ ЖИДКОСТИ ---
    const config = {
      tea: { stops: ["rgba(206,222,128,0.35)", "rgba(138,178,70,0.6)", "rgba(42,98,44,0.82)", "rgba(8,32,18,0.96)"], caustic: "rgba(210,245,140,0.45)", meniscus: "rgba(240,252,200,0.95)", shadow: "rgba(180,235,110,0.8)", vertex: "left" },
      coffee: { stops: ["rgba(225,155,85,0.35)", "rgba(155,85,35,0.65)", "rgba(75,35,12,0.85)", "rgba(22,9,3,0.96)"], caustic: "rgba(255,180,95,0.42)", meniscus: "rgba(255,225,175,0.95)", shadow: "rgba(245,155,75,0.8)", vertex: "right" }
    };

    class LiquidCupSimulation {
      constructor(canvasId, type) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d", { alpha: true });
        this.type = type;
        this.pal = config[type];
        this.N = 54;
        this.h = new Float32Array(this.N);
        this.v = new Float32Array(this.N);
        this.level = 0.46;
        this.t = 0;
        this.mouse = { x: -1000, y: -1000, px: -1000, vx: 0, has: false };

        this.init();
      }

      init() {
        const resize = () => {
          const r = this.canvas.getBoundingClientRect();
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          this.W = r.width; this.H = r.height;
          this.canvas.width = this.W * dpr; this.canvas.height = this.H * dpr;
          this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener("resize", resize);

        this.canvas.addEventListener("pointermove", (e) => {
          const r = this.canvas.getBoundingClientRect();
          this.mouse.x = e.clientX - r.left; this.mouse.y = e.clientY - r.top;
          if (!this.mouse.has) { this.mouse.px = this.mouse.x; this.mouse.has = true; }
        });
        this.canvas.addEventListener("pointerleave", () => { this.mouse.has = false; this.mouse.vx = 0; });
      }

      // Функция вызова мощной волны при физическом ударе/соударении плит ромба
      triggerImpact(force) {
        const intensity = Math.max(-25, Math.min(28, force * 0.35));
        if (this.pal.vertex === "left") {
          this.v[0] -= intensity * 1.8;
          this.v[1] -= intensity * 1.2;
        } else {
          this.v[this.N - 1] += intensity * 1.8;
          this.v[this.N - 2] += intensity * 1.2;
        }
      }

      update() {
        this.t += 0.015;
        const base = this.H * (1 - this.level);
        const dx = this.W / (this.N - 1);

        if (this.mouse.has) {
          const delta = this.mouse.x - this.mouse.px;
          this.mouse.px = this.mouse.x;
          this.mouse.vx += (delta - this.mouse.vx) * 0.22;
        } else { this.mouse.vx *= 0.85; }

        const vx = Math.max(-24, Math.min(28, this.mouse.vx));
        const near = this.mouse.has && Math.abs(this.mouse.y - base) < this.H * 0.4 ? 1 : 0;
        const sigma = this.W * 0.16;

        for (let i = 0; i < this.N; i++) {
          const px = i * dx;
          const dist = px - this.mouse.x;
          const g = Math.exp(-(dist * dist) / (2 * sigma * sigma));

          if (near > 0) {
            // Кинетический отклик на вектор скорости пролета мыши
            this.v[i] -= vx * (dist / sigma) * g * near * 0.035;
          }

          // Тонкое фоновое дыхание легкого чая/кофе
          const ripple = (Math.sin(this.t * 2.2 + i * 0.15) * 0.5 + Math.cos(this.t * 0.9 - i * 0.25) * 0.3);
          this.v[i] += -0.032 * (this.h[i] - ripple) - 0.016 * this.v[i];
          this.h[i] += this.v[i];
        }

        // Поверхностное натяжение (волновой перенос между соседями)
        for (let pass = 0; pass < 2; pass++) {
          for (let i = 1; i < this.N - 1; i++) {
            const spread = 0.18 * (this.h[i - 1] + this.h[i + 1] - 2 * this.h[i]);
            this.v[i] += spread; this.h[i] += spread;
          }
        }

        const lim = this.H * 0.3;
for (let i = 0; i < this.N; i++) this.h[i] = Math.max(-lim, Math.min(lim, this.h[i]));
}
render() {
this.ctx.clearRect(0, 0, this.W, this.H);
const base = this.H * (1 - this.level);
const dx = this.W / (this.N - 1);
const trace = () => {
this.ctx.moveTo(0, base + this.h[0]);
for (let i = 0; i < this.N - 1; i++) {
const x0 = i * dx; const y0 = base + this.h[i];
const x1 = (i + 1) * dx; const y1 = base + this.h[i + 1];
this.ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
}
this.ctx.lineTo(this.W, base + this.h[this.N - 1]);
};
// 1. Прозрачное градиентное тело
this.ctx.beginPath(); this.ctx.moveTo(0, this.H); this.ctx.lineTo(0, base + this.h[0]);
trace(); this.ctx.lineTo(this.W, this.H); this.ctx.closePath();
const bodyGrad = this.ctx.createLinearGradient(0, base - 10, 0, this.H);
bodyGrad.addColorStop(0, this.pal.stops[0]); bodyGrad.addColorStop(0.2, this.pal.stops[1]);
bodyGrad.addColorStop(0.6, this.pal.stops[2]); bodyGrad.addColorStop(1, this.pal.stops[3]);
this.ctx.fillStyle = bodyGrad; this.ctx.fill();
// 2. Рассеянная каустика в активном углу ромба
this.ctx.save();
this.ctx.beginPath(); this.ctx.moveTo(0, this.H); this.ctx.lineTo(0, base + this.h[0]);
trace(); this.ctx.lineTo(this.W, this.H); this.ctx.closePath(); this.ctx.clip();
this.ctx.globalCompositeOperation = "lighter";
const cx = this.pal.vertex === "left" ? 0 : this.W;
const caustic = this.ctx.createRadialGradient(cx, this.H, 2, cx, this.H, this.H * 0.75);
caustic.addColorStop(0, this.pal.caustic); caustic.addColorStop(0.5, this.pal.caustic + "22");
caustic.addColorStop(1, "rgba(0,0,0,0)");
this.ctx.fillStyle = caustic; this.ctx.fillRect(0, 0, this.W, this.H);
this.ctx.restore();
// 3. Линия поверхностного мениска со свечением
this.ctx.save(); this.ctx.beginPath(); trace();
this.ctx.strokeStyle = this.pal.meniscus; this.ctx.lineWidth = 1.0;
this.ctx.shadowBlur = 6; this.ctx.shadowColor = this.pal.shadow;
this.ctx.stroke(); this.ctx.restore();
// 4. Тонкий стеклянный отблеск под водой
this.ctx.beginPath();
const offsetBase = base + 1.8;
this.ctx.moveTo(0, offsetBase + this.h[0]);
for (let i = 0; i < this.N - 1; i++) {
const x0 = i * dx; const y0 = offsetBase + this.h[i];
this.ctx.quadraticCurveTo(x0, y0, (x0 + (i + 1) * dx) / 2, (y0 + offsetBase + this.h[i + 1]) / 2);
}
this.ctx.lineTo(this.W, offsetBase + this.h[this.N - 1]);
this.ctx.strokeStyle = "rgba(255,255,255,0.25)"; this.ctx.lineWidth = 0.6;
this.ctx.stroke();
}
loop() {
this.update(); this.render();
requestAnimationFrame(() => this.loop());
}
}
// Запускаем обе симуляции
const simTea = new LiquidCupSimulation("canvas-tea", "tea");
const simCoffee = new LiquidCupSimulation("canvas-coffee", "coffee");
simTea.loop(); simCoffee.loop();
// --- ОБРАБОТКА СВАЙП-ЖЕСТОВ И СХЛОПЫВАНИЯ МАГНИТОВ ---
const dragZone = document.getElementById("drag-zone");
let startX = null;
let currentX = 0;
dragZone.addEventListener("pointerdown", (e) => {
startX = e.clientX;
dragZone.setPointerCapture(e.pointerId);
});
dragZone.addEventListener("pointermove", (e) => {
if (startX === null) return;
const deltaX = e.clientX - startX;
// Ограничиваем натяжение пружины магнитов, чтобы не порвать разметку
currentX = Math.max(-140, Math.min(140, deltaX * 0.8));
pullX.set(currentX);
});
dragZone.addEventListener("pointerup", (e) => {
if (startX === null) return;
startX = null;
dragZone.releasePointerCapture(e.pointerId);
const velocity = pullX.getVelocity(); // Считываем скорость отпускания пальца
// Запускаем жесткую пружину возврата половин ромба в точку X:0
animate(pullX, 0, {
type: "spring",
stiffness: 340, // Сочный резкий щелчок схлопывания
damping: 18,
onComplete: () => {
// ИМПУЛЬС УДАРА: Передаем силу столкновения плиток прямо в массивы скоростей жидкостей!
const impactForce = Math.abs(currentX) > 10 ? currentX : velocity * 0.1;
if (Math.abs(impactForce) > 5) {
simTea.triggerImpact(impactForce);
simCoffee.triggerImpact(impactForce);
}
currentX = 0;
}
});
});
