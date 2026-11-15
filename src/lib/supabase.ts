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
  if (val.startsWith('sb_publishable_') || val.startsWith('eyJ')) {
    return val;
  }
  return FALLBACK_SUPABASE_PUBLISHABLE_KEY;
}

const supabaseUrl = resolveSupabaseUrl(import.meta.env?.VITE_SUPABASE_URL);
const supabasePublishableKey = resolveSupabaseKey(import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY);

function createSafeSupabaseClient(): SupabaseClient {
  try {
    return createClient(supabaseUrl, supabasePublishableKey);
  } catch {
    return createClient(FALLBACK_SUPABASE_URL, FALLBACK_SUPABASE_PUBLISHABLE_KEY);
  }
}

export const supabase = createSafeSupabaseClient();
