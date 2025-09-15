export function createParticles() {
  const p = { items: [] };
  p.add = (x, y, vx, vy, life, size, color) => p.items.push({ x, y, vx, vy, life, ttl: life, size, color });
  return p;
}

export function updateParticles(particles, dt, width, height) {
  const arr = particles.items;
  for (let i = 0; i < arr.length; i++) {
    const p = arr[i];
    p.ttl -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.x < 0) p.x += width; else if (p.x >= width) p.x -= width;
    if (p.y < 0) p.y += height; else if (p.y >= height) p.y -= height;
  }
  particles.items = arr.filter(p => p.ttl > 0);
}

export function drawParticles(ctx, particles) {
  const arr = particles.items;
  for (let i = 0; i < arr.length; i++) {
    const p = arr[i];
    const a = Math.max(0, p.ttl / p.life);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function explode(particles, x, y, radius = 24) {
  const n = 12 + (radius / 4 | 0);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 60 + Math.random() * 200;
    particles.add(x, y, Math.cos(a) * sp, Math.sin(a) * sp, 0.6 + Math.random() * 0.6, 2 + Math.random() * 2, 'rgba(255,200,80,1)');
  }
}
