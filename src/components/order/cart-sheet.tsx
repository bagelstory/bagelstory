"use client";
// Panier : récapitulatif, modification des quantités, envoi de la commande.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getMenuItem } from "@/lib/menu";
import { describeSelection, formatPrice, unitPriceCents } from "@/lib/pricing";
import type { CreateOrderPayload } from "@/lib/types";
import { useCart } from "@/store/cart";
import { useCartTotals } from "./cart-bar";
import { Stepper } from "./item-sheet";

export function CartSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const { mode, tableNumber, lines, setQuantity, removeLine, clearCart } = useCart();
  const { totalCents } = useCartTotals();
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!mode || lines.length === 0 || sending) return;
    setSending(true);
    setError(null);

    const payload: CreateOrderPayload = {
      type: mode,
      tableNumber: mode === "sur_place" ? tableNumber : null,
      note: note.trim() || undefined,
      lines: lines.map(({ itemId, quantity, selection, note }) => ({ itemId, quantity, selection, note })),
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "La commande n'a pas pu être envoyée.");

      clearCart();
      setNote("");
      onOpenChange(false);
      router.push(`/confirmation/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau. Réessayez.");
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto flex max-h-[92dvh] max-w-2xl flex-col rounded-t-3xl bg-cream p-0">
        <SheetHeader className="px-5 pr-14 pt-6 text-left">
          <SheetTitle className="font-display text-2xl text-ink">Votre commande</SheetTitle>
          <SheetDescription className="font-semibold text-brand-dark">
            {mode === "sur_place" ? `Sur place · Table ${tableNumber}` : "À emporter · à récupérer au comptoir"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {lines.length === 0 && <p className="py-8 text-center text-ink/50">Votre panier est vide.</p>}

          {lines.map((line) => {
            const item = getMenuItem(line.itemId);
            if (!item) return null;
            const unit = unitPriceCents(item, line.selection);
            return (
              <div key={line.key} className="rounded-2xl bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{item.name}</p>
                    {describeSelection(item, line.selection).map((d) => (
                      <p key={d} className="text-sm text-ink/60">{d}</p>
                    ))}
                    {line.note && <p className="text-sm italic text-ink/60">« {line.note} »</p>}
                  </div>
                  <p className="shrink-0 font-bold text-ink">{formatPrice(unit * line.quantity)}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Stepper
                    value={line.quantity}
                    min={1}
                    max={20}
                    onChange={(q) => setQuantity(line.key, q)}
                    label={item.name}
                  />
                  <button
                    onClick={() => removeLine(line.key)}
                    className="flex items-center gap-1 text-sm text-ink/50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" /> Retirer
                  </button>
                </div>
              </div>
            );
          })}

          {lines.length > 0 && (
            <>
              <div>
                <label htmlFor="order-note" className="mb-2 block font-semibold text-ink">
                  Message pour l'équipe <span className="font-normal text-ink/50">(facultatif)</span>
                </label>
                <Textarea
                  id="order-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 500))}
                  rows={2}
                  className="resize-none bg-white"
                  placeholder="Allergies, demande particulière…"
                />
              </div>
              <p className="rounded-xl bg-ink/5 px-4 py-3 text-sm text-ink/70">
                💳 Le paiement se fait après la commande : par CB (SumUp) ou avec Carlo (Quick Pay).
              </p>
            </>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-ink/10 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
            {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mb-3 flex items-baseline justify-between">
              <span className="font-semibold text-ink">Total</span>
              <span className="font-display text-2xl text-ink">{formatPrice(totalCents)}</span>
            </div>
            <Button
              onClick={submit}
              disabled={sending}
              className="h-14 w-full rounded-full bg-brand text-lg font-bold text-ink hover:bg-brand/90"
            >
              {sending ? <Loader2 className="size-5 animate-spin" /> : "Valider la commande"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
