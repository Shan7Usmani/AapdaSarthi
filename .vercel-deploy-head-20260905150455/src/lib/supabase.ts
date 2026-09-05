"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Lazily-initialised Supabase client for cross-device SOS + resource-request
 * sync. Returns null when credentials aren't configured (env absent), so the
 * whole app degrades gracefully to the existing localStorage-only flow —
 * the demo works with zero config, and upgrades to realtime the moment
 * NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY are set.
 */

let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    client = null;
    return client;
  }
  try {
    client = createClient(url, anon, {
      auth: { persistSession: false },
    });
  } catch {
    client = null;
  }
  return client;
}

export function isSupabaseConfigured(): boolean {
  return !!getSupabase();
}
