# LAST SAVE — 3D investor demo, v0.1 development

**One character. Every world. Your story continues.**

Playable development build: **https://last-save-demo-3d.vercel.app**

Editable source: **https://github.com/hamzahelhafdaoui/last-save-demo-3d-v0.1**

[Download all committed source as ZIP](https://github.com/hamzahelhafdaoui/last-save-demo-3d-v0.1/archive/refs/heads/main.zip)

This project builds directly on the earlier Last Save third-person movement study. It preserves its Rapier capsule, analog joystick, independent orbit camera and original Blender character while adding an actual connected adventure. The previous prototype and future full-game preproduction remain separate repositories/workspaces.

**Status: an early playable development checkpoint.** The connected story systems exist; art, animation, sound, combat balance and device performance still need substantial work to reach the requested premium investor standard. See [verification and limitations](docs/QA.md), [art provenance](docs/ART_AND_LICENSES.md) and [next priorities](docs/ROADMAP.md). Do not present this as a finished full game or a completed premium-quality vertical slice.

## Run locally

Use Node.js 24 (or a compatible modern Node version accepted by Vite 8).

```sh
npm ci
npm run dev
```

Open the printed local URL. WebGL 2 is required. The first interaction unlocks audio in the browser. All game assets, fonts and music are served locally; no paid API, account, backend or database is required.

```sh
npm test
npm run build
npm run preview
```

The production output is `dist/`.

## Experience

- **Story tour**: forgiving core adventure, with assisted connecting surfaces at the crossing.
- **Adventure**: the same route with jumping gaps, a timed crossing, and failure/retry.
- **Living quest**: an experimental traveling healer errand, reactive Hollow Warden encounter, strikes/dodges and a home lantern keepsake. Combat remains a prototype.

The core route connects a customizable original character, the Wayfarer's Room, Edda's three-echo adventure in Lumenreach, Crownstone's guardian and physical Dawnwake extraction, Velvet City and its jacket, then the player's permanent home display. Save data persists across worlds and reloads on this device. The third home portal is explicitly unavailable.

See [walkthrough and controls](docs/INVESTOR_WALKTHROUGH.md).

## Controls

WASD/arrows move; Shift sprints; Ctrl walks slowly; Space jumps; drag orbits the camera; wheel zooms; E interacts; I opens inventory; J opens journal; Escape opens the menu; H toggles HUD. Living Quest: F strikes, Q dodges. Touch uses an actual independent left analog joystick and right camera drag, plus jump/action controls.

Lift the movement thumb to stop; the camera finger operates independently. Opening a menu, backgrounding the page or rotating the device releases held controls; touch the joystick again to move. In clean HUD mode, tap **Show controls** to restore the touch interface.

Menu → Investor Demo Mode includes opening replay, earned sword-cinematic replay, clean HUD mode, fresh-demo reset, entrance recovery and progress export.

## Architecture

- React / React Three Fiber / Drei: application shell, scene host and item-view interaction.
- Three.js: scene construction, materials, effects, character presentation and cinematic cameras.
- Rapier: fixed-step collision and kinematic character control, retained from the original study for continuity.
- Zustand: serializable gameplay and UI state.
- GSAP: a sampled, deterministic cinematic timeline, advanced only while the game is visible.
- Howler + Web Audio: original music loops and synthesized effects.
- TypeScript / Vite: development and production builds.
- GLB: original articulated traveler, with editable Blender authoring source.

```text
src/state/       Versioned save model, validation, quest actions, Zustand store
src/game/        Runtime coordination, audio, cinematics, experimental encounter
src/physics/     Rapier capsule, terrain, collision surfaces, camera raycasts
src/input/       Keyboard, analog touch and independent camera input
src/render/      Character, camera, reusable geometry, materials, batching, effects
src/worlds/      Lazy-loaded home, Lumenreach and Velvet City
src/ui/          React HUD, dialogue, wardrobe, inventory, journal, demo controls
public/          Original character, original music, locally licensed fonts
docs/            Handoff, QA evidence, art records and improvement priorities
```

Save key: `last-save.investor.v2`. Missing, invalid or wrong-version data starts safely. Appearance, mode, quest flags, inventory, equipment, decorations and per-world positions are validated. Unique rewards cannot be duplicated by repeating interactions. Earlier 2D/study saves are preserved under their original keys.

## Browser verification

```sh
BASE_URL=http://localhost:4173/ CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
BASE_URL=http://localhost:4173/ node tests/cinematic.cjs
BASE_URL=http://localhost:4173/ node tests/crossing.cjs
BASE_URL=http://localhost:4173/ node tests/mobile.cjs
BASE_URL=http://localhost:4173/ node tests/control-recovery.cjs
```

Use a stable production build/server, not Vite HMR, during long tests. Browser tests use real movement/interaction controls plus explicitly documented saved checkpoints between isolated sections. They do not constitute a continuous human playthrough or physical-device performance certification. `?debug` exposes **read-only** diagnostics; no reward/teleport mutation shortcuts are shipped.

## Source preservation and hosting

GitHub `main` is connected to the dedicated `last-save-demo-3d` Vercel project. Automatic production deployments from pushes have been verified. The production alias has no expiring share token. Vercel project/team IDs and continuity requirements are in [AGENTS.md](AGENTS.md).

Commit and push every working milestone. `tools/checkpoint.sh 'Describe the checkpoint'` runs system tests/build, commits changes, pushes main and writes a local source ZIP. Verify the resulting remote deployment SHA and public game afterward. GitHub Actions independently checks tests and builds.

[Session handoff](docs/SESSION_STATE.md) records the last verified checkpoint and work remaining. No autonomous development or monitoring is promised after a chat session ends.
