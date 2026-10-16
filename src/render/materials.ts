import * as THREE from "three";
export const palette = {
  grass: "#6f8f48",
  leaf: "#527844",
  pine: "#345f48",
  bark: "#685543",
  stone: "#9b9e8d",
  cream: "#e4d8b5",
  roof: "#516e73",
  timber: "#68503a",
};
export function material(color: string, roughness = 0.95) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}
export function noiseTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!,
    d = ctx.createImageData(256, 256);
  let seed = 18;
  for (let i = 0; i < d.data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const v = 210 + (seed % 45);
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  ctx.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(32, 32);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
