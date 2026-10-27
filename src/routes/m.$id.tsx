import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  CircleDashed,
  Coffee,
  GlassWater,
  Leaf,
  MapPin,
  Quote,
  Star,
  Store,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { MasterCard } from "@/components/MasterCard";
import { FullScreenBrew } from "@/components/BrewLoader";
import { ShareProfile } from "@/components/ShareProfile";
import { WalletWidget } from "@/components/WalletWidget";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { masterQuery } from "@/lib/master-query";
import {
  categoryLabel,
  followersLabel,
  initials,
  myMasterQuery,
  yearsLabel,
  type MasterDetail,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useMode } from "@/lib/mode";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/m/$id")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(masterQuery(params.id));
    if (!data) throw notFound();
    return { name: data.master.name, title: data.master.title, workplace: data.master.workplace, city: data.master.city, bio: data.master.bio, avatar: data.master.avatar_url };
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return { meta: [{ title: "Мастер недоступен" }, { name: "robots", content: "noindex" }] };
    const title = `${loaderData.name} — ${loaderData.title || "Мастер"}`;
    const description =
      [loaderData.workplace, loaderData.city].filter(Boolean).join(", ") +
      (loaderData.bio ? `. ${loaderData.bio}` : "");
    const meta = [
      { title },
      { name: "description", content: description.slice(0, 160) },
      { property: "og:title", content: title },
      { property: "og:description", content: description.slice(0, 200) },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (loaderData.avatar?.startsWith("https://")) {
      meta.push({ property: "og:image", content: loaderData.avatar });
      meta.push({ name: "twitter:image", content: loaderData.avatar });
    }
    return { meta };
  },
  pendingMs: 100,
  pendingComponent: PendingProfile,
  notFoundComponent: () => (
    <div className="min-h-screen">
      <AppHeader />
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Мастер не найден</h1>
        <p className="mt-2 text-muted-foreground">Возможно, карточку удалили или скрыли.</p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/masters">К мастерам</Link>
        </Button>
      </div>
    </div>
  ),
  component: Profile,
});

function PendingProfile() {
  const { mode } = useMode();
  return (
    <div className="min-h-screen">
      <AppHeader />
      <FullScreenBrew mode={mode} label="Открываем визитку…" />
    </div>
  );
}

function Profile() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(masterQuery(id));
  const { setMode } = useMode();
  const kind = data?.master.kind;
  useEffect(() => {
    if (kind) setMode(kind as "tea" | "coffee");
  }, [kind, setMode]);
  if (!data) return null;
  return <ProfileBody d={data} />;
}

function Section({
  icon: Icon,
  title,
  children,
  hint,
}: {
  icon: typeof Trophy;
  title: string;
  hint?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card/60 p-5 sm:p-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
          <Icon className="size-5 text-primary" /> {title}
        </h2>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function ProfileBody({ d }: { d: MasterDetail }) {
  const { master: m } = d;
  const KindIcon = m.kind === "tea" ? Leaf : Coffee;
  const avg = d.reviews.length
    ? d.reviews.reduce((s, r) => s + r.rating, 0) / d.reviews.length
    : null;
  const verified = d.achievements.filter((a) => a.verified);
  const selfAdded = d.achievements.filter((a) => !a.verified);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 pt-6 pb-24">
        <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div className="space-y-3">
            <div style={{ containerType: "inline-size" }}>
              <MasterCard master={m} verifiedCount={verified.length} />
            </div>
            <WalletWidget
              kind={m.kind === "tea" ? "tea" : "coffee"}
              masterId={m.id}
              workplace={m.workplace}
            />
          </div>
          <div>
            <div className="flex items-center gap-4">
              <div className="size-16 shrink-0 overflow-hidden rounded-full border-2 border-primary/50 bg-muted">
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt={m.name} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center font-display text-xl">
                    {initials(m.name)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-3xl leading-tight font-semibold">{m.name}</h1>
                <p className="flex items-center gap-1.5 text-sm text-primary">
                  <KindIcon className="size-4" /> {m.title || (m.kind === "tea" ? "Чайный мастер" : "Бариста")}
                </p>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
              <Stat label="в профессии" value={yearsLabel(m.years_experience)} />
              <Stat label="поклонников" value={String(d.followers)} />
              <Stat label="оценка гостей" value={avg ? avg.toFixed(1) : "—"} />
            </dl>
            {(m.workplace || m.city) && (
              <p className="mt-4 flex items-center gap-2 text-sm">
                <MapPin className="size-4 text-muted-foreground" />
                <span>
                  Работает в <b className="font-semibold">{m.workplace || "—"}</b>
                  {m.city && <span className="text-muted-foreground">, {m.city}</span>}
                </span>
              </p>
            )}
            {m.bio && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{m.bio}</p>}
            <div className="mt-5 flex flex-wrap gap-2">
              <FollowButton masterId={m.id} ownerId={m.user_id} />
              <ShareProfile masterId={m.id} name={m.name} />
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Section icon={GlassWater} title="Авторские напитки">
              {d.drinks.length === 0 ? (
                <Empty>Мастер пока не добавил свои напитки.</Empty>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {d.drinks.map((dr) => (
                    <li key={dr.id} className="rounded-xl border bg-background/40 p-4">
                      <div className="font-display text-lg">{dr.name}</div>
                      {dr.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{dr.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          <div className="md:col-span-2">
            <Section
              icon={Trophy}
              title="Достижения"
              hint={`${verified.length} подтверждено · ${selfAdded.length} указано мастером`}
            >
              {d.achievements.length === 0 ? (
                <Empty>Достижений пока нет.</Empty>
              ) : (
                <ul className="divide-y">
                  {[...verified, ...selfAdded].map((a) => (
                    <li key={a.id} className="flex items-start justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <div className="font-medium">
                          {a.title}
                          {a.place && <span className="text-primary"> · {a.place}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {categoryLabel(a.category)}
                          {a.year ? ` · ${a.year}` : ""}
                          {a.description ? ` · ${a.description}` : ""}
                        </div>
                      </div>
                      {a.verified ? (
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-verified/15 px-2.5 py-1 text-xs font-medium text-verified">
                          <BadgeCheck className="size-3.5" /> Подтверждено
                        </span>
                      ) : (
                        <span className="flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                          <CircleDashed className="size-3.5" /> Указано мастером
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          <Section icon={Quote} title="Признание коллег">
            {d.endorsements.filter((e) => e.author).length === 0 ? (
              <Empty>Коллеги ещё не оставили слов о мастере.</Empty>
            ) : (
              <ul className="space-y-4">
                {d.endorsements
                  .filter((e) => e.author)
                  .map((e) => (
                    <li key={e.id}>
                      <p className="text-sm leading-relaxed">«{e.text}»</p>
                      <Link
                        to="/m/$id"
                        params={{ id: e.author!.id }}
                        className="mt-1.5 inline-block text-xs text-primary hover:underline"
                      >
                        — {e.author!.name}, {e.author!.title}
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
            <EndorseForm targetId={m.id} already={d.endorsements.map((e) => e.author_master_id)} />
          </Section>

          <Section icon={Star} title="Отзывы гостей" hint={avg ? `★ ${avg.toFixed(1)} · ${d.reviews.length}` : undefined}>
            {d.reviews.length === 0 ? (
              <Empty>Отзывов пока нет — будьте первым.</Empty>
            ) : (
              <ul className="space-y-4">
                {d.reviews.map((r) => (
                  <li key={r.id}>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold">{r.author_name}</span>
                      <Stars n={r.rating} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{r.text}</p>
                  </li>
                ))}
              </ul>
            )}
            <ReviewForm masterId={m.id} ownerId={m.user_id} />
          </Section>

          <div className="md:col-span-2">
            <Section icon={Store} title={m.kind === "tea" ? "Советует чайные" : "Советует кофейни"}>
              {d.cafes.length === 0 ? (
                <Empty>Пока без рекомендаций.</Empty>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {d.cafes.map((c) => (
                    <li key={c.id} className="rounded-xl border bg-background/40 p-4">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.city}
                        {c.note ? ` · ${c.note}` : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card/60 px-2 py-3">
      <dd className="font-display text-xl font-semibold">{value}</dd>
      <dt className="text-[0.65rem] tracking-wider text-muted-foreground uppercase">{label}</dt>
    </div>
  );
}

function Stars({ n, onPick }: { n: number; onPick?: (n: number) => void }) {
  return (
    <span className="flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!onPick}
          onClick={() => onPick?.(i)}
          aria-label={onPick ? `${i} из 5` : undefined}
          className={cn("disabled:cursor-default", i <= n ? "text-primary" : "text-muted-foreground/40")}
        >
          <Star className={cn(onPick ? "size-5" : "size-3", i <= n && "fill-current")} />
        </button>
      ))}
    </span>
  );
}

function SignInHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 border-t pt-4 text-sm text-muted-foreground">
      <Link to="/auth" className="font-medium text-primary hover:underline">
        Войдите
      </Link>
      , {children}
    </p>
  );
}

function FollowButton({ masterId, ownerId }: { masterId: string; ownerId: string | null }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const followQ = useQuery({
    queryKey: ["follow", masterId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("follows")
        .select("master_id")
        .eq("master_id", masterId)
        .eq("follower_id", user!.id)
        .maybeSingle();
      return !!data;
    },
  });
  const toggle = useMutation({
    mutationFn: async (follow: boolean) => {
      if (follow) {
        const { error } = await supabase.from("follows").insert({ master_id: masterId, follower_id: user!.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("follows").delete().eq("master_id", masterId).eq("follower_id", user!.id);
        if (error) throw error;
      }
    },
    onSuccess: (_, follow) => {
      toast.success(follow ? "Вы подписались на мастера" : "Подписка отменена");
      qc.invalidateQueries({ queryKey: ["follow", masterId] });
      qc.invalidateQueries({ queryKey: ["master", masterId] });
      qc.invalidateQueries({ queryKey: ["masters"] });
      qc.invalidateQueries({ queryKey: ["my-follows"] });
    },
    onError: () => toast.error("Не получилось, попробуйте ещё раз"),
  });

  if (!user)
    return (
      <Button asChild className="rounded-full">
        <Link to="/auth">
          <Users /> Подписаться
        </Link>
      </Button>
    );
  if (ownerId === user.id)
    return (
      <Button asChild variant="secondary" className="rounded-full">
        <Link to="/me">Редактировать визитку</Link>
      </Button>
    );
  const following = followQ.data;
  return (
    <Button
      className="rounded-full"
      variant={following ? "secondary" : "default"}
      disabled={toggle.isPending || followQ.isPending}
      onClick={() => toggle.mutate(!following)}
    >
      <Users /> {following ? "Вы подписаны" : "Подписаться"}
    </Button>
  );
}

function ReviewForm({ masterId, ownerId }: { masterId: string; ownerId: string | null }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const send = useMutation({
    mutationFn: async () => {
      const { data: prof } = await supabase.from("profiles").select("display_name").eq("id", user!.id).maybeSingle();
      const { error } = await supabase.from("guest_reviews").insert({
        master_id: masterId,
        author_id: user!.id,
        author_name: prof?.display_name || user!.email?.split("@")[0] || "Гость",
        rating,
        text: text.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setText("");
      toast.success("Спасибо за отзыв!");
      qc.invalidateQueries({ queryKey: ["master", masterId] });
    },
    onError: () => toast.error("Не удалось отправить отзыв"),
  });
  if (!user) return <SignInHint>чтобы оставить отзыв.</SignInHint>;
  if (ownerId === user.id) return null;
  return (
    <form
      className="mt-5 space-y-3 border-t pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) send.mutate();
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Ваш отзыв</span>
        <Stars n={rating} onPick={setRating} />
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={1000}
        placeholder="Что вам запомнилось?"
        rows={3}
      />
      <Button type="submit" size="sm" className="rounded-full" disabled={!text.trim() || send.isPending}>
        Отправить
      </Button>
    </form>
  );
}

function EndorseForm({ targetId, already }: { targetId: string; already: string[] }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: mine } = useQuery(myMasterQuery(user?.id));
  const [text, setText] = useState("");
  const send = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("peer_endorsements")
        .insert({ master_id: targetId, author_master_id: mine!.id, text: text.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setText("");
      toast.success("Ваши слова опубликованы");
      qc.invalidateQueries({ queryKey: ["master", targetId] });
    },
    onError: () => toast.error("Не удалось отправить"),
  });
  if (!user || !mine || mine.id === targetId || already.includes(mine.id)) return null;
  return (
    <form
      className="mt-5 space-y-3 border-t pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) send.mutate();
      }}
    >
      <span className="text-sm font-medium">Слово коллеги</span>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={1000}
        placeholder="За что вы уважаете этого мастера?"
        rows={3}
      />
      <Button type="submit" size="sm" className="rounded-full" disabled={!text.trim() || send.isPending}>
        Опубликовать как {mine.name}
      </Button>
    </form>
  );
}
