import { Link } from "@tanstack/react-router";
import { Coffee, Leaf, UserRound } from "lucide-react";
import { motion } from "motion/react";
import { useMode, type Mode } from "@/lib/mode";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function ModeToggle({ className }: { className?: string }) {
  const { mode, setMode } = useMode();
  const items: { value: Mode; label: string; Icon: typeof Leaf }[] = [
    { value: "tea", label: "Чай", Icon: Leaf },
    { value: "coffee", label: "Кофе", Icon: Coffee },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Чай или кофе"
      className={cn("relative flex rounded-full border bg-card/70 p-0.5 backdrop-blur", className)}
    >
      {items.map(({ value, label, Icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={active}
            onClick={() => setMode(value)}
            className={cn(
              "relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="mode-pill"
                className="absolute inset-0 -z-10 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <Icon className="size-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function AppHeader() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/masters" className="font-display text-lg font-semibold tracking-tight">
          Мастер<span className="text-primary">.</span>
        </Link>
        <ModeToggle />
        {user ? (
          <Link
            to="/me"
            className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <UserRound className="size-4" />
            <span className="hidden sm:inline">Кабинет</span>
          </Link>
        ) : (
          <Link
            to="/auth"
            className="rounded-full px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Войти
          </Link>
        )}
      </div>
    </header>
  );
}
