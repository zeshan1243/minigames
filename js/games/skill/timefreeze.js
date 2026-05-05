const TimeFreeze = {
    canvas: null,
    ctx: null,
    ui: null,
    animFrame: null,
    gameOver: false,
    paused: false,
    lastTime: 0,
    score: 0,
    elapsed: 0,

    // Player
    player: null,
    playerSpeed: 280,

    // Time freeze ability
    freezeActive: false,
    freezeTimer: 0,
    freezeDuration: 2,
    freezeCooldown: 0,
    freezeCooldownMax: 10,
    freezePulse: 0, // screen pulse effect on activation

    // Bullets
    bullets: [],
    bulletSpawnTimer: 0,
    bulletSpawnInterval: 0.8,
    difficulty: 1,
    spiralAngle: 0,

    // Particles
    particles: [],
    nearMissParticles: [],

    // Input
    keys: {},
    touchActive: false,
    touchX: 0,
    touchY: 0,
    lastTapTime: 0,

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this.handleKey = this.handleKey.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        document.addEventListener('keydown', this.handleKey);
        document.addEventListener('keyup', this.handleKeyUp);
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
        this.player = { x: W / 2, y: H / 2, r: 14 };
        this.score = 0;
        this.elapsed = 0;
        this.bullets = [];
        this.particles = [];
        this.nearMissParticles = [];
        this.bulletSpawnTimer = 0;
        this.bulletSpawnInterval = 0.8;
        this.difficulty = 1;
        this.spiralAngle = 0;
        this.freezeActive = false;
        this.freezeTimer = 0;
        this.freezeCooldown = 0;
        this.freezePulse = 0;
        this.keys = {};
        this.touchActive = false;
        this.lastTapTime = 0;
        this.ui.setScore(0);
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
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        const p = this.player;

        this.elapsed += dt;
        this.score = Math.floor(this.elapsed);
        this.ui.setScore(this.score);
        this.difficulty = 1 + this.elapsed * 0.06;

        // Player movement
        let dx = 0, dy = 0;
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) dx -= 1;
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) dx += 1;
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) dy -= 1;
        if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) dy += 1;

        // Touch drag control
        if (this.touchActive) {
            const tdx = this.touchX - p.x;
            const tdy = this.touchY - p.y;
            const dist = Math.sqrt(tdx * tdx + tdy * tdy);
            if (dist > 5) {
                dx = tdx / dist;
                dy = tdy / dist;
            }
        }

        // Normalize diagonal movement
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag > 0) {
            dx /= mag;
            dy /= mag;
        }
        p.x += dx * this.playerSpeed * dt;
        p.y += dy * this.playerSpeed * dt;
        // Clamp to canvas bounds
        p.x = Math.max(p.r, Math.min(W - p.r, p.x));
        p.y = Math.max(p.r, Math.min(H - p.r, p.y));

        // Time freeze logic
        if (this.freezeActive) {
            this.freezeTimer -= dt;
            if (this.freezeTimer <= 0) {
                this.freezeActive = false;
                this.freezeTimer = 0;
                this.freezeCooldown = this.freezeCooldownMax;
            }
        } else {
            if (this.freezeCooldown > 0) {
                this.freezeCooldown -= dt;
                if (this.freezeCooldown < 0) this.freezeCooldown = 0;
            }
        }

        // Freeze pulse decay
        if (this.freezePulse > 0) {
            this.freezePulse -= dt * 2;
            if (this.freezePulse < 0) this.freezePulse = 0;
        }

        // Spawn bullets
        this.bulletSpawnTimer += dt;
        const interval = Math.max(0.12, this.bulletSpawnInterval / this.difficulty);
        if (this.bulletSpawnTimer >= interval) {
            this.bulletSpawnTimer = 0;
            this.spawnBullets(W, H);
        }

        // Update bullets (only move if freeze is not active)
        const bulletSpeed = this.freezeActive ? 0 : 1;
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];

            if (bulletSpeed > 0) {
                // Homing bullets adjust direction toward player
                if (b.type === 'homing') {
                    const hdx = p.x - b.x;
                    const hdy = p.y - b.y;
                    const hd = Math.sqrt(hdx * hdx + hdy * hdy);
                    if (hd > 0) {
                        const turnRate = 1.5 * dt;
                        b.vx += (hdx / hd) * turnRate * b.speed;
                        b.vy += (hdy / hd) * turnRate * b.speed;
                        // Normalize to maintain speed
                        const vm = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                        if (vm > 0) {
                            b.vx = (b.vx / vm) * b.speed;
                            b.vy = (b.vy / vm) * b.speed;
                        }
                    }
                }

                // Spiral bullets rotate
                if (b.type === 'spiral') {
                    b.angle += b.rotSpeed * dt;
                    b.vx = Math.cos(b.angle) * b.speed;
                    b.vy = Math.sin(b.angle) * b.speed;
                }

                b.x += b.vx * dt;
                b.y += b.vy * dt;
            }

            // Remove off-screen bullets (with generous margin)
            if (b.x < -50 || b.x > W + 50 || b.y < -50 || b.y > H + 50) {
                this.bullets.splice(i, 1);
                continue;
            }

            // Collision with player (skip during freeze)
            if (!this.freezeActive) {
                const cdx = p.x - b.x;
                const cdy = p.y - b.y;
                const distSq = cdx * cdx + cdy * cdy;
                const hitDist = p.r * 0.6 + b.r; // Slightly forgiving hitbox
                if (distSq < hitDist * hitDist) {
                    this.endGame();
                    return;
                }

                // Near-miss particles
                const nearDist = p.r * 2.5 + b.r;
                if (distSq < nearDist * nearDist && distSq >= hitDist * hitDist) {
                    if (Math.random() < 0.3) {
                        this.spawnNearMissParticle(b.x, b.y, b.color);
                    }
                }
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

        // Update near-miss particles
        for (let i = this.nearMissParticles.length - 1; i >= 0; i--) {
            const pt = this.nearMissParticles[i];
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.life -= dt;
            if (pt.life <= 0) this.nearMissParticles.splice(i, 1);
        }
    },

    spawnBullets(W, H) {
        // Determine which types are available based on difficulty
        const types = ['straight'];
        if (this.difficulty > 1.5) types.push('homing');
        if (this.difficulty > 2.5) types.push('spiral');

        const type = types[Math.floor(Math.random() * types.length)];
        const p = this.player;

        // Spawn from a random edge
        const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
        let x, y;
        switch (edge) {
            case 0: x = Math.random() * W; y = -10; break;
            case 1: x = W + 10; y = Math.random() * H; break;
            case 2: x = Math.random() * W; y = H + 10; break;
            case 3: x = -10; y = Math.random() * H; break;
        }

        const speed = 120 + this.difficulty * 25;

        if (type === 'straight') {
            // Aim roughly toward center area with some randomness
            const tx = W / 2 + (Math.random() - 0.5) * W * 0.6;
            const ty = H / 2 + (Math.random() - 0.5) * H * 0.6;
            const dx = tx - x;
            const dy = ty - y;
            const d = Math.sqrt(dx * dx + dy * dy);
            this.bullets.push({
                x, y,
                vx: (dx / d) * speed,
                vy: (dy / d) * speed,
                r: 4,
                speed,
                type: 'straight',
                color: '#ff2d7b'
            });
        } else if (type === 'homing') {
            const dx = p.x - x;
            const dy = p.y - y;
            const d = Math.sqrt(dx * dx + dy * dy);
            const hSpeed = speed * 0.7;
            this.bullets.push({
                x, y,
                vx: (dx / d) * hSpeed,
                vy: (dy / d) * hSpeed,
                r: 5,
                speed: hSpeed,
                type: 'homing',
                color: '#ffd60a'
            });
        } else if (type === 'spiral') {
            const angle = Math.atan2(p.y - y, p.x - x);
            const sSpeed = speed * 0.8;
            this.bullets.push({
                x, y,
                vx: Math.cos(angle) * sSpeed,
                vy: Math.sin(angle) * sSpeed,
                r: 3.5,
                speed: sSpeed,
                type: 'spiral',
                angle,
                rotSpeed: 2 + Math.random() * 2,
                color: '#aa44ff'
            });
        }

        // Extra bullets at higher difficulty
        if (this.difficulty > 3 && Math.random() < 0.3) {
            this.spawnBullets(W, H);
        }
    },

    activateFreeze() {
        if (this.freezeActive || this.freezeCooldown > 0 || this.gameOver || this.paused) return;
        this.freezeActive = true;
        this.freezeTimer = this.freezeDuration;
        this.freezePulse = 1;
        // Spawn burst particles around player
        for (let i = 0; i < 20; i++) {
            const a = (Math.PI * 2 * i) / 20;
            const s = 80 + Math.random() * 60;
            this.particles.push({
                x: this.player.x,
                y: this.player.y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                r: 2 + Math.random() * 2,
                color: '#66ccff',
                life: 0.6 + Math.random() * 0.3
            });
        }
    },

    spawnNearMissParticle(x, y, color) {
        const a = Math.random() * Math.PI * 2;
        const s = 30 + Math.random() * 50;
        this.nearMissParticles.push({
            x, y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            r: 1.5 + Math.random() * 1.5,
            color: '#ffffff',
            life: 0.2 + Math.random() * 0.2
        });
    },

    render() {
        const ctx = this.ctx;
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        const p = this.player;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Freeze pulse overlay
        if (this.freezePulse > 0) {
            ctx.fillStyle = `rgba(0, 150, 255, ${this.freezePulse * 0.15})`;
            ctx.fillRect(0, 0, W, H);
        }

        // Blue tint during freeze
        if (this.freezeActive) {
            ctx.fillStyle = 'rgba(0, 80, 180, 0.08)';
            ctx.fillRect(0, 0, W, H);
        }

        // Subtle grid
        ctx.strokeStyle = this.freezeActive
            ? 'rgba(0, 150, 255, 0.06)'
            : 'rgba(0, 212, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx < W; gx += 40) {
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, H);
            ctx.stroke();
        }
        for (let gy = 0; gy < H; gy += 40) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(W, gy);
            ctx.stroke();
        }

        // Near-miss particles
        for (const pt of this.nearMissParticles) {
            ctx.globalAlpha = Math.max(0, pt.life * 4);
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Bullets
        for (const b of this.bullets) {
            const glow = this.freezeActive ? 18 : 8;
            ctx.shadowColor = b.color;
            ctx.shadowBlur = glow;
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();

            // Extra bright core during freeze
            if (this.freezeActive) {
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.r * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }
        ctx.shadowBlur = 0;

        // Particles
        for (const pt of this.particles) {
            ctx.globalAlpha = Math.max(0, pt.life * 2);
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Player: glowing cyan diamond
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.PI / 4);

        // Outer glow
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = this.freezeActive ? 30 : 18;
        ctx.fillStyle = '#00d4ff';
        const size = p.r;
        ctx.fillRect(-size / 2, -size / 2, size, size);

        // Inner brighter core
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#88eeff';
        const inner = size * 0.5;
        ctx.fillRect(-inner / 2, -inner / 2, inner, inner);

        ctx.restore();

        // Cooldown indicator: circular progress ring around player
        if (!this.freezeActive && this.freezeCooldown > 0) {
            const progress = 1 - (this.freezeCooldown / this.freezeCooldownMax);
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r + 8, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
            ctx.stroke();
        }

        // Ready indicator when freeze is available
        if (!this.freezeActive && this.freezeCooldown <= 0) {
            const pulse = 0.3 + Math.sin(this.elapsed * 3) * 0.15;
            ctx.strokeStyle = `rgba(0, 212, 255, ${pulse})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r + 8, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Freeze timer bar when active
        if (this.freezeActive) {
            const barW = 60;
            const barH = 5;
            const barX = p.x - barW / 2;
            const barY = p.y - p.r - 18;
            const fill = this.freezeTimer / this.freezeDuration;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = '#00d4ff';
            ctx.fillRect(barX, barY, barW * fill, barH);
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.6)';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barW, barH);
        }

        // HUD
        ctx.fillStyle = '#8888a0';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`Time: ${this.score}s`, 12, 12);

        // Freeze status
        ctx.textAlign = 'right';
        if (this.freezeActive) {
            ctx.fillStyle = '#00d4ff';
            ctx.fillText(`FROZEN ${this.freezeTimer.toFixed(1)}s`, W - 12, 12);
        } else if (this.freezeCooldown > 0) {
            ctx.fillStyle = '#555570';
            ctx.fillText(`Freeze: ${Math.ceil(this.freezeCooldown)}s`, W - 12, 12);
        } else {
            ctx.fillStyle = '#00d4ff';
            ctx.fillText('Freeze READY [Shift/F]', W - 12, 12);
        }

        // Bullet type legend (bottom-left)
        ctx.textAlign = 'left';
        ctx.font = '11px sans-serif';
        const legendY = H - 16;
        ctx.fillStyle = '#ff2d7b';
        ctx.fillText('\u25cf', 12, legendY);
        ctx.fillStyle = '#666';
        ctx.fillText(' Straight', 22, legendY);
        if (this.difficulty > 1.5) {
            ctx.fillStyle = '#ffd60a';
            ctx.fillText('\u25cf', 90, legendY);
            ctx.fillStyle = '#666';
            ctx.fillText(' Homing', 100, legendY);
        }
        if (this.difficulty > 2.5) {
            ctx.fillStyle = '#aa44ff';
            ctx.fillText('\u25cf', 165, legendY);
            ctx.fillStyle = '#666';
            ctx.fillText(' Spiral', 175, legendY);
        }
    },

    endGame() {
        this.gameOver = true;
        cancelAnimationFrame(this.animFrame);
        // Death explosion particles
        for (let i = 0; i < 30; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 80 + Math.random() * 200;
            this.particles.push({
                x: this.player.x,
                y: this.player.y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                r: 2 + Math.random() * 3,
                color: Math.random() < 0.5 ? '#00d4ff' : '#ff2d7b',
                life: 0.5 + Math.random() * 0.5
            });
        }
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
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
            e.preventDefault();
        }
        this.keys[e.key] = true;

        // Activate freeze on Shift or F
        if (e.key === 'Shift' || e.key === 'f' || e.key === 'F') {
            this.activateFreeze();
        }
    },

    handleKeyUp(e) {
        this.keys[e.key] = false;
    },

    handleTouchStart(e) {
        e.preventDefault();
        const now = performance.now();
        const pos = this.getCanvasPos(e.touches[0].clientX, e.touches[0].clientY);

        // Double-tap detection for freeze
        if (now - this.lastTapTime < 300) {
            this.activateFreeze();
        }
        this.lastTapTime = now;

        this.touchActive = true;
        this.touchX = pos.x;
        this.touchY = pos.y;
    },

    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length > 0) {
            const pos = this.getCanvasPos(e.touches[0].clientX, e.touches[0].clientY);
            this.touchX = pos.x;
            this.touchY = pos.y;
        }
    },

    handleTouchEnd(e) {
        e.preventDefault();
        this.touchActive = false;
    },

    togglePause() {
        if (this.gameOver) return;
        this.paused = !this.paused;
        if (this.paused) this.ui.showPause();
        else {
            this.ui.hidePause();
            this.lastTime = performance.now();
        }
    },

    pause() { if (!this.paused) this.togglePause(); },
    resume() { if (this.paused) this.togglePause(); },

    destroy() {
        cancelAnimationFrame(this.animFrame);
        document.removeEventListener('keydown', this.handleKey);
        document.removeEventListener('keyup', this.handleKeyUp);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    }
};

export default TimeFreeze;
