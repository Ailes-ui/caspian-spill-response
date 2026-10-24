import { createFileRoute } from "@tanstack/react-router";
import { json, preflight } from "@/lib/oilwatch/http";
import { getIncident } from "@/lib/oilwatch/store";

// GET /api/incidents/:id — one incident with priority breakdown
export const Route = createFileRoute("/api/incidents/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const inc = getIncident(params.id);
        return inc ? json(inc) : json({ error: "Не найдено" }, 404);
      },
      OPTIONS: async () => preflight(),
    },
  },
});
