import { NextRequest } from "next/server";
import { getIndiaDistricts } from "@/lib/server/weather";
import { getAiAssessment, deterministicAssessment } from "@/lib/server/ai";
import { sortByRisk } from "@/lib/risk";

export const dynamic = "force-dynamic";

/**
 * GET /api/risk
 *
 * Nationwide live flood-risk assessment.
 * Query params:
 *   ?limit=20          cap the returned district list (default 594, all)
 *   ?ai=0              skip the (optional + key-gated) Gemini narrative
 *
 * Response:
 * {
 *   generatedAt, source: "live"|"seeded", gemini: boolean,
 *   districts: DistrictRiskOutput[] (all India, sorted worst-first),
 *   summary: { summary, actions, riskZones }  // Gemini or deterministic
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const limit = parseInt(searchParams.get("limit") ?? "0", 10);
    const ai = searchParams.get("ai") !== "0";
    const wantDebug = searchParams.get("debug") === "1";
    const debugLog: string[] = [];
    const debug = (m: string) => debugLog.push(m);

    const { districts, source } = await getIndiaDistricts();
    const sorted = sortByRisk(districts);

    let assessment;
    let provider = "deterministic";
    if (ai) {
      const res = await getAiAssessment(sorted, wantDebug ? debug : undefined);
      assessment = res.assessment;
      provider = res.provider;
    } else {
      const critical = sorted.filter((d) => d.severity === "CRITICAL");
      const high = sorted.filter((d) => d.severity === "HIGH");
      assessment = deterministicAssessment(
        critical,
        high,
        new Date().toISOString().slice(0, 10)
      );
    }

    const out = limit > 0 ? sorted.slice(0, limit) : sorted;

    return Response.json(
      {
        generatedAt: new Date().toISOString(),
        source,
        provider,
        gemini: ai && provider === "gemini",
        debug: wantDebug ? debugLog : undefined,
        count: out.length,
        totalDistricts: districts.length,
        summary: assessment,
        districts: out,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    return Response.json(
      { error: "risk engine unavailable", detail: String(err) },
      { status: 500 }
    );
  }
}
