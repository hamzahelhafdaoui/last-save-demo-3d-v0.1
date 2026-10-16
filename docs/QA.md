# Verification — development checkpoint, 2026-10-16

## Completed evidence

- 16 Node tests pass: radial analog controls and bounded camera-relative movement; Rapier ground/collision/jump/camera raycast; save validation and round-trip persistence; quest gates and unique rewards; authored extraction phases; melee facing/range/cooldowns, enemy wind-up/dodge damage avoidance; unique healer reward.
- TypeScript and Vite production builds pass. GitHub Actions has independently passed tests/build on the pushed revisions.
- Git-connected Vercel production builds from main verified, with matching commit SHAs. Public production root returns HTTP200 and the game's title. This is not an expiring share URL.
- Chromium + SwiftShader browser checks exercised actual home movement, the home→Lumenreach portal, the full river bridge crossing, Edda acceptance, all three flowers and forest reward, archive reconstruction, guardian runes, extraction entry/skip, equipment, city portal/identity/jacket, return-home portal, physical sword display, closing sequence, inventory and browser reload. The final run completed with a clean page-error/console-error list.
- Separate Chromium run completed the entire 36-second sword timeline, captured 6/12/20/24/30-second frames and reached the unique item reveal. Visual review led to subsequent hand-to-hilt, camera, material-lighting and particle refinements; those are being rechecked.

The main browser playthrough uses explicit localStorage checkpoints between the forest/archive/sanctuary sections, and pre-completes crossing flags in that particular script. It is not a continuous fresh-save manual playthrough. `tests/crossing.cjs` separately exercises the physical rune route. Do not describe checkpoint-based automation as an uninterrupted human walkthrough.

## Still open

- Final revised cinematic visual review and the physical crossing-specific run are in progress at this checkpoint; see session state for later results.
- Living Quest ambush, loss/retry, player strikes/dodges, escape, delivery and home lantern need full browser/device validation and balancing. System tests cover the rules, not the entire player experience. The mode is labeled experimental.
- Touch emulation and mobile menu/camera/input regression after the React conversion are pending; physical devices remain untested.
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
