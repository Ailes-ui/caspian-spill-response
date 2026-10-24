// Unit-economics calculator for the pitch (pure math from lib/oilwatch/logic).
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { economics } from "@/lib/oilwatch/logic";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/economics")({
  head: () => ({
    meta: [
      { title: "Economics — OilWatch AI" },
      { name: "description", content: "OilWatch AI unit economics calculator: margin, LTV, LTV/CAC, payback." },
      { property: "og:title", content: "Economics — OilWatch AI" },
      { property: "og:description", content: "Unit economics calculator in KZT." },
    ],
  }),
  component: Economics,
});

const kzt = (n: number) => `${Math.round(n).toLocaleString("ru-RU")} ₸`;

function Economics() {
  const [v, setV] = useState({ price: 18_000_000, unitCost: 6_600_000, cac: 4_500_000, years: 3 });
  const r = economics(v);
  const field = (k: keyof typeof v, label: string) => (
    <div className="space-y-1">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} type="number" value={v[k]} onChange={(e) => setV({ ...v, [k]: Number(e.target.value) })} />
    </div>
  );
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-xl font-bold">Unit economics</h1>
      <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2">
        {field("price", "Price per client per year, KZT")}
        {field("unitCost", "Annual unit cost, KZT")}
        {field("cac", "CAC (customer acquisition cost), KZT")}
        {field("years", "Retention period, years")}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Out l="Annual margin" v={`${kzt(r.margin)} (${r.marginPct.toFixed(0)}%)`} />
        <Out l="LTV" v={kzt(r.ltv)} />
        <div className="rounded-lg border bg-card p-3">
          <div className="text-xs text-muted-foreground">LTV / CAC</div>
          <div className="mt-1 flex items-center gap-2 text-2xl font-bold">
            {r.ltvCac.toFixed(2)}
            <span className={`rounded-full px-2 py-0.5 text-xs ${r.healthy ? "bg-ok text-primary-foreground" : "bg-critical text-destructive-foreground"}`}>{r.healthy ? "≥ 3 — healthy" : "< 3 — weak"}</span>
          </div>
        </div>
        <Out l="CAC payback" v={Number.isFinite(r.paybackMonths) ? `${r.paybackMonths.toFixed(1)} months` : "does not pay back"} />
      </div>
      <p className="text-sm text-muted-foreground">Assumptions, to be validated with customers.</p>
    </div>
  );
}

function Out({ l, v }: { l: string; v: string }) {
  return <div className="rounded-lg border bg-card p-3"><div className="text-xs text-muted-foreground">{l}</div><div className="mt-1 text-2xl font-bold">{v}</div></div>;
}
