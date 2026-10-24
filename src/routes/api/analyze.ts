import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { json, preflight } from "@/lib/oilwatch/http";

// Preset "drone images" map to fixed simulated detections (no real AI model).
const PRESETS: Record<string, { coords: [number, number]; areaKm2: number; confidence: number }> = {
  "sample-1": { coords: [45.95, 50.4], areaKm2: 1.8, confidence: 0.91 },
  "sample-2": { coords: [44.2, 50.85], areaKm2: 0.7, confidence: 0.84 },
  "sample-3": { coords: [46.4, 51.6], areaKm2: 3.1, confidence: 0.77 },
};

const Body = z.object({
  imageId: z.string().optional(),
  location: z.tuple([z.number(), z.number()]).optional(),
});

// POST /api/analyze — SIMULATED analysis: returns coordinates, area and confidence
export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ error: "Invalid data" }, 400);
        const { imageId, location } = parsed.data;
        let result;
        if (imageId && PRESETS[imageId]) result = PRESETS[imageId];
        else if (location) {
          // Pseudo-random but deterministic values derived from the clicked point
          const seed = Math.abs(Math.sin(location[0] * 12.9898 + location[1] * 78.233)) % 1;
          result = { coords: location, areaKm2: +(0.2 + seed * 3).toFixed(2), confidence: +(0.7 + seed * 0.27).toFixed(2) };
        } else return json({ error: "Choose an image or a point on the map" }, 400);
        return json({ ...result, simulated: true, label: "simulated analysis (demo)" });
      },
      OPTIONS: async () => preflight(),
    },
  },
});
