"use client";
// Client Supabase navigateur (clé publique "anon").
// Utilisé par la page admin : connexion du staff + Realtime.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseKey, supabaseUrl } from "./env";

let client: SupabaseClient | null = null;

export function getBrowserClient() {
  if (!client) {
    client = createClient(supabaseUrl(), supabaseKey("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
      auth: { persistSession: true, autoRefreshToken: true }, // l'iPad reste connecté
    });
  }
  return client;
}
