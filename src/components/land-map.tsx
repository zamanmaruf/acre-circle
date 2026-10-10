"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { GeoJSONSource, LngLatBoundsLike, Map as MLMap, Marker } from "maplibre-gl";
import { useReducedMotion } from "motion/react";
import { MapPinOff, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/labels";
import type { LatLng, Property } from "@/lib/types";

export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const NS_VIEW: LngLatBoundsLike = [
  [-66.4, 43.4],
  [-59.7, 47.05],
];
const LOAD_TIMEOUT_MS = 15000;
/** Inline so it beats maplibre-gl.css, which sets the container to position: relative. */
const FILL: React.CSSProperties = { position: "absolute", inset: 0 };

type Status = "loading" | "ready" | "error";
type MapLib = typeof import("maplibre-gl");

let libPromise: Promise<MapLib> | null = null;
function loadLib(): Promise<MapLib> {
  libPromise ??= import("maplibre-gl").then((lib) => {
    lib.setWorkerUrl("/vendor/maplibre-gl-worker.mjs");
    return lib;
  });
  return libPromise;
}

/** Re-colours the OpenFreeMap "liberty" style towards the Acre Circle palette. */
function brandStyle(map: MLMap) {
  const set = (id: string, prop: Parameters<MLMap["setPaintProperty"]>[1], value: string | number) => {
    try {
      map.setPaintProperty(id, prop, value);
    } catch {
      // Layer may not support this property; leave it as styled upstream.
    }
  };
  for (const layer of map.getStyle().layers ?? []) {
    const id = layer.id.toLowerCase();
    if (layer.type === "background") set(layer.id, "background-color", "#F3F1E6");
    else if (layer.type === "fill") {
      if (id.includes("water")) set(layer.id, "fill-color", "#CADDD7");
      else if (id.includes("wood") || id.includes("forest")) set(layer.id, "fill-color", "#D3E2C6");
      else if (["grass", "park", "farmland", "meadow", "scrub", "landcover"].some((k) => id.includes(k))) set(layer.id, "fill-color", "#E2ECD9");
      else if (id.includes("building")) set(layer.id, "fill-color", "#E6E1D2");
      else if (id.includes("residential") || id.includes("landuse")) set(layer.id, "fill-color", "#EEEADC");
    } else if (layer.type === "line") {
      if (id.includes("water") || id.includes("river")) set(layer.id, "line-color", "#B7D0C9");
      else if (id.includes("casing")) set(layer.id, "line-color", "#DDD5BE");
      else if (["road", "highway", "street", "motorway", "trunk", "primary", "secondary", "tertiary", "minor"].some((k) => id.includes(k)))
        set(layer.id, "line-color", "#FFFFFF");
      else if (id.includes("boundary")) set(layer.id, "line-color", "#9FB3A6");
    } else if (layer.type === "symbol") {
      if (id.includes("place") || id.includes("label")) {
        set(layer.id, "text-color", "#3F5248");
        set(layer.id, "text-halo-color", "#FEFDF9");
      }
    }
  }
}

function circlePolygon(center: LatLng, km: number, steps = 72): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const latR = (center.lat * Math.PI) / 180;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    const dLat = (km / 110.574) * Math.sin(a);
    const dLng = (km / (111.32 * Math.cos(latR))) * Math.cos(a);
    coords.push([center.lng + dLng, center.lat + dLat]);
  }
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [coords] } };
}

/** Shared lifecycle: lazy-load the library, create the map, report status, clean up. */
function useMapLibre(
  container: React.RefObject<HTMLDivElement | null>,
  options: { interactive?: boolean; bounds?: LngLatBoundsLike; center?: LatLng; zoom?: number },
) {
  const [status, setStatus] = useState<Status>("loading");
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<MapLib | null>(null);
  const opts = useRef(options);

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    loadLib()
      .then((lib) => {
        if (cancelled || !container.current) return;
        libRef.current = lib;
        const { interactive = true, bounds, center, zoom } = opts.current;
        let map: MLMap;
        try {
          map = new lib.Map({
            container: container.current,
            style: MAP_STYLE_URL,
            interactive,
            attributionControl: { compact: true },
            cooperativeGestures: false,
            dragRotate: false,
            pitchWithRotate: false,
            ...(center ? { center: [center.lng, center.lat], zoom: zoom ?? 8 } : { bounds: bounds ?? NS_VIEW, fitBoundsOptions: { padding: 24 } }),
          });
        } catch {
          setStatus("error");
          return;
        }
        mapRef.current = map;
        if (interactive) map.addControl(new lib.NavigationControl({ showCompass: false }), "top-right");
        map.touchZoomRotate?.disableRotation();
        timer = window.setTimeout(() => !map.loaded() && setStatus((s) => (s === "loading" ? "error" : s)), LOAD_TIMEOUT_MS);
        map.on("error", () => {
          if (!map.isStyleLoaded()) setStatus("error");
        });
        map.once("style.load", () => brandStyle(map));
        map.on("load", () => {
          window.clearTimeout(timer);
          // Start the compact attribution collapsed to its "i" button; it still expands on click.
          map.getContainer().querySelector(".maplibregl-compact-show")?.classList.remove("maplibregl-compact-show");
          setStatus("ready");
        });
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [container]);

  return { status, mapRef, libRef };
}

function MapFallback({ compact }: { compact?: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#E4EEDF,transparent_60%),radial-gradient(circle_at_80%_80%,#F6EAD3,transparent_55%)] bg-cream p-6 text-center" data-testid="map-fallback">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-paper text-forest shadow-soft">
        <WifiOff className="h-5 w-5" />
      </span>
      <p className="mt-3 font-serif text-lg text-forest">Map tiles need an internet connection</p>
      {!compact && <p className="mt-1 max-w-xs text-[13px] text-muted">Everything else still works. Use the listing panel to browse and request land.</p>}
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-cream" aria-hidden="true">
      <div className="skeleton absolute inset-0 opacity-60" />
      <span className="relative text-[12px] font-medium tracking-wide text-muted">Loading map…</span>
    </div>
  );
}

function pinLabel(p: Property) {
  return `${p.cultivableAcres.toFixed(p.cultivableAcres % 1 === 0 ? 0 : 1)} ac · ${formatCurrency(p.rentPerAcreMonthly)}`;
}

export interface LandMapProps {
  properties: Property[];
  selectedId?: string | null;
  hoveredId?: string | null;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  /** Property ids to frame; empty or undefined frames all of Nova Scotia. */
  focusIds?: string[];
  travelCircle?: { center: LatLng; km: number; label: string } | null;
  interactive?: boolean;
  /** Pixels covered by overlays (side panel, bottom sheet) so the camera centres pins in the visible area. */
  insets?: { right?: number; bottom?: number };
  className?: string;
}

/** Interactive map of listings with branded pins, selection fly-to and an optional travel radius. */
export function LandMap({
  properties,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  focusIds,
  travelCircle,
  interactive = true,
  insets,
  className,
}: LandMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const { status, mapRef, libRef } = useMapLibre(container, { interactive });
  const markers = useRef(new Map<string, { marker: Marker; el: HTMLButtonElement }>());
  const reduce = useReducedMotion();
  const handlers = useRef({ onSelect, onHover });
  useEffect(() => {
    handlers.current = { onSelect, onHover };
  }, [onSelect, onHover]);

  // Pins: add, update and remove as listings change.
  useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    if (status !== "ready" || !map || !lib) return;
    const seen = new Set<string>();
    properties.forEach((p, i) => {
      seen.add(p.id);
      const existing = markers.current.get(p.id);
      const label = pinLabel(p);
      if (existing) {
        existing.marker.setLngLat([p.coordinates.lng, p.coordinates.lat]);
        existing.el.querySelector(".ac-pin-label")!.textContent = label;
        return;
      }
      const wrap = document.createElement("div");
      const el = document.createElement("button");
      el.type = "button";
      el.className = "ac-pin";
      el.style.animationDelay = `${120 + i * 70}ms`;
      el.setAttribute("aria-label", `${p.name}: ${p.cultivableAcres.toFixed(2)} cultivable acres, ${formatCurrency(p.rentPerAcreMonthly)} per acre per month`);
      el.dataset.propertyId = p.id;
      el.innerHTML = `<span class="ac-pin-dot"></span><span class="ac-pin-label"></span>`;
      el.querySelector(".ac-pin-label")!.textContent = label;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        handlers.current.onSelect?.(p.id);
      });
      el.addEventListener("mouseenter", () => handlers.current.onHover?.(p.id));
      el.addEventListener("mouseleave", () => handlers.current.onHover?.(null));
      el.addEventListener("focus", () => handlers.current.onHover?.(p.id));
      el.addEventListener("blur", () => handlers.current.onHover?.(null));
      wrap.appendChild(el);
      const marker = new lib.Marker({ element: wrap, anchor: "bottom" }).setLngLat([p.coordinates.lng, p.coordinates.lat]).addTo(map);
      markers.current.set(p.id, { marker, el });
    });
    for (const [id, m] of markers.current) {
      if (!seen.has(id)) {
        m.marker.remove();
        markers.current.delete(id);
      }
    }
  }, [properties, status, mapRef, libRef]);

  // Highlight state on pins.
  useEffect(() => {
    for (const [id, { el, marker }] of markers.current) {
      el.classList.toggle("is-active", id === selectedId);
      el.classList.toggle("is-hover", id === hoveredId && id !== selectedId);
      const z = id === selectedId ? "3" : id === hoveredId ? "2" : "1";
      marker.getElement().style.zIndex = z;
    }
  }, [selectedId, hoveredId, status, properties]);

  // Camera: fly to the selection, otherwise frame the focus set.
  const focusKey = (focusIds ?? []).join("|");
  useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    if (status !== "ready" || !map || !lib) return;
    const duration = reduce ? 0 : 900;
    const selected = selectedId ? properties.find((p) => p.id === selectedId) : null;
    if (selected) {
      map.flyTo({
        center: [selected.coordinates.lng, selected.coordinates.lat],
        zoom: Math.max(map.getZoom(), 9.5),
        duration,
        curve: 1.42,
        essential: true,
        padding: { top: 40, left: 40, right: 40 + (insets?.right ?? 0), bottom: 40 + (insets?.bottom ?? 0) },
      });
      return;
    }
    const ids = focusKey ? focusKey.split("|") : [];
    const pts = (ids.length ? properties.filter((p) => ids.includes(p.id)) : []).map((p) => p.coordinates);
    if (pts.length === 0) {
      map.fitBounds(NS_VIEW, { padding: 24, duration });
      return;
    }
    const b = new lib.LngLatBounds();
    pts.forEach((c) => b.extend([c.lng, c.lat]));
    map.fitBounds(b, { padding: 90, maxZoom: 10, duration });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- properties only matter for coordinates of the ids in focusKey
  }, [selectedId, focusKey, status, reduce]);

  // Travel radius for the acting grower.
  const circleKey = travelCircle ? `${travelCircle.center.lat},${travelCircle.center.lng},${travelCircle.km}` : "";
  useEffect(() => {
    const map = mapRef.current;
    if (status !== "ready" || !map) return;
    const data: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: travelCircle ? [circlePolygon(travelCircle.center, travelCircle.km)] : [],
    };
    const src = map.getSource("travel") as GeoJSONSource | undefined;
    if (src) src.setData(data);
    else {
      map.addSource("travel", { type: "geojson", data });
      map.addLayer({ id: "travel-fill", type: "fill", source: "travel", paint: { "fill-color": "#7FA874", "fill-opacity": 0.18 } });
      map.addLayer({ id: "travel-line", type: "line", source: "travel", paint: { "line-color": "#0F5A3E", "line-width": 2, "line-dasharray": [2, 2], "line-opacity": 0.75 } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- circleKey captures the circle's identity
  }, [circleKey, status]);

  return (
    <div className={cn("overflow-hidden bg-cream", className ?? "relative h-full")} data-testid="land-map" data-status={status}>
      <div ref={container} style={FILL} />
      {status === "loading" && <MapSkeleton />}
      {status === "error" && <MapFallback />}
      {status === "ready" && travelCircle && (
        <div className="pointer-events-none absolute top-3 left-3 rounded-full border border-line bg-paper/90 px-3 py-1 text-[11.5px] text-forest shadow-soft backdrop-blur">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full border border-forest/60 bg-sage/60 align-middle" />
          {travelCircle.label}
        </div>
      )}
    </div>
  );
}

/** Small read-only context map with one pin. */
export function LocationMiniMap({ coordinates, label, className }: { coordinates: LatLng; label: string; className?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const { status, mapRef, libRef } = useMapLibre(container, { interactive: false, center: coordinates, zoom: 7.2 });
  useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    if (status !== "ready" || !map || !lib) return;
    const el = document.createElement("div");
    el.className = "ac-dot-pin";
    const marker = new lib.Marker({ element: el }).setLngLat([coordinates.lng, coordinates.lat]).addTo(map);
    map.jumpTo({ center: [coordinates.lng, coordinates.lat] });
    return () => {
      marker.remove();
    };
  }, [status, coordinates.lat, coordinates.lng, mapRef, libRef]);
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-line bg-cream", className)} aria-label={`Approximate location: ${label}`} role="img">
      <div ref={container} style={FILL} />
      {status === "loading" && <MapSkeleton />}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-cream text-[11.5px] text-muted">
          <MapPinOff className="h-3.5 w-3.5" /> Map offline
        </div>
      )}
    </div>
  );
}

/** Click or drag to place an approximate pin. Reports coordinates back to the form. */
export function PinPickerMap({ value, onChange, className }: { value: LatLng; onChange: (v: LatLng) => void; className?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const { status, mapRef, libRef } = useMapLibre(container, { interactive: true, center: value, zoom: 8 });
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    if (status !== "ready" || !map || !lib) return;
    const el = document.createElement("div");
    el.className = "ac-dot-pin ac-dot-pin-lg";
    const marker = new lib.Marker({ element: el, draggable: true }).setLngLat([value.lng, value.lat]).addTo(map);
    markerRef.current = marker;
    const round = (n: number) => Math.round(n * 1e4) / 1e4;
    marker.on("dragend", () => {
      const ll = marker.getLngLat();
      onChangeRef.current({ lat: round(ll.lat), lng: round(ll.lng) });
    });
    map.on("click", (e) => {
      marker.setLngLat(e.lngLat);
      onChangeRef.current({ lat: round(e.lngLat.lat), lng: round(e.lngLat.lng) });
    });
    return () => {
      marker.remove();
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- create once when ready; position syncs below
  }, [status]);

  useEffect(() => {
    const m = markerRef.current;
    const map = mapRef.current;
    if (!m || !map) return;
    const cur = m.getLngLat();
    if (Math.abs(cur.lat - value.lat) > 1e-5 || Math.abs(cur.lng - value.lng) > 1e-5) {
      m.setLngLat([value.lng, value.lat]);
      map.easeTo({ center: [value.lng, value.lat], duration: 600 });
    }
  }, [value.lat, value.lng, mapRef]);

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-line bg-cream", className)} data-testid="pin-picker" data-status={status}>
      <div ref={container} style={FILL} />
      {status === "loading" && <MapSkeleton />}
      {status === "error" && <MapFallback compact />}
    </div>
  );
}
