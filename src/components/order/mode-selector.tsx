"use client";
// Écran de choix : Sur place (+ table) ou À emporter.
import { useState } from "react";
import { TABLE_COUNT } from "@/lib/types";
import { useCart } from "@/store/cart";

export function ModeSelector() {
  const { setSurPlace, setAEmporter } = useCart();
  const [pickingTable, setPickingTable] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col bg-ink text-cream">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-10">
        <p className="text-xs uppercase tracking-[0.3em] text-brand">Aix-en-Provence</p>
        <h1 className="mt-2 font-display text-5xl leading-[0.95]">
          BAGEL
          <br />
          STORY
        </h1>
        <p className="mt-4 text-cream/70">Commandez directement depuis votre téléphone.</p>

        {!pickingTable ? (
          <div className="mt-auto grid gap-4 pt-10">
            <button
              onClick={() => setPickingTable(true)}
              className="rounded-2xl bg-brand px-6 py-6 text-left text-ink transition active:scale-[0.98]"
            >
              <span className="block font-display text-2xl">Sur place</span>
              <span className="text-sm font-medium text-ink/70">On vous sert à table</span>
            </button>
            <button
              onClick={setAEmporter}
              className="rounded-2xl border-2 border-cream/20 px-6 py-6 text-left transition active:scale-[0.98]"
            >
              <span className="block font-display text-2xl">À emporter</span>
              <span className="text-sm text-cream/60">À récupérer au comptoir</span>
            </button>
          </div>
        ) : (
          <div className="mt-10">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-2xl">Votre table</h2>
              <button onClick={() => setPickingTable(false)} className="text-sm text-cream/60 underline">
                Retour
              </button>
            </div>
            <p className="mt-1 text-sm text-cream/60">Le numéro est indiqué sur votre table.</p>
            <div className="mt-6 grid grid-cols-5 gap-2.5">
              {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setSurPlace(n)}
                  className="aspect-square rounded-xl bg-cream/10 font-display text-xl transition hover:bg-brand hover:text-ink active:scale-95"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
