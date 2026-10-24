import { createFileRoute } from "@tanstack/react-router";
import { Radar, BrainCircuit, Send, MapPinned } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — OilWatch AI" },
      { name: "description", content: "How OilWatch AI works: detection, analysis, dispatch, tracking. Who pays." },
      { property: "og:title", content: "About — OilWatch AI" },
      { property: "og:description", content: "Detection → Analysis → Dispatch → Tracking." },
    ],
  }),
  component: About,
});

const STEPS = [
  { icon: Radar, t: "Detection", d: "Client's satellites and drones spot the slick." },
  { icon: BrainCircuit, t: "Analysis", d: "Estimate of area, volume and priority." },
  { icon: Send, t: "Dispatch", d: "Pick the nearest suitable response asset." },
  { icon: MapPinned, t: "Tracking", d: "Statuses, log and the operation report." },
];

function About() {
  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-xl font-bold">About the OilWatch AI platform</h1>
      <p className="text-muted-foreground">A software platform that coordinates the client's existing response assets (vessels, skimmer robots, drones). We do not sell robots.</p>
      <ol className="grid gap-3 sm:grid-cols-4">
        {STEPS.map(({ icon: Icon, t, d }, n) => (
          <li key={t} className="rounded-lg border bg-card p-4">
            <Icon className="mb-2 h-6 w-6 text-primary" />
            <div className="font-semibold">{n + 1}. {t}</div>
            <p className="text-sm text-muted-foreground">{d}</p>
          </li>
        ))}
      </ol>
      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-2 font-semibold">Who pays</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Oil & gas operators in the Caspian region</li>
          <li>Regional authorities (Atyrau and Mangystau regions)</li>
          <li>Oil spill response contractors</li>
        </ul>
      </section>
    </div>
  );
}
