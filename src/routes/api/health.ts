import { createFileRoute } from "@tanstack/react-router";
import { json, preflight } from "@/lib/oilwatch/http";

// GET /api/health — simple "is the server alive?" check
export const Route = createFileRoute("/api/health")({
  server: { handlers: { GET: async () => json({ ok: true, service: "oilwatch-ai", demo: true }), OPTIONS: async () => preflight() } },
});
