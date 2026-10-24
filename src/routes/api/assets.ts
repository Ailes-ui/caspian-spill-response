import { createFileRoute } from "@tanstack/react-router";
import { json, preflight } from "@/lib/oilwatch/http";
import { listAssets } from "@/lib/oilwatch/store";

// GET /api/assets — response assets with their current status
export const Route = createFileRoute("/api/assets")({
  server: { handlers: { GET: async () => json(listAssets()), OPTIONS: async () => preflight() } },
});
