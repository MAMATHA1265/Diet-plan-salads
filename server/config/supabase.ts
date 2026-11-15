import { createClient, SupabaseClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://gecshzcbzetimjbqoudh.supabase.co';
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_WGrlO6CrIG3a6woIQcB1hA__GdHKUG-';

function resolveSupabaseUrl(raw?: string): string {
  const val = (raw || '').trim();
  if (/^https?:\/\/[a-z0-9.-]+/i.test(val)) {
    return val;
  }
  const projectMatch = val.match(/^projectid[:=]\s*([a-z0-9-]+)$/i);
  if (projectMatch?.[1]) {
    return `https://${projectMatch[1]}.supabase.co`;
  }
  return FALLBACK_SUPABASE_URL;
}

function resolveSupabaseKey(raw?: string): string {
  const val = (raw || '').trim().replace(/^Publishable key:\s*/i, '');
  if (val.startsWith('sb_publishable_') || val.startsWith('sb_secret_') || val.startsWith('eyJ')) {
    return val;
  }
  return FALLBACK_SUPABASE_PUBLISHABLE_KEY;
}

export const SUPABASE_URL = resolveSupabaseUrl(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
);

export const SUPABASE_PUBLISHABLE_KEY = resolveSupabaseKey(
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

let supabaseClient: SupabaseClient | null = null;
let supabaseReady = false;

export function getSupabaseClient(): SupabaseClient | null {
  return supabaseClient;
}

export function isSupabaseConnected(): boolean {
  return supabaseReady && supabaseClient !== null;
}

export function setSupabaseConnected(ready: boolean): void {
  supabaseReady = ready;
}

export async function initSupabase(): Promise<boolean> {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await supabaseClient.from('plans').select('id').limit(1);
    if (error) {
      console.warn(
        `[DB] Supabase reachable (${SUPABASE_URL}), waiting for schema initialization (${error.message}). Using local store fallback until schema.sql is run.`
      );
      supabaseReady = false;
      return false;
    }

    supabaseReady = true;
    console.log(`[DB] Connected to Supabase PostgreSQL (${SUPABASE_URL}).`);
    return true;
  } catch (err) {
    console.warn(
      '[DB] Supabase initialization warning; using local store fallback.',
      err instanceof Error ? err.message : ''
    );
    supabaseReady = false;
    return false;
  }
}
