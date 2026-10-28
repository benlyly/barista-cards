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
      { property: "og:title", content: "Мастер — клуб бариста и чайных мастеров" },
      { property: "og:description", content: "Именные визитки бариста и чайных мастеров." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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

type Stop = { onPointerDown: (e: React.PointerEvent) => void; onPointerUp: (e: React.PointerEvent) => void };

function Splash() {
  const { setMode } = useMode();
  const { user } = useAuth();
  const navigate = useNavigate();
  const x = useMotionValue(0);

  const chromeOpacity = useTransform(x, [-160, 0, 160], [0.2, 1, 0.2]);
  const leftHalfX = useTransform(x, (v) => (v > 0 ? v * 1.4 + 20 * Math.min(1, v / 40) : v * 0.4));
  const rightHalfX = useTransform(x, (v) => (v < 0 ? v * 1.4 - 20 * Math.min(1, -v / 40) : v * 0.4));
  const leftHalfRotate = useTransform(x, [-150, 0, 150], [-2, 0, 6]);
  const rightHalfRotate = useTransform(x, [-150, 0, 150], [-6, 0, 2]);
  const leftHalfOpacity = useTransform(x, [-200, 0, 200], [0.4, 1, 1]);
  const rightHalfOpacity = useTransform(x, [-200, 0, 200], [1, 1, 0.4]);

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
    x.set(Math.max(-maxPull, Math.min(maxPull, (e.clientX - start.current) * 0.8)));
  };
  const onUp = (e: React.PointerEvent) => {
    if (start.current === null) return;
    const dx = e.clientX - start.current;
    start.current = null;
    const m = modeFromSwipe(dx, 75);
    if (m) choose(m);
    else if (Math.abs(dx) < 6) choose(e.clientX < window.innerWidth / 2 ? "tea" : "coffee");
    else animate(x, 0, { type: "spring", stiffness: 260, damping: 26 });
  };
  const stop: Stop = {
    onPointerDown: (e) => e.stopPropagation(),
    onPointerUp: (e) => e.stopPropagation(),
  };

  return (
    <main
      className="splash-root relative h-[100svh] w-full cursor-grab touch-none overflow-hidden bg-background text-foreground select-none active:cursor-grabbing"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div className="pointer-events-none absolute top-1/2 left-[-20%] size-[60vw] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(90,130,40,0.08)_0%,transparent_70%)] blur-[80px]" />
      <div className="pointer-events-none absolute top-1/2 right-[-20%] size-[60vw] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(140,80,30,0.08)_0%,transparent_70%)] blur-[80px]" />

      <Side side="left" eyebrow="Чайное искусство" title="Чай" sub="чайные мастера" hint="→" onChoose={() => choose("tea")} stop={stop} />
      <Side side="right" eyebrow="Кофейное ремесло" title="Кофе" sub="бариста и обжарщики" hint="←" onChoose={() => choose("coffee")} stop={stop} />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.8)_100%)]" />

      {/* Split diamond */}
      <div
        className="absolute top-1/2 left-1/2 z-10 flex h-[clamp(110px,15vw,160px)] w-[clamp(180px,24vw,260px)] -translate-x-1/2 -translate-y-1/2"
        {...stop}
      >
        <motion.button
          type="button"
          aria-label="Чай"
          onClick={() => choose("tea")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          style={{ x: leftHalfX, rotate: leftHalfRotate, opacity: leftHalfOpacity, clipPath: "polygon(0 50%, 100% 0, 100% 100%)", transformOrigin: "100% 50%" }}
          className="relative h-full w-1/2 cursor-pointer"
        >
          <LiquidCup kind="tea" level={0.5} clip="polygon(0 50%, 100% 0, 100% 100%)" vertex="left" outline="0.8,50 99.5,0.5 99.5,99.5" className="size-full" />
        </motion.button>
        <motion.button
          type="button"
          aria-label="Кофе"
          onClick={() => choose("coffee")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          style={{ x: rightHalfX, rotate: rightHalfRotate, opacity: rightHalfOpacity, clipPath: "polygon(0 0, 100% 50%, 0 100%)", transformOrigin: "0% 50%" }}
          className="relative h-full w-1/2 cursor-pointer"
        >
          <LiquidCup kind="coffee" level={0.5} clip="polygon(0 0, 100% 50%, 0 100%)" vertex="right" outline="0.5,0.5 99.2,50 0.5,99.5" className="size-full" />
        </motion.button>
      </div>

      <motion.div className="pointer-events-none absolute inset-4 z-10 border border-foreground/5 sm:inset-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4, delay: 0.4 }} />

      <motion.header className="pointer-events-none absolute inset-x-0 top-[7%] z-10 flex flex-col items-center px-4 text-center" style={{ opacity: chromeOpacity }}>
        <motion.h1 {...rise(0.3)} className="pl-[0.5em] font-display text-2xl font-light tracking-[0.5em] uppercase sm:text-4xl">
          Мастер
        </motion.h1>
        <motion.div {...rise(0.45)} className="mt-2.5 flex items-center gap-3">
          <span className="h-px w-6 bg-foreground/15 sm:w-12" />
          <span className="text-[0.55rem] tracking-[0.35em] text-muted-foreground uppercase sm:text-[0.65rem]">клуб бариста и чайных мастеров</span>
          <span className="h-px w-6 bg-foreground/15 sm:w-12" />
        </motion.div>
      </motion.header>

      <motion.div className="absolute inset-x-0 bottom-[5%] z-10 flex flex-col items-center gap-2.5 px-6 text-center" style={{ opacity: chromeOpacity }}>
        <motion.p {...rise(1.05)} className="mt-1 font-display text-sm font-light text-foreground/80 sm:text-base">
          Вы мастер своего дела?
        </motion.p>
        <motion.div {...rise(1.2)}>
          <Link
            to={user ? "/me" : "/auth"}
            {...stop}
            className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/5 px-5 py-2 text-[0.65rem] font-medium tracking-[0.2em] uppercase transition-all hover:border-foreground/20 hover:bg-foreground/10"
          >
            Получить именную визитку <ArrowRight className="size-3 text-muted-foreground" />
          </Link>
        </motion.div>
        <motion.div {...rise(1.35)} className="mt-1">
          <Link to="/masters" {...stop} className="text-[0.6rem] tracking-[0.15em] text-muted-foreground uppercase underline-offset-4 hover:text-foreground hover:underline">
            Сразу к мастерам
          </Link>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {chosen && (
          <motion.div
            className="splash-veil absolute inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            {...stop}
          >
            <BrewLoader mode={chosen} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Side({ side, eyebrow, title, sub, hint, onChoose, stop }: { side: "left" | "right"; eyebrow: string; title: string; sub: string; hint: string; onChoose: () => void; stop: Stop }) {
  const right = side === "right";
  return (
    <div className={`absolute bottom-[24%] z-10 flex w-[42vw] flex-col ${right ? "right-0 items-end pr-6 text-right sm:pr-14" : "left-0 items-start pl-6 text-left sm:pl-14"}`}>
      <motion.p {...rise(0.5)} className="text-[0.55rem] font-semibold tracking-[0.25em] text-muted-foreground uppercase sm:text-xs">{eyebrow}</motion.p>
      <motion.h2 {...rise(0.65)} className="mt-1 font-display text-2xl font-light tracking-wide uppercase sm:text-5xl">{title}</motion.h2>
      <motion.p {...rise(0.8)} className="mt-1.5 text-[0.65rem] font-medium text-foreground/60 sm:text-xs">{sub}</motion.p>
      <motion.button
        type="button"
        {...stop}
        onClick={onChoose}
        data-choice={right ? "coffee" : "tea"}
        className="mt-4 flex items-center gap-1.5 rounded-full border border-foreground/5 bg-background/40 px-3 py-1 text-[0.55rem] tracking-[0.2em] text-muted-foreground uppercase transition-all hover:border-foreground/10 hover:text-foreground"
      >
        Войти <span>{hint}</span>
      </motion.button>
    </div>
  );
}
