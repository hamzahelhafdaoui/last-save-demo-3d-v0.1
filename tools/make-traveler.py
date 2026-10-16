import bpy, math
from mathutils import Vector
from pathlib import Path
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(name,color,rough=.8):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*color,1);m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=rough;return m
fur=mat('Warm ochre fur',(.64,.33,.14)); cream=mat('Cream muzzle',(.96,.80,.53)); inner=mat('Ear velvet',(.32,.12,.08)); ink=mat('Eyes and nose',(.032,.043,.045),.3);white=mat('Eye light',(.95,.96,.86));coat=mat('Deep teal wool',(.055,.25,.26));trim=mat('Scarf amber',(.89,.53,.16));leather=mat('Boots and satchel',(.20,.115,.075));pants=mat('Slate linen',(.19,.25,.27));hair=mat('Forelock',(.39,.18,.085));metal=mat('Warm brass',(.7,.54,.25),.45)
def empty(name,loc,parent=None):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=loc;o.parent=parent;return o
def uv(name,loc,scale,material,parent=None):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,location=(0,0,0));o=bpy.context.object;o.name=name;o.parent=parent;o.location=loc;o.scale=scale;o.data.materials.append(material)
 for f in o.data.polygons:f.use_smooth=True
 return o
def box(name,loc,scale,material,parent=None,bevel=.06):
 bpy.ops.mesh.primitive_cube_add(size=1);o=bpy.context.object;o.name=name;o.parent=parent;o.location=loc;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material);mod=o.modifiers.new('Soft crafted edges','BEVEL');mod.width=bevel;mod.segments=3;mod=o.modifiers.new('Weighted corners','WEIGHTED_NORMAL');return o
root=empty('Traveler',(0,0,0));body=empty('Body',(0,0,.86),root)
uv('Tunic',(0,0,.20),(.29,.21,.39),coat,body);box('Belt',(0,-.01,-.04),(.53,.40,.075),leather,body,.035);box('Buckle',(0,-.225,-.04),(.10,.035,.075),metal,body,.016)
# Scarf and folded tail.
uv('Collar',(0,0,.51),(.22,.20,.09),trim,body);scarf=box('Scarf fold',(.13,-.23,.32),(.13,.055,.34),trim,body,.035);scarf.rotation_euler[1]=-.18
head=empty('Head',(0,0,.70),body);uv('Head fur',(0,0,.02),(.30,.25,.30),fur,head);uv('Muzzle',(0,-.22,-.075),(.23,.13,.15),cream,head);uv('Nose',(0,-.34,-.025),(.065,.048,.045),ink,head)
for side in [-1,1]:
 ear=uv('Ear',(.205*side,.015,.27),(.10,.085,.21),fur,head);ear.rotation_euler[1]=side*.25
 e=uv('Inner ear',(.205*side,-.055,.28),(.06,.025,.14),inner,head);e.rotation_euler[1]=side*.25
 uv('Eye white',(.125*side,-.205,.065),(.075,.045,.09),white,head);uv('Eye',(.125*side,-.245,.065),(.034,.02,.052),ink,head);uv('Eye sparkle',(.118*side,-.264,.085),(.011,.006,.015),white,head)
 fore=uv('Forelock',(.035*side,-.09,.28),(.09,.11,.11),hair,head);fore.rotation_euler[1]=side*.4
for side,suffix in [(-1,'L'),(1,'R')]:
 arm=empty('Arm_'+suffix,(side*.30,0,.37),body);uv('Sleeve_'+suffix,(side*.04,0,-.12),(.12,.13,.20),coat,arm)
 lower=empty('Forearm_'+suffix,(side*.04,0,-.27),arm);uv('Cuff_'+suffix,(0,0,-.045),(.09,.10,.11),coat,lower);uv('Paw_'+suffix,(0,-.015,-.18),(.095,.085,.115),fur,lower)
 leg=empty('Leg_'+suffix,(side*.14,0,-.11),body);uv('Trouser_'+suffix,(0,0,-.19),(.115,.12,.24),pants,leg)
 shin=empty('Shin_'+suffix,(0,0,-.35),leg);uv('Boot_'+suffix,(0,-.025,-.18),(.12,.15,.18),leather,shin);box('Sole_'+suffix,(0,-.055,-.28),(.24,.34,.07),leather,shin,.045)
# Small authored finger pivots allow a real hand closure during Dawnwake extraction.
for suffix in ['L','R']:
 paw=bpy.data.objects.get('Forearm_'+suffix)
 for i in range(3):
  finger=empty('Finger_'+suffix+'_'+str(i),((i-1)*.04,-.035,-.245),paw)
  uv('Digit_'+suffix+'_'+str(i),(0,-.025,-.035),(.024,.035,.065),fur,finger)
# A curved tail and small travel bag give a readable silhouette from behind.
tail=empty('Tail',(0,.15,-.03),body)
for i in range(5):
 uv('Tail fur',(0,.12+i*.075,-.07-i*.065),(.14-i*.008,.15,.15),cream if i>2 else fur,tail)
bag=box('Satchel',(-.27,.08,.05),(.22,.22,.28),leather,body,.06);box('Satchel flap',(-.27,-.043,.12),(.23,.045,.13),metal,body,.03)
strap=box('Shoulder strap',(-.13,-.213,.25),(.06,.035,.50),leather,body,.015);strap.rotation_euler[1]=-.50
# GLB uses meters, Y up, +Z forward, grounded origin and stable animation pivots.
for o in list(bpy.context.scene.objects):
 if o.type=='MESH':
  bpy.context.view_layer.objects.active=o;o.select_set(True)
  bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
  o.select_set(False)
path=Path(__file__).resolve().parents[1] / 'public/assets/traveler.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',export_yup=True,export_apply=True)
print('EXPORTED',path)
