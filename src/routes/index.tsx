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
      { title: "Мастер — клуб бариста и чайных мастеров" },
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
  const chromeOpacity = useTransform(x, [-160, 0, 160], [0.2, 1, 0.2]);

  // Раздельный отрыв половинок ромба при перетаскивании
  const leftHalfX = useTransform(x, (v) => (v < 0 ? v * 1.4 - 20 : v * 0.4));
  const rightHalfX = useTransform(x, (v) => (v > 0 ? v * 1.4 + 20 : v * 0.4));
  const leftHalfRotate = useTransform(x, [-150, 0, 150], [-6, 0, 2]);
  const rightHalfRotate = useTransform(x, [-150, 0, 150], [-2, 0, 6]);
  const leftHalfOpacity = useTransform(x, [-200, 0, 200], [0.3, 1, 0.5]);
  const rightHalfOpacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.3]);
  
  const start = useRef<number | null>(null);
  const lock = useRef(false);
  const [chosen, setChosen] = useState<Mode | null>(null);

  const choose = (m: Mode) => {
    if (lock.current) return;
    lock.current = true;
    setChosen(m);
    setMode(m);
    const w = typeof window !== "undefined" ? window.innerWidth : 1000;
    animate(x, m === "tea" ? w : -w, { duration: 0.85, ease: [0.76, 0, 0.24, 1] });
    setTimeout(() => navigate({ to: "/masters" }), 2400);
  };

  const onDown = (e: React.PointerEvent) => {
    if (lock.current) return;
    start.current = e.clientX;
  };
  
  const onMove = (e: React.PointerEvent) => {
    if (start.current === null || lock.current) return;
    const maxPull = window.innerWidth * 0.42;
    const currentPull = (e.clientX - start.current) * 0.8;
    x.set(Math.max(-maxPull, Math.min(maxPull, currentPull)));
  };
  
  const onUp = (e: React.PointerEvent) => {
    if (start.current === null) return;
    const dx = e.clientX - start.current;
    start.current = null;
    
    const m = modeFromSwipe(dx, 75);
    if (m) {
      choose(m);
    } else if (Math.abs(dx) < 6) {
      choose(e.clientX < window.innerWidth / 2 ? "tea" : "coffee");
    } else {
      animate(x, 0, { type: "spring", stiffness: 260, damping: 26 });
    }
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
      {/* COFFEE BACKGROUND LIGHTING */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 right-[-20%] size-[60vw] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(140,80,30,0.08)_0%,transparent_70%)] blur-[80px]" />
        <Side side="right" eyebrow="Кофейное ремесло" title="Кофе" sub="бариста и обжарщики" hint="← войти" onChoose={() => choose("coffee")} stop={stop} />
      </div>

      {/* TEA BACKGROUND LIGHTING */}
      <motion.div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: leftWidth }}>
        <div className="absolute inset-y-0 left-0 w-[100vw]">
          <div className="absolute top-1/2 left-[-20%] size-[60vw] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(90,130,40,0.08)_0%,transparent_70%)] blur-[80px]" />
          <Side side="left" eyebrow="Чайное искусство" title="Чай" sub="чайные мастера" hint="войти →" onChoose={() => choose("tea")} stop={stop} />
        </div>
      </motion.div>

      {/* LUXURY ANALOG GRAIN OVERLAY */}
      <div 
        className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://w3.org id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.8)_100%)]" />

      {/* SEPARATION DIVIDER & DISCONNECTING DIAMOND */}
      <motion.div className="pointer-events-none absolute inset-y-0 z-10 w-0" style={{ left: dividerLeft }}>
        <motion.div className="absolute inset-y-0 -left-[0.5px] w-[1px] bg-gradient-to-b from-white/5 via-zinc-400/40 to-white/5" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 1.4, delay: 0.2, ease: EASE }} />

        {/* MAGNETIC MEDALLION */}
        <div className="pointer-events-auto absolute top-1/2 left-0 flex aspect-square w-[clamp(150px,20vw,220px)] -translate-x-1/2 -translate-y-1/2 items-center justify-center" {...stop}>
          <motion.button type="button" aria-label="Чай" onClick={() => choose("tea")} style={{ x: leftHalfX, rotate: leftHalfRotate, opacity: leftHalfOpacity, clipPath: "polygon(100% 0, 100% 100%, 0 50%)", transformOrigin: "100% 50%" }} className="relative h-full w-1/2 cursor-pointer">
            <LiquidCup kind="tea" level={0.46} clip="polygon(100% 0, 100% 100%, 0 50%)" vertex="left" outline="100,0 100,100 0,50" className="size-full" />
          </motion.button>
          <motion.button type="button" aria-label="Кофе" onClick={() => choose("coffee")} style={{ x: rightHalfX, rotate: rightHalfRotate, opacity: rightHalfOpacity, clipPath: "polygon(0 0, 100% 50%, 0 100%)", transformOrigin: "0% 50%" }} className="relative h-full w-1/2 cursor-pointer">
            <LiquidCup kind="coffee" level={0.46} clip="polygon(0 0, 100% 50%, 0 100%)" vertex="right" outline="0,0 100,50 0,100" className="size-full" />
          </motion.button>
        </div>
      </motion.div>

      {/* APP OVERLAYS & TEXTS */}
      <motion.div className="pointer-events-none absolute inset-4 z-10 border border-white/5 sm:inset-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4, delay: 0.4 }} />

      <motion.header className="pointer-events-none absolute inset-x-0 top-[7%] z-10 flex flex-col items-center text-center px-4" style={{ opacity: chromeOpacity }}>
        <motion.h1 {...rise(0.3)} className="font-display text-2xl font-light tracking-[0.5em] uppercase sm:text-4xl text-zinc-100 pl-[0.5em]">Мастер</motion.h1>
        <motion.div {...rise(0.45)} className="mt-2.5 flex items-center gap-3">
          <span className="h-[0.5px] w-6 bg-zinc-800 sm:w-12" />
          <span className="text-[0.55rem] tracking-[0.35em] text-zinc-400 uppercase sm:text-[0.65rem]">клуб бариста и чайных мастеров</span>
          <span className="h-[0.5px] w-6 bg-zinc-800 sm:w-12" />
        </motion.div>
      </motion.header>

      <motion.div className="absolute inset-x-0 bottom-[5%] z-10 flex flex-col items-center gap-2.5 px-6 text-center" style={{ opacity: chromeOpacity }}>
        <motion.p {...rise(0.9)} className="font-sans text-[0.7rem] font-light tracking-[0.1em] text-zinc-500 italic sm:text-xs">"...find the one whose love you drink..."</motion.p>
        <motion.p {...rise(1.05)} className="font-display text-sm font-light text-zinc-300 sm:text-base mt-1">Вы мастер своего дела?</motion.p>
        <motion.div {...rise(1.2)}>
          <Link to={user ? "/_authenticated/me" : "/auth"} {...stop} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-[0.65rem] font-medium tracking-[0.2em] text-zinc-200 uppercase transition-all hover:bg-white/10 hover:border-white/20 cursor-pointer">Получить именную визитку <ArrowRight className="size-3 text-zinc-400" /></Link>
        </motion.div>
        <motion.div {...rise(1.35)} className="mt-1">
          <Link to="/masters" {...stop} className="text-[0.6rem] tracking-[0.15em] text-zinc-500 uppercase underline-offset-4 hover:text-zinc-300 hover:underline cursor-pointer">Сразу к мастерам</Link>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {chosen && (
          <motion.div className="absolute inset-0 z-50 flex items-center justify-center bg-black" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} {...stop}>
            <BrewLoader kind={chosen} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Side({ side, eyebrow, title, sub, hint, onChoose, stop }: { side: "left" | "right"; eyebrow: string; title: string; sub: string; hint: string; onChoose: () => void; stop: any }) {
  const isRight = side === "right";
  return (
    <div className={`absolute bottom-[24%] z-10 flex w-[42vw] flex-col ${isRight ? "right-0 items-end pr-6 text-right sm:pr-14" : "left-0 items-start pl-6 text-left sm:pl-14"}`}>
      <motion.p {...rise(0.5)} className="text-[0.55rem] font-semibold tracking-[0.25em] text-zinc-500 uppercase sm:text-xs">{eyebrow}</motion.p>
<motion.h2 {...rise(0.65)} className="mt-1 font-display text-2xl font-light tracking-wide text-zinc-100 sm:text-5xl uppercase">{title}</motion.h2>
<motion.p {...rise(0.8)} className="mt-1.5 text-[0.65rem] font-medium text-zinc-400 sm:text-xs">{sub}</motion.p>
<motion.button type="button" {...stop} onClick={onChoose} className="mt-4 flex items-center gap-1.5 rounded-full border border-white/5 bg-zinc-950/40 px-3 py-1 text-[0.55rem] tracking-[0.2em] text-zinc-400 uppercase transition-all hover:border-white/10 hover:text-zinc-200 cursor-pointer">
{hint}
</motion.button>

);
}
