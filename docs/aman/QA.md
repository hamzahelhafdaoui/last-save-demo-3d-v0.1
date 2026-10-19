# AMAN verification — 2026-10-19

## Local production build

- 36 system tests pass, including separate save namespace, water-repair gating, unique mantle/clasp rewards, both remembered granary choices, progress guidance, validation, actual Rapier walkovers and all retained input/physics/save/quest invariants. TypeScript/Vite production build passes.
- Chromium with software WebGL rendered the courtyard, highland village and oasis. Representative screenshots were inspected. Rendering tests use low graphics quality; they are not a native GPU performance certification.
- Fresh intro/skip, character creation, real movement through the courtyard portal, a physical crossing of the main river bridge and Itto's quest acceptance passed.
- Three actual intake interactions restored the spring, changed visible water and granted one community record.
- The caravan passage passed physical movement across its approach and all three marked decks. Initial playtests caught a blocking helper edge; a continuous ramp/level approach replaced it, and pads/collisions now match mechanism state.
- Delivery measure, family seals and reserve evidence passed; the actual alternate dialogue button recorded the sealed-stores/shared-reserve agreement and the journey book retained it. The witnessed-release solution also passes the state tests. A house was moved away from an evidence point.
- The Dawn Terrace approach and offering locations passed actual Rapier movement after replacing a blocking front edge. Browser checks passed the three offerings, the full physical sword-extraction timeline, item reveal and equipped weapon. Screenshots reviewed; animation remains provisional.
- A real Atlas→oasis portal retained name/appearance/sword. The channel-keeper conversation, all three actual repairs, visible restored water, mantle/clasp reward and wearing the mantle with the sword passed.
- Real return-home portal, physical sword display, ending/control return and browser reload passed, retaining the granary agreement, restored oasis and mantle. A sentinel under the main game's save key remained unchanged. Browser error lists were clean.

The browser tests use explicitly seeded checkpoints between distant sections. The fresh start/spring, revised passage/granary, and revised sanctuary→oasis→home were tested in successive runs after fixing observed collisions. This is not represented as one uninterrupted human walkthrough.

`tests/aman-playthrough.cjs` contains the full route. For focused regressions, `FROM_PASSAGE=1`, `FROM_SANCTUARY=1` or `FROM_OASIS=1` starts from the corresponding explicit checkpoint. `BASE_URL` selects a stable local production server or the public deployment. Read-only `?debug` diagnostics do not ship reward/teleport mutation hooks.

## Hosted and touch verification

Pending at this source checkpoint. Record results only after the actual public build has been tested.

## Remaining limits

Original procedural development art and the articulated fox are provisional. The existing sword reach has limited foot/secondary animation. Shadows/material lighting, camera framing, NPC expressions, profession-specific activity and physical contact need further art/animation work. NPCs have ambient movement and roles, not full daily schedules.

Atlas and southern Moroccan oasis settings are playable; Rif, Kabyle and Tuareg chapters are distinct future settings and remain unavailable. The English dialogue is not native-language localization. Sources and attested names are documented; paid cultural consultation and native-speaker review have not occurred. Costume specificity, seasonal/community life and regional music performances need further work.

Story Tour is the principal verified route. Adventure timing and the inherited experimental Living Quest combat still need a fresh full difficulty/balance pass. Physical iOS/Android devices, Safari, Firefox, actual audio output, native GPU FPS and memory profiles have not been certified. No 60 FPS or finished premium/investor-ready claim is made. Saves are local to the browser; no cloud account system is implemented.
