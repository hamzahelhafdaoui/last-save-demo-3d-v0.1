# Input recovery patch — 2026-10-17

The owner reported a joystick that could remain active after lifting the movement thumb. The previous controller only handled terminal pointer events on the joystick/canvas themselves, did not release captures when clearing input, and left listeners attached after runtime disposal. Separately, stopping combat left the dodge timer nonzero; switching out of Living Quest mid-dodge could therefore retain forced forward movement indefinitely.

## Changes

- Track joystick and camera ownership independently. Handle pointer release/cancellation at window capture level; release actual browser captures on reset. Recover mouse drags when movement arrives with the primary button no longer held.
- Reconcile native touch endings as a fallback, matching touch identifiers at contact start rather than treating them as pointer IDs. Releasing either finger leaves the other control working. A held thumb does not expire on a timer.
- Clear held input synchronously when menus/transitions hide controls, when the HUD changes, on blur/background/page exit, and on rotation/resize. Old held contacts cannot reactivate themselves after a menu closes.
- Remove input listeners on runtime disposal and prevent an interrupted initialization from attaching new controls afterward.
- Reset dodge/attack state on combat stop, loss, escape and restart. Stop combat immediately when changing to a different experience mode; clear the character's roll tilt.
- Return from title settings to the title when pressing Escape, rather than bypassing the start flow. Ignore repeated menu hotkeys and gameplay keys in editable fields.
- Clear buffered jumps/ground-contact grace after teleporting. Stop processing a stale gameplay frame after an interaction opens dialogue, starts a transition or starts a cinematic. Reset crossing attempt timing between attempts.
- Provide a **Show controls** button in clean HUD mode, including on touch devices without a keyboard.

## Reproduction and verification

Eight newly added lifecycle/combat cases failed against the previous controller/encounter code, including release outside the control, disable while held, missing mouse release, touch-end fallback and disposal. They pass after the changes. The complete Node suite now contains 30 tests, including real Rapier teleport recovery and the existing save/quest/reward tests.

```sh
npm test
npm run build
npm run preview -- --port 4181
# In another terminal (system Chromium required):
BASE_URL=http://localhost:4181/ node tests/mobile.cjs
BASE_URL=http://localhost:4181/ node tests/control-recovery.cjs
```

`mobile.cjs` uses Chromium CDP native touch input: independent movement/camera, both single-finger release orders, release outside the stick, cancellation, menu interruption with a held contact, rotation, injected focus loss, HUD restoration, repeated starts/releases and touch jump. It asserts the native touch-end active/changed lists so the protocol cannot accidentally test the opposite finger. Viewport: 390 × 844 and 844 × 390.

`control-recovery.cjs` starts a real encounter from a saved checkpoint, pauses in the same event-loop task as beginning a dodge, changes to Story Tour and verifies rest. It also checks keyboard interruption/re-entry, graphics settings and save reload. Both scripts check browser errors and save render screenshots under ignored `test-results/`.

These are emulated Chromium checks with software WebGL, not physical iOS/Safari or Android device certification. Final hosted verification is recorded in `QA.md` and the session handoff.
