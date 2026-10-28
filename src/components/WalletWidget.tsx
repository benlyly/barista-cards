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

export function WalletWidget({ kind, masterId, workplace }: Props) {
  const [open, setOpen] = useState(false);
  const days = useMemo(() => sampleWeek(masterId, workplace), [masterId, workplace]);
  const today = days[0];
  const summary = todaySummary(days);

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
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left cursor-pointer"
      >
        <span className="relative flex size-2.5 shrink-0">
          {today?.working && (
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-60" />
          )}
          <span
            className={cn(
              "relative size-2.5 rounded-full",
              today?.working ? "bg-emerald-500" : "bg-zinc-600",
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
                  <motion.li
                    key={d.key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring, delay: 0.03 * i }}
                    onClick={() => console.log("Выбран сдвиг на дату:", d.date)}
                    className={cn(
                      "flex w-[6.5rem] shrink-0 snap-start flex-col rounded-xl border px-3 py-2.5 cursor-pointer pointer-events-auto",
                      d.isToday
                        ? "border-amber-500/40 bg-amber-500/5 shadow-[0_0_20px_-6px_rgba(245,158,11,0.2)]"
                        : "border-white/5 bg-zinc-900/20",
                      !d.working && "opacity-40",
                    )}
                  >
                    <div className="flex items-baseline justify-between w-full">
                      <span className={cn("text-xs font-semibold tracking-widest", d.isToday ? "text-amber-500" : "text-zinc-300")}>
                        {d.weekday}
                      </span>
                      <span className="text-[0.65rem] text-zinc-500">{d.date}</span>
                    </div>
                    {d.working ? (
                      <>
                        <span className="mt-2 truncate text-sm font-medium text-zinc-200" title={d.place ?? ""}>
                          {d.place}
                        </span>
                        <span className="mt-0.5 text-[0.7rem] tabular-nums text-zinc-500">
                          {d.hours}
                        </span>
                      </>
                    ) : (
                      <span className="mt-2 text-sm text-zinc-600">Выходной</span>
                    )}
                  </motion.li>
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
