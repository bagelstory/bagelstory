// =============================================================
// Page de confirmation (composant serveur).
// L'identifiant est un UUID impossible à deviner : on lit la
// commande avec la clé serveur, sans exposer la table au public.
// =============================================================
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/pricing";
import { PAYMENT_METHODS } from "@/lib/payment";
import type { OrderRow } from "@/lib/types";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ConfirmationPage({ params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) notFound();

  const { data } = await createAdminClient()
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .single<OrderRow>();
  if (!data) notFound();

  const order = data;
  const surPlace = order.type === "sur_place";

  return (
    <main className="min-h-dvh bg-cream px-4 py-8">
      <div className="mx-auto grid max-w-md gap-6">
        <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-ink/10">
          <div className="bg-ink px-6 py-6 text-center text-cream">
            <p className="text-xs uppercase tracking-[0.28em] text-brand">Commande envoyée</p>
            <p className="font-display text-6xl leading-none text-brand">#{order.order_number}</p>
            <p className="mt-2">
              {surPlace
                ? `On vous l'apporte à la table ${order.table_number}`
                : "On vous appelle au comptoir avec ce numéro"}
            </p>
          </div>
          <ul className="grid gap-2 border-b-2 border-dashed border-ink/10 px-6 py-4">
            {order.items.map((i, idx) => (
              <li key={idx} className="flex justify-between gap-3">
                <div>
                  {i.quantity}× {i.name}
                  {i.options.map((o) => (
                    <p key={o} className="text-sm text-ink/60">{o}</p>
                  ))}
                </div>
                <span className="tabular-nums">{formatPrice(i.lineTotalCents)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between px-6 py-4 text-lg font-bold">
            <span>Total à régler</span>
            <span className="tabular-nums">{formatPrice(order.total_cents)}</span>
          </div>
        </div>

        <section className="grid gap-3">
          <h2 className="font-display text-xl">Paiement</h2>
          {PAYMENT_METHODS.map((m) => (
            <div key={m.id} className="rounded-2xl border-2 border-ink bg-white p-4">
              <p className="font-bold">{m.label}</p>
              <p className="text-sm text-ink/60">{surPlace ? m.hintSurPlace : m.hintAEmporter}</p>
              {m.qrImage && (
                <Image
                  src={m.qrImage}
                  alt={`QR code ${m.label}`}
                  width={220}
                  height={220}
                  className="mx-auto mt-3 rounded-lg"
                />
              )}
            </div>
          ))}
          <p className="rounded-xl bg-ink/5 px-4 py-3 text-sm text-ink/70">
            Votre commande est déjà en cuisine. Rien n'est débité en ligne : le paiement se fait auprès de l'équipe.
          </p>
        </section>

        <Link
          href={surPlace ? `/?table=${order.table_number}` : "/"}
          className="grid h-14 place-items-center rounded-full bg-brand text-lg font-bold text-ink"
        >
          Nouvelle commande
        </Link>
      </div>
    </main>
  );
}
