// =============================================================
// Calcul des prix et validation des options.
// Partagé par le client (affichage) et l'API (vérité serveur).
// =============================================================
import type { MenuItem, Selection } from "./types";

const euroFormatter = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
export const formatPrice = (cents: number) => euroFormatter.format(cents / 100);

/** Retire les quantités nulles et trie les clés → sélection canonique. */
export function cleanSelection(sel: Selection): Selection {
  const out: Selection = {};
  for (const gid of Object.keys(sel).sort()) {
    const picked: Record<string, number> = {};
    for (const cid of Object.keys(sel[gid]).sort()) {
      if (sel[gid][cid] > 0) picked[cid] = sel[gid][cid];
    }
    if (Object.keys(picked).length > 0) out[gid] = picked;
  }
  return out;
}

/** Retourne un message d'erreur lisible, ou null si la sélection est valide. */
export function validateSelection(item: MenuItem, sel: Selection): string | null {
  const groups = item.options ?? [];
  const known = new Set(groups.map((g) => g.id));
  if (Object.keys(sel).some((gid) => !known.has(gid))) return "Option inconnue.";

  for (const g of groups) {
    const picked = sel[g.id] ?? {};
    const choiceIds = new Set(g.choices.map((c) => c.id));
    let selectedCount = 0;

    for (const [cid, qty] of Object.entries(picked)) {
      if (!choiceIds.has(cid)) return `Choix invalide pour « ${g.label} ».`;
      if (!Number.isInteger(qty) || qty < 0) return "Quantité invalide.";
      const maxQty = g.kind === "quantity" ? g.maxPerChoice : 1;
      if (qty > maxQty) return `Trop de quantités pour « ${g.label} ».`;
      if (qty > 0) selectedCount++;
    }

    if (g.kind === "single" && selectedCount !== 1) return `Choisissez : ${g.label}.`;
    if (g.kind === "multi" && g.max !== undefined && selectedCount > g.max)
      return `Maximum ${g.max} choix pour « ${g.label} ».`;
  }
  return null;
}

/** Prix unitaire = prix de base + suppléments. */
export function unitPriceCents(item: MenuItem, sel: Selection): number {
  let total = item.priceCents;
  for (const g of item.options ?? []) {
    for (const c of g.choices) total += (c.priceCents ?? 0) * (sel[g.id]?.[c.id] ?? 0);
  }
  return total;
}

/** Libellés lisibles des options choisies (panier, cuisine). */
export function describeSelection(item: MenuItem, sel: Selection): string[] {
  const lines: string[] = [];
  for (const g of item.options ?? []) {
    const labels = g.choices
      .filter((c) => (sel[g.id]?.[c.id] ?? 0) > 0)
      .map((c) => {
        const qty = sel[g.id][c.id];
        return qty > 1 ? `${qty}× ${c.label}` : c.label;
      });
    if (labels.length === 0) continue;
    lines.push(g.kind === "quantity" ? `+ ${labels.join(", ")}` : `${g.label} : ${labels.join(", ")}`);
  }
  return lines;
}

/** Clé de ligne : deux ajouts identiques fusionnent dans le panier. */
export const lineKey = (itemId: string, sel: Selection, note?: string) =>
  `${itemId}|${JSON.stringify(cleanSelection(sel))}|${(note ?? "").trim()}`;
