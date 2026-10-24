// Frontend API client. All data comes from the backend REST API.
// VITE_API_URL lets the frontend talk to a backend on another host; empty = same origin.
import type { Asset } from "./oilwatch/logic";
import type { IncidentDTO } from "./oilwatch/store";

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`);
  return data as T;
}

export interface Kpis { activeIncidents: number; availableAssets: number; avgAssignmentSec: number | null; volumeInRecoveryT: number }
export type { IncidentDTO, Asset };

export const api = {
  incidents: () => req<{ incidents: IncidentDTO[]; kpis: Kpis }>("/api/incidents"),
  incident: (id: string) => req<IncidentDTO>(`/api/incidents/${id}`),
  assets: () => req<Asset[]>("/api/assets"),
  assign: (id: string) =>
    req<{ incident: IncidentDTO; asset: Asset; etaHours: number; reasoning: string; needsAdditionalAssets: boolean }>(
      `/api/incidents/${id}/assign`, { method: "POST" }),
  advance: (id: string) => req<{ incident: IncidentDTO; asset?: Asset }>(`/api/incidents/${id}/advance`, { method: "POST" }),
  analyze: (body: { imageId?: string; location?: [number, number] }) =>
    req<{ coords: [number, number]; areaKm2: number; confidence: number; label: string }>("/api/analyze", { method: "POST", body: JSON.stringify(body) }),
  create: (body: { coords: [number, number]; areaKm2: number; source: "drone" | "satellite" }) =>
    req<IncidentDTO>("/api/incidents", { method: "POST", body: JSON.stringify(body) }),
  report: (id: string) =>
    req<{ disclaimer: string; generatedAt: number; incident: IncidentDTO; asset: Asset | null; etaMinutes: number | null; estimatedRecoveredT: number; plannedRecoveryT: number }>(`/api/report/${id}`),
};
