import { Coffee, Leaf, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { initials, yearsLabel, type Master } from "@/lib/api";

type CardMaster = Pick<
  Master,
  "name" | "title" | "kind" | "workplace" | "city" | "years_experience" | "avatar_url" | "card_style"
>;

export function MasterCard({
  master,
  verifiedCount,
  className,
}: {
  master: CardMaster;
  verifiedCount?: number;
  className?: string;
}) {
  const KindIcon = master.kind === "tea" ? Leaf : Coffee;
  return (
    <div
      data-kind={master.kind}
      data-style={master.card_style}
      className={cn(
        "mcard relative aspect-[1.586/1] w-full overflow-hidden rounded-[1.25rem] select-none",
        className,
      )}
    >
      <div className="mcard-sheen pointer-events-none absolute inset-0" />
      <div className="relative flex h-full flex-col justify-between p-[6%]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mcard-emboss truncate font-display text-[clamp(1.05rem,4.6cqw,1.6rem)] leading-tight font-semibold">
              {master.name || "Ваше имя"}
            </div>
            <div className="mt-1 truncate text-[clamp(0.62rem,2.4cqw,0.8rem)] tracking-[0.18em] uppercase text-[var(--mc-muted)]">
              {master.title || "Должность"}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 text-[var(--mc-accent)]">
            <KindIcon className="size-4" />
            <span className="font-display text-xs tracking-[0.2em] uppercase">Мастер</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="mcard-chip h-[18%] min-h-7 aspect-[1.3/1] rounded-md" aria-hidden />
          <div className="aspect-square w-[clamp(3rem,22%,5.5rem)] overflow-hidden rounded-full border border-[var(--mc-muted)]/40 bg-[var(--mc-fg)]/10 shadow-lg">
            {master.avatar_url ? (
              <img
                src={master.avatar_url}
                alt={master.name}
                className="size-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex size-full items-center justify-center font-display text-lg text-[var(--mc-fg)]">
                {initials(master.name || "М")}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 text-[clamp(0.65rem,2.5cqw,0.85rem)]">
          <div className="min-w-0">
            <div className="truncate font-medium">{master.workplace || "Место работы"}</div>
            <div className="truncate text-[var(--mc-muted)]">{master.city || "Город"}</div>
          </div>
          <div className="shrink-0 text-right">
            {verifiedCount ? (
              <div className="mb-0.5 flex items-center justify-end gap-1 text-[var(--mc-accent)]">
                <BadgeCheck className="size-3.5" />
                <span>{verifiedCount}</span>
              </div>
            ) : null}
            <div className="text-[0.6rem] tracking-[0.16em] uppercase text-[var(--mc-muted)]">
              в профессии
            </div>
            <div className="font-display font-semibold">{yearsLabel(master.years_experience)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
