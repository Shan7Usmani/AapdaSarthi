import type { DistrictRiskOutput } from "@/lib/risk";

/**
 * Gemini risk-assessment enhancement (server-only).
 * Generates the natural-language "AI verdict" that powers the HQ command
 * center narrative. Degrades gracefully: if GEMINI_API_KEY is absent or the
 * call fails, callers get null and fall back to deterministic text.
 */

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiCandidate {
  content?: { parts?: { text?: string }[] };
}

export interface GeminiAssessment {
  summary: string; // short (1-3 sentences) plain-language situation
  actions: string[]; // recommended immediate actions
  riskZones: string[]; // top district names to watch
}

function pickText(candidates: GeminiCandidate[] | undefined): string | null {
  const text = candidates?.[0]?.content?.parts?.[0]?.text;
  return text && text.trim() ? text.trim() : null;
}

/** Deterministic fallback when Gemini is unavailable. */
export function deterministicAssessment(
  critical: DistrictRiskOutput[],
  high: DistrictRiskOutput[],
  date: string
): GeminiAssessment {
  const zones = [...critical, ...high]
    .slice(0, 5)
    .map((d) => `${d.name} (${d.riskScore})`);
  const summary =
    critical.length + high.length === 0
      ? `As of ${date}, current rainfall telemetry shows no districts at HIGH or CRITICAL flood risk within the next 48h. Monitored regions remain within safe thresholds.`
      : `As of ${date}, ${critical.length} district${critical.length === 1 ? "" : "s"} at CRITICAL and ${high.length} at HIGH flood risk over the next 48h based on live rainfall intensity and 24h accumulation.`;
  return {
    summary,
    actions:
      critical.length + high.length === 0
        ? ["Continue routine rainfall monitoring.", "Keep alert templates armed for rapid broadcast."]
        : [
            "Pre-position rescue boats in the most affected belt.",
            "Trigger multilingual SMS to HIGH and CRITICAL districts.",
            "Stage medical + ration kits at the nearest relief hubs.",
          ],
    riskZones: zones,
  };
}

/**
 * Ask Gemini for a concise situation assessment given the top districts.
 * `deterministic` falls back when there's no key or the call errors.
 */
export async function getGeminiAssessment(
  top: DistrictRiskOutput[]
): Promise<GeminiAssessment> {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const date = new Date().toISOString().slice(0, 10);

  if (!key) return deterministicAssessment([], [], date);

  const critical = top.filter((d) => d.severity === "CRITICAL");
  const high = top.filter((d) => d.severity === "HIGH");

  // Even with a key, a tiny `top` (calm nation) can skip the round-trip.
  if (critical.length + high.length === 0) {
    return deterministicAssessment(critical, high, date);
  }

  const topList = top
    .slice(0, 8)
    .map(
      (d) =>
        `${d.name}, ${d.state}: risk ${d.riskScore}/100 (${d.severity}), ${d.precipitation.toFixed(1)} mm/hr, ${Math.round(d.precipitation24h)} mm/24h`
    )
    .join("\n");

  const prompt = `You are the AI risk engine of AapdaSarthi, an emergency flood-response command centre for India.

Given this LIVE rainfall telemetry for the top at-risk districts:
${topList}

Produce a brief situation report in EXACTLY this shape:
SUMMARY: (1-3 sentences, plain language, non-technical authorities can act on)
ACTIONS: (bullet list of 2-4 concrete immediate actions for emergency responders)
ZONES: (comma-separated top district names to watch)

Today's date: ${date}. Do not invent data not in the telemetry.`;

  try {
    const res = await fetch(`${ENDPOINT}/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return deterministicAssessment(critical, high, date);
    const json = await res.json();
    const text = pickText(json?.candidates);
    if (!text) return deterministicAssessment(critical, high, date);

    // Parse the shaped response defensively.
    const summary =
      text.match(/SUMMARY:\s*([^\n]+)/i)?.[1]?.trim() ||
      text.split("\n")[0].replace(/^SUMMARY:\s*/i, "").trim();
    const actions = (text.match(/ACTIONS:([\s\S]*?)(?=\nZONES:|$)/i)?.[1] || "")
      .split("\n")
      .map((l) => l.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 4);
    const zones =
      (text.match(/ZONES:\s*([^\n]+)/i)?.[1] || "")
        .split(",")
        .map((z) => z.trim())
        .filter(Boolean)
        .slice(0, 6) || top.slice(0, 5).map((d) => d.name);

    return {
      summary:
        summary ||
        deterministicAssessment(critical, high, date).summary,
      actions: actions.length ? actions : deterministicAssessment(critical, high, date).actions,
      riskZones: zones,
    };
  } catch {
    return deterministicAssessment(critical, high, date);
  }
}
