import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Info, Printer } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { PaperCardBack, PaperCardFront } from "@/components/PaperCard";
import { Button } from "@/components/ui/button";
import { myMasterQuery } from "@/lib/api";
import { masterQuery } from "@/lib/master-query";
import { useAuth } from "@/lib/auth";
import { useMode } from "@/lib/mode";
import { isPublicOrigin, printableProfileUrl } from "@/lib/print-card";

type Search = { id?: string };

export const Route = createFileRoute("/card")({
  validateSearch: (s: Record<string, unknown>): Search =>
    typeof s["id"] === "string" && /^[0-9a-f-]{36}$/i.test(s["id"]) ? { id: s["id"] } : {},
  head: () => ({
    meta: [
      { title: "Печатная визитка мастера — Мастер" },
      {
        name: "description",
        content:
          "Двусторонняя бумажная визитка бариста или чайного мастера с QR-кодом на профиль для гостей.",
      },
      { property: "og:title", content: "Печатная визитка мастера" },
      {
        property: "og:description",
        content: "Бумажная визитка с QR-кодом: гости открывают профиль мастера, мастера — создают свой.",
      },
    ],
  }),
  component: PrintCardPage,
});

function PrintCardPage() {
  const { id } = Route.useSearch();
  const { user } = useAuth();
  const { mode } = useMode();
  const mine = useQuery(myMasterQuery(user?.id));
  const byId = useQuery({ ...masterQuery(id ?? ""), enabled: !!id });

  const master = id ? (byId.data?.master ?? null) : (mine.data ?? null);
  const kind = master?.kind === "tea" || master?.kind === "coffee" ? master.kind : mode;

  const [origin, setOrigin] = useState<string | null>(null);
  useEffect(() => setOrigin(window.location.origin), []);
  const url = origin ? printableProfileUrl(origin, master?.id) : null;
  const isOwn = !!master && master.user_id === user?.id;

  return (
    <div className="min-h-screen">
      <div className="print:hidden">
        <AppHeader />
      </div>
      <main className="mx-auto max-w-5xl px-4 py-10 print:p-0">
        <div className="print:hidden">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">Для стойки и витрины</p>
          <h1 className="mt-2 font-display text-4xl font-semibold">Бумажная визитка</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Двусторонняя карточка 90 × 50 мм. Гость сканирует QR и попадает в профиль мастера, а бариста
            видят, где собрать свою визитку.
          </p>
        </div>

        <div className="print-sheet mt-8 grid gap-8 md:grid-cols-2 print:mt-0 print:flex print:flex-col print:gap-[8mm]">
          <PaperCardFront kind={kind} master={master} />
          <PaperCardBack kind={kind} url={url} sample={!master} />
        </div>

        <div className="mt-8 flex flex-col gap-4 print:hidden">
          <Notice master={!!master} url={url} isOwn={isOwn} loggedIn={!!user} origin={origin} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => window.print()} className="rounded-full">
              <Printer /> Распечатать
            </Button>
            {master && (
              <Button asChild variant="ghost" className="rounded-full">
                <Link to="/m/$id" params={{ id: master.id }}>
                  Открыть профиль
                </Link>
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Notice({
  master,
  url,
  isOwn,
  loggedIn,
  origin,
}: {
  master: boolean;
  url: string | null;
  isOwn: boolean;
  loggedIn: boolean;
  origin: string | null;
}) {
  let text: React.ReactNode;
  if (!master) {
    text = (
      <>
        Это образец: имя и QR-код здесь не настоящие.{" "}
        <Link to={loggedIn ? "/me" : "/auth"} className="text-primary underline-offset-4 hover:underline">
          Создайте свою карточку
        </Link>{" "}
        — и визитка заполнится вашими данными и QR-кодом на ваш профиль.
      </>
    );
  } else if (url) {
    text = (
      <>
        QR-код ведёт на {url}. Проверьте его камерой телефона перед печатью.
        {!isOwn && " Это визитка другого мастера — печатайте с его согласия."}
      </>
    );
  } else if (origin && !isPublicOrigin(origin)) {
    text =
      "Сейчас приложение открыто в предпросмотре — этот адрес доступен только вам, поэтому на визитке стоит место для QR. Опубликуйте приложение, и здесь появится настоящий QR-код профиля.";
  } else {
    text = "Готовим QR-код…";
  }
  return (
    <div className="flex max-w-2xl gap-3 rounded-2xl border bg-card/60 p-4 text-sm text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0 text-primary" />
      <p>{text}</p>
    </div>
  );
}
