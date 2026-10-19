export const SIZE = 192,
  SEGMENTS = 160;
export function riverZ(x: number) {
  return -12 + Math.sin(x * 0.035) * 5;
}
export function trailX(z: number) {
  return Math.sin(z * 0.045) * 5 + 2;
}
export function ground(x: number, z: number) {
  const base =
    2.4 +
    0.55 * Math.sin(x * 0.07) * Math.cos(z * 0.058) +
    0.35 * Math.sin(z * 0.12 + x * 0.04);
  const hill =
    12 * Math.exp(-((x - 37) ** 2 + (z + 39) ** 2) / 730) +
    6 * Math.exp(-((x + 55) ** 2 + (z - 5) ** 2) / 620);
  const river = Math.abs(z - riverZ(x));
  const cut = river < 6 ? (1 - Math.min(1, river / 6) ** 2) * 4.5 : 0;
  return base + hill - cut;
}
export function hash(a: number, b: number) {
  const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return v - Math.floor(v);
}
export function random(seed: number) {
  let a = seed;
  return () => {
    a = (Math.imul(1664525, a) + 1013904223) >>> 0;
    return a / 4294967296;
  };
}
export function regionAt(x: number, z: number) {
  return x > 21 && z < -21
    ? "The Dawn Terrace"
    : z < -24
      ? "Tizi Village"
      : Math.abs(z - riverZ(x)) < 12
        ? "The Highland Watercourse"
        : "The Cedar Trail";
}
