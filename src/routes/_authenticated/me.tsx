import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  BadgeCheck,
  Camera,
  CircleDashed,
  Coffee,
  ExternalLink,
  Leaf,
  LogOut,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { MasterCard } from "@/components/MasterCard";
import { BrewLoader } from "@/components/BrewLoader";
import { ShareProfile } from "@/components/ShareProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  ACHIEVEMENT_CATEGORIES,
  CARD_STYLES,
  categoryLabel,
  isAdminQuery,
  myFollowsQuery,
  myMasterQuery,
  uploadAvatar,
  type CardStyle,
  type Master,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useMode } from "@/lib/mode";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/me")({
  head: () => ({
    meta: [
      { title: "Мой кабинет — Мастер" },
      { name: "description", content: "Ваша визитка мастера и подписки." },
      { property: "og:title", content: "Мой кабинет — Мастер" },
      { property: "og:description", content: "Ваша визитка мастера и подписки." },
    ],
  }),
  component: MePage,
});

function MePage() {
  const { user } = useAuth();
  const { mode } = useMode();
  const navigate = useNavigate();
  const { data: master, isPending } = useQuery(myMasterQuery(user?.id));
  const { data: isAdmin } = useQuery(isAdminQuery(user?.id));

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/masters" });
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 pt-6 pb-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-semibold">Кабинет</h1>
          <div className="flex gap-2">
            {isAdmin && (
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link to="/admin">
                  <ShieldCheck /> Управление
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" className="rounded-full" onClick={signOut}>
              <LogOut /> Выйти
            </Button>
          </div>
        </div>

        {isPending || !user ? (
          <div className="flex justify-center py-20">
            <BrewLoader mode={mode} label="Достаём вашу визитку…" />
          </div>
        ) : (
          <Tabs defaultValue="card" className="mt-6">
            <TabsList className="flex-wrap">
              <TabsTrigger value="card">Визитка</TabsTrigger>
              {master && <TabsTrigger value="achievements">Достижения</TabsTrigger>}
              {master && <TabsTrigger value="drinks">Напитки</TabsTrigger>}
              {master && <TabsTrigger value="cafes">Советую</TabsTrigger>}
              <TabsTrigger value="follows">Подписки</TabsTrigger>
            </TabsList>
            <TabsContent value="card" className="mt-6">
              <CardEditor userId={user.id} master={master ?? null} />
            </TabsContent>
            {master && (
              <>
                <TabsContent value="achievements" className="mt-6">
                  <AchievementsEditor masterId={master.id} />
                </TabsContent>
                <TabsContent value="drinks" className="mt-6">
                  <SimpleListEditor
                    masterId={master.id}
                    table="master_drinks"
                    title="Авторские напитки"
                    nameLabel="Название напитка"
                    extraLabel="Описание / состав"
                    extraKey="description"
                  />
                </TabsContent>
                <TabsContent value="cafes" className="mt-6">
                  <SimpleListEditor
                    masterId={master.id}
                    table="master_cafes"
                    title={master.kind === "tea" ? "Чайные, которые я советую" : "Кофейни, которые я советую"}
                    nameLabel="Название"
                    extraLabel="Чем хороша"
                    extraKey="note"
                    withCity
                  />
                </TabsContent>
              </>
            )}
            <TabsContent value="follows" className="mt-6">
              <Follows userId={user.id} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

type Form = {
  kind: "tea" | "coffee";
  name: string;
  title: string;
  workplace: string;
  city: string;
  years_experience: number;
  bio: string;
  card_style: CardStyle;
  avatar_url: string | null;
};

function CardEditor({ userId, master }: { userId: string; master: Master | null }) {
  const qc = useQueryClient();
  const { mode, setMode } = useMode();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [f, setF] = useState<Form>(() => ({
    kind: (master?.kind as Form["kind"]) ?? mode,
    name: master?.name ?? "",
    title: master?.title ?? "",
    workplace: master?.workplace ?? "",
    city: master?.city ?? "",
    years_experience: master?.years_experience ?? 1,
    bio: master?.bio ?? "",
    card_style: (master?.card_style as CardStyle) ?? "classic",
    avatar_url: master?.avatar_url ?? null,
  }));

  useEffect(() => {
    setMode(f.kind);
  }, [f.kind, setMode]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...f, name: f.name.trim(), years_experience: Math.max(0, Math.min(80, f.years_experience || 0)) };
      if (master) {
        const { error } = await supabase.from("masters").update(payload).eq("id", master.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("masters").insert({ ...payload, user_id: userId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(master ? "Визитка обновлена" : "Визитка создана! Добавьте достижения и напитки.");
      qc.invalidateQueries({ queryKey: ["my-master"] });
      qc.invalidateQueries({ queryKey: ["masters"] });
      if (master) qc.invalidateQueries({ queryKey: ["master", master.id] });
    },
    onError: () => toast.error("Не удалось сохранить"),
  });

  const onFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Фото больше 5 МБ");
    setUploading(true);
    try {
      const url = await uploadAvatar(userId, file);
      set("avatar_url", url);
      toast.success("Фото загружено — не забудьте сохранить");
    } catch {
      toast.error("Не удалось загрузить фото");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_1.1fr]">
      <div className="md:sticky md:top-20 md:self-start">
        <div style={{ containerType: "inline-size" }}>
          <MasterCard master={f} />
        </div>
        {master ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <ShareProfile masterId={master.id} name={master.name} />
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link to="/m/$id" params={{ id: master.id }}>
                <ExternalLink /> Как видят гости
              </Link>
            </Button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Так будет выглядеть ваша визитка в каталоге. Заполните поля справа.
          </p>
        )}
      </div>

      <form
        className="space-y-5 rounded-2xl border bg-card/60 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!f.name.trim()) return toast.error("Укажите имя");
          save.mutate();
        }}
      >
        {!master && (
          <div>
            <h2 className="font-display text-xl">Создайте визитку мастера</h2>
            <p className="text-sm text-muted-foreground">
              Гости смогут найти вас, подписаться и оставить отзыв.
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          {(["coffee", "tea"] as const).map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => set("kind", k)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors",
                f.kind === k ? "border-primary bg-primary/10 text-foreground" : "text-muted-foreground",
              )}
            >
              {k === "tea" ? <Leaf className="size-4" /> : <Coffee className="size-4" />}
              {k === "tea" ? "Я чайный мастер" : "Я бариста"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative size-16 shrink-0 overflow-hidden rounded-full border bg-muted"
            aria-label="Загрузить фото"
          >
            {f.avatar_url ? (
              <img src={f.avatar_url} alt="" className="size-full object-cover" />
            ) : (
              <Camera className="mx-auto size-5 text-muted-foreground" />
            )}
          </button>
          <div className="text-sm">
            <Button type="button" variant="outline" size="sm" className="rounded-full" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? "Загружаем…" : f.avatar_url ? "Сменить фото" : "Загрузить фото"}
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">JPG или PNG до 5 МБ</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </div>

        <Field label="Имя и фамилия">
          <Input value={f.name} onChange={(e) => set("name", e.target.value)} maxLength={60} required />
        </Field>
        <Field label="Должность / специальность">
          <Input value={f.title} onChange={(e) => set("title", e.target.value)} maxLength={60} placeholder={f.kind === "tea" ? "Чайный мастер" : "Шеф-бариста"} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Где работаете">
            <Input value={f.workplace} onChange={(e) => set("workplace", e.target.value)} maxLength={80} />
          </Field>
          <Field label="Город">
            <Input value={f.city} onChange={(e) => set("city", e.target.value)} maxLength={60} />
          </Field>
        </div>
        <Field label="Сколько лет в профессии">
          <Input type="number" min={0} max={80} value={f.years_experience} onChange={(e) => set("years_experience", Number(e.target.value))} />
        </Field>
        <Field label="О себе">
          <Textarea value={f.bio} onChange={(e) => set("bio", e.target.value)} maxLength={600} rows={4} />
        </Field>
        <Field label="Стиль карточки">
          <div className="grid grid-cols-4 gap-2">
            {CARD_STYLES.map((s) => (
              <button
                type="button"
                key={s.value}
                onClick={() => set("card_style", s.value)}
                className={cn(
                  "rounded-lg border p-1 text-[0.7rem]",
                  f.card_style === s.value ? "border-primary" : "opacity-70",
                )}
              >
                <div data-kind={f.kind} data-style={s.value} className="mcard mb-1 aspect-[1.586/1] rounded-md" />
                {s.label}
              </button>
            ))}
          </div>
        </Field>
        <Button type="submit" className="w-full rounded-full" disabled={save.isPending}>
          {master ? "Сохранить" : "Создать визитку"}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function AchievementsEditor({ masterId }: { masterId: string }) {
  const qc = useQueryClient();
  const key = ["my-achievements", masterId];
  const { data = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("master_achievements")
        .select("*")
        .eq("master_id", masterId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("championship");
  const [place, setPlace] = useState("");
  const [year, setYear] = useState<string>("");
  const refresh = () => {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ["master", masterId] });
    qc.invalidateQueries({ queryKey: ["masters"] });
  };
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("master_achievements").insert({
        master_id: masterId,
        title: title.trim(),
        category,
        place: place.trim(),
        year: year ? Number(year) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      setPlace("");
      setYear("");
      toast.success("Добавлено. Появится с пометкой «Указано мастером», пока его не подтвердят.");
      refresh();
    },
    onError: () => toast.error("Не удалось добавить"),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("master_achievements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form
        className="space-y-4 rounded-2xl border bg-card/60 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) add.mutate();
        }}
      >
        <h2 className="font-display text-xl">Новое достижение</h2>
        <Field label="Название">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Russian Barista Championship" maxLength={120} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Тип">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACHIEVEMENT_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Год">
            <Input type="number" min={1950} max={2100} value={year} onChange={(e) => setYear(e.target.value)} />
          </Field>
        </div>
        <Field label="Место / результат">
          <Input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="1 место, финалист…" maxLength={40} />
        </Field>
        <Button type="submit" className="rounded-full" disabled={add.isPending}>
          Добавить
        </Button>
        <p className="text-xs text-muted-foreground">
          Достижения, которые вы добавляете сами, видны гостям с пометкой «Указано мастером». Метку «Подтверждено» ставит команда сервиса после проверки.
        </p>
      </form>
      <ul className="space-y-2">
        {data.length === 0 && <p className="text-sm text-muted-foreground">Пока пусто.</p>}
        {data.map((a) => (
          <li key={a.id} className="flex items-start justify-between gap-3 rounded-xl border bg-card/60 p-3">
            <div>
              <div className="font-medium">
                {a.title}
                {a.place && <span className="text-primary"> · {a.place}</span>}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                {categoryLabel(a.category)}
                {a.year && ` · ${a.year}`}
                {a.verified ? (
                  <span className="flex items-center gap-1 text-verified">
                    <BadgeCheck className="size-3.5" /> Подтверждено
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <CircleDashed className="size-3.5" /> На проверке
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => del.mutate(a.id)} aria-label="Удалить" className="text-muted-foreground hover:text-destructive">
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SimpleListEditor({
  masterId,
  table,
  title,
  nameLabel,
  extraLabel,
  extraKey,
  withCity,
}: {
  masterId: string;
  table: "master_drinks" | "master_cafes";
  title: string;
  nameLabel: string;
  extraLabel: string;
  extraKey: "description" | "note";
  withCity?: boolean;
}) {
  const qc = useQueryClient();
  const key = ["my-list", table, masterId];
  const { data = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select("*").eq("master_id", masterId).order("created_at");
      if (error) throw error;
      return data as { id: string; name: string; city?: string; description?: string; note?: string }[];
    },
  });
  const [name, setName] = useState("");
  const [extra, setExtra] = useState("");
  const [city, setCity] = useState("");
  const refresh = () => {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ["master", masterId] });
  };
  const add = useMutation({
    mutationFn: async () => {
      const row: Record<string, string> = { master_id: masterId, name: name.trim(), [extraKey]: extra.trim() };
      if (withCity) row["city"] = city.trim();
      const { error } = await supabase.from(table).insert(row as never);
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      setExtra("");
      setCity("");
      refresh();
    },
    onError: () => toast.error("Не удалось добавить"),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form
        className="space-y-4 rounded-2xl border bg-card/60 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) add.mutate();
        }}
      >
        <h2 className="font-display text-xl">{title}</h2>
        <Field label={nameLabel}>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
        </Field>
        {withCity && (
          <Field label="Город">
            <Input value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} />
          </Field>
        )}
        <Field label={extraLabel}>
          <Textarea value={extra} onChange={(e) => setExtra(e.target.value)} maxLength={300} rows={3} />
        </Field>
        <Button type="submit" className="rounded-full" disabled={add.isPending}>
          Добавить
        </Button>
      </form>
      <ul className="space-y-2">
        {data.length === 0 && <p className="text-sm text-muted-foreground">Пока пусто.</p>}
        {data.map((r) => (
          <li key={r.id} className="flex items-start justify-between gap-3 rounded-xl border bg-card/60 p-3">
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="text-xs text-muted-foreground">
                {[r.city, r.description ?? r.note].filter(Boolean).join(" · ")}
              </div>
            </div>
            <button onClick={() => del.mutate(r.id)} aria-label="Удалить" className="text-muted-foreground hover:text-destructive">
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Follows({ userId }: { userId: string }) {
  const { data = [], isPending } = useQuery(myFollowsQuery(userId));
  if (isPending) return null;
  const masters = data.map((r) => r.masters).filter(Boolean) as Master[];
  if (masters.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        Вы ещё ни на кого не подписаны.{" "}
        <Link to="/masters" className="text-primary hover:underline">
          Найти мастера
        </Link>
      </p>
    );
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {masters.map((m) => (
        <li key={m.id}>
          <Link to="/m/$id" params={{ id: m.id }} className="block" style={{ containerType: "inline-size" }}>
            <MasterCard master={m} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
