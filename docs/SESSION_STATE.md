# LAST SAVE handoff — 2026-10-17

## Latest patch: stuck joystick/input recovery

Version `0.1.0-dev.2` repairs missed touch endings, clears browser captures/held controls on interruptions and removes disposed control listeners. Joystick/camera fingers remain independent. Leaving combat during a dodge now clears forced movement; title-settings Escape, teleport jump state, stale interaction frames and mobile clean-HUD recovery are also fixed. See [details](INPUT_FIXES.md).

30 Node tests, TypeScript/Vite build, expanded native Chromium touch tests and desktop combat/input recovery passed locally against a frozen production build, then both browser scripts passed against **https://last-save-demo-3d.vercel.app/**. Real touch-jump and post-interruption recovery passed. The hosted city/equipment/inventory → home portal → reload test also passed; all three hosted runs had clean browser error lists. Screenshots reviewed. Physical devices and Safari remain untested.

Gameplay patch `7a738e649e5bd969febbb226b33b002b2cabf705` is pushed to `main`; GitHub Actions passed. Vercel production `dpl_9PhHmpwnQ8y5ZLV3ta1AEMiUJkQX` is READY with that exact SHA and the permanent public alias. Expected gameplay JS: `/assets/index-dyrazcO_.js`. Subsequent documentation-only commits retain those assets. Source checkpoint tag: `v0.1.0-dev.2`. Use the main-branch ZIP or tagged ZIP from GitHub to retrieve the source independently of this workspace.

## User intent and quality bar

Build on the original 3D study, refine it and turn it into a real connected game. The owner treats this as a long-term project, expects many sessions and wants exceptional quality rather than an inflated completion claim. Do not call this finished, AAA, investor-ready or months of content. The full game must remain separate and should not be implemented before the demo reaches a stable, presentable gate.

The three requested modes are now present: Story Tour, Adventure and experimental Living Quest. The latter adds Mira's traveling herb errand, a reactive Hollow Warden encounter, attacks/dodges and a lantern keepsake for home. Keep improving those in place.

## Source and deployment

- Repository: https://github.com/hamzahelhafdaoui/last-save-demo-3d-v0.1
- Branch: `main`. The user explicitly approved public visibility after the initial AI-generated prompt requested privacy.
- Stable production: https://last-save-demo-3d.vercel.app
- Vercel project: `last-save-demo-3d`, ID `prj_3Tc1iIb3e7RvnPTcVLIzrPu4jC3M`
- Team: `team_d4BewpL5N0r6VeQQlyUhOjxt`
- Automatic production builds from GitHub main verified, with matching commit SHAs and public browser tests. GitHub Actions also runs tests/build.
- Runtime checkpoint `df3bfa2` contains the complete connected story, mode/quest systems, refined cinematic, safe surface restore, deployment-resilient module warmup and recovery handling. Later final commits add QA records and the mounted-sword replay invariant.
- Local source ZIP: `/workspace/deliverables/last-save-demo-3d-source.zip`; regenerate with `git archive` after the final commit. GitHub also provides a main-branch source ZIP independently of this workspace/session.
- Commit and push every working milestone and before ending a session. See root `AGENTS.md` and `tools/checkpoint.sh`. Never let an ephemeral workspace be the only copy of completed work. Do not promise work continues after chat ends.

Previous projects `/workspace/last-save-demo` (original prototype/study) and `/workspace/last-save` (full-game preproduction) remain untouched by this build. Their older Vercel projects are separate.

## Implemented runtime

React/R3F/Drei host; retained Three/Rapier controller and analog joystick; independent camera drag; original GLB traveler with appearance presets and editable colors; wardrobe; versioned Zustand/localStorage identity, inventory, clothing, equipment, quest, decoration and per-world position state. Original Howler/Web Audio music sketches and effects. Settings, demo reset/replay/export/HUD controls and recoverable asset/context errors.

Playable story: home → Lumenreach/Bellhaven/Edda → moonflowers/creature → physical rune crossing → ordered archive memory → sanctuary guardian → physical 36-second Dawnwake extraction/sunrise/item reveal → Velvet City/Sable/jacket → home display/ending/reload. All environments are original procedural development art. Small world-factory modules are warmed at boot for deployment continuity; only the active scene/physics is instantiated.

## Verification completed

- 19 system tests, TypeScript build and Vite production output.
- Real browser controls: home portal, river bridge, Edda, flowers/echo, archive, guardian, sword entry/skip/reward/equipment, city identity/sword/jacket, home portal/display/ending and reload. The test uses saved checkpoints between isolated sections; do not call it an uninterrupted human run.
- Separate physical Story Tour crossing: all three stones and courage reward.
- Complete authored extraction timeline to the unique reveal; screenshots reviewed. Hand contact, pedestal size, silver material lighting, portal camera blockers and particle sprites were refined after observed defects. Cinematic time advances independently of the physics dt cap and pauses with browser visibility.
- Independent two-pointer touch movement + camera, release-to-stop, menu bounds.
- Reload during extraction safely returns pre-claim; earned replay does not duplicate reward; fresh reset and name/preset edits; missing GLB produces the recovery overlay.
- Living Quest: healer acceptance, herbs, actual three-enemy ambush, attack/dodge input, loss recovery retaining herbs, unique delivery reward.
- Actual public Vercel browser run: GLB/world loading, customized character with sword and jacket, inventory, city→home portal and reload, clean runtime console.

See `docs/QA.md` for scope/limits, `docs/screenshots/` for representative render evidence and the scripts under `tests/` for reproduction.

## Bugs fixed in this session

Blocked sanctuary approach; portal obscuring the follow camera; hands missing the hilt; separated finger transforms during reach; oversized pedestal clipping; overbright image-based lighting; square particle sprites; bridge-position restore below the deck; initial asset failure becoming an invalid title state; replay accidentally equipping a sword already mounted at home; fresh reset keeping old positions; unversioned assets cached immutably; cinematics slowing with the capped simulation delta.

## Next work

1. Owner continuous playthrough on native hardware, clear navigation and fair retries. Test Adventure's full timed route and Living Quest victory/escape, then tune combat and enemy obstacle navigation.
2. Proper character/animation art pass and shot-by-shot Dawnwake review. Current articulated procedural reach is functional, provisional and may show stretching/limited foot placement.
3. Art-direct and replace simple environment forms/materials, prioritize Lumenreach/Bellhaven and home. Review city density and reflections; add better NPC identities/ambient activity.
4. Compose/license final audio; physical devices/Safari/Firefox, real GPU FPS/memory, scalable budgets, gamepad/accessibility.
5. Save import and future persistence migration. Current saves are local to this browser/origin; no cloud/account system exists.

Do not broaden into multiplayer/backend/creator infrastructure yet. Keep the premium presentation gate open; consult `docs/ROADMAP.md` and `docs/ART_AND_LICENSES.md`.
