"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Bot, FileText, Loader2, Sparkles } from "lucide-react";
import type { ExplanationFacts } from "@/lib/engine/explain";
import { templateExplanation } from "@/lib/engine/explain";
import { Badge, Button, Card } from "./ui";

interface LlmStatus {
  configured: boolean;
  model: string | null;
}

export function ExplanationPanel({ facts, fingerprint }: { facts: ExplanationFacts; fingerprint: string }) {
  const template = useMemo(() => templateExplanation(facts), [facts]);
  const [status, setStatus] = useState<LlmStatus | null>(null);
  const [narrative, setNarrative] = useState<{ text: string; model: string; fingerprint: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/explain")
      .then((r) => r.json() as Promise<LlmStatus>)
      .then((s) => !cancelled && setStatus(s))
      .catch(() => !cancelled && setStatus({ configured: false, model: null }));
    return () => {
      cancelled = true;
    };
  }, []);

  const currentNarrative = narrative && narrative.fingerprint === fingerprint ? narrative : null;

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facts }),
      });
      const data = (await res.json()) as { text?: string; model?: string; error?: string };
      if (!res.ok || !data.text) throw new Error(data.error ?? "The language model did not return a narrative.");
      setNarrative({ text: data.text, model: data.model ?? "unknown", fingerprint });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  const [more, setMore] = useState(false);
  const [first, ...rest] = template.paragraphs;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-forest" />
          <h3 className="font-medium text-forest">Why this plan</h3>
        </div>
        <Badge tone="neutral">Rule-based · generated from engine output</Badge>
      </div>
      <p className="mt-3 font-serif text-[19px] leading-snug text-forest">{template.headline}</p>
      <div className="mt-3 space-y-2.5 text-[13.5px] leading-relaxed text-ink/85">
        {first && <p>{first}</p>}
        {more && rest.map((p, i) => <p key={i}>{p}</p>)}
      </div>
      {rest.length > 0 && (
        <button type="button" onClick={() => setMore((m) => !m)} className="mt-2 text-[12.5px] font-medium text-forest hover:underline" aria-expanded={more}>
          {more ? "Show less" : "Read the full explanation"}
        </button>
      )}

      {status && !status.configured ? (
        <p className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-[12px] text-muted">
          <Bot className="h-3.5 w-3.5" /> AI narrative: <Badge tone="neutral">LLM not configured</Badge>
          <span title="Set LLM_API_KEY to let a language model rewrite these structured facts. It can't change decisions.">
            Optional. The explanation above needs no AI.
          </span>
        </p>
      ) : (
      <div className="mt-5 rounded-xl border border-line bg-cream/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[13px] font-medium text-forest">
            <Bot className="h-4 w-4" /> Plain-language AI narrative (optional)
          </div>
          {status === null ? (
            <span className="skeleton h-5 w-28 rounded-full" />
          ) : (
            <Badge tone="sage">LLM connected · {status.model}</Badge>
          )}
        </div>
        {status?.configured && !currentNarrative && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button size="sm" variant="secondary" onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {loading ? "Writing narrative…" : "Generate AI narrative"}
            </Button>
            <span className="text-[12px] text-muted">The model receives only the structured facts; the engine decides feasibility.</span>
          </div>
        )}
        {loading && (
          <div className="mt-3 space-y-2">
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-5/6 rounded" />
            <div className="skeleton h-3 w-2/3 rounded" />
          </div>
        )}
        {error && (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2 text-[12.5px] text-danger">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error} The rule-based explanation above remains accurate.
          </p>
        )}
        {currentNarrative && (
          <div className="mt-3">
            <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-ink/90">{currentNarrative.text}</p>
            <p className="mt-2 text-[11.5px] text-muted">
              Written by {currentNarrative.model} from the structured facts only. Verify against the rule-based breakdown.
            </p>
          </div>
        )}
      </div>
      )}
    </Card>
  );
}
