import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { LiquidCup } from "@/components/LiquidCup";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Мастер — клуб бариста и чайных мастеров" },
      {
        name: "description",
        content:
          "Выберите чай или кофе и откройте именные визитки мастеров: их награды, авторские напитки и любимые заведения.",
      },
      { property: "og:title", content: "Мастер — клуб бариста и чайных мастеров" },
      {
        property: "og:description",
        content: "Именные визитки бариста и чайных мастеров. Подписывайтесь на своих мастеров.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Splash,
});

const EASE = [0.22, 1, 0.36, 1] as const;

function Splash() {
  const { setMode } = useMode();
  const navigate = useNavigate();
  const x = useMotionValue(0);
  const flood = useMotionValue(0);
  const start = useRef<number | null>(null);
  const lock = useRef(false);
  const [lead, setLead] = useState<Mode | null>(null);
  const [chosen, setChosen] = useState<Mode | null>(null);

  // Pull right → the tea triangle tears off and follows; pull left → the coffee one.
  const teaX = useTransform(x, (v) => Math.max(v, 0));
  const coffeeX = useTransform(x, (v) => Math.min(v, 0));
  const teaRotate = useTransform(x, [0, 260], [0, 7]);
  const coffeeRotate = useTransform(x, [-260, 0], [-7, 0]);
  const teaOpacity = useTransform(x, [-260, 0], [0.3, 1]);
  const coffeeOpacity = useTransform(x, [0, 260], [1, 0.3]);
  const teaLabel = useTransform(x, [-200, 0, 200], [0, 1, 0.6]);
  const coffeeLabel = useTransform(x, [-200, 0, 200], [0.6, 1, 0]);

  const choose = (m: Mode) => {
    if (lock.current) return;
    lock.current = true;
    setLead(m);
    setChosen(m);
    setMode(m);
    const w = typeof window !== "undefined" ? window.innerWidth : 1000;
    animate(x, m === "tea" ? w : -w, { duration: 1.3, ease: [0.65, 0, 0.35, 1] });
    animate(flood, 0.85, { duration: 0.8, ease: "easeOut" });
    setTimeout(() => navigate({ to: "/masters" }), 2800);
  };

  const sideOf = (clientX: number): Mode => (clientX < window.innerWidth / 2 ? "tea" : "coffee");

  const onDown = (e: React.PointerEvent<HTMLElement>) => {
    if (lock.current) return;
    start.current = e.clientX;
    delete e.currentTarget.dataset["side"];
  };
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse" && !lock.current && start.current === null) {
      e.currentTarget.dataset["side"] = sideOf(e.clientX);
    }
    if (start.current === null || lock.current) return;
    const dx = (e.clientX - start.current) * 0.8;
    x.set(dx);
    const next: Mode | null = dx > 2 ? "tea" : dx < -2 ? "coffee" : null;
    if (next && next !== lead) setLead(next);
  };
  const onUp = (e: React.PointerEvent<HTMLElement>) => {
    if (start.current === null) return;
    const dx = e.clientX - start.current;
    start.current = null;
    const m = modeFromSwipe(dx, 80);
    if (m) choose(m);
    else if (Math.abs(dx) < 6) choose(sideOf(e.clientX));
    else animate(x, 0, { type: "spring", stiffness: 260, damping: 22 });
  };
  const onLeave = (e: React.PointerEvent<HTMLElement>) => {
    delete e.currentTarget.dataset["side"];
  };

  return (
    <main
      className="splash-root splash-black relative flex h-[100svh] w-full touch-none items-center justify-center overflow-hidden select-none"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={onLeave}
    >
      <h1 className="sr-only">Мастер — выберите чай или кофе</h1>

      <div className="grid grid-cols-2 items-center gap-x-6 gap-y-6 px-6 sm:grid-cols-[1fr_auto_1fr] sm:gap-x-12">
        <motion.div
          className="splash-rh relative order-first col-span-2 justify-self-center sm:order-2 sm:col-span-1"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, ease: EASE }}
        >
          <Half
            side="tea"
            x={teaX}
            rotate={teaRotate}
            opacity={teaOpacity}
            flood={chosen === "tea" ? flood : null}
            onTop={lead === "tea"}
            onChoose={() => choose("tea")}
          />
          <Half
            side="coffee"
            x={coffeeX}
            rotate={coffeeRotate}
            opacity={coffeeOpacity}
            flood={chosen === "coffee" ? flood : null}
            onTop={lead === "coffee"}
            onChoose={() => choose("coffee")}
          />
        </motion.div>

        <motion.button
          type="button"
          onClick={() => choose("tea")}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          style={{ opacity: teaLabel }}
          initial={{ opacity: 0, x: -12 }}
          animate={{ x: 0 }}
          transition={{ duration: 1.4, delay: 0.6, ease: EASE }}
          className="splash-word order-2 justify-self-start font-display text-5xl italic sm:order-1 sm:justify-self-end sm:text-7xl"
        >
          Чай
        </motion.button>
        <motion.button
          type="button"
          onClick={() => choose("coffee")}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          style={{ opacity: coffeeLabel }}
          initial={{ opacity: 0, x: 12 }}
          animate={{ x: 0 }}
          transition={{ duration: 1.4, delay: 0.6, ease: EASE }}
          className="splash-word order-3 justify-self-end font-display text-5xl italic sm:justify-self-start sm:text-7xl"
        >
          Кофе
        </motion.button>
      </div>

      <AnimatePresence>
        {chosen && (
          <motion.div
            className="splash-veil absolute inset-0 z-20 flex items-center justify-center"
            data-kind={chosen}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <BrewLoader mode={chosen} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

/** One triangle of the rhombus with live liquid inside. Tea is the left half, coffee the right. */
function Half({
  side,
  x,
  rotate,
  opacity,
  flood,
  onTop,
  onChoose,
}: {
  side: Mode;
  x: MotionValue<number>;
  rotate: MotionValue<number>;
  opacity: MotionValue<number>;
  flood: MotionValue<number> | null;
  onTop: boolean;
  onChoose: () => void;
}) {
  const tea = side === "tea";
  const clip = tea ? "polygon(0 50%, 100% 0, 100% 100%)" : "polygon(0 0, 100% 50%, 0 100%)";
  const outline = tea ? "0.6,50 99.4,0.6 99.4,99.4" : "0.6,0.6 99.4,50 0.6,99.4";

  return (
    <motion.div
      className={tea ? "rh-half absolute inset-y-0 left-0 w-1/2" : "rh-half absolute inset-y-0 right-0 w-1/2"}
      data-side={side}
      style={{
        x,
        rotate,
        opacity,
        zIndex: onTop ? 2 : 1,
        transformOrigin: tea ? "100% 50%" : "0% 50%",
      }}
    >
      <LiquidCup kind={side} clip={clip} outline={outline} level={0.5} className="size-full" />
      {flood && (
        <motion.div
          className={tea ? "rh-flood-tea-bg absolute inset-0" : "rh-flood-coffee-bg absolute inset-0"}
          style={{ opacity: flood, clipPath: clip }}
        />
      )}
      <button
        type="button"
        aria-label={tea ? "Выбрать чай" : "Выбрать кофе"}
        onClick={onChoose}
        className="absolute inset-0 focus-visible:outline-none"
        style={{ clipPath: clip }}
      />
    </motion.div>
  );
}
