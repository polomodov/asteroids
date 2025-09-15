import { wrap } from '../math.js';

export function createBullet(ship) {
  const speed = 580;
  const bx = ship.x + Math.cos(ship.angle) * (ship.radius + 2);
  const by = ship.y + Math.sin(ship.angle) * (ship.radius + 2);
  return {
    x: bx,
    y: by,
    vx: Math.cos(ship.angle) * speed + ship.vx * 0.2,
    vy: Math.sin(ship.angle) * speed + ship.vy * 0.2,
    ttl: 1.15,
    r: 2,
    _dead: false,
  };
}

export function updateBullets(bullets, dt, width, height) {
  for (const b of bullets) {
    b.ttl -= dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < 0) b.x += width; else if (b.x >= width) b.x -= width;
    if (b.y < 0) b.y += height; else if (b.y >= height) b.y -= height;
  }
}

export function drawBullets(ctx, bullets) {
  ctx.save();
  ctx.fillStyle = '#fff';
  for (const b of bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

