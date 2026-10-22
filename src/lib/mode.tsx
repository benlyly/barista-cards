import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Mode = "tea" | "coffee";

const STORAGE_KEY = "master-mode";

/** Swipe/drag to the right brews tea, to the left brews coffee. */
export function modeFromSwipe(dx: number, threshold = 60): Mode | null {
  if (dx >= threshold) return "tea";
  if (dx <= -threshold) return "coffee";
  return null;
}

export const MODE_LABEL: Record<Mode, string> = { tea: "Чай", coffee: "Кофе" };

type Ctx = { mode: Mode; setMode: (m: Mode) => void };
const ModeContext = createContext<Ctx>({ mode: "coffee", setMode: () => {} });

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("coffee");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "tea" || saved === "coffee") setModeState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.dataset["mode"] = mode;
  }, [mode]);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    window.localStorage.setItem(STORAGE_KEY, m);
  }, []);

  return <ModeContext.Provider value={{ mode, setMode }}>{children}</ModeContext.Provider>;
}

export function useMode() {
  return useContext(ModeContext);
}
