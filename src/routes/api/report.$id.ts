import { createFileRoute } from "@tanstack/react-router";
import { json, preflight } from "@/lib/oilwatch/http";
import { report } from "@/lib/oilwatch/store";

// GET /api/report/:id — summary data for the printable report
export const Route = createFileRoute("/api/report/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const r = report(params.id);
        return r ? json(r) : json({ error: "Не найдено" }, 404);
      },
      OPTIONS: async () => preflight(),
    },
  },
});
