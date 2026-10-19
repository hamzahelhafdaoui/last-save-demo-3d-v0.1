import { addEcho, grantSword, type Save } from "./model";
export type ActionResult = { save: Save; message?: string; reward?: string };
export function act(s: Save, id: string): ActionResult {
  const next: Save = structuredClone(s),
    q = next.quest;
  if (id === "oasis-accept") {
    next.oasis.accepted = true;
    return {
      save: next,
      message:
        "Follow the channel. Repair the filter, the garden leak and the sharing gate.",
    };
  }
  if (id.startsWith("oasis-repair-")) {
    if (!s.oasis.accepted)
      return {
        save: s,
        message:
          "The channel keeper will explain what each neighborhood needs.",
      };
    const i = Number(id.slice(-1));
    if (![0, 1, 2].includes(i)) return { save: s };
    if (!next.oasis.repairs.includes(i)) next.oasis.repairs.push(i);
    next.oasis.restored = next.oasis.repairs.length === 3;
    return {
      save: next,
      message: next.oasis.restored
        ? "Water reaches the gardens and the shared cistern. Return to the weaving courtyard."
        : [
            "The filter is clear. Water leaves the gallery again.",
            "The joint holds. The garden channel stops losing water.",
            "The sharing gate opens to both neighborhoods.",
          ][i],
    };
  }
  if (id === "granary-witnessed" || id === "granary-sealed") {
    if (q.memory < 3 || !q.echoes.includes("crossing"))
      return {
        save: s,
        message: "Read all three pieces of evidence before deciding.",
      };
    if (q.echoes.includes("archive")) return { save: s };
    next.granaryDecision = id === "granary-witnessed" ? "witnessed" : "sealed";
    return {
      save: addEcho(next, "archive"),
      reward: "archive",
      message:
        id === "granary-witnessed"
          ? "The keeper records a measured release, witnessed by both families."
          : "The keeper seals the disputed cells and opens the communal reserve instead.",
    };
  }
  if (id === "healer-accept") {
    next.sideQuest.accepted = true;
    return { save: next };
  }
  if (id === "herbs") {
    if (!s.sideQuest.accepted)
      return {
        save: s,
        message: "Hadda, the herbalist, knows which trail plants she needs.",
      };
    next.sideQuest.herbs = true;
    return {
      save: next,
      message: "A bundle of trail herbs. Bring it back to Hadda.",
    };
  }
  if (id === "deliver-herbs") {
    if (!s.sideQuest.herbs)
      return {
        save: s,
        message: "Look along the cedar trail beyond the bridge.",
      };
    next.sideQuest.delivered = true;
    if (!next.inventory.includes("moonfern-lantern"))
      next.inventory.push("moonfern-lantern");
    return {
      save: next,
      reward: !s.sideQuest.delivered ? "moonfern-lantern" : undefined,
    };
  }
  if (id === "accept") {
    q.accepted = true;
    return { save: next };
  }
  if (id.startsWith("flower-")) {
    if (!q.accepted)
      return {
        save: s,
        message: "Speak with Itto before changing the community's water gates.",
      };
    const n = Number(id.slice(-1));
    if (![0, 1, 2].includes(n)) return { save: s };
    if (!q.flowers.includes(n)) q.flowers.push(n);
    return {
      save: next,
      message:
        q.flowers.length === 3
          ? "The channels meet. The cedar spring flows again."
          : "An intake opens. Water finds the next channel.",
    };
  }
  if (id === "forest-echo") {
    if (q.flowers.length !== 3)
      return {
        save: s,
        message: "Open all three intakes before recording the water testimony.",
      };
    if (q.echoes.includes("forest")) return { save: s };
    return { save: addEcho(next, "forest"), reward: "forest" };
  }
  if (id === "mechanism") {
    if (!q.echoes.includes("forest"))
      return {
        save: s,
        message: "Restore the spring before leaving for the pass.",
      };
    q.mechanism = true;
    return {
      save: next,
      message:
        "The winch lifts. Cross the three marked platforms to the caravan record.",
    };
  }
  if (id.startsWith("step-")) {
    const n = Number(id.slice(-1));
    if (q.mechanism && n === q.steps) q.steps = Math.min(3, q.steps + 1);
    return { save: next };
  }
  if (id === "crossing-echo") {
    if (q.steps < 3)
      return {
        save: s,
        message: "Check all three platforms before reopening this route.",
      };
    if (q.echoes.includes("crossing")) return { save: s };
    return { save: addEcho(next, "crossing"), reward: "crossing" };
  }
  if (id.startsWith("memory-")) {
    if (!q.echoes.includes("crossing"))
      return {
        save: s,
        message:
          "The missing delivery record is still beyond the caravan passage.",
      };
    if (q.echoes.includes("archive")) return { save: s };
    const n = Number(id.slice(-1));
    if (n === q.memory) {
      q.memory++;
      return {
        save: next,
        message: [
          "The delivery measure: the grain arrived before the family divided.",
          "The seals: both households share the same delivery mark.",
          "The reserve ledger: enough communal grain remains to help both. Speak with the keeper.",
        ][n],
      };
    }
    q.memory = 0;
    return {
      save: next,
      message:
        "Read the evidence from its beginning: delivery, family seals, shared reserve.",
    };
  }
  if (id.startsWith("guardian-")) {
    if (q.echoes.length < 3)
      return {
        save: s,
        message:
          "Water, passage and trust: the storykeeper needs all three records.",
      };
    const n = Number(id.slice(-1));
    if (n === q.guardian) q.guardian++;
    else q.guardian = 0;
    return {
      save: next,
      message:
        q.guardian === 3
          ? "Your deeds speak. The Dawnblade is yours to carry."
          : n === q.guardian - 1
            ? ["Water restored, together.", "A road reopened for everyone."][n]
            : "The order is water, passage, then trust.",
    };
  }
  if (id === "sword") {
    if (q.sword) return { save: s };
    if (q.echoes.length < 3 || q.guardian < 3)
      return {
        save: s,
        message: "Offer all three community records at the Dawn Terrace.",
      };
    return { save: grantSword(next), reward: "dawnwake" };
  }
  if (id === "jacket") {
    if (!s.oasis.restored)
      return {
        save: s,
        message:
          "Restore the oasis channels before collecting the community's gift.",
      };
    for (const item of ["velvet-jacket", "oasis-clasp"])
      if (!next.inventory.includes(item)) next.inventory.push(item);
    next.equipment.jacket = true;
    return {
      save: next,
      reward: !s.inventory.includes("velvet-jacket") ? "jacket" : undefined,
    };
  }
  if (id === "display") {
    if (!q.sword)
      return {
        save: s,
        message: "Your journeys will leave something worth keeping here.",
      };
    next.home.sword = true;
    next.equipment.sword = false;
    return { save: next };
  }
  return { save: s };
}
