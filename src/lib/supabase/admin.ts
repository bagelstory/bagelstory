// Client Supabase côté serveur uniquement (clé service_role).
// "server-only" fait échouer le build si ce fichier est importé côté client.
import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Variables Supabase manquantes (.env.local).");
  return createClient(url, key, { auth: { persistSession: false } });
}
