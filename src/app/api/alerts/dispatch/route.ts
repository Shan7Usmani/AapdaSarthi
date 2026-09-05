import { NextRequest } from "next/server";
import { dispatchAlert } from "@/lib/server/swytchcode";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { lang?: string; region?: string; sms?: string; recipients?: number } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const result = await dispatchAlert({
    lang: body.lang ?? "en",
    region: body.region ?? "unknown",
    sms: body.sms ?? "",
    recipients: Number(body.recipients) || 0,
  });

  return Response.json(
    { ok: true, dispatched: result.channel === "swytchcode", ...result },
    { headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" } }
  );
}