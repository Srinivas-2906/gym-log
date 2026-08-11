# Daylog — agent notes

Personal workout journal built with TanStack Start.

## Project layout

- `src/routes/` — file-based routes (`index`, `history`, `stats`, `settings`)
- `src/components/log/` — logging UI (form, day sections, entry rows)
- `src/lib/activities.ts` — data model, localStorage persistence, hooks
- `src/server.ts` — SSR error wrapper around TanStack Start server entry
- `src/start.ts` — CSRF and error middleware for server functions

## Conventions

- App data lives in `localStorage` under the key `daylog-entries`.
- Do not edit `src/routeTree.gen.ts` by hand — it is generated from route files.
- Preserve `<Outlet />` in `src/routes/__root.tsx`; removing it breaks all child routes.
