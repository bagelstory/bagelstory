// =============================================================
// POST /api/orders — création d'une commande.
// Les prix envoyés par le navigateur sont IGNORÉS : tout est
// recalculé ici depuis lib/menu.ts, puis inséré avec la clé
// service_role (jamais exposée au client).
// =============================================================
import { NextResponse } from "next/server";
import { z } from "zod";
import { getMenuItem } from "@/lib/menu";
import { cleanSelection, describeSelection, unitPriceCents, validateSelection } from "@/lib/pricing";
import { TABLE_COUNT, type OrderItemSnapshot } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";

const payloadSchema = z
  .object({
    type: z.enum(["sur_place", "a_emporter"]),
    tableNumber: z.number().int().min(1).max(TABLE_COUNT).nullable(),
    note: z.string().trim().max(500).optional(),
    lines: z
      .array(
        z.object({
          itemId: z.string().max(64),
          quantity: z.number().int().min(1).max(20),
          selection: z.record(z.record(z.number().int().min(0).max(10))),
          note: z.string().trim().max(200).optional(),
        }),
      )
      .min(1)
      .max(50),
  })
  .refine((p) => (p.type === "sur_place" ? p.tableNumber !== null : p.tableNumber === null), {
    message: "Numéro de table incohérent.",
  });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Commande invalide." }, { status: 400 });
  }
  const payload = parsed.data;

  // Reconstruction des articles à partir du menu officiel
  const items: OrderItemSnapshot[] = [];
  for (const line of payload.lines) {
    const item = getMenuItem(line.itemId);
    if (!item) {
      return NextResponse.json({ error: "Un article n'est plus disponible. Rechargez la page." }, { status: 400 });
    }
    const selection = cleanSelection(line.selection);
    const selectionError = validateSelection(item, selection);
    if (selectionError) {
      return NextResponse.json({ error: `${item.name} : ${selectionError}` }, { status: 400 });
    }
    const unit = unitPriceCents(item, selection);
    items.push({
      itemId: item.id,
      name: item.name,
      quantity: line.quantity,
      options: describeSelection(item, selection),
      note: line.note || undefined,
      unitPriceCents: unit,
      lineTotalCents: unit * line.quantity,
    });
  }
  const totalCents = items.reduce((sum, i) => sum + i.lineTotalCents, 0);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .insert({
      type: payload.type,
      table_number: payload.tableNumber,
      items,
      total_cents: totalCents,
      customer_note: payload.note || null,
    })
    .select("id, order_number")
    .single();

  if (error || !data) {
    console.error("[orders] insert failed", error);
    return NextResponse.json({ error: "Impossible d'enregistrer la commande. Réessayez." }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, orderNumber: data.order_number }, { status: 201 });
}
