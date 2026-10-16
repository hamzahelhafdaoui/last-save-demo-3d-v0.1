import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type {Appearance} from '../state/model';
import {makeSword, box, mat} from './kit';
let template:Promise<T.Group>|null=null;
export class Traveler {
  root = new T.Group();
  visual: T.Object3D;
  private parts = new Map<string, T.Object3D>();
  private base = new Map<string, T.Vector3>();
  private gait = 0;
  sword=makeSword();
  private jacket=new T.Group();
  private appearanceKey='';
  private constructor(visual: T.Object3D) {
    this.visual = visual;
    this.root.add(visual);
    this.root.rotation.y = Math.PI;
    visual.traverse((o) => {
      if ((o as T.Mesh).isMesh) {
        const m = o as T.Mesh;
        if(!Array.isArray(m.material)) m.material=m.material.clone();
        m.castShadow = true;
        m.receiveShadow = true;
      }
      this.parts.set(o.name, o);
      this.base.set(o.name, o.position.clone());
    });
    this.sword.scale.setScalar(.72);
    this.sword.position.set(.22,1.18,-.23);this.sword.rotation.set(.1,0,-.48);
    this.root.add(this.sword);this.sword.visible=false;
    box(this.jacket,0,1.02,0,.58,.52,.44,'#24263e');
    box(this.jacket,0,1.27,-.02,.55,.12,.42,'#e3bc82');
    for(const s of [-1,1]){const lapel=box(this.jacket,s*.16,1.19,.24,.13,.34,.07,'#d6ab84');lapel.rotation.z=-s*.28;box(this.jacket,s*.2,.92,.245,.14,.035,.025,'#8c57ad');}
    this.root.add(this.jacket);this.jacket.visible=false;
  }
  static async load() {
    template ||= new GLTFLoader().loadAsync('/assets/traveler.glb').then(g=>g.scene);
    return new Traveler((await template).clone(true));
  }
  appearance(a:Appearance,jacket=false,sword=false){
    this.sword.visible=sword;this.jacket.visible=jacket;
    const key=JSON.stringify(a)+jacket;if(key===this.appearanceKey)return;this.appearanceKey=key;
    this.visual.traverse(o=>{if(!(o instanceof T.Mesh)||Array.isArray(o.material))return;const m=o.material as T.MeshStandardMaterial;
      if(m.name.includes('Warm ochre'))m.color.set(a.fur);
      if(m.name.includes('Deep teal'))m.color.set(jacket?'#24263e':a.primary);
      if(m.name.includes('Scarf amber'))m.color.set(a.secondary);
      if(m.name.includes('Forelock'))m.color.set(a.hair);
      if(o.name.startsWith('Eye')&&!o.name.includes('white')&&!o.name.includes('sparkle'))m.color.set(a.eyes);
      if(o.name.startsWith('Forelock'))o.scale.setScalar(1+a.hairStyle*.28);
      if(o.name.startsWith('Ear'))o.scale.y=a.preset==='moon'?.72:a.preset==='russet'?1.16:1;
      if(o.name.includes('Satchel')||o.name.includes('strap'))o.visible=a.accessory;
    });
  }
  pose(reach:number,strain:number,raise:number,grip:number){
    const part=(n:string)=>this.parts.get(n)!;
    part('Arm_R').rotation.x=-reach*1.65-raise*.95;part('Arm_L').rotation.x=-reach*1.2-raise*.7;
    part('Forearm_R').rotation.x=-.3-reach*.55+raise*.3;part('Forearm_L').rotation.x=-.35-reach*.7;
    part('Body').rotation.x=strain*.24;part('Head').rotation.x=-raise*.3;
    for(const side of ['L','R'])for(let i=0;i<3;i++){const p=this.parts.get('Finger_'+side+'_'+i);if(p)p.rotation.x=grip*1.25;}
  }
  handPosition(){const p=this.parts.get('Paw_R')||this.parts.get('Forearm_R')!;return p.getWorldPosition(new T.Vector3());}
  update(
    position: { x: number; y: number; z: number },
    velocity: { x: number; y: number; z: number },
    grounded: boolean,
    dt: number,
    time: number,
  ) {
    this.root.position.set(position.x, position.y, position.z);
    const speed = Math.hypot(velocity.x, velocity.z),
      moving = Math.min(1, speed / 2),
      run = Math.min(1, Math.max(0, (speed - 3) / 3));
    if (speed > 0.12) {
      const target = Math.atan2(velocity.x, velocity.z);
      const delta =
        T.MathUtils.euclideanModulo(
          target - this.root.rotation.y + Math.PI,
          Math.PI * 2,
        ) - Math.PI;
      this.root.rotation.y += delta * (1 - Math.exp(-dt * 12));
    }
    this.gait += dt * (speed > 3.5 ? 11 : 8) * moving;
    const swing = Math.sin(this.gait) * (run * 0.3 + 0.42) * moving;
    for (const [name, side] of [
      ["Arm_L", 1],
      ["Arm_R", -1],
      ["Leg_L", -1],
      ["Leg_R", 1],
    ] as const) {
      const o = this.parts.get(name);
      if (o)
        o.rotation.x = grounded
          ? swing * side
          : name.startsWith("Arm")
            ? -0.35
            : 0.3;
    }
    for (const name of ["Forearm_L", "Forearm_R"]) {
      const o = this.parts.get(name);
      if (o) o.rotation.x = -0.18 - run * 0.45;
    }
    const body = this.parts.get("Body");
    if (body) {
      body.position.y =
        this.base.get("Body")!.y +
        (grounded ? Math.abs(Math.sin(this.gait)) * moving * 0.045 : 0);
      body.rotation.x = run * 0.1;
      body.rotation.z = Math.sin(this.gait) * moving * 0.025;
    }
    const head = this.parts.get("Head");
    if (head) {
      head.rotation.z = Math.sin(time * 0.8) * 0.025 * (1 - moving);
      head.rotation.x = -run * 0.04;
    }
    const tail = this.parts.get("Tail");
    if (tail)
      tail.rotation.z =
        Math.sin(time * 3) * 0.12 + Math.sin(this.gait) * moving * 0.15;
  }
}
