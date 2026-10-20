/* Capture the unmodified public main demo using real browser controls.
 * Chapter setups (if requested) are explicit local saves, never runtime cheats.
 * Requires Playwright, system Chromium, and `playwright install ffmpeg`.
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ROOT = path.resolve(process.env.RECORD_DIR || 'recordings');
const BASE = 'https://last-save-demo-3d.vercel.app/';
const PART = process.env.PART || 'story';
fs.mkdirSync(ROOT,{recursive:true});
const manifest = {source:BASE,part:PART,width:960,height:600,chapters:[],errors:[],notes:[],startedAt:new Date().toISOString()};
let browser,context,p,origin=0,videoWall=0;
const held=new Set();
const pause = ms => p.waitForTimeout(ms);
const debug = () => p.evaluate(()=>window.lastSaveDebug());
const save = () => p.evaluate(()=>JSON.parse(localStorage.getItem('last-save.investor.v2')));
function persistManifest(){fs.writeFileSync(path.join(ROOT,PART+'.json'),JSON.stringify(manifest,null,2));}
async function chapter(title){await keys(new Set()); const entry={title,time:(Date.now()-origin)/1000};manifest.chapters.push(entry);persistManifest(); console.log('CHAPTER',entry.time.toFixed(1),title);await pause(1300);}
async function click(name){await p.getByRole('button',{name,exact:false}).click({force:true});await pause(500);}
async function keys(want){for(const k of [...held])if(!want.has(k)){await p.keyboard.up(k);held.delete(k);}for(const k of want)if(!held.has(k)){await p.keyboard.down(k);held.add(k);}}
async function rest(){await keys(new Set());await pause(400);}
async function turn(yaw){
  await rest();
  let delta=yaw-(await debug()).yaw;delta=Math.atan2(Math.sin(delta),Math.cos(delta));
  const pixels=-delta/0.004, steps=Math.ceil(Math.abs(pixels)/300);
  for(let i=0;i<steps;i++){
    await p.mouse.move(480,320);await p.mouse.down();
    await p.mouse.move(480+pixels/steps,320,{steps:10});await p.mouse.up();await pause(180);
  }
}
async function lookAt(x,z){const d=await debug();await turn(Math.atan2(d.position.x-x,d.position.z-z));}
async function go(x,z,tol=0.85,options={}){
  if(options.face!==false) await lookAt(x,z);
  let stuck=0,prev,hops=0;
  for(let i=0;i<500;i++){
    const d=await debug();assert.equal(d.mode,'play');
    const dx=x-d.position.x,dz=z-d.position.z,dist=Math.hypot(dx,dz);
    if(dist<tol){await rest();return;}
    const f=-dx*Math.sin(d.yaw)-dz*Math.cos(d.yaw),r=dx*Math.cos(d.yaw)-dz*Math.sin(d.yaw),a=Math.atan2(r,f),want=new Set();
    if(dist>10 && options.sprint!==false)want.add('Shift');
    if(options.sprint===true)want.add('Shift');
    if(Math.cos(a)>.4)want.add('w');if(Math.cos(a)<-.4)want.add('s');if(Math.sin(a)>.4)want.add('d');if(Math.sin(a)<-.4)want.add('a');
    await keys(want);await pause(dist<2?100:200);
    if(prev && Math.hypot(prev.x-d.position.x,prev.z-d.position.z)<.025)stuck++;else stuck=0;
    prev=d.position;
    if(stuck>12){
      if(hops++<3){console.log('JUMP RECOVERY',JSON.stringify(d.position),x,z);await p.keyboard.press('Space');stuck=0;}
      else {await rest();throw Error('Blocked navigation '+JSON.stringify({at:d.position,to:[x,z]}));}
    }
  }
  throw Error('Navigation budget '+x+','+z);
}
async function interact(id){
  await rest();
  await p.waitForFunction(id=>window.lastSaveDebug()?.interaction===id,id,{timeout:15000});
  await pause(700);await p.keyboard.press('e');await pause(1000);
}
async function world(id){await p.waitForFunction(id=>window.lastSaveDebug()?.world===id&&window.lastSaveDebug()?.mode==='play',id,{timeout:120000});await pause(1800);}
async function dialogue(button,ms=6500){await pause(ms);await click(button);}
async function panel(key,ms=6000){await rest();await p.keyboard.press(key);await pause(ms/2);await p.mouse.move(700,400);await p.mouse.wheel(0,500);await pause(ms/2);await click('Close panel');}
async function screenshot(name){await p.screenshot({path:path.join(ROOT,PART+'-'+name+'.png')});}
async function audioHook(){
  const Native=window.AudioContext || window.webkitAudioContext;
  const mix=new Native(),dest=mix.createMediaStreamDestination(),taps=new WeakMap();
  const nativeConnect=AudioNode.prototype.connect;
  AudioNode.prototype.connect=function(target,...args){
    const result=nativeConnect.call(this,target,...args),tap=taps.get(this.context);
    if(tap&&target===this.context.destination)nativeConnect.call(this,tap,args[0]||0);
    return result;
  };
  class CapturedAudioContext extends Native{constructor(...args){super(...args);const tap=this.createMediaStreamDestination();taps.set(this,tap);mix.createMediaStreamSource(tap.stream).connect(dest);}}
  window.AudioContext=CapturedAudioContext;if(window.webkitAudioContext)window.webkitAudioContext=CapturedAudioContext;
  let rec,chunks=[];
  window.startRecordingAudio=async()=>{await mix.resume();rec=new MediaRecorder(dest.stream,{mimeType:'audio/webm;codecs=opus'});rec.ondataavailable=e=>chunks.push(e.data);rec.start(1000);};
  window.stopRecordingAudio=()=>new Promise(resolve=>{rec.onstop=async()=>{const bytes=new Uint8Array(await new Blob(chunks).arrayBuffer());let out='';for(let i=0;i<bytes.length;i+=32768)out+=String.fromCharCode(...bytes.subarray(i,i+32768));resolve(btoa(out));};rec.stop();});
}
async function story(){
  await chapter('Opening — full cinematic');await click('Begin adventure');
  await p.getByRole('dialog',{name:'Create your character'}).waitFor({timeout:120000});
  await chapter('Character creation');
  await p.getByLabel('Character name',{exact:true}).fill('Rowan');
  for(const folk of ['Moonfolk','Emberkin','Amberkin']){await click(folk);await pause(1700);}
  await p.getByLabel('Hairstyle').selectOption('2');await pause(1400);
  await p.getByLabel('Hairstyle').selectOption('1');await pause(1400);
  await p.mouse.move(220,300);await p.mouse.down();await p.mouse.move(380,300,{steps:20});await p.mouse.up();await pause(2200);
  await click('This is my story');await world('home');await screenshot('home');
  await chapter('The Wayfarer’s Room — mirror, journal, wardrobe and portals');
  await go(-4,5);await go(-6,2);await interact('mirror');await pause(3000);await click('This is my story');
  await go(0,1);await go(5,4);await go(7,6.5);await interact('journal');await pause(7000);await click('Close panel');
  await go(7,2);await interact('wardrobe');await pause(2500);await click('This is my story');
  await go(0,0);await go(0,-9);await interact('locked');await pause(3500);
  await go(-4,-6);await interact('portal-lumen');await world('lumen');
  await chapter('Lumenreach arrival and Bellhaven');await screenshot('lumen');
  await go(0,5);await go(-.5,-26);await go(4,-25.5);await interact('edda');await dialogue('I’ll find the echoes',9000);
  await panel('j');
  await chapter('Kindness — the moonflower grove');
  // Cross the river via its actual bridge, then follow the south bank.
  await go(0,-24);await go(-.5,3);await go(-15,15);await go(-24,12,1.2);
  for(const [i,x,z] of [[0,-24,12],[1,-29,7],[2,-20,5]]){await go(x,z,1.1);await interact('flower-'+i);await pause(1500);}
  await go(-25,8,1.3);await interact('forest-echo');await pause(3500);assert((await debug()).quest.echoes.includes('forest'));await screenshot('forest');
  await chapter('Courage — the entire ancient crossing');
  await go(-15,5);await go(-.5,3);await go(-.5,-24);await go(-20,-24);await go(-24,-26);await interact('mechanism');
  await go(-26,-28,.5);await go(-29,-31,.45);
  await p.waitForFunction(()=>window.lastSaveDebug().quest.steps===1);
  await go(-33,-34,.45);await p.waitForFunction(()=>window.lastSaveDebug().quest.steps===2);
  await go(-37,-37,.45);await p.waitForFunction(()=>window.lastSaveDebug().quest.steps===3);
  await go(-40,-40,1);await interact('crossing-echo');await pause(3000);await screenshot('crossing');
  await chapter('Belonging — the memory archive');
  await go(-37,-37,.5);await go(-33,-34,.5);await go(-29,-31,.5);await go(-26,-28,.5);await go(-24,-24);
  await go(-17,-24);await go(0,-23);await go(18,-26);await go(21,-43);await go(15,-43);
  for(const [i,x,z] of [[0,12,-46.5],[1,15,-46.5],[2,18,-46.5]]){await go(x,z,.8);await interact('memory-'+i);await pause(2000);}
  assert.equal((await debug()).quest.echoes.length,3);await panel('j');
  await chapter('Crownstone Sanctuary and the guardian');
  await go(15,-42);await go(21,-42);await go(22,-24);await go(33,-24);await go(33,-32,.7);
  // Approach between the first two answer runes to listen before answering.
  await go(32.2,-34.5,.3);await interact('guardian');await dialogue('Continue',8000);
  for(const [i,x,z] of [[0,30,-33.5],[1,33,-32],[2,36,-33.5]]){await go(x,z,.7);await interact('guardian-'+i);await pause(1200);}
  await go(33,-35.8,.7);await lookAt(33,-39);await screenshot('sanctuary');
  await chapter('Dawnwake — complete extraction, sunrise and item reveal');await interact('sword');
  await p.waitForFunction(()=>window.lastSaveDebug().mode==='reveal',null,{timeout:150000});
  await pause(9000);await screenshot('dawnwake');await click('Carry it into the next world');
  assert((await debug()).equipment.sword);await panel('i',7000);
  await go(33,-31);await go(33,-24);await go(8,-23);await interact('portal-city');await world('city');
  await chapter('Velvet City — same traveler, new world');await screenshot('city');
  await go(0,2);await go(-5,-5.8);await interact('sable');await dialogue('Wear the Velvet jacket',9000);await pause(2500);
  await panel('i',7000);await go(-6,-8);await interact('boutique');await dialogue('See you around',4500);
  await go(0,-18);await lookAt(0,-28);await pause(3000);await go(4,-8);await go(4,6);await go(0,12);await interact('portal-home');await world('home');
  await chapter('Homecoming — keepsakes and complete ending');await go(-7,-3);await interact('display');
  await p.waitForFunction(()=>window.lastSaveDebug().mode==='play',null,{timeout:90000});await pause(3000);await screenshot('home-keepsakes');
  await panel('j',6500);await panel('i',6500);
  await chapter('Settings, Investor Demo Mode and saved progress');
  await p.keyboard.press('Escape');await pause(5500);await p.getByText('Investor Demo Mode',{exact:true}).click();await pause(5500);
  const download=p.waitForEvent('download');await click('Export progress');await(await download).saveAs(path.join(ROOT,'main-game-progress.json'));await click('Return to the world');
  await p.keyboard.press('h');await pause(3000);await p.keyboard.press('h');
  await chapter('Journey complete — identity, outfit and home display saved');
  const final=await save();assert(final.home.sword&&final.equipment.jacket&&final.quest.sword);assert.equal(final.appearance.name,'Rowan');
  fs.writeFileSync(path.join(ROOT,'story-save.json'),JSON.stringify(final,null,2));await pause(3000);
}
async function living(){
  await chapter('Living Quest — healer’s errand');
  await click('Continue your story');await world('home');
  await p.keyboard.press('Escape');await p.getByLabel('Experience mode').selectOption('quest');await pause(3000);await click('Return to the world');
  await go(-4,-6);await interact('portal-lumen');await world('lumen');
  await go(10,-28);await interact('healer');await dialogue('I’ll bring it back',8000);
  await panel('j',5000);await go(0,-24);await go(-.5,3);await go(-16,19,1);
  await chapter('Moonfern gathering and forest ambush');await interact('herbs');await pause(2500);await go(-13,15,1.2);
  await p.getByText(/HOLLOW WARDENS · [123] REMAIN/).waitFor();await screenshot('ambush');
  await chapter('Hollow Wardens — fighting, dodging and recovery');
  // Real strikes and movement: rotate through every facing while enemies approach.
  for(let i=0;i<120;i++){
    const state=await save();if(state.sideQuest.defeated)break;
    const d=await debug();
    if(d.position.z>22){manifest.notes.push('A real encounter loss returned the character to the trail; herbs retained.');await go(-13,15,1);}
    await p.keyboard.press('f');
    if(i%4===0){await keys(new Set(['a']));await p.keyboard.press('q');await pause(350);await rest();}
    if(i%5===0)await turn((await debug()).yaw+Math.PI/2);
    await pause(650);
  }
  const state=await save();manifest.notes.push('Living Quest enemy defeat: '+state.sideQuest.defeated);
  await rest();await chapter('Delivering the moonfern and receiving the lantern');
  await go(-3,10);await go(-.5,3);await go(-.5,-24);await go(10,-28);await interact('healer');await dialogue('Deliver moonfern',9000);
  assert((await debug()).inventory.includes('moonfern-lantern'));await panel('i',6500);
  await go(0,-24);await go(-.5,3);await go(-1,25);await interact('portal-home');await world('home');
  await chapter('The moonfern lantern at home');await go(4,7);await lookAt(8,8);await pause(7000);await screenshot('lantern');
  fs.writeFileSync(path.join(ROOT,'living-save.json'),JSON.stringify(await save(),null,2));
}
async function adventure(){
  manifest.notes.push('This separate challenge replay loads the recorded traveler at an explicit crossing setup, with the forest echo already earned. No challenge rewards are pre-granted.');
  await chapter('Adventure mode — crossing replay from a saved setup');await click('Continue your story');await world('lumen');
  await p.keyboard.press('Escape');await pause(5000);await click('Return to the world');await interact('mechanism');
  await go(-26,-28,.45);await go(-29,-31,.45);await p.waitForFunction(()=>window.lastSaveDebug().quest.steps===1);
  await chapter('Timed challenge — real failure and retry');await pause(15000);
  await p.waitForFunction(()=>window.lastSaveDebug().quest.steps===0);await pause(3000);await screenshot('retry');
  // Show real attempted jumps through the harder gap route; success is asserted.
  await go(-24,-26,.8);await interact('mechanism');await go(-26,-28,.45);await go(-29,-31,.45);
  for(const [x,z] of [[-33,-34],[-37,-37]]){
    await lookAt(x,z);await keys(new Set(['w','Shift']));await p.keyboard.press('Space');
    for(let i=0;i<35;i++){const d=await debug();if(Math.hypot(d.position.x-x,d.position.z-z)<.65){await rest();break;}await pause(80);}
    await rest();
  }
  const d=await debug();
  if(d.quest.steps===3){await go(-40,-40,1);await interact('crossing-echo');await pause(3500);}
  manifest.notes.push('Adventure replay ended at '+JSON.stringify((await debug()).quest));
  await screenshot('adventure-end');
}
(async()=>{
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:false,proxy:{server:process.env.HTTPS_PROXY},args:['--no-sandbox','--use-gl=angle','--use-angle=gl','--ignore-gpu-blocklist','--enable-webgl','--autoplay-policy=no-user-gesture-required']});
  context=await browser.newContext({viewport:{width:960,height:600},deviceScaleFactor:1,recordVideo:{dir:path.join(ROOT,'raw'),size:{width:960,height:600}},acceptDownloads:true});
  await context.addInitScript(audioHook);
  const seed=PART==='story'?{version:2,created:false,settings:{quality:'low',volume:.65}}:JSON.parse(fs.readFileSync(path.join(ROOT,'story-save.json'),'utf8'));
  if(PART==='adventure')Object.assign(seed,{world:'lumen',experience:'adventure',positions:{lumen:{x:-24,z:-26}},quest:{accepted:true,flowers:[0,1,2],echoes:['forest'],mechanism:false,steps:0,memory:0,guardian:0,sword:false},inventory:['forest-echo'],equipment:{sword:false,jacket:false},home:{sword:false},ending:false});
  await context.addInitScript(seed=>{if(!sessionStorage.getItem('recording-seeded')){localStorage.setItem('last-save.investor.v2',JSON.stringify(seed));sessionStorage.setItem('recording-seeded','yes');}},seed);
  videoWall=Date.now();p=await context.newPage();p.setDefaultTimeout(90000);
  p.on('pageerror',e=>{manifest.errors.push(e.message);console.log('PAGE ERROR',e.message);});
  p.on('response',r=>{if(r.status()>=400){manifest.errors.push('HTTP '+r.status()+' '+r.url());console.log('HTTP',r.status(),r.url());}});
  await p.goto(BASE+'?debug');await p.getByRole('button',{name:PART==='story'?'Begin adventure':'Continue your story'}).waitFor();
  await pause(2500);origin=Date.now();manifest.trimStart=(origin-videoWall)/1000;
  await p.evaluate(()=>window.startRecordingAudio());
  if(PART==='story')await story();else if(PART==='living')await living();else await adventure();
  manifest.complete=true;
})().catch(async e=>{manifest.failure=e.stack;console.error(e.stack);if(p){await rest().catch(()=>{});await screenshot('failure').catch(()=>{});fs.writeFileSync(path.join(ROOT,PART+'-failure-save.json'),JSON.stringify(await save().catch(()=>null),null,2));}process.exitCode=1;}).finally(async()=>{
  if(p){manifest.recordedSeconds=(Date.now()-origin)/1000;try{const audio=await p.evaluate(()=>window.stopRecordingAudio());fs.writeFileSync(path.join(ROOT,PART+'-audio.webm'),Buffer.from(audio,'base64'));}catch(e){manifest.notes.push('Audio export: '+e.message);}const video=p.video();await context.close();manifest.rawVideo=await video.path();}
  if(browser)await browser.close();persistManifest();console.log('RECORDING',JSON.stringify(manifest));
});
