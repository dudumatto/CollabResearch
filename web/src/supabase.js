import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const PLACEHOLDER_VALUES = new Set([
  "https://your-project-ref.supabase.co",
  "https://seu-projeto.supabase.co",
  "your_supabase_anon_key",
  "sua_chave",
]);

function isConfiguredValue(value) {
  return Boolean(value && !PLACEHOLDER_VALUES.has(String(value).trim()));
}

export const isSupabaseConfigured = isConfiguredValue(supabaseUrl) && isConfiguredValue(supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
