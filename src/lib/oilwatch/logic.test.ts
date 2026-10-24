import { describe, expect, it } from "vitest";
import { economics, estimateVolumeT, haversineKm } from "./logic";
import { advance, assignBest, listAssets } from "./store";

describe("oilwatch logic", () => {
  it("volume = area*1e6*0.0001*850/1000", () => {
    expect(estimateVolumeT(4.9)).toBeCloseTo(416.5, 5);
  });
  it("economics defaults: LTV/CAC = 34.2M / 4.5M", () => {
    const r = economics({ price: 18_000_000, unitCost: 6_600_000, cac: 4_500_000, years: 3 });
    expect(r.ltv).toBe(34_200_000);
    expect(r.ltvCac).toBeCloseTo(7.6, 5);
    expect(r.paybackMonths).toBeCloseTo(4.74, 2);
    expect(r.healthy).toBe(true);
  });
  it("haversine Aktau–Atyrau ≈ 390 km", () => {
    expect(haversineKm([43.65, 51.17], [47.1, 51.9])).toBeGreaterThan(370);
  });
  it("INC-001 assignment picks a cargo asset, never a drone, and flow reaches resolved", () => {
    const r = assignBest("INC-001");
    if ("error" in r) throw new Error(r.error);
    expect(r.asset?.capacityT).toBeGreaterThan(0);
    expect(r.needsAdditionalAssets).toBe(true); // 416 t > max capacity 40 t
    expect(listAssets().find((a) => a.id === r.asset?.id)?.status).toBe("en_route");
    advance("INC-001"); advance("INC-001");
    const last = advance("INC-001");
    if ("error" in last) throw new Error(last.error);
    expect(last.incident.status).toBe("resolved");
  });
});
