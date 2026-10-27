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
      className="overflow-hidden rounded-2xl border border-border bg-background/40 backdrop-blur-md"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="relative flex size-2.5 shrink-0">
          {today?.working && (
            <span className="absolute inset-0 animate-ping rounded-full bg-verified opacity-60" />
          )}
          <span
            className={cn(
              "relative size-2.5 rounded-full",
              today?.working ? "bg-verified" : "bg-muted-foreground/50",
            )}
          />
        </span>
        <span className="min-w-0 flex-1 truncate text-[0.8rem] font-medium tracking-[0.08em] text-foreground uppercase">
          {summary}
        </span>
        <span className="hidden shrink-0 rounded-full border border-border px-2 py-0.5 text-[0.6rem] tracking-widest text-muted-foreground uppercase sm:inline">
          пример
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={spring} className="shrink-0">
          <ChevronDown className="size-4 text-muted-foreground" />
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
            <div className="border-t border-border px-3 pt-3 pb-4">
              <ol className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
                {days.map((d, i) => (
                  <motion.li
                    key={d.key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring, delay: 0.03 * i }}
                    className={cn(
                      "flex w-[6.5rem] shrink-0 snap-start flex-col rounded-xl border px-3 py-2.5",
                      d.isToday
                        ? "border-primary/60 bg-primary/10 shadow-[0_0_24px_-6px_var(--primary)]"
                        : "border-border bg-card/40",
                      !d.working && "opacity-60",
                    )}
                  >
                    <div className="flex items-baseline justify-between">
                      <span
                        className={cn(
                          "text-xs font-semibold tracking-widest",
                          d.isToday ? "text-primary" : "text-foreground",
                        )}
                      >
                        {d.weekday}
                      </span>
                      <span className="text-[0.65rem] text-muted-foreground">{d.date}</span>
                    </div>
                    {d.working ? (
                      <>
                        <span className="mt-2 truncate text-sm font-medium text-foreground" title={d.place ?? ""}>
                          {d.place}
                        </span>
                        <span className="mt-0.5 text-[0.7rem] tabular-nums text-muted-foreground">
                          {d.hours}
                        </span>
                      </>
                    ) : (
                      <span className="mt-2 text-sm text-muted-foreground">Выходной</span>
                    )}
                  </motion.li>
                ))}
              </ol>
              <p className="mt-3 text-[0.68rem] text-muted-foreground">
                Пример графика — скоро мастер сможет вести своё расписание сам.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
