// Client Supabase côté serveur uniquement (clé service_role).
// "server-only" fait échouer le build si ce fichier est importé côté client.
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseKey, supabaseUrl } from "./env";

export function createAdminClient() {
  return createClient(supabaseUrl(), supabaseKey("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
}
