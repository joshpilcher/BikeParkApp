import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (__DEV__ && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn(
    "[BikePark] Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env (see .env.example)",
  );
}

/** Typed Supabase client — generate types with: npx supabase gen types typescript */
export const supabase = createClient(supabaseUrl || "https://invalid.local", supabaseAnonKey || "invalid");

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
