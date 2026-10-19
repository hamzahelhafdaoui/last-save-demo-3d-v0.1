"""Original AMAN sketches: plucked strings, soft hand-drum-like transients,
wind and water. No sampled performances and no claim of a traditional repertoire.
Reproducible with numpy + ffmpeg. Produces locally hosted Vorbis loops.
"""
from pathlib import Path
import subprocess, wave
import numpy as np
out=Path(__file__).resolve().parents[1]/'public/audio';out.mkdir(exist_ok=True)
sr=22050;duration=24;t=np.arange(sr*duration)/sr
rng=np.random.default_rng(602)
for name,notes,beat in [('home',[50,57,60,62,65,69],.75),('lumen',[50,53,57,60,62,65],.5),('city',[48,55,58,60,63,67],.375),('sanctuary',[38,45,50,53,57,62],.75)]:
    sound=np.zeros_like(t)
    # Original six-beat phrases, played on synthesized decaying string partials.
    melody=[0,2,3,1,4,2,0,3,5,4,2,1,0,2,4,3]
    for i,start in enumerate(np.arange(0,duration,beat)):
        phase=t-start;mask=phase>=0;phase=np.maximum(0,phase)
        note=notes[melody[i%len(melody)]]+(12 if i%12==8 else 0);f=440*2**((note-69)/12)
        env=np.exp(-phase*(2.8 if name!='sanctuary' else 1.6))*mask
        pluck=sum(np.sin(2*np.pi*f*k*phase)*np.exp(-phase*k*.8)/k**1.65 for k in range(1,6))
        sound+=pluck*env*.12
        if name in ('lumen','city'):
            # Warm low drum and brushed high accents. Not copied rhythms/samples.
            drum=np.sin(2*np.pi*(80*phase+12*(1-np.exp(-phase*24))))*np.exp(-phase*28)*mask
            sound+=drum*(.065 if i%6 in (0,3) else .015)
    wind=rng.normal(0,1,len(t));wind=np.convolve(wind,np.ones(90)/90,mode='same')
    sound+=wind*(.035 if name=='lumen' else .02)
    if name=='city':
        water=rng.normal(0,1,len(t));water=np.convolve(water,np.ones(8)/8,mode='same');sound+=water*.018*(.7+.3*np.sin(t*2))
    root=440*2**((notes[0]-81)/12)
    sound+=np.sin(2*np.pi*root*t)*.016
    fade=np.minimum(1,np.minimum(t/.3,(duration-t)/.4));sound*=np.maximum(0,fade)
    stereo=np.column_stack([sound,np.roll(sound,90)*.92]);pcm=(np.clip(stereo,-.9,.9)*32767).astype('<i2')
    tmp=out/(name+'.wav')
    with wave.open(str(tmp),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes(pcm.tobytes())
    subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(tmp),'-c:a','libvorbis','-q:a','4',str(out/(name+'.ogg'))],check=True);tmp.unlink()
    print(name,flush=True)
