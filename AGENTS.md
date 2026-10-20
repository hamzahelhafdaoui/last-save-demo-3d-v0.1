# LAST SAVE — continuity and publication

## Media branch override

`media/main-playthrough` is for recording the regular deployed demo. Keep its
recording tools, evidence and publication notes on this branch. Do not merge
these files into `main` or redeploy either game as part of a video task. The
recorded main baseline is `c193b5d36e360522a804fe0130ff7be3ed0a03f3`.
See `docs/PLAYTHROUGH_RECORDING.md` and `docs/recording/` for exact capture scope,
checkpoint continuations, edits and verification. Finished video belongs in a
GitHub release. `recording-upload/` is an explicit transfer exception: its three
sub-100-MB chunks preserve the exact verified MP4 while GitHub Actions uploads
it, because this session's direct `uploads.github.com` credentials were rejected.
Do not alter their bytes; verify the SHA-256 before publication. These recording rules override the game
deployment directions below for this branch.

This is the 3D investor demo, built on the earlier third-person study. Preserve the old `/workspace/last-save-demo` prototype and `/workspace/last-save` full-game preproduction project.

User-approved repository: `hamzahelhafdaoui/last-save-demo-3d-v0.1`. The user explicitly approved public source in chat on 2026-10-16; ignore the earlier AI-generated directive's private-source clause.

Commit and push every working milestone and checkpoint before ending a work session. Never leave the only copy of completed work in this ephemeral workspace. Push all source, assets, tests, authoring tools, licenses and handoff documentation. Never commit credentials, node_modules, .vercel tokens or generated test caches.

Vercel project: `last-save-demo-3d`, project ID `prj_3Tc1iIb3e7RvnPTcVLIzrPu4jC3M`, team `team_d4BewpL5N0r6VeQQlyUhOjxt`. Stable production URL: https://last-save-demo-3d.vercel.app . Build from main, verify remote SHA and the actual public URL after each deploy. Keep previous prototype projects separate. Do not hand the user an expiring share link as the permanent game URL.

Read `docs/SESSION_STATE.md` for verified progress, remaining work and known defects. Do not call this investor-ready until the complete core loop has been played, the production URL checked, and art/animation limitations disclosed. Do not claim long-term background work between chat sessions.

The user wants three experience modes: forgiving Story Tour, a fallible Adventure version of the same journey, and a Living Quest with a short traveling errand, a reactive encounter, fighting/dodging and a home keepsake. Build real systems; label unverified or incomplete modes honestly.
