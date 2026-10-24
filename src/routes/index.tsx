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

/* One half of the rhombus, in its own SVG units. */
const HW = 700;
const HH = 1000;
const LEVEL = 500; // liquid fills half the triangle
const TEA_TRI = `0,${HH / 2} ${HW},0 ${HW},${HH}`;
const COFFEE_TRI = `0,0 ${HW},${HH / 2} 0,${HH}`;

/** Wavy liquid surface from x0 to x1, closed down to the bottom. */
function wavePath(y: number, amp: number, period: number, x0 = -700, x1 = 1400, bottom = HH + 200) {
  let d = `M${x0} ${y}`;
  for (let x = x0; x < x1; x += period) {
    d += ` Q${x + period / 4} ${y - amp} ${x + period / 2} ${y} T${x + period} ${y}`;
  }
  return `${d} L${x1} ${bottom} L${x0} ${bottom} Z`;
}

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

/** A triangle "cup" with liquid sloshing inside. Tea is the left half, coffee the right. */
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
  const tri = tea ? TEA_TRI : COFFEE_TRI;
  const id = `cup-${side}`;
  const clip = tea ? "polygon(0 50%, 100% 0, 100% 100%)" : "polygon(0 0, 100% 50%, 0 100%)";

  return (
    <motion.div
      className={tea ? "absolute inset-y-0 left-0 w-1/2" : "absolute inset-y-0 right-0 w-1/2"}
      style={{
        x,
        rotate,
        opacity,
        zIndex: onTop ? 2 : 1,
        transformOrigin: tea ? "100% 50%" : "0% 50%",
      }}
    >
      <svg
        viewBox={`0 0 ${HW} ${HH}`}
        className="rh-half block size-full overflow-visible"
        data-side={side}
        aria-hidden
      >
        <defs>
          <clipPath id={`${id}-clip`}>
            <polygon points={tri} />
          </clipPath>
          <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className={tea ? "liq-tea-top" : "liq-coffee-top"} />
            <stop offset="1" className={tea ? "liq-tea-bottom" : "liq-coffee-bottom"} />
          </linearGradient>
        </defs>

        <g clipPath={`url(#${id}-clip)`}>
          <polygon points={tri} className="cup-glass" />

          {/* Liquid sloshing like in a cup */}
          <motion.g
            animate={{ rotate: tea ? [-7, 6, -7] : [6, -7, 6] }}
            transition={{ duration: tea ? 3.4 : 3.8, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: `${HW / 2}px ${LEVEL}px`, transformBox: "view-box" }}
          >
            <motion.g
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* back wave */}
              <motion.path
                d={wavePath(LEVEL - 18, 22, 350)}
                className={tea ? "liq-tea-back" : "liq-coffee-back"}
                animate={{ x: [0, -350] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: "linear" }}
              />
              {/* crema for coffee */}
              {!tea && (
                <motion.path
                  d={wavePath(LEVEL - 4, 18, 280)}
                  className="liq-crema"
                  animate={{ x: [-280, 0] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
                />
              )}
              {/* front body */}
              <motion.path
                d={wavePath(LEVEL + (tea ? 0 : 22), 26, 420)}
                fill={`url(#${id}-body)`}
                animate={{ x: [-420, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              {/* surface shine */}
              <motion.path
                d={wavePath(LEVEL + (tea ? 6 : 28), 26, 420, -700, 1400, LEVEL + (tea ? 6 : 28)).replace(/ L.*$/, "")}
                className={tea ? "liq-shine-tea" : "liq-shine-coffee"}
                fill="none"
                strokeWidth={5}
                strokeLinecap="round"
                animate={{ x: [-420, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />

              {tea &&
                [
                  { cx: 430, d: 0, r: -20 },
                  { cx: 560, d: 1.1, r: 35 },
                ].map((l) => (
                  <motion.path
                    key={l.cx}
                    d="M0 0C10 -18 34 -22 52 -14C38 4 16 8 0 0Z"
                    className="liq-leaf"
                    initial={{ x: l.cx, y: LEVEL - 8, rotate: l.r }}
                    animate={{ y: [LEVEL - 8, LEVEL - 26, LEVEL - 8], rotate: [l.r, l.r + 18, l.r] }}
                    transition={{ duration: 3, delay: l.d, repeat: Infinity, ease: "easeInOut" }}
                  />
                ))}
            </motion.g>
          </motion.g>

          {/* Rising bubbles */}
          {[0, 1, 2, 3, 4].map((i) => {
            const cx = tea ? 420 + i * 55 : 120 + i * 60;
            return (
              <motion.circle
                key={i}
                cx={cx}
                r={6 + (i % 3) * 3}
                className={tea ? "liq-bubble-tea" : "liq-bubble-coffee"}
                initial={{ cy: 900, opacity: 0 }}
                animate={{ cy: [900, LEVEL + 60], opacity: [0, 0.8, 0] }}
                transition={{ duration: 2.6 + i * 0.35, delay: i * 0.6, repeat: Infinity, ease: "easeIn" }}
              />
            );
          })}

          {flood && <motion.polygon points={tri} className={tea ? "rh-flood-tea" : "rh-flood-coffee"} style={{ opacity: flood }} />}
        </g>

        {/* Gold outline travels with the triangle */}
        <motion.polygon
          points={tri}
          className="cup-outline"
          fill="none"
          strokeWidth={3}
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 0.2, ease: EASE }}
        />
      </svg>

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
