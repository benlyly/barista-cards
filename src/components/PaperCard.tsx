import { QRCodeSVG } from "qrcode.react";
import { yearsLabel, type Master } from "@/lib/api";
import type { Mode } from "@/lib/mode";
import { CoffeeBeanMark, TeaLeafMark } from "@/components/BrandMarks";
import { cn } from "@/lib/utils";

export type PaperMaster = Pick<Master, "name" | "title" | "workplace" | "city" | "years_experience">;

/** Printed business card side, 90×50 mm. Text sizes use cqw, so it scales on screen and prints true to size. */
function Sheet({ kind, children, label }: { kind: Mode; children: React.ReactNode; label: string }) {
  return (
    <figure className="paper-side flex flex-col gap-2">
      <figcaption className="text-xs tracking-[0.2em] uppercase text-muted-foreground print:text-[8pt]">
        {label}
      </figcaption>
      <div data-kind={kind} className="paper-card relative overflow-hidden" style={{ containerType: "inline-size" }}>
        {children}
      </div>
    </figure>
  );
}

function Mark({ kind, className }: { kind: Mode; className?: string }) {
  return kind === "tea" ? <TeaLeafMark className={className} /> : <CoffeeBeanMark className={className} />;
}

export function PaperCardFront({ kind, master }: { kind: Mode; master: PaperMaster | null }) {
  const sample = !master;
  const place = [master?.workplace, master?.city].filter(Boolean).join(" · ");
  return (
    <Sheet kind={kind} label="Лицевая сторона">
      <div className="absolute inset-0 flex flex-col justify-between p-[7cqw]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[1.5cqw] text-[var(--pc-accent)]">
            <Mark kind={kind} className="size-[6.5cqw]" />
            <span className="font-display text-[3.4cqw] font-semibold tracking-[0.28em] uppercase">
              Мастер
            </span>
          </div>
          {sample && (
            <span className="rounded-full border border-[var(--pc-rule)] px-[2cqw] py-[0.4cqw] text-[2.4cqw] tracking-[0.2em] uppercase text-[var(--pc-muted)]">
              Образец
            </span>
          )}
        </div>

        <div>
          <div className="font-display text-[8.4cqw] leading-[1.05] font-semibold text-[var(--pc-ink)]">
            {master?.name || "Ваше имя"}
          </div>
          <div className="mt-[1.5cqw] text-[2.7cqw] tracking-[0.24em] uppercase text-[var(--pc-muted)]">
            {master?.title || (kind === "tea" ? "Чайный мастер" : "Бариста")}
          </div>
        </div>

        <div className="flex items-end justify-between gap-[3cqw] border-t border-[var(--pc-rule)] pt-[2.5cqw] text-[2.7cqw] text-[var(--pc-ink)]">
          <span className="min-w-0 truncate">{place || "Место работы · Город"}</span>
          <span className="shrink-0 text-[var(--pc-muted)]">
            {master ? `${yearsLabel(master.years_experience)} в профессии` : "Стаж в профессии"}
          </span>
        </div>
      </div>
    </Sheet>
  );
}

export function PaperCardBack({
  kind,
  url,
  sample,
}: {
  kind: Mode;
  /** Real public profile link. Null renders a clearly marked placeholder instead of a QR code. */
  url: string | null;
  sample: boolean;
}) {
  const shortUrl = url?.replace(/^https?:\/\//, "");
  return (
    <Sheet kind={kind} label="Оборот">
      <div className="absolute inset-0 grid grid-cols-[38%_1fr] gap-[6cqw] p-[7cqw]">
        <div className="flex flex-col justify-center">
          {url ? (
            <div className="aspect-square w-full bg-[var(--pc-paper)]">
              <QRCodeSVG
                value={url}
                size={256}
                marginSize={0}
                level="M"
                bgColor="transparent"
                fgColor="currentColor"
                className="size-full text-[var(--pc-ink)]"
                title="QR-код профиля мастера"
              />
            </div>
          ) : (
            <div className="paper-qr-placeholder flex aspect-square w-full flex-col items-center justify-center gap-[1cqw] p-[2cqw] text-center">
              <span className="text-[2.6cqw] font-semibold tracking-[0.18em] uppercase text-[var(--pc-ink)]">
                Место для QR
              </span>
              <span className="text-[2.2cqw] leading-snug text-[var(--pc-muted)]">
                {sample ? "образец, кода нет" : "появится после публикации"}
              </span>
            </div>
          )}
        </div>

        <div className={cn("flex min-w-0 flex-col justify-between text-[var(--pc-ink)]")}>
          <div>
            <div className="text-[2.4cqw] tracking-[0.24em] uppercase text-[var(--pc-accent)]">Гостям</div>
            <p className="mt-[1cqw] text-[3cqw] leading-snug">
              Наведите камеру — откроется профиль мастера: награды, авторские напитки и любимые места.
            </p>
          </div>
          <div className="border-t border-[var(--pc-rule)] pt-[2cqw]">
            <div className="text-[2.4cqw] tracking-[0.24em] uppercase text-[var(--pc-accent)]">
              {kind === "tea" ? "Чайным мастерам" : "Бариста"}
            </div>
            <p className="mt-[1cqw] text-[2.7cqw] leading-snug text-[var(--pc-muted)]">
              Соберите свою визитку в «Мастер» — гости будут следить за вашей работой.
            </p>
          </div>
          <div className="truncate text-[2.2cqw] tracking-wide text-[var(--pc-muted)]">
            {shortUrl ?? "ссылка на профиль — после публикации"}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
