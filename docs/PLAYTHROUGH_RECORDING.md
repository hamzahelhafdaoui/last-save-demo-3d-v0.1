# Main-demo recording

This media branch preserves the recording tools for the **regular** LAST SAVE demo.
It does not modify gameplay, assets or the main Vercel project. The separate AMAN
experiment is not the subject of this recording.

Source build: `c193b5d36e360522a804fe0130ff7be3ed0a03f3` on `main`.
Live game: https://last-save-demo-3d.vercel.app/

## Reproduce

Install the project dependencies, system Chromium, Xvfb/Mesa and FFmpeg, then run
`npx playwright install ffmpeg`. Run from the repository root:

```sh
DISPLAY=:95 LIBGL_ALWAYS_SOFTWARE=1 node tools/record-demo.cjs
# Only when continuing that recorder's earned failure checkpoint:
DISPLAY=:95 LIBGL_ALWAYS_SOFTWARE=1 PART=story-end node tools/record-demo.cjs
DISPLAY=:95 LIBGL_ALWAYS_SOFTWARE=1 PART=story-finale node tools/record-demo.cjs
DISPLAY=:95 LIBGL_ALWAYS_SOFTWARE=1 PART=living node tools/record-demo.cjs
DISPLAY=:95 LIBGL_ALWAYS_SOFTWARE=1 PART=adventure node tools/record-demo.cjs
python3 tools/export-recording.py recordings
```

The default Chromium location is `/usr/bin/chromium`. Start an Xvfb display at
`:95` (or select an existing display) before recording. For this cloud environment,
Playwright uses the inherited HTTPS proxy and Mesa software OpenGL. A local setup with
direct public access can remove the proxy launch option. Output is 960 × 600,
25-fps H.264/AAC; rendered frames depend on the recording host's performance.

The recorder uses actual keyboard, pointer and menu controls on the public
deployment. Read-only debug information guides navigation. The main story starts
fresh. Its first recording completed the forest and physical crossing, then
stopped when the navigation routine could not re-climb the last stone from the
reward side. The export retains the complete opening-through-crossing content
and trims the repeated navigation attempts after the reward.
`story-end` continues the actually earned checkpoint along a ground route. No
items, quest progress or cinematic rewards are added to that checkpoint. A
second navigation stop targeted the third guardian rune too close to a column;
`story-finale` resumes the same earned save and performs the final rune answer
normally. The exported earlier part ends after the first two answers. These
breaks and cut points are recorded in the capture manifests; this is a chaptered
walkthrough, not a claim of one uninterrupted fresh-save run.
Living Quest continues the earned story save. Adventure is a separate,
explicit crossing replay setup, with the forest echo already earned and no
crossing or sword reward granted. It is not presented as a single fresh-save run
through all three modes. Music and effects are captured from the game's own Web
Audio output, including both Howler and synthesized cues.

The export trims initial browser/bootstrap waits and the documented recorder
navigation stalls, then joins the separately recorded chapters. No quest step
or authored cinematic is shortened. It boosts the captured audio by 10 dB with a
peak limiter for listening. It does not generate game footage, interpolate
frames, replace music, or speed up authored cinematics. Raw videos,
save exports and diagnostic logs remain outside Git; the final MP4 and chapter
index are intended as release assets.

## Verified recording

The exported regular-demo walkthrough runs **18 minutes 23 seconds**, at
960 × 600, H.264 video and stereo AAC audio. It has 22 chapter markers. The
video decoded for a full contact-sheet pass; the complete audio decoded without
errors and peaked at −8.7 dB. Chromium played the actual MP4 and successfully
sought to eight checked timestamps using a local byte-range server.

Living Quest includes real strikes, dodges, repeated losses, retreat, delivery
and the physical home lantern. **A Warden victory was not recorded.** The
operator ended the repeated combat-input routine without changing game state.
Adventure shows its actual timeout, restart and attempted harder jumps; that
retry reached two rune stones. The complete three-stone route and reward are
already included in Story Tour. Neither extra chapter is presented as a perfect
winning run.

Exact capture ranges, recorded limitations, source SHA and file checksum are in
`docs/recording/capture.json`; timestamps are in `docs/recording/chapters.txt`.
The original main remote SHA and public HTML remained unchanged.

To review the MP4 after export, run `node tools/serve-recording.cjs`, then
`node tools/check-recording.cjs`. The review server supports HTTP byte ranges;
a server that ignores range requests can misleadingly reset seeks to zero.
