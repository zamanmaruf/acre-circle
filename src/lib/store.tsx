"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { acceptRequest, createRequest, declineRequest, markViewed } from "./requests";
import {
  DEFAULT_ACTING_GROWER_ID,
  DEFAULT_PROPERTY_ID,
  SEED_GROWERS,
  SEED_NOTIFICATIONS,
  SEED_PROPERTIES,
  SEED_REQUESTS,
} from "./seed";
import type { AgreementDraft, AllocationResult, AppNotification, Grower, PlotRequest, Property, Role } from "./types";

const STORAGE_KEY = "acre-circle-demo";
const STATE_VERSION = 3;

export interface DemoState {
  version: number;
  properties: Property[];
  growers: Grower[];
  activePropertyId: string;
  results: Record<string, AllocationResult>;
  agreements: Record<string, AgreementDraft>;
  role: Role | null;
  actingGrowerId: string;
  requests: PlotRequest[];
  notifications: AppNotification[];
}

function seedState(): DemoState {
  return {
    version: STATE_VERSION,
    properties: structuredClone(SEED_PROPERTIES),
    growers: structuredClone(SEED_GROWERS),
    activePropertyId: DEFAULT_PROPERTY_ID,
    results: {},
    agreements: {},
    role: null,
    actingGrowerId: DEFAULT_ACTING_GROWER_ID,
    requests: structuredClone(SEED_REQUESTS),
    notifications: structuredClone(SEED_NOTIFICATIONS),
  };
}

function loadState(): DemoState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoState;
    if (
      parsed.version !== STATE_VERSION ||
      !Array.isArray(parsed.properties) ||
      !Array.isArray(parsed.growers) ||
      !Array.isArray(parsed.requests) ||
      !Array.isArray(parsed.notifications)
    )
      return null;
    return parsed;
  } catch {
    return null;
  }
}

const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

export type RequestDecision = { type: "accept" } | { type: "decline"; reason: string };

interface StoreApi {
  state: DemoState;
  hydrated: boolean;
  activeProperty: Property;
  actingGrower: Grower | undefined;
  setActiveProperty: (id: string) => void;
  saveProperty: (p: Property) => void;
  saveGrower: (g: Grower) => void;
  removeGrower: (id: string) => void;
  saveResult: (r: AllocationResult) => void;
  saveAgreement: (a: AgreementDraft) => void;
  setRole: (role: Role) => void;
  setActingGrower: (id: string) => void;
  sendRequest: (input: { propertyId: string; requestedAcres: number; message: string }) => { request: PlotRequest; created: boolean };
  markRequestViewed: (id: string) => void;
  respondToRequest: (id: string, decision: RequestDecision) => void;
  markNotificationsRead: (audience: AppNotification["audience"]) => void;
  /** Restores the state from just before the last request action. */
  undo: () => void;
  reset: () => void;
}

const StoreContext = createContext<StoreApi | null>(null);

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(seedState);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  const undoSnapshot = useRef<DemoState | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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

  const commit = useCallback((next: DemoState, undoable = false) => {
    if (undoable) undoSnapshot.current = stateRef.current;
    stateRef.current = next;
    setState(next);
  }, []);

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

  const setRole = useCallback((role: Role) => setState((s) => ({ ...s, role })), []);
  const setActingGrower = useCallback((id: string) => setState((s) => ({ ...s, actingGrowerId: id })), []);

  const sendRequest = useCallback<StoreApi["sendRequest"]>(
    (input) => {
      const s = stateRef.current;
      const now = new Date().toISOString();
      const out = createRequest(s.requests, { ...input, growerId: s.actingGrowerId }, { id: newId("req"), now });
      if (!out.created) return out;
      const grower = s.growers.find((g) => g.id === s.actingGrowerId);
      const property = s.properties.find((p) => p.id === input.propertyId);
      const note: AppNotification = {
        id: newId("note"),
        audience: "landowner",
        propertyId: input.propertyId,
        growerId: s.actingGrowerId,
        text: `${grower?.name ?? "A grower"} requested ${input.requestedAcres.toFixed(2)} ac at ${property?.name ?? "your property"}.`,
        href: "/inbox",
        read: false,
        createdAt: now,
      };
      commit({ ...s, requests: out.requests, notifications: [note, ...s.notifications] }, true);
      return out;
    },
    [commit],
  );

  const markRequestViewed = useCallback(
    (id: string) =>
      setState((s) => {
        const r = s.requests.find((x) => x.id === id);
        if (!r || r.status !== "sent") return s;
        const now = new Date().toISOString();
        return { ...s, requests: s.requests.map((x) => (x.id === id ? markViewed(x, now) : x)) };
      }),
    [],
  );

  const respondToRequest = useCallback(
    (id: string, decision: RequestDecision) => {
      const s = stateRef.current;
      const r = s.requests.find((x) => x.id === id);
      if (!r) return;
      const now = new Date().toISOString();
      const property = s.properties.find((p) => p.id === r.propertyId);
      let requests = s.requests;
      let growers = s.growers;
      let text: string;
      if (decision.type === "accept") {
        const grower = s.growers.find((g) => g.id === r.growerId);
        if (!grower) return;
        const out = acceptRequest(r, grower, now);
        requests = s.requests.map((x) => (x.id === id ? out.request : x));
        growers = s.growers.map((g) => (g.id === grower.id ? out.grower : g));
        text = `${property?.name ?? "The owner"} accepted your request. You're now an applicant in the shared plot plan.`;
      } else {
        const updated = declineRequest(r, decision.reason, now);
        requests = s.requests.map((x) => (x.id === id ? updated : x));
        text = `${property?.name ?? "The owner"} declined your request: ${updated.declineReason}`;
      }
      const note: AppNotification = {
        id: newId("note"),
        audience: "grower",
        growerId: r.growerId,
        propertyId: r.propertyId,
        text,
        href: "/requests",
        read: false,
        createdAt: now,
      };
      commit({ ...s, requests, growers, notifications: [note, ...s.notifications] }, true);
    },
    [commit],
  );

  const markNotificationsRead = useCallback(
    (audience: AppNotification["audience"]) =>
      setState((s) =>
        s.notifications.some((n) => n.audience === audience && !n.read)
          ? { ...s, notifications: s.notifications.map((n) => (n.audience === audience ? { ...n, read: true } : n)) }
          : s,
      ),
    [],
  );

  const undo = useCallback(() => {
    const snap = undoSnapshot.current;
    if (!snap) return;
    undoSnapshot.current = null;
    commit(snap);
  }, [commit]);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    undoSnapshot.current = null;
    commit(seedState());
  }, [commit]);

  const activeProperty = useMemo(
    () => state.properties.find((p) => p.id === state.activePropertyId) ?? state.properties[0],
    [state.properties, state.activePropertyId],
  );
  const actingGrower = useMemo(() => state.growers.find((g) => g.id === state.actingGrowerId), [state.growers, state.actingGrowerId]);

  const api = useMemo<StoreApi>(
    () => ({
      state,
      hydrated,
      activeProperty,
      actingGrower,
      setActiveProperty,
      saveProperty,
      saveGrower,
      removeGrower,
      saveResult,
      saveAgreement,
      setRole,
      setActingGrower,
      sendRequest,
      markRequestViewed,
      respondToRequest,
      markNotificationsRead,
      undo,
      reset,
    }),
    [
      state,
      hydrated,
      activeProperty,
      actingGrower,
      setActiveProperty,
      saveProperty,
      saveGrower,
      removeGrower,
      saveResult,
      saveAgreement,
      setRole,
      setActingGrower,
      sendRequest,
      markRequestViewed,
      respondToRequest,
      markNotificationsRead,
      undo,
      reset,
    ],
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useDemoStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useDemoStore must be used inside DemoStoreProvider");
  return ctx;
}
