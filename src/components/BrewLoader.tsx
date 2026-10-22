import { motion } from "motion/react";
import type { Mode } from "@/lib/mode";

/** Brewing animation: tea leaves steep and colour the water; coffee drips into a cup with crema. */
export function BrewLoader({ mode, label }: { mode: Mode; label?: string | undefined }) {
  return (
    <div className="flex flex-col items-center gap-6" role="status" aria-live="polite">
      {mode === "tea" ? <TeaBrew /> : <CoffeeBrew />}
      <p className="font-display text-lg text-muted-foreground italic">
        {label ?? (mode === "tea" ? "Завариваем чай…" : "Варим кофе…")}
      </p>
    </div>
  );
}

function Steam() {
  return (
    <div className="absolute -top-14 left-1/2 flex -translate-x-1/2 gap-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-10 w-1.5 rounded-full bg-foreground/30 blur-[2px]"
          initial={{ opacity: 0, y: 10, scaleY: 0.6 }}
          animate={{ opacity: [0, 0.8, 0], y: [10, -12, -26], scaleY: [0.6, 1, 1.2] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.45, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function TeaBrew() {
  return (
    <div className="relative mt-14">
      <Steam />
      <div className="brew-cup relative h-28 w-36 overflow-hidden rounded-b-[3rem] rounded-t-md border-2">
        <motion.div
          className="brew-tea absolute inset-x-0 bottom-0"
          initial={{ height: "35%", opacity: 0.15 }}
          animate={{ height: ["35%", "78%"], opacity: [0.15, 0.95] }}
          transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
        />
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="absolute size-3 rounded-[60%_10%_60%_10%] bg-tea"
            style={{ left: `${18 + i * 18}%` }}
            initial={{ top: "-15%", rotate: 0 }}
            animate={{ top: ["-15%", "70%"], rotate: [0, 160 + i * 40] }}
            transition={{ duration: 2.2, delay: i * 0.25, repeat: Infinity, ease: "easeIn" }}
          />
        ))}
      </div>
      <div className="brew-cup absolute top-6 -right-6 h-12 w-8 rounded-r-full border-2 border-l-0" />
      <div className="brew-cup mx-auto mt-2 h-2 w-48 rounded-full border" />
    </div>
  );
}

function CoffeeBrew() {
  return (
    <div className="relative mt-4 flex flex-col items-center">
      <div className="h-6 w-28 rounded-t-lg bg-muted" />
      <div className="flex gap-5">
        {[0, 1].map((i) => (
          <motion.span
            key={i}
            className="brew-coffee block w-1 rounded-full"
            initial={{ height: 0 }}
            animate={{ height: [0, 52, 52], opacity: [1, 1, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2, ease: "easeIn" }}
          />
        ))}
      </div>
      <div className="relative">
        <Steam />
        <div className="brew-cup relative h-24 w-28 overflow-hidden rounded-b-[2.5rem] rounded-t-sm border-2">
          <motion.div
            className="absolute inset-x-0 bottom-0 flex flex-col"
            initial={{ height: "8%" }}
            animate={{ height: ["8%", "82%"] }}
            transition={{ duration: 2.6, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
          >
            <div className="brew-crema h-3 shrink-0" />
            <div className="brew-coffee flex-1" />
          </motion.div>
        </div>
        <div className="brew-cup absolute top-5 -right-5 h-10 w-7 rounded-r-full border-2 border-l-0" />
      </div>
      <div className="brew-cup mt-2 h-2 w-40 rounded-full border" />
    </div>
  );
}

export function FullScreenBrew({ mode, label }: { mode: Mode; label?: string | undefined }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <BrewLoader mode={mode} label={label} />
    </div>
  );
}
