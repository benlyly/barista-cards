import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  type MotionValue,
} from "motion/react";
import { modeFromSwipe, useMode, type Mode } from "@/lib/mode";
import { BrewLoader } from "@/components/BrewLoader";
import { CoffeeBeanMark, TeaLeafMark } from "@/components/BrandMarks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Мастер — чай или кофе?" },
      {
        name: "description",
        content:
          "Выберите чай или кофе и откройте визитки мастеров: их награды, авторские напитки и любимые заведения.",
      },
      { property: "og:title", content: "Мастер — чай или кофе?" },
      {
        property: "og:description",
        content: "Визитки бариста и чайных мастеров. Подписывайтесь на своих мастеров.",
      },
    ],
  }),
  component: Splash,
});

function Splash() {
  const { setMode } = useMode();
  const navigate = useNavigate();
  const x = useMotionValue(0);
  const teaGlow = useTransform(x, [0, 140], [0, 1]);
  const coffeeGlow = useTransform(x, [-140, 0], [1, 0]);
  const teaScale = useTransform(x, [-140, 0, 140], [0.95, 1, 1.05]);
  const coffeeScale = useTransform(x, [-140, 0, 140], [1.05, 1, 0.95]);
  const start = useRef<number | null>(null);
  const lock = useRef(false);
  const [chosen, setChosen] = useState<Mode | null>(null);

  const choose = (m: Mode) => {
    if (lock.current) return;
    lock.current = true;
    setChosen(m);
    setMode(m);
    animate(x, m === "tea" ? 140 : -140, { duration: 0.45, ease: [0.65, 0, 0.35, 1] });
    setTimeout(() => navigate({ to: "/masters" }), 2600);
  };

  const onDown = (e: React.PointerEvent) => {
    if (lock.current) return;
    start.current = e.clientX;
  };
  const onMove = (e: React.PointerEvent) => {
    if (start.current === null || lock.current) return;
    const dx = e.clientX - start.current;
    x.set(Math.max(-160, Math.min(160, dx * 0.8)));
  };
  const onUp = (e: React.PointerEvent) => {
    if (start.current === null) return;
    const dx = e.clientX - start.current;
    start.current = null;
    const m = modeFromSwipe(dx, 80);
    if (m) choose(m);
    else animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
  };

  return (
    <main
      className="splash-noir relative flex h-[100svh] w-full touch-none flex-col items-center justify-between overflow-hidden px-6 py-[8svh] select-none"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <motion.div
        className="splash-glow-tea pointer-events-none absolute inset-y-0 left-0 w-1/2"
        style={{ opacity: teaGlow }}
      />
      <motion.div
        className="splash-glow-coffee pointer-events-none absolute inset-y-0 right-0 w-1/2"
        style={{ opacity: coffeeGlow }}
      />

      <header className="relative text-center">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Мастер<span className="text-mark-coffee">.</span>
        </h1>
        <p className="mt-2 text-xs tracking-[0.3em] uppercase text-muted-foreground">
          визитки бариста и чайных мастеров
        </p>
      </header>

      <section className="relative w-full max-w-xl text-center">
        <p className="font-display text-xl text-muted-foreground italic">Что вы пьёте сегодня?</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5">
          <Choice
            mode="tea"
            label="Чай"
            sub="чайные мастера"
            scale={teaScale}
            chosen={chosen}
            onChoose={choose}
          />
          <Choice
            mode="coffee"
            label="Кофе"
            sub="бариста и обжарщики"
            scale={coffeeScale}
            chosen={chosen}
            onChoose={choose}
          />
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Можно и жестом: вправо — чай, влево — кофе
        </p>
      </section>

      <Link
        to="/masters"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        className="relative text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Сразу к мастерам
      </Link>

      <AnimatePresence>
        {chosen && (
          <motion.div
            className="splash-veil absolute inset-0 z-20 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <BrewLoader mode={chosen} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Choice({
  mode,
  label,
  sub,
  scale,
  chosen,
  onChoose,
}: {
  mode: Mode;
  label: string;
  sub: string;
  scale: MotionValue<number>;
  chosen: Mode | null;
  onChoose: (m: Mode) => void;
}) {
  const Mark = mode === "tea" ? TeaLeafMark : CoffeeBeanMark;
  const dimmed = chosen !== null && chosen !== mode;
  return (
    <motion.button
      type="button"
      style={{ scale }}
      animate={{ opacity: dimmed ? 0.25 : 1 }}
      onClick={() => onChoose(mode)}
      data-choice={mode}
      className={cn(
        "splash-choice group flex flex-col items-center gap-4 rounded-3xl border px-4 py-8 transition-colors sm:py-10",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
      )}
    >
      <Mark
        className={cn(
          "size-14 transition-transform duration-500 group-hover:-rotate-6 sm:size-16",
          mode === "tea" ? "text-mark-tea" : "text-mark-coffee",
        )}
      />
      <span className="font-display text-4xl font-semibold sm:text-5xl">{label}</span>
      <span className="text-xs text-muted-foreground">{sub}</span>
    </motion.button>
  );
}
