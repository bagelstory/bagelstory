"use client";
// Barre flottante en bas de l'écran : nombre d'articles + total.
import { ShoppingBag } from "lucide-react";
import { getMenuItem } from "@/lib/menu";
import { formatPrice, unitPriceCents } from "@/lib/pricing";
import { useCart } from "@/store/cart";

export function useCartTotals() {
  const lines = useCart((s) => s.lines);
  let count = 0;
  let totalCents = 0;
  for (const line of lines) {
    const item = getMenuItem(line.itemId);
    if (!item) continue; // article retiré du menu entre-temps
    count += line.quantity;
    totalCents += unitPriceCents(item, line.selection) * line.quantity;
  }
  return { count, totalCents };
}

export function CartBar({ onOpen }: { onOpen: () => void }) {
  const { count, totalCents } = useCartTotals();
  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <button
        onClick={onOpen}
        className="mx-auto flex w-full max-w-3xl items-center gap-3 rounded-full bg-ink px-5 py-4 text-cream shadow-xl transition active:scale-[0.99]"
      >
        <span className="relative">
          <ShoppingBag className="size-6" />
          <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-ink">
            {count}
          </span>
        </span>
        <span className="flex-1 text-left font-semibold">Voir le panier</span>
        <span className="font-display text-lg">{formatPrice(totalCents)}</span>
      </button>
    </div>
  );
}
