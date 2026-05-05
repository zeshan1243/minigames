const Darts = {
    canvas: null,
    ctx: null,
    ui: null,
    score: 0,
    gameOver: false,
    paused: false,
    animFrame: null,
    crosshair: null,
    round: 1,
    dartsInRound: 3,
    totalRounds: 5,
    thrownDarts: [],
    throwing: false,
    throwAnim: null,
    particles: [],
    hitTexts: [],
    boardX: 0,
    boardY: 0,
    boardR: 0,

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
        this.round = 1;
        this.dartsInRound = 3;
        this.thrownDarts = [];
        this.throwing = false;
        this.throwAnim = null;
        this.particles = [];
        this.hitTexts = [];
        this.ui.setScore(0);

        const w = this.ui.canvasW;
        const h = this.ui.canvasH;
        this.boardX = w / 2;
        this.boardY = h * 0.4;
        this.boardR = Math.min(w, h) * 0.3;

        this.crosshair = {
            x: w / 2,
            y: h * 0.4,
            time: 0,
            freqX: 0.8 + Math.random() * 0.5,
            freqY: 1.1 + Math.random() * 0.5,
            ampX: 60 + Math.random() * 40,
            ampY: 40 + Math.random() * 30,
            phaseX: Math.random() * Math.PI * 2,
            phaseY: Math.random() * Math.PI * 2
        };
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
        const c = this.crosshair;
        c.time += 0.016;

        // Sway crosshair with Lissajous-like pattern
        const sway = 1 + (this.round - 1) * 0.15;
        c.x = this.boardX + Math.sin(c.time * c.freqX + c.phaseX) * c.ampX * sway;
        c.y = this.boardY + Math.cos(c.time * c.freqY + c.phaseY) * c.ampY * sway;

        // Throw animation
        if (this.throwAnim) {
            this.throwAnim.progress += 0.08;
            if (this.throwAnim.progress >= 1) {
                const ta = this.throwAnim;
                this.thrownDarts.push({ x: ta.targetX, y: ta.targetY });
                const pts = this.calculateScore(ta.targetX, ta.targetY);
                this.score += pts;
                this.ui.setScore(this.score);
                this.addHitText(ta.targetX, ta.targetY, pts);
                this.spawnParticles(ta.targetX, ta.targetY, pts > 0 ? '#ffd60a' : '#ff2d7b', 8);
                this.throwAnim = null;
                this.throwing = false;

                this.dartsInRound--;
                if (this.dartsInRound <= 0) {
                    this.round++;
                    if (this.round > this.totalRounds) {
                        setTimeout(() => this.endGame(), 600);
                    } else {
                        this.dartsInRound = 3;
                        this.randomizeCrosshair();
                    }
                }
            }
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.08;
            p.life -= 0.03;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Hit texts
        for (let i = this.hitTexts.length - 1; i >= 0; i--) {
            const ht = this.hitTexts[i];
            ht.y -= 0.8;
            ht.life -= 0.02;
            if (ht.life <= 0) this.hitTexts.splice(i, 1);
        }
    },

    randomizeCrosshair() {
        this.crosshair.freqX = 0.8 + Math.random() * 0.8;
        this.crosshair.freqY = 1.0 + Math.random() * 0.8;
        this.crosshair.phaseX = Math.random() * Math.PI * 2;
        this.crosshair.phaseY = Math.random() * Math.PI * 2;
    },

    calculateScore(x, y) {
        const dx = x - this.boardX;
        const dy = y - this.boardY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ratio = dist / this.boardR;

        if (ratio > 1) return 0;
        if (ratio < 0.05) return 50;  // Bullseye
        if (ratio < 0.12) return 25;  // Inner bull
        if (ratio < 0.25) return 20;
        if (ratio < 0.40) return 15;
        if (ratio < 0.55) return 10;
        if (ratio < 0.70) return 5;
        if (ratio < 0.85) return 3;
        return 1;
    },

    throwDart() {
        if (this.gameOver || this.paused || this.throwing) return;
        this.throwing = true;
        const c = this.crosshair;
        this.throwAnim = {
            targetX: c.x,
            targetY: c.y,
            progress: 0
        };
    },

    addHitText(x, y, pts) {
        let text, color;
        if (pts >= 50) { text = 'BULLSEYE! +50'; color = '#ffd60a'; }
        else if (pts >= 25) { text = '+25'; color = '#ffd60a'; }
        else if (pts >= 15) { text = `+${pts}`; color = '#00d4ff'; }
        else if (pts > 0) { text = `+${pts}`; color = '#00e676'; }
        else { text = 'MISS'; color = '#ff2d7b'; }
        this.hitTexts.push({ x, y: y - 20, text, color, life: 1 });
    },

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                life: 1, color,
                size: 2 + Math.random() * 3
            });
        }
    },

    render() {
        const ctx = this.ctx;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;
        const bx = this.boardX;
        const by = this.boardY;
        const br = this.boardR;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Board glow
        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, br * 1.5);
        glow.addColorStop(0, 'rgba(255,214,10,0.05)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);

        // Dartboard rings
        const ringDefs = [
            { ratio: 1.00, color: '#1a1a2e' },
            { ratio: 0.85, color: '#0f3460' },
            { ratio: 0.70, color: '#16213e' },
            { ratio: 0.55, color: '#0f3460' },
            { ratio: 0.40, color: '#e94560' },
            { ratio: 0.25, color: '#16213e' },
            { ratio: 0.12, color: '#00e676' },
            { ratio: 0.05, color: '#ff2d7b' }
        ];

        for (const ring of ringDefs) {
            ctx.beginPath();
            ctx.arc(bx, by, br * ring.ratio, 0, Math.PI * 2);
            ctx.fillStyle = ring.color;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Radial lines
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(bx + Math.cos(angle) * br * 0.12, by + Math.sin(angle) * br * 0.12);
            ctx.lineTo(bx + Math.cos(angle) * br, by + Math.sin(angle) * br);
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Board border
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Thrown darts
        for (const d of this.thrownDarts) {
            // Dart body
            ctx.fillStyle = '#c0c0c0';
            ctx.fillRect(d.x - 2, d.y - 6, 4, 12);
            // Dart tip
            ctx.fillStyle = '#ffd60a';
            ctx.beginPath();
            ctx.moveTo(d.x, d.y - 8);
            ctx.lineTo(d.x - 3, d.y - 4);
            ctx.lineTo(d.x + 3, d.y - 4);
            ctx.fill();
            // Dart flight
            ctx.fillStyle = '#ff2d7b';
            ctx.beginPath();
            ctx.moveTo(d.x - 5, d.y + 6);
            ctx.lineTo(d.x, d.y + 2);
            ctx.lineTo(d.x + 5, d.y + 6);
            ctx.fill();
        }

        // Throw animation dart
        if (this.throwAnim) {
            const ta = this.throwAnim;
            const startY = h + 20;
            const curY = startY + (ta.targetY - startY) * ta.progress;
            const curX = w / 2 + (ta.targetX - w / 2) * ta.progress;
            const scale = 1.5 - ta.progress * 0.5;
            ctx.save();
            ctx.translate(curX, curY);
            ctx.scale(scale, scale);
            ctx.fillStyle = '#c0c0c0';
            ctx.fillRect(-2, -6, 4, 12);
            ctx.fillStyle = '#ffd60a';
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(-3, -4);
            ctx.lineTo(3, -4);
            ctx.fill();
            ctx.fillStyle = '#ff2d7b';
            ctx.beginPath();
            ctx.moveTo(-5, 6);
            ctx.lineTo(0, 2);
            ctx.lineTo(5, 6);
            ctx.fill();
            ctx.restore();
        }

        // Crosshair (when not throwing)
        if (!this.throwing) {
            const c = this.crosshair;
            ctx.strokeStyle = '#00d4ff';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            // Horizontal
            ctx.beginPath();
            ctx.moveTo(c.x - 18, c.y);
            ctx.lineTo(c.x + 18, c.y);
            ctx.stroke();
            // Vertical
            ctx.beginPath();
            ctx.moveTo(c.x, c.y - 18);
            ctx.lineTo(c.x, c.y + 18);
            ctx.stroke();
            ctx.setLineDash([]);
            // Circle
            ctx.beginPath();
            ctx.arc(c.x, c.y, 12, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0,212,255,0.5)';
            ctx.stroke();
            // Dot
            ctx.beginPath();
            ctx.arc(c.x, c.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#00d4ff';
            ctx.fill();
        }

        // HUD
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '14px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Round ${Math.min(this.round, this.totalRounds)} / ${this.totalRounds}`, 15, h - 30);
        ctx.textAlign = 'right';

        // Dart indicators
        for (let i = 0; i < 3; i++) {
            const dx = w - 20 - i * 20;
            const dy = h - 35;
            if (i < this.dartsInRound) {
                ctx.fillStyle = '#ff2d7b';
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
            }
            ctx.beginPath();
            ctx.moveTo(dx, dy - 8);
            ctx.lineTo(dx - 4, dy + 4);
            ctx.lineTo(dx + 4, dy + 4);
            ctx.fill();
        }

        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.font = '12px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TAP / SPACE to throw', w / 2, h - 10);

        // Hit texts
        for (const ht of this.hitTexts) {
            ctx.globalAlpha = ht.life;
            ctx.fillStyle = ht.color;
            ctx.font = 'bold 18px Outfit, sans-serif';
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

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') {
            this.togglePause();
            return;
        }
        if (e.key === ' ') {
            e.preventDefault();
            this.throwDart();
        }
    },

    handleClick() {
        this.throwDart();
    },

    handleTouch(e) {
        e.preventDefault();
        this.throwDart();
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

export default Darts;
