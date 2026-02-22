(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const startScreen = document.getElementById('start-screen');
  const gameOverScreen = document.getElementById('game-over-screen');
  const upgradeScreen = document.getElementById('upgrade-screen');
  const bossWarning = document.getElementById('boss-warning');
  const restartBtn = document.getElementById('restart-btn');
  const scoreEl = document.getElementById('score');
  const waveEl = document.getElementById('wave');
  const highScoreEl = document.getElementById('high-score');
  const startHighScoreEl = document.getElementById('start-high-score');
  const gameoverHighScoreEl = document.getElementById('gameover-high-score');
  const comboEl = document.getElementById('combo');
  const comboBox = document.getElementById('combo-box');
  const weaponNameEl = document.getElementById('weapon-name');
  const healthFill = document.getElementById('health-fill');
  const healthText = document.getElementById('health-text');
  const shieldFill = document.getElementById('shield-fill');
  const finalScoreEl = document.getElementById('final-score');
  const finalWaveEl = document.getElementById('final-wave');
  const upgradeChoicesEl = document.getElementById('upgrade-choices');
  const lobbyScreen = document.getElementById('lobby-screen');
  const lobbyRoomCode = document.getElementById('lobby-room-code');
  const lobbyPlayers = document.getElementById('lobby-players');
  const btnStartGame = document.getElementById('btn-start-game');
  const btnLeaveLobby = document.getElementById('btn-leave-lobby');
  const agentSelectScreen = document.getElementById('agent-select-screen');
  const agentGrid = document.getElementById('agent-grid');
  const agentTimer = document.getElementById('agent-timer');
  const agentPicks = document.getElementById('agent-picks');
  const btnLockIn = document.getElementById('btn-lock-in');

  const HIGH_SCORE_KEY = 'neonShooterHighScore';
  const AGENTS = window.AGENTS || [];

  let gameRunning = false;
  let animationId = null;
  let agentSelectTimerId = null;
  let lobbyPlayersList = [];
  let agentSelections = {};
  let agentSelectEndsAt = 0;
  let myLocked = false;
  let gameSeed = 0;

  const WEAPONS = [
    { id: 'pistol', name: 'Pistol', fireRate: 200, damage: 18, speed: 14, spread: 0, count: 1 },
    { id: 'shotgun', name: 'Shotgun', fireRate: 500, damage: 10, speed: 12, spread: 0.4, count: 5 },
    { id: 'minigun', name: 'Minigun', fireRate: 60, damage: 8, speed: 16, spread: 0.08, count: 1 },
    { id: 'rocket', name: 'Rocket', fireRate: 900, damage: 80, speed: 8, spread: 0, count: 1, aoe: 60 },
  ];

  const ENEMY_TYPES = {
    scout: { w: 14, h: 14, speed: 2.4, health: 15, fireRate: 1800, damage: 5, score: 60, color: '#ffaa00' },
    soldier: { w: 20, h: 20, speed: 1.2, health: 35, fireRate: 1000, damage: 10, score: 100, color: '#ff6b35' },
    tank: { w: 28, h: 28, speed: 0.6, health: 120, fireRate: 1500, damage: 18, score: 200, color: '#aa0044' },
    sniper: { w: 16, h: 16, speed: 0.8, health: 25, fireRate: 2200, damage: 25, score: 150, color: '#00aaff' },
    swarm: { w: 10, h: 10, speed: 1.8, health: 8, fireRate: 2500, damage: 4, score: 40, color: '#aa00ff' },
    boss: { w: 56, h: 56, speed: 0.5, health: 800, fireRate: 400, damage: 15, score: 1000, color: '#ff0066', isBoss: true },
  };

  const UPGRADES = [
    { id: 'health', title: 'Repair', desc: '+30 max HP', fn: (s) => { s.maxHealth += 30; s.health = Math.min(s.health + 30, s.maxHealth); } },
    { id: 'shield', title: 'Shield', desc: '+40 shield', fn: (s) => { s.maxShield += 40; s.shield = Math.min(s.shield + 40, s.maxShield); } },
    { id: 'speed', title: 'Agility', desc: '+15% move speed', fn: (s) => { s.speedMult *= 1.15; } },
    { id: 'damage', title: 'Damage', desc: '+20% damage', fn: (s) => { s.damageMult *= 1.2; } },
    { id: 'fire', title: 'Fire rate', desc: '+15% fire rate', fn: (s) => { s.fireRateMult *= 1.15; } },
    { id: 'unlock_shotgun', title: 'Unlock Shotgun', desc: 'Press 2 to use', fn: (s) => { s.weaponsUnlocked = Math.max(s.weaponsUnlocked, 2); } },
    { id: 'unlock_minigun', title: 'Unlock Minigun', desc: 'Press 3 to use', fn: (s) => { s.weaponsUnlocked = Math.max(s.weaponsUnlocked, 3); } },
    { id: 'unlock_rocket', title: 'Unlock Rocket', desc: 'Press 4 to use', fn: (s) => { s.weaponsUnlocked = Math.max(s.weaponsUnlocked, 4); } },
  ];

  let state = {
    player: null,
    bullets: [],
    enemyBullets: [],
    enemies: [],
    powerUps: [],
    particles: [],
    damageNumbers: [],
    keys: {},
    mouse: { x: 0, y: 0 },
    score: 0,
    wave: 1,
    health: 100,
    maxHealth: 100,
    shield: 0,
    maxShield: 0,
    weaponIndex: 0,
    weaponsUnlocked: 1,
    speedMult: 1,
    damageMult: 1,
    fireRateMult: 1,
    scoreMult: 1,
    lastShot: 0,
    lastSpawn: 0,
    lastWaveEnemy: 0,
    combo: 0,
    comboTimeout: 0,
    screenShake: 0,
    muzzleFlash: 0,
    waveCleared: false,
    bossSpawned: false,
    upgradeSelected: false,
    mode: 'solo',
    myPlayerId: null,
    otherPlayers: [],
    agentId: null,
    agent: null,
    abilityCooldowns: {},
    abilityActiveUntil: {},
  };

  let audioCtx = null;
  function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  function playTone(freq, duration, type) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    osc.type = type || 'square';
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }

  function resize() {
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function getBounds() {
    const r = canvas.getBoundingClientRect();
    return { w: r.width, h: r.height };
  }

  function initPlayer() {
    const b = getBounds();
    state.player = {
      x: b.w / 2 - 12,
      y: b.h / 2 - 12,
      w: 24,
      h: 24,
      angle: 0,
    };
  }

  function spawnParticles(x, y, color, count, speed) {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random();
      const s = (speed || 4) * (0.5 + Math.random());
      state.particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: 0.4 + Math.random() * 0.3, color: color || '#fff',
      });
    }
  }

  function spawnDamageNumber(x, y, value, isCrit) {
    state.damageNumbers.push({
      x, y, value: Math.round(value), life: 1, isCrit: !!isCrit,
    });
  }

  function addScreenShake(amount) {
    state.screenShake = Math.max(state.screenShake, amount);
  }

  function spawnEnemy(typeKey) {
    const b = getBounds();
    const def = ENEMY_TYPES[typeKey] || ENEMY_TYPES.soldier;
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = Math.random() * b.w; y = -def.w - 5; }
    else if (side === 1) { x = b.w + def.w + 5; y = Math.random() * b.h; }
    else if (side === 2) { x = Math.random() * b.w; y = b.h + def.w + 5; }
    else { x = -def.w - 5; y = Math.random() * b.h; }
    const waveScale = 1 + (state.wave - 1) * 0.12;
    state.enemies.push({
      x, y, w: def.w, h: def.h,
      type: typeKey,
      speed: def.speed,
      health: Math.floor(def.health * waveScale),
      maxHealth: Math.floor(def.health * waveScale),
      fireRate: def.fireRate,
      damage: def.damage,
      score: def.score,
      color: def.color,
      lastShot: 0,
      isBoss: def.isBoss || false,
      moveStyle: typeKey === 'sniper' ? 'orbit' : typeKey === 'swarm' ? 'zigzag' : 'chase',
      zigzag: 0,
    });
  }

  function spawnBoss() {
    state.bossSpawned = true;
    const b = getBounds();
    state.enemies.push({
      x: b.w / 2 - 28,
      y: -70,
      w: 56,
      h: 56,
      type: 'boss',
      speed: ENEMY_TYPES.boss.speed,
      health: ENEMY_TYPES.boss.health + state.wave * 80,
      maxHealth: ENEMY_TYPES.boss.health + state.wave * 80,
      fireRate: ENEMY_TYPES.boss.fireRate,
      damage: ENEMY_TYPES.boss.damage,
      score: ENEMY_TYPES.boss.score,
      color: ENEMY_TYPES.boss.color,
      lastShot: 0,
      isBoss: true,
      moveStyle: 'boss',
    });
  }

  function pickEnemyTypeForWave() {
    const w = state.wave;
    const roll = Math.random();
    if (w >= 10 && roll < 0.08) return 'tank';
    if (w >= 6 && roll < 0.15) return 'sniper';
    if (w >= 4 && roll < 0.25) return 'scout';
    if (w >= 3 && roll < 0.4) return 'swarm';
    if (roll < 0.5) return 'soldier';
    return 'scout';
  }

  function spawnPowerUp(x, y) {
    if (Math.random() > 0.35) return;
    const types = ['health', 'shield', 'speed', 'mult'];
    const t = types[Math.floor(Math.random() * types.length)];
    state.powerUps.push({
      x, y, w: 16, h: 16, type: t, life: 15,
      color: t === 'health' ? '#ff6b35' : t === 'shield' ? '#00f5ff' : t === 'speed' ? '#39ff14' : '#ff00aa',
    });
  }

  function shootPlayer(angle) {
    const p = state.player;
    const weapon = WEAPONS[state.weaponIndex];
    const fireMult = state.abilityActiveUntil['rapid_fire'] > Date.now() ? 0.4 : 1;
    const baseRate = weapon.fireRate / (state.fireRateMult * fireMult);
    const now = Date.now();
    if (now - state.lastShot < baseRate) return;
    state.lastShot = now;
    state.muzzleFlash = 0.08;

    const damageMult = state.damageMult * (state.abilityActiveUntil['damage_boost'] > Date.now() ? 1.45 : 1);
    const damage = weapon.damage * damageMult;
    const count = weapon.count || 1;
    const spread = weapon.spread || 0;

    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() - 0.5) * spread * Math.PI;
      const speed = weapon.speed * (0.95 + Math.random() * 0.1);
      state.bullets.push({
        x: p.x + p.w / 2,
        y: p.y + p.h / 2,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        damage,
        size: weapon.aoe ? 8 : 5,
        aoe: weapon.aoe || 0,
        player: true,
      });
    }
    playTone(weapon.id === 'rocket' ? 80 : 400, 0.05, 'square');
  }

  function shootEnemy(e, angle) {
    state.enemyBullets.push({
      x: e.x + e.w / 2,
      y: e.y + e.h / 2,
      vx: Math.cos(angle) * 6,
      vy: Math.sin(angle) * 6,
      damage: e.damage,
      size: 5,
      player: false,
    });
  }

  function angleToward(ax, ay, bx, by) {
    return Math.atan2(by - ay, bx - ax);
  }

  function dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  function hitTestCircleToRect(cx, cy, cr, r) {
    const closestX = Math.max(r.x, Math.min(cx, r.x + r.w));
    const closestY = Math.max(r.y, Math.min(cy, r.y + r.h));
    return dist(cx, cy, closestX, closestY) <= cr;
  }

  function hitEnemy(e, bullet) {
    const dmg = Math.floor(bullet.damage);
    e.health -= dmg;
    spawnDamageNumber(e.x + e.w / 2, e.y, dmg, dmg > 25);
    spawnParticles(e.x + e.w / 2, e.y + e.h / 2, e.color, 6, 3);
    if (e.health <= 0) {
      state.combo++;
      state.comboTimeout = Date.now() + 2000;
      const baseScore = (e.score || 100) * (1 + (state.combo - 1) * 0.1) * state.scoreMult;
      state.score += Math.floor(baseScore);
      spawnParticles(e.x + e.w / 2, e.y + e.h / 2, e.color, 20, 6);
      playTone(200, 0.1, 'square');
      if (e.isBoss) {
        playTone(150, 0.2, 'sine');
        addScreenShake(15);
      }
      spawnPowerUp(e.x + e.w / 2, e.y + e.h / 2);
      return true;
    }
    playTone(120, 0.03, 'square');
    return false;
  }

  function update(dt) {
    if (!gameRunning || !state.player) return;
    const b = getBounds();
    const p = state.player;
    const now = Date.now();
    const effectiveSpeedMult = state.speedMult * (state.abilityActiveUntil['speed'] > now ? 1.35 : 1);
    const speed = 4 * effectiveSpeedMult;

    if (state.keys['KeyW'] || state.keys['ArrowUp']) p.y -= speed;
    if (state.keys['KeyS'] || state.keys['ArrowDown']) p.y += speed;
    if (state.keys['KeyA'] || state.keys['ArrowLeft']) p.x -= speed;
    if (state.keys['KeyD'] || state.keys['ArrowRight']) p.x += speed;
    p.x = Math.max(0, Math.min(b.w - p.w, p.x));
    p.y = Math.max(0, Math.min(b.h - p.h, p.y));
    p.angle = angleToward(p.x + p.w / 2, p.y + p.h / 2, state.mouse.x, state.mouse.y);

    if (state.keys['Digit1']) state.weaponIndex = 0;
    if (state.keys['Digit2'] && state.weaponsUnlocked >= 2) state.weaponIndex = 1;
    if (state.keys['Digit3'] && state.weaponsUnlocked >= 3) state.weaponIndex = 2;
    if (state.keys['Digit4'] && state.weaponsUnlocked >= 4) state.weaponIndex = 3;
    weaponNameEl.textContent = WEAPONS[state.weaponIndex].name;

    if (state.agent && state.agent.abilities) {
      const keyMap = { KeyE: 0, KeyQ: 1, KeyR: 2 };
      ['KeyE', 'KeyQ', 'KeyR'].forEach((key) => {
        if (!state.keys[key]) return;
        const idx = keyMap[key];
        const ab = state.agent.abilities[idx];
        if (!ab || state.abilityCooldowns[ab.key] > now) return;
        state.abilityCooldowns[ab.key] = now + (ab.cooldown || 5) * 1000;
        if (ab.type === 'heal') state.health = Math.min(state.maxHealth, state.health + (ab.value || 25));
        if (ab.type === 'full_heal') state.health = state.maxHealth;
        if (ab.type === 'shield') state.shield = Math.min(state.maxShield, state.shield + (ab.value || 30));
        if (ab.type === 'speed') state.abilityActiveUntil['speed'] = now + (ab.duration || 2) * 1000;
        if (ab.type === 'damage_boost') state.abilityActiveUntil['damage_boost'] = now + (ab.duration || 4) * 1000;
        if (ab.type === 'dash') {
          const dist = ab.value || 80;
          p.x = Math.max(0, Math.min(b.w - p.w, p.x + Math.cos(p.angle) * dist));
          p.y = Math.max(0, Math.min(b.h - p.h, p.y + Math.sin(p.angle) * dist));
          spawnParticles(p.x + p.w / 2, p.y + p.h / 2, state.agent.color, 8, 4);
        }
        if (ab.type === 'rapid_fire') state.abilityActiveUntil['rapid_fire'] = now + (ab.duration || 3) * 1000;
        updateHealthUI();
        updateShieldUI();
        playTone(350, 0.06, 'sine');
      });
    }

    if ((state.keys[' '] || state.keys['Mouse0']) && !state.waveCleared)
      shootPlayer(p.angle);

    if (state.comboTimeout < now) state.combo = 0;
    if (state.combo > 0) {
      comboBox.classList.remove('hidden');
      comboEl.textContent = state.combo + 'x';
    } else comboBox.classList.add('hidden');

    state.screenShake = Math.max(0, state.screenShake - 0.8);
    state.muzzleFlash = Math.max(0, state.muzzleFlash - 0.15);

    if (!state.waveCleared && !state.upgradeSelected) {
      if (now - state.lastSpawn > Math.max(400, 1800 - state.wave * 60)) {
        state.lastSpawn = now;
        const isBossWave = state.wave % 5 === 0 && state.wave > 0;
        const bossCount = state.enemies.filter((e) => e.isBoss).length;
        if (isBossWave && !state.bossSpawned && bossCount === 0) {
          bossWarning.classList.remove('hidden');
          setTimeout(() => {
            bossWarning.classList.add('hidden');
            spawnBoss();
          }, 2500);
        } else if (!isBossWave && state.enemies.length < 8 + state.wave) {
          spawnEnemy(pickEnemyTypeForWave());
        }
      }

      state.enemies.forEach((e) => {
        const px = p.x + p.w / 2, py = p.y + p.h / 2;
        const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
        const dx = px - ex, dy = py - ey;
        const len = Math.hypot(dx, dy) || 1;

        if (e.moveStyle === 'orbit') {
          const perp = Math.atan2(-dx, dy);
          e.x += Math.cos(perp) * e.speed * 1.5;
          e.y += Math.sin(perp) * e.speed * 1.5;
          e.x += (dx / len) * e.speed * 0.3;
          e.y += (dy / len) * e.speed * 0.3;
        } else if (e.moveStyle === 'zigzag') {
          e.zigzag += 0.15;
          const side = Math.cos(e.zigzag) * 2;
          e.x += (dx / len) * e.speed + Math.cos(e.zigzag) * e.speed;
          e.y += (dy / len) * e.speed + Math.sin(e.zigzag) * e.speed;
        } else if (e.moveStyle === 'boss') {
          e.y = Math.min(e.y + e.speed * 2, b.h / 2 - e.h - 40);
          e.x += Math.sin(now * 0.002) * 1.2;
          e.x = Math.max(20, Math.min(b.w - e.w - 20, e.x));
        } else {
          e.x += (dx / len) * e.speed;
          e.y += (dy / len) * e.speed;
        }

        if (now - e.lastShot > e.fireRate) {
          e.lastShot = now;
          const angle = angleToward(ex, ey, px, py);
          if (e.type === 'boss') {
            for (let i = 0; i < 3; i++)
              shootEnemy(e, angle + (i - 1) * 0.25);
          } else shootEnemy(e, angle);
        }
      });

      state.bullets = state.bullets.filter((bullet) => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        if (bullet.x < -30 || bullet.x > b.w + 30 || bullet.y < -30 || bullet.y > b.h + 30) return false;
        if (bullet.aoe) {
          let hitAny = false;
          for (let i = state.enemies.length - 1; i >= 0; i--) {
            const e = state.enemies[i];
            const d = dist(bullet.x, bullet.y, e.x + e.w / 2, e.y + e.h / 2);
            if (d < bullet.aoe) {
              const dmg = Math.floor(bullet.damage * (1 - d / bullet.aoe * 0.5));
              e.health -= dmg;
              spawnDamageNumber(e.x + e.w / 2, e.y, dmg, false);
              if (e.health <= 0) {
                state.combo++;
                state.comboTimeout = now + 2000;
                state.score += Math.floor((e.score || 100) * state.scoreMult);
                spawnParticles(e.x + e.w / 2, e.y + e.h / 2, e.color, 20, 6);
                spawnPowerUp(e.x + e.w / 2, e.y + e.h / 2);
                state.enemies.splice(i, 1);
              }
              hitAny = true;
            }
          }
          if (hitAny) {
            spawnParticles(bullet.x, bullet.y, '#ffaa00', 25, 8);
            addScreenShake(6);
            playTone(80, 0.15, 'sawtooth');
            return false;
          }
          return true;
        }
        for (let i = state.enemies.length - 1; i >= 0; i--) {
          const e = state.enemies[i];
          if (hitTestCircleToRect(bullet.x, bullet.y, bullet.size, e)) {
            if (hitEnemy(e, bullet)) state.enemies.splice(i, 1);
            return false;
          }
        }
        return true;
      });

      state.enemyBullets = state.enemyBullets.filter((bullet) => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        if (bullet.x < -20 || bullet.x > b.w + 20 || bullet.y < -20 || bullet.y > b.h + 20) return false;
        if (hitTestCircleToRect(bullet.x, bullet.y, bullet.size, p)) {
          let dmg = bullet.damage;
          if (state.shield > 0) {
            state.shield = Math.max(0, state.shield - dmg);
            dmg = 0;
            updateShieldUI();
          }
          if (dmg > 0) {
            state.health = Math.max(0, state.health - dmg);
            addScreenShake(4);
            updateHealthUI();
            spawnParticles(p.x + p.w / 2, p.y + p.h / 2, '#ff0066', 8, 2);
            playTone(100, 0.1, 'sawtooth');
            if (state.health <= 0) endGame();
          }
          return false;
        }
        return true;
      });

      state.powerUps = state.powerUps.filter((pu) => {
        pu.life -= dt / 1000;
        if (pu.life <= 0) return false;
        const cx = pu.x + pu.w / 2, cy = pu.y + pu.h / 2;
        const px = p.x + p.w / 2, py = p.y + p.h / 2;
        if (dist(cx, cy, px, py) < 24) {
          if (pu.type === 'health') state.health = Math.min(state.maxHealth, state.health + 25);
          if (pu.type === 'shield') state.shield = Math.min(state.maxShield, state.shield + 30);
          if (pu.type === 'speed') state.speedMult *= 1.1;
          if (pu.type === 'mult') state.scoreMult += 0.2;
          updateHealthUI();
          updateShieldUI();
          playTone(600, 0.08, 'sine');
          spawnParticles(cx, cy, pu.color, 10, 4);
          return false;
        }
        return true;
      });
    }

    state.particles = state.particles.filter((pt) => {
      pt.x += pt.vx * (dt / 16);
      pt.y += pt.vy * (dt / 16);
      pt.life -= dt / 1000;
      return pt.life > 0;
    });

    state.damageNumbers = state.damageNumbers.filter((dn) => {
      dn.y -= 30 * (dt / 1000);
      dn.life -= dt / 1000;
      return dn.life > 0;
    });

    if (state.mode === 'multi' && window.Multiplayer && state.player && now - (state.lastBroadcast || 0) > 100) {
      state.lastBroadcast = now;
      Multiplayer.broadcast('game_state', {
        x: state.player.x,
        y: state.player.y,
        angle: state.player.angle,
        weaponIndex: state.weaponIndex,
        health: state.health,
        shield: state.shield,
      });
    }

    const enemiesLeft = state.enemies.length;
    if (state.lastWaveEnemy && enemiesLeft === 0 && !state.waveCleared && now - state.lastWaveEnemy > 1500) {
      state.waveCleared = true;
      state.bossSpawned = false;
      playTone(523, 0.1, 'sine');
      setTimeout(() => showUpgradeScreen(), 800);
    }
    if (enemiesLeft > 0 && state.lastWaveEnemy === 0) state.lastWaveEnemy = now;
  }

  function showUpgradeScreen() {
    state.upgradeSelected = false;
    upgradeScreen.classList.remove('hidden');
    upgradeChoicesEl.innerHTML = '';
    const pool = [...UPGRADES];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      const u = pool.splice(idx, 1)[0];
      const btn = document.createElement('button');
      btn.className = 'upgrade-btn';
      btn.innerHTML = `<span class="title">${u.title}</span><span class="desc">${u.desc}</span>`;
      btn.addEventListener('click', () => applyUpgrade(u));
      upgradeChoicesEl.appendChild(btn);
    }
  }

  function applyUpgrade(u) {
    if (state.upgradeSelected) return;
    state.upgradeSelected = true;
    u.fn(state);
    upgradeScreen.classList.add('hidden');
    state.wave++;
    state.waveCleared = false;
    state.lastWaveEnemy = 0;
    waveEl.textContent = state.wave;
    updateHealthUI();
    updateShieldUI();
    playTone(400, 0.06, 'sine');
  }

  function updateHealthUI() {
    const pct = (state.health / state.maxHealth) * 100;
    healthFill.style.width = Math.max(0, pct) + '%';
    healthText.textContent = Math.round(state.health);
  }

  function updateShieldUI() {
    const pct = state.maxShield ? (state.shield / state.maxShield) * 100 : 0;
    shieldFill.style.width = Math.max(0, pct) + '%';
  }

  function draw() {
    const b = getBounds();
    const shakeX = (Math.random() - 0.5) * state.screenShake;
    const shakeY = (Math.random() - 0.5) * state.screenShake;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    ctx.fillStyle = '#060610';
    ctx.fillRect(-10, -10, b.w + 20, b.h + 20);

    const gridSize = 50;
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= b.w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, b.h);
      ctx.stroke();
    }
    for (let y = 0; y <= b.h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(b.w, y);
      ctx.stroke();
    }

    state.particles.forEach((pt) => {
      ctx.globalAlpha = pt.life;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    state.damageNumbers.forEach((dn) => {
      ctx.globalAlpha = dn.life;
      ctx.font = (dn.isCrit ? 'bold 16px' : '12px') + ' Orbitron, sans-serif';
      ctx.fillStyle = dn.isCrit ? '#ffaa00' : '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('-' + dn.value, dn.x, dn.y);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    });

    state.powerUps.forEach((pu) => {
      ctx.globalAlpha = Math.min(1, pu.life * 2);
      ctx.fillStyle = pu.color;
      ctx.shadowColor = pu.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(pu.x, pu.y, pu.w, pu.h);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });

    state.bullets.forEach((bullet) => {
      ctx.fillStyle = bullet.aoe ? '#ffaa00' : '#39ff14';
      ctx.shadowColor = bullet.aoe ? '#ffaa00' : '#39ff14';
      ctx.shadowBlur = bullet.aoe ? 12 : 6;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    state.enemyBullets.forEach((bullet) => {
      ctx.fillStyle = '#ff00aa';
      ctx.shadowColor = '#ff00aa';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    state.enemies.forEach((e) => {
      ctx.fillStyle = e.color;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = e.isBoss ? 3 : 1;
      ctx.shadowColor = e.color;
      ctx.shadowBlur = e.isBoss ? 25 : 10;
      ctx.fillRect(e.x, e.y, e.w, e.h);
      ctx.strokeRect(e.x, e.y, e.w, e.h);
      if (e.maxHealth > 0) {
        const barW = e.w;
        ctx.fillStyle = '#222';
        ctx.fillRect(e.x, e.y - 6, barW, 4);
        ctx.fillStyle = e.isBoss ? '#f00' : '#0f0';
        ctx.fillRect(e.x, e.y - 6, barW * (e.health / e.maxHealth), 4);
      }
      ctx.shadowBlur = 0;
    });

    state.otherPlayers.forEach((op) => {
      const color = (AGENTS.find((a) => a.id === op.agentId) || {}).color || '#888';
      ctx.fillStyle = color;
      ctx.strokeStyle = '#fff';
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 1;
      const w = 24, h = 24;
      ctx.save();
      ctx.translate(op.x + w / 2, op.y + h / 2);
      ctx.rotate(op.angle || 0);
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      ctx.restore();
      ctx.shadowBlur = 0;
      if (op.name) {
        ctx.font = '10px Share Tech Mono';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(op.name, op.x + w / 2, op.y - 8);
        ctx.textAlign = 'left';
      }
    });

    if (state.player) {
      const p = state.player;
      if (state.muzzleFlash > 0) {
        ctx.globalAlpha = state.muzzleFlash;
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(p.x + p.w / 2 + Math.cos(p.angle) * p.w, p.y + p.h / 2 + Math.sin(p.angle) * p.h, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(p.angle);
      ctx.fillStyle = '#00f5ff';
      ctx.strokeStyle = '#00f5ff';
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 15;
      ctx.lineWidth = 2;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.fillStyle = '#fff';
      ctx.fillRect(p.w / 4, -2, p.w / 2, 4);
      ctx.restore();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
    scoreEl.textContent = state.score;
    highScoreEl.textContent = getHighScore();
  }

  function getHighScore() {
    try {
      return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
    } catch (_) { return 0; }
  }

  function saveHighScore() {
    const best = getHighScore();
    if (state.score > best) {
      try {
        localStorage.setItem(HIGH_SCORE_KEY, String(state.score));
      } catch (_) {}
    }
  }

  function loop() {
    if (!gameRunning) return;
    update(16);
    draw();
    animationId = requestAnimationFrame(loop);
  }

  function startGame() {
    initAudio();
    resize();
    const agent = state.agent || AGENTS[0];
    state = {
      player: null,
      bullets: [],
      enemyBullets: [],
      enemies: [],
      powerUps: [],
      particles: [],
      damageNumbers: [],
      keys: state.keys,
      mouse: state.mouse,
      score: 0,
      wave: 1,
      health: 100,
      maxHealth: 100,
      shield: 0,
      maxShield: 0,
      weaponIndex: 0,
      weaponsUnlocked: 1,
      speedMult: 1,
      damageMult: 1,
      fireRateMult: 1,
      scoreMult: 1,
      lastShot: 0,
      lastSpawn: 0,
      lastWaveEnemy: 0,
      combo: 0,
      comboTimeout: 0,
      screenShake: 0,
      muzzleFlash: 0,
      waveCleared: false,
      bossSpawned: false,
      upgradeSelected: false,
      mode: state.mode || 'solo',
      myPlayerId: state.myPlayerId,
      otherPlayers: state.otherPlayers || [],
      agentId: state.agentId,
      agent,
      abilityCooldowns: { E: 0, Q: 0, R: 0 },
      abilityActiveUntil: {},
    };
    scoreEl.textContent = '0';
    waveEl.textContent = '1';
    weaponNameEl.textContent = 'Pistol';
    initPlayer();
    updateHealthUI();
    updateShieldUI();
    shieldFill.style.width = '0%';
    startScreen.classList.add('hidden');
    lobbyScreen.classList.add('hidden');
    agentSelectScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    upgradeScreen.classList.add('hidden');
    bossWarning.classList.add('hidden');
    if (state.mode === 'multi' && window.Multiplayer) {
      Multiplayer.on('game_state', (data) => {
        if (!data || data.from === state.myPlayerId) return;
        let op = state.otherPlayers.find((p) => p.playerId === data.from);
        if (!op) {
          op = { playerId: data.from, name: 'Player', agentId: null, x: 0, y: 0, angle: 0, health: 100 };
          state.otherPlayers.push(op);
        }
        op.x = data.x ?? op.x;
        op.y = data.y ?? op.y;
        op.angle = data.angle ?? op.angle;
      });
      state.lastBroadcast = 0;
    }
    gameRunning = true;
    loop();
  }

  function endGame() {
    gameRunning = false;
    if (animationId) cancelAnimationFrame(animationId);
    saveHighScore();
    finalScoreEl.textContent = state.score;
    finalWaveEl.textContent = state.wave;
    gameoverHighScoreEl.textContent = getHighScore();
    gameOverScreen.classList.remove('hidden');
    playTone(150, 0.3, 'sawtooth');
  }

  function initStartScreen() {
    if (window.Multiplayer && Multiplayer.isConfigured()) {
      document.getElementById('multiplayer-section').classList.remove('hidden');
      document.getElementById('btn-toggle-multi').textContent = 'Multiplayer (ready)';
    }
    document.getElementById('btn-solo').onclick = () => {
      startScreen.classList.add('hidden');
      showAgentSelect('solo');
    };
    document.getElementById('btn-create').onclick = () => {
      const name = prompt('Your name', 'Player 1') || 'Player 1';
      Multiplayer.createRoom(name).then(({ code }) => {
        lobbyPlayersList = [{ playerId: Multiplayer.getMyPlayerId(), name: Multiplayer.getPlayerName(), isHost: true }];
        Multiplayer.on('join', (data) => {
          if (data.from === Multiplayer.getMyPlayerId()) return;
          if (!lobbyPlayersList.find((p) => p.playerId === data.playerId)) {
            lobbyPlayersList.push({ playerId: data.playerId, name: data.name || 'Player', isHost: false });
            renderLobbyPlayers();
          }
        });
        showLobby(code, true);
      }).catch(() => alert('Supabase not configured. Copy config.example.js to config.js and add your project URL and anon key.'));
    };
    document.getElementById('btn-join').onclick = () => {
      const codeInput = document.getElementById('room-code-input');
      const code = (codeInput && codeInput.value) ? codeInput.value.trim() : '';
      if (!code) { alert('Enter room code'); return; }
      const name = prompt('Your name', 'Player 2') || 'Player 2';
      Multiplayer.joinRoom(code, name).then(() => {
        lobbyPlayersList = [{ playerId: Multiplayer.getMyPlayerId(), name: Multiplayer.getPlayerName(), isHost: false }];
        Multiplayer.on('join', (data) => {
          if (!lobbyPlayersList.find((p) => p.playerId === data.playerId)) {
            lobbyPlayersList.push({ playerId: data.playerId, name: data.name || 'Player', isHost: false });
            renderLobbyPlayers();
          }
        });
        showLobby(code, false);
      }).catch(() => alert('Could not join. Check room code and Supabase config.'));
    };
    btnLeaveLobby.onclick = () => {
      if (window.Multiplayer) Multiplayer.leaveRoom();
      lobbyScreen.classList.add('hidden');
      startScreen.classList.remove('hidden');
    };
    btnStartGame.onclick = () => {
      agentSelections = {};
      myLocked = false;
      agentSelectEndsAt = Date.now() + 15000;
      Multiplayer.broadcast('start_agent_select', { endsAt: agentSelectEndsAt });
      lobbyScreen.classList.add('hidden');
      showAgentSelect('multi');
    };
  }

  function showLobby(code, isHost) {
    lobbyRoomCode.textContent = code;
    btnStartGame.classList.toggle('hidden', !isHost);
    renderLobbyPlayers();
    startScreen.classList.add('hidden');
    lobbyScreen.classList.remove('hidden');
  }

  function renderLobbyPlayers() {
    lobbyPlayers.innerHTML = lobbyPlayersList.map((p) => `<li>${p.name}${p.isHost ? ' (Host)' : ''}</li>`).join('');
  }

  function showAgentSelect(mode) {
    agentSelectScreen.classList.remove('hidden');
    agentGrid.innerHTML = '';
    agentSelections = {};
    myLocked = false;
    state.agentId = null;
    const endsAt = agentSelectEndsAt || (Date.now() + 15000);
    agentSelectEndsAt = endsAt;

    AGENTS.forEach((agent) => {
      const card = document.createElement('div');
      card.className = 'agent-card';
      card.dataset.agentId = agent.id;
      card.innerHTML = `<span class="agent-name" style="color:${agent.color}">${agent.name}</span><span class="agent-role">${agent.role}</span><span class="agent-abilities">${agent.abilities.map((a) => a.key + ': ' + a.name).join(' · ')}</span>`;
      card.onclick = () => {
        if (myLocked) return;
        const pickedBy = Object.keys(agentSelections).find((pid) => agentSelections[pid] === agent.id);
        if (pickedBy && mode === 'multi') return;
        state.agentId = agent.id;
        if (window.Multiplayer && mode === 'multi') Multiplayer.broadcast('pick', { agentId: agent.id });
        updateAgentGridSelection();
        btnLockIn.disabled = false;
      };
      agentGrid.appendChild(card);
    });

    updateAgentGridSelection();
    btnLockIn.disabled = !state.agentId;
    btnLockIn.onclick = () => {
      if (!state.agentId || myLocked) return;
      myLocked = true;
      btnLockIn.disabled = true;
      if (window.Multiplayer) Multiplayer.broadcast('lock', { agentId: state.agentId });
      updateAgentGridSelection();
    };

    if (window.Multiplayer && mode === 'multi') {
      Multiplayer.on('pick', (data) => {
        if (data.from) agentSelections[data.from] = data.agentId;
        updateAgentPicksText();
        updateAgentGridSelection();
      });
      Multiplayer.on('lock', (data) => {
        if (data.from) agentSelections[data.from] = data.agentId;
        updateAgentPicksText();
        updateAgentGridSelection();
      });
      Multiplayer.on('start_agent_select', (data) => {
        if (data.endsAt) agentSelectEndsAt = data.endsAt;
        if (!Multiplayer.isHost()) {
          lobbyScreen.classList.add('hidden');
          showAgentSelect('multi');
        }
      });
      Multiplayer.on('start_game', (data) => {
        agentSelectScreen.classList.add('hidden');
        if (agentSelectTimerId) clearInterval(agentSelectTimerId);
        startGameWithOptions({
          mode: 'multi',
          selections: data.selections || agentSelections,
          players: data.players || lobbyPlayersList,
          seed: data.seed,
        });
      });
    }

    function updateAgentGridSelection() {
      agentGrid.querySelectorAll('.agent-card').forEach((c) => {
        c.classList.remove('selected', 'locked', 'picked-by-other');
        const aid = c.dataset.agentId;
        if (state.agentId === aid) c.classList.add('selected');
        if (myLocked && state.agentId === aid) c.classList.add('locked');
        const pickedBy = Object.keys(agentSelections).find((pid) => agentSelections[pid] === aid && pid !== Multiplayer?.getMyPlayerId?.());
        if (pickedBy) c.classList.add('picked-by-other');
      });
    }

    function updateAgentPicksText() {
      const lines = lobbyPlayersList.map((p) => {
        const aid = agentSelections[p.playerId];
        const agent = AGENTS.find((a) => a.id === aid);
        return agent ? `${p.name}: ${agent.name}` : `${p.name}: choosing...`;
      });
      agentPicks.textContent = lines.join(' · ');
    }

    const tick = () => {
      const left = Math.max(0, Math.ceil((agentSelectEndsAt - Date.now()) / 1000));
      agentTimer.textContent = left;
      if (left <= 0) {
        if (agentSelectTimerId) clearInterval(agentSelectTimerId);
        agentSelectScreen.classList.add('hidden');
        if (mode === 'multi' && window.Multiplayer) {
          if (Multiplayer.isHost()) {
            gameSeed = Date.now();
            Multiplayer.broadcast('start_game', { selections: agentSelections, players: lobbyPlayersList, seed: gameSeed });
            startGameWithOptions({ mode: 'multi', selections: agentSelections, players: lobbyPlayersList, seed: gameSeed });
          }
          return;
        }
        startGameWithOptions({
          mode: 'solo',
          selections: { me: state.agentId },
          players: [],
          seed: Date.now(),
        });
      }
    };
    agentSelectTimerId = setInterval(tick, 200);
    tick();
  }

  function startGameWithOptions(options) {
    const selections = options.selections || {};
    const myId = (window.Multiplayer && Multiplayer.getMyPlayerId()) || 'me';
    const agentId = selections[myId] || state.agentId || (AGENTS[0] && AGENTS[0].id);
    const agent = AGENTS.find((a) => a.id === agentId) || AGENTS[0];
    state.agentId = agentId;
    state.agent = agent;
    state.mode = options.mode || 'solo';
    state.myPlayerId = myId;
    gameSeed = options.seed || Date.now();
    state.otherPlayers = (options.players || []).filter((p) => p.playerId !== myId).map((p) => ({
      playerId: p.playerId,
      name: p.name,
      agentId: selections[p.playerId],
      x: 0, y: 0, angle: 0, health: 100,
    }));
    startGame();
  }

  restartBtn.addEventListener('click', () => {
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    if (state.mode === 'multi' && window.Multiplayer) {
      Multiplayer.leaveRoom();
    }
  });

  initStartScreen();
  startHighScoreEl.textContent = getHighScore();

  document.addEventListener('keydown', (e) => {
    state.keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
  });
  document.addEventListener('keyup', (e) => { state.keys[e.code] = false; });

  canvas.addEventListener('mousedown', (e) => { state.keys['Mouse0'] = true; e.preventDefault(); });
  canvas.addEventListener('mouseup', () => { state.keys['Mouse0'] = false; });
  canvas.addEventListener('mouseleave', () => { state.keys['Mouse0'] = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    state.mouse.x = e.clientX - rect.left;
    state.mouse.y = e.clientY - rect.top;
  });

  window.addEventListener('resize', () => {
    resize();
    if (gameRunning && state.player) {
      const b = getBounds();
      state.player.x = Math.max(0, Math.min(b.w - state.player.w, state.player.x));
      state.player.y = Math.max(0, Math.min(b.h - state.player.h, state.player.y));
    }
  });

  resize();
})();
