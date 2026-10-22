import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Plus, Search, Users, X } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { MasterCard } from "@/components/MasterCard";
import { BrewLoader } from "@/components/BrewLoader";
import { ShareProfile } from "@/components/ShareProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { followersLabel, mastersQuery, myMasterQuery, type MasterListItem } from "@/lib/api";
import { modeFromSwipe, useMode } from "@/lib/mode";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/masters")({
  head: () => ({
    meta: [
      { title: "Мастера — бариста и чайные мастера рядом с вами" },
      {
        name: "description",
        content:
          "Каталог визиток бариста и чайных мастеров: стаж, чемпионаты, авторские напитки, отзывы гостей.",
      },
      { property: "og:title", content: "Мастера — каталог бариста и чайных мастеров" },
      {
        property: "og:description",
        content: "Найдите своего бариста или чайного мастера и подпишитесь на него.",
      },
    ],
  }),
  component: Gallery,
});

function Gallery() {
  const { mode, setMode } = useMode();
  const { user } = useAuth();
  const { data, isPending, error } = useQuery(mastersQuery(mode));
  const { data: myMaster } = useQuery(myMasterQuery(user?.id));
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!data) return [];
    if (!s) return data;
    return data.filter((m) =>
      [m.name, m.title, m.city, m.workplace].some((f) => f.toLowerCase().includes(s)),
    );
  }, [data, q]);

  const open = list.find((m) => m.id === openId) ?? null;
  const createHref = user ? "/me" : "/auth";

  return (
    <div className="min-h-screen">
      <AppHeader />
      <motion.main
        className="mx-auto max-w-6xl px-4 pt-6 pb-24"
        style={{ touchAction: "pan-y" }}
        onPanEnd={(_, info) => {
          if (Math.abs(info.offset.x) < Math.abs(info.offset.y) * 1.5) return;
          const m = modeFromSwipe(info.offset.x, 90);
          if (m && m !== mode) setMode(m);
        }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">
              {mode === "tea" ? "Чайные мастера" : "Бариста"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Подписывайтесь на тех, у кого пьёте любимое
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Имя, город, заведение"
              className="rounded-full pl-9"
            />
          </div>
        </div>

        {!myMaster && (
          <Link
            to={createHref}
            className="group mt-6 flex items-center justify-between gap-4 rounded-2xl border border-primary/40 bg-primary/10 p-4 transition-colors hover:bg-primary/15 sm:p-5"
          >
            <div className="flex items-center gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Plus className="size-5" />
              </div>
              <div>
                <div className="font-display text-lg font-semibold">Создать свою карточку</div>
                <div className="text-sm text-muted-foreground">
                  Вы бариста или чайный мастер? Соберите визитку и приглашайте гостей.
                </div>
              </div>
            </div>
            <ArrowRight className="size-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
          </Link>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: mode === "tea" ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === "tea" ? 30 : -30 }}
            transition={{ duration: 0.3 }}
            className="mt-8"
          >
            {isPending ? (
              <div className="flex justify-center py-20">
                <BrewLoader mode={mode} />
              </div>
            ) : error ? (
              <p className="py-20 text-center text-muted-foreground">
                Не удалось загрузить мастеров. Обновите страницу.
              </p>
            ) : list.length === 0 ? (
              <p className="py-20 text-center text-muted-foreground">
                {q ? "Никого не нашли." : "Здесь пока пусто — станьте первым!"}
              </p>
            ) : (
              <ul className="flex flex-col md:grid md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                {list.map((m, i) => (
                  <li
                    key={m.id}
                    className={cn(
                      "relative transition-transform md:mt-0 md:hover:-translate-y-1",
                      i > 0 && "-mt-[38%] md:mt-0",
                    )}
                    style={{ zIndex: i }}
                  >
                    <button
                      onClick={() => setOpenId(m.id)}
                      className="block w-full rounded-[1.25rem] text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      aria-label={`Открыть визитку: ${m.name}`}
                    >
                      <motion.div layoutId={`card-${m.id}`} style={{ containerType: "inline-size" }}>
                        <MasterCard master={m} verifiedCount={m.verifiedCount} />
                      </motion.div>
                    </button>
                    {m.is_demo && (
                      <span className="absolute -top-2 right-4 z-10 rounded-full border bg-background px-2 py-0.5 text-[0.65rem] tracking-wider text-muted-foreground uppercase md:top-3 md:right-auto md:left-1/2 md:-translate-x-1/2 md:-translate-y-6">
                        пример
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </AnimatePresence>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Смахните влево — кофе, вправо — чай
        </p>
      </motion.main>

      <AnimatePresence>{open && <Enlarged m={open} onClose={() => setOpenId(null)} />}</AnimatePresence>
    </div>
  );
}

function Enlarged({ m, onClose }: { m: MasterListItem; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex justify-end">
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded-full border bg-card p-2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <motion.div layoutId={`card-${m.id}`} style={{ containerType: "inline-size" }}>
          <MasterCard master={m} verifiedCount={m.verifiedCount} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-5 rounded-2xl border bg-card p-5"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" /> {followersLabel(m.followers)}
          </div>
          {m.bio && <p className="mt-3 text-sm leading-relaxed">{m.bio}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild className="rounded-full">
              <Link to="/m/$id" params={{ id: m.id }}>
                Открыть профиль <ArrowRight />
              </Link>
            </Button>
            <ShareProfile masterId={m.id} name={m.name} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
