import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { fetchMasterDetail } from "@/lib/api";

/** Public, read-only master profile — server-rendered so a shared link works outside the app. */
export const getPublicMaster = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(input.id)) throw new Error("Bad id");
    return input;
  })
  .handler(async ({ data }) => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const client = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
            h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    return fetchMasterDetail(client, data.id);
  });
