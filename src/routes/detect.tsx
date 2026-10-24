// New detection: pick a sample drone image or click the map, run simulated analysis, create incident.
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { LazyMap } from "@/components/LazyMap";

export const Route = createFileRoute("/detect")({
  head: () => ({
    meta: [
      { title: "Новая детекция — OilWatch AI" },
      { name: "description", content: "Симулированный анализ снимка дрона для обнаружения нефтяного пятна (демо)." },
      { property: "og:title", content: "Новая детекция — OilWatch AI" },
      { property: "og:description", content: "Симулированный анализ снимка дрона (демо)." },
    ],
  }),
  component: Detect,
});

// Placeholder "drone images" — abstract tiles, not real photos.
const SAMPLES = [
  { id: "sample-1", label: "Снимок №1 — Северный Каспий", tone: "from-info to-ok" },
  { id: "sample-2", label: "Снимок №2 — Тюб-Караган", tone: "from-ok to-info" },
  { id: "sample-3", label: "Снимок №3 — дельта Урала", tone: "from-info to-warn" },
];

function Detect() {
  const navigate = useNavigate();
  const [imageId, setImageId] = useState<string | null>(null);
  const [loc, setLoc] = useState<[number, number] | null>(null);
  const analyze = useMutation({ mutationFn: () => api.analyze(imageId ? { imageId } : { location: loc! }) });
  const create = useMutation({
    mutationFn: () => api.create({ coords: analyze.data!.coords, areaKm2: analyze.data!.areaKm2, source: "drone" }),
    onSuccess: (inc) => { toast.success(`Создан инцидент ${inc.id}`); navigate({ to: "/incidents/$id", params: { id: inc.id } }); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Новая детекция</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {SAMPLES.map((s) => (
              <button key={s.id} onClick={() => { setImageId(s.id); setLoc(null); analyze.reset(); }}
                className={`overflow-hidden rounded-lg border-2 text-left ${imageId === s.id ? "border-primary" : "border-transparent"}`}>
                <div className={`relative h-20 bg-gradient-to-br ${s.tone}`}>
                  <div className="absolute left-1/3 top-1/3 h-6 w-10 rounded-full bg-foreground/60 blur-sm" />
                </div>
                <div className="bg-card p-1 text-xs">{s.label}</div>
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">…или нажмите на точку на карте{loc && `: ${loc[0]}, ${loc[1]}`}</p>
          <Button onClick={() => analyze.mutate()} disabled={(!imageId && !loc) || analyze.isPending}>Анализировать</Button>
          {analyze.error && <p className="text-critical">{(analyze.error as Error).message}</p>}
          {analyze.data && (
            <div className="rounded-lg border bg-card p-4 text-sm">
              <p className="mb-2 inline-block rounded bg-banner px-2 py-0.5 text-xs font-semibold text-banner-foreground">simulated analysis (demo)</p>
              <p>Координаты: {analyze.data.coords.join(", ")}</p>
              <p>Площадь: {analyze.data.areaKm2} км²</p>
              <p>Уверенность: {(analyze.data.confidence * 100).toFixed(0)}%</p>
              <Button className="mt-3" onClick={() => create.mutate()} disabled={create.isPending}>Создать инцидент</Button>
            </div>
          )}
        </div>
        <div className="h-[420px]">
          <LazyMap pick={analyze.data?.coords ?? loc} onMapClick={(ll) => { setLoc(ll); setImageId(null); analyze.reset(); }} />
        </div>
      </div>
    </div>
  );
}
