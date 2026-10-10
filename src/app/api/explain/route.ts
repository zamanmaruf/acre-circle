import { z } from "zod";

const apiKey = () => process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "";
const baseUrl = () => (process.env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
const model = () => process.env.LLM_MODEL || "gpt-4o-mini";

const FactsSchema = z.object({
  facts: z
    .object({
      property: z.record(z.string(), z.unknown()),
      objective: z.string(),
      placements: z.array(z.record(z.string(), z.unknown())),
      notPlaced: z.array(z.record(z.string(), z.unknown())),
      totals: z.record(z.string(), z.unknown()),
      openIssues: z.array(z.string()),
      assumptions: z.array(z.string()),
    })
    .strict(),
});

const SYSTEM_PROMPT = `You explain land-allocation results for Acre Circle, an agricultural land-sharing prototype in Nova Scotia.
A deterministic constraint engine has ALREADY decided the allocation. You must not change, second-guess or add to its decisions.
Write 2 short paragraphs (max 170 words total) in plain, warm, professional English for a land-access coordinator.
Rules:
- Use ONLY the facts in the JSON provided. Do not invent numbers, names, places or reasons.
- Never claim or imply: verified land ownership, soil quality, crop yields, revenue or tax outcomes, legal eligibility or compliance, verified water access (unless the facts say verified), or real customers.
- Explicitly mention unresolved items that need real-world verification.
- State that this is a provisional proposal requiring human review.
- All data is synthetic demonstration data.`;

const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 10;
}

export async function GET() {
  const configured = apiKey().length > 0;
  return Response.json({ configured, model: configured ? model() : null });
}

export async function POST(request: Request) {
  if (!apiKey()) {
    return Response.json({ error: "No LLM is configured on the server." }, { status: 503 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) {
    return Response.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
  }
  const raw = await request.text();
  if (raw.length > 40_000) return Response.json({ error: "Request too large." }, { status: 413 });

  let parsed: z.infer<typeof FactsSchema>;
  try {
    parsed = FactsSchema.parse(JSON.parse(raw));
  } catch {
    return Response.json({ error: "Invalid explanation facts." }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    const res = await fetch(`${baseUrl()}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey()}` },
      body: JSON.stringify({
        model: model(),
        temperature: 0,
        seed: 7,
        max_tokens: 400,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Structured facts (JSON):\n${JSON.stringify(parsed.facts)}` },
        ],
      }),
    });
    clearTimeout(timer);
    if (!res.ok) {
      return Response.json({ error: `The LLM provider returned HTTP ${res.status}.` }, { status: 502 });
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return Response.json({ error: "The LLM returned an empty response." }, { status: 502 });
    return Response.json({ text, model: model() });
  } catch {
    return Response.json({ error: "Could not reach the LLM provider." }, { status: 502 });
  }
}
