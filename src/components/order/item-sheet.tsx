"use client";
// Fiche article : choix des options, quantité, note, ajout au panier.
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice, unitPriceCents, validateSelection } from "@/lib/pricing";
import type { MenuItem, OptionGroup, Selection } from "@/lib/types";
import { useCart } from "@/store/cart";

export function ItemSheet({ item, onClose }: { item: MenuItem | null; onClose: () => void }) {
  const addLine = useCart((s) => s.addLine);
  const [selection, setSelection] = useState<Selection>({});
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  if (!item) return null;

  const error = validateSelection(item, selection);
  const total = unitPriceCents(item, selection) * quantity;

  const setChoice = (group: OptionGroup, choiceId: string, qty: number) =>
    setSelection((prev) => {
      const current = group.kind === "single" ? {} : { ...(prev[group.id] ?? {}) };
      current[choiceId] = Math.max(0, qty);
      return { ...prev, [group.id]: current };
    });

  const handleAdd = () => {
    if (error) return;
    addLine(item.id, selection, quantity, note);
    onClose();
  };

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="mx-auto max-h-[92dvh] max-w-2xl overflow-y-auto rounded-t-3xl bg-cream p-0">
        <SheetHeader className="px-5 pb-2 pr-14 pt-6 text-left">
          <SheetTitle className="font-display text-2xl text-ink">{item.name}</SheetTitle>
          <SheetDescription className="text-ink/60">
            {item.description ?? formatPrice(item.priceCents)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-5 pb-4">
          {item.options?.map((group) => (
            <fieldset key={group.id}>
              <legend className="mb-2 flex w-full items-center justify-between">
                <span className="font-semibold text-ink">{group.label}</span>
                {group.kind === "single" && (
                  <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold uppercase text-cream">
                    Obligatoire
                  </span>
                )}
              </legend>
              <div className="grid gap-2">
                {group.choices.map((choice) => {
                  const qty = selection[group.id]?.[choice.id] ?? 0;
                  const price = choice.priceCents ? `+${formatPrice(choice.priceCents)}` : null;

                  if (group.kind === "quantity") {
                    return (
                      <div key={choice.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                        <span className="text-ink">
                          {choice.label} {price && <span className="text-sm text-ink/50">{price}</span>}
                        </span>
                        <Stepper
                          value={qty}
                          min={0}
                          max={group.maxPerChoice}
                          onChange={(v) => setChoice(group, choice.id, v)}
                          label={choice.label}
                        />
                      </div>
                    );
                  }

                  const selected = qty > 0;
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      role={group.kind === "single" ? "radio" : "checkbox"}
                      aria-checked={selected}
                      onClick={() => setChoice(group, choice.id, group.kind === "multi" && selected ? 0 : 1)}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 text-left transition ${
                        selected ? "bg-ink text-cream" : "bg-white text-ink hover:bg-white/70"
                      }`}
                    >
                      <span>{choice.label}</span>
                      {price && <span className="text-sm opacity-70">{price}</span>}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <div>
            <label htmlFor="item-note" className="mb-2 block font-semibold text-ink">
              Une précision ? <span className="font-normal text-ink/50">(facultatif)</span>
            </label>
            <Textarea
              id="item-note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              placeholder={item.id === "byob" ? "Garniture, légumes, sauce…" : "Sans oignon, allergie…"}
              className="resize-none bg-white"
              rows={2}
            />
          </div>
        </div>

        {/* Pied collant : quantité + ajout */}
        <div className="sticky bottom-0 flex items-center gap-3 border-t border-ink/10 bg-cream px-5 py-4">
          <Stepper value={quantity} min={1} max={20} onChange={setQuantity} label="Quantité" />
          <Button
            onClick={handleAdd}
            disabled={!!error}
            className="h-12 flex-1 rounded-full bg-brand text-base font-bold text-ink hover:bg-brand/90 disabled:opacity-50"
          >
            {error ?? `Ajouter · ${formatPrice(total)}`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-white p-1 ring-1 ring-ink/10">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={`Retirer — ${label}`}
        className="grid size-8 place-items-center rounded-full text-ink disabled:opacity-30"
      >
        <Minus className="size-4" />
      </button>
      <span className="w-6 text-center font-bold tabular-nums text-ink">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`Ajouter — ${label}`}
        className="grid size-8 place-items-center rounded-full bg-ink text-cream disabled:opacity-30"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

export { Stepper };
