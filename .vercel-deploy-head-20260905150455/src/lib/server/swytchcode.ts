type SwytchRuntime = {
  execute: (req: { tool: string; input: Record<string, unknown> }) => Promise<unknown>;
};

export interface SwytchDispatchResult {
  channel: "swytchcode" | "simulated";
  tool?: string;
  detail?: string;
  at: string;
}

export interface AlertPayload {
  lang: string;
  region: string;
  sms: string;
  recipients: number;
}

export async function dispatchAlert(payload: AlertPayload): Promise<SwytchDispatchResult> {
  const at = new Date().toISOString();
  const tool = process.env.SWYTCHCODE_TOOL_ID;

  const unavailable = (detail: string): SwytchDispatchResult => ({
    channel: "simulated",
    tool,
    detail,
    at,
  });

  if (process.env.SWYTCHCODE_ENABLED !== "1") {
    return unavailable("SWYTCHCODE_ENABLED is not set to 1 — broadcast queued locally");
  }
  if (!tool) {
    return unavailable("SWYTCHCODE_TOOL_ID is not set — connect a tool via `swy auth connect`");
  }

  try {
    const mod = (await import("@swytchcode/runtime").catch(() => null)) as
      | { SwytchcodeRuntime: new () => SwytchRuntime }
      | null;
    if (!mod) {
      return unavailable("@swytchcode/runtime is not installed");
    }
    const runtime = new mod.SwytchcodeRuntime();
    const out = await runtime.execute({ tool, input: { ...payload, timestamp: at } });
    return { channel: "swytchcode", tool, detail: JSON.stringify(out).slice(0, 400), at };
  } catch (err) {
    return { channel: "simulated", tool, detail: `swytchcode execution failed: ${String(err)}`, at };
  }
}