# AMAN experiment handoff — 2026-10-19

The user requested an alternate North African/Amazigh foundation without changing the main game. This branch builds on the working v0.1.0-dev.2 source. Keep all work on `experiment/amazigh` in `hamzahelhafdaoui/last-save-demo-3d-v0.1`. Original main baseline `c193b5d36e360522a804fe0130ff7be3ed0a03f3`; main production remains https://last-save-demo-3d.vercel.app/ . Never merge or deploy this branch there.

## New separate project

Vercel `last-save-aman`, ID `prj_mzibNFHjMGhtnE9MEDrQ5bUXmelx`, team `team_d4BewpL5N0r6VeQQlyUhOjxt`. It intentionally is not linked to repo default main: deploy the pushed `experiment/amazigh` Git source to this project explicitly using Vercel MCP `create_deployment` with production target. Do not use `create_git_project` on the default branch or redirect the main project's domains. The project ignores build requests for branches other than `experiment/amazigh`.

Production URL and deployment SHA are pending browser verification, not yet claimed as complete at this checkpoint.

## Implemented in this branch

- Rebuilt playable courtyard, Atlas-inspired Tizi Highlands and southern Moroccan Targa Oasis; stone/earth architecture, cedar/palm vegetation, pottery, textiles, terraces, grain-store doors, shaded courtyards, surface channels, gallery headworks and cistern.
- Actual water-restoration gates; a physically traversed caravan route; evidence and two remembered granary agreements; original fantasy Dawn Terrace and retained physical blade extraction; a separate oasis repair quest with visible restored water/gardens; obtainable mantle and silver clasp; cross-region identity/equipment and physical home keepsakes.
- Linen tunic, woven belt, silver fastening and oasis mantle on the original fantasy fox. New original synthesized plucked/percussion/wind/water scores, with authoring script. English dialogue with a sourced three-word glossary; future Rif, Kabyle and Tuareg chapter descriptions kept distinct and locked.
- Original controls/recovery retained. Separate browser namespace `last-save.aman.v1`. 35 system tests passed, including both granary decisions, repair gates/unique rewards, save isolation and retained physics/input tests. TypeScript/Vite build passed.

Cultural sources and exact limits: `docs/aman/CULTURAL_FOUNDATION.md`. No community/native-speaker review has occurred. Personal names have no fabricated translations. UI remains English; future regional chapters, finished character/environment art, natural schedules, music performance and localized dialogue remain future work.

Browser playthrough, screenshots and deployed checks are in progress. Do not claim them before seeing actual results. Most inherited browser scripts refer to original main-game content; use AMAN-specific tests for quest verification.
