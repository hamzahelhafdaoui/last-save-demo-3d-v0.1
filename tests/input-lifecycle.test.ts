import { test } from "node:test";
import assert from "node:assert/strict";
import { Controls } from "../src/input/controls";

// Exercise the controller's real event handlers without requiring a WebGL scene.
class ElementStub extends EventTarget {
  style = { transform: "", opacity: "" };
  captures = new Set<number>();
  tagName = "DIV";
  isContentEditable = false;
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 120, height: 120 };
  }
  setPointerCapture(id: number) {
    this.captures.add(id);
  }
  hasPointerCapture(id: number) {
    return this.captures.has(id);
  }
  releasePointerCapture(id: number) {
    this.captures.delete(id);
  }
  closest() {
    return null;
  }
}
function event(target: EventTarget, type: string, props = {}) {
  const e = new Event(type, { cancelable: true });
  Object.assign(e, props);
  target.dispatchEvent(e);
}
function fixture() {
  const win = new EventTarget(),
    doc = new EventTarget();
  const nodes = Object.fromEntries(
    ["#joystick", "#stick", "#jump", "#action", "#touch-hint"].map((id) => [
      id,
      new ElementStub(),
    ]),
  );
  Object.assign(doc, {
    hidden: false,
    body: { classList: { toggle() {} } },
    querySelector: (id: string) => nodes[id],
  });
  Object.assign(globalThis, {
    window: win,
    document: doc,
    matchMedia: () => ({ matches: true }),
    innerWidth: 390,
  });
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { maxTouchPoints: 5 },
  });
  const canvas = new ElementStub();
  const c = new Controls(canvas as unknown as HTMLCanvasElement);
  c.enabled = true;
  const pointer = (target: EventTarget, type: string, id = 1, props = {}) =>
    event(target, type, {
      pointerId: id,
      pointerType: "touch",
      button: 0,
      buttons: 1,
      clientX: 60,
      clientY: 10,
      ...props,
    });
  return { win, doc, nodes, canvas, c, pointer };
}

test("a release delivered outside the joystick stops movement and frees capture", () => {
  const { c, win, nodes, pointer } = fixture();
  pointer(nodes["#joystick"], "pointerdown");
  assert(c.movement().strength > 0);
  pointer(win, "pointerup");
  assert.equal(c.movement().strength, 0);
  assert.equal(nodes["#stick"].style.transform, "");
  assert.equal(nodes["#joystick"].captures.size, 0);
});
test("camera release does not stop a held joystick; joystick release leaves camera usable", () => {
  const { c, win, canvas, nodes, pointer } = fixture();
  pointer(nodes["#joystick"], "pointerdown", 1);
  pointer(canvas, "pointerdown", 2, { clientX: 300 });
  pointer(win, "pointerup", 2);
  assert(c.movement().strength > 0);
  pointer(canvas, "pointerdown", 3, { clientX: 300 });
  pointer(win, "pointerup", 1);
  pointer(win, "pointermove", 3, { clientX: 320 });
  assert.equal(c.movement().strength, 0);
  assert.equal(c.consumeLook().x, 20);
});
test("capture loss, browser cancellation, blur, page exit and rotation all release the stick", () => {
  for (const type of [
    "lostpointercapture",
    "pointercancel",
    "blur",
    "pagehide",
    "orientationchange",
  ]) {
    const { c, win, nodes, pointer } = fixture();
    pointer(nodes["#joystick"], "pointerdown");
    pointer(type === "lostpointercapture" ? nodes["#joystick"] : win, type);
    assert.equal(c.movement().strength, 0, type);
    pointer(nodes["#joystick"], "pointerdown", 2);
    assert(c.movement().strength > 0, "a new touch must work after " + type);
  }
});
test("disabling controls clears held keys, touch capture and queued actions immediately", () => {
  const { c, win, nodes, pointer } = fixture();
  pointer(nodes["#joystick"], "pointerdown");
  event(win, "keydown", { key: "w", repeat: false });
  pointer(nodes["#jump"], "pointerdown", 2);
  c.enabled = false;
  pointer(nodes["#joystick"], "pointermove");
  assert.equal(c.movement().strength, 0);
  assert.equal(c.keys.size, 0);
  assert.equal(c.consumeJump(), false);
  assert.equal(nodes["#joystick"].captures.size, 0);
  c.enabled = true;
  assert.equal(c.movement().strength, 0);
});
test("mouse release missed by the page is recovered on an unpressed move", () => {
  const { c, win, nodes, pointer } = fixture();
  pointer(nodes["#joystick"], "pointerdown", 1, { pointerType: "mouse" });
  pointer(win, "pointermove", 1, { pointerType: "mouse", buttons: 0 });
  assert.equal(c.movement().strength, 0);
});
test("touchend fallback matches touch identifiers independently of pointer IDs", () => {
  const { c, win, canvas, nodes, pointer } = fixture();
  pointer(nodes["#joystick"], "pointerdown", 101);
  event(win, "touchstart", {
    changedTouches: [{ identifier: 7, clientX: 60, clientY: 10 }],
  });
  pointer(canvas, "pointerdown", 102, { clientX: 300 });
  event(win, "touchstart", {
    changedTouches: [{ identifier: 9, clientX: 300, clientY: 10 }],
  });
  event(win, "touchend", { touches: [{ identifier: 9 }] });
  assert.equal(c.movement().strength, 0);
  pointer(win, "pointermove", 102, { clientX: 320 });
  assert.equal(c.consumeLook().x, 20);
});
test("disposing controls removes old event handlers and releases captures", () => {
  const { c, win, nodes, pointer } = fixture();
  pointer(nodes["#joystick"], "pointerdown");
  c.dispose();
  c.enabled = true;
  pointer(nodes["#joystick"], "pointerdown", 2);
  event(win, "keydown", { key: "w", repeat: false });
  assert.equal(c.movement().strength, 0);
  assert.equal(c.keys.size, 0);
  assert.equal(nodes["#joystick"].captures.size, 0);
});
test("capture failure still allows global release and a stationary held thumb never times out", () => {
  const { c, win, nodes, pointer } = fixture();
  nodes["#joystick"].setPointerCapture = () => {
    throw new Error("pointer canceled before capture");
  };
  pointer(nodes["#joystick"], "pointerdown");
  for (let i = 0; i < 600; i++) assert.equal(c.movement().strength, 1);
  pointer(win, "pointerup");
  assert.equal(c.movement().strength, 0);
});
test("backgrounding clears keyboard and joystick state, including queued interactions", () => {
  const { c, doc, win, nodes, pointer } = fixture();
  pointer(nodes["#joystick"], "pointerdown");
  event(win, "keydown", { key: "w", repeat: false });
  pointer(nodes["#action"], "pointerdown", 2);
  Object.assign(doc, { hidden: true });
  event(doc, "visibilitychange");
  assert.equal(c.movement().strength, 0);
  assert.equal(c.keys.size, 0);
  assert.equal(c.consumeInteract(), false);
  Object.assign(doc, { hidden: false });
  event(doc, "visibilitychange");
  pointer(win, "pointermove");
  assert.equal(
    c.movement().strength,
    0,
    "the original held touch must remain canceled",
  );
});
