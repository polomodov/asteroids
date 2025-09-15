export const TAU = Math.PI * 2;

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function wrap(v, max) {
  if (v < 0) return v + max;
  if (v >= max) return v - max;
  return v;
}

export function dist2(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function angleToVector(a) {
  return { x: Math.cos(a), y: Math.sin(a) };
}

export function randRange(min, max) {
  return min + Math.random() * (max - min);
}

export function choice(arr) {
  return arr[(Math.random() * arr.length) | 0];
}

