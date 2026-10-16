import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
// Keep moving objects separate; batch static architecture by compatible material.
export function batchStatic(scene: T.Scene, dynamic: T.Object3D[]) {
  scene.updateMatrixWorld(true);
  const blocked = new Set<T.Object3D>();
  for (const root of dynamic) root.traverse((o) => blocked.add(o));
  const groups = new Map<string, T.Mesh[]>();
  scene.traverse((o) => {
    if (
      !(o instanceof T.Mesh) ||
      o instanceof T.InstancedMesh ||
      blocked.has(o) ||
      Array.isArray(o.material)
    )
      return;
    const m = o.material as T.MeshStandardMaterial;
    if (
      !m.isMeshStandardMaterial ||
      o.geometry.attributes.position.count > 10000
    )
      return;
    const key = [
      m.color.getHex(),
      m.roughness,
      m.metalness,
      m.side,
      m.map?.uuid,
      m.vertexColors,
      o.castShadow,
      o.receiveShadow,
    ].join(":");
    const a = groups.get(key) || [];
    a.push(o);
    groups.set(key, a);
  });
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const gs = list.map((mesh) => {
      let g = mesh.geometry.clone();
      if (g.index) g = g.toNonIndexed();
      g.applyMatrix4(mesh.matrixWorld);
      if (!g.attributes.uv)
        g.setAttribute(
          "uv",
          new T.BufferAttribute(
            new Float32Array(g.attributes.position.count * 2),
            2,
          ),
        );
      for (const k of Object.keys(g.attributes))
        if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
      return g;
    });
    const geometry = mergeGeometries(gs);
    if (!geometry) continue;
    const merged = new T.Mesh(geometry, list[0].material);
    merged.castShadow = list[0].castShadow;
    merged.receiveShadow = list[0].receiveShadow;
    scene.add(merged);
    for (const o of list) o.removeFromParent();
    for (const g of gs) g.dispose();
  }
}
