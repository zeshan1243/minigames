const Archery = {
    canvas: null,
    ctx: null,
    ui: null,
    score: 0,
    gameOver: false,
    paused: false,
    animFrame: null,
    target: null,
    arrows: [],
    arrowsLeft: 10,
    charging: false,
    power: 0,
    flyingArrow: null,
    particles: [],
    hitTexts: [],
    wind: 0,

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        canvas.addEventListener('mousedown', this.handleMouseDown);
        canvas.addEventListener('mouseup', this.handleMouseUp);
        canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    },

    start() {
        this.reset();
        this.gameOver = false;
        this.paused = false;
        this.ui.hideGameOver();
        this.ui.hidePause();
        this.loop();
    },

    reset() {
        cancelAnimationFrame(this.animFrame);
        this.score = 0;
        this.arrowsLeft = 10;
        this.ui.setScore(0);
        this.arrows = [];
        this.particles = [];
        this.hitTexts = [];
        this.charging = false;
        this.power = 0;
        this.flyingArrow = null;
        this.wind = 0;
        this.spawnTarget();
    },

    spawnTarget() {
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;
        this.target = {
            x: w / 2,
            y: 80 + Math.random() * (h * 0.3),
            r: 50,
            vx: 1.5 + Math.random() * 2,
            dir: Math.random() > 0.5 ? 1 : -1
        };
        this.wind = (Math.random() - 0.5) * 2;
    },

    loop() {
        if (this.gameOver) return;
        if (!this.paused) {
            this.update();
        }
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update() {
        const w = this.ui.canvasW;
        const t = this.target;

        // Move target
        t.x += t.vx * t.dir;
        if (t.x - t.r < 20 || t.x + t.r > w - 20) {
            t.dir *= -1;
        }

        // Charge power
        if (this.charging && !this.flyingArrow) {
            this.power = Math.min(1, this.power + 0.015);
        }

        // Flying arrow
        if (this.flyingArrow) {
            const a = this.flyingArrow;
            a.x += a.vx + this.wind * 0.3;
            a.y += a.vy;

            // Check if arrow reached target area
            const dist = Math.sqrt((a.x - t.x) ** 2 + (a.y - t.y) ** 2);
            if (a.y <= t.y + t.r) {
                if (dist <= t.r) {
                    // Hit!
                    const ringScore = this.getRingScore(dist, t.r);
                    this.score += ringScore;
                    this.ui.setScore(this.score);
                    this.arrows.push({ x: a.x, y: a.y });
                    this.addHitText(a.x, a.y, ringScore);
                    this.spawnParticles(a.x, a.y, ringScore >= 8 ? '#ffd60a' : '#00d4ff', 10);
                } else {
                    // Miss
                    this.addHitText(a.x, a.y, 0);
                }
                this.flyingArrow = null;
                this.arrowsLeft--;

                if (this.arrowsLeft <= 0) {
                    setTimeout(() => this.endGame(), 500);
                } else {
                    this.spawnTarget();
                }
            }

            // Arrow went off screen
            if (a.y < -50) {
                this.flyingArrow = null;
                this.arrowsLeft--;
                this.addHitText(w / 2, 100, 0);
                if (this.arrowsLeft <= 0) {
                    setTimeout(() => this.endGame(), 500);
                } else {
                    this.spawnTarget();
                }
            }
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.03;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Hit texts
        for (let i = this.hitTexts.length - 1; i >= 0; i--) {
            const ht = this.hitTexts[i];
            ht.y -= 1;
            ht.life -= 0.02;
            if (ht.life <= 0) this.hitTexts.splice(i, 1);
        }
    },

    getRingScore(dist, maxR) {
        const ratio = dist / maxR;
        if (ratio < 0.15) return 10;
        if (ratio < 0.30) return 8;
        if (ratio < 0.45) return 6;
        if (ratio < 0.60) return 4;
        if (ratio < 0.80) return 2;
        return 1;
    },

    shoot() {
        if (this.gameOver || this.paused || this.flyingArrow || !this.charging) return;
        this.charging = false;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;
        const speed = 5 + this.power * 12;
        this.flyingArrow = {
            x: w / 2,
            y: h - 60,
            vx: 0,
            vy: -speed
        };
        this.power = 0;
    },

    startCharge() {
        if (this.gameOver || this.paused || this.flyingArrow) return;
        this.charging = true;
        this.power = 0;
    },

    addHitText(x, y, pts) {
        let text, color;
        if (pts >= 10) { text = 'BULLSEYE! +10'; color = '#ffd60a'; }
        else if (pts >= 6) { text = `+${pts}`; color = '#00d4ff'; }
        else if (pts > 0) { text = `+${pts}`; color = '#00e676'; }
        else { text = 'MISS'; color = '#ff2d7b'; }
        this.hitTexts.push({ x, y, text, color, life: 1 });
    },

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color,
                size: 2 + Math.random() * 3
            });
        }
    },

    render() {
        const ctx = this.ctx;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;
        const t = this.target;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Ground area
        ctx.fillStyle = '#0d0d14';
        ctx.fillRect(0, h - 30, w, 30);

        // Target
        const rings = [
            { ratio: 1.0, color: '#ffffff' },
            { ratio: 0.85, color: '#ff2d7b' },
            { ratio: 0.65, color: '#ffffff' },
            { ratio: 0.50, color: '#ff2d7b' },
            { ratio: 0.30, color: '#ffd60a' },
            { ratio: 0.15, color: '#ffd60a' }
        ];

        // Target glow
        const tGlow = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.r * 2);
        tGlow.addColorStop(0, 'rgba(255,214,10,0.08)');
        tGlow.addColorStop(1, 'rgba(255,214,10,0)');
        ctx.fillStyle = tGlow;
        ctx.fillRect(t.x - t.r * 2, t.y - t.r * 2, t.r * 4, t.r * 4);

        for (const ring of rings) {
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.r * ring.ratio, 0, Math.PI * 2);
            ctx.fillStyle = ring.color;
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Stuck arrows in target
        for (const a of this.arrows) {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(a.x - 1.5, a.y - 8, 3, 16);
            ctx.fillStyle = '#00d4ff';
            ctx.beginPath();
            ctx.moveTo(a.x, a.y - 10);
            ctx.lineTo(a.x - 4, a.y - 4);
            ctx.lineTo(a.x + 4, a.y - 4);
            ctx.fill();
        }

        // Flying arrow
        if (this.flyingArrow) {
            const a = this.flyingArrow;
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(a.x - 1.5, a.y, 3, 30);
            ctx.fillStyle = '#00d4ff';
            ctx.beginPath();
            ctx.moveTo(a.x, a.y - 4);
            ctx.lineTo(a.x - 4, a.y + 4);
            ctx.lineTo(a.x + 4, a.y + 4);
            ctx.fill();
            // Fletching
            ctx.fillStyle = '#ff2d7b';
            ctx.beginPath();
            ctx.moveTo(a.x - 4, a.y + 26);
            ctx.lineTo(a.x, a.y + 22);
            ctx.lineTo(a.x + 4, a.y + 26);
            ctx.lineTo(a.x, a.y + 30);
            ctx.fill();
        }

        // Bow at bottom
        if (!this.flyingArrow) {
            const bowX = w / 2;
            const bowY = h - 60;
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(bowX, bowY, 25, Math.PI * 0.7, Math.PI * 1.3);
            ctx.stroke();
            // String
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 1;
            const pullBack = this.charging ? this.power * 15 : 0;
            ctx.beginPath();
            ctx.moveTo(bowX - 20, bowY - 18);
            ctx.lineTo(bowX, bowY + pullBack);
            ctx.lineTo(bowX + 20, bowY - 18);
            ctx.stroke();
            // Arrow on bow
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(bowX - 1, bowY - 20 + pullBack, 2, 25);
            ctx.fillStyle = '#00d4ff';
            ctx.beginPath();
            ctx.moveTo(bowX, bowY - 24 + pullBack);
            ctx.lineTo(bowX - 3, bowY - 18 + pullBack);
            ctx.lineTo(bowX + 3, bowY - 18 + pullBack);
            ctx.fill();
        }

        // Power bar
        if (this.charging || this.power > 0) {
            const barX = 20;
            const barY = h - 150;
            const barW = 16;
            const barH = 120;

            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(barX, barY, barW, barH);

            const fillH = this.power * barH;
            const powerColor = this.power < 0.5 ? '#00e676' : this.power < 0.8 ? '#ffd60a' : '#ff2d7b';
            ctx.fillStyle = powerColor;
            ctx.fillRect(barX, barY + barH - fillH, barW, fillH);

            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barW, barH);

            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('PWR', barX + barW / 2, barY + barH + 14);
        }

        // Wind indicator
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '12px Outfit, sans-serif';
        ctx.textAlign = 'center';
        const windDir = this.wind > 0 ? '>>>' : '<<<';
        const windStr = Math.abs(this.wind).toFixed(1);
        ctx.fillText(`Wind: ${windStr} ${windDir}`, w / 2, 20);

        // Arrows remaining
        ctx.fillStyle = '#00d4ff';
        ctx.font = '14px Outfit, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`Arrows: ${this.arrowsLeft}`, w - 15, h - 10);

        // Hit texts
        for (const ht of this.hitTexts) {
            ctx.globalAlpha = ht.life;
            ctx.fillStyle = ht.color;
            ctx.font = 'bold 20px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(ht.text, ht.x, ht.y);
        }
        ctx.globalAlpha = 1;

        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    },

    endGame() {
        this.gameOver = true;
        cancelAnimationFrame(this.animFrame);
        this.ui.setHighScore(this.score);
        const best = this.ui.getHighScore();
        this.ui.showGameOver(this.score, best);
    },

    handleKeyDown(e) {
        if (e.key === 'p' || e.key === 'P') {
            this.togglePause();
            return;
        }
        if (e.key === ' ') {
            e.preventDefault();
            this.startCharge();
        }
    },

    handleKeyUp(e) {
        if (e.key === ' ') {
            e.preventDefault();
            this.shoot();
        }
    },

    handleMouseDown() {
        this.startCharge();
    },

    handleMouseUp() {
        this.shoot();
    },

    handleTouchStart(e) {
        e.preventDefault();
        this.startCharge();
    },

    handleTouchEnd(e) {
        e.preventDefault();
        this.shoot();
    },

    togglePause() {
        if (this.gameOver) return;
        this.paused = !this.paused;
        if (this.paused) {
            this.ui.showPause();
        } else {
            this.ui.hidePause();
        }
    },

    pause() { if (!this.paused) this.togglePause(); },
    resume() { if (this.paused) this.togglePause(); },

    destroy() {
        cancelAnimationFrame(this.animFrame);
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    }
};

export default Archery;
