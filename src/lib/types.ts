// =============================================================
// Types partagés client / serveur
// Tous les montants sont en CENTIMES (entiers) pour éviter les
// erreurs d'arrondi (ex. 0,1 + 0,2).
// =============================================================

export type OrderType = "sur_place" | "a_emporter";
export type OrderStatus = "nouvelle" | "en_preparation" | "prete" | "annulee";

export const TABLE_COUNT = 26;

/** Un choix possible dans un groupe d'options. */
export interface OptionChoice {
  id: string;
  label: string;
  /** Supplément en centimes (0 / absent = inclus). */
  priceCents?: number;
}

/**
 * Groupe d'options d'un article.
 * - single   : exactement 1 choix obligatoire (ex. choix du bagel)
 * - multi    : 0..max choix, chacun au plus 1 fois
 * - quantity : chaque choix peut être pris plusieurs fois (suppléments)
 */
export type OptionGroup =
  | { id: string; label: string; kind: "single"; choices: OptionChoice[] }
  | { id: string; label: string; kind: "multi"; max?: number; choices: OptionChoice[] }
  | { id: string; label: string; kind: "quantity"; maxPerChoice: number; choices: OptionChoice[] };

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  priceCents: number;
  options?: OptionGroup[];
}

export interface MenuCategory {
  id: string;
  name: string;
  subtitle?: string;
  items: MenuItem[];
}

/** Sélection : { groupId: { choiceId: quantité } } */
export type Selection = Record<string, Record<string, number>>;

/** Ligne de panier (côté client). Les prix sont recalculés depuis le menu. */
export interface CartLine {
  key: string;
  itemId: string;
  quantity: number;
  selection: Selection;
  note?: string;
}

/** Article tel qu'enregistré dans orders.items (snapshot figé). */
export interface OrderItemSnapshot {
  itemId: string;
  name: string;
  quantity: number;
  options: string[];
  note?: string;
  unitPriceCents: number;
  lineTotalCents: number;
}

/** Ligne de la table Supabase `orders`. */
export interface OrderRow {
  id: string;
  order_number: number;
  type: OrderType;
  table_number: number | null;
  items: OrderItemSnapshot[];
  total_cents: number;
  status: OrderStatus;
  customer_note: string | null;
  created_at: string;
  updated_at: string;
}

/** Corps envoyé par le client à POST /api/orders. */
export interface CreateOrderPayload {
  type: OrderType;
  tableNumber: number | null;
  note?: string;
  lines: Pick<CartLine, "itemId" | "quantity" | "selection" | "note">[];
}
