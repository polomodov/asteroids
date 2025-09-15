import { randRange } from '../math.js';

export function createAsteroid(x, y, radius) {
  const speed = randRange(40, 90) * (radius / 46);
  const dir = randRange(0, Math.PI * 2);
  const sides = 10 + (Math.random() * 5 | 0);
  const shape = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    const r = radius * randRange(0.75, 1.1);
    shape.push({ a, r });
  }
  return {
    x, y,
    vx: Math.cos(dir) * speed,
    vy: Math.sin(dir) * speed,
    angle: randRange(0, Math.PI * 2),
    spin: randRange(-0.7, 0.7),
    radius,
    shape,
    _dead: false,
    scoreValue: radius >= 40 ? 20 : radius >= 24 ? 50 : 100,
  };
}

export function updateAsteroids(asteroids, dt, width, height) {
  for (const a of asteroids) {
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    if (a.x < 0) a.x += width; else if (a.x >= width) a.x -= width;
    if (a.y < 0) a.y += height; else if (a.y >= height) a.y -= height;
    a.angle += a.spin * dt;
  }
}

export function drawAsteroids(ctx, asteroids) {
  ctx.save();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  for (const a of asteroids) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle);
    ctx.beginPath();
    for (let i = 0; i < a.shape.length; i++) {
      const { a: ang, r } = a.shape[i];
      const x = Math.cos(ang) * r;
      const y = Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

export function splitAsteroid(asteroid) {
  const res = [];
  const r = asteroid.radius;
  if (r > 18) {
    const r1 = r * 0.6;
    const r2 = r * 0.5;
    res.push(createAsteroid(asteroid.x, asteroid.y, r1));
    res.push(createAsteroid(asteroid.x, asteroid.y, r2));
  }
  return res;
}

