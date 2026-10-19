# LAST SAVE: AMAN

**Stories carried. Water shared.**

An experimental North African / Amazigh-founded direction for LAST SAVE, building on the working third-person game. This is a separate branch and Vercel project. The original main game is unchanged.

- Source: [experiment/amazigh](https://github.com/hamzahelhafdaoui/last-save-demo-3d-v0.1/tree/experiment/amazigh)
- [Download this experiment's source](https://github.com/hamzahelhafdaoui/last-save-demo-3d-v0.1/archive/refs/heads/experiment/amazigh.zip)
- Vercel project: `last-save-aman` / `prj_mzibNFHjMGhtnE9MEDrQ5bUXmelx`. Published development URL: **https://last-save-aman.vercel.app/**. Verification and remaining limits are recorded in `docs/aman/QA.md`.
- Original game: https://last-save-demo-3d.vercel.app/ — do not replace or deploy over it.

## Playable direction

**Tizi Highlands:** cedar country, stone hillside dwellings, terraced crops, a bridge, communal stores and an original fantasy dawn terrace. Help Itto restore the spring, reopen a caravan passage and reconcile two families' grain records. Choose a witnessed measure or keep disputed cells sealed while using the communal reserve. The game remembers the agreement. Carry those community records to the Dawn Terrace and claim the physical Dawnblade.

**Targa Oasis:** earthen fortified buildings, palms, a shaded weaving courtyard, water-gallery headworks, inspection shafts, garden channels and a shared cistern. Repair the filter, garden leak and sharing gate. Water reaches the gardens; the community gives you a woven mantle and silver clasp.

**Your courtyard:** a warm home with cedar beams, rugs, clay vessels, low seating, a chest, mirror, hearth and basin. Wear the oasis mantle while carrying the highland blade, then bring both stories home. The sword, silver clasp and herbalist's lamp can physically appear in your home.

Kabyle, Rif and Tuareg chapters have **separate regional foundations and remain unavailable**. They are not blended into the first two playable settings. [Cultural sources, naming choices and remaining review](docs/aman/CULTURAL_FOUNDATION.md).

Three inherited modes remain: forgiving Story Tour, timed Adventure, and experimental Living Quest with an herbalist errand and fantasy trail encounters. Begin with Story Tour.

## Run and verify

Node 24, WebGL 2, npm:

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview -- --port 4181
```

Browser regressions (system Chromium, separate terminal):

```sh
BASE_URL=http://localhost:4181/ npm run test:browser
BASE_URL=http://localhost:4181/ npm run test:mobile
```

The AMAN playthrough uses real keyboard/UI interactions and explicit saved checkpoints between sections. It does not represent an uninterrupted human walkthrough. Main-game scripts retained in this branch are historical references unless the AMAN QA record says they were rerun.

WASD/arrows move; Shift sprints; Space jumps; drag looks; wheel zooms; E interacts; I inventory; J journey book; Escape pause; H clean view. Touch uses an independent analog joystick and camera drag. Existing stuck-input recovery is retained. Use **Show controls** to restore a hidden touch HUD.

## Source and save safety

Use `experiment/amazigh` only. `tools/checkpoint.sh 'Message'` checks the branch, tests/builds, commits and pushes only that branch, then writes a source ZIP. Deploy that exact SHA **only** to `last-save-aman`. This project intentionally uses explicit Git-sourced production deployments rather than linking a second project to the repository's default `main` branch. A main-branch push must never accidentally replace the experiment or vice versa.

Do not merge the experiment, change the repository default branch or deploy to the main game's Vercel project. Baseline main SHA: `c193b5d36e360522a804fe0130ff7be3ed0a03f3`.

Browser save key: `last-save.aman.v1`; the original `last-save.investor.v2` is never read or overwritten. The internal versioned schema retains working identity/equipment/quest fields and adds oasis progress and granary decisions. No paid external API, account, backend or cloud save is needed.

## Scope and assets

React / R3F / Three / Rapier / Zustand / GSAP / Howler / TypeScript / Vite. Modular world factories; retained joystick/camera; original GLB fox traveler; new regional procedural architecture, material textures, garments, pottery and original fantasy metalwork. The human cultures inform everyday life and worldbuilding; the fox and magical devices are original fantasy.

All new geometry, textures and textile-style motifs are authored in source; no museum assets or patterns were copied. New synthesized audio sketches are reproducible with `python3 tools/make-aman-audio.py` (numpy + ffmpeg). They are not traditional performances or a finished regional score. Existing asset licenses remain in `docs/ART_AND_LICENSES.md`.

This is a playable direction study, not a finished cultural reconstruction, final art pass or complete full game. No claim of community consultation, native-speaker localization, physical mobile certification or 60 FPS is made. See [cultural foundations](docs/aman/CULTURAL_FOUNDATION.md) and [session status](docs/SESSION_STATE.md).
