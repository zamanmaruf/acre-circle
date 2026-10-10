"use client";

import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DURATION, EASE } from "@/lib/motion";

interface ToastInput {
  message: string;
  action?: { label: string; onClick: () => void };
  durationMs?: number;
}
interface ToastItem extends ToastInput {
  id: number;
}

const ToastContext = createContext<((t: ToastInput) => void) | null>(null);

/** Material-style snackbar: one message at a time, bottom centre, optional action. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const counter = useRef(0);
  const show = useCallback((t: ToastInput) => setToast({ ...t, id: ++counter.current }), []);
  const dismiss = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(dismiss, toast.durationMs ?? (toast.action ? 6000 : 4000));
    return () => window.clearTimeout(timer);
  }, [toast, dismiss]);

  const value = useMemo(() => show, [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="no-print pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4" aria-live="polite" role="status">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, transition: { duration: DURATION.short, ease: EASE.emphasizedAccelerate } }}
              transition={{ duration: DURATION.long, ease: EASE.emphasizedDecelerate }}
              className="pointer-events-auto flex max-w-lg items-center gap-3 rounded-2xl bg-forest-deep py-2.5 pr-2 pl-4 text-[13.5px] text-paper shadow-lift"
              data-testid="toast"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-sage" />
              <span className="flex-1">{toast.message}</span>
              {toast.action && (
                <button
                  type="button"
                  className="state-layer rounded-full px-3 py-1.5 text-[13px] font-semibold text-gold"
                  onClick={() => {
                    toast.action?.onClick();
                    dismiss();
                  }}
                >
                  {toast.action.label}
                </button>
              )}
              <button type="button" onClick={dismiss} className="rounded-full p-1.5 text-paper/60 hover:text-paper" aria-label="Dismiss">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
