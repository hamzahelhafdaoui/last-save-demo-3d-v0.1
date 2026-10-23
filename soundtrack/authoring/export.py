#!/usr/bin/env python3
"""Split the actual LAST SAVE additive-synthesis score into editable production layers.

No source game files are modified. Requires Python 3.11+, NumPy, SciPy and FFmpeg.
Run from any directory: python soundtrack/authoring/export.py
"""
from __future__ import annotations
import argparse, ast, hashlib, json, math, shutil, struct, subprocess, sys, wave, zipfile
from pathlib import Path
import numpy as np
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'tools/make-audio.py'
SOURCE_SHA = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
# Read chord data from the original source rather than maintaining another composition.
TREE = ast.parse(SOURCE.read_text())
SCORES = next(ast.literal_eval(n.value) for n in TREE.body if isinstance(n, ast.Assign) and any(isinstance(x, ast.Name) and x.id == 'scores' for x in n.targets))
SR, OUT_SR, SECONDS = 22050, 48000, 24
N = SR * SECONDS
T = np.arange(N, dtype=np.float64) / SR
CUE_NAMES = {'home': 'The Wayfarers Room', 'lumen': 'Lumenreach', 'city': 'Velvet City', 'sanctuary': 'Crownstone Sanctuary'}
COLORS = [(196,153,80),(96,174,144),(90,155,190),(169,134,196),(217,126,100),(104,153,169)]
LAYERS = ['01-Pad-Low', '02-Pad-Inner', '03-Pad-Upper', '04-Pad-High', '05-Arpeggio', '06-Stereo-Air']
CHORD_LABELS = {'home':['C major','A minor','F major','G major'], 'lumen':['A minor','F major','C major','G5 (open fifth)'], 'city':['F sharp 5 (open fifth)','A5 (open fifth)','E5 (open fifth)','B5 (open fifth)'], 'sanctuary':['D5 (open fifth)','F5 (open fifth)','A5 (open fifth)','G5 (open fifth)']}

def run(args):
    subprocess.run([str(x) for x in args], check=True, stdout=subprocess.DEVNULL)

def stereo(mono):
    return np.column_stack((mono, .96 * mono))

def synth(cue, chords):
    """Six additive layers, maintaining the original global oscillator phases."""
    chord_index = (T / 6).astype(int) % 4
    local = T % 6
    env = np.maximum(0, np.minimum(np.minimum(1, local/.8), (6-local)/1.2))
    fade = np.minimum(np.minimum(1, T/.4), (SECONDS-T)/.4)
    layers = []
    for j in range(4):
        notes = np.array(chords)[chord_index, j]
        freq = 440 * 2.0 ** ((notes-69)/12)
        tone = np.sin(T*freq*2*np.pi) + .19*np.sin(T*freq*4*np.pi) + .07*np.sin(T*freq*6*np.pi)
        mono = tone * .042 * env * (1+.09*np.sin(T*4.2+j))
        layers.append(stereo(mono) * fade[:,None])
    if cue == 'city':
        beat = T % .5
        rhythm = np.sin(2*np.pi*60*beat)*np.exp(-beat*20)*.11
    else:
        beat = T % 1.5
        step = (local/1.5).astype(int) % 4
        notes = np.array(chords)[chord_index, step] + 12
        freq = 440 * 2.0 ** ((notes-69)/12)
        rhythm = np.sin(T*freq*2*np.pi)*np.exp(-beat*2.6)*.065
    layers.append(stereo(rhythm) * fade[:,None])
    air = np.zeros((N,2)); air[:,1] = np.sin(T*2*np.pi*110)*.004*fade
    layers.append(air)
    return layers

def original_samples(cue, chords, indices):
    """Independent scalar implementation of the original source for regression checks."""
    result = []
    for i in indices:
        t = int(i)/SR; bar = int(t/6)%4; local = t%6
        env = min(1,local/.8,(6-local)/1.2); v=0
        for j,note in enumerate(chords[bar]):
            f=440*2**((note-69)/12)
            tone=math.sin(t*f*2*math.pi)+.19*math.sin(t*f*4*math.pi)+.07*math.sin(t*f*6*math.pi)
            v+=tone*.042*max(0,env)*(1+.09*math.sin(t*4.2+j))
        beat=t%(.5 if cue=='city' else 1.5)
        if cue=='city': v+=math.sin(2*math.pi*60*beat)*math.exp(-beat*20)*.11
        else:
            note=chords[bar][int(local/1.5)%4]+12; f=440*2**((note-69)/12)
            v+=math.sin(t*f*2*math.pi)*math.exp(-beat*2.6)*.065
        fade=min(1,t/.4,(SECONDS-t)/.4)
        result.append([max(-.9,min(.9,v*fade)),max(-.9,min(.9,(v*.96+math.sin(t*2*math.pi*110)*.004)*fade))])
    return np.array(result)

def wav24(path, data):
    path.parent.mkdir(parents=True,exist_ok=True)
    # Unity-gain, unnormalised 24-bit PCM. Quantisation only, no dither or limiting.
    pcm = np.rint(data*8388608).clip(-8388608,8388607).astype('<i4').reshape(-1)
    b = pcm.view(np.uint8).reshape(-1,4)[:,:3].copy().tobytes()
    with wave.open(str(path),'wb') as f:
        f.setnchannels(2); f.setsampwidth(3); f.setframerate(OUT_SR); f.writeframes(b)

def read24(path):
    with wave.open(str(path),'rb') as f:
        assert (f.getnchannels(),f.getsampwidth(),f.getframerate(),f.getnframes()) == (2,3,OUT_SR,OUT_SR*SECONDS)
        raw=np.frombuffer(f.readframes(f.getnframes()),np.uint8).reshape(-1,3).astype(np.int32)
    vals=raw[:,0] | (raw[:,1]<<8) | (raw[:,2]<<16)
    vals=np.where(vals & 0x800000,vals-0x1000000,vals)
    return vals.reshape(-1,2)/8388608

def vlq(n):
    b=[n&127]; n>>=7
    while n: b.insert(0,128|(n&127)); n>>=7
    return bytes(b)

def chunk(tag, b): return tag+struct.pack('>I',len(b))+b

def midi_track(events, end):
    out=bytearray(); prev=0
    for tick,priority,message in sorted(events,key=lambda x:(x[0],x[1])):
        out+=vlq(tick-prev)+message; prev=tick
    out+=vlq(end-prev)+b'\xff\x2f\x00'
    return chunk(b'MTrk',out)

def meta(kind, value): return bytes((255,kind))+vlq(len(value))+value

def midi(path, bpm, parts, total_seconds=SECONDS):
    ppq=960; ticks=lambda s:round(s*bpm/60*ppq); end=ticks(total_seconds)
    tempo=int(60_000_000/bpm)
    conductor=[(0,0,meta(3,b'LAST SAVE tempo and bar grid')),(0,1,meta(81,tempo.to_bytes(3,'big'))),(0,2,meta(88,bytes([4,2,24,8])))]
    tracks=[midi_track(conductor,end)]
    for idx,(name,events) in enumerate(parts.items()):
        channel=idx if idx<9 else idx+1
        if 'Kick' in name: channel=9
        items=[(0,0,meta(3,name.encode()))]
        # No GM patch is claimed to reproduce these custom additive synth voices.
        for e in events:
            items.extend([(ticks(e['start']),2,bytes([0x90|channel,e['note'],e['velocity']])),(ticks(e['start']+e['duration']),1,bytes([0x80|channel,e['note'],0]))])
        tracks.append(midi_track(items,end))
    path.parent.mkdir(exist_ok=True,parents=True)
    path.write_bytes(chunk(b'MThd',struct.pack('>HHH',1,len(tracks),ppq))+b''.join(tracks))

def note_events(cue,chords):
    parts={name:[] for name in LAYERS}
    if cue=='city': parts['05-Kick']=parts.pop('05-Arpeggio')
    for j in range(4):
        for i,chord in enumerate(chords): parts[LAYERS[j]].append(dict(start=i*6,duration=6,note=chord[j],velocity=80))
    rhythm='05-Kick' if cue=='city' else '05-Arpeggio'
    for step in range(48 if cue=='city' else 16):
        start=step*(.5 if cue=='city' else 1.5)
        note=36 if cue=='city' else chords[int(start//6)][step%4]+12
        parts[rhythm].append(dict(start=start,duration=.4 if cue=='city' else 1.45,note=note,velocity=88))
    parts['06-Stereo-Air']=[dict(start=0,duration=24,note=45,velocity=32)]
    return parts

def color(rgb): return 0x1000000+rgb[0]+(rgb[1]<<8)+(rgb[2]<<16)

def project(path,cues):
    # Relative source paths; no plugins or paid instruments required.
    overview=len(cues)>1
    lines=['<REAPER_PROJECT 0.1 7.82 1','  SAMPLERATE 48000','  PEAKGAIN 4','  TEMPO '+('40' if overview or cues[0]!='city' else '120'),'  TIMELOCKMODE 0','  TIMEMODE 1 0 -1','  MASTER_VOLUME 1','  ZOOM '+('12' if overview else '44')+' 0 0','  VZOOMEX 6 0','  MASTER_PANMODE 3']
    if overview:
        lines+=['  <TEMPOENVEX','    ACT 1','    VIS 0 0 0','    ARM 1','    DEFSHAPE 1 -1 -1','    PT 0 40 1','    PT 48 120 1','    PT 72 40 1','  >']
    for i,cue in enumerate(cues):
        pos=i*24
        lines += [f'  MARKER {i+1} {pos} "{i+1:02d} | {CUE_NAMES[cue]} | {120 if cue=="city" else 40} BPM" 1', f'  MARKER {i+1} {pos+24} "" 1']
    for j in range(7):
        name=['PAD 01 - foundation','PAD 02 - inner voice','PAD 03 - upper voice','PAD 04 - shimmer','ARP / CITY KICK','AIR - right channel','REFERENCE MIX - muted'][j]
        lines += ['  <TRACK',f'    NAME "{name}"',f'    PEAKCOL {color(COLORS[j%6])}','    VOLPAN 1 0 1 -1',f'    MUTESOLO {1 if j==6 else 0} 0 0','    MAINSEND 1','    NCHAN 2','    TRACKHEIGHT 84 0 0 0 0 0']
        for i,cue in enumerate(cues):
            layer=('05-Kick' if cue=='city' and j==4 else LAYERS[j]) if j<6 else 'Reference-Mix'
            relative=f'{cue}/Stems/{layer}.wav' if j<6 else f'{cue}/Reference-Mix.wav'
            if not overview: relative=f'Stems/{layer}.wav' if j<6 else 'Reference-Mix.wav'
            lines += ['    <ITEM',f'      POSITION {i*24}','      SNAPOFFS 0','      LENGTH 24','      VOLPAN 1 0 1 -1','      SOFFS 0','      PLAYRATE 1 1 0 -1 0 0.0025','      FADEIN 1 0 0','      FADEOUT 1 0 0',f'      NAME "{cue.upper()} / {layer}"','      <SOURCE WAVE',f'        FILE "{relative}"','      >','    >']
        lines+=['  >']
    lines+=['>']; path.write_text('\n'.join(lines)+'\n')

def validate_midi(path, expected_seconds):
    """Parse every MIDI event independently to validate delta times, notes and duration."""
    data=path.read_bytes(); assert data[:4]==b'MThd'
    _,track_count,ppq=struct.unpack('>HHH',data[8:14]); off=14; tempo=None; durations=[]; note_count=0
    def read_vlq(b,i):
        n=0
        while True:
            v=b[i]; i+=1; n=(n<<7)|(v&127)
            if v<128:return n,i
    for _ in range(track_count):
        assert data[off:off+4]==b'MTrk'
        size=struct.unpack('>I',data[off+4:off+8])[0]; b=data[off+8:off+8+size]; off+=8+size; i=0; tick=0; active=set()
        while i<len(b):
            delta,i=read_vlq(b,i); tick+=delta; status=b[i]; i+=1
            if status==255:
                typ=b[i]; i+=1; size,i=read_vlq(b,i); value=b[i:i+size]; i+=size
                if typ==81: tempo=int.from_bytes(value,'big')
                if typ==47: assert not active
            else:
                assert status&0xf0 in (0x80,0x90)
                note,vel=b[i:i+2];i+=2; key=(status&15,note)
                if status&0xf0==0x90 and vel:
                    assert key not in active; active.add(key); note_count+=1
                else: assert key in active; active.remove(key)
        durations.append(tick)
    assert off==len(data) and tempo is not None
    assert all(abs(t/ppq*tempo/1e6-expected_seconds)<.00001 for t in durations)
    return {'tracks':track_count,'note_events':note_count,'duration_seconds':expected_seconds}

def build(out):
    out.mkdir(parents=True,exist_ok=True)
    report={'source':'tools/make-audio.py','source_sha256':SOURCE_SHA,'source_rate':SR,'export_rate':OUT_SR,'export_bits':24,'cues':{}}
    recipe={'provenance':'Unchanged original main-game composition; separated additive voices. Not an orchestral recording.', 'source_sha256':SOURCE_SHA,'sample_rate_source':SR,'sample_rate_export':OUT_SR,'time_signature':'4/4','oscillators':{'pad':'sin(2*pi*f*t)+0.19*sin(4*pi*f*t)+0.07*sin(6*pi*f*t); .042 gain; AM 1+.09*sin(4.2*t+voice_index); attack .8s / release1.2s per6s chord', 'arpeggio':'sine; .065 gain; exp(-2.6*(t%1.5)); global oscillator phase','kick':'60Hz sine; .11 gain; exp(-20*(t%.5)); retrigger phase','stereo':'all layers L=1 R=.96; right-only110Hz air .004','fade':'first/last .4s; already baked into every stem'},'midi_note':'Pad durations follow chord boundaries; synth release shapes and global phase live in WAV/recipe, not MIDI. Kick MIDI note36 is an editing trigger for a 60Hz sine, not its pitched note. Air MIDI note45=110Hz. No GM patch claim.', 'cues':{}}
    indices=np.unique(np.concatenate((np.random.default_rng(13).integers(0,N,8192), np.arange(0,N,SR//2), np.array([0,N-1,SR*6,SR*12,SR*18]))))
    for cue,chords in SCORES.items():
        dest=out/cue; dest.mkdir(exist_ok=True)
        layers=synth(cue,chords); combined=np.sum(layers,axis=0)
        err=float(np.max(np.abs(combined[indices]-original_samples(cue,chords,indices))))
        assert err<1e-9,(cue,err)
        full=resample_poly(combined,320,147,axis=0)
        stems=[]
        for idx,layer in enumerate(layers):
            name='05-Kick' if cue=='city' and idx==4 else LAYERS[idx]
            file=dest/'Stems'/f'{name}.wav'
            wav24(file,resample_poly(layer,320,147,axis=0)); stems.append(file)
        wav24(dest/'Reference-Mix.wav',full)
        reconstructed=sum(read24(s) for s in stems)
        null_peak=float(np.max(np.abs(reconstructed-read24(dest/'Reference-Mix.wav'))))
        assert null_peak<=4/8388608
        assert np.max(np.abs(full))<.99
        shutil.copyfile(ROOT/'public/audio'/f'{cue}.ogg',dest/'Original-In-Game.ogg')
        events=note_events(cue,chords); bpm=120 if cue=='city' else 40
        midi(dest/'MIDI'/'All-Layers.mid',bpm,events)
        midi_checks=[validate_midi(dest/'MIDI'/'All-Layers.mid',24)]
        for name,notes in events.items():
            midi(dest/'MIDI'/f'{name}.mid',bpm,{name:notes}); midi_checks.append(validate_midi(dest/'MIDI'/f'{name}.mid',24))
        project(dest/f'LAST-SAVE-{cue}.rpp',[cue])
        recipe['cues'][cue]={'bpm':bpm,'bars':12 if cue=='city' else 4,'seconds':24,'chords_midi':chords,'chord_names':CHORD_LABELS[cue],'notes':events}
        report['cues'][cue]={'scalar_original_max_error':err,'scalar_samples_tested':len(indices),'stem_null_peak':null_peak,'stem_null_peak_dbfs':20*math.log10(null_peak) if null_peak else '-inf','reference_peak_dbfs':20*math.log10(float(np.max(np.abs(full)))),'wav_files_validated':7,'midi_files':midi_checks,'duration_seconds':24,'bars':12 if cue=='city' else 4,'bpm':bpm}
        print(f'{cue}: six aligned stems, 7 MIDI files, native REAPER session; original comparison {err:.3g}, null {null_peak:.3g}',flush=True)
    project(out/'LAST-SAVE-Full-Production.rpp',list(SCORES))
    ffmpeg_args=['ffmpeg','-v','error','-y']
    for cue in SCORES: ffmpeg_args+=['-i',str(out/cue/'Reference-Mix.wav')]
    ffmpeg_args+=['-filter_complex','concat=n=4:v=0:a=1','-c:a','libmp3lame','-b:a','192k',str(out/'Listen-Full-Score.mp3')]
    run(ffmpeg_args)
    (out/'Synthesis-and-Notes.json').write_text(json.dumps(recipe,indent=2)+'\n')
    (out/'Validation-Report.json').write_text(json.dumps(report,indent=2)+'\n')
    author=out/'Source'; author.mkdir(exist_ok=True)
    shutil.copyfile(SOURCE,author/'original-game-score.py')
    for file in Path(__file__).parent.iterdir():
        if file.is_file(): shutil.copyfile(file,author/file.name)
    for filename in ('README.txt','LICENSE.txt'):
        shutil.copyfile(ROOT/'soundtrack'/filename,out/filename)
    pic=ROOT/'soundtrack'/'LAST-SAVE-Production.png'
    if pic.exists(): shutil.copyfile(pic,out/pic.name)
    proof=ROOT/'soundtrack/verification'
    if proof.exists(): shutil.copytree(proof,out/'Verification',dirs_exist_ok=True)
    # REAPER creates disposable peaks/backup caches when previewing the session.
    for file in list(out.rglob('*')):
        if file.is_file() and (file.suffix.lower() in ('.reapeaks','.rpp-bak') or file.name.endswith('.rpp-bak')): file.unlink()
    checksums=[]
    for file in sorted(out.rglob('*')):
        if file.is_file() and file.name!='SHA256SUMS.txt': checksums.append(hashlib.sha256(file.read_bytes()).hexdigest()+'  '+file.relative_to(out).as_posix())
    (out/'SHA256SUMS.txt').write_text('\n'.join(checksums)+'\n')
    return report

def archive(out, path):
    path.parent.mkdir(exist_ok=True,parents=True)
    with zipfile.ZipFile(path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for file in sorted(out.rglob('*')):
            if file.is_file():
                info=zipfile.ZipInfo('LAST-SAVE-Soundtrack-Production/'+file.relative_to(out).as_posix(),(2026,10,23,0,0,0)); info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o644<<16
                z.writestr(info,file.read_bytes())
    with zipfile.ZipFile(path) as z: assert z.testzip() is None
    digest=hashlib.sha256(path.read_bytes()).hexdigest()
    path.with_suffix('.zip.sha256').write_text(digest+'  '+path.name+'\n')
    print(f'ZIP validated: {path} ({path.stat().st_size:,} bytes); SHA256 {digest}',flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--output',type=Path,default=ROOT/'soundtrack/generated/LAST-SAVE-Soundtrack-Production'); parser.add_argument('--zip',type=Path); args=parser.parse_args()
    build(args.output)
    if args.zip: archive(args.output,args.zip)
