import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { animate, motion, useMotionValue, useTransform, AnimatePresence } from "motion/react";
import { ArrowRight } from "lucide-react";
import splashTea from "@/assets/splash-tea.jpg";
import splashCoffee from "@/assets/splash-coffee.jpg";
import { modeFromSwipe, useMode, type Mode } from "@/lib/mode";
import { useAuth } from "@/lib/auth";
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
const rise = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1.1, delay, ease: EASE },
});

/* Rhombus geometry (SVG units). Sharp corners point left and right. */
const W = 1400;
const H = 1000;
const PAD = 120;
const VB_W = W + PAD * 2;
const VB_H = H + PAD * 2;
const RHOMB = `0,${H / 2} ${W / 2},0 ${W},${H / 2} ${W / 2},${H}`;
const LEFT = `0,${H / 2} ${W / 2},0 ${W / 2},${H}`;
const RIGHT = `${W / 2},0 ${W},${H / 2} ${W / 2},${H}`;
const INSET = 26;
const RHOMB_INNER = `${INSET * 1.4},${H / 2} ${W / 2},${INSET} ${W - INSET * 1.4},${H / 2} ${W / 2},${H - INSET}`;
const pct = (v: number, total: number) => `${(((v + PAD) / total) * 100).toFixed(3)}%`;
const clipLeft = `polygon(${pct(0, VB_W)} 50%, 50% ${pct(0, VB_H)}, 50% ${pct(H, VB_H)})`;
const clipRight = `polygon(50% ${pct(0, VB_H)}, ${pct(W, VB_W)} 50%, 50% ${pct(H, VB_H)})`;

function Splash() {
  const { setMode } = useMode();
  const { user } = useAuth();
  const navigate = useNavigate();
  const x = useMotionValue(0);
  const scale = useMotionValue(1);
  const flood = useMotionValue(0);
  const tilt = useTransform(x, [-200, 0, 200], [-4, 0, 4]);
  const teaOpacity = useTransform(x, [-140, 0, 140], [0.35, 1, 1]);
  const coffeeOpacity = useTransform(x, [-140, 0, 140], [1, 1, 0.35]);
  const chromeOpacity = useTransform(x, [-160, 0, 160], [0.4, 1, 0.4]);
  const start = useRef<number | null>(null);
  const lock = useRef(false);
  const [chosen, setChosen] = useState<Mode | null>(null);

  /** dir: -1 floats left, 1 floats right. */
  const choose = (m: Mode, dir: -1 | 1 = m === "tea" ? -1 : 1) => {
    if (lock.current) return;
    lock.current = true;
    setChosen(m);
    setMode(m);
    const w = typeof window !== "undefined" ? window.innerWidth : 1000;
    animate(x, dir * w * 0.7, { duration: 1.2, ease: [0.65, 0, 0.35, 1] });
    animate(scale, 0.72, { duration: 1.2, ease: [0.65, 0, 0.35, 1] });
    animate(flood, 0.9, { duration: 0.7, ease: "easeOut" });
    setTimeout(() => navigate({ to: "/masters" }), 2700);
  };

  const sideOf = (clientX: number): Mode => (clientX < window.innerWidth / 2 ? "tea" : "coffee");

  const onDown = (e: React.PointerEvent<HTMLElement>) => {
    if (lock.current) return;
    start.current = e.clientX;
  };
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse" && !lock.current) {
      e.currentTarget.dataset["side"] = sideOf(e.clientX);
    }
    if (start.current === null || lock.current) return;
    x.set((e.clientX - start.current) * 0.6);
  };
  const onUp = (e: React.PointerEvent<HTMLElement>) => {
    if (start.current === null) return;
    const dx = e.clientX - start.current;
    start.current = null;
    const m = modeFromSwipe(dx, 80);
    if (m) choose(m, dx > 0 ? 1 : -1);
    else if (Math.abs(dx) < 6) choose(sideOf(e.clientX));
    else animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
  };
  const onLeave = (e: React.PointerEvent<HTMLElement>) => {
    delete e.currentTarget.dataset["side"];
  };
  const stop = {
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    onPointerUp: (e: React.PointerEvent) => e.stopPropagation(),
  };

  return (
    <main
      className="splash-root relative flex h-[100svh] w-full touch-none flex-col items-center justify-between overflow-hidden px-4 py-[6svh] select-none"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={onLeave}
    >
      <div className="splash-glow pointer-events-none absolute inset-0" />
      <div className="splash-vignette pointer-events-none absolute inset-0" />
      <div className="splash-grain pointer-events-none absolute inset-0" />

      {/* Frame */}
      <motion.div
        className="splash-frame pointer-events-none absolute inset-3 z-10 sm:inset-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, delay: 0.5 }}
      />

      {/* Crest */}
      <motion.header
        className="pointer-events-none relative z-10 flex flex-col items-center text-center"
        style={{ opacity: chromeOpacity }}
      >
        <motion.div
          {...rise(0.2)}
          className="flex size-10 items-center justify-center rounded-full border border-gold/60 sm:size-12"
        >
          <span className="font-display text-xl text-gold italic sm:text-2xl">М</span>
        </motion.div>
        <motion.h1
          {...rise(0.35)}
          className="mt-3 pl-[0.5em] font-display text-3xl font-medium tracking-[0.5em] uppercase sm:text-5xl"
        >
          Мастер
        </motion.h1>
        <motion.div {...rise(0.5)} className="mt-2 flex items-center gap-2 sm:gap-3">
          <span className="splash-rule h-px w-5 sm:w-14" />
          <span className="text-[0.55rem] whitespace-nowrap tracking-[0.2em] text-gold/90 uppercase sm:text-[0.7rem] sm:tracking-[0.35em]">
            клуб бариста и чайных мастеров
          </span>
          <span className="splash-rule h-px w-5 sm:w-14" />
        </motion.div>
      </motion.header>

      {/* Rhombus + labels */}
      <div className="relative z-10 grid w-full max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-x-3 px-3 sm:gap-x-8 sm:px-6">
        <motion.div
          className="splash-rh relative order-first col-span-3 justify-self-center sm:order-2 sm:col-span-1"
          style={{ x, rotate: tilt, scale }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: 0.4, ease: EASE }}
        >
          <Rhombus teaOpacity={teaOpacity} coffeeOpacity={coffeeOpacity} flood={flood} chosen={chosen} />
          <button
            type="button"
            aria-label="Выбрать чай"
            onClick={() => choose("tea")}
            className="absolute inset-0 focus-visible:outline-none"
            style={{ clipPath: clipLeft }}
          />
          <button
            type="button"
            aria-label="Выбрать кофе"
            onClick={() => choose("coffee")}
            className="absolute inset-0 focus-visible:outline-none"
            style={{ clipPath: clipRight }}
          />
        </motion.div>

        <motion.div className="order-2 justify-self-start sm:order-1 sm:justify-self-end" style={{ opacity: chromeOpacity }}>
          <Label
            align="left"
            eyebrow="Чайное искусство"
            title="Чай"
            hint="вправо →"
            onChoose={() => choose("tea")}
            stop={stop}
          />
        </motion.div>
        <motion.div className="order-3 sm:hidden" style={{ opacity: chromeOpacity }}>
          <motion.div
            {...rise(1)}
            className="splash-medallion flex size-11 items-center justify-center rounded-full"
          >
            <span className="font-display text-base text-gold italic">или</span>
          </motion.div>
        </motion.div>
        <motion.div className="order-4 justify-self-end sm:order-3 sm:justify-self-start" style={{ opacity: chromeOpacity }}>
          <Label
            align="right"
            eyebrow="Кофейное ремесло"
            title="Кофе"
            hint="← влево"
            onChoose={() => choose("coffee")}
            stop={stop}
          />
        </motion.div>
      </div>

      {/* Invitation for masters */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-2.5 text-center"
        style={{ opacity: chromeOpacity }}
      >
        <motion.p {...rise(1.1)} className="font-display text-base text-foreground/80 italic sm:text-lg">
          Вы мастер своего дела?
        </motion.p>
        <motion.div {...rise(1.25)}>
          <Link
            to={user ? "/me" : "/auth"}
            {...stop}
            className="splash-cta inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[0.7rem] font-semibold tracking-[0.25em] text-gold uppercase"
          >
            Получить именную визитку <ArrowRight className="size-3.5" />
          </Link>
        </motion.div>
        <motion.div {...rise(1.4)}>
          <Link
            to="/masters"
            {...stop}
            className="text-[0.7rem] tracking-[0.15em] text-foreground/55 underline-offset-4 hover:text-foreground hover:underline"
          >
            Сразу к мастерам
          </Link>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {chosen && (
          <motion.div
            className="splash-veil absolute inset-0 z-20 flex items-center justify-center"
            data-kind={chosen}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <BrewLoader mode={chosen} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Rhombus({
  teaOpacity,
  coffeeOpacity,
  flood,
  chosen,
}: {
  teaOpacity: ReturnType<typeof useMotionValue<number>>;
  coffeeOpacity: ReturnType<typeof useMotionValue<number>>;
  flood: ReturnType<typeof useMotionValue<number>>;
  chosen: Mode | null;
}) {
  const splash = {
    animate: { scale: [1, 1.04, 1], y: [0, -8, 0] },
    transition: { duration: 7, repeat: Infinity, ease: "easeInOut" as const },
    style: { transformBox: "fill-box" as const, transformOrigin: "center" },
  };
  return (
    <svg viewBox={`${-PAD} ${-PAD} ${VB_W} ${VB_H}`} className="block h-auto w-full overflow-visible" aria-hidden>
      <defs>
        <clipPath id="rh-left">
          <polygon points={LEFT} />
        </clipPath>
        <clipPath id="rh-right">
          <polygon points={RIGHT} />
        </clipPath>
        <clipPath id="rh-all">
          <polygon points={RHOMB} />
        </clipPath>
      </defs>

      {/* Splashing tea — left half */}
      <motion.g className="rh-half" data-side="tea" clipPath="url(#rh-left)" style={{ opacity: teaOpacity }}>
        <rect x={0} y={0} width={W / 2} height={H} className="fill-background" />
        <motion.image
          href={splashTea}
          x={-30}
          y={-20}
          width={W / 2 + 60}
          height={H + 40}
          preserveAspectRatio="xMaxYMid slice"
          {...splash}
        />
      </motion.g>

      {/* Splashing coffee — right half */}
      <motion.g className="rh-half" data-side="coffee" clipPath="url(#rh-right)" style={{ opacity: coffeeOpacity }}>
        <rect x={W / 2} y={0} width={W / 2} height={H} className="fill-background" />
        <motion.image
          href={splashCoffee}
          x={W / 2 - 30}
          y={-20}
          width={W / 2 + 60}
          height={H + 40}
          preserveAspectRatio="xMinYMid slice"
          {...splash}
          transition={{ ...splash.transition, delay: 1.5 }}
        />
      </motion.g>

      {/* Colour flood when chosen */}
      <motion.polygon
        points={RHOMB}
        className={chosen === "tea" ? "rh-flood-tea" : "rh-flood-coffee"}
        style={{ opacity: flood }}
      />

      {/* Gold line work */}
      <g className="rh-lines" fill="none" strokeLinejoin="round" strokeLinecap="round">
        <motion.polygon
          points={RHOMB}
          strokeWidth={3}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.2, delay: 0.3, ease: EASE }}
        />
        <polygon points={RHOMB_INNER} strokeWidth={1.2} opacity={0.45} />
        <line x1={W / 2} y1={0} x2={W / 2} y2={H} strokeWidth={1.6} opacity={0.7} />
        {/* travelling glint */}
        <motion.polygon
          points={RHOMB}
          pathLength={1}
          strokeWidth={4}
          className="rh-glint"
          strokeDasharray="0.06 0.94"
          animate={{ strokeDashoffset: [0, -1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "linear", delay: 2.5 }}
        />
      </g>

      {/* Ornaments, after the reference: sparkles above, orbits below */}
      <g className="rh-ornament" fill="none" strokeWidth={2}>
        <Sparkle cx={W / 2} cy={-62} r={22} />
        <Sparkle cx={W / 2 - 230} cy={-30} r={13} />
        <Sparkle cx={W / 2 + 230} cy={-30} r={13} />
        {[-150, -95, 95, 150].map((dx) => (
          <circle key={dx} cx={W / 2 + dx} cy={-70 + Math.abs(dx) * 0.2} r={3} className="rh-dot" />
        ))}
        <circle cx={140} cy={H + 50} r={5} className="rh-dot" />
        <circle cx={180} cy={H + 50} r={8} className="rh-dot" />
        <circle cx={240} cy={H + 50} r={20} />
        <line x1={212} y1={H + 22} x2={268} y2={H + 78} />
        <circle cx={W - 240} cy={H + 50} r={16} />
        <circle cx={W - 180} cy={H + 50} r={14} className="rh-dot" />
        <path
          d={`M${W / 2 - 70} ${H + 60} l23 -8 l23 8 l24 -8 l24 8 l23 -8 l23 8`}
          strokeWidth={2.4}
        />
      </g>
    </svg>
  );
}

function Sparkle({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <path
      d={`M${cx} ${cy - r}V${cy + r}M${cx - r} ${cy}H${cx + r}M${cx - r * 0.45} ${cy - r * 0.45}L${cx + r * 0.45} ${cy + r * 0.45}M${cx + r * 0.45} ${cy - r * 0.45}L${cx - r * 0.45} ${cy + r * 0.45}`}
      strokeLinecap="round"
    />
  );
}

function Label({
  align,
  eyebrow,
  title,
  hint,
  onChoose,
  stop,
}: {
  align: "left" | "right";
  eyebrow: string;
  title: string;
  hint: string;
  onChoose: () => void;
  stop: { onPointerDown: (e: React.PointerEvent) => void; onPointerUp: (e: React.PointerEvent) => void };
}) {
  const right = align === "right";
  return (
    <motion.button
      {...rise(right ? 0.95 : 0.85)}
      type="button"
      {...stop}
      onClick={onChoose}
      data-choice={right ? "coffee" : "tea"}
      className={
        right
          ? "group flex flex-col items-end text-right sm:items-start sm:text-left"
          : "group flex flex-col items-start text-left sm:items-end sm:text-right"
      }
    >
      <span className="text-[0.55rem] whitespace-nowrap tracking-[0.22em] text-gold uppercase sm:text-[0.7rem] sm:tracking-[0.35em]">
        {eyebrow}
      </span>
      <span className="mt-1 font-display text-5xl leading-none font-medium italic transition-colors group-hover:text-gold sm:text-7xl">
        {title}
      </span>
      <span className="mt-2 text-[0.6rem] tracking-[0.2em] text-foreground/50 uppercase sm:text-[0.65rem]">
        Войти <span className="tracking-normal normal-case">· {hint}</span>
      </span>
    </motion.button>
  );
}
