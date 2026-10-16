import { radialStick } from "./math.js";
export class Controls {
  keys = new Set<string>();
  move = { x: 0, y: 0, strength: 0 };
  look = { x: 0, y: 0 };
  jump = false;
  interact = false;
  enabled = false;
  sensitivity = 1;
  touch =
    matchMedia("(pointer:coarse)").matches || navigator.maxTouchPoints > 0;
  private stickId: number | null = null;
  private cameraId: number | null = null;
  private cameraPos = { x: 0, y: 0 };
  constructor(canvas: HTMLCanvasElement) {
    const joy = document.querySelector<HTMLElement>("#joystick")!,
      stick = document.querySelector<HTMLElement>("#stick")!;
    document.body.classList.toggle("touch", this.touch);
    const moveStick = (e: PointerEvent) => {
      const r = joy.getBoundingClientRect(),
        x = e.clientX - r.left - r.width / 2,
        y = e.clientY - r.top - r.height / 2,
        rad = r.width * 0.38;
      this.move = radialStick(x, y, rad);
      const l = Math.hypot(x, y),
        c = l > rad ? rad / l : 1;
      stick.style.transform = `translate(${x * c}px,${y * c}px)`;
    };
    joy.addEventListener("pointerdown", (e) => {
      if (!this.enabled || this.stickId !== null) return;
      e.preventDefault();
      this.stickId = e.pointerId;
      joy.setPointerCapture(e.pointerId);
      moveStick(e);
    });
    joy.addEventListener("pointermove", (e) => {
      if (e.pointerId === this.stickId) moveStick(e);
    });
    const endStick = (e: PointerEvent) => {
      if (e.pointerId !== this.stickId) return;
      this.stickId = null;
      this.move = { x: 0, y: 0, strength: 0 };
      stick.style.transform = "";
    };
    joy.addEventListener("pointerup", endStick);
    joy.addEventListener("pointercancel", endStick);
    joy.addEventListener("lostpointercapture", endStick);
    canvas.addEventListener("pointerdown", (e) => {
      if (!this.enabled || this.cameraId !== null) return;
      if (e.pointerType === "touch" && e.clientX < innerWidth * 0.42) return;
      this.cameraId = e.pointerId;
      this.cameraPos = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    canvas.addEventListener("pointermove", (e) => {
      if (e.pointerId !== this.cameraId || !this.enabled) return;
      this.look.x += (e.clientX - this.cameraPos.x) * this.sensitivity;
      this.look.y += (e.clientY - this.cameraPos.y) * this.sensitivity;
      this.cameraPos = { x: e.clientX, y: e.clientY };
      document.querySelector<HTMLElement>("#touch-hint")!.style.opacity = "0";
    });
    const endCamera = (e: PointerEvent) => {
      if (e.pointerId === this.cameraId) this.cameraId = null;
    };
    canvas.addEventListener("pointerup", endCamera);
    canvas.addEventListener("pointercancel", endCamera);
    canvas.addEventListener("lostpointercapture", endCamera);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    document.querySelector("#jump")!.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (this.enabled) this.jump = true;
    });
    document.querySelector("#action")!.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (this.enabled) this.interact = true;
    });
    window.addEventListener("keydown", (e) => {
      if (!this.enabled) return;
      if (["INPUT", "BUTTON"].includes((e.target as HTMLElement).tagName))
        return;
      const k = e.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
          " ",
          "shift",
          "control",
          "e",
        ].includes(k)
      ) {
        e.preventDefault();
        this.keys.add(k);
        if (!e.repeat && k === " ") this.jump = true;
        if (!e.repeat && k === "e") this.interact = true;
      }
    });
    window.addEventListener("keyup", (e) =>
      this.keys.delete(e.key.toLowerCase()),
    );
    window.addEventListener("blur", () => this.clear());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.clear();
    });
  }
  clear() {
    this.keys.clear();
    this.move = { x: 0, y: 0, strength: 0 };
    this.look = { x: 0, y: 0 };
    this.jump = false;
    this.interact = false;
    this.stickId = null;
    this.cameraId = null;
    document.querySelector<HTMLElement>("#stick")!.style.transform = "";
  }
  movement() {
    const k = this.keys,
      x =
        Number(k.has("d") || k.has("arrowright")) -
        Number(k.has("a") || k.has("arrowleft")),
      y =
        Number(k.has("w") || k.has("arrowup")) -
        Number(k.has("s") || k.has("arrowdown"));
    return x || y
      ? { x, y, run: k.has("shift"), strength: 1 }
      : { ...this.move, run: this.move.strength > 0.85 };
  }
  consumeLook() {
    const l = { ...this.look };
    this.look.x = this.look.y = 0;
    return l;
  }
  consumeJump() {
    const j = this.jump;
    this.jump = false;
    return j;
  }
  consumeInteract() {
    const e = this.interact;
    this.interact = false;
    return e;
  }
}
