import { dist2 } from '../math.js';

export function checkCollisions(game, width, height) {
  const bulletHits = [];
  let shipCrash = false;

  // Bullet vs Asteroid (circle-circle approximation)
  for (let i = 0; i < game.bullets.length; i++) {
    const b = game.bullets[i];
    if (b._dead || b.ttl <= 0) continue;
    for (let j = 0; j < game.asteroids.length; j++) {
      const a = game.asteroids[j];
      if (a._dead) continue;
      const r = a.radius + b.r;
      if (dist2(b.x, b.y, a.x, a.y) <= r * r) {
        bulletHits.push({ bulletIndex: i, asteroidIndex: j });
        break; // bullet is consumed
      }
    }
  }

  // Ship vs Asteroid
  if (game.ship && game.ship.invuln <= 0) {
    for (let j = 0; j < game.asteroids.length; j++) {
      const a = game.asteroids[j];
      const r = a.radius + game.ship.radius;
      if (dist2(game.ship.x, game.ship.y, a.x, a.y) <= r * r) {
        shipCrash = true;
        break;
      }
    }
  }

  return { bulletHits, shipCrash };
}

