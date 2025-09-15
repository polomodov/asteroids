(() => {
  'use strict';

  // ---- math utils ----
  const TAU = Math.PI * 2;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx*dx + dy*dy; };
  const randRange = (min, max) => min + Math.random() * (max - min);

  // ---- input ----
  function createInput() {
    const down = new Set();
    const pressed = new Set();
    const keyToAction = (code) => {
      switch (code) {
        case 'ArrowLeft': case 'KeyA': return 'left';
        case 'ArrowRight': case 'KeyD': return 'right';
        case 'ArrowUp': case 'KeyW': return 'thrust';
        case 'Space': return 'shoot';
        case 'Escape': return 'pause';
        case 'Enter': return 'start';
        case 'KeyM': return 'mute';
        default: return null;
      }
    };
    function onKeyDown(e){ const a = keyToAction(e.code); if(!a) return; if(e.repeat && (a==='pause'||a==='start'||a==='mute')) return; down.add(a); pressed.add(a); if (a!=='shoot') e.preventDefault(); }
    function onKeyUp(e){ const a = keyToAction(e.code); if(!a) return; down.delete(a); if (a!=='shoot') e.preventDefault(); }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return {
      isDown: a => down.has(a),
      wasPressed: a => { const had = pressed.has(a); if(had) pressed.delete(a); return had; },
      nextFrame(){ pressed.delete('pause'); pressed.delete('start'); pressed.delete('mute'); },
    };
  }

  // ---- particles ----
  function createParticles(){ const p={items:[]}; p.add=(x,y,vx,vy,life,size,color)=>p.items.push({x,y,vx,vy,life,ttl:life,size,color}); return p; }
  function updateParticles(particles, dt, width, height){
    const arr = particles.items;
    for(let i=0;i<arr.length;i++){
      const p=arr[i]; p.ttl-=dt; p.x+=p.vx*dt; p.y+=p.vy*dt;
      if (p.x<0) p.x+=width; else if (p.x>=width) p.x-=width;
      if (p.y<0) p.y+=height; else if (p.y>=height) p.y-=height;
    }
    particles.items = arr.filter(p=>p.ttl>0);
  }
  function drawParticles(ctx, particles){
    for (let i=0;i<particles.items.length;i++){
      const p=particles.items[i]; const a=Math.max(0,p.ttl/p.life);
      ctx.save(); ctx.globalAlpha=a; ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,TAU); ctx.fill(); ctx.restore();
    }
  }
  function explode(particles,x,y,radius=24){
    const n = 12 + (radius/4|0);
    for(let i=0;i<n;i++){
      const a = Math.random()*TAU; const sp = 60 + Math.random()*200;
      particles.add(x,y, Math.cos(a)*sp, Math.sin(a)*sp, 0.6+Math.random()*0.6, 2+Math.random()*2, 'rgba(255,200,80,1)');
    }
  }

  // ---- ship ----
  function createShip(x,y){
    return { x,y, vx:0,vy:0, angle:-Math.PI/2, radius:12, turnSpeed:3.6, thrust:240, maxSpeed:420, drag:0.995, cooldown:0, fireDelay:0.22, invuln:2.0, blink:0, canShoot:true, didShoot(){ this.cooldown=this.fireDelay; } };
  }
  function respawnShip(ship){ ship.x=window.innerWidth/2; ship.y=window.innerHeight/2; ship.vx=ship.vy=0; ship.angle=-Math.PI/2; ship.invuln=2.0; ship.blink=0; }
  function updateShip(ship,input,dt,width,height,thrustCb){
    if (input.isDown('left')) ship.angle -= ship.turnSpeed*dt;
    if (input.isDown('right')) ship.angle += ship.turnSpeed*dt;
    if (ship.angle>TAU) ship.angle-=TAU; if (ship.angle<0) ship.angle+=TAU;
    if (input.isDown('thrust')){
      ship.vx += Math.cos(ship.angle)*ship.thrust*dt;
      ship.vy += Math.sin(ship.angle)*ship.thrust*dt;
      thrustCb && thrustCb(true);
    } else if (thrustCb) thrustCb(false);
    const speed = Math.hypot(ship.vx, ship.vy);
    if (speed>ship.maxSpeed){ const s=ship.maxSpeed/speed; ship.vx*=s; ship.vy*=s; }
    const drag = Math.pow(ship.drag, dt*60); ship.vx*=drag; ship.vy*=drag;
    ship.x += ship.vx*dt; ship.y += ship.vy*dt;
    if (ship.x<0) ship.x+=width; else if (ship.x>=width) ship.x-=width;
    if (ship.y<0) ship.y+=height; else if (ship.y>=height) ship.y-=height;
    ship.cooldown -= dt; ship.canShoot = ship.cooldown<=0;
    if (ship.invuln>0){ ship.invuln -= dt; ship.blink += dt*20; }
  }
  function drawShip(ctx,ship){
    if (ship.invuln>0){ if (((ship.blink|0)%2)===0) return; }
    ctx.save(); ctx.translate(ship.x,ship.y); ctx.rotate(ship.angle); ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.beginPath();
    ctx.moveTo(14,0); ctx.lineTo(-10,8); ctx.lineTo(-6,0); ctx.lineTo(-10,-8); ctx.closePath(); ctx.stroke(); ctx.restore();
  }

  // ---- bullets ----
  function createBullet(ship){
    const speed=580; const bx=ship.x+Math.cos(ship.angle)*(ship.radius+2); const by=ship.y+Math.sin(ship.angle)*(ship.radius+2);
    return { x:bx, y:by, vx:Math.cos(ship.angle)*speed + ship.vx*0.2, vy:Math.sin(ship.angle)*speed + ship.vy*0.2, ttl:1.15, r:2, _dead:false };
  }
  function updateBullets(bullets,dt,width,height){ for(const b of bullets){ b.ttl-=dt; b.x+=b.vx*dt; b.y+=b.vy*dt; if(b.x<0)b.x+=width; else if(b.x>=width)b.x-=width; if(b.y<0)b.y+=height; else if(b.y>=height)b.y-=height; } }
  function drawBullets(ctx,bullets){ ctx.save(); ctx.fillStyle='#fff'; for(const b of bullets){ ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,TAU); ctx.fill(); } ctx.restore(); }

  // ---- asteroids ----
  function createAsteroid(x,y,radius){
    const speed = randRange(40,90)*(radius/46); const dir = randRange(0,TAU);
    const sides = 10 + (Math.random()*5|0); const shape=[]; for(let i=0;i<sides;i++){ const a=(i/sides)*TAU; const r=radius*randRange(0.75,1.1); shape.push({a,r}); }
    return { x,y, vx:Math.cos(dir)*speed, vy:Math.sin(dir)*speed, angle:randRange(0,TAU), spin:randRange(-0.7,0.7), radius, shape, _dead:false, scoreValue: radius>=40?20: radius>=24?50:100 };
  }
  function updateAsteroids(asteroids,dt,width,height){ for(const a of asteroids){ a.x+=a.vx*dt; a.y+=a.vy*dt; if(a.x<0)a.x+=width; else if(a.x>=width)a.x-=width; if(a.y<0)a.y+=height; else if(a.y>=height)a.y-=height; a.angle+=a.spin*dt; } }
  function drawAsteroids(ctx,asteroids){ ctx.save(); ctx.strokeStyle='#fff'; ctx.lineWidth=2; for(const a of asteroids){ ctx.save(); ctx.translate(a.x,a.y); ctx.rotate(a.angle); ctx.beginPath(); for(let i=0;i<a.shape.length;i++){ const seg=a.shape[i]; const x=Math.cos(seg.a)*seg.r; const y=Math.sin(seg.a)*seg.r; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);} ctx.closePath(); ctx.stroke(); ctx.restore(); } ctx.restore(); }
  function splitAsteroid(ast){ const r=ast.radius; const res=[]; if(r>18){ const r1=r*0.6, r2=r*0.5; res.push(createAsteroid(ast.x,ast.y,r1)); res.push(createAsteroid(ast.x,ast.y,r2)); } return res; }

  // ---- collisions ----
  function checkCollisions(game){
    const bulletHits=[]; let shipCrash=false;
    for(let i=0;i<game.bullets.length;i++){ const b=game.bullets[i]; if(b._dead||b.ttl<=0) continue; for(let j=0;j<game.asteroids.length;j++){ const a=game.asteroids[j]; if(a._dead) continue; const r=a.radius+b.r; if(dist2(b.x,b.y,a.x,a.y)<=r*r){ bulletHits.push({bulletIndex:i, asteroidIndex:j}); break; } } }
    if(game.ship && game.ship.invuln<=0){ for(let j=0;j<game.asteroids.length;j++){ const a=game.asteroids[j]; const r=a.radius+game.ship.radius; if(dist2(game.ship.x,game.ship.y,a.x,a.y)<=r*r){ shipCrash=true; break; } } }
    return { bulletHits, shipCrash };
  }

  // ---- waves ----
  function spawnWave(game,width,height){
    const count = 3 + Math.min(6, game.wave); const safe=150;
    for(let i=0;i<count;i++){
      let x,y; const side=Math.random();
      if(side<0.25){ x=0; y=Math.random()*height; }
      else if(side<0.5){ x=width; y=Math.random()*height; }
      else if(side<0.75){ x=Math.random()*width; y=0; }
      else { x=Math.random()*width; y=height; }
      const dx=x-game.ship.x, dy=y-game.ship.y; if(dx*dx+dy*dy < safe*safe){ i--; continue; }
      const r=42+Math.random()*10; game.asteroids.push(createAsteroid(x,y,r));
    }
  }

  // ---- audio ----
  function createAudio(){
    let ctx=null; let muted=false;
    function ensure(){ if(!ctx) ctx=new (window.AudioContext||window.webkitAudioContext)(); }
    function resume(){ ensure(); if(ctx.state==='suspended') ctx.resume(); }
    function shoot(){ if(muted) return; ensure(); const t=ctx.currentTime; const osc=ctx.createOscillator(); const gain=ctx.createGain(); osc.type='square'; osc.frequency.setValueAtTime(600,t); osc.frequency.exponentialRampToValueAtTime(220,t+0.08); gain.gain.setValueAtTime(0.12,t); gain.gain.exponentialRampToValueAtTime(0.0001,t+0.1); osc.connect(gain).connect(ctx.destination); osc.start(t); osc.stop(t+0.12); }
    function explosion(){ if(muted) return; ensure(); const t=ctx.currentTime; const osc1=ctx.createOscillator(); const osc2=ctx.createOscillator(); const gain=ctx.createGain(); osc1.type='triangle'; osc2.type='sawtooth'; osc1.frequency.setValueAtTime(120,t); osc2.frequency.setValueAtTime(80,t); osc1.frequency.exponentialRampToValueAtTime(40,t+0.4); osc2.frequency.exponentialRampToValueAtTime(30,t+0.4); gain.gain.setValueAtTime(0.08,t); gain.gain.exponentialRampToValueAtTime(0.0001,t+0.45); osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination); osc1.start(t); osc2.start(t); osc1.stop(t+0.45); osc2.stop(t+0.45); }
    function toggleMute(){ muted=!muted; }
    return { resume, shoot, explosion, toggleMute };
  }

  // ---- main ----
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const hud = { score: document.getElementById('score'), hi: document.getElementById('hiScore'), wave: document.getElementById('wave'), lives: document.getElementById('lives') };
  const overlay = document.getElementById('overlay');
  const overlayMessage = document.getElementById('overlayMessage');
  const startBtn = document.getElementById('startBtn');

  const DPR = Math.max(1, Math.min(window.devicePixelRatio||1, 3));
  let width=0, height=0;
  function resize(){ width=Math.floor(window.innerWidth); height=Math.floor(window.innerHeight); const w=Math.floor(width*DPR), h=Math.floor(height*DPR); if(canvas.width!==w) canvas.width=w; if(canvas.height!==h) canvas.height=h; ctx.setTransform(DPR,0,0,DPR,0,0); }
  window.addEventListener('resize', resize); resize();

  const input = createInput();
  const audio = createAudio();
  const game = { scene:'start', score:0, hiScore:Number(localStorage.getItem('asteroids.hi'))||0, wave:1, lives:3, bullets:[], asteroids:[], particles:createParticles(), ship:createShip(width/2,height/2), pendingRespawn:0 };

  function resetGame(){ game.score=0; game.wave=1; game.lives=3; game.bullets.length=0; game.asteroids.length=0; game.particles.items.length=0; game.ship=createShip(width/2,height/2); respawnShip(game.ship); spawnWave(game,width,height); }
  function updateHUD(){ hud.score.textContent=String(game.score); hud.hi.textContent=String(game.hiScore); hud.wave.textContent=String(game.wave); hud.lives.textContent=String(game.lives); }
  updateHUD();
  function startPlaying(){ audio && audio.resume(); if (game.scene==='start' || game.scene==='gameover'){ resetGame(); } game.scene='playing'; overlay.classList.add('hidden'); }
  startBtn.addEventListener('click', startPlaying);
  overlay.addEventListener('click', () => { if(game.scene==='start'||game.scene==='gameover') startPlaying(); });

  let lastTime = performance.now();
  function loop(now){
    const dt = clamp((now-lastTime)/1000, 0, 1/30); lastTime=now;
    if (input.wasPressed('start')){ if(game.scene==='start'||game.scene==='gameover') startPlaying(); }
    if (input.wasPressed('pause')){ if(game.scene==='playing'){ game.scene='paused'; overlayMessage.textContent='Пауза — нажмите Esc для продолжения'; overlay.classList.remove('hidden'); } else if (game.scene==='paused'){ game.scene='playing'; overlay.classList.add('hidden'); } }
    if (input.wasPressed('mute') && audio) audio.toggleMute();
    if (game.scene==='playing') update(dt);
    render(); input.nextFrame(); requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function update(dt){
    updateShip(game.ship, input, dt, width, height, (thrust)=>{
      if (thrust){ const p=game.ship; const bx=p.x - Math.cos(p.angle)*(p.radius+4); const by=p.y - Math.sin(p.angle)*(p.radius+4); game.particles.add(bx,by,(Math.random()-0.5)*40 - Math.cos(p.angle)*60,(Math.random()-0.5)*40 - Math.sin(p.angle)*60,0.25+Math.random()*0.25, 2+Math.random()*2, 'rgba(255,160,64,1)'); }
    });
    if (game.ship.canShoot && input.isDown('shoot')){ const b=createBullet(game.ship); game.bullets.push(b); game.ship.didShoot(); audio && audio.shoot(); }
    updateBullets(game.bullets, dt, width, height);
    updateAsteroids(game.asteroids, dt, width, height);
    updateParticles(game.particles, dt, width, height);
    const events = checkCollisions(game, width, height);
    for(const hit of events.bulletHits){ const a=game.asteroids[hit.asteroidIndex]; if(!a) continue; if(game.bullets[hit.bulletIndex]) game.bullets[hit.bulletIndex]._dead=true; const fragments=splitAsteroid(a); game.score += a.scoreValue; if (game.score>game.hiScore){ game.hiScore=game.score; localStorage.setItem('asteroids.hi', String(game.hiScore)); } explode(game.particles, a.x, a.y, a.radius); audio && audio.explosion(); a._dead=true; for(const f of fragments) game.asteroids.push(f); }
    if (events.shipCrash && game.ship.invuln<=0){ audio && audio.explosion(); explode(game.particles, game.ship.x, game.ship.y, 24); game.lives -= 1; if (game.lives < 0){ game.scene='gameover'; overlayMessage.textContent='Игра окончена — Enter или Клик для рестарта'; overlay.classList.remove('hidden'); return; } else { respawnShip(game.ship); } }
    game.bullets = game.bullets.filter(b=>!b._dead && b.ttl>0);
    game.asteroids = game.asteroids.filter(a=>!a._dead);
    if (game.asteroids.length===0){ game.wave+=1; spawnWave(game,width,height); }
    updateHUD();
  }

  function render(){
    ctx.clearRect(0,0,width,height);
    ctx.save(); ctx.globalAlpha=0.1; ctx.fillStyle='#fff'; for(let i=0;i<30;i++){ const x=(i*73)%width; const y=((i*137)%height); ctx.fillRect(x,y,1,1); } ctx.restore();
    drawAsteroids(ctx, game.asteroids);
    drawBullets(ctx, game.bullets);
    drawShip(ctx, game.ship);
    drawParticles(ctx, game.particles);
    if (game.scene==='paused'){ ctx.save(); ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(0,0,width,height); ctx.restore(); }
  }
})();
