import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { sampleWeek, todaySummary } from "@/lib/schedule";
import { cn } from "@/lib/utils";

type Props = {
  kind: "tea" | "coffee";
  masterId: string;
  workplace: string | null;
};

const spring = { type: "spring", stiffness: 260, damping: 30, mass: 0.9 } as const;

// Премиальные люксовые темы под настроение профиля мастера (Чай / Кофе)
const THEME_ACCENTS = {
  coffee: { 
    todayBorder: "border-[rgba(225,140,55,0.45)]", 
    todayBg: "bg-[rgba(165,80,25,0.08)]", 
    todayGlow: "shadow-[0_0_20px_-6px_rgba(225,140,55,0.25)]", 
    textAccent: "text-[#dea05c]", 
    pulseGlow: "bg-[#dea05c]" 
  },
  tea: { 
    todayBorder: "border-[rgba(138,178,70,0.45)]", 
    todayBg: "bg-[rgba(138,178,70,0.06)]", 
    todayGlow: "shadow-[0_0_20px_-6px_rgba(138,178,70,0.25)]", 
    textAccent: "text-[#8ab246]", 
    pulseGlow: "bg-[#8ab246]" 
  },
};

export function WalletWidget({ kind, masterId, workplace }: Props) {
  const [open, setOpen] = useState(false);
  const days = useMemo(() => sampleWeek(masterId, workplace), [masterId, workplace]);
  const today = days[0];
  const summary = todaySummary(days);
  const activeTheme = THEME_ACCENTS[kind];

  return (
    <motion.div
      layout
      transition={spring}
      data-kind={kind}
      className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/40 backdrop-blur-md"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left cursor-pointer select-none"
      >
        <span className="relative flex size-2.5 shrink-0">
          {today?.working && (
            <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", activeTheme.pulseGlow)} />
          )}
          <span
            className={cn(
              "relative size-2.5 rounded-full",
              today?.working ? activeTheme.pulseGlow : "bg-zinc-600",
            )}
          />
        </span>
        <span className="min-w-0 flex-1 truncate text-[0.8rem] font-medium tracking-[0.08em] text-zinc-200 uppercase">
          {summary}
        </span>
        <span className="hidden shrink-0 rounded-full border border-white/5 px-2 py-0.5 text-[0.6rem] tracking-widest text-zinc-500 uppercase sm:inline">
          пример
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={spring} className="shrink-0">
          <ChevronDown className="size-4 text-zinc-500" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="week"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring}
          >
            <div className="border-t border-white/5 px-3 pt-3 pb-4" onPointerDown={(e) => e.stopPropagation()}>
              <ol className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {days.map((d, i) => (
                  <motion.button
                    key={d.key}
                    type="button"
                    // Превратили в настоящую кнопку, теперь клик гарантированно сработает
                    onClick={() => console.log("Выбран сдвиг на дату:", d.date)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring, delay: 0.03 * i }}
                    className={cn(
                      "flex w-[6.5rem] shrink-0 snap-start flex-col rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer pointer-events-auto",
                      d.isToday
                        ? cn(activeTheme.todayBorder, activeTheme.todayBg, activeTheme.todayGlow)
                        : "border-white/5 bg-zinc-900/20",
                      !d.working && "opacity-40",
                    )}
                  >
                    <div className="flex items-baseline justify-between w-full">
                      <span className={cn("text-xs font-semibold tracking-widest uppercase", d.isToday ? activeTheme.textAccent : "text-zinc-400")}>
                        {d.weekday}
                      </span>
                      <span className="text-[0.65rem] text-zinc-500 tabular-nums">{d.date}</span>
                    </div>
                    {d.working ? (
                      <>
                        <span className="mt-2 truncate text-sm font-medium text-zinc-200 w-full" title={d.place ?? ""}>
                          {d.place}
                        </span>
                        <span className="mt-0.5 text-[0.7rem] tabular-nums text-zinc-500">
                          {d.hours}
                        </span>
                      </>
                    ) : (
                      <span className="mt-2 text-sm font-medium text-zinc-600">Выходной</span>
                    )}
                  </motion.button>
                ))}
              </ol>
              <p className="mt-3 text-[0.68rem] text-zinc-500">
                Пример графика — скоро мастер сможет вести своё расписание сам.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
