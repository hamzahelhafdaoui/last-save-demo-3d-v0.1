import { radialStick } from "./math.js";

type PointerOwner = {
  id: number;
  type: string;
  startX: number;
  startY: number;
  touchId: number | null;
};

export class Controls {
  keys = new Set<string>();
  move = { x: 0, y: 0, strength: 0 };
  look = { x: 0, y: 0 };
  jump = false;
  interact = false;
  sensitivity = 1;
  touch =
    matchMedia("(pointer:coarse)").matches || navigator.maxTouchPoints > 0;
  private active = false;
  private disposed = false;
  private listeners = new AbortController();
  private stickPointer: PointerOwner | null = null;
  private cameraPointer: PointerOwner | null = null;
  private cameraPos = { x: 0, y: 0 };
  private joy: HTMLElement;
  private stick: HTMLElement;

  get enabled() {
    return this.active;
  }
  set enabled(value: boolean) {
    if (!value && this.active) this.clear();
    this.active = value && !this.disposed;
  }

  constructor(private canvas: HTMLCanvasElement) {
    this.joy = document.querySelector<HTMLElement>("#joystick")!;
    this.stick = document.querySelector<HTMLElement>("#stick")!;
    document.body.classList.toggle("touch", this.touch);
    const options = { signal: this.listeners.signal };
    const captured = { ...options, capture: true };
    const owner = (e: PointerEvent): PointerOwner => ({
      id: e.pointerId,
      type: e.pointerType,
      startX: e.clientX,
      startY: e.clientY,
      touchId: null,
    });
    this.joy.addEventListener(
      "pointerdown",
      (e) => {
        if (
          !this.enabled ||
          this.stickPointer ||
          (e.pointerType === "mouse" && e.button !== 0)
        )
          return;
        e.preventDefault();
        this.stickPointer = owner(e);
        this.capture(this.joy, e.pointerId);
        this.moveStick(e);
      },
      options,
    );
    canvas.addEventListener(
      "pointerdown",
      (e) => {
        if (
          !this.enabled ||
          this.cameraPointer ||
          (e.pointerType === "mouse" && e.button !== 0)
        )
          return;
        if (e.pointerType === "touch" && e.clientX < innerWidth * 0.42) return;
        this.cameraPointer = owner(e);
        this.cameraPos = { x: e.clientX, y: e.clientY };
        this.capture(canvas, e.pointerId);
        e.preventDefault();
      },
      options,
    );

    // Window capture also receives releases outside the control, even if a
    // browser overlay/capture interruption changes the original event target.
    window.addEventListener(
      "pointermove",
      (e) => {
        if (!this.enabled) return;
        if (e.pointerType === "mouse" && !(e.buttons & 1)) {
          this.endPointer(e);
          return;
        }
        if (e.pointerId === this.stickPointer?.id) this.moveStick(e);
        if (e.pointerId === this.cameraPointer?.id) {
          this.look.x += (e.clientX - this.cameraPos.x) * this.sensitivity;
          this.look.y += (e.clientY - this.cameraPos.y) * this.sensitivity;
          this.cameraPos = { x: e.clientX, y: e.clientY };
          document.querySelector<HTMLElement>("#touch-hint")!.style.opacity =
            "0";
        }
      },
      captured,
    );
    for (const type of ["pointerup", "pointercancel"] as const)
      window.addEventListener(type, (e) => this.endPointer(e), captured);
    this.joy.addEventListener(
      "lostpointercapture",
      (e) => {
        if (e.pointerId === this.stickPointer?.id) this.endStick();
      },
      options,
    );
    canvas.addEventListener(
      "lostpointercapture",
      (e) => {
        if (e.pointerId === this.cameraPointer?.id) this.endCamera();
      },
      options,
    );

    // Touch.identifier and PointerEvent.pointerId are different namespaces.
    // Match at contact start, then reconcile each finger separately if a browser
    // delivers touchend/touchcancel without the corresponding pointer ending.
    window.addEventListener(
      "touchstart",
      (e) => {
        for (const t of Array.from(e.changedTouches)) {
          const p = [this.stickPointer, this.cameraPointer].find(
            (p) =>
              p?.type === "touch" &&
              p.touchId === null &&
              Math.hypot(p.startX - t.clientX, p.startY - t.clientY) < 2,
          );
          if (p) p.touchId = t.identifier;
        }
      },
      { ...captured, passive: true },
    );
    const reconcileTouches = (e: TouchEvent) => {
      const ids = new Set(Array.from(e.touches, (t) => t.identifier));
      const ended = (p: PointerOwner | null) =>
        p?.type === "touch" &&
        (ids.size === 0 || (p.touchId !== null && !ids.has(p.touchId)));
      if (ended(this.stickPointer)) this.endStick();
      if (ended(this.cameraPointer)) this.endCamera();
    };
    window.addEventListener("touchend", reconcileTouches, {
      ...captured,
      passive: true,
    });
    window.addEventListener("touchcancel", reconcileTouches, {
      ...captured,
      passive: true,
    });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault(), options);
    document.querySelector("#jump")!.addEventListener(
      "pointerdown",
      (e) => {
        e.preventDefault();
        if (this.enabled) this.jump = true;
      },
      options,
    );
    document.querySelector("#action")!.addEventListener(
      "pointerdown",
      (e) => {
        e.preventDefault();
        if (this.enabled) this.interact = true;
      },
      options,
    );
    window.addEventListener(
      "keydown",
      (e) => {
        if (!this.enabled) return;
        const target = e.target as HTMLElement;
        if (
          ["INPUT", "BUTTON", "SELECT", "TEXTAREA"].includes(target.tagName) ||
          target.isContentEditable
        )
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
      },
      options,
    );
    window.addEventListener(
      "keyup",
      (e) => this.keys.delete(e.key.toLowerCase()),
      options,
    );
    for (const type of ["blur", "pagehide", "orientationchange", "resize"])
      window.addEventListener(type, () => this.clear(), options);
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) this.clear();
      },
      options,
    );
  }
  private capture(element: HTMLElement, id: number) {
    try {
      element.setPointerCapture(id);
    } catch {
      // Global pointer handlers still work if capture became unavailable.
    }
  }
  private release(element: HTMLElement, id: number | undefined) {
    if (id === undefined) return;
    try {
      if (element.hasPointerCapture(id)) element.releasePointerCapture(id);
    } catch {
      /* The browser may already have canceled this pointer. */
    }
  }
  private endStick() {
    const id = this.stickPointer?.id;
    this.stickPointer = null;
    this.move = { x: 0, y: 0, strength: 0 };
    this.stick.style.transform = "";
    this.release(this.joy, id);
  }
  private endCamera() {
    const id = this.cameraPointer?.id;
    this.cameraPointer = null;
    this.release(this.canvas, id);
  }
  private endPointer(e: PointerEvent) {
    if (e.pointerId === this.stickPointer?.id) this.endStick();
    if (e.pointerId === this.cameraPointer?.id) this.endCamera();
  }
  private moveStick(e: PointerEvent) {
    const r = this.joy.getBoundingClientRect(),
      x = e.clientX - r.left - r.width / 2,
      y = e.clientY - r.top - r.height / 2,
      rad = r.width * 0.38;
    if (rad <= 0) {
      this.endStick();
      return;
    }
    this.move = radialStick(x, y, rad);
    const l = Math.hypot(x, y),
      c = l > rad ? rad / l : 1;
    this.stick.style.transform = `translate(${x * c}px,${y * c}px)`;
  }
  clear() {
    this.endStick();
    this.endCamera();
    this.keys.clear();
    this.look = { x: 0, y: 0 };
    this.jump = false;
    this.interact = false;
  }
  dispose() {
    this.enabled = false;
    this.clear();
    this.disposed = true;
    this.listeners.abort();
  }
  movement() {
    if (!this.enabled) return { x: 0, y: 0, strength: 0, run: false };
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
