import { createAsteroid } from '../entities/asteroid.js';

export function spawnWave(game, width, height) {
  const count = 3 + Math.min(6, game.wave);
  const safe = 150;
  for (let i = 0; i < count; i++) {
    let x, y;
    // Spawn on edges
    const side = Math.random();
    if (side < 0.25) { x = 0; y = Math.random() * height; }
    else if (side < 0.5) { x = width; y = Math.random() * height; }
    else if (side < 0.75) { x = Math.random() * width; y = 0; }
    else { x = Math.random() * width; y = height; }

    // Keep away from ship
    const dx = x - game.ship.x;
    const dy = y - game.ship.y;
    if (dx * dx + dy * dy < safe * safe) {
      i--; continue; // retry
    }
    const r = 42 + Math.random() * 10;
    game.asteroids.push(createAsteroid(x, y, r));
  }
}

