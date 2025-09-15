import { TAU, wrap } from '../math.js';

export function createShip(x, y) {
  return {
    x, y,
    vx: 0, vy: 0,
    angle: -Math.PI / 2, // facing up
    radius: 12,
    turnSpeed: 3.6, // rad/s
    thrust: 240, // px/s^2
    maxSpeed: 420,
    drag: 0.995, // per-frame base at 60fps
    cooldown: 0,
    fireDelay: 0.22,
    invuln: 2.0,
    blink: 0,
    canShoot: true,
  };
}

export function respawnShip(ship) {
  ship.x = window.innerWidth / 2;
  ship.y = window.innerHeight / 2;
  ship.vx = ship.vy = 0;
  ship.angle = -Math.PI / 2;
  ship.invuln = 2.0;
  ship.blink = 0;
}

export function updateShip(ship, input, dt, width, height, spawnThrustParticleCb) {
  // Rotation
  if (input.isDown('left')) ship.angle -= ship.turnSpeed * dt;
  if (input.isDown('right')) ship.angle += ship.turnSpeed * dt;
  if (ship.angle > TAU) ship.angle -= TAU;
  if (ship.angle < 0) ship.angle += TAU;

  // Thrust
  let thrusting = false;
  if (input.isDown('thrust')) {
    thrusting = true;
    ship.vx += Math.cos(ship.angle) * ship.thrust * dt;
    ship.vy += Math.sin(ship.angle) * ship.thrust * dt;
    if (spawnThrustParticleCb) spawnThrustParticleCb(true);
  } else if (spawnThrustParticleCb) {
    spawnThrustParticleCb(false);
  }

  // Clamp speed
  const speed = Math.hypot(ship.vx, ship.vy);
  if (speed > ship.maxSpeed) {
    const s = ship.maxSpeed / speed;
    ship.vx *= s; ship.vy *= s;
  }

  // Drag (dt adjusted)
  const drag = Math.pow(ship.drag, dt * 60);
  ship.vx *= drag; ship.vy *= drag;

  // Position + wrap
  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;
  if (ship.x < 0) ship.x += width; else if (ship.x >= width) ship.x -= width;
  if (ship.y < 0) ship.y += height; else if (ship.y >= height) ship.y -= height;

  // Cooldown
  ship.cooldown -= dt;
  ship.canShoot = ship.cooldown <= 0;

  // Invuln flicker
  if (ship.invuln > 0) {
    ship.invuln -= dt;
    ship.blink += dt * 20;
  }

  ship.didShoot = function didShoot() {
    ship.cooldown = ship.fireDelay;
  };
}

export function drawShip(ctx, ship) {
  // Flicker if invuln
  if (ship.invuln > 0) {
    if (((ship.blink | 0) % 2) === 0) return; // invisible on alternating frames
  }
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-10, 8);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-10, -8);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

