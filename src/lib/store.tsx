"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_PROPERTY_ID, SEED_GROWERS, SEED_PROPERTIES } from "./seed";
import type { AgreementDraft, AllocationResult, Grower, Property } from "./types";

const STORAGE_KEY = "acre-circle-demo";
const STATE_VERSION = 1;

export interface DemoState {
  version: number;
  properties: Property[];
  growers: Grower[];
  activePropertyId: string;
  results: Record<string, AllocationResult>;
  agreements: Record<string, AgreementDraft>;
}

function seedState(): DemoState {
  return {
    version: STATE_VERSION,
    properties: structuredClone(SEED_PROPERTIES),
    growers: structuredClone(SEED_GROWERS),
    activePropertyId: DEFAULT_PROPERTY_ID,
    results: {},
    agreements: {},
  };
}

function loadState(): DemoState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoState;
    if (parsed.version !== STATE_VERSION || !Array.isArray(parsed.properties) || !Array.isArray(parsed.growers)) return null;
    return parsed;
  } catch {
    return null;
  }
}

interface StoreApi {
  state: DemoState;
  hydrated: boolean;
  activeProperty: Property;
  setActiveProperty: (id: string) => void;
  saveProperty: (p: Property) => void;
  saveGrower: (g: Grower) => void;
  removeGrower: (id: string) => void;
  saveResult: (r: AllocationResult) => void;
  saveAgreement: (a: AgreementDraft) => void;
  reset: () => void;
}

const StoreContext = createContext<StoreApi | null>(null);

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(seedState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadState();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage after mount
    if (stored) setState(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage may be full or disabled; the demo keeps working in memory.
    }
  }, [state, hydrated]);

  const setActiveProperty = useCallback((id: string) => setState((s) => ({ ...s, activePropertyId: id })), []);

  const saveProperty = useCallback(
    (p: Property) =>
      setState((s) => {
        const exists = s.properties.some((x) => x.id === p.id);
        return {
          ...s,
          properties: exists ? s.properties.map((x) => (x.id === p.id ? p : x)) : [...s.properties, p],
          activePropertyId: p.id,
        };
      }),
    [],
  );

  const saveGrower = useCallback(
    (g: Grower) =>
      setState((s) => {
        const exists = s.growers.some((x) => x.id === g.id);
        return { ...s, growers: exists ? s.growers.map((x) => (x.id === g.id ? g : x)) : [...s.growers, g] };
      }),
    [],
  );

  const removeGrower = useCallback(
    (id: string) => setState((s) => ({ ...s, growers: s.growers.filter((g) => g.id !== id) })),
    [],
  );

  const saveResult = useCallback(
    (r: AllocationResult) => setState((s) => ({ ...s, results: { ...s.results, [r.propertyId]: r } })),
    [],
  );

  const saveAgreement = useCallback(
    (a: AgreementDraft) => setState((s) => ({ ...s, agreements: { ...s.agreements, [a.key]: a } })),
    [],
  );

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setState(seedState());
  }, []);

  const activeProperty = useMemo(
    () => state.properties.find((p) => p.id === state.activePropertyId) ?? state.properties[0],
    [state.properties, state.activePropertyId],
  );

  const api = useMemo<StoreApi>(
    () => ({ state, hydrated, activeProperty, setActiveProperty, saveProperty, saveGrower, removeGrower, saveResult, saveAgreement, reset }),
    [state, hydrated, activeProperty, setActiveProperty, saveProperty, saveGrower, removeGrower, saveResult, saveAgreement, reset],
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useDemoStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useDemoStore must be used inside DemoStoreProvider");
  return ctx;
}
