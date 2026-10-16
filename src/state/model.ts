export type WorldId = 'home' | 'lumen' | 'city';
export type Echo = 'forest' | 'crossing' | 'archive';
export type Appearance = { name:string; preset:'amber'|'moon'|'russet'; fur:string; hair:string; hairStyle:number; eyes:string; primary:string; secondary:string; accessory:boolean };
export type Save = { version:2; appearance:Appearance; created:boolean; world:WorldId; positions:Partial<Record<WorldId,{x:number;z:number}>>; quest:{accepted:boolean;flowers:number[];mechanism:boolean;steps:number;memory:number;echoes:Echo[];guardian:number;sword:boolean}; inventory:string[]; equipment:{sword:boolean;jacket:boolean}; home:{sword:boolean}; ending:boolean; settings:{volume:number;quality:'low'|'medium'|'high';motion:boolean;sensitivity:number}; };
export const SAVE_KEY='last-save.investor.v2';
export const DEFAULT_APPEARANCE:Appearance={name:'Wayfarer',preset:'amber',fur:'#bc874f',hair:'#633c2d',hairStyle:0,eyes:'#294c4b',primary:'#256c70',secondary:'#d6a84b',accessory:true};
export function freshSave():Save{return {version:2,appearance:{...DEFAULT_APPEARANCE},created:false,world:'home',positions:{},quest:{accepted:false,flowers:[],mechanism:false,steps:0,memory:0,echoes:[],guardian:0,sword:false},inventory:[],equipment:{sword:false,jacket:false},home:{sword:false},ending:false,settings:{volume:.55,quality:'medium',motion:true,sensitivity:1}};}
const color=(v:unknown,f:string)=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)?v:f;
const count=(v:unknown,max:number)=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):0;
export function validateSave(raw:unknown):Save{
 const f=freshSave(); if(!raw||typeof raw!=='object'||(raw as Save).version!==2)return f;
 const r=raw as any,a=r.appearance||{},q=r.quest||{};
 f.created=r.created===true; f.appearance={...f.appearance,name:typeof a.name==='string'?a.name.replace(/[<>\u0000-\u001f]/g,'').slice(0,24)||'Wayfarer':'Wayfarer',preset:['amber','moon','russet'].includes(a.preset)?a.preset:'amber',fur:color(a.fur,f.appearance.fur),hair:color(a.hair,f.appearance.hair),hairStyle:count(a.hairStyle,2),eyes:color(a.eyes,f.appearance.eyes),primary:color(a.primary,f.appearance.primary),secondary:color(a.secondary,f.appearance.secondary),accessory:a.accessory!==false};
 f.world=['home','lumen','city'].includes(r.world)?r.world:'home';
 for(const w of ['home','lumen','city'] as WorldId[]){const p=r.positions?.[w];if(p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.abs(p.x)<85&&Math.abs(p.z)<85)f.positions[w]={x:p.x,z:p.z};}
 f.quest={accepted:q.accepted===true,flowers:Array.isArray(q.flowers)?[...new Set<number>(q.flowers.filter((n:unknown)=>[0,1,2].includes(n as number)))]:[],mechanism:q.mechanism===true,steps:count(q.steps,3),memory:count(q.memory,3),echoes:Array.isArray(q.echoes)?[...new Set<Echo>(q.echoes.filter((e:unknown)=>['forest','crossing','archive'].includes(e as string)))]:[],guardian:count(q.guardian,3),sword:q.sword===true};
 f.inventory=Array.isArray(r.inventory)?[...new Set<string>(r.inventory.filter((x:unknown)=>['dawnwake','velvet-jacket','forest-echo','crossing-echo','archive-echo'].includes(x as string)))]:[];
 // Repair interrupted or inconsistent saves without creating duplicate rewards.
 if(f.quest.sword&&!f.inventory.includes('dawnwake'))f.inventory.push('dawnwake');
 if(f.inventory.includes('dawnwake')){f.quest.sword=true;f.quest.accepted=true;f.quest.echoes=['forest','crossing','archive'];f.quest.guardian=3;}
 for(const e of f.quest.echoes)if(!f.inventory.includes(e+'-echo'))f.inventory.push(e+'-echo');
 f.equipment={sword:r.equipment?.sword===true&&f.quest.sword,jacket:r.equipment?.jacket===true&&f.inventory.includes('velvet-jacket')};
 f.home.sword=r.home?.sword===true&&f.quest.sword; f.ending=r.ending===true;
 const s=r.settings||{};f.settings={volume:typeof s.volume==='number'&&Number.isFinite(s.volume)?Math.max(0,Math.min(1,s.volume)):.55,quality:['low','medium','high'].includes(s.quality)?s.quality:'medium',motion:s.motion!==false,sensitivity:typeof s.sensitivity==='number'&&Number.isFinite(s.sensitivity)?Math.max(.4,Math.min(1.8,s.sensitivity)):1};
 return f;
}
export function loadSave():Save{try{return validateSave(JSON.parse(localStorage.getItem(SAVE_KEY)||'null'));}catch{return freshSave();}}
export function persist(s:Save){try{localStorage.setItem(SAVE_KEY,JSON.stringify(s));return true;}catch{return false;}}
export function addEcho(save:Save,echo:Echo):Save{if(save.quest.echoes.includes(echo))return save;return {...save,quest:{...save.quest,echoes:[...save.quest.echoes,echo]},inventory:[...new Set([...save.inventory,echo+'-echo'])]};}
export function grantSword(save:Save):Save{if(save.quest.echoes.length!==3||save.quest.guardian<3)return save;return {...save,quest:{...save.quest,sword:true},inventory:[...new Set([...save.inventory,'dawnwake'])],equipment:{...save.equipment,sword:true}};}
export function objective(s:Save):{title:string;detail:string;world:WorldId;target:[number,number]}{
 if(!s.created)return {title:'A face for every world',detail:'Meet yourself in the enchanted mirror.',world:'home',target:[-7,2]};
 if(s.world==='home'&&!s.quest.sword)return {title:'A world is waiting',detail:'Enter the emerald portal to Lumenreach.',world:'home',target:[-5,-7]};
 if(s.world==='city'&&!s.inventory.includes('velvet-jacket'))return {title:'A different kind of legend',detail:'Meet Sable outside the Velvet Atelier.',world:'city',target:[-6,-8]};
 if(s.world==='city')return {title:'Bring your story home',detail:'Return through the portal with both worlds’ treasures.',world:'city',target:[0,12]};
 if(s.world==='home'&&s.quest.sword&&!s.inventory.includes('velvet-jacket'))return {title:'One character. Another world.',detail:'Step through the violet portal to Velvet City.',world:'home',target:[5,-7]};
 if(s.world==='home'&&!s.home.sword)return {title:'A memory worth keeping',detail:'Mount Dawnwake above the fireplace.',world:'home',target:[-9,-3]};
 if(s.world==='home')return {title:'Your story continues',detail:'Explore, change your look, or return to either world.',world:'home',target:[0,-7]};
 if(!s.quest.accepted)return {title:'The last bell of Lumenreach',detail:'Follow the bridge to Edda in Bellhaven.',world:'lumen',target:[4,-27]};
 if(!s.quest.echoes.includes('forest'))return {title:'The echo of kindness',detail:s.quest.flowers.length===3?'The brambles have opened. Approach the little light.':'Wake the three moonflowers around the trapped creature.',world:'lumen',target:[-25,8]};
 if(!s.quest.echoes.includes('crossing'))return {title:'The echo of courage',detail:!s.quest.mechanism?'Turn the ancient mechanism at the broken crossing.':`Cross the three rising rune stones. ${s.quest.steps}/3 awakened.`,world:'lumen',target:s.quest.mechanism?[-40,-40]:[-24,-28]};
 if(!s.quest.echoes.includes('archive'))return {title:'The echo of belonging',detail:'Rebuild a memory in the archive: light, call, remember.',world:'lumen',target:[15,-48]};
 if(!s.quest.sword)return {title:'Where the dawn sleeps',detail:s.quest.guardian<3?'Answer the guardian’s three memories in Crownstone Sanctuary.':'Approach the stone. Claim Dawnwake.',world:'lumen',target:[33,-38]};
 return {title:'The road between worlds',detail:'A new portal awaits beside Edda in Bellhaven.',world:'lumen',target:[8,-24]};
}
