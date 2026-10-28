// Lecture et vérification des variables Supabase.
// Tolère les espaces / retours à la ligne ajoutés par un copier-coller
// et donne un message clair si une valeur est mal remplie.

export function supabaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/^["']|["']$/g, "");
  if (!raw) throw new Error("NEXT_PUBLIC_SUPABASE_URL est vide dans Vercel.");
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withProtocol);
    return url.origin; // retire un éventuel /rest/v1 ou / final
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL est invalide dans Vercel. Elle doit ressembler à https://abcdefgh.supabase.co",
    );
  }
}

export function supabaseKey(name: "NEXT_PUBLIC_SUPABASE_ANON_KEY" | "SUPABASE_SERVICE_ROLE_KEY"): string {
  const value = (
    name === "NEXT_PUBLIC_SUPABASE_ANON_KEY"
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : process.env.SUPABASE_SERVICE_ROLE_KEY
  )
    ?.trim()
    .replace(/^["']|["']$/g, "");
  if (!value) throw new Error(`${name} est vide dans Vercel.`);
  return value;
}
