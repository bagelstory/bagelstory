// =============================================================
// Configuration des moyens de paiement affichés au client.
// Pour activer un QR code : déposez l'image dans /public
// (ex. public/paiement/sumup.png) et indiquez son chemin ici.
// Laissez qrImage à null pour masquer le QR.
// =============================================================
export interface PaymentMethod {
  id: "sumup" | "carlo";
  label: string;
  hintSurPlace: string;
  hintAEmporter: string;
  qrImage: string | null;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "sumup",
    label: "Payer par CB (SumUp)",
    hintSurPlace: "Scannez le QR SumUp et saisissez le montant, ou demandez le terminal à l'équipe.",
    hintAEmporter: "Au comptoir, au moment de récupérer votre commande.",
    qrImage: null, // ex. "/paiement/sumup.png"
  },
  {
    id: "carlo",
    label: "Payer avec Carlo (Quick Pay)",
    hintSurPlace: "Ouvrez l'app Carlo et scannez notre QR code.",
    hintAEmporter: "Ouvrez l'app Carlo et scannez le QR code au comptoir.",
    qrImage: null, // ex. "/paiement/carlo.png"
  },
];
