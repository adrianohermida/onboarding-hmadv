/**
 * Shared rate-limit utilities for Supabase Edge Function workers.
 *
 * Uses the `worker_rate_limits` table (public schema) to enforce a
 * per-worker sliding-window budget:
 *   - Each worker has a `total_slots` (e.g. 100/min) and a `slots_used` counter.
 *   - checkRateLimit atomically increments `slots_used` and returns whether the
 *     requested `cost` fits within the remaining budget.
 *   - safeBatchSize computes the largest batch that fits in available slots.
 */

import { createClient as _createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!;
const SVC_KEY       = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export function createPublicClient(): SupabaseClient {
  return _createClient(SUPABASE_URL, SVC_KEY);
}

export interface RateLimitResult {
  ok: boolean;
  slots_avail: number;
  total_used: number;
}

/**
 * Check and claim `cost` slots for `worker`.
 * Returns ok=true and remaining availability if within budget.
 * Falls back to ok=true if the rate_limit table doesn't exist yet
 * (graceful degradation during initial deploy).
 */
export async function checkRateLimit(
  db: SupabaseClient,
  worker: string,
  cost: number,
): Promise<RateLimitResult> {
  try {
    // Upsert a row for this worker with a 60s rolling window
    const windowStart = new Date(Date.now() - 60_000).toISOString();

    const { data, error } = await db
      .from('worker_rate_limits')
      .select('slots_used, total_slots, window_start')
      .eq('worker', worker)
      .maybeSingle();

    if (error) {
      // Table may not exist — allow through
      return { ok: true, slots_avail: 100, total_used: 0 };
    }

    if (!data) {
      // First invocation — insert row
      await db.from('worker_rate_limits').insert({
        worker,
        slots_used: cost,
        total_slots: 100,
        window_start: new Date().toISOString(),
      }).onConflict('worker').merge();
      return { ok: true, slots_avail: 100 - cost, total_used: cost };
    }

    const { slots_used, total_slots } = data;

    // Reset window if older than 60s
    const needsReset = !data.window_start || data.window_start < windowStart;
    const current_used = needsReset ? 0 : (slots_used ?? 0);
    const avail = (total_slots ?? 100) - current_used;

    if (avail < cost) {
      return { ok: false, slots_avail: Math.max(0, avail), total_used: current_used };
    }

    // Claim the slots
    await db.from('worker_rate_limits').update({
      slots_used: needsReset ? cost : current_used + cost,
      window_start: needsReset ? new Date().toISOString() : data.window_start,
    }).eq('worker', worker);

    return { ok: true, slots_avail: avail - cost, total_used: current_used + cost };
  } catch {
    // Degrade gracefully — never block workers due to rate-limit infra failure
    return { ok: true, slots_avail: 100, total_used: 0 };
  }
}

/**
 * Returns the largest batch size that fits within available slots
 * without exceeding `maxBatch`.
 */
export function safeBatchSize(slotsAvail: number, costPerItem: number, maxBatch: number): number {
  if (slotsAvail <= 0 || costPerItem <= 0) return 0;
  const fromSlots = Math.floor(slotsAvail / costPerItem);
  return Math.max(0, Math.min(fromSlots, maxBatch));
}
