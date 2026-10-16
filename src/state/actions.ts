import {addEcho,grantSword,type Save} from './model';
export type ActionResult={save:Save;message?:string;reward?:string};
export function act(s:Save,id:string):ActionResult{
 let next:Save=structuredClone(s); const q=next.quest;
 if(id==='accept'){q.accepted=true;return {save:next};}
 if(id.startsWith('flower-')){if(!q.accepted)return {save:s,message:'Edda in Bellhaven knows why these flowers are sleeping.'};const n=Number(id.slice(-1));if(![0,1,2].includes(n))return {save:s};if(!q.flowers.includes(n))q.flowers.push(n);return {save:next,message:q.flowers.length===3?'The brambles loosen. The little light is free.':'A moonflower opens. Something stirs in the brambles.'};}
 if(id==='forest-echo'){if(q.flowers.length!==3)return {save:s,message:'Wake all three moonflowers to loosen the brambles.'};if(q.echoes.includes('forest'))return {save:s};return {save:addEcho(next,'forest'),reward:'forest'};}
 if(id==='mechanism'){if(!q.echoes.includes('forest'))return {save:s,message:'The mechanism needs the warmth of the forest’s echo.'};q.mechanism=true;return {save:next,message:'The crossing wakes. Jump from one golden rune to the next.'};}
 if(id.startsWith('step-')){const n=Number(id.slice(-1));if(q.mechanism&&n===q.steps)q.steps=Math.min(3,q.steps+1);return {save:next};}
 if(id==='crossing-echo'){if(q.steps<3)return {save:s,message:'Awaken all three rune stones by standing on them.'};if(q.echoes.includes('crossing'))return {save:s};return {save:addEcho(next,'crossing'),reward:'crossing'};}
 if(id.startsWith('memory-')){if(!q.echoes.includes('crossing'))return {save:s,message:'The memory is faint. Find courage at the crossing first.'};const n=Number(id.slice(-1));if(q.echoes.includes('archive'))return {save:s};if(n===q.memory){q.memory++;if(q.memory===3)return {save:addEcho(next,'archive'),reward:'archive'};return {save:next,message:n===0?'A lantern on the road. Who called them home?':'The bell rings. Now keep the memory.'};}q.memory=0;return {save:next,message:'The memory unravels. First light the road, then call them home, then remember.'};}
 if(id.startsWith('guardian-')){if(q.echoes.length<3)return {save:s,message:'Three echoes must answer the guardian.'};const n=Number(id.slice(-1));if(n===q.guardian)q.guardian++;else q.guardian=0;return {save:next,message:q.guardian===3?'The guardian bows. Dawnwake is yours to claim.':n===q.guardian-1?['Kindness. A light kept safe.','Courage. A road crossed together.'][n]:'Listen again: kindness, courage, belonging.'};}
 if(id==='sword'){if(q.echoes.length<3||q.guardian<3)return {save:s,message:'The guardian has not yet entrusted you with the dawn.'};return {save:grantSword(next),reward:!s.quest.sword?'dawnwake':undefined};}
 if(id==='jacket'){if(!q.sword)return {save:s,message:'Sable is waiting to see a story worth wearing.'};if(!next.inventory.includes('velvet-jacket'))next.inventory.push('velvet-jacket');next.equipment.jacket=true;return {save:next,reward:!s.inventory.includes('velvet-jacket')?'jacket':undefined};}
 if(id==='display'){if(!q.sword)return {save:s,message:'Every story leaves something worth keeping here.'};next.home.sword=true;next.equipment.sword=false;return {save:next};}
 return {save:s};
}
