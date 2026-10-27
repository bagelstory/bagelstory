// =============================================================
// Page d'accueil client.
// Le QR code de chaque table pointe vers : https://<domaine>/?table=12
// Composant serveur : lit et valide le paramètre, puis délègue
// toute l'interactivité à <OrderApp />.
// =============================================================
import { OrderApp } from "@/components/order/order-app";
import { TABLE_COUNT } from "@/lib/types";

function parseTable(value: string | string[] | undefined): number | null {
  if (typeof value !== "string" || !/^\d{1,2}$/.test(value)) return null;
  const n = Number(value);
  return n >= 1 && n <= TABLE_COUNT ? n : null;
}

export default function HomePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return <OrderApp tableFromQr={parseTable(searchParams.table)} />;
}
