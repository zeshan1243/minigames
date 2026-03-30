const AimTrainer = {
    canvas: null, ctx: null, ui: null,
    targets: [], score: 0, misses: 0, maxMisses: 5,
    gameOver: false, animFrame: null, spawnTimer: null,
    hitEffect: [],

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.handleClick = this.handleClick.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
    },

    start() {
        this.score = 0; this.misses = 0; this.gameOver = false;
        this.targets = []; this.hitEffect = [];
        this.ui.setScore(0); this.ui.hideGameOver();
        this.spawnTarget();
        this.spawnTimer = setInterval(() => {
            if (!this.gameOver) this.spawnTarget();
        }, 1200);
        this.loop();
    },

    spawnTarget() {
        const r = 15 + Math.random() * 20;
        this.targets.push({
            x: r + Math.random() * (this.ui.canvasW - r * 2),
            y: 60 + r + Math.random() * (this.ui.canvasH - 120 - r * 2),
            r, life: 120, shrink: 1
        });
    },

    loop() {
        if (this.gameOver) return;
        this.update();
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update() {
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const t = this.targets[i];
            t.life--;
            t.shrink = t.life / 120;
            if (t.life <= 0) {
                this.targets.splice(i, 1);
                this.misses++;
                if (this.misses >= this.maxMisses) this.endGame();
            }
        }
        for (let i = this.hitEffect.length - 1; i >= 0; i--) {
            this.hitEffect[i].life--;
            if (this.hitEffect[i].life <= 0) this.hitEffect.splice(i, 1);
        }
    },

    processHit(x, y) {
        if (this.gameOver) return;
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const t = this.targets[i];
            const dist = Math.hypot(x - t.x, y - t.y);
            if (dist < t.r * t.shrink) {
                this.hitEffect.push({ x: t.x, y: t.y, life: 15 });
                this.targets.splice(i, 1);
                this.score++;
                this.ui.setScore(this.score);
                return;
            }
        }
    },

    handleClick(e) {
        const r = this.canvas.getBoundingClientRect();
        this.processHit(e.clientX - r.left, e.clientY - r.top);
    },
    handleTouch(e) {
        e.preventDefault();
        const r = this.canvas.getBoundingClientRect();
        this.processHit(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top);
    },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        // Misses
        ctx.fillStyle = '#e8e8f0'; ctx.font = '14px Outfit, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`Misses: ${this.misses}/${this.maxMisses}`, 20, 30);
        ctx.textAlign = 'right';
        ctx.font = 'bold 14px Outfit, sans-serif';
        ctx.fillText(`Crosshair`, w - 20, 30);

        // Targets
        for (const t of this.targets) {
            const r = t.r * t.shrink;
            ctx.save();
            ctx.shadowColor = '#ff2d7b'; ctx.shadowBlur = 10;
            ctx.strokeStyle = '#ff2d7b'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(t.x, t.y, r * 0.6, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = '#ff2d7b';
            ctx.beginPath(); ctx.arc(t.x, t.y, r * 0.25, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        // Hit effects
        for (const h2 of this.hitEffect) {
            const a = h2.life / 15;
            ctx.strokeStyle = `rgba(0,230,118,${a})`; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(h2.x, h2.y, (1 - a) * 30, 0, Math.PI * 2); ctx.stroke();
        }
    },

    endGame() {
        this.gameOver = true; clearInterval(this.spawnTimer); cancelAnimationFrame(this.animFrame);
        this.ui.setHighScore(this.score);
        this.ui.showGameOver(this.score, this.ui.getHighScore());
    },

    pause() {}, resume() {},
    reset() { clearInterval(this.spawnTimer); cancelAnimationFrame(this.animFrame); },
    destroy() { clearInterval(this.spawnTimer); cancelAnimationFrame(this.animFrame); }
};
export default AimTrainer;
