"""Original procedural scores; no recordings, samples or third-party musical works.
Writes small Vorbis loops using additive synthesis and an original chord pattern.
"""
import math, wave, struct, subprocess
from pathlib import Path
out=Path(__file__).resolve().parents[1]/'public/audio';out.mkdir(exist_ok=True)
sr=22050;length=24
scores={'home':([48,55,60,64],[45,52,57,60],[41,48,53,57],[43,50,55,59]),'lumen':([45,52,57,60],[41,48,53,57],[48,55,60,64],[43,50,55,62]),'city':([42,49,54,61],[45,52,57,64],[40,47,52,59],[47,54,59,66]),'sanctuary':([38,45,50,57],[41,48,53,60],[45,52,57,64],[43,50,55,62])}
for name,chords in scores.items():
 data=[]
 for i in range(sr*length):
  t=i/sr;bar=int(t/6)%4;local=t%6;env=min(1,local/.8,(6-local)/1.2);v=0
  for j,note in enumerate(chords[bar]):
   f=440*2**((note-69)/12);tone=math.sin(t*f*2*math.pi)+.19*math.sin(t*f*4*math.pi)+.07*math.sin(t*f*6*math.pi)
   v+=tone*.042*max(0,env)*(1+.09*math.sin(t*4.2+j))
  beat=t%(0.5 if name=='city' else 1.5)
  if name=='city':v+=math.sin(2*math.pi*60*beat)*math.exp(-beat*20)*.11
  else:
   note=chords[bar][int(local/1.5)%4]+12;f=440*2**((note-69)/12);v+=math.sin(t*f*2*math.pi)*math.exp(-beat*2.6)*.065
  # Soft stereo movement and a gentle loop seam.
  fade=min(1,t/.4,(length-t)/.4);l=v*fade;r=(v*.96+math.sin(t*2*math.pi*110)*.004)*fade
  data.extend((max(-.9,min(.9,l)),max(-.9,min(.9,r))))
 tmp=out/(name+'.wav')
 with wave.open(str(tmp),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes(struct.pack('<'+'h'*len(data),*(int(v*32767) for v in data)))
 subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(tmp),'-c:a','libvorbis','-q:a','3',str(out/(name+'.ogg'))],check=True);tmp.unlink()
 print(name)
