# Verification — development checkpoint, 2026-10-16

## Input recovery patch, 2026-10-17

- 30 system tests pass, including newly reproduced control lifecycle failures, combat shutdown during a dodge and Rapier teleport/jump-state recovery. TypeScript/Vite production build passes.
- The production build passed expanded native Chromium touch checks at portrait/landscape sizes: independent move/look, either finger released first, release outside the stick, cancellation, pause while held, old contact remaining canceled after resume, rotation, injected blur, HUD restoration, repeated starts/releases and touch jump. Screenshots inspected; no runtime browser errors.
- Desktop production-build checks passed switching from Living Quest to Story Tour while a dodge was suspended in pause; the player remains stationary. Keyboard/inventory interruption, fresh movement, graphics changes retaining the active world and save reload passed with no browser errors.
- The same mobile and desktop regression scripts also passed against **https://last-save-demo-3d.vercel.app/**, followed by the hosted city/equipment/inventory → home portal → reload smoke test, all with clean browser error lists. GitHub Actions passed tests/build for gameplay patch `7a738e649e5bd969febbb226b33b002b2cabf705`; Vercel deployment `dpl_9PhHmpwnQ8y5ZLV3ta1AEMiUJkQX` is READY for that SHA and the public alias served the expected `/assets/index-dyrazcO_.js` build. Later documentation-only commits preserve those gameplay assets.
- See [patch details and reproduction](INPUT_FIXES.md). Physical mobile/Safari testing remains open. The regression runs use saved checkpoints and do not replace a continuous fresh-save story playthrough.

## Completed evidence

- 19 Node tests pass: radial analog controls and bounded camera-relative movement; Rapier ground/collision/jump/camera raycast, camera-only portal blockers and bridge-safe restoration; save validation and round-trip persistence; quest gates and unique rewards; authored extraction phases; melee facing/range/cooldowns, enemy wind-up/dodge damage avoidance; unique healer reward.
- TypeScript and Vite production builds pass. GitHub Actions has independently passed tests/build on the pushed revisions.
- Git-connected Vercel production builds from main verified, with matching commit SHAs. Public production root returns HTTP200 and the game's title. This is not an expiring share URL.
- Chromium + SwiftShader browser checks exercised actual home movement, the home→Lumenreach portal, the full river bridge crossing, Edda acceptance, all three flowers and forest reward, archive reconstruction, guardian runes, extraction entry/skip, equipment, city portal/identity/jacket, return-home portal, physical sword display, closing sequence, inventory and browser reload. The final run completed with a clean page-error/console-error list.
- Separate Chromium run completed the entire 36-second sword timeline, captured 6/12/20/24/30-second frames and reached the unique item reveal. The revised hand-to-hilt, camera, material-lighting and particle treatment was subsequently rendered and the complete timeline reached the unique reveal again. The sequence advances on visible elapsed time independently of the capped physics step.

The main browser playthrough uses explicit localStorage checkpoints between the forest/archive/sanctuary sections, and pre-completes crossing flags in that particular script. It is not a continuous fresh-save manual playthrough. `tests/crossing.cjs` separately exercises the physical rune route. Do not describe checkpoint-based automation as an uninterrupted human walkthrough.

- The separate Story Tour crossing script passed actual traversal of all three physical rune stones and courage collection.
- Real two-pointer touch emulation passed independent joystick movement and camera orbit, release-to-stop and mobile menu bounds. Physical-device testing is still outstanding.
- Recovery browser checks passed reload during extraction, safe pre-claim restoration, unique earned cinematic replay, fresh-demo reset, name/preset editing, and missing-GLB fallback without a broken title/play state.

## Still open

- The final premium art/animation gate remains open; functional cinematic playback and screenshots are not the same as finished presentation quality.
- Living Quest browser checks passed healer acceptance, herb pickup, the live three-enemy ambush, strike/dodge input, loss recovery with retained herbs, and a unique keepsake reward on delivery. A full victory/escape playthrough, obstacle navigation, difficulty balancing and physical-device validation remain open. The mode stays labeled experimental.
- Physical mobile devices remain untested; touch emulation is covered as described above.
- Safari, Firefox, native desktop GPUs, gamepads, actual speaker/headphone output and real FPS/memory profiles remain untested.
- No claim of 60 FPS is made. Software WebGL rendering in this environment is slow and is not representative of hardware GPU performance.
- A continuous owner/human playthrough and a timed 8–15 minute presentation remain required.

## Known presentation limitations

The original procedural art and articulated character are provisional. Several environments still expose simple geometric forms and limited surface detail. NPC animation/behavior is basic. Character grip and extraction use a procedural reach rig rather than reviewed production animation. Limb extension, feet, clipping, secondary motion, expressions and shot framing need an animation pass. The guardian is a symbolic memory construct, not a combat boss. The home/sky opening is an authored camera path with a roof cutaway. City floor response is a stylized material/lighting treatment, not full scene reflections. Synthesized music is an original sketch rather than a finished orchestral score. No spoken dialogue is included.

Living Quest enemy navigation follows a simple local pursuit model and needs obstacle navigation. Combat currently has proximity-based melee with a facing arc, telegraphed attacks, health and dodge invulnerability; it is not a finished combat system.

## Technical limitations

- Initial JS bundle is about 5.7 MB uncompressed / 2.1 MB gzip, mainly Three/R3F and embedded Rapier WASM. Original GLB is ~0.5 MB. Environments are lazy-loaded and old world scenes/physics are released on transitions.
- Save data is local to this browser and origin. No account/cloud synchronization exists. Export progress before changing devices or clearing storage. Earlier prototypes use separate keys and have not been migrated.
- Scene assets are still largely generated in code. The editable character and audio authoring scripts are included. Additional reviewed GLB/environment/animation assets are future work.
- No multiplayer, accounts, backend, licensed franchises or full-game months-long progression is implemented.

Repro scripts live under `tests/`. Capture representative render screenshots as well as checking DOM state. Always verify the actual deployed build after a production push.
