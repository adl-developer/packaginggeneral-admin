/**
 * Mock fixtures — transcribed verbatim from the Figma "New Admin Designs"
 * frames so the built screens render the same numbers as the designs.
 *
 * Replace this module (not the screens) when wiring the Medusa Admin API.
 */
import type {
  Customer,
  Order,
  PlatformSettings,
  Product,
  PromoBanner,
  PromoCode,
  TeamMember,
} from "./types";

export const TEAM: TeamMember[] = [
  {
    id: "usr_emmanuel",
    name: "Emmanuel Osei Ntim",
    email: "emmanuel@packaginggeneral.com",
    role: "super-admin",
    status: "active",
    joinedAt: "2025-06-01",
  },
  {
    id: "usr_admin",
    name: "Admin User",
    email: "admin@pg.com",
    role: "admin",
    status: "active",
    joinedAt: "2026-01-01",
  },
  {
    id: "usr_kwame",
    name: "Kwame Mensah",
    email: "kwame@example.com",
    role: "order-manager",
    status: "active",
    joinedAt: "2026-01-15",
  },
  {
    id: "usr_ama",
    name: "Ama Boateng",
    email: "ama@example.com",
    role: "order-manager",
    status: "active",
    joinedAt: "2026-02-03",
  },
];

/** The signed-in user for this mock session (drives "(you)" and tab visibility). */
export const CURRENT_USER_ID = "usr_emmanuel";

export const CUSTOMERS: Customer[] = [
  {
    id: "cus_emmanuel",
    name: "Emmanuel",
    email: "emmanuel@example.com",
    phone: "+233 24 123 4567",
    company: "Sample Co.",
    orders: 19,
  },
  {
    id: "cus_abena",
    name: "Abena Asante",
    email: "abena.asante@gmail.com",
    phone: "+233 20 456 7890",
    company: "Asante Ventures",
    orders: 4,
  },
  {
    id: "cus_kofi",
    name: "Kofi Boateng",
    email: "kofi.boateng@boatengtrading.com",
    phone: "+233 27 321 6540",
    company: "Boateng Trading Co.",
    orders: 4,
  },
  {
    id: "cus_yaw",
    name: "Yaw Darko",
    email: "yaw.darko@darkoenterprises.com",
    phone: "+233 24 789 0123",
    company: "Darko Enterprises",
    orders: 3,
  },
  {
    id: "cus_adjoa",
    name: "Adjoa Amponsah",
    email: "adjoa@amponsah.com",
    phone: "+233 55 234 5678",
    company: "Amponsah Foods Ltd",
    orders: 3,
  },
  {
    id: "cus_fiifi",
    name: "Fiifi Mensah",
    email: "fiifi.mensah@gmail.com",
    phone: "+233 26 876 5432",
    company: null,
    orders: 3,
  },
  {
    id: "cus_esi",
    name: "Esi Owusu",
    email: "esi.owusu@owusugroup.com",
    phone: "+233 50 112 3344",
    company: "Owusu Group",
    orders: 3,
  },
];

/** Total order count across all time — the "14 of 39 orders" hint. */
export const TOTAL_ORDERS_ALL_TIME = 39;

type Seed = Omit<Order, "id" | "notes" | "activity" | "assignedAt"> &
  Partial<Pick<Order, "assignedAt">>;

const seed: Seed[] = [
  {
    number: "PG-2026-030",
    product: "Stretch Wrap Film",
    variant: "500mm × 300m Roll",
    quantity: 200,
    total: 10642.57,
    status: "new",
    assignedTo: null,
    placedAt: "2026-07-16",
    customization: {
      size: "500mm × 300m Roll",
      material: "LLDPE Film",
      printing: "No Print",
    },
    delivery: "Madina, Accra",
    customerId: "cus_emmanuel",
  },
  {
    number: "PG-2026-025",
    product: "Kraft Paper Bags (Printed)",
    variant: "Small (20×10×30cm)",
    quantity: 300,
    total: 1107.08,
    status: "new",
    assignedTo: null,
    placedAt: "2026-07-15",
    customization: {
      size: "Small (20×10×30cm)",
      material: "Kraft Paper 120gsm",
      printing: "2-Colour Print",
    },
    delivery: "Osu, Accra",
    customerId: "cus_abena",
  },
  {
    number: "PG-2026-027",
    product: "Food-Grade Packaging Box",
    variant: "Medium (30×20×15cm)",
    quantity: 500,
    total: 1868.25,
    status: "cancelled",
    assignedTo: null,
    placedAt: "2026-07-13",
    customization: {
      size: "Medium (30×20×15cm)",
      material: "Food-Grade Board",
      printing: "No Print",
    },
    delivery: "Tema, Greater Accra",
    customerId: "cus_kofi",
  },
  {
    number: "PG-2026-022",
    product: "Food-Grade Packaging Box",
    variant: "Large (40×30×25cm)",
    quantity: 3000,
    total: 8884.47,
    status: "new",
    assignedTo: null,
    placedAt: "2026-07-12",
    customization: {
      size: "Large (40×30×25cm)",
      material: "Food-Grade Board",
      printing: "1-Colour Print",
    },
    delivery: "Spintex, Accra",
    customerId: "cus_adjoa",
  },
  {
    number: "PG-2026-028",
    product: "Standard Shipping Carton",
    variant: "Medium (40×30×20cm)",
    quantity: 2500,
    total: 12119.4,
    status: "in-progress",
    assignedTo: "usr_kwame",
    assignedAt: "2026-07-11",
    placedAt: "2026-07-11",
    customization: {
      size: "Medium (40×30×20cm)",
      material: "Double-Wall Corrugated",
      printing: "No Print",
    },
    delivery: "Achimota, Accra",
    customerId: "cus_yaw",
  },
  {
    number: "PG-2026-021",
    product: "Standard Shipping Carton",
    variant: "Medium (40×30×20cm)",
    quantity: 500,
    total: 2822.94,
    status: "cancelled",
    assignedTo: null,
    placedAt: "2026-07-10",
    customization: {
      size: "Medium (40×30×20cm)",
      material: "Single-Wall Corrugated",
      printing: "No Print",
    },
    delivery: "Kaneshie, Accra",
    customerId: "cus_fiifi",
  },
  {
    number: "PG-2026-023",
    product: "Stretch Wrap Film",
    variant: "500mm × 300m Roll",
    quantity: 50,
    total: 2846.44,
    status: "in-progress",
    assignedTo: "usr_ama",
    assignedAt: "2026-07-09",
    placedAt: "2026-07-08",
    customization: {
      size: "500mm × 300m Roll",
      material: "LLDPE Film",
      printing: "No Print",
    },
    delivery: "East Legon, Accra",
    customerId: "cus_esi",
  },
  {
    number: "PG-2026-015",
    product: "Kraft Paper Bags (Printed)",
    variant: "Medium (26×10×32cm)",
    quantity: 1500,
    total: 4315.19,
    status: "in-progress",
    assignedTo: "usr_kwame",
    assignedAt: "2026-07-06",
    placedAt: "2026-07-05",
    customization: {
      size: "Medium (26×10×32cm)",
      material: "Kraft Paper 150gsm",
      printing: "Full-Colour Print",
    },
    delivery: "Dansoman, Accra",
    customerId: "cus_abena",
  },
  {
    number: "PG-2026-012",
    product: "Food-Grade Packaging Box",
    variant: "Medium (30×20×15cm)",
    quantity: 2000,
    total: 5696.4,
    status: "new",
    assignedTo: null,
    placedAt: "2026-07-03",
    customization: {
      size: "Medium (30×20×15cm)",
      material: "Food-Grade Board",
      printing: "1-Colour Print",
    },
    delivery: "Adenta, Accra",
    customerId: "cus_adjoa",
  },
  {
    number: "PG-2026-026",
    product: "Woven Polypropylene Sacks",
    variant: "50kg Sack",
    quantity: 1000,
    total: 2338.25,
    status: "ready",
    assignedTo: "usr_ama",
    assignedAt: "2026-07-03",
    placedAt: "2026-07-02",
    customization: {
      size: "50kg Sack",
      material: "Woven PP",
      printing: "1-Colour Print",
    },
    delivery: "Ashaiman, Greater Accra",
    customerId: "cus_kofi",
  },
  {
    number: "PG-2026-011",
    product: "Kraft Paper Bags (Printed)",
    variant: "Small (20×10×30cm)",
    quantity: 500,
    total: 1885.29,
    status: "new",
    assignedTo: null,
    placedAt: "2026-07-01",
    customization: {
      size: "Small (20×10×30cm)",
      material: "Kraft Paper 120gsm",
      printing: "2-Colour Print",
    },
    delivery: "Labone, Accra",
    customerId: "cus_emmanuel",
  },
  {
    number: "PG-2026-017",
    product: "Standard Shipping Carton",
    variant: "Small (30×20×20cm)",
    quantity: 800,
    total: 3205.4,
    status: "ready",
    assignedTo: "usr_kwame",
    assignedAt: "2026-07-01",
    placedAt: "2026-06-30",
    customization: {
      size: "Small (30×20×20cm)",
      material: "Single-Wall Corrugated",
      printing: "No Print",
    },
    delivery: "Weija, Accra",
    customerId: "cus_yaw",
  },
  {
    number: "PG-2026-013",
    product: "Standard Shipping Carton",
    variant: "Large (60×40×40cm)",
    quantity: 3000,
    total: 17698.44,
    status: "in-progress",
    assignedTo: "usr_ama",
    assignedAt: "2026-06-29",
    placedAt: "2026-06-28",
    customization: {
      size: "Large (60×40×40cm)",
      material: "Double-Wall Corrugated",
      printing: "1-Colour Print",
    },
    delivery: "Haatso, Accra",
    customerId: "cus_esi",
  },
  {
    number: "PG-2026-014",
    product: "Woven Polypropylene Sacks",
    variant: "50kg Sack",
    quantity: 5000,
    total: 8439.3,
    status: "in-progress",
    assignedTo: "usr_kwame",
    assignedAt: "2026-06-26",
    placedAt: "2026-06-25",
    customization: {
      size: "50kg Sack",
      material: "Woven PP",
      printing: "2-Colour Print",
    },
    delivery: "Kasoa, Central Region",
    customerId: "cus_fiifi",
  },
];

const memberName = (id: string | null) =>
  TEAM.find((m) => m.id === id)?.name ?? "system";

export const ORDERS: Order[] = seed.map((o, i) => ({
  ...o,
  id: `ord_${String(i + 1).padStart(3, "0")}`,
  assignedAt: o.assignedAt ?? null,
  notes: [],
  activity: [
    {
      id: `act_${i}_1`,
      actor: "Emmanuel",
      action: `created order ${o.number}`,
      at: o.placedAt,
    },
    ...(o.assignedTo
      ? [
          {
            id: `act_${i}_2`,
            actor: memberName(o.assignedTo),
            action: "claimed the order",
            at: o.assignedAt ?? o.placedAt,
          },
        ]
      : []),
    ...(o.status === "ready"
      ? [
          {
            id: `act_${i}_3`,
            actor: memberName(o.assignedTo),
            action: "moved the order to Ready for Delivery",
            at: o.assignedAt ?? o.placedAt,
          },
        ]
      : []),
    ...(o.status === "cancelled"
      ? [
          {
            id: `act_${i}_4`,
            actor: "Admin User",
            action: "cancelled the order",
            at: o.placedAt,
          },
        ]
      : []),
  ],
}));

export const PRODUCTS: Product[] = [
  {
    id: "prd_rsc",
    name: "Standard Shipping Carton",
    basePrice: 3.5,
    categorySlug: "rsc-cartons",
  },
  {
    id: "prd_mailer",
    name: "Premium Mailer Box",
    basePrice: 4.2,
    categorySlug: "die-cut-boxes",
  },
  {
    id: "prd_fmcg",
    name: "FMCG Folding Carton",
    basePrice: 2.8,
    categorySlug: "food-packaging",
  },
  {
    id: "prd_agro",
    name: "Export/Agro Box",
    basePrice: 5.5,
    categorySlug: "packaging-accessories",
  },
  {
    id: "prd_tape_brown",
    name: "Packaging Tape - Brown",
    basePrice: 12.5,
    categorySlug: "tape",
  },
  {
    id: "prd_tape_clear",
    name: "Packaging Tape - Clear",
    basePrice: 15.0,
    categorySlug: "tape",
  },
  {
    id: "prd_bubble",
    name: "Bubble Wrap",
    basePrice: 35.0,
    categorySlug: "bubble-wrap",
  },
  {
    id: "prd_shrink",
    name: "Shrink Wrap",
    basePrice: 45.0,
    categorySlug: "shrink-wrap",
  },
  {
    id: "prd_stuffing",
    name: "Package Stuffing",
    basePrice: 25.0,
    categorySlug: "stuffing",
  },
];

export const PROMO_CODES: PromoCode[] = [
  {
    id: "promo_launch",
    code: "LAUNCH20",
    name: "Launch Special",
    description: "20% off for early customers",
    addedAt: "2026-01-01",
    used: 47,
    limit: 200,
    expiresAt: "2026-08-31",
    status: "active",
    budgetType: "usage",
    limitPerCustomer: 1,
  },
  {
    id: "promo_sme",
    code: "SME15",
    name: "SME Discount",
    description: "15% off for SME orders",
    addedAt: "2026-03-01",
    used: 112,
    limit: 500,
    expiresAt: "2026-12-31",
    status: "active",
    budgetType: "usage",
    limitPerCustomer: 1,
  },
  {
    id: "promo_spend",
    code: "SPEND500",
    name: "Q1 Spend Campaign",
    description: "GH₵500 off spend campaigns",
    addedAt: "2025-12-15",
    used: 89,
    limit: 50000,
    expiresAt: "2026-03-31",
    status: "archived",
    // "GH₵500 off spend campaigns" with a 50,000 limit — a spend budget.
    budgetType: "spend",
    limitPerCustomer: null,
  },
];

export const PROMO_BANNER: PromoBanner = {
  live: true,
  message: "Enjoy 10% off for all Easter orders Code: PGEASTER",
};

/**
 * Ghana 2026 VAT reform (Act 1151): VAT 15% + NHIL 2.5% + GETFund 2.5% with no
 * cascading = 20% effective. The Figma Settings screen lists exactly these three
 * component rates, so it is consistent with the reform.
 */
export const PLATFORM_SETTINGS: PlatformSettings = {
  currency: "GHS",
  vatRate: 15,
  nhilRate: 2.5,
  getfundRate: 2.5,
  platformFeePct: 5,
  baseDeliveryFee: 50,
};

/** Active-product count shown on the Overview card. */
export const ACTIVE_PRODUCT_COUNT = 9;
export const PRODUCT_CATEGORY_COUNT = 4;

export const PRODUCT_CATEGORIES = [
  { slug: "rsc-cartons", label: "RSC Cartons" },
  { slug: "die-cut-boxes", label: "Die Cut Boxes" },
  { slug: "food-packaging", label: "Food Packaging" },
  { slug: "packaging-accessories", label: "Packaging Accessories" },
  { slug: "tape", label: "Tape" },
  { slug: "bubble-wrap", label: "Bubble Wrap" },
  { slug: "shrink-wrap", label: "Shrink Wrap" },
  { slug: "stuffing", label: "Stuffing" },
];
