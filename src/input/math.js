export function radialStick(x, y, radius, deadzone = 0.13) {
  const length = Math.hypot(x, y),
    raw = Math.min(1, length / radius);
  if (raw <= deadzone) return { x: 0, y: 0, strength: 0 };
  const strength = (raw - deadzone) / (1 - deadzone);
  return { x: (x / length) * strength, y: (-y / length) * strength, strength };
}
export function cameraRelative(x, y, yaw) {
  const length = Math.hypot(x, y),
    scale = length > 1 ? 1 / length : 1;
  return {
    x: (x * Math.cos(yaw) - y * Math.sin(yaw)) * scale,
    z: (-x * Math.sin(yaw) - y * Math.cos(yaw)) * scale,
  };
}
