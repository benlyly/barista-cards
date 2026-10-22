import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Coffee, Leaf, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Вход и регистрация — Мастер" },
      { name: "description", content: "Создайте визитку мастера или подпишитесь на любимых бариста." },
      { property: "og:title", content: "Вход и регистрация — Мастер" },
      { property: "og:description", content: "Создайте визитку мастера или подпишитесь на любимых бариста." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/me" });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/me", data: { display_name: name } },
        });
        if (error) throw error;
        if (!data.session) setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(
        msg.includes("Invalid login") ? "Неверная почта или пароль" : msg.includes("already") ? "Такая почта уже зарегистрирована" : "Не получилось, попробуйте ещё раз",
      );
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Не удалось войти через Google");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link to="/masters" className="mb-8 block text-center font-display text-3xl font-semibold">
          Мастер<span className="text-primary">.</span>
        </Link>
        <div className="rounded-2xl border bg-card p-6 shadow-xl">
          {sent ? (
            <div className="py-6 text-center">
              <MailCheck className="mx-auto size-10 text-primary" />
              <h1 className="mt-4 font-display text-2xl">Проверьте почту</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Мы отправили письмо на <b>{email}</b>. Нажмите ссылку в нём, чтобы подтвердить регистрацию.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 grid grid-cols-2 rounded-full bg-muted p-1 text-sm">
                {(["signup", "signin"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "rounded-full py-1.5 font-medium transition-colors",
                      tab === t ? "bg-background text-foreground shadow" : "text-muted-foreground",
                    )}
                  >
                    {t === "signup" ? "Регистрация" : "Вход"}
                  </button>
                ))}
              </div>
              {tab === "signup" && (
                <p className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
                  <Coffee className="size-4 text-primary" />
                  <Leaf className="size-4 text-primary" />
                  Мастера создают визитку, гости — подписываются.
                </p>
              )}
              <form onSubmit={submit} className="space-y-4">
                {tab === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Как к вам обращаться</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Почта</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Пароль</Label>
                  <Input
                    id="password"
                    type="password"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={busy}>
                  {tab === "signup" ? "Создать аккаунт" : "Войти"}
                </Button>
              </form>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> или <div className="h-px flex-1 bg-border" />
              </div>
              <Button variant="outline" className="w-full rounded-full" onClick={google}>
                Продолжить с Google
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
