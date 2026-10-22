import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { animate, motion, useMotionValue, useTransform, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import teaLeaf from "@/assets/tea-leaf.jpg";
import coffeeBean from "@/assets/coffee-bean.jpg";
import { modeFromSwipe, useMode, type Mode } from "@/lib/mode";
import { BrewLoader } from "@/components/BrewLoader";

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
  const leftWidth = useTransform(x, (v) => `calc(50% + ${v}px)`);
  const hintOpacity = useTransform(x, [-120, 0, 120], [0, 1, 0]);
  const start = useRef<number | null>(null);
  const [chosen, setChosen] = useState<Mode | null>(null);

  const choose = (m: Mode) => {
    if (chosen) return;
    setChosen(m);
    setMode(m);
    const w = typeof window !== "undefined" ? window.innerWidth : 1000;
    animate(x, m === "tea" ? w / 2 : -w / 2, { duration: 0.6, ease: [0.65, 0, 0.35, 1] });
    setTimeout(() => navigate({ to: "/masters" }), 2600);
  };

  const onDown = (e: React.PointerEvent) => {
    if (chosen) return;
    start.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (start.current === null || chosen) return;
    x.set((e.clientX - start.current) * 0.9);
  };
  const onUp = (e: React.PointerEvent) => {
    if (start.current === null) return;
    const dx = e.clientX - start.current;
    start.current = null;
    const m = modeFromSwipe(dx, 80);
    if (m) choose(m);
    else if (Math.abs(dx) < 6) {
      // treat as a tap on whichever side was pressed
      choose(e.clientX < window.innerWidth / 2 ? "tea" : "coffee");
    } else animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
  };

  return (
    <main
      className="relative h-[100svh] w-full cursor-grab touch-none overflow-hidden bg-background select-none active:cursor-grabbing"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {/* Coffee (right, underneath) */}
      <div className="absolute inset-0">
        <img
          src={coffeeBean}
          alt="Кофейное зерно"
          width={960}
          height={1600}
          draggable={false}
          className="absolute top-0 right-0 h-full w-1/2 min-w-[50%] object-cover"
        />
        <div className="splash-shade-coffee absolute inset-y-0 right-0 w-1/2" />
        <div className="absolute right-0 bottom-[14%] w-1/2 px-6 text-right">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">влево</p>
          <h2 className="mt-2 font-display text-4xl font-semibold sm:text-6xl">Кофе</h2>
          <p className="mt-2 text-sm text-muted-foreground">бариста и обжарщики</p>
        </div>
      </div>

      {/* Tea (left, resizable) */}
      <motion.div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: leftWidth }}>
        <div className="absolute inset-y-0 left-0 w-[50vw]">
          <img
            src={teaLeaf}
            alt="Чайный лист"
            width={960}
            height={1600}
            draggable={false}
            className="h-full w-full object-cover"
          />
          <div className="splash-shade-tea absolute inset-0" />
          <div className="absolute bottom-[14%] left-0 px-6">
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">вправо</p>
            <h2 className="mt-2 font-display text-4xl font-semibold sm:text-6xl">Чай</h2>
            <p className="mt-2 text-sm text-muted-foreground">чайные мастера</p>
          </div>
        </div>
        <div className="splash-divider absolute inset-y-0 right-0 w-px" />
      </motion.div>

      {/* Center title */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-[9%] text-center"
        style={{ opacity: hintOpacity }}
      >
        <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-7xl">
          Мастер<span className="text-primary">.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
          Визитки бариста и чайных мастеров
        </p>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-center gap-3 text-sm text-foreground/80"
        style={{ opacity: hintOpacity }}
      >
        <motion.span animate={{ x: [-4, 4, -4] }} transition={{ duration: 2, repeat: Infinity }}>
          <ChevronLeft className="size-5" />
        </motion.span>
        <span className="rounded-full border bg-background/50 px-4 py-1.5 backdrop-blur">
          Потяните к своему напитку
        </span>
        <motion.span animate={{ x: [4, -4, 4] }} transition={{ duration: 2, repeat: Infinity }}>
          <ChevronRight className="size-5" />
        </motion.span>
      </motion.div>

      <div className="absolute inset-x-0 bottom-5 text-center">
        <Link
          to="/masters"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Сразу к мастерам
        </Link>
      </div>

      <AnimatePresence>
        {chosen && (
          <motion.div
            className="absolute inset-0 z-20 flex items-center justify-center bg-background/85 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.4 }}
          >
            <BrewLoader mode={chosen} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
