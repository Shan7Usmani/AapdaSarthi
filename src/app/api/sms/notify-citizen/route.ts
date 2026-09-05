import { NextRequest } from "next/server";
import { sendCitizenSms } from "@/lib/server/sms";

export const dynamic = "force-dynamic";

/**
 * Send a confirmation back to a specific citizen's number straight from the
 * command centre (used for ad-hoc follow-ups; the lifecycle confirmations are
 * auto-generated in the store). Always targets the number the SOS came from.
 * SIMULATED until a real gateway is configured.
 */
export async function POST(req: NextRequest) {
  let body: { to?: string; text?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const to = (body.to ?? "").trim();
  const text = (body.text ?? "").trim();

  if (!to || !text) {
    return Response.json(
      { ok: false, error: "to and text are required" },
      { status: 400, headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" } }
    );
  }

  const result = await sendCitizenSms({ to, text });
  return Response.json(
    { ...result },
    { headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" } }
  );
}