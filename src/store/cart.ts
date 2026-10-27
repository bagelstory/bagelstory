"use client";
// =============================================================
// Panier (Zustand) — conservé en sessionStorage : un rafraîchissement
// de page ne vide pas le panier, mais il ne survit pas à l'onglet.
// =============================================================
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { cleanSelection, lineKey } from "@/lib/pricing";
import type { CartLine, OrderType, Selection } from "@/lib/types";

const MAX_QTY_PER_LINE = 20;

interface CartState {
  mode: OrderType | null;
  tableNumber: number | null;
  lines: CartLine[];
  setSurPlace: (table: number) => void;
  setAEmporter: () => void;
  resetMode: () => void;
  addLine: (itemId: string, selection: Selection, quantity: number, note?: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      mode: null,
      tableNumber: null,
      lines: [],

      setSurPlace: (table) => set({ mode: "sur_place", tableNumber: table }),
      setAEmporter: () => set({ mode: "a_emporter", tableNumber: null }),
      resetMode: () => set({ mode: null, tableNumber: null }),

      addLine: (itemId, selection, quantity, note) =>
        set((state) => {
          const cleanNote = note?.trim() || undefined;
          const sel = cleanSelection(selection);
          const key = lineKey(itemId, sel, cleanNote);
          const existing = state.lines.find((l) => l.key === key);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.key === key ? { ...l, quantity: Math.min(MAX_QTY_PER_LINE, l.quantity + quantity) } : l,
              ),
            };
          }
          return { lines: [...state.lines, { key, itemId, quantity, selection: sel, note: cleanNote }] };
        }),

      setQuantity: (key, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.key !== key)
              : state.lines.map((l) =>
                  l.key === key ? { ...l, quantity: Math.min(MAX_QTY_PER_LINE, quantity) } : l,
                ),
        })),

      removeLine: (key) => set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
      clearCart: () => set({ lines: [] }),
    }),
    {
      name: "bagel-story-cart",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
