export type WorldId = "home" | "lumen" | "city";
export type Echo = "forest" | "crossing" | "archive";
export type Appearance = {
  name: string;
  preset: "amber" | "moon" | "russet";
  fur: string;
  hair: string;
  hairStyle: number;
  eyes: string;
  primary: string;
  secondary: string;
  accessory: boolean;
};
export type Experience = "tour" | "adventure" | "quest";
export type Save = {
  version: 2;
  experience: Experience;
  sideQuest: {
    accepted: boolean;
    herbs: boolean;
    ambush: boolean;
    defeated: boolean;
    delivered: boolean;
  };
  oasis: { accepted: boolean; repairs: number[]; restored: boolean };
  granaryDecision: "witnessed" | "sealed" | null;
  appearance: Appearance;
  created: boolean;
  world: WorldId;
  positions: Partial<Record<WorldId, { x: number; z: number }>>;
  quest: {
    accepted: boolean;
    flowers: number[];
    mechanism: boolean;
    steps: number;
    memory: number;
    echoes: Echo[];
    guardian: number;
    sword: boolean;
  };
  inventory: string[];
  equipment: { sword: boolean; jacket: boolean };
  home: { sword: boolean };
  ending: boolean;
  settings: {
    volume: number;
    quality: "low" | "medium" | "high";
    motion: boolean;
    sensitivity: number;
  };
};
export const SAVE_KEY = "last-save.aman.v1";
export const DEFAULT_APPEARANCE: Appearance = {
  name: "Wayfarer",
  preset: "amber",
  fur: "#bc874f",
  hair: "#633c2d",
  hairStyle: 0,
  eyes: "#294c4b",
  primary: "#6e8069",
  secondary: "#b28250",
  accessory: true,
};
export function freshSave(): Save {
  return {
    version: 2,
    experience: "tour",
    sideQuest: {
      accepted: false,
      herbs: false,
      ambush: false,
      defeated: false,
      delivered: false,
    },
    oasis: { accepted: false, repairs: [], restored: false },
    granaryDecision: null,
    appearance: { ...DEFAULT_APPEARANCE },
    created: false,
    world: "home",
    positions: {},
    quest: {
      accepted: false,
      flowers: [],
      mechanism: false,
      steps: 0,
      memory: 0,
      echoes: [],
      guardian: 0,
      sword: false,
    },
    inventory: [],
    equipment: { sword: false, jacket: false },
    home: { sword: false },
    ending: false,
    settings: { volume: 0.55, quality: "medium", motion: true, sensitivity: 1 },
  };
}
const color = (v: unknown, f: string) =>
  typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : f;
const count = (v: unknown, max: number) =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.max(0, Math.min(max, Math.floor(v)))
    : 0;
export function validateSave(raw: unknown): Save {
  const f = freshSave();
  if (!raw || typeof raw !== "object" || (raw as Save).version !== 2) return f;
  const r = raw as any,
    a = r.appearance || {},
    q = r.quest || {};
  f.experience = ["tour", "adventure", "quest"].includes(r.experience)
    ? r.experience
    : "tour";
  const side = r.sideQuest || {};
  f.sideQuest = {
    accepted: side.accepted === true,
    herbs: side.herbs === true,
    ambush: side.ambush === true,
    defeated: side.defeated === true,
    delivered: side.delivered === true,
  };
  f.oasis = {
    accepted: r.oasis?.accepted === true,
    repairs: Array.isArray(r.oasis?.repairs)
      ? [
          ...new Set<number>(
            r.oasis.repairs.filter((n: unknown) =>
              [0, 1, 2].includes(n as number),
            ),
          ),
        ]
      : [],
    restored: false,
  };
  f.oasis.restored = f.oasis.repairs.length === 3;
  f.granaryDecision = ["witnessed", "sealed"].includes(r.granaryDecision)
    ? r.granaryDecision
    : null;
  f.created = r.created === true;
  f.appearance = {
    ...f.appearance,
    name:
      typeof a.name === "string"
        ? a.name.replace(/[<>\u0000-\u001f]/g, "").slice(0, 24) || "Wayfarer"
        : "Wayfarer",
    preset: ["amber", "moon", "russet"].includes(a.preset) ? a.preset : "amber",
    fur: color(a.fur, f.appearance.fur),
    hair: color(a.hair, f.appearance.hair),
    hairStyle: count(a.hairStyle, 2),
    eyes: color(a.eyes, f.appearance.eyes),
    primary: color(a.primary, f.appearance.primary),
    secondary: color(a.secondary, f.appearance.secondary),
    accessory: a.accessory !== false,
  };
  f.world = ["home", "lumen", "city"].includes(r.world) ? r.world : "home";
  for (const w of ["home", "lumen", "city"] as WorldId[]) {
    const p = r.positions?.[w];
    if (
      p &&
      Number.isFinite(p.x) &&
      Number.isFinite(p.z) &&
      Math.abs(p.x) < 85 &&
      Math.abs(p.z) < 85
    )
      f.positions[w] = { x: p.x, z: p.z };
  }
  f.quest = {
    accepted: q.accepted === true,
    flowers: Array.isArray(q.flowers)
      ? [
          ...new Set<number>(
            q.flowers.filter((n: unknown) => [0, 1, 2].includes(n as number)),
          ),
        ]
      : [],
    mechanism: q.mechanism === true,
    steps: count(q.steps, 3),
    memory: count(q.memory, 3),
    echoes: Array.isArray(q.echoes)
      ? [
          ...new Set<Echo>(
            q.echoes.filter((e: unknown) =>
              ["forest", "crossing", "archive"].includes(e as string),
            ),
          ),
        ]
      : [],
    guardian: count(q.guardian, 3),
    sword: q.sword === true,
  };
  f.inventory = Array.isArray(r.inventory)
    ? [
        ...new Set<string>(
          r.inventory.filter((x: unknown) =>
            [
              "oasis-clasp",
              "dawnwake",
              "velvet-jacket",
              "moonfern-lantern",
              "forest-echo",
              "crossing-echo",
              "archive-echo",
            ].includes(x as string),
          ),
        ),
      ]
    : [];
  // Repair interrupted or inconsistent saves without creating duplicate rewards.
  if (f.quest.sword && !f.inventory.includes("dawnwake"))
    f.inventory.push("dawnwake");
  if (f.inventory.includes("dawnwake")) {
    f.quest.sword = true;
    f.quest.accepted = true;
    f.quest.echoes = ["forest", "crossing", "archive"];
    f.quest.guardian = 3;
  }
  for (const e of f.quest.echoes)
    if (!f.inventory.includes(e + "-echo")) f.inventory.push(e + "-echo");
  f.equipment = {
    sword: r.equipment?.sword === true && f.quest.sword,
    jacket:
      r.equipment?.jacket === true && f.inventory.includes("velvet-jacket"),
  };
  f.home.sword = r.home?.sword === true && f.quest.sword && !f.equipment.sword;
  if (f.sideQuest.delivered && !f.inventory.includes("moonfern-lantern"))
    f.inventory.push("moonfern-lantern");
  f.ending = r.ending === true;
  const s = r.settings || {};
  f.settings = {
    volume:
      typeof s.volume === "number" && Number.isFinite(s.volume)
        ? Math.max(0, Math.min(1, s.volume))
        : 0.55,
    quality: ["low", "medium", "high"].includes(s.quality)
      ? s.quality
      : "medium",
    motion: s.motion !== false,
    sensitivity:
      typeof s.sensitivity === "number" && Number.isFinite(s.sensitivity)
        ? Math.max(0.4, Math.min(1.8, s.sensitivity))
        : 1,
  };
  return f;
}
export function loadSave(): Save {
  try {
    return validateSave(JSON.parse(localStorage.getItem(SAVE_KEY) || "null"));
  } catch {
    return freshSave();
  }
}
export function persist(s: Save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}
export function addEcho(save: Save, echo: Echo): Save {
  if (save.quest.echoes.includes(echo)) return save;
  return {
    ...save,
    quest: { ...save.quest, echoes: [...save.quest.echoes, echo] },
    inventory: [...new Set([...save.inventory, echo + "-echo"])],
  };
}
export function grantSword(save: Save): Save {
  if (save.quest.sword || save.inventory.includes("dawnwake")) return save;
  if (save.quest.echoes.length !== 3 || save.quest.guardian < 3) return save;
  return {
    ...save,
    quest: { ...save.quest, sword: true },
    inventory: [...new Set([...save.inventory, "dawnwake"])],
    equipment: { ...save.equipment, sword: true },
  };
}
export function objective(s: Save): {
  title: string;
  detail: string;
  world: WorldId;
  target: [number, number];
} {
  const goal = (
    title: string,
    detail: string,
    world: WorldId,
    target: [number, number],
  ) => ({ title, detail, world, target });
  if (
    s.experience === "quest" &&
    s.sideQuest.accepted &&
    !s.sideQuest.delivered
  ) {
    if (!s.sideQuest.herbs)
      return goal(
        "A lamp for the journey",
        "Gather trail herbs for Hadda, the village herbalist.",
        "lumen",
        [-16, 19],
      );
    if (s.sideQuest.ambush && !s.sideQuest.defeated)
      return goal(
        "Shadows on the cedar trail",
        "F to strike · Q to dodge. Escape is also a choice.",
        "lumen",
        [-13, 13],
      );
    return goal(
      "Something worth bringing home",
      "Return the herbs to Hadda.",
      "lumen",
      [10, -29],
    );
  }
  if (!s.created)
    return goal(
      "A traveler, a story",
      "Choose your look at the courtyard mirror.",
      "home",
      [-7, 2],
    );
  if (s.world === "city") {
    if (!s.oasis.accepted)
      return goal(
        "Water belongs to a community",
        "Speak with the channel keeper beside the weaving courtyard.",
        "city",
        [-6, -8],
      );
    if (!s.oasis.restored) {
      const i = [0, 1, 2].find((n) => !s.oasis.repairs.includes(n))!;
      return goal(
        "The water we share",
        [
          "Clear the headworks filter at the gallery outlet.",
          "Seal the broken garden channel.",
          "Open the shared distribution gate.",
        ][i],
        "city",
        [
          [10, -15],
          [12, 0],
          [1, -6],
        ][i] as [number, number],
      );
    }
    if (!s.inventory.includes("velvet-jacket"))
      return goal(
        "A gift woven in gratitude",
        "Return to the weaving courtyard for your mantle and silver clasp.",
        "city",
        [-6, -8],
      );
    return goal(
      "Carry both places with you",
      "Return to your courtyard with the Dawnblade and oasis mantle.",
      "city",
      [0, 12],
    );
  }
  if (s.world === "home") {
    if (!s.quest.sword)
      return goal(
        "The highlands are waiting",
        "Take the cedar-green doorway to Tizi Highlands.",
        "home",
        [-5, -7],
      );
    if (!s.inventory.includes("velvet-jacket"))
      return goal(
        "A new landscape, the same you",
        "Travel through the turquoise doorway to Targa Oasis.",
        "home",
        [5, -7],
      );
    if (!s.home.sword)
      return goal(
        "A place for every story",
        "Display the Dawnblade above your hearth.",
        "home",
        [-9, -3],
      );
    return goal(
      "Your story continues",
      "Your mantle, blade and keepsakes remember both communities.",
      "home",
      [0, -7],
    );
  }
  if (!s.quest.accepted)
    return goal(
      "The water, the road, the trust",
      "Cross the stone bridge and speak with Itto in the village.",
      "lumen",
      [4, -27],
    );
  if (!s.quest.echoes.includes("forest")) {
    const i = [0, 1, 2].find((n) => !s.quest.flowers.includes(n));
    return goal(
      "A spring runs again",
      i === undefined
        ? "Record the restored spring at the channel junction."
        : `Open intake gate ${["I", "II", "III"][i]}. ${s.quest.flowers.length}/3 flowing.`,
      "lumen",
      i === undefined
        ? [-25, 8]
        : ([
            [-24, 12],
            [-29, 7],
            [-20, 5],
          ][i] as [number, number]),
    );
  }
  if (!s.quest.echoes.includes("crossing"))
    return goal(
      "Reopen the caravan passage",
      !s.quest.mechanism
        ? "Raise the winch beside the closed passage."
        : s.quest.steps < 3
          ? `Cross the three marked platforms. ${s.quest.steps}/3 crossed.`
          : "Recover the caravan record beyond the passage.",
      "lumen",
      !s.quest.mechanism
        ? [-24, -28]
        : s.quest.steps < 3
          ? ([
              [-29, -31],
              [-33, -34],
              [-37, -37],
            ][s.quest.steps] as [number, number])
          : [-40, -40],
    );
  if (!s.quest.echoes.includes("archive"))
    return goal(
      "Whose grain is it?",
      s.quest.memory < 3
        ? "Read the evidence in order: delivery, family seals, shared reserve."
        : "Speak with the granary keeper and decide how to protect the stores.",
      "lumen",
      s.quest.memory < 3
        ? ([
            [13, -46],
            [17, -46],
            [15, -50],
          ][s.quest.memory] as [number, number])
        : [15, -48],
    );
  if (!s.quest.sword)
    return goal(
      "The Dawn Terrace",
      s.quest.guardian < 3
        ? "Offer water, passage and trust to the storykeeper, in that order."
        : "Approach the stone and claim the Dawnblade.",
      "lumen",
      [33, -38],
    );
  return goal(
    "Follow the water south",
    "The doorway beside Itto leads to Targa Oasis.",
    "lumen",
    [8, -24],
  );
}
