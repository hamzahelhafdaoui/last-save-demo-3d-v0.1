import * as T from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { Controls } from "../input/controls";
import { cameraRelative } from "../input/math.js";
import { FollowCamera } from "../render/camera";
import { Traveler } from "../render/traveler";
import { Motes, ring } from "../render/kit";
import { crystal } from "../worlds/common";
import { ui, useGame, type Mode } from "../state/store";
import { freshSave, objective, type WorldId } from "../state/model";
import { act } from "../state/actions";
import { ground } from "../simulation/terrain";
import type { World, Hotspot } from "../worlds/types";
import { AudioSystem } from "./audio";
import { Encounter } from "./encounter";
import { Extraction, EXTRACTION_DURATION, cameraPath } from "./cinematics";
export const command = (name: string) =>
  window.dispatchEvent(new CustomEvent("last-save-command", { detail: name }));
export class GameRuntime {
  world!: World;
  actor!: Traveler;
  controls!: Controls;
  follow!: FollowCamera;
  audio = new AudioSystem();
  time = 0;
  accumulator = 0;
  saveTimer = 0;
  cinematicTime = 0;
  disposed = false;
  private beacon: T.Mesh | null = null;
  private hot: Hotspot | undefined;
  private currentMode: Mode = "loading";
  private extraction: Extraction | null = null;
  private cues = new Set<number>();
  private lastSafe = { x: 7, z: 25 };
  private reward: { object: T.Group; start: T.Vector3; time: number } | null =
    null;
  private effects: T.Group | null = null;
  private motes: Motes | null = null;
  private viewAngle = 0;
  private listeners: AbortController = new AbortController();
  private encounter: Encounter | null = null;
  private challengeTimer = 0;
  private rollDirection = { x: 0, z: -1 };
  private loading = false;
  private justResumed = false;
  private pausedFrom: Mode = "play";
  private unsubscribe: (() => void) | null = null;
  constructor(
    private scene: T.Scene,
    private camera: T.PerspectiveCamera,
    private renderer: T.WebGLRenderer,
  ) {}
  async init() {
    await RAPIER.init();
    if (this.disposed) return;
    // Warm the small factory modules, not world scenes/assets. Existing sessions
    // can finish their journey even after main receives a newer deployment.
    await Promise.all([
      import("../worlds/home"),
      import("../worlds/lumen"),
      import("../worlds/city"),
    ]);
    if (this.disposed) return;
    this.actor = await Traveler.load();
    if (this.disposed) return;
    this.controls = new Controls(this.renderer.domElement);
    // Store changes can hide the controls between animation frames. Release
    // ownership synchronously so those fingers/keys cannot resume on their own.
    this.unsubscribe = useGame.subscribe((state, previous) => {
      if (state.mode !== previous.mode || state.hud !== previous.hud) {
        this.controls.enabled = state.mode === "play";
        this.controls.clear();
        this.accumulator = 0;
        if (this.world) {
          this.world.physics.velocity.x = this.world.physics.velocity.z = 0;
          this.world.physics.jumpBuffer = 0;
        }
      }
      if (
        state.save.experience !== previous.save.experience &&
        state.save.experience !== "quest"
      ) {
        this.encounter?.stop();
        this.actor.root.rotation.x = 0;
      }
    });
    this.beacon = ring(this.scene, 0, 0, 0, 0.5, 0.025, "#f0d9a7");
    this.beacon.rotation.x = Math.PI / 2;
    await this.load("home", true);
    if (!this.world || ui().mode === "error" || this.disposed) return;
    this.scene.add(this.actor.root);
    this.controls.enabled = false;
    useGame.setState({ mode: "title", loaded: true });
    window.addEventListener(
      "last-save-command",
      (e: Event) => {
        void this.command((e as CustomEvent).detail);
      },
      { signal: this.listeners.signal },
    );
    window.addEventListener(
      "keydown",
      (e) => {
        if (
          e.repeat ||
          (e.target as HTMLElement).matches(
            "input,select,textarea,[contenteditable=true]",
          )
        )
          return;
        if (e.key === "Escape") {
          if (ui().mode === "play") this.setMode("pause");
          else if (ui().mode === "pause") void this.command("resume");
          else if (["inventory", "journal", "dialogue"].includes(ui().mode))
            this.setMode("play");
        }
        if (ui().mode === "play") {
          if (e.key.toLowerCase() === "f") void this.command("strike");
          if (e.key.toLowerCase() === "q") void this.command("dodge");
          if (e.key.toLowerCase() === "i") this.setMode("inventory");
          if (e.key.toLowerCase() === "j") this.setMode("journal");
          if (e.key.toLowerCase() === "h") useGame.setState({ hud: !ui().hud });
        }
      },
      { signal: this.listeners.signal },
    );
    this.renderer.domElement.addEventListener(
      "wheel",
      (e) => {
        if (ui().mode !== "play") return;
        e.preventDefault();
        this.follow.distance = T.MathUtils.clamp(
          this.follow.distance + e.deltaY * 0.005,
          3.5,
          10,
        );
      },
      { passive: false, signal: this.listeners.signal },
    );
    this.renderer.domElement.addEventListener(
      "pointermove",
      (e) => {
        if (ui().mode === "customize" && e.buttons)
          this.viewAngle += e.movementX * 0.012;
      },
      { signal: this.listeners.signal },
    );
    document.addEventListener(
      "visibilitychange",
      () => {
        this.controls.clear();
        this.accumulator = 0;
        this.justResumed = !document.hidden;
        if (document.hidden) {
          this.remember();
          this.audio.pause();
        } else this.audio.resume();
      },
      { signal: this.listeners.signal },
    );
    window.addEventListener("pagehide", () => this.remember(), {
      signal: this.listeners.signal,
    });
    this.renderer.domElement.addEventListener(
      "webglcontextlost",
      (e) => {
        e.preventDefault();
        this.remember();
        useGame.setState({
          mode: "error",
          error:
            "The graphics connection was interrupted. Reload to return to your last saved place.",
        });
      },
      { signal: this.listeners.signal },
    );
    if (new URLSearchParams(location.search).has("debug"))
      Object.defineProperty(window, "lastSaveDebug", {
        configurable: true,
        value: () => ({
          mode: ui().mode,
          world: this.world.id,
          position: this.world.physics.position,
          velocity: { ...this.world.physics.velocity },
          grounded: this.world.physics.grounded,
          yaw: this.follow.yaw,
          pitch: this.follow.pitch,
          interaction: this.hot?.id,
          quest: ui().save.quest,
          equipment: ui().save.equipment,
          inventory: ui().save.inventory,
          appearance: ui().save.appearance,
          cinematicTime: this.cinematicTime,
          drawCalls: this.renderer.info.render.calls,
          triangles: this.renderer.info.render.triangles,
          hotspots: this.world.interactions
            .filter((h) => !h.visible || h.visible(ui().save))
            .map((h) => ({
              id: h.id,
              x: h.position.x,
              y: h.position.y,
              z: h.position.z,
            })),
          stick: { ...this.controls.move },
        }),
      });
  }
  private setMode(m: Mode) {
    if (m === "pause") this.pausedFrom = ui().mode;
    this.controls?.clear();
    if (this.controls) this.controls.enabled = m === "play";
    ui().setMode(m);
    this.accumulator = 0;
    if (m === "play") this.renderer.domElement.focus();
  }
  private remember() {
    if (!this.world || !this.actor || this.loading) return;
    const p = this.world.physics.position;
    ui().update((s) => ({
      ...s,
      world: this.world.id,
      positions: { ...s.positions, [this.world.id]: { x: p.x, z: p.z } },
    }));
  }
  private async load(id: WorldId, initial = false) {
    if (this.loading) return;
    if (!initial) this.remember();
    this.loading = true;
    const old = this.world;
    useGame.setState({
      mode: "transition",
      loading:
        id === "lumen"
          ? "Following the light to Lumenreach…"
          : id === "city"
            ? "Opening the door to Velvet City…"
            : "Finding your way home…",
    });
    try {
      let next: World;
      if (id === "home")
        next = await (await import("../worlds/home")).createWorld();
      else if (id === "lumen")
        next = await (await import("../worlds/lumen")).createWorld();
      else next = await (await import("../worlds/city")).createWorld();
      if (this.disposed) {
        next.dispose();
        return;
      }
      this.world = next;
      this.scene.add(next.scene);
      this.scene.background = next.scene.background;
      this.scene.fog = next.scene.fog;
      this.follow = new FollowCamera(this.camera, next.physics);
      const saved = ui().save.positions[id],
        p = saved ? [saved.x, saved.z] : next.spawn;
      const x = T.MathUtils.clamp(
          p[0],
          -next.physics.bounds + 1,
          next.physics.bounds - 1,
        ),
        z = T.MathUtils.clamp(
          p[1],
          -next.physics.bounds + 1,
          next.physics.bounds - 1,
        );
      next.physics.world.step();
      next.physics.teleport(x, z);
      this.lastSafe = { x, z };
      this.follow.yaw = id === "home" ? 0 : 0.16;
      this.follow.distance = id === "home" ? 5.4 : 6.5;
      this.scene.add(this.actor.root);
      this.encounter?.dispose();
      useGame.setState({ enemyCount: 0, health: 100 });
      this.encounter =
        id === "lumen" ? new Encounter(next.scene, this.audio) : null;
      if (this.encounter && ui().save.experience === "quest")
        void this.encounter.prepare();
      if (old) {
        this.scene.remove(old.scene);
        old.dispose();
      }
      if (!initial) ui().update((s) => ({ ...s, world: id }));
      this.audio.world(id);
      this.setMode("play");
      if (!initial && id === "lumen" && !ui().save.quest.accepted)
        this.startCinematic("arrival");
      if (!initial && id === "city")
        ui().notify("Same you. Entirely new world.", "VELVET CITY");
    } catch (e) {
      console.error(e);
      useGame.setState({
        mode: "error",
        error:
          "This world could not load. Your progress is saved. Reload to try again.",
      });
    } finally {
      this.loading = false;
    }
  }
  private dialogue(
    speaker: string,
    role: string,
    lines: string[],
    button = "Continue",
    action?: string,
  ) {
    useGame.setState({ dialogue: { speaker, role, lines, button, action } });
    this.setMode("dialogue");
  }
  async command(name: string) {
    const s = ui().save;
    if (name === "start") {
      this.audio.start();
      this.audio.setVolume(s.settings.volume);
      this.audio.world("home");
      if (s.created) {
        const target = s.world;
        await this.load(target);
        this.setMode("play");
      } else this.startCinematic("opening");
    } else if (name === "finish-customize") {
      ui().update((v) => ({ ...v, created: true }));
      this.actor.root.rotation.y = Math.PI;
      this.setMode("play");
      this.follow.reset();
      ui().notify("One character. Every world.", "YOUR STORY BEGINS");
    } else if (name === "strike") {
      if (ui().mode === "play" && this.encounter)
        this.encounter.strike(
          new T.Vector3().copy(this.actor.root.position),
          this.actor.root.rotation.y,
        );
    } else if (name === "dodge") {
      if (ui().mode === "play" && this.encounter) {
        const m = this.controls.movement(),
          d = cameraRelative(m.x, m.y, this.follow.yaw);
        this.rollDirection =
          Math.hypot(d.x, d.z) > 0.1
            ? d
            : {
                x: Math.sin(this.actor.root.rotation.y),
                z: Math.cos(this.actor.root.rotation.y),
              };
        this.encounter.roll();
      }
    } else if (name === "pause") this.setMode("pause");
    else if (name === "resume")
      this.setMode(
        ui().mode === "pause" && this.pausedFrom === "title" ? "title" : "play",
      );
    else if (name === "inventory") this.setMode("inventory");
    else if (name === "journal") this.setMode("journal");
    else if (name === "dialogue-confirm") {
      const action = ui().dialogue?.action;
      this.setMode("play");
      useGame.setState({ dialogue: null });
      if (action) this.action(action);
    } else if (name === "skip") this.finishCinematic();
    else if (name === "reveal-close") {
      this.setMode("play");
      this.follow.reset();
      ui().notify(
        s.equipment.sword
          ? "Dawnwake travels with you."
          : "Dawnwake remains in your collection.",
        s.equipment.sword ? "LEGENDARY WEAPON EQUIPPED" : "LEGENDARY WEAPON",
      );
    } else if (name === "replay-opening") {
      if (this.world.id !== "home") await this.load("home");
      this.startCinematic("opening");
    } else if (name === "replay-sword") {
      if (!s.quest.sword) {
        ui().notify("Complete the adventure to unlock this replay.");
        return;
      }
      if (this.world.id !== "lumen") await this.load("lumen");
      this.startCinematic("dawnwake");
    } else if (name === "reset") {
      this.remember();
      const fresh = freshSave();
      ui().update(() => fresh);
      await this.load("home", true);
      this.startCinematic("opening");
    } else if (name === "unstuck") {
      this.world.physics.teleport(...this.world.spawn);
      this.follow.reset();
      this.setMode("play");
      this.remember();
    } else if (name === "ending-finish") this.finishCinematic();
    else if (name === "customize") {
      this.setMode("customize");
      this.viewAngle = 0;
    }
  }
  private action(id: string) {
    const s = ui().save;
    if (id === "edda") {
      this.dialogue(
        "Edda",
        "APPRENTICE BELLKEEPER",
        s.quest.sword
          ? [
              "Listen… it remembers us again.",
              "Take Dawnwake somewhere it has never seen. Stories need new roads.",
            ]
          : s.quest.accepted
            ? [
                "Kindness in the grove. Courage at the crossing. Belonging in the archive.",
                "Carry those echoes to Crownstone. The guardian will listen.",
              ]
            : [
                "Our bell forgot its song. Now we’re forgetting the people it called home.",
                "Find three echoes: kindness in the grove, courage at the crossing, and belonging in the archive.",
                "Bring them to Crownstone Sanctuary. Perhaps the old sword remembers the dawn.",
              ],
        s.quest.accepted ? "I’ll keep going" : "I’ll find the echoes",
        s.quest.accepted ? undefined : "accept",
      );
      return;
    }
    if (id === "healer") {
      this.dialogue(
        "Mira",
        "BELLHAVEN’S HEALER",
        s.sideQuest.delivered
          ? [
              "A little moonlight, for the room you always return to.",
              "Keep the lantern close. Good stories deserve a warm light.",
            ]
          : s.sideQuest.herbs
            ? [
                "You made it back. And with the moonfern intact!",
                "Those hollow wardens are memories that lost their way. You did well to come through.",
                "Take my moonfern lantern. Let it remind you that somewhere, you helped.",
              ]
            : [
                "The grove’s moonfern steadies a frightened heart. I could use a bundle for the village.",
                "It grows along Elderwood Trail, beyond the bridge. Will you bring some back?",
              ],
        s.sideQuest.delivered
          ? "Until next time"
          : s.sideQuest.herbs
            ? "Deliver moonfern"
            : "I’ll bring it back",
        s.sideQuest.delivered
          ? undefined
          : s.sideQuest.herbs
            ? "deliver-herbs"
            : "healer-accept",
      );
      return;
    }
    if (id === "guardian") {
      this.dialogue("The memory guardian", "CROWNSTONE SANCTUARY", [
        "A world is not remembered by its stone.",
        "First, the kindness that keeps a light safe. Then, the courage to cross the dark. Finally, the belonging that calls us home.",
        "Answer with the three runes. Let your memories speak.",
      ]);
      return;
    }
    if (id === "sable" || id === "boutique") {
      this.dialogue(
        "Sable",
        "VELVET ATELIER",
        s.inventory.includes("velvet-jacket")
          ? [
              "That jacket has already been to another universe. I can tell.",
              "Bring me another story next time.",
            ]
          : [
              "Okay, where did you get THAT?",
              "A sword from a forgotten kingdom… and you brought it here.",
              "Try this jacket. Every great story needs a second chapter.",
            ],
        s.inventory.includes("velvet-jacket")
          ? "See you around"
          : "Wear the Velvet jacket",
        s.inventory.includes("velvet-jacket") ? undefined : "jacket",
      );
      return;
    }
    if (id === "mirror" || id === "wardrobe") {
      this.setMode("customize");
      this.viewAngle = 0;
      return;
    }
    if (id === "journal") {
      this.setMode("journal");
      return;
    }
    if (id === "locked") {
      ui().notify(
        "This world has not been written yet.",
        "FUTURE CHAPTER · UNAVAILABLE",
      );
      return;
    }
    if (id.startsWith("portal-")) {
      const dest = id.slice(7) as WorldId;
      if (dest === "city" && !s.quest.sword) {
        ui().notify(
          "A story from Lumenreach will wake this doorway.",
          "VELVET CITY",
        );
        return;
      }
      this.load(dest);
      return;
    }
    if (id === "sword") {
      if (s.quest.guardian === 3) this.startCinematic("dawnwake");
      return;
    }
    if (id === "mechanism") this.challengeTimer = 0;
    const result = act(s, id);
    if (result.save !== s) ui().update(() => result.save);
    if (result.message) ui().notify(result.message);
    if (result.reward) {
      if (result.reward === "moonfern-lantern") {
        this.audio.cue("reward");
        ui().notify(
          "The moonfern lantern",
          "HOME KEEPSAKE ACQUIRED · DISPLAYED IN YOUR ROOM",
        );
      } else if (result.reward === "jacket") {
        this.audio.cue("reward");
        ui().notify("The Velvet jacket", "OUTFIT ACQUIRED · EQUIPPED");
      } else this.echoReward(result.reward);
    }
    if (id === "display" && result.save.home.sword) {
      this.audio.cue("bell");
      if (
        result.save.inventory.includes("velvet-jacket") &&
        !result.save.ending
      )
        this.startCinematic("ending");
      else
        ui().notify(
          "The sword that remembers the dawn.",
          "DAWNWAKE · DISPLAYED AT HOME",
        );
    }
  }
  private echoReward(name: string) {
    this.audio.cue("reward");
    const p = this.world.physics.position,
      start = this.hot?.position.clone() || new T.Vector3(p.x, p.y, p.z);
    start.y += 1.4;
    const object = crystal(this.scene, start.x, start.y, start.z);
    this.reward = { object, start, time: 0 };
    ui().notify(
      {
        forest: "The echo of kindness",
        crossing: "The echo of courage",
        archive: "The echo of belonging",
      }[name] || "A memory found",
      "MEMORY RESTORED · " + ui().save.quest.echoes.length + "/3",
    );
  }
  private startCinematic(kind: string) {
    this.controls.clear();
    this.cinematicTime = 0;
    this.cues.clear();
    this.extraction?.dispose();
    this.extraction = null;
    if (kind === "dawnwake") {
      this.extraction = new Extraction();
      this.audio.world("sanctuary");
      this.effects = new T.Group();
      this.world.scene.add(this.effects);
      this.effects.position.copy(this.world.pedestal!);
      this.motes = new Motes(this.effects, 180, 16, "#ffe7a2");
      this.effects.visible = false;
      this.world.physics.teleport(33, -35.5);
    }
    useGame.setState({
      cinematic: kind,
      cinematicTime: 0,
      mode:
        kind === "opening"
          ? "opening"
          : kind === "ending"
            ? "ending"
            : "cinematic",
    });
  }
  private finishCinematic() {
    document.documentElement.style.setProperty("--flash", "0");
    const kind = ui().cinematic;
    if (!["cinematic", "opening", "ending"].includes(ui().mode)) return;
    if (kind === "opening") {
      if (ui().save.created) this.setMode("play");
      else this.setMode("customize");
    } else if (kind === "dawnwake") {
      const result = act(ui().save, "sword");
      ui().update(() => result.save);
      this.world.scene.userData.sunrise = 1;
      this.world.scene.userData.beam = 0;
      this.world.scene.userData.fracture = 1;
      this.world.physics.teleport(33, -35.8);
      this.audio.cue("bell");
      this.audio.world("lumen");
      this.setMode("reveal");
    } else if (kind === "ending") {
      ui().update((s) => ({ ...s, ending: true }));
      this.setMode("play");
    } else this.setMode("play");
    this.extraction?.dispose();
    this.extraction = null;
    if (this.effects) {
      this.effects.removeFromParent();
      this.effects.traverse((o) => {
        if (o instanceof T.Points) {
          o.geometry.dispose();
          (o.material as T.Material).dispose();
        }
      });
      this.effects = null;
    }
    this.follow.reset();
    this.remember();
  }
  update(dt: number) {
    if (this.disposed || !this.world || !this.actor || !this.controls) return;
    const cinematicDelta = this.justResumed ? 0 : Math.min(dt, 1);
    this.justResumed = false;
    dt = Math.min(dt, 0.07);
    if (document.hidden) return;
    this.time += dt;
    const state = ui(),
      s = state.save,
      mode = state.mode;
    if (this.currentMode !== mode) {
      this.accumulator = 0;
      this.currentMode = mode;
      if (mode !== "customize") this.camera.clearViewOffset();
    }
    this.controls.enabled = mode === "play";
    this.controls.sensitivity = s.settings.sensitivity;
    this.follow.motion = s.settings.motion;
    this.audio.setVolume(s.settings.volume);
    this.world.scene.userData.exterior =
      mode === "title" || (mode === "opening" && this.cinematicTime < 17);
    this.world.update(this.time, dt, s);
    const goalMarker = objective(s);
    if (this.beacon) {
      this.beacon.visible =
        mode === "play" && goalMarker.world === this.world.id;
      this.beacon.position.set(
        goalMarker.target[0],
        this.world.physics.height(...goalMarker.target) + 0.15,
        goalMarker.target[1],
      );
      this.beacon.scale.setScalar(1 + Math.sin(this.time * 2) * 0.1);
    }
    this.actor.appearance(
      s.appearance,
      s.equipment.jacket,
      s.equipment.sword && mode !== "cinematic" && mode !== "reveal",
    );
    if (mode === "play") {
      if (
        this.encounter &&
        s.experience !== "quest" &&
        (this.encounter.active ||
          this.encounter.dodge > 0 ||
          this.encounter.attack > 0)
      )
        this.encounter.stop();
      const m = this.controls.movement();
      let d = cameraRelative(m.x, m.y, this.follow.yaw);
      if (this.encounter && this.encounter.dodge > 0) d = this.rollDirection;
      const speed =
        this.encounter && this.encounter.dodge > 0
          ? 10
          : m.run
            ? 6.3
            : this.controls.keys.has("control")
              ? 1.6
              : 3.6;
      let jump = this.controls.consumeJump();
      this.accumulator += dt;
      while (this.accumulator >= 1 / 60) {
        this.world.physics.step(d.x, d.z, speed, jump, 1 / 60);
        jump = false;
        this.accumulator -= 1 / 60;
      }
      const p = this.world.physics.position;
      if (p.y > 0.9 && this.world.physics.grounded)
        this.lastSafe = { x: p.x, z: p.z };
      if ((p.y < -0.65 && this.world.id === "lumen") || p.y < -4) {
        this.world.physics.teleport(this.lastSafe.x, this.lastSafe.z);
        this.follow.reset();
        ui().notify(
          "Take a breath. The road is still here.",
          "BACK ON SOLID GROUND",
        );
      }
      this.hot = this.world.interactions
        .filter(
          (h) =>
            (!h.visible || h.visible(s)) &&
            Math.abs(h.position.y - p.y) < 2.5 &&
            Math.hypot(h.position.x - p.x, h.position.z - p.z) <
              (h.radius || 2.5),
        )
        .sort(
          (a, b) =>
            a.position.distanceToSquared(new T.Vector3(p.x, p.y, p.z)) -
            b.position.distanceToSquared(new T.Vector3(p.x, p.y, p.z)),
        )[0];
      const goal = objective(s),
        distance =
          goal.world === this.world.id
            ? Math.hypot(goal.target[0] - p.x, goal.target[1] - p.z)
            : 0;
      const region =
        this.world.id === "home"
          ? "The Wayfarer’s Room"
          : this.world.id === "city"
            ? "Velvet City"
            : p.x > 22 && p.z < -23
              ? "Crownstone Sanctuary"
              : p.z < -24
                ? "Bellhaven"
                : p.x < -17
                  ? "The Moonflower Grove"
                  : Math.abs(p.z + 12) < 12
                    ? "The Silverbrook"
                    : "Lumenreach";
      if (
        state.promptId !== (this.hot?.id || "") ||
        state.region !== region ||
        Math.abs(state.distance - distance) > 1
      )
        useGame.setState({
          prompt: this.hot?.label || "",
          promptId: this.hot?.id || "",
          region,
          distance,
        });
      if (this.controls.consumeInteract() && this.hot) {
        this.audio.cue("interact");
        this.action(this.hot.id);
        // Dialogue, a portal or a cinematic has taken control. Do not process
        // another combat hit/challenge tick using this stale gameplay frame.
        if (ui().mode !== "play") return;
      }
      if (this.world.id === "lumen" && s.quest.mechanism && s.quest.steps < 3) {
        const steps = [
            [-29, -31],
            [-33, -34],
            [-37, -37],
          ],
          target = steps[s.quest.steps];
        const stepY = ground(-29, -31) + 1.25;
        if (
          Math.hypot(p.x - target[0], p.z - target[1]) < 1.3 &&
          p.y > stepY - 0.35 &&
          this.world.physics.grounded
        ) {
          const result = act(ui().save, "step-" + s.quest.steps);
          ui().update(() => result.save);
          this.audio.cue("reward");
          ui().notify(
            "Rune stone " + result.save.quest.steps + " awakened.",
            "THE ANCIENT CROSSING",
          );
        }
      }
      this.follow.update(
        p,
        this.controls.consumeLook(),
        dt,
        Math.hypot(
          this.world.physics.velocity.x,
          this.world.physics.velocity.z,
        ),
        this.time,
      );
      this.actor.update(
        p,
        this.world.physics.velocity,
        this.world.physics.grounded,
        dt,
        this.time,
      );
      this.actor.root.rotation.x = 0;
      if (this.encounter && s.experience === "quest") {
        void this.encounter.prepare();
        if (
          s.sideQuest.herbs &&
          !s.sideQuest.defeated &&
          Math.hypot(p.x + 13, p.z - 13) < 8 &&
          !this.encounter.active &&
          this.encounter.ready
        ) {
          if (!s.sideQuest.ambush)
            ui().update((v) => ({
              ...v,
              sideQuest: { ...v.sideQuest, ambush: true },
            }));
          this.encounter.start();
        }
        const outcome = this.encounter.update(
          dt,
          this.time,
          new T.Vector3(p.x, p.y, p.z),
        );
        if (outcome === "lost") {
          this.world.physics.teleport(-16, 24);
          this.follow.reset();
        }
        if (this.encounter.attack > 0) this.actor.pose(0.9, 0, 0.3, 1);
        if (this.encounter.dodge > 0) {
          this.actor.root.rotation.x =
            -Math.sin((this.encounter.dodge / 0.42) * Math.PI) * 0.9;
          this.actor.root.position.y -= 0.3;
        } else this.actor.root.rotation.x = 0;
      }
      if (
        this.world.id === "lumen" &&
        s.experience !== "tour" &&
        s.quest.mechanism &&
        !s.quest.echoes.includes("crossing") &&
        s.quest.steps > 0 &&
        s.quest.steps < 3
      ) {
        this.challengeTimer += dt;
        useGame.setState({
          challengeRemaining: Math.max(0, 12 - this.challengeTimer),
        });
        if (this.challengeTimer > 12) {
          ui().update((v) => ({ ...v, quest: { ...v.quest, steps: 0 } }));
          this.challengeTimer = 0;
          this.world.physics.teleport(-24, -26);
          this.follow.reset();
          ui().notify(
            "The runes dimmed. Turn the mechanism and try the crossing again.",
            "CROSSING LOST · MEMORIES KEPT",
          );
        }
      } else {
        this.challengeTimer = 0;
        if (ui().challengeRemaining)
          useGame.setState({ challengeRemaining: 0 });
      }
      this.saveTimer += dt;
      if (this.saveTimer > 4) {
        this.remember();
        this.saveTimer = 0;
      }
      if (
        Math.hypot(
          this.world.physics.velocity.x,
          this.world.physics.velocity.z,
        ) > 1 &&
        this.world.physics.grounded &&
        Math.floor(this.time * 3) !== Math.floor((this.time - dt) * 3)
      )
        this.audio.cue("step");
    } else if (mode === "title") {
      this.camera.position.set(17 + Math.sin(this.time * 0.08) * 2, 10, 26);
      this.camera.lookAt(0, 2, -3);
      this.actor.update(
        this.world.physics.position,
        { x: 0, y: 0, z: 0 },
        true,
        dt,
        this.time,
      );
    } else if (mode === "customize") {
      this.camera.setViewOffset(
        innerWidth,
        innerHeight,
        innerWidth < 540 ? 0 : innerWidth * 0.12,
        innerWidth < 540 ? innerHeight * 0.21 : 0,
        innerWidth,
        innerHeight,
      );
      const p = this.world.physics.position;
      this.actor.update(p, { x: 0, y: 0, z: 0 }, true, dt, this.time);
      this.actor.root.rotation.y = 0;
      const angle = this.viewAngle;
      this.camera.position.set(
        p.x + Math.sin(angle) * 3.6,
        p.y + 1.3,
        p.z + Math.cos(angle) * 3.6,
      );
      this.camera.lookAt(p.x, p.y + 1, p.z);
      this.camera.fov = 42;
      this.camera.updateProjectionMatrix();
    } else if (["opening", "cinematic", "ending"].includes(mode))
      this.updateCinematic(cinematicDelta);
    if (this.reward) {
      const r = this.reward;
      r.time += dt;
      const p = this.world.physics.position,
        t = Math.min(1, r.time / 2.1);
      r.object.position
        .copy(r.start)
        .lerp(new T.Vector3(p.x, p.y + 1.2, p.z), t * t);
      r.object.position.y += Math.sin(t * Math.PI) * 1.3;
      r.object.rotation.y += dt * 3;
      r.object.scale.setScalar(1 - t * 0.8);
      if (t === 1) {
        r.object.removeFromParent();
        r.object.traverse((o) => {
          if (o instanceof T.Mesh) o.geometry.dispose();
        });
        this.reward = null;
      }
    }
  }
  private updateCinematic(dt: number) {
    this.cinematicTime += dt;
    const t = this.cinematicTime,
      kind = ui().cinematic;
    if (Math.abs(ui().cinematicTime - t) > 0.2)
      useGame.setState({ cinematicTime: t });
    if (kind === "opening") {
      cameraPath(
        this.camera,
        [
          new T.Vector3(40, 14, 64),
          new T.Vector3(-21, 14, 39),
          new T.Vector3(4, 8, 24),
          new T.Vector3(0, 3, 10),
          new T.Vector3(0, 1.6, 5),
        ],
        new T.Vector3(0, 2, -4),
        t,
        22,
      );
      this.actor.update(
        this.world.physics.position,
        { x: 0, y: 0, z: 0 },
        true,
        dt,
        this.time,
      );
      if (t > 22) this.finishCinematic();
    } else if (kind === "arrival") {
      const y = ground(7, 25);
      cameraPath(
        this.camera,
        [
          new T.Vector3(7, y + 2, 29),
          new T.Vector3(-8, 12, 24),
          new T.Vector3(2, 18, 10),
          new T.Vector3(7, y + 4, 32),
        ],
        new T.Vector3(4, 9, -35),
        t,
        8,
      );
      this.actor.update(
        this.world.physics.position,
        { x: 0, y: 0, z: 0 },
        true,
        dt,
        this.time,
      );
      if (t > 8) this.finishCinematic();
    } else if (kind === "dawnwake" && this.extraction) {
      const v = this.extraction.sample(t),
        base = this.world.pedestal!,
        p = {
          x: 33.24,
          y: base.y + 0.33 + Math.min(0.4, v.lift * 0.3),
          z: T.MathUtils.lerp(-35.5, base.z + 0.5, v.approach),
        };
      this.actor.update(p, { x: 0, y: 0, z: 0 }, true, dt, this.time);
      this.actor.root.rotation.y = Math.PI;
      this.actor.pose(v.reach, v.strain, v.raise, v.grip);
      this.actor.root.updateMatrixWorld(true);
      const sword = this.world.sword!;
      sword.visible = true;
      sword.rotation.set(0, 0, 0);
      sword.scale.setScalar(0.8);
      if (t < 22) {
        sword.position.set(base.x, base.y + 1.25 + v.lift * 0.7, base.z);
        this.actor.grasp(
          new T.Vector3(base.x, base.y + 1.49 + v.lift * 0.7, base.z),
          v.reach,
        );
      } else {
        this.actor.grasp(
          new T.Vector3(
            base.x,
            base.y + 2.435 + v.raise * 0.15,
            T.MathUtils.lerp(base.z, p.z, v.raise),
          ),
          1,
        );
        const hand = this.actor.handPosition(),
          turn = v.raise * Math.PI;
        sword.rotation.z = turn;
        sword.position
          .copy(hand)
          .sub(
            new T.Vector3(0, 0.24, 0).applyAxisAngle(
              new T.Vector3(0, 0, 1),
              turn,
            ),
          );
      }
      this.camera.position.set(base.x + v.x, base.y + v.y, base.z + v.z);
      this.camera.lookAt(base.x + v.tx, base.y + v.ty, base.z + v.tz);
      this.camera.fov = 51;
      this.camera.updateProjectionMatrix();
      this.world.scene.userData.sunrise = v.sunrise;
      this.world.scene.userData.fracture =
        t > 22 ? Math.min(1, (t - 22) * 1.5) : 0;
      this.world.scene.userData.cracks = t > 9 ? Math.min(1, (t - 9) / 10) : 0;
      this.world.scene.userData.beam = v.beam;
      document.documentElement.style.setProperty(
        "--flash",
        String(v.flash * 0.85),
      );
      if (this.effects) {
        this.effects.visible = t > 12;
        this.effects.scale.setScalar(
          t > 22 ? 1 + (t - 22) * 0.7 : 0.3 + (t - 12) * 0.08,
        );
        this.motes?.update(this.time);
      }
      for (const [at, cue] of [
        [8, "pull"],
        [16, "pull"],
        [22, "burst"],
        [27, "bell"],
      ] as [number, string][])
        if (t >= at && !this.cues.has(at)) {
          this.cues.add(at);
          this.audio.cue(cue);
        }
      if (t >= EXTRACTION_DURATION) {
        document.documentElement.style.setProperty("--flash", "0");
        this.finishCinematic();
      }
    } else if (kind === "ending") {
      cameraPath(
        this.camera,
        [
          new T.Vector3(-5, 3, 3),
          new T.Vector3(0, 3, 8),
          new T.Vector3(0, 4, 12),
          new T.Vector3(0, 7, 24),
        ],
        new T.Vector3(0, 5, 60),
        t,
        13,
      );
      this.actor.update(
        this.world.physics.position,
        { x: 0, y: 0, z: 0 },
        true,
        dt,
        this.time,
      );
      if (t > 13) this.finishCinematic();
    }
  }
  dispose() {
    this.disposed = true;
    this.unsubscribe?.();
    this.controls?.dispose();
    this.listeners.abort();
    this.extraction?.dispose();
    this.encounter?.dispose();
    this.audio.dispose();
    this.world?.dispose();
    this.actor?.root.removeFromParent();
  }
}
