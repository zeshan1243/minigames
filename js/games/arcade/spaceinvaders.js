const SpaceInvaders = {
    canvas: null, ctx: null, ui: null,
    player: { x: 0, w: 30, h: 20 },
    invaders: [], bullets: [], enemyBullets: [],
    score: 0, lives: 3, gameOver: false, paused: false, animFrame: null,
    moveDir: 1, moveTimer: 0, moveSpeed: 30, shootTimer: 0,
    keys: {},

    // Animation state
    explosions: [],      // { x, y, particles: [{x,y,vx,vy,life,maxLife}], flash: 1 }
    screenShake: 0,      // frames remaining of screen shake
    thrustFrame: 0,      // counter for thrust flame flicker

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.handleKeyDown = (e) => { this.keys[e.key] = true; if (e.key === ' ') { e.preventDefault(); this.shoot(); } if (e.key==='p'||e.key==='P'){this.paused=!this.paused;if(this.paused)ui.showPause();else ui.hidePause();} };
        this.handleKeyUp = (e) => { this.keys[e.key] = false; };
        this.handleTouch = (e) => { e.preventDefault(); const r = canvas.getBoundingClientRect(); const tx = e.touches[0].clientX - r.left; if (tx < ui.canvasW/3) this.keys['ArrowLeft'] = true; else if (tx > ui.canvasW*2/3) this.keys['ArrowRight'] = true; else this.shoot(); setTimeout(() => { this.keys['ArrowLeft'] = false; this.keys['ArrowRight'] = false; }, 100); };
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
    },

    start() {
        // Configure difficulty
        const level = (this.ui && this.ui.level) || 'medium';
        if (level === 'easy') {
            this._invaderRows = 3; this.moveSpeed = 40; this._shootInterval = 90;
            this._hardEdgeBounce = false;
        } else if (level === 'hard') {
            this._invaderRows = 6; this.moveSpeed = 20; this._shootInterval = 35;
            this._hardEdgeBounce = true;
        } else {
            this._invaderRows = 4; this.moveSpeed = 30; this._shootInterval = 60;
            this._hardEdgeBounce = false;
        }

        this.player.x = this.ui.canvasW / 2 - this.player.w / 2;
        this.bullets = []; this.enemyBullets = [];
        this.score = 0; this.lives = 3; this.gameOver = false; this.paused = false;
        this.moveDir = 1; this.moveTimer = 0; this.shootTimer = 0;
        this.explosions = []; this.screenShake = 0; this.thrustFrame = 0;
        this.ui.setScore(0); this.ui.hideGameOver(); this.ui.hidePause();
        this.buildInvaders();
        this.loop();
    },

    buildInvaders() {
        this.invaders = [];
        const rows = this._invaderRows || 4, cols = 8, iw = 28, ih = 20, gap = 8;
        const startX = (this.ui.canvasW - (cols * iw + (cols-1) * gap)) / 2;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.invaders.push({ x: startX + c * (iw + gap), y: 50 + r * (ih + gap + 4), w: iw, h: ih, alive: true });
            }
        }
    },

    shoot() {
        if (this.gameOver || this.paused || this.bullets.length >= 3) return;
        this.bullets.push({ x: this.player.x + this.player.w/2, y: this.ui.canvasH - 50, vy: -6 });
    },

    spawnExplosion(x, y) {
        const particleCount = 6 + Math.floor(Math.random() * 5); // 6-10 particles
        const particles = [];
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i + (Math.random() - 0.5) * 0.5;
            const speed = 1.5 + Math.random() * 2.5;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                maxLife: 18 + Math.floor(Math.random() * 10),
                size: 2 + Math.random() * 3
            });
        }
        this.explosions.push({ x, y, particles, flash: 1 });
    },

    loop() {
        if (this.gameOver) return;
        if (!this.paused) this.update();
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update() {
        const w = this.ui.canvasW, h = this.ui.canvasH;
        if (this.keys['ArrowLeft'] || this.keys['a']) this.player.x = Math.max(0, this.player.x - 4);
        if (this.keys['ArrowRight'] || this.keys['d']) this.player.x = Math.min(w - this.player.w, this.player.x + 4);

        // Thrust animation counter
        this.thrustFrame++;

        // Move invaders
        this.moveTimer++;
        if (this.moveTimer >= this.moveSpeed) {
            this.moveTimer = 0;
            let edgeHit = false;
            for (const inv of this.invaders) {
                if (!inv.alive) continue;
                if ((inv.x + inv.w >= w - 5 && this.moveDir > 0) || (inv.x <= 5 && this.moveDir < 0)) edgeHit = true;
            }
            if (edgeHit) {
                this.moveDir = -this.moveDir;
                for (const inv of this.invaders) { if (inv.alive) inv.y += 12; }
                // Hard mode: speed up on edge bounce
                if (this._hardEdgeBounce && this.moveSpeed > 8) {
                    this.moveSpeed -= 1;
                }
            }
            for (const inv of this.invaders) { if (inv.alive) inv.x += this.moveDir * 10; }
        }

        // Enemy shoot
        this.shootTimer++;
        if (this.shootTimer >= (this._shootInterval || 60)) {
            this.shootTimer = 0;
            const alive = this.invaders.filter(i => i.alive);
            if (alive.length > 0) {
                const shooter = alive[Math.floor(Math.random() * alive.length)];
                this.enemyBullets.push({ x: shooter.x + shooter.w/2, y: shooter.y + shooter.h, vy: 3 });
            }
        }

        // Player bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].y += this.bullets[i].vy;
            if (this.bullets[i].y < 0) { this.bullets.splice(i, 1); continue; }
            for (const inv of this.invaders) {
                if (!inv.alive) continue;
                const b = this.bullets[i]; if (!b) break;
                if (b.x > inv.x && b.x < inv.x + inv.w && b.y > inv.y && b.y < inv.y + inv.h) {
                    inv.alive = false; this.bullets.splice(i, 1);
                    this.score += 10; this.ui.setScore(this.score);
                    // Spawn explosion at invader center
                    this.spawnExplosion(inv.x + inv.w / 2, inv.y + inv.h / 2);
                    break;
                }
            }
        }

        // Enemy bullets
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            this.enemyBullets[i].y += this.enemyBullets[i].vy;
            if (this.enemyBullets[i].y > h) { this.enemyBullets.splice(i, 1); continue; }
            const eb = this.enemyBullets[i];
            if (eb.x > this.player.x && eb.x < this.player.x + this.player.w && eb.y > h - 50 && eb.y < h - 30) {
                this.enemyBullets.splice(i, 1); this.lives--;
                // Screen shake on player hit
                this.screenShake = 6;
                if (this.lives <= 0) { this.endGame(); return; }
            }
        }

        // Update explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const exp = this.explosions[i];
            exp.flash *= 0.7; // flash fades quickly
            let allDead = true;
            for (const p of exp.particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.96; // friction
                p.vy *= 0.96;
                p.life -= 1 / p.maxLife;
                if (p.life > 0) allDead = false;
            }
            if (allDead && exp.flash < 0.01) {
                this.explosions.splice(i, 1);
            }
        }

        // Update screen shake
        if (this.screenShake > 0) this.screenShake--;

        // Win check
        if (this.invaders.every(i => !i.alive)) {
            this.moveSpeed = Math.max(10, this.moveSpeed - 5);
            this.buildInvaders();
        }

        // Lose check - invaders reach bottom
        for (const inv of this.invaders) {
            if (inv.alive && inv.y + inv.h >= h - 60) { this.endGame(); return; }
        }
    },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;

        ctx.save();

        // Apply screen shake
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * 6;
            const shakeY = (Math.random() - 0.5) * 6;
            ctx.translate(shakeX, shakeY);
        }

        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#e8e8f0'; ctx.font = '12px Outfit, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('\u2764'.repeat(this.lives), 10, 20);

        // Invaders
        for (const inv of this.invaders) {
            if (!inv.alive) continue;
            ctx.fillStyle = '#00e676';
            ctx.fillRect(inv.x, inv.y, inv.w, inv.h);
            ctx.fillStyle = '#0a0a0f';
            ctx.fillRect(inv.x + 5, inv.y + 5, 5, 5);
            ctx.fillRect(inv.x + inv.w - 10, inv.y + 5, 5, 5);
        }

        // Explosion particles and flashes
        for (const exp of this.explosions) {
            // Flash at explosion origin
            if (exp.flash > 0.05) {
                ctx.save();
                ctx.globalAlpha = exp.flash;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(exp.x, exp.y, 12 * exp.flash, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            // Particles
            for (const p of exp.particles) {
                if (p.life <= 0) continue;
                ctx.save();
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.fillStyle = p.life > 0.5 ? '#00ff88' : '#00e676';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        // Player
        const px = this.player.x, pw = this.player.w;
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.moveTo(px + pw/2, h - 50);
        ctx.lineTo(px, h - 30);
        ctx.lineTo(px + pw, h - 30);
        ctx.closePath(); ctx.fill();

        // Thrust flame animation
        const isMoving = this.keys['ArrowLeft'] || this.keys['ArrowRight'] || this.keys['a'] || this.keys['d'];
        const flameIntensity = isMoving ? 1 : 0.5;
        const flicker = Math.sin(this.thrustFrame * 0.5) * 0.3 + 0.7;
        const flameH = (6 + Math.random() * 4) * flameIntensity * flicker;
        const flameW = 4 + Math.random() * 2;
        // Main flame (orange-yellow)
        ctx.save();
        ctx.globalAlpha = 0.8 * flicker;
        ctx.fillStyle = '#ffd60a';
        ctx.beginPath();
        ctx.moveTo(px + pw/2 - flameW, h - 30);
        ctx.lineTo(px + pw/2, h - 30 + flameH);
        ctx.lineTo(px + pw/2 + flameW, h - 30);
        ctx.closePath();
        ctx.fill();
        // Inner flame (white-blue)
        ctx.globalAlpha = 0.6 * flicker;
        ctx.fillStyle = '#88eeff';
        const innerW = flameW * 0.5;
        const innerH = flameH * 0.6;
        ctx.beginPath();
        ctx.moveTo(px + pw/2 - innerW, h - 30);
        ctx.lineTo(px + pw/2, h - 30 + innerH);
        ctx.lineTo(px + pw/2 + innerW, h - 30);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Bullets
        ctx.fillStyle = '#ffd60a';
        for (const b of this.bullets) ctx.fillRect(b.x - 1.5, b.y, 3, 10);
        ctx.fillStyle = '#ff2d7b';
        for (const b of this.enemyBullets) ctx.fillRect(b.x - 1.5, b.y, 3, 10);

        ctx.restore(); // end screen shake transform
    },

    endGame() {
        this.gameOver = true; cancelAnimationFrame(this.animFrame);
        this.ui.setHighScore(this.score); this.ui.showGameOver(this.score, this.ui.getHighScore());
    },

    pause() { this.paused = true; this.ui.showPause(); },
    resume() { this.paused = false; this.ui.hidePause(); },
    reset() { cancelAnimationFrame(this.animFrame); },
    destroy() { cancelAnimationFrame(this.animFrame); document.removeEventListener('keydown', this.handleKeyDown); document.removeEventListener('keyup', this.handleKeyUp); }
};
export default SpaceInvaders;
