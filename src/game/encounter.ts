import * as T from "three";
import { Traveler } from "../render/traveler";
import { DEFAULT_APPEARANCE } from "../state/model";
import { ground } from "../simulation/terrain";
import { ring } from "../render/kit";
import { ui, useGame } from "../state/store";
import type { AudioSystem } from "./audio";
export class Encounter {
  enemies: {
    actor: Traveler;
    hp: number;
    cooldown: number;
    wind: number;
    hit: boolean;
    flash: number;
    origin: T.Vector3;
    telegraph: T.Mesh;
  }[] = [];
  active = false;
  health = 100;
  dodge = 0;
  attack = 0;
  attackCooldown = 0;
  dodgeCooldown = 0;
  ready = false;
  private loading = false;
  private deathTime = 0;
  constructor(
    private scene: T.Scene,
    private audio: AudioSystem,
  ) {}
  async prepare() {
    if (this.ready || this.loading) return;
    this.loading = true;
    for (let i = 0; i < 3; i++) {
      const actor = await Traveler.load();
      actor.root.visible = false;
      actor.appearance(
        {
          ...DEFAULT_APPEARANCE,
          preset: "moon",
          fur: "#77758d",
          hair: "#303043",
          primary: "#38304b",
          secondary: "#9f687f",
          eyes: "#d4a3a8",
          accessory: false,
        },
        false,
        true,
      );
      actor.root.scale.setScalar(1.02);
      this.scene.add(actor.root);
      const telegraph = ring(actor.root, 0, 0.05, 0, 1.1, 0.035, "#cf8599");
      telegraph.rotation.x = -Math.PI / 2;
      telegraph.visible = false;
      this.enemies.push({
        actor,
        telegraph,
        hp: 3,
        cooldown: i * 0.55 + 1.3,
        wind: 0,
        hit: false,
        flash: 0,
        origin: new T.Vector3(
          -13 + Math.sin(i * 2.1) * 5,
          0,
          13 + Math.cos(i * 2.1) * 5,
        ),
      });
    }
    this.ready = true;
    this.loading = false;
  }
  start() {
    if (!this.ready) return;
    this.active = true;
    this.health = 100;
    for (const e of this.enemies) {
      e.hp = 3;
      e.actor.root.visible = true;
      e.actor.root.position.copy(e.origin);
      e.actor.root.position.y = ground(e.origin.x, e.origin.z);
      e.wind = 0;
      e.cooldown = 1.3 + Math.random();
    }
    useGame.setState({ health: 100, enemyCount: 3 });
    ui().notify(
      "The leaves go quiet. Then three shadows move.",
      "HOLLOW WARDENS · F STRIKE · Q DODGE",
    );
    this.audio.cue("rustle");
  }
  strike(player: T.Vector3, facing: number) {
    if (!this.active || this.attackCooldown > 0) return;
    this.attack = 0.32;
    this.attackCooldown = 0.62;
    this.audio.cue("strike");
    const forward = new T.Vector3(Math.sin(facing), 0, Math.cos(facing));
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const delta = e.actor.root.position.clone().sub(player);
      delta.y = 0;
      if (delta.length() < 2.9 && delta.normalize().dot(forward) > -0.05) {
        e.hp--;
        e.flash = 0.25;
        e.cooldown = 0.7;
        e.wind = 0;
        const knock = delta.multiplyScalar(0.55);
        e.actor.root.position.add(knock);
        if (e.hp <= 0) e.actor.root.visible = false;
      }
    }
    useGame.setState({
      enemyCount: this.enemies.filter((e) => e.hp > 0).length,
    });
    if (this.enemies.every((e) => e.hp <= 0)) {
      this.active = false;
      ui().update((s) => ({
        ...s,
        sideQuest: { ...s.sideQuest, defeated: true },
      }));
      ui().notify(
        "The grove is quiet again. Mira is waiting.",
        "HOLLOW WARDENS DISPERSED",
      );
      this.audio.cue("reward");
    }
  }
  roll() {
    if (!this.active || this.dodgeCooldown > 0) return;
    this.dodge = 0.42;
    this.dodgeCooldown = 1.05;
    this.audio.cue("dodge");
  }
  update(dt: number, t: number, p: T.Vector3) {
    this.attack = Math.max(0, this.attack - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.dodge = Math.max(0, this.dodge - dt);
    this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    if (!this.active) return;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const pos = e.actor.root.position,
        delta = p.clone().sub(pos);
      delta.y = 0;
      const dist = delta.length();
      e.telegraph.visible = e.wind > 0;
      e.telegraph.scale.setScalar(0.7 + (1 - e.wind / 0.75) * 0.4);
      e.cooldown -= dt;
      e.flash = Math.max(0, e.flash - dt);
      let velocity = { x: 0, y: 0, z: 0 };
      if (e.wind > 0) {
        e.wind -= dt;
        e.actor.pose(0.65, 0.2, 0, 1);
        if (e.wind <= 0 && !e.hit) {
          e.hit = true;
          e.cooldown = 1.6;
          if (dist < 2.35 && this.dodge <= 0) {
            this.health = Math.max(0, this.health - 18);
            useGame.setState({ health: this.health });
            this.audio.cue("hit");
          }
        }
      } else if (dist < 2.05 && e.cooldown <= 0) {
        e.wind = 0.75;
        e.hit = false;
      } else if (dist > 1.65) {
        delta.normalize().multiplyScalar(Math.min(2.2, dist) * dt);
        pos.x += delta.x;
        pos.z += delta.z;
        velocity = { x: delta.x / dt, y: 0, z: delta.z / dt };
      }
      pos.y = ground(pos.x, pos.z);
      e.actor.update(pos, velocity, true, dt, t);
      e.actor.root.rotation.y = Math.atan2(p.x - pos.x, p.z - pos.z);
      if (e.wind > 0) e.actor.pose(0.8, 0.2, 0, 1);
      if (e.flash > 0)
        e.actor.root.scale.setScalar(1.02 + Math.sin(e.flash * 30) * 0.03);
    }
    if (this.health <= 0) {
      this.active = false;
      this.enemies.forEach((e) => (e.actor.root.visible = false));
      ui().notify(
        "A narrow escape. The moonfern is safe. Try again when you’re ready.",
        "ENCOUNTER LOST · RETURNED TO THE TRAIL",
      );
      return "lost";
    }
    if (p.distanceTo(new T.Vector3(-13, p.y, 13)) > 27) {
      this.active = false;
      this.enemies.forEach((e) => (e.actor.root.visible = false));
      ui().notify(
        "You slipped away through the trees.",
        "THE WARDENS REMAIN IN THE GROVE",
      );
    }
  }
  dispose() {
    this.active = false;
    for (const e of this.enemies) {
      e.actor.root.removeFromParent();
      e.actor.visual.traverse((o) => {
        if (o instanceof T.Mesh) {
          if (!Array.isArray(o.material)) o.material.dispose();
        }
      });
    }
    this.enemies = [];
  }
}
