// =============================================================
// Menu Bagel Story — source unique de vérité (prix en centimes).
// Utilisé par le client pour l'affichage ET par l'API pour
// recalculer les prix : le navigateur n'envoie jamais de prix.
// =============================================================
import type { MenuCategory, MenuItem, OptionChoice, OptionGroup } from "./types";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const toChoices = (labels: string[]): OptionChoice[] =>
  labels.map((label) => ({ id: slugify(label), label }));

// --- Listes de base -------------------------------------------------
const GOURMET_NORMAL = [
  "The San Francisco",
  "The Boston",
  "The Veggie",
  "The Irish Breakfast",
  "The Italian",
  "The Miami",
  "Bagel Brooklyn",
  "The Bollywood",
  "The Chicago",
];
const GOURMET_PREMIUM = ["The New Orleans", "The New Yorker", "The Ontario"];
const DESSERTS = ["Banana bread", "Carrot cake", "Cookie", "Brownie", "Bagel Nutella"];

// --- Groupes d'options réutilisés dans les Lunch Boxes ----------------
// ⚠️ À valider avec l'équipe : quelles boissons sont incluses dans les formules.
const drinkGroup: OptionGroup = {
  id: "boisson",
  label: "Boisson",
  kind: "single",
  choices: toChoices(["Boisson fraîche 33cl", "Eau 50cl", "Café expresso", "Café crème", "Thé"]),
};
const bagelNormalGroup: OptionGroup = {
  id: "bagel",
  label: "Bagel gourmet",
  kind: "single",
  choices: toChoices(GOURMET_NORMAL),
};
const bagelPremiumGroup: OptionGroup = {
  id: "bagel",
  label: "Bagel gourmet premium",
  kind: "single",
  choices: toChoices(GOURMET_PREMIUM),
};
const bagelAnyGroup: OptionGroup = {
  id: "bagel",
  label: "Bagel gourmet",
  kind: "single",
  choices: toChoices([...GOURMET_NORMAL, ...GOURMET_PREMIUM]),
};
const saladOrDessertGroup: OptionGroup = {
  id: "extra",
  label: "Petite salade ou dessert",
  kind: "single",
  choices: toChoices(["Petite salade", ...DESSERTS]),
};
const dessertGroup: OptionGroup = {
  id: "dessert",
  label: "Dessert",
  kind: "single",
  choices: toChoices(DESSERTS),
};

// --- Catégories -------------------------------------------------------
export const MENU: MenuCategory[] = [
  {
    id: "lunch-boxes",
    name: "Lunch Boxes",
    subtitle: "Nos formules",
    items: [
      {
        id: "lb-small-normal",
        name: "Small Lunch Box (Normal)",
        description: "Bagel gourmet normal + boisson",
        priceCents: 1090,
        options: [bagelNormalGroup, drinkGroup],
      },
      {
        id: "lb-small-premium",
        name: "Small Lunch Box (Premium)",
        description: "Bagel gourmet premium + boisson",
        priceCents: 1150,
        options: [bagelPremiumGroup, drinkGroup],
      },
      {
        id: "lb-regular-normal",
        name: "Regular Lunch Box (Normal)",
        description: "Bagel gourmet normal + boisson + petite salade ou dessert",
        priceCents: 1390,
        options: [bagelNormalGroup, drinkGroup, saladOrDessertGroup],
      },
      {
        id: "lb-regular-premium",
        name: "Regular Lunch Box (Premium)",
        description: "Bagel gourmet premium + boisson + petite salade ou dessert",
        priceCents: 1450,
        options: [bagelPremiumGroup, drinkGroup, saladOrDessertGroup],
      },
      {
        id: "lb-deluxe",
        name: "Deluxe Lunch Box",
        description: "Bagel + boisson + petite salade + dessert",
        priceCents: 1750,
        options: [bagelAnyGroup, drinkGroup, dessertGroup],
      },
      {
        id: "lb-healthy-petit",
        name: "Healthy Option Petit",
        description: "Grande salade + boisson",
        priceCents: 1250,
        options: [drinkGroup],
      },
      {
        id: "lb-healthy-grande",
        name: "Healthy Option Grande",
        description: "Grande salade + boisson + dessert ou salade de fruits",
        priceCents: 1590,
        options: [
          drinkGroup,
          {
            id: "dessert",
            label: "Dessert ou salade de fruits",
            kind: "single",
            choices: toChoices([...DESSERTS, "Salade de fruits"]),
          },
        ],
      },
      {
        id: "lb-kiddies",
        name: "Kiddies Lunch Box",
        description: "Bagel cream cheese + poulet ou bacon + compote + boisson",
        priceCents: 1100,
        options: [
          { id: "garniture", label: "Garniture", kind: "single", choices: toChoices(["Poulet", "Bacon"]) },
          drinkGroup,
        ],
      },
    ],
  },
  {
    id: "gourmet-normal",
    name: "Gourmet",
    subtitle: "8,50 €",
    items: GOURMET_NORMAL.map((name) => ({ id: `g-${slugify(name)}`, name, priceCents: 850 })),
  },
  {
    id: "gourmet-premium",
    name: "Gourmet Premium",
    subtitle: "8,90 €",
    items: GOURMET_PREMIUM.map((name) => ({ id: `gp-${slugify(name)}`, name, priceCents: 890 })),
  },
  {
    id: "build-your-own",
    name: "Build Your Own Bagel",
    subtitle: "Compose le tien",
    items: [
      {
        id: "byob",
        name: "Build Your Own Bagel",
        description:
          "Pain + 1 garniture principale. Ajoute tes suppléments, légumes offerts (précise-les dans la note).",
        priceCents: 700,
        options: [
          {
            id: "supplements",
            label: "Suppléments",
            kind: "quantity",
            maxPerChoice: 3,
            choices: [
              { id: "proteine-premium", label: "Protéine premium", priceCents: 200 },
              { id: "proteine-standard", label: "Protéine standard", priceCents: 100 },
              { id: "fromage", label: "Fromage", priceCents: 80 },
              { id: "accompagnement", label: "Accompagnement", priceCents: 80 },
              { id: "sauce", label: "Sauce", priceCents: 80 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "classic",
    name: "Classic Bagels",
    items: [
      { id: "c-beurre", name: "Beurre", priceCents: 350 },
      { id: "c-cream-cheese", name: "Cream Cheese", priceCents: 600 },
      { id: "c-cc-bacon", name: "Cream Cheese + Bacon", priceCents: 650 },
      { id: "c-cc-saumon", name: "Cream Cheese + Saumon", priceCents: 750 },
      { id: "c-cc-salade-tomate", name: "Cream Cheese + Salade, Tomate", priceCents: 600 },
    ],
  },
  {
    id: "drinks",
    name: "Drinks",
    items: [
      { id: "d-soft", name: "Boisson fraîche 33cl", priceCents: 300 },
      { id: "d-biere", name: "Bière bouteille", priceCents: 420 },
      { id: "d-eau", name: "Eau bouteille 50cl", priceCents: 350 },
      { id: "d-expresso", name: "Café expresso", priceCents: 200 },
      { id: "d-creme", name: "Café crème", priceCents: 250 },
      { id: "d-cappuccino", name: "Cappuccino / Latte", priceCents: 320 },
      { id: "d-the", name: "Thé", priceCents: 270 },
      { id: "d-ice-coffee", name: "Ice coffee", priceCents: 400 },
    ],
  },
  {
    id: "desserts",
    name: "Desserts",
    items: [
      { id: "s-banana-bread", name: "Banana bread", priceCents: 420 },
      { id: "s-carrot-cake", name: "Carrot cake", priceCents: 420 },
      { id: "s-cookie", name: "Cookie", priceCents: 300 },
      { id: "s-brownie", name: "Brownie", priceCents: 400 },
      { id: "s-bagel-nutella", name: "Bagel Nutella", priceCents: 400 },
    ],
  },
];

/** Index id → article, pour des recherches O(1). */
const ITEMS_BY_ID = new Map<string, MenuItem>(
  MENU.flatMap((c) => c.items).map((item) => [item.id, item]),
);

export const getMenuItem = (id: string) => ITEMS_BY_ID.get(id);
