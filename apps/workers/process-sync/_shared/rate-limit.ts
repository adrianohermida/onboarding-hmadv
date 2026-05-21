/**
 * Shared rate-limit utilities for the process-sync worker.
 * Identical contract to apps/workers/datajud/_shared/rate-limit.ts.
 */

import { createClient as _createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SVC_KEY      = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export function createPublicClient(): SupabaseClient {
  return _createClient(SUPABASE_URL, SVC_KEY);
}

export interface RateLimitResult {
  ok: boolean;
  slots_avail: number;
  total_used: number;
}

export async function checkRateLimit(
  db: SupabaseClient,
  worker: string,
  cost: number,
): Promise<RateLimitResult> {
  try {
    const windowStart = new Date(Date.now() - 60_000).toISOString();

    const { data, error } = await db
      .from('worker_rate_limits')
      .select('slots_used, total_slots, window_start')
      .eq('worker', worker)
      .maybeSingle();

    if (error) return { ok: true, slots_avail: 100, total_used: 0 };

    if (!data) {
      await db.from('worker_rate_limits').insert({
        worker,
        slots_used: cost,
        total_slots: 100,
        window_start: new Date().toISOString(),
      }).onConflict('worker').merge();
      return { ok: true, slots_avail: 100 - cost, total_used: cost };
    }

    const { slots_used, total_slots } = data;
    const needsReset = !data.window_start || data.window_start < windowStart;
    const current_used = needsReset ? 0 : (slots_used ?? 0);
    const avail = (total_slots ?? 100) - current_used;

    if (avail < cost) {
      return { ok: false, slots_avail: Math.max(0, avail), total_used: current_used };
    }

    await db.from('worker_rate_limits').update({
      slots_used: needsReset ? cost : current_used + cost,
      window_start: needsReset ? new Date().toISOString() : data.window_start,
    }).eq('worker', worker);

    return { ok: true, slots_avail: avail - cost, total_used: current_used + cost };
  } catch {
    return { ok: true, slots_avail: 100, total_used: 0 };
  }
}

export function safeBatchSize(slotsAvail: number, costPerItem: number, maxBatch: number): number {
  if (slotsAvail <= 0 || costPerItem <= 0) return 0;
  return Math.max(0, Math.min(Math.floor(slotsAvail / costPerItem), maxBatch));
}
