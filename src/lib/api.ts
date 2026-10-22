import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { Mode } from "@/lib/mode";

export type Master = Tables<"masters">;
export type Achievement = Tables<"master_achievements">;
export type Drink = Tables<"master_drinks">;
export type Cafe = Tables<"master_cafes">;
export type Review = Tables<"guest_reviews">;
export type Endorsement = Tables<"peer_endorsements"> & {
  author: Pick<Master, "id" | "name" | "title" | "kind" | "avatar_url"> | null;
};

export type MasterListItem = Master & { followers: number; verifiedCount: number };

export type CardStyle = "classic" | "gold" | "noir" | "pearl";
export const CARD_STYLES: { value: CardStyle; label: string }[] = [
  { value: "classic", label: "Классика" },
  { value: "gold", label: "Золото" },
  { value: "noir", label: "Нуар" },
  { value: "pearl", label: "Жемчуг" },
];

export const ACHIEVEMENT_CATEGORIES = [
  { value: "championship", label: "Чемпионат" },
  { value: "award", label: "Награда" },
  { value: "certificate", label: "Сертификат / курс" },
  { value: "other", label: "Другое" },
] as const;

export function categoryLabel(v: string) {
  return ACHIEVEMENT_CATEGORIES.find((c) => c.value === v)?.label ?? "Другое";
}

export function yearsLabel(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} год`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} года`;
  return `${n} лет`;
}

export function followersLabel(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} поклонник`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} поклонника`;
  return `${n} поклонников`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

type RawListRow = Master & {
  follows: { count: number }[];
  master_achievements: { verified: boolean }[];
};

export const mastersQuery = (mode: Mode) =>
  queryOptions({
    queryKey: ["masters", mode],
    queryFn: async (): Promise<MasterListItem[]> => {
      const { data, error } = await supabase
        .from("masters")
        .select("*, follows(count), master_achievements(verified)")
        .eq("kind", mode)
        .order("years_experience", { ascending: false });
      if (error) throw error;
      return (data as unknown as RawListRow[]).map(({ follows, master_achievements, ...m }) => ({
        ...m,
        followers: follows?.[0]?.count ?? 0,
        verifiedCount: master_achievements.filter((a) => a.verified).length,
      }));
    },
  });

export type MasterDetail = {
  master: Master;
  followers: number;
  achievements: Achievement[];
  drinks: Drink[];
  cafes: Cafe[];
  reviews: Review[];
  endorsements: Endorsement[];
};

export const masterQuery = (id: string) =>
  queryOptions({
    queryKey: ["master", id],
    queryFn: async (): Promise<MasterDetail | null> => {
      const { data: master, error } = await supabase
        .from("masters")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!master) return null;
      const [ach, drinks, cafes, reviews, endorsements, follows] = await Promise.all([
        supabase
          .from("master_achievements")
          .select("*")
          .eq("master_id", id)
          .order("verified", { ascending: false })
          .order("year", { ascending: false, nullsFirst: false }),
        supabase.from("master_drinks").select("*").eq("master_id", id).order("created_at"),
        supabase.from("master_cafes").select("*").eq("master_id", id).order("created_at"),
        supabase
          .from("guest_reviews")
          .select("*")
          .eq("master_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("peer_endorsements")
          .select("*, author:masters!peer_endorsements_author_master_id_fkey(id,name,title,kind,avatar_url)")
          .eq("master_id", id)
          .order("created_at", { ascending: false }),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("master_id", id),
      ]);
      for (const r of [ach, drinks, cafes, reviews, endorsements, follows]) if (r.error) throw r.error;
      return {
        master,
        followers: follows.count ?? 0,
        achievements: ach.data ?? [],
        drinks: drinks.data ?? [],
        cafes: cafes.data ?? [],
        reviews: reviews.data ?? [],
        endorsements: (endorsements.data ?? []) as unknown as Endorsement[],
      };
    },
  });

export const myMasterQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["my-master", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("masters")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const myFollowsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["my-follows", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("master_id, masters(*)")
        .eq("follower_id", userId!);
      if (error) throw error;
      return data;
    },
  });

export const isAdminQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["is-admin", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
  });

export async function uploadAvatar(userId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage
    .from("avatars")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (e2) throw e2;
  return data.signedUrl;
}
