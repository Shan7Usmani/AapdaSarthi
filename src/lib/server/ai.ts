import type { DistrictRiskOutput } from "@/lib/risk";
import { deterministicAssessment } from "@/lib/server/gemini";

/**
 * Provider-agnostic AI verdict engine (server-only).
 *
 * Generates the short natural-language "situation report" that powers the HQ
 * command-center narrative from live rainfall telemetry. Supports Groq
 * (Llama, OpenAI-compatible chat completions) and Gemini (generateContent),
 * selected automatically from the configured keys or via AI_PROVIDER.
 *
 * Degrades gracefully: with no key or on any failure it falls back to the
 * deterministic template.
 *
 * Env:
 *   GROQ_API_KEY            -> enables Groq
 *   GROQ_MODEL              -> default "openai/gpt-oss-120b"
 *   GEMINI_API_KEY          -> enables Gemini
 *   GEMINI_MODEL            -> default "gemini-2.0-flash"
 *   AI_PROVIDER             -> "groq" | "gemini" | undefined (auto-detect)
 */

export interface AIAssessment {
  summary: string; // short (1-3 sentences) plain-language situation
  actions: string[]; // recommended immediate actions
  riskZones: string[]; // top district names to watch
}

export { deterministicAssessment };

const today = () => new Date().toISOString().slice(0, 10);

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

const criticalOf = (top: DistrictRiskOutput[]) =>
  top.filter((d) => d.severity === "CRITICAL");
const highOf = (top: DistrictRiskOutput[]) =>
  top.filter((d) => d.severity === "HIGH");

function buildPrompt(top: DistrictRiskOutput[], dateStr: string): string {
  const topList = top
    .slice(0, 8)
    .map(
      (d) =>
        `${d.name}, ${d.state}: risk ${d.riskScore}/100 (${d.severity}), ${d.precipitation.toFixed(1)} mm/hr, ${Math.round(d.precipitation24h)} mm/24h`
    )
    .join("\n");

  return `You are the AI risk engine of AapdaSarthi, an emergency flood-response command centre for India.

Given this LIVE rainfall telemetry for the top at-risk districts:
${topList}

Produce a brief situation report in EXACTLY this shape:
SUMMARY: (1-3 sentences, plain language, non-technical authorities can act on)
ACTIONS: (bullet list of 2-4 concrete immediate actions for emergency responders)
ZONES: (comma-separated top district names to watch)

Today's date: ${dateStr}. Do not invent data not in the telemetry.`;
}

function parseVerdict(text: string): { summary: string; actions: string[]; zones: string[] } {
  const summary =
    text.match(/SUMMARY:\s*([^\n]+)/i)?.[1]?.trim() ||
    text.split("\n")[0].replace(/^SUMMARY:\s*/i, "").trim();
  const actions = (text.match(/ACTIONS:([\s\S]*?)(?=\nZONES:|$)/i)?.[1] || "")
    .split("\n")
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 4);
  const zones = (text.match(/ZONES:\s*([^\n]+)/i)?.[1] || "")
    .split(",")
    .map((z) => z.trim())
    .filter(Boolean)
    .slice(0, 6);
  return { summary, actions, zones };
}

function fallback(top: DistrictRiskOutput[], dateStr: string): AIAssessment {
  return deterministicAssessment(criticalOf(top), highOf(top), dateStr);
}

async function askGroq(
  top: DistrictRiskOutput[],
  debug?: (m: string) => void
): Promise<AIAssessment | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    debug?.("GROQ_API_KEY not set");
    return null;
  }
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  const c = criticalOf(top);
  const h = highOf(top);
  if (c.length + h.length === 0) return null; // calm nation: skip round-trip
  const dateStr = today();

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content:
              "You are a concise disaster-response analyst. Answer only in the requested format.",
          },
          { role: "user", content: buildPrompt(top, dateStr) },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      debug?.(`groq http ${res.status}`);
      return null;
    }
    const json = await res.json();
    const text: string | undefined = json?.choices?.[0]?.message?.content;
    if (!text || !text.trim()) {
      debug?.("groq empty content");
      return null;
    }

    const { summary, actions, zones } = parseVerdict(text);
    const fb = fallback(top, dateStr);
    return {
      summary: summary || fb.summary,
      actions: actions.length ? actions : fb.actions,
      riskZones: zones.length ? zones : fb.riskZones,
    };
  } catch (e) {
    debug?.(`groq call failed: ${String(e)}`);
    return null;
  }
}

async function askGemini(
  top: DistrictRiskOutput[],
  debug?: (m: string) => void
): Promise<AIAssessment | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    debug?.("GEMINI_API_KEY not set");
    return null;
  }
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const c = criticalOf(top);
  const h = highOf(top);
  if (c.length + h.length === 0) return null;
  const dateStr = today();

  try {
    const res = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(top, dateStr) }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      debug?.(`gemini http ${res.status}`);
      return null;
    }
    const json = await res.json();
    const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || !text.trim()) {
      debug?.("gemini empty content");
      return null;
    }

    const { summary, actions, zones } = parseVerdict(text);
    const fb = fallback(top, dateStr);
    return {
      summary: summary || fb.summary,
      actions: actions.length ? actions : fb.actions,
      riskZones: zones.length ? zones : fb.riskZones,
    };
  } catch (e) {
    debug?.(`gemini call failed: ${String(e)}`);
    return null;
  }
}

/**
 * Route a risk verdict to the configured AI provider, else deterministic.
 * Returns the provider used (so the UI can label it) alongside the verdict.
 */
export async function getAiAssessment(
  top: DistrictRiskOutput[],
  debug?: (m: string) => void
): Promise<{
  assessment: AIAssessment;
  provider: "groq" | "gemini" | "deterministic";
}> {
  const provider = process.env.AI_PROVIDER;

  if (provider === "groq" || (provider !== "gemini" && process.env.GROQ_API_KEY)) {
    const groq = await askGroq(top, debug);
    if (groq) {
      debug?.(`groq OK, model=${process.env.GROQ_MODEL || "openai/gpt-oss-120b"}`);
      return { assessment: groq, provider: "groq" };
    }
  }

  if (provider === "gemini" || (provider !== "groq" && process.env.GEMINI_API_KEY)) {
    const gemini = await askGemini(top, debug);
    if (gemini) return { assessment: gemini, provider: "gemini" };
  }

  return { assessment: fallback(top, today()), provider: "deterministic" };
}
