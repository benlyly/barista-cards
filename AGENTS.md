<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules

- Tea/coffee mood is client state in `src/lib/mode.tsx` (localStorage) applied as `data-mode` on `<html>`; theme tokens switch via `:root[data-mode="tea"]` — keeps one component tree for both moods.
- Public master pages (`/m/$id`) load through the `getPublicMaster` server function with a publishable-key client — so shared links render server-side for guests without the app.
- All writes go from the browser Supabase client under RLS; ownership checks use the `owns_master()` SQL helper — avoids duplicating auth logic in server functions.
- Achievement `verified` and master `is_demo` flags are protected by DB triggers (only admins change `verified`; nobody sets `is_demo`) — users cannot self-confirm or hide as demo.
- Demo visibility is the `show_demo` row in `app_settings`, enforced in the `masters` SELECT policy — hiding demos applies everywhere at once.
- Avatars live in a private `avatars` bucket (public buckets are blocked in this workspace); store long-lived signed URLs in `masters.avatar_url`.
- Card visuals are CSS classes (`.mcard` + `data-kind`/`data-style`) in `src/styles.css`; card text sizes use `cqw`, so wrap `MasterCard` in an element with `containerType: inline-size`.
- Printed card QR links come only from `printableProfileUrl()` in `src/lib/print-card.ts`, which returns null on preview/local addresses — paper must never carry a link guests cannot open.
