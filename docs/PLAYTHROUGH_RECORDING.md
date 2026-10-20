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
fresh; Living Quest continues the earned story save. Adventure is a separate,
explicit crossing replay setup, with the forest echo already earned and no
crossing or sword reward granted. It is not presented as a single fresh-save run
through all three modes. Music and effects are captured from the game's own Web
Audio output, including both Howler and synthesized cues.

The export trims the initial browser/bootstrap wait from each part and joins
the separately recorded mode chapters. It does not generate game footage,
interpolate frames, replace music, or speed up authored cinematics. Raw videos,
save exports and diagnostic logs remain outside Git; the final MP4 and chapter
index are intended as release assets.
