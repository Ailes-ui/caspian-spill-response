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

## Architecture
- Backend REST API lives in TanStack server routes under `src/routes/api/*` with logic in `src/lib/oilwatch/` — single deploy replaces a separate Express server.
- Frontend fetches all data via `src/lib/api.ts` (honours `VITE_API_URL`); never hardcode demo data in UI components.
- Leaflet is loaded only through `LazyMap` (ClientOnly + lazy) because it touches `window` at import.
