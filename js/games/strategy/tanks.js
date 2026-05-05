const Tanks = {
    canvas: null,
    ctx: null,
    ui: null,
    animFrame: null,
    gameOver: false,
    paused: false,
    lastTime: 0,
    score: 0,
    lives: 3,

    // Player
    player: null,
    playerSpeed: 180,
    playerR: 18,
    aimAngle: 0,
    fireCD: 0,
    fireCDMax: 0.3,
    invincible: 0,

    // Entities
    bullets: [],
    enemyBullets: [],
    enemies: [],
    particles: [],
    spawnTimer: 0,
    spawnInterval: 2.5,

    // Input
    keys: {},
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,

    // 2P state
    player2: null,
    p2AimAngle: 0,
    p2FireCD: 0,
    p2Invincible: 0,
    p2Lives: 3,
    p1Score: 0,
    p2Score: 0,
    p1Bullets: [],
    p2Bullets: [],
    winner: '',

    is2P() { return this.ui && this.ui.mode === '2p'; },

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this.handleKey = this.handleKey.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        document.addEventListener('keydown', this.handleKey);
        document.addEventListener('keyup', this.handleKeyUp);
        canvas.addEventListener('mousemove', this.handleMouseMove);
        canvas.addEventListener('mousedown', this.handleMouseDown);
        canvas.addEventListener('mouseup', this.handleMouseUp);
        canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    },

    start() {
        this.reset();
        this.gameOver = false;
        this.paused = false;
        this.ui.hideGameOver();
        this.ui.hidePause();
        this.lastTime = performance.now();
        this.loop();
    },

    reset() {
        cancelAnimationFrame(this.animFrame);
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        this.player = { x: W / 2, y: H / 2 };
        this.score = 0;
        this.lives = 3;
        this.fireCD = 0;
        this.invincible = 0;
        this.aimAngle = 0;
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.particles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 2.5;
        this.keys = {};
        this.mouseDown = false;
        this.ui.setScore(0);
        this.winner = '';

        if (this.is2P()) {
            this.player.x = W * 0.15;
            this.player.y = H / 2;
            this.player2 = { x: W * 0.85, y: H / 2 };
            this.p2AimAngle = Math.PI; // face left
            this.aimAngle = 0; // face right
            this.p2FireCD = 0;
            this.p2Invincible = 0;
            this.p2Lives = 3;
            this.p1Score = 0;
            this.p2Score = 0;
            this.p1Bullets = [];
            this.p2Bullets = [];
            this.enemies = [];
            this.enemyBullets = [];
        }
    },

    loop() {
        if (this.gameOver) return;
        this.animFrame = requestAnimationFrame(() => this.loop());
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;
        if (this.paused) { this.render(); return; }
        this.update(dt);
        this.render();
    },

    update(dt) {
        if (this.is2P()) {
            this.update2P(dt);
            return;
        }

        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        const p = this.player;
        const R = this.playerR;

        // Movement
        let dx = 0, dy = 0;
        if (this.keys['w'] || this.keys['ArrowUp']) dy -= 1;
        if (this.keys['s'] || this.keys['ArrowDown']) dy += 1;
        if (this.keys['a'] || this.keys['ArrowLeft']) dx -= 1;
        if (this.keys['d'] || this.keys['ArrowRight']) dx += 1;
        if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
        p.x += dx * this.playerSpeed * dt;
        p.y += dy * this.playerSpeed * dt;
        p.x = Math.max(R, Math.min(W - R, p.x));
        p.y = Math.max(R, Math.min(H - R, p.y));

        // Aim
        this.aimAngle = Math.atan2(this.mouseY - p.y, this.mouseX - p.x);

        // Fire cooldown
        this.fireCD -= dt;
        if ((this.mouseDown || this.keys[' ']) && this.fireCD <= 0) {
            this.fireCD = this.fireCDMax;
            const speed = 500;
            this.bullets.push({
                x: p.x + Math.cos(this.aimAngle) * (R + 12),
                y: p.y + Math.sin(this.aimAngle) * (R + 12),
                vx: Math.cos(this.aimAngle) * speed,
                vy: Math.sin(this.aimAngle) * speed,
                r: 4
            });
        }

        // Invincibility
        if (this.invincible > 0) this.invincible -= dt;

        // Spawn enemies
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnInterval = Math.max(0.8, this.spawnInterval - 0.05);
            this.spawnEnemy(W, H);
        }

        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            if (b.x < -10 || b.x > W + 10 || b.y < -10 || b.y > H + 10) {
                this.bullets.splice(i, 1);
                continue;
            }
            // Hit enemies
            let hit = false;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j];
                const edx = b.x - e.x, edy = b.y - e.y;
                if (edx * edx + edy * edy < (b.r + e.r) * (b.r + e.r)) {
                    e.hp--;
                    this.spawnExplosion(b.x, b.y, '#ffd60a', 5);
                    if (e.hp <= 0) {
                        this.spawnExplosion(e.x, e.y, '#ff2d7b', 12);
                        this.enemies.splice(j, 1);
                        this.score += 10;
                        this.ui.setScore(this.score);
                    }
                    this.bullets.splice(i, 1);
                    hit = true;
                    break;
                }
            }
            if (hit) continue;
        }

        // Update enemy bullets
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const b = this.enemyBullets[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            if (b.x < -10 || b.x > W + 10 || b.y < -10 || b.y > H + 10) {
                this.enemyBullets.splice(i, 1);
                continue;
            }
            // Hit player
            const edx = b.x - p.x, edy = b.y - p.y;
            if (edx * edx + edy * edy < (b.r + R) * (b.r + R) && this.invincible <= 0) {
                this.enemyBullets.splice(i, 1);
                this.takeDamage();
                if (this.gameOver) return;
            }
        }

        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            const angle = Math.atan2(p.y - e.y, p.x - e.x);
            e.x += Math.cos(angle) * e.speed * dt;
            e.y += Math.sin(angle) * e.speed * dt;
            e.aimAngle = angle;
            e.fireCD -= dt;
            if (e.fireCD <= 0) {
                e.fireCD = 1.5 + Math.random();
                const bspeed = 250;
                this.enemyBullets.push({
                    x: e.x + Math.cos(angle) * (e.r + 8),
                    y: e.y + Math.sin(angle) * (e.r + 8),
                    vx: Math.cos(angle) * bspeed,
                    vy: Math.sin(angle) * bspeed,
                    r: 4
                });
            }
            // Collision with player
            const cdx = p.x - e.x, cdy = p.y - e.y;
            if (cdx * cdx + cdy * cdy < (R + e.r) * (R + e.r) && this.invincible <= 0) {
                this.spawnExplosion(e.x, e.y, '#ff2d7b', 10);
                this.enemies.splice(i, 1);
                this.takeDamage();
                if (this.gameOver) return;
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const pt = this.particles[i];
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.life -= dt;
            if (pt.life <= 0) this.particles.splice(i, 1);
        }
    },

    update2P(dt) {
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        const p1 = this.player;
        const p2 = this.player2;
        const R = this.playerR;

        // P1 movement (WASD)
        let dx1 = 0, dy1 = 0;
        if (this.keys['w']) dy1 -= 1;
        if (this.keys['s']) dy1 += 1;
        if (this.keys['a']) dx1 -= 1;
        if (this.keys['d']) dx1 += 1;
        if (dx1 !== 0 && dy1 !== 0) { dx1 *= 0.707; dy1 *= 0.707; }
        p1.x += dx1 * this.playerSpeed * dt;
        p1.y += dy1 * this.playerSpeed * dt;
        p1.x = Math.max(R, Math.min(W - R, p1.x));
        p1.y = Math.max(R, Math.min(H - R, p1.y));

        // P2 movement (Arrow keys)
        let dx2 = 0, dy2 = 0;
        if (this.keys['ArrowUp']) dy2 -= 1;
        if (this.keys['ArrowDown']) dy2 += 1;
        if (this.keys['ArrowLeft']) dx2 -= 1;
        if (this.keys['ArrowRight']) dx2 += 1;
        if (dx2 !== 0 && dy2 !== 0) { dx2 *= 0.707; dy2 *= 0.707; }
        p2.x += dx2 * this.playerSpeed * dt;
        p2.y += dy2 * this.playerSpeed * dt;
        p2.x = Math.max(R, Math.min(W - R, p2.x));
        p2.y = Math.max(R, Math.min(H - R, p2.y));

        // P1 aim toward P2, P2 aim toward P1
        this.aimAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        this.p2AimAngle = Math.atan2(p1.y - p2.y, p1.x - p2.x);

        // P1 fire (Q)
        this.fireCD -= dt;
        if (this.keys['q'] && this.fireCD <= 0) {
            this.fireCD = this.fireCDMax;
            const speed = 500;
            this.p1Bullets.push({
                x: p1.x + Math.cos(this.aimAngle) * (R + 12),
                y: p1.y + Math.sin(this.aimAngle) * (R + 12),
                vx: Math.cos(this.aimAngle) * speed,
                vy: Math.sin(this.aimAngle) * speed,
                r: 4
            });
        }

        // P2 fire (/)
        this.p2FireCD -= dt;
        if (this.keys['/'] && this.p2FireCD <= 0) {
            this.p2FireCD = this.fireCDMax;
            const speed = 500;
            this.p2Bullets.push({
                x: p2.x + Math.cos(this.p2AimAngle) * (R + 12),
                y: p2.y + Math.sin(this.p2AimAngle) * (R + 12),
                vx: Math.cos(this.p2AimAngle) * speed,
                vy: Math.sin(this.p2AimAngle) * speed,
                r: 4
            });
        }

        // Invincibility
        if (this.invincible > 0) this.invincible -= dt;
        if (this.p2Invincible > 0) this.p2Invincible -= dt;

        // Update P1 bullets
        for (let i = this.p1Bullets.length - 1; i >= 0; i--) {
            const b = this.p1Bullets[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            if (b.x < -10 || b.x > W + 10 || b.y < -10 || b.y > H + 10) {
                this.p1Bullets.splice(i, 1);
                continue;
            }
            // Hit P2
            const edx = b.x - p2.x, edy = b.y - p2.y;
            if (edx * edx + edy * edy < (b.r + R) * (b.r + R) && this.p2Invincible <= 0) {
                this.p1Bullets.splice(i, 1);
                this.spawnExplosion(b.x, b.y, '#ffd60a', 5);
                this.p2Lives--;
                this.p2Invincible = 1.5;
                this.p1Score++;
                this.spawnExplosion(p2.x, p2.y, '#ff2d7b', 8);
                if (this.p2Lives <= 0) {
                    this.winner = 'P1';
                    this.spawnExplosion(p2.x, p2.y, '#ff2d7b', 20);
                    this.endGame2P();
                    return;
                }
            }
        }

        // Update P2 bullets
        for (let i = this.p2Bullets.length - 1; i >= 0; i--) {
            const b = this.p2Bullets[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            if (b.x < -10 || b.x > W + 10 || b.y < -10 || b.y > H + 10) {
                this.p2Bullets.splice(i, 1);
                continue;
            }
            // Hit P1
            const edx = b.x - p1.x, edy = b.y - p1.y;
            if (edx * edx + edy * edy < (b.r + R) * (b.r + R) && this.invincible <= 0) {
                this.p2Bullets.splice(i, 1);
                this.spawnExplosion(b.x, b.y, '#ffd60a', 5);
                this.lives--;
                this.invincible = 1.5;
                this.p2Score++;
                this.spawnExplosion(p1.x, p1.y, '#00d4ff', 8);
                if (this.lives <= 0) {
                    this.winner = 'P2';
                    this.spawnExplosion(p1.x, p1.y, '#00d4ff', 20);
                    this.endGame2P();
                    return;
                }
            }
        }

        // Tank-to-tank collision (push apart)
        const cdx = p2.x - p1.x, cdy = p2.y - p1.y;
        const dist = Math.sqrt(cdx * cdx + cdy * cdy);
        const minDist = R * 2;
        if (dist < minDist && dist > 0) {
            const overlap = (minDist - dist) / 2;
            const nx = cdx / dist, ny = cdy / dist;
            p1.x -= nx * overlap;
            p1.y -= ny * overlap;
            p2.x += nx * overlap;
            p2.y += ny * overlap;
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const pt = this.particles[i];
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.life -= dt;
            if (pt.life <= 0) this.particles.splice(i, 1);
        }
    },

    endGame2P() {
        this.gameOver = true;
        cancelAnimationFrame(this.animFrame);
        this.render();
        const winScore = this.winner === 'P1' ? this.p1Score : this.p2Score;
        this.ui.showGameOver(winScore, 0, this.winner + ' Wins!');
    },

    spawnEnemy(W, H) {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        switch (side) {
            case 0: x = -20; y = Math.random() * H; break;
            case 1: x = W + 20; y = Math.random() * H; break;
            case 2: x = Math.random() * W; y = -20; break;
            default: x = Math.random() * W; y = H + 20; break;
        }
        this.enemies.push({
            x, y, r: 15,
            speed: 50 + Math.random() * 40,
            hp: 1,
            aimAngle: 0,
            fireCD: 1 + Math.random() * 2
        });
    },

    spawnExplosion(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 60 + Math.random() * 160;
            this.particles.push({
                x, y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                r: 2 + Math.random() * 4,
                color,
                life: 0.3 + Math.random() * 0.4
            });
        }
    },

    takeDamage() {
        this.lives--;
        this.invincible = 1.5;
        this.spawnExplosion(this.player.x, this.player.y, '#00d4ff', 8);
        if (this.lives <= 0) {
            this.endGame();
        }
    },

    render() {
        const ctx = this.ctx;
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Grid
        ctx.strokeStyle = 'rgba(0,212,255,0.06)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }

        if (this.is2P()) {
            this.render2P(ctx, W, H);
            return;
        }

        // Enemy bullets
        ctx.fillStyle = '#ff2d7b';
        for (const b of this.enemyBullets) {
            ctx.shadowColor = '#ff2d7b';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Player bullets
        ctx.fillStyle = '#ffd60a';
        for (const b of this.bullets) {
            ctx.shadowColor = '#ffd60a';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Enemies
        for (const e of this.enemies) {
            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.rotate(e.aimAngle);
            // Body
            ctx.fillStyle = '#cc2255';
            ctx.beginPath();
            ctx.arc(0, 0, e.r, 0, Math.PI * 2);
            ctx.fill();
            // Turret
            ctx.fillStyle = '#aa1133';
            ctx.fillRect(0, -3, e.r + 10, 6);
            ctx.restore();
        }

        // Player
        const p = this.player;
        if (this.invincible > 0 && Math.floor(this.invincible * 10) % 2 === 0) {
            // Blink
        } else {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(this.aimAngle);
            // Body
            ctx.shadowColor = '#00d4ff';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#00d4ff';
            ctx.beginPath();
            ctx.arc(0, 0, this.playerR, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            // Turret
            ctx.fillStyle = '#0099bb';
            ctx.fillRect(0, -4, this.playerR + 14, 8);
            // Turret tip
            ctx.fillStyle = '#00e6ff';
            ctx.fillRect(this.playerR + 10, -5, 6, 10);
            ctx.restore();
        }

        // Particles
        for (const pt of this.particles) {
            ctx.globalAlpha = Math.max(0, pt.life * 2);
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // HUD
        ctx.fillStyle = '#ff2d7b';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('\u2764'.repeat(this.lives), 12, 28);

        // Touch controls hint
        if ('ontouchstart' in window) {
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = '#fff';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Drag to aim - Tap to fire', W / 2, H - 12);
            ctx.globalAlpha = 1;
        }
    },

    render2P(ctx, W, H) {
        const R = this.playerR;
        const p1 = this.player;
        const p2 = this.player2;

        // P1 bullets (cyan glow)
        ctx.fillStyle = '#00d4ff';
        for (const b of this.p1Bullets) {
            ctx.shadowColor = '#00d4ff';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        // P2 bullets (magenta glow)
        ctx.fillStyle = '#ff2d7b';
        for (const b of this.p2Bullets) {
            ctx.shadowColor = '#ff2d7b';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        // P1 tank (cyan)
        if (this.invincible > 0 && Math.floor(this.invincible * 10) % 2 === 0) {
            // Blink
        } else if (this.lives > 0) {
            ctx.save();
            ctx.translate(p1.x, p1.y);
            ctx.rotate(this.aimAngle);
            ctx.shadowColor = '#00d4ff';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#00d4ff';
            ctx.beginPath();
            ctx.arc(0, 0, R, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#0099bb';
            ctx.fillRect(0, -4, R + 14, 8);
            ctx.fillStyle = '#00e6ff';
            ctx.fillRect(R + 10, -5, 6, 10);
            ctx.restore();
        }

        // P2 tank (magenta)
        if (this.p2Invincible > 0 && Math.floor(this.p2Invincible * 10) % 2 === 0) {
            // Blink
        } else if (this.p2Lives > 0) {
            ctx.save();
            ctx.translate(p2.x, p2.y);
            ctx.rotate(this.p2AimAngle);
            ctx.shadowColor = '#ff2d7b';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#ff2d7b';
            ctx.beginPath();
            ctx.arc(0, 0, R, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#cc1155';
            ctx.fillRect(0, -4, R + 14, 8);
            ctx.fillStyle = '#ff4d9b';
            ctx.fillRect(R + 10, -5, 6, 10);
            ctx.restore();
        }

        // Particles
        for (const pt of this.particles) {
            ctx.globalAlpha = Math.max(0, pt.life * 2);
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // HUD - lives and scores
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#00d4ff';
        ctx.fillText('P1: ' + '\u2764'.repeat(Math.max(0, this.lives)) + '  Kills: ' + this.p1Score, 12, 24);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ff2d7b';
        ctx.fillText('P2: ' + '\u2764'.repeat(Math.max(0, this.p2Lives)) + '  Kills: ' + this.p2Score, W - 12, 24);

        // Controls hint
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#fff';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('P1: WASD + Q fire  |  P2: Arrows + / fire', W / 2, H - 10);
        ctx.globalAlpha = 1;
    },

    endGame() {
        this.gameOver = true;
        cancelAnimationFrame(this.animFrame);
        this.render();
        this.ui.setHighScore(this.score);
        const best = this.ui.getHighScore();
        this.ui.showGameOver(this.score, best);
    },

    getCanvasPos(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left) * (this.ui.canvasW / rect.width),
            y: (clientY - rect.top) * (this.ui.canvasH / rect.height)
        };
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') { this.togglePause(); return; }
        if (this.is2P()) {
            if (['w', 'a', 's', 'd', 'q', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '/'].includes(e.key)) {
                e.preventDefault();
                this.keys[e.key] = true;
            }
        } else {
            if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
                this.keys[e.key] = true;
            }
        }
    },

    handleKeyUp(e) { this.keys[e.key] = false; },

    handleMouseMove(e) {
        const pos = this.getCanvasPos(e.clientX, e.clientY);
        this.mouseX = pos.x;
        this.mouseY = pos.y;
    },

    handleMouseDown(e) {
        this.mouseDown = true;
        const pos = this.getCanvasPos(e.clientX, e.clientY);
        this.mouseX = pos.x;
        this.mouseY = pos.y;
    },

    handleMouseUp() { this.mouseDown = false; },

    handleTouchStart(e) {
        e.preventDefault();
        this.mouseDown = true;
        const pos = this.getCanvasPos(e.touches[0].clientX, e.touches[0].clientY);
        this.mouseX = pos.x;
        this.mouseY = pos.y;
    },

    handleTouchMove(e) {
        e.preventDefault();
        const pos = this.getCanvasPos(e.touches[0].clientX, e.touches[0].clientY);
        this.mouseX = pos.x;
        this.mouseY = pos.y;
    },

    handleTouchEnd(e) {
        e.preventDefault();
        this.mouseDown = false;
    },

    togglePause() {
        if (this.gameOver) return;
        this.paused = !this.paused;
        if (this.paused) this.ui.showPause();
        else this.ui.hidePause();
    },

    pause() { if (!this.paused) this.togglePause(); },
    resume() { if (this.paused) this.togglePause(); },

    destroy() {
        cancelAnimationFrame(this.animFrame);
        document.removeEventListener('keydown', this.handleKey);
        document.removeEventListener('keyup', this.handleKeyUp);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    }
};

export default Tanks;
