// Stable world IDs preserve the proven controller/portal architecture. All player
// facing identities belong to this experiment; main uses its original content.
export const regions = {
  home: {
    name: "The Courtyard",
    subtitle: "A HOME BETWEEN JOURNEYS",
    culture: "Atlas-inspired personal home",
    palette: ["#b87b58", "#e5d1ac", "#506d61"],
  },
  lumen: {
    name: "Tizi Highlands",
    subtitle: "CEDAR · STONE · SHARED WATER",
    culture: "Moroccan Atlas mountain communities",
    palette: ["#a48a6d", "#ded0aa", "#345b49"],
  },
  city: {
    name: "Targa Oasis",
    subtitle: "EARTH · PALM · LIVING WATER",
    culture: "Southern Moroccan oasis settlements",
    palette: ["#b76643", "#e2b983", "#457e72"],
  },
} as const;
export const futureRegions = [
  {
    name: "Rif Coast",
    identity: "Mediterranean slopes, fishing paths and coastal trade",
    status: "In development",
  },
  {
    name: "Kabyle Hills",
    identity:
      "Stone ridge villages, pottery, olive gardens and family histories",
    status: "In development",
  },
  {
    name: "Saharan Routes",
    identity:
      "A distinct Tuareg-inspired chapter of rocky plateaus and caravan routes",
    status: "In development",
  },
];
export const glossary = [
  {
    word: "Aman",
    meaning: "water",
    note: "Amazigh word; the experiment's title",
    source: "https://journals.openedition.org/encyclopedieberbere/2461",
  },
  {
    word: "Tizi",
    meaning: "mountain pass",
    note: "Atlas toponymic element; fictional region label here",
    source: "https://www.persee.fr/doc/onoma_0755-7752_2003_num_41_1_1451",
  },
  {
    word: "Targa",
    meaning: "irrigation channel",
    note: "Moroccan Amazigh water-management term; fictional oasis label here",
    source: "https://www.persee.fr/doc/bagf_0004-5322_2000_num_77_1_2146",
  },
] as const;
export const itemNames: Record<string, string> = {
  dawnwake: "The Dawnblade",
  "velvet-jacket": "Oasis woven mantle",
  "moonfern-lantern": "The herbalist’s clay lamp",
  "forest-echo": "Water stewards’ testimony",
  "crossing-echo": "Caravan passage record",
  "archive-echo": "The granary’s shared ledger",
  "oasis-clasp": "Silver channel clasp",
};
