import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { animate, motion, useMotionValue, useTransform, AnimatePresence } from "motion/react";
import { ArrowRight } from "lucide-react";
import { modeFromSwipe, useMode, type Mode } from "@/lib/mode";
import { useAuth } from "@/lib/auth";
import { BrewLoader } from "@/components/BrewLoader";
import { LiquidCup } from "@/components/LiquidCup";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Мастер — club бариста и чайных мастеров" },
      { name: "description", content: "Выберите чай или кофе и откройте именные визитки мастеров." },
    ],
  }),
  component: Splash,
});

const EASE = [0.22, 1, 0.36, 1] as const;
const rise = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1.1, delay, ease: EASE },
});

function Splash() {
  const { setMode } = useMode();
  const { user } = useAuth();
  const navigate = useNavigate();
  const x = useMotionValue(0);
  
  const leftWidth = useTransform(x, (v) => `calc(50% + ${v}px)`);
  const dividerLeft = useTransform(x, (v) => `calc(50% + ${v}px)`);
  const chromeOpacity = useTransform(x, [-140, 0, 140], [0.35, 1, 0.35]);
  
  const start = useRef<number | null>(null);
  const lock = useRef(false);
  const [chosen, setChosen] = useState<Mode | null>(null);

  const choose = (m: Mode) => {
    if (lock.current) return;
    lock.current = true;
    setChosen(m);
    setMode(m);
    const w = typeof window !== "undefined" ? window.innerWidth : 1000;
    animate(x, m === "tea" ? w / 2 : -w / 2, { duration: 0.7, ease: [0.65, 0, 0.35, 1] });
    setTimeout(() => navigate({ to: "/masters" }), 2600);
  };

  const onDown = (e: React.PointerEvent) => {
    if (lock.current) return;
    start.current = e.clientX;
  };
  const onMove = (e: React.PointerEvent) => {
    if (start.current === null || lock.current) return;
    x.set((e.clientX - start.current) * 0.9);
  };
  const onUp = (e: React.PointerEvent) => {
    if (start.current === null) return;
    const dx = e.clientX - start.current;
    start.current = null;
    const m = modeFromSwipe(dx, 80);
    if (m) choose(m);
    else if (Math.abs(dx) < 6) choose(e.clientX < window.innerWidth / 2 ? "tea" : "coffee");
    else animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
  };
  const stop = {
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    onPointerUp: (e: React.PointerEvent) => e.stopPropagation(),
  };

  return (
    <main
      className="splash-root relative h-[100svh] w-full cursor-grab touch-none overflow-hidden select-none active:cursor-grabbing bg-[#070708] text-white"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {/* ПРАВАЯ ПОДЛОЖКА (КОФЕ) */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 right-[-20%] size-[60vw] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(140,80,30,0.07)_0%,transparent_70%)] blur-[90px] pointer-events-none" />
        <Side side="right" eyebrow="Кофейное ремесло" title="Кофе" sub="бариста и обжарщики" hint="← войти" onChoose={() => choose("coffee")} stop={stop} />
      </div>

      {/* ЛЕВАЯ ПОДЛОЖКА (ЧАЙ) */}
      <motion.div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: leftWidth }}>
        <div className="absolute inset-y-0 left-0 w-[100vw]">
          <div className="absolute top-1/2 left-[-20%] size-[60vw] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(90,130,40,0.07)_0%,transparent_70%)] blur-[90px] pointer-events-none" />
          <Side side="left" eyebrow="Чайное искусство" title="Чай" sub="чайные мастера" hint="войти →" onChoose={() => choose("tea")} stop={stop} />
        </div>
      </motion.div>

      {/* ИСПРАВЛЕНО: Чистый, валидный SVG-код матовой бумаги Touche Cover */}
      <div 
        className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://w3.org id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)]" />

      {/* РАЗДЕЛИТЕЛЬ И РОМБ */}
      <motion.div className="pointer-events-none absolute inset-y-0 z-10 w-0" style={{ left: dividerLeft }}>
        <motion.div className="absolute inset-y-0 -left-px w-px bg-gradient-to-b from-white/5 via-zinc-500/30 to-white/5" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 1.6, delay: 0.3, ease: EASE }} />
        
        <motion.div
          className="pointer-events-auto absolute top-1/2 left-0 flex h-28 w-44 -translate-x-1/2 -translate-y-1/2 sm:h-36 sm:w-56"
          style={{ opacity: chromeOpacity }}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.9, ease: EASE }}
          {...stop}
        >
          <button
            type="button"
            aria-label="Чай"
            onClick={() => choose("tea")}
            className="relative h-full w-1/2 cursor-pointer"
            style={{ clipPath: "polygon(100% 0, 100% 100%, 0 50%)" }}
          >
            <LiquidCup kind="tea" level={0.46} clip="polygon(100% 0, 100% 100%, 0 50%)" outline="99.5,0.5 99.5,99.5 0.8,50" className="size-full" />
          </button>
          <button
            type="button"
            aria-label="Кофе"
            onClick={() => choose("coffee")}
            className="relative h-full w-1/2 cursor-pointer"
            style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}
          >
            <LiquidCup kind="coffee" level={0.46} clip="polygon(0 0, 100% 50%, 0 100%)" outline="0.5,0.5 99.2,50 0.5,99.5" className="size-full" />
          </button>
        </motion.div>
      </motion.div>

      {/* РАМКА И ШАПКА */}
      <motion.div className="pointer-events-none absolute inset-3 z-10 border border-white/5 sm:inset-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.6, delay: 0.5 }} />

      <motion.header className="pointer-events-none absolute inset-x-0 top-[7%] z-10 flex flex-col items-center text-center px-4" style={{ opacity: chromeOpacity }}>
        <motion.h1 {...rise(0.35)} className="mt-4 pl-[0.5em] font-display text-2xl font-light tracking-[0.5em] uppercase sm:text-4xl text-zinc-100">Мастер</motion.h1>
        <motion.div {...rise(0.5)} className="mt-3 flex items-center gap-3">
          <span className="h-px w-8 bg-zinc-800 sm:w-14" />
          <span className="text-[0.6rem] tracking-[0.35em] text-zinc-400 uppercase sm:text-[0.7rem]">клуб бариста и чайных мастеров</span>
          <span className="h-px w-8 bg-zinc-800 sm:w-14" />
        </motion.div>
      </motion.header>

      {/* СЛОГАН И ПРИГЛАШЕНИЕ ДЛЯ МАСТЕРОВ */}
      <motion.div className="absolute inset-x-0 bottom-[5%] z-10 flex flex-col items-center gap-3 px-6 text-center" style={{ opacity: chromeOpacity }}>
        <motion.p {...rise(0.9)} className="font-sans text-[0.75rem] font-light tracking-[0.12em] text-zinc-500 italic sm:text-[0.85rem]">"...find the one whose love you drink..."</motion.p>
        <motion.p {...rise(1.1)} className="font-display text-base text-zinc-300 italic sm:text-lg">Вы мастер своего дела?</motion.p>
        <motion.div {...rise(1.25)}>
          <Link to={user ? "/_authenticated/me" : "/auth"} {...stop} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-[0.7rem] font-semibold tracking-[0.25em] text-zinc-200 uppercase transition-all hover:bg-white/10">Получить именную визитку <ArrowRight className="size-3.5" /></Link>
        </motion.div>
        <motion.div {...rise(1.4)}>
          <Link to="/masters" {...stop} className="text-[0.7rem] tracking-[0.15em] text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline">Сразу к мастерам</Link>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {chosen && (
          <motion.div className="absolute inset-0 z-50 flex items-center justify-center bg-black" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.5, duration: 0.4 }} {...stop}>
            <BrewLoader kind={chosen} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Side({ side, eyebrow, title, sub, hint, onChoose, stop }: { side: "left" | "right"; eyebrow: string; title: string; sub: string; hint: string; onChoose: () => void; stop: any }) {
  const right = side === "right";
  return (
    <div className={right ? "absolute right-0 bottom-[22%] flex w-1/2 flex-col items-end px-5 text-right sm:px-14" : "absolute bottom-[22%] left-0 flex w-full flex-col items-start px-5 sm:px-14"}>
      <motion.p {...rise(0.7)} className="text-[0.55rem] whitespace-nowrap tracking-[0.22em] text-zinc-500 uppercase sm:text-xs">
        {eyebrow}
      </motion.p>
      <motion.h2 {...rise(0.8)} className="mt-2 pl-[0.2em] font-display text-4xl font-light tracking-[0.2em] uppercase sm:text-6xl text-zinc-100">
        {title}
      </h2>
      <motion.p {...rise(0.95)} className="mt-3 text-xs text-zinc-400 sm:text-sm">
        {sub}
      </motion.p>
      <motion.button {...rise(1.05)} type="button" {...stop} onClick={onChoose} className="group mt-5 inline-flex items-center gap-2 text-[0.65rem] font-semibold tracking-[0.3em] text-zinc-400 uppercase sm:text-xs cursor-pointer">
Войти
{hint}
</motion.button>

);
}
