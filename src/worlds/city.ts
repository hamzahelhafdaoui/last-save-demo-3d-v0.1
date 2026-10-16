import {batchStatic} from '../render/optimize';
import * as T from 'three';
import {Physics} from '../physics/world';
import {box,ball,cyl,mesh,mat,text,lantern,portal,Motes,disposeScene} from '../render/kit';
import {resident,animateResidents,updatePortals,type Resident} from './common';
import type {World} from './types';
export async function createWorld():Promise<World>{
 const scene=new T.Scene(),physics=new Physics(()=>0,25);scene.background=new T.Color('#0b1028');scene.fog=new T.FogExp2('#11152e',.014);scene.add(new T.HemisphereLight('#6a76bf','#29253e',1.4));const sun=new T.DirectionalLight('#b3baff',1.3);sun.position.set(-10,24,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-26,right:26,top:30,bottom:-30,far:80});scene.add(sun);
 const pavement=mesh(scene,new T.PlaneGeometry(70,70),new T.MeshStandardMaterial({color:'#232b43',roughness:.19,metalness:.55}));pavement.rotation.x=-Math.PI/2;
 for(let z=-24;z<=24;z+=2){box(scene,0,.015,z,18,.025,.025,'#45435b');for(const x of [-8,8])box(scene,x,.09,z,2,.18,1.95,'#45425b');}
 for(let i=0;i<8;i++){const z=-24+i*7;for(const s of [-1,1]){const x=s*(12+(i%2)*1.4),h=9+(i%3)*5;box(scene,x,h/2,z,6,h,6,'#252c48');physics.box(x,h/2,z,3,h/2,3);box(scene,x,h-.4,z,6.3,.22,6.3,'#5c536f');for(let f=1;f<h/2;f++)for(let w=0;w<3;w++){const window=box(scene,x-s*3.03,f*2,z-1.8+w*1.8,.055,1.1,.7,(f+w+i)%4?'#6877a0':'#d6ac86');(window.material as T.MeshStandardMaterial).emissiveIntensity=(f+w+i)%4?.45:1.1;}const color=i%2?'#b37ddd':'#6ad1d8';box(scene,x-s*3.1,3.7,z,.06,.09,5.8,color);}}
 // Original boutique facade and an open invitation, framed with silk-colored light.
 const boutique=new T.Group();boutique.position.set(-8.6,0,-8);scene.add(boutique);box(boutique,0,2.6,0,.3,5.2,6.2,'#6c486b');box(boutique,.2,1.8,0,.1,3.2,4.4,'#2c263f');for(const z of [-2.6,2.6])box(boutique,.35,2.8,z,.1,4.5,.07,'#e8a2d4');
 const sign=text(boutique,'VELVET ATELIER',.5,5.1,0,5,'#f2b4df');sign.rotation.y=Math.PI/2;
 const hanging=text(scene,'V E L V E T',-6,5,-10,4,'#ef9ed8');hanging.rotation.y=.3;
 // A visible jacket in the shop window makes the collectible concrete.
 const jacket=new T.Group();jacket.position.set(-7.9,1.65,-8);scene.add(jacket);box(jacket,0,.6,0,.85,.9,.32,'#c08e9c');for(const s of [-1,1]){const sleeve=box(jacket,s*.58,.65,0,.32,.8,.35,'#b78294');sleeve.rotation.z=s*.25;box(jacket,s*.2,.85,.2,.16,.5,.07,'#e7c8a3');}cyl(jacket,0,-.1,0,.035,.9,'#b8a4b5');cyl(jacket,0,-.58,0,.55,.05,'#4e4661');jacket.rotation.y=Math.PI/2;
 const lit=new T.PointLight('#ed84c4',22,14,2);lit.position.set(-6,3,-8);scene.add(lit);const teal=new T.PointLight('#6be4e4',24,16,2);teal.position.set(7,4,4);scene.add(teal);
 for(const [x,z,c] of [[-6,7,'#ee9ac9'],[6,1,'#7fe2e3'],[-6,-16,'#d6aeff'],[6,-20,'#edb881']] as [number,number,string][]){cyl(scene,x,2.4,z,.055,4.8,'#4b4965');lantern(scene,x,4.7,z,c);const pool=mesh(scene,new T.CircleGeometry(3.3,32),new T.MeshBasicMaterial({color:c,transparent:true,opacity:.09,depthWrite:false,blending:T.AdditiveBlending}),[x,.025,z]);pool.rotation.x=-Math.PI/2;}
 for(let i=0;i<4;i++){const z=-2+i*5,x=5.5;cyl(scene,x,.72,z,.8,.12,'#756179');for(const dx of [-1.2,1.2]){cyl(scene,x+dx,.45,z,.35,.1,'#a0858a');box(scene,x+dx,.65,z+.2,.6,.6,.1,'#614960');}cyl(scene,x,1.8,z,.035,3.6,'#ba9f8d');const umbrella=mesh(scene,new T.ConeGeometry(1.7,.55,12),mat(i%2?'#795a88':'#64758d'),[x,3.25,z]);cyl(scene,x,.9,z,.08,.24,'#dfbeab');}
 for(const x of [-7.4,7.4])for(const z of [-19,-1,15]){box(scene,x,.4,z,1.3,.8,1.3,'#565067');for(let i=0;i<7;i++){const leaf=mesh(scene,new T.SphereGeometry(.7,12,8),mat('#427e71'),[x+Math.sin(i)*.25,1+i%3*.2,z+Math.cos(i)*.2]);leaf.scale.set(.5,1.1,.5);}}
 const cafe=text(scene,'MOON / MILK',8,4.4,5,4,'#8ddedc');cafe.rotation.y=-Math.PI/2;text(scene,'THE NIGHT IS YOURS',0,7,-23,12,'#ad9ed6');
 // A distant skyline uses pooled silhouettes and lit windows beyond the physical street.
 for(let i=0;i<20;i++){const x=-60+i*6.5,h=12+(i*7)%23;box(scene,x,h/2,-42-i%3*5,4,h,5,i%2?'#171b37':'#232345');for(let j=0;j<7;j++)box(scene,x,h*.15+j*h*.1,-39.4-i%3*5,2,.15,.02,j%3?'#806eab':'#598baf');}
 const home=portal(scene,0,0,16,'#d5b18c','THE WAYFARER’S ROOM');home.rotation.y=Math.PI;const lumen=portal(scene,0,0,-23,'#8cdbbb','LUMENREACH');
 const residents:Resident[]=await Promise.all([resident(scene,-5,0,-7,'#bd879c',1),resident(scene,2,0,3,'#4b6b82',2,true),resident(scene,-3,0,-14,'#72547d',3,true),resident(scene,4,0,-11,'#c39c77',4,true),resident(scene,-3,0,9,'#516e71',5,true)]);for(const n of residents)n.actor.appearance({name:'Resident',preset:'moon',fur:'#b9a8bd',hair:'#4b4058',hairStyle:n.phase%3,eyes:'#4d7d8c',primary:'#494564',secondary:'#c89eac',accessory:false},true,false);
 text(scene,'SABLE',-5,2.35,-7,2,'#f0b9d9');const motes=new Motes(scene,75,45,'#a6a7e6');
 batchStatic(scene,[home,lumen,jacket,motes.object,...residents.map(n=>n.actor.root)]);
 return {id:'city',scene,physics,spawn:[0,11],sun,interactions:[{id:'sable',position:new T.Vector3(-5,0,-5.5),label:'Talk to Sable',radius:3},{id:'boutique',position:new T.Vector3(-6,0,-9),label:'Try the Velvet jacket',radius:2.8},{id:'portal-home',position:new T.Vector3(0,0,13),label:'Bring your story home'},{id:'portal-lumen',position:new T.Vector3(0,0,-21),label:'Return to Lumenreach'}],update(t,dt,s){animateResidents(residents,t,dt);updatePortals(scene,t);motes.update(t);jacket.rotation.y=Math.PI/2+Math.sin(t*.35)*.15;lit.intensity=22+Math.sin(t*.7);},dispose(){physics.dispose();disposeScene(scene);}};
}
