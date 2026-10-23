LAST SAVE | REGULAR GAME | SOUNDTRACK PRODUCTION EXPORT
23 October 2026

This pack contains every musical layer of the regular game's current four
24-second synthesized music loops. This is the existing music separated for
production, not a newly composed full-length or orchestral soundtrack.

START HERE
- Listen-Full-Score.mp3 previews the four cues consecutively.
- Open LAST-SAVE-Full-Production.rpp in REAPER for the complete multitrack session.
  All four cues are arranged consecutively with the correct tempo changes.
- Each cue also has its own .rpp session, six stereo WAV stems, a reference mix,
  original game OGG, multitrack MIDI and individual MIDI layers.
- LAST-SAVE-Production.png is a screenshot of the actual REAPER session.
- No paid instruments, plugins or online services are required for the WAV sessions.
- The REFERENCE MIX track is MUTED deliberately. Leave it muted when playing
  stems to avoid doubling the mix; solo it to compare against the stems.

FL STUDIO / OTHER DAWS
1. Extract the entire ZIP first. Choose one cue folder.
2. Create a new 4/4 project and set tempo: home/lumen/sanctuary 40 BPM;
   city 120 BPM. Do this before importing audio.
3. Drag that cue's six Stems/*.wav files into separate Playlist tracks, all
   beginning at bar 1. Keep them at original length, unity gain, centred pan,
   no time stretching, no automatic normalization, no added master effects.
4. Import MIDI/All-Layers.mid to edit the notes, or import individual MIDI files.
   Assign your own instruments. MIDI notes alone do not reproduce our custom
   additive synth; the exact sound is in WAV and Synthesis-and-Notes.json.
5. Save your own FLP. This pack does NOT include a native FL Studio .flp file.
   The supplied native project is REAPER .rpp, portable with the included WAVs.

CUES / TEMPO / BAR GRID
home       The Wayfarer's Room     40 BPM   4 bars   24 seconds
lumen      Lumenreach              40 BPM   4 bars   24 seconds
city       Velvet City           120 BPM  12 bars   24 seconds
sanctuary  Crownstone Sanctuary    40 BPM   4 bars   24 seconds

In the full session: home 0-24s, lumen 24-48s, city 48-72s,
sanctuary 72-96s. Tempo changes at 48s and 72s are square/instant.
Each chord lasts six seconds (1 bar at 40 BPM; 3 bars at 120 BPM).

LAYERS (not recordings of acoustic instruments)
01-04: four separately editable additive pad voices, low to high.
05: a sine arpeggio; in the city cue, a 60 Hz synthesized kick instead.
06: quiet 110 Hz right-channel air/drone, present in the original stereo mix.
These are the components actually present in the source. No fabricated string,
percussion, vocal or other studio recordings have been added.

AUDIO DETAILS
48,000 Hz / 24-bit PCM / stereo, all stems aligned at 0s, exactly 24s each.
Source synthesis was 22,050 Hz. Resampling to 48k aids DAW compatibility;
it does not add fidelity. The original attack/release, stereo balance,
modulation and 0.4-second start/end fades are already baked into each stem.
No normalization, mastering limiter or additional effects have been applied.
At unity, the six stems reconstruct the included reference mix within the
rounding of 24-bit PCM. Vorbis OGG is lossy, so it cannot null bit-perfectly.
The original OGG files are included unchanged for source comparison.
The clips include the original short fade to silence at the loop seam.

WHAT IS EDITABLE
WAV: arrangement, balances, EQ, audio processing and layering.
MIDI: pitches, timing, tempo and replacement instruments.
Synthesis-and-Notes.json: original chord notes, events and sound recipe.
Source/: original game synthesizer and reproducible layer-export code.
REAPER sessions: named, coloured tracks, cue regions, correct tempo map,
relative asset paths, muted reference, zero third-party plugin dependencies.

MIDI LIMITS
Chord note durations encode the six-second harmonic slots. Audio envelopes
and global oscillator phases are documented in the synthesis recipe, since
ordinary MIDI does not encode them. City kick note36 is a drum trigger;
the sound is a 60 Hz sine. Air note45 is the actual 110 Hz pitch.
MIDI voice velocities are editing defaults; they are not synth gain controls.
Chord names identify the harmony; chord MIDI arrays preserve exact voicings.

WHAT IS NOT IN THIS PACK
Random/runtime gameplay sound effects, ambience from the recording,
interactive scene crossfades, and a final orchestral score. This is the
complete current music source; gameplay effects are a separate system.
No changes were made to the main game, saves or Vercel production.

REBUILD / VERIFY
Python 3.11+; FFmpeg; pip install -r soundtrack/authoring/requirements.txt
From the repository: python soundtrack/authoring/export.py --zip <output.zip>
Run the exporter from its original repository location (it reads tools/ and
public/audio/). Source/ is an archival copy, not a standalone repo checkout.
Validation-Report.json records independent original-math sample comparisons,
stem null tests, WAV formats/durations, MIDI note balances, durations and tempos.
SHA256SUMS.txt verifies every file except itself.

PERSISTENT SOURCE
https://github.com/hamzahelhafdaoui/last-save-demo-3d-v0.1/tree/media/soundtrack-production
Release: soundtrack-production-2026-10-23
