import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, Trash2, Undo2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { categoryLabel, isAdminQuery, showDemoQuery } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Управление — Мастер" },
      { name: "description", content: "Проверка достижений и демо-профили." },
      { property: "og:title", content: "Управление — Мастер" },
      { property: "og:description", content: "Проверка достижений и демо-профили." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = useAuth();
  const { data: isAdmin, isPending } = useQuery(isAdminQuery(user?.id));
  if (isPending) return <AppHeader />;
  if (!isAdmin)
    return (
      <div className="min-h-screen">
        <AppHeader />
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="font-display text-2xl">Только для команды сервиса</h1>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/me">В кабинет</Link>
          </Button>
        </div>
      </div>
    );
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-4xl space-y-8 px-4 pt-6 pb-24">
        <h1 className="font-display text-3xl font-semibold">Управление</h1>
        <DemoControls />
        <AchievementQueue />
      </main>
    </div>
  );
}

function DemoControls() {
  const qc = useQueryClient();
  const { data: show = true } = useQuery(showDemoQuery);
  const { data: demoCount = 0 } = useQuery({
    queryKey: ["demo-count"],
    queryFn: async () => {
      const { count } = await supabase.from("masters").select("id", { count: "exact", head: true }).eq("is_demo", true);
      return count ?? 0;
    },
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["setting"] });
    qc.invalidateQueries({ queryKey: ["demo-count"] });
    qc.invalidateQueries({ queryKey: ["masters"] });
    qc.invalidateQueries({ queryKey: ["master"] });
  };
  const toggle = useMutation({
    mutationFn: async (v: boolean) => {
      const { error } = await supabase.from("app_settings").update({ value: v, updated_at: new Date().toISOString() }).eq("key", "show_demo");
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      toast.success(v ? "Демо-профили снова видны гостям" : "Демо-профили скрыты от гостей");
      refresh();
    },
    onError: () => toast.error("Не удалось изменить"),
  });
  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("masters").delete().eq("is_demo", true);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Демо-профили удалены");
      refresh();
    },
    onError: () => toast.error("Не удалось удалить"),
  });

  return (
    <section className="rounded-2xl border bg-card/60 p-5">
      <h2 className="font-display text-xl">Демо-профили</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Сейчас в каталоге {demoCount} примеров. Настоящие карточки мастеров эти действия не затрагивают.
      </p>
      <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border p-4">
        <div>
          <div className="font-medium">Показывать гостям</div>
          <div className="text-xs text-muted-foreground">Выключите перед публичным запуском — профили останутся, но будут скрыты.</div>
        </div>
        <Switch checked={show} disabled={toggle.isPending} onCheckedChange={(v) => toggle.mutate(v)} />
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="mt-4 rounded-full text-destructive" disabled={demoCount === 0}>
            <Trash2 /> Удалить все демо-профили
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить демо-профили навсегда?</AlertDialogTitle>
            <AlertDialogDescription>
              Удалятся {demoCount} примеров вместе с их отзывами и наградами. Карточки настоящих мастеров останутся.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => remove.mutate()}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function AchievementQueue() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("master_achievements")
        .select("*, masters(name, is_demo)")
        .order("verified")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });
  const setVerified = useMutation({
    mutationFn: async ({ id, v }: { id: string; v: boolean }) => {
      const { error } = await supabase.from("master_achievements").update({ verified: v }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-achievements"] });
      qc.invalidateQueries({ queryKey: ["master"] });
      qc.invalidateQueries({ queryKey: ["masters"] });
    },
  });
  const pending = data.filter((a) => !a.verified);
  return (
    <section className="rounded-2xl border bg-card/60 p-5">
      <h2 className="font-display text-xl">Проверка достижений</h2>
      <p className="mt-1 text-sm text-muted-foreground">Ждут проверки: {pending.length}</p>
      <ul className="mt-4 divide-y">
        {data.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <div className="truncate font-medium">
                {a.title}
                {a.place && <span className="text-primary"> · {a.place}</span>}
              </div>
              <div className="text-xs text-muted-foreground">
                {a.masters?.name} · {categoryLabel(a.category)}
                {a.year ? ` · ${a.year}` : ""}
              </div>
            </div>
            {a.verified ? (
              <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setVerified.mutate({ id: a.id, v: false })}>
                <Undo2 /> Снять
              </Button>
            ) : (
              <Button size="sm" className="rounded-full" onClick={() => setVerified.mutate({ id: a.id, v: true })}>
                <BadgeCheck /> Подтвердить
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
