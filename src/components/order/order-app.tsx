"use client";
// =============================================================
// Orchestrateur de la page client :
// 1. choix Sur place / À emporter (sauté si QR de table)
// 2. menu par catégories avec navigation collante
// 3. fiche article (options) + panier
// =============================================================
import { useEffect, useState } from "react";
import { MENU } from "@/lib/menu";
import type { MenuItem } from "@/lib/types";
import { useCart } from "@/store/cart";
import { useMounted } from "@/hooks/use-mounted";
import { ModeSelector } from "./mode-selector";
import { MenuSection } from "./menu-section";
import { ItemSheet } from "./item-sheet";
import { CartBar } from "./cart-bar";
import { CartSheet } from "./cart-sheet";

export function OrderApp({ tableFromQr }: { tableFromQr: number | null }) {
  const mounted = useMounted();
  const { mode, tableNumber, setSurPlace, resetMode } = useCart();
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(MENU[0].id);

  // Un QR de table impose toujours sa table (même si le panier
  // en mémoire avait une autre valeur).
  useEffect(() => {
    if (tableFromQr !== null) setSurPlace(tableFromQr);
  }, [tableFromQr, setSurPlace]);

  // Surligne la catégorie visible dans la barre de navigation.
  useEffect(() => {
    if (!mounted || !mode) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveCategory(visible.target.id);
      },
      { rootMargin: "-130px 0px -65% 0px" },
    );
    MENU.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [mounted, mode]);

  // Évite un décalage serveur/client : le panier vit en sessionStorage.
  if (!mounted) return <div className="min-h-dvh bg-cream" />;

  if (!mode) return <ModeSelector />;

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-dvh bg-cream pb-32">
      {/* En-tête + navigation des catégories (collants) */}
      <header className="sticky top-0 z-30 bg-ink text-cream shadow-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <p className="font-display text-xl leading-none tracking-tight">
              BAGEL <span className="text-brand">STORY</span>
            </p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-cream/60">Aix-en-Provence</p>
          </div>
          <button
            onClick={resetMode}
            className="rounded-full border border-cream/25 px-3 py-1.5 text-sm font-medium transition hover:bg-cream/10"
            aria-label="Changer le mode de commande"
          >
            {mode === "sur_place" ? `Table ${tableNumber}` : "À emporter"}
            <span className="ml-1.5 text-cream/50">· modifier</span>
          </button>
        </div>
        <nav className="no-scrollbar mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 pb-3">
          {MENU.map((c) => (
            <button
              key={c.id}
              onClick={() => scrollTo(c.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                activeCategory === c.id ? "bg-brand text-ink" : "bg-cream/10 text-cream/80 hover:bg-cream/20"
              }`}
            >
              {c.name}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-3xl space-y-10 px-4 pt-6">
        {MENU.map((category) => (
          <MenuSection key={category.id} category={category} onSelect={setSelectedItem} />
        ))}
      </main>

      <CartBar onOpen={() => setCartOpen(true)} />

      {/* key = réinitialise l'état des options à chaque nouvel article */}
      <ItemSheet key={selectedItem?.id ?? "none"} item={selectedItem} onClose={() => setSelectedItem(null)} />
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}
