"use client";
// Une catégorie du menu. Un article sans options s'ajoute en un tap ;
// sinon on ouvre la fiche article pour choisir.
import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { formatPrice } from "@/lib/pricing";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { useCart } from "@/store/cart";

export function MenuSection({
  category,
  onSelect,
}: {
  category: MenuCategory;
  onSelect: (item: MenuItem) => void;
}) {
  return (
    <section id={category.id} className="scroll-mt-32">
      <div className="mb-4 flex items-baseline gap-3 border-b-2 border-ink pb-2">
        <h2 className="font-display text-2xl text-ink">{category.name}</h2>
        {category.subtitle && <span className="text-sm font-semibold text-brand-dark">{category.subtitle}</span>}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {category.items.map((item) => (
          <MenuItemCard key={item.id} item={item} onSelect={onSelect} />
        ))}
      </ul>
    </section>
  );
}

function MenuItemCard({ item, onSelect }: { item: MenuItem; onSelect: (item: MenuItem) => void }) {
  const addLine = useCart((s) => s.addLine);
  const [justAdded, setJustAdded] = useState(false);
  const hasOptions = (item.options?.length ?? 0) > 0;

  const handleClick = () => {
    if (hasOptions) return onSelect(item);
    addLine(item.id, {}, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <li>
      <button
        onClick={handleClick}
        className="flex h-full w-full items-start gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-ink/5 transition hover:ring-brand/40 active:scale-[0.99]"
      >
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{item.name}</p>
          {item.description && <p className="mt-1 text-sm leading-snug text-ink/60">{item.description}</p>}
          <p className="mt-2 font-bold text-ink">
            {item.id === "byob" && <span className="font-normal text-ink/60">dès </span>}
            {formatPrice(item.priceCents)}
          </p>
        </div>
        <span
          aria-hidden
          className={`grid size-9 shrink-0 place-items-center rounded-full transition ${
            justAdded ? "bg-green-600 text-white" : "bg-brand text-ink"
          }`}
        >
          {justAdded ? <Check className="size-5" /> : <Plus className="size-5" />}
        </span>
        <span className="sr-only">{hasOptions ? "Choisir les options" : "Ajouter au panier"}</span>
      </button>
    </li>
  );
}
