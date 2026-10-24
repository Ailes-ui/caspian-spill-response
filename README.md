# OilWatch AI — hackathon prototype

> **DEMO DATA — simulated scenario, not real incidents.**

A software platform that coordinates detection and cleanup of oil spills on the Caspian Sea (Kazakhstan sector).
It orchestrates a client's existing response assets (boats, skimmer robots, drones). It does not sell hardware.

## Structure (frontend + backend in one full-stack app)
| Part | Where | What it does |
|---|---|---|
| Backend logic | `src/lib/oilwatch/logic.ts` | Volume, priority score, haversine, dispatch, economics |
| Backend state | `src/lib/oilwatch/store.ts` | In-memory demo data, seeded on start |
| REST API | `src/routes/api/*` | Endpoints below (CORS enabled) |
| Frontend API client | `src/lib/api.ts` | Reads `VITE_API_URL`, fetches everything from the API |
| Pages | `src/routes/*.tsx` | Dashboard, incident, detection, economics, about |

The platform uses TanStack Start (React + server routes) instead of a separate Express server: the
backend endpoints are real HTTP REST endpoints served by the same deployment, so a single deploy works.

### REST endpoints
`GET /api/health`, `GET /api/incidents`, `GET /api/incidents/:id`, `POST /api/incidents`,
`POST /api/incidents/:id/assign`, `POST /api/incidents/:id/advance`, `GET /api/assets`,
`POST /api/analyze`, `GET /api/report/:id`

## Formulas
- Volume (t) = area_km² × 1,000,000 × thickness (0.0001 m) × 850 / 1000
- Priority = 50 × area/5km² + 30 × (1 − distance to nearest sensitive point / 150 km) + 20 × hours/24
- Dispatch: available assets with capacity > 0 → lowest ETA (haversine distance / speed) that covers the volume;
  otherwise lowest ETA + "needs additional assets".

## Run locally
```bash
bun install
bun run dev        # http://localhost:8080
bunx vitest run    # logic tests
```

## Deploy
- Easiest: press **Publish** in Lovable → public URL, no login.
- Self-host: see https://docs.lovable.dev/tips-tricks/self-hosting (Cloudflare Workers free tier works).
- Note: state is in memory, so it resets when the server restarts (fine for a demo).
