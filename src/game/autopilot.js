const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Return analog controls; the existing simulation remains responsible for motion.
export function planAutopilot({ speed, remaining, grade, wind, curves }) {
  let target = 7.5;
  for (const { distance, curvature } of curves) {
    const cornerSpeed = Math.sqrt(1.5 / Math.max(curvature, 0.0001));
    target = Math.min(target, Math.sqrt(cornerSpeed ** 2 + 1.6 * Math.max(0, distance - speed * 1.2)));
  }
  target = Math.min(target, 7.5 - clamp(wind, 0, 1) * 3);
  // Leave room for actuator smoothing. Creep until the existing station capture takes over.
  const stopDistance = Math.max(0, remaining - 1.6 - speed * 1.1);
  target = Math.min(target, Math.max(0.65, Math.sqrt(1.6 * stopDistance)));
  const desiredAcceleration = clamp((target - speed) * 1.25, -1.3, 1.15);
  const resistance = speed > 0 ? 0.14 + speed * 0.015 : 0;
  const effort = desiredAcceleration + resistance + grade * 3;
  return {
    target,
    power: effort > 0 ? clamp(effort / 2.35, 0, 1) : 0,
    brake: effort < 0 ? clamp(-effort / 5.2, 0, 1) : 0,
  };
}
