import { createInput } from './js/input.js';
import { TAU, clamp } from './js/math.js';
import { createShip, updateShip, drawShip, respawnShip } from './js/entities/ship.js';
import { createBullet, updateBullets, drawBullets } from './js/entities/bullet.js';
import { createAsteroid, updateAsteroids, drawAsteroids, splitAsteroid } from './js/entities/asteroid.js';
import { checkCollisions } from './js/systems/collisions.js';
import { spawnWave } from './js/systems/waves.js';
import { createParticles, updateParticles, drawParticles, explode } from './js/systems/particles.js';
import { createAudio } from './js/audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const hud = {
  score: document.getElementById('score'),
  hi: document.getElementById('hiScore'),
  wave: document.getElementById('wave'),
  lives: document.getElementById('lives'),
};

const overlay = document.getElementById('overlay');
const overlayMessage = document.getElementById('overlayMessage');
const startBtn = document.getElementById('startBtn');

const DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
let width = 0, height = 0;

function resize() {
  width = Math.floor(window.innerWidth);
  height = Math.floor(window.innerHeight);
  const w = Math.floor(width * DPR);
  const h = Math.floor(height * DPR);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

window.addEventListener('resize', resize);
resize();

// Game state
const input = createInput();
const audio = createAudio();

const game = {
  scene: 'start', // start | playing | paused | gameover
  score: 0,
  hiScore: Number(localStorage.getItem('asteroids.hi')) || 0,
  wave: 1,
  lives: 3,
  bullets: [],
  asteroids: [],
  particles: createParticles(),
  ship: createShip(width / 2, height / 2),
  pendingRespawn: 0,
};

function resetGame() {
  game.score = 0;
  game.wave = 1;
  game.lives = 3;
  game.bullets.length = 0;
  game.asteroids.length = 0;
  game.particles.items.length = 0;
  game.ship = createShip(width / 2, height / 2);
  respawnShip(game.ship);
  spawnWave(game, width, height);
}

function updateHUD() {
  hud.score.textContent = String(game.score);
  hud.hi.textContent = String(game.hiScore);
  hud.wave.textContent = String(game.wave);
  hud.lives.textContent = String(game.lives);
}

updateHUD();

function startPlaying() {
  if (audio) audio.resume();
  // Если стартуем из начального экрана или после gameover — всегда полный reset
  if (game.scene === 'start' || game.scene === 'gameover') {
    resetGame();
  }
  game.scene = 'playing';
  overlay.classList.add('hidden');
}

startBtn.addEventListener('click', startPlaying);
overlay.addEventListener('click', () => {
  if (game.scene === 'start' || game.scene === 'gameover') startPlaying();
});

let lastTime = performance.now();
function loop(now) {
  const dt = clamp((now - lastTime) / 1000, 0, 1 / 30);
  lastTime = now;

  // Scene transitions
  if (input.wasPressed('start')) {
    if (game.scene === 'start' || game.scene === 'gameover') startPlaying();
  }
  if (input.wasPressed('pause')) {
    if (game.scene === 'playing') {
      game.scene = 'paused';
      overlayMessage.textContent = 'Пауза — нажмите Esc для продолжения';
      overlay.classList.remove('hidden');
    } else if (game.scene === 'paused') {
      game.scene = 'playing';
      overlay.classList.add('hidden');
    }
  }
  if (input.wasPressed('mute') && audio) {
    audio.toggleMute();
  }

  if (game.scene === 'playing') {
    update(dt);
  }
  render();

  input.nextFrame();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function update(dt) {
  // Update ship
  updateShip(game.ship, input, dt, width, height, (spawnThrustParticle) => {
    if (spawnThrustParticle) {
      const p = game.ship;
      // flame behind ship
      const len = 18;
      const bx = p.x - Math.cos(p.angle) * (p.radius + 4);
      const by = p.y - Math.sin(p.angle) * (p.radius + 4);
      game.particles.add(bx, by,
        (Math.random() - 0.5) * 40 - Math.cos(p.angle) * 60,
        (Math.random() - 0.5) * 40 - Math.sin(p.angle) * 60,
        0.25 + Math.random() * 0.25,
        2 + Math.random() * 2,
        'rgba(255,160,64,1)');
    }
  });

  // Shooting
  if (game.ship.canShoot && input.isDown('shoot')) {
    const b = createBullet(game.ship);
    game.bullets.push(b);
    game.ship.didShoot();
    if (audio) audio.shoot();
  }

  updateBullets(game.bullets, dt, width, height);
  updateAsteroids(game.asteroids, dt, width, height);
  updateParticles(game.particles, dt, width, height);

  // Collisions
  const events = checkCollisions(game, width, height);
  // Bullet hits
  for (const hit of events.bulletHits) {
    const { bulletIndex, asteroidIndex } = hit;
    const asteroid = game.asteroids[asteroidIndex];
    if (!asteroid) continue;
    // remove bullet
    if (game.bullets[bulletIndex]) game.bullets[bulletIndex]._dead = true;
    // split asteroid
    const fragments = splitAsteroid(asteroid);
    // score by size
    game.score += asteroid.scoreValue;
    if (game.score > game.hiScore) {
      game.hiScore = game.score;
      localStorage.setItem('asteroids.hi', String(game.hiScore));
    }
    // explosion particles
    explode(game.particles, asteroid.x, asteroid.y, asteroid.radius);
    if (audio) audio.explosion();
    // replace
    asteroid._dead = true;
    for (const f of fragments) game.asteroids.push(f);
  }
  // Ship collisions
  if (events.shipCrash && game.ship.invuln <= 0) {
    // lose life
    if (audio) audio.explosion();
    explode(game.particles, game.ship.x, game.ship.y, 24);
    game.lives -= 1;
    if (game.lives < 0) {
      game.scene = 'gameover';
      overlayMessage.textContent = 'Игра окончена — Enter или Клик для рестарта';
      overlay.classList.remove('hidden');
      return;
    } else {
      respawnShip(game.ship);
    }
  }

  // Cleanup dead bullets/asteroids
  game.bullets = game.bullets.filter(b => !b._dead && b.ttl > 0);
  game.asteroids = game.asteroids.filter(a => !a._dead);

  // Next wave
  if (game.asteroids.length === 0) {
    game.wave += 1;
    spawnWave(game, width, height);
  }

  updateHUD();
}

function render() {
  ctx.clearRect(0, 0, width, height);
  // Space background (subtle stars)
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 30; i++) {
    const x = (i * 73) % width;
    const y = ((i * 137) % height);
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();

  drawAsteroids(ctx, game.asteroids);
  drawBullets(ctx, game.bullets);
  drawShip(ctx, game.ship);
  drawParticles(ctx, game.particles);

  if (game.scene === 'paused') {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}
