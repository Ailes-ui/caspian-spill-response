// Wrapper so Leaflet (browser-only) never loads during server rendering.
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, type ComponentProps } from "react";

const MapView = lazy(() => import("./MapView"));
type Props = ComponentProps<typeof MapView>;

export function LazyMap(props: Props) {
  const fb = <div style={{ height: props.height ?? "100%" }} className="w-full animate-pulse rounded-lg border bg-muted" />;
  return (
    <ClientOnly fallback={fb}>
      <Suspense fallback={fb}><MapView {...props} /></Suspense>
    </ClientOnly>
  );
}
