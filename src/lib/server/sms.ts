const SIMULATE =
  process.env.NEXT_PUBLIC_SMS_SIMULATE !== "0" &&
  process.env.SMS_SIMULATE !== "0";

/**
 * Deliver a confirmation SMS back to a citizen's own number.
 *
 * Free & honest by default: with no gateway configured this returns
 * `channel: "simulated"` and nothing is actually sent — the message is
 * surfaced in the citizen inbox + HQ panel so the flow works end-to-end with
 * zero cost. Flip it to a real gateway in one step:
 *
 *   NEXT_PUBLIC_SMS_SIMULATE=0 + FAST2SMS_API_KEY=xxx
 *
 * Fast2SMS is the cheapest India-friendly transactional gateway (works
 * without DLT for a proof-of-concept / team-number demo).
 */
export async function sendCitizenSms(input: {
  to: string;
  text: string;
}): Promise<{
  ok: boolean;
  channel: "simulated" | "fast2sms";
  to: string;
  detail: string;
  at: string;
}> {
  const at = new Date().toISOString();

  if (SIMULATE) {
    return { ok: true, channel: "simulated", to: input.to, detail: "not sent (simulated)", at };
  }

  const key = process.env.FAST2SMS_API_KEY;
  if (!key) {
    return {
      ok: false,
      channel: "simulated",
      to: input.to,
      detail: "FAST2SMS_API_KEY missing — falling back to simulated",
      at,
    };
  }

  const digits = input.to.replace(/\D/g, "");
  const country = digits.length === 12 && digits.startsWith("91") ? "91" : "";
  const mobile = country ? digits.slice(2) : digits;

  try {
    const res = await fetch(
      `https://www.fast2sms.com/dev/bulkV2?authorization=${key}` +
        `&route=dtpl&language=english&flash=0` +
        `&numbers=${encodeURIComponent(mobile)}` +
        `&message=${encodeURIComponent(input.text)}${country ? `&sender_id=ASARTH` : ""}`,
      { cache: "no-store" }
    );
    const json = (await res.json().catch(() => ({}))) as { return?: boolean; message?: string };
    return {
      ok: !!json.return,
      channel: "fast2sms",
      to: input.to,
      detail: `${res.status} ${json.message ?? ""}`,
      at,
    };
  } catch (err) {
    return {
      ok: false,
      channel: "fast2sms",
      to: input.to,
      detail: `error: ${err instanceof Error ? err.message : String(err)}`,
      at,
    };
  }
}