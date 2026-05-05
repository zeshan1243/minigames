const KnifeThrow = {
    canvas: null,
    ctx: null,
    ui: null,
    score: 0,
    gameOver: false,
    paused: false,
    animFrame: null,
    log: null,
    knives: [],
    currentKnife: null,
    throwingKnife: false,
    hitFlash: 0,
    failFlash: 0,
    particles: [],

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this.handleKey = this.handleKey.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        document.addEventListener('keydown', this.handleKey);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
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
        this.ui.setScore(0);
        this.knives = [];
        this.particles = [];
        this.throwingKnife = false;
        this.hitFlash = 0;
        this.failFlash = 0;

        const w = this.ui.canvasW;
        const h = this.ui.canvasH;

        this.log = {
            x: w / 2,
            y: h * 0.35,
            r: 70,
            angle: 0,
            speed: 0.02,
            stuckKnives: []
        };

        this.spawnKnife();
    },

    spawnKnife() {
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;
        this.currentKnife = {
            x: w / 2,
            y: h - 80,
            vy: 0,
            flying: false,
            length: 40,
            width: 4
        };
        this.throwingKnife = false;
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
        const log = this.log;

        // Rotate log
        log.angle += log.speed;

        // Knife flying
        if (this.currentKnife && this.currentKnife.flying) {
            const k = this.currentKnife;
            k.y += k.vy;

            // Check if knife reached log
            const dist = Math.sqrt((k.x - log.x) ** 2 + (k.y - log.y) ** 2);
            if (dist <= log.r + k.length * 0.4) {
                // Calculate angle of this knife relative to log
                const knifeAngle = Math.atan2(k.x - log.x, log.y - k.y);
                const normalizedAngle = ((knifeAngle - log.angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

                // Check collision with stuck knives
                let hitExisting = false;
                for (const sk of log.stuckKnives) {
                    let angleDiff = Math.abs(normalizedAngle - sk.angle);
                    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
                    if (angleDiff < 0.25) {
                        hitExisting = true;
                        break;
                    }
                }

                if (hitExisting) {
                    this.failFlash = 1;
                    this.spawnParticles(k.x, k.y, '#ff2d7b', 15);
                    this.endGame();
                    return;
                }

                // Stick knife
                log.stuckKnives.push({ angle: normalizedAngle });
                this.score++;
                this.ui.setScore(this.score);
                this.hitFlash = 1;
                this.spawnParticles(k.x, log.y + log.r, '#00d4ff', 8);

                // Speed up rotation
                log.speed = 0.02 + this.score * 0.003;
                // Alternate direction occasionally
                if (this.score % 7 === 0) log.speed = -log.speed;

                this.spawnKnife();
            }
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.life -= 0.03;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        if (this.hitFlash > 0) this.hitFlash -= 0.05;
        if (this.failFlash > 0) this.failFlash -= 0.03;
    },

    throwKnife() {
        if (this.gameOver || this.paused || !this.currentKnife || this.currentKnife.flying) return;
        this.currentKnife.flying = true;
        this.currentKnife.vy = -14;
    },

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
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
        const log = this.log;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Flash effects
        if (this.hitFlash > 0) {
            ctx.fillStyle = `rgba(0,212,255,${this.hitFlash * 0.08})`;
            ctx.fillRect(0, 0, w, h);
        }
        if (this.failFlash > 0) {
            ctx.fillStyle = `rgba(255,45,123,${this.failFlash * 0.15})`;
            ctx.fillRect(0, 0, w, h);
        }

        // Log (circle)
        ctx.save();
        ctx.translate(log.x, log.y);
        ctx.rotate(log.angle);

        // Log shadow
        ctx.beginPath();
        ctx.arc(3, 3, log.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();

        // Log body
        ctx.beginPath();
        ctx.arc(0, 0, log.r, 0, Math.PI * 2);
        const logGrd = ctx.createRadialGradient(0, 0, 0, 0, 0, log.r);
        logGrd.addColorStop(0, '#5a3a1a');
        logGrd.addColorStop(0.5, '#4a2a10');
        logGrd.addColorStop(1, '#3a1a05');
        ctx.fillStyle = logGrd;
        ctx.fill();
        ctx.strokeStyle = '#2a1000';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Tree rings
        for (let r = 15; r < log.r; r += 15) {
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(90,58,26,0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Center dot
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#6a4a2a';
        ctx.fill();

        // Stuck knives
        for (const sk of log.stuckKnives) {
            ctx.save();
            ctx.rotate(sk.angle);
            // Knife blade
            ctx.fillStyle = '#c0c0c0';
            ctx.fillRect(-2, -log.r - 28, 4, 30);
            // Knife handle
            ctx.fillStyle = '#ff2d7b';
            ctx.fillRect(-3, -log.r - 38, 6, 12);
            // Blade shine
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(-0.5, -log.r - 25, 1, 20);
            ctx.restore();
        }

        ctx.restore();

        // Current knife (waiting or flying)
        if (this.currentKnife) {
            const k = this.currentKnife;
            // Knife blade
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(k.x - 2, k.y - 20, 4, 30);
            // Knife handle
            ctx.fillStyle = '#ff2d7b';
            ctx.fillRect(k.x - 3.5, k.y + 8, 7, 14);
            // Blade shine
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(k.x - 0.5, k.y - 15, 1, 22);

            // Glow when ready
            if (!k.flying) {
                const grd = ctx.createRadialGradient(k.x, k.y, 0, k.x, k.y, 25);
                grd.addColorStop(0, 'rgba(255,45,123,0.2)');
                grd.addColorStop(1, 'rgba(255,45,123,0)');
                ctx.fillStyle = grd;
                ctx.fillRect(k.x - 25, k.y - 25, 50, 50);
            }
        }

        // Remaining knives indicator (decorative dots at bottom)
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.font = '13px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TAP / SPACE to throw', w / 2, h - 20);

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

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') {
            this.togglePause();
            return;
        }
        if (e.key === ' ') {
            e.preventDefault();
            this.throwKnife();
        }
    },

    handleClick() {
        this.throwKnife();
    },

    handleTouch(e) {
        e.preventDefault();
        this.throwKnife();
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
        document.removeEventListener('keydown', this.handleKey);
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('touchstart', this.handleTouch);
    }
};

export default KnifeThrow;
