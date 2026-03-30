const WhackAMole = {
    canvas: null, ctx: null, ui: null,
    holes: [], moles: [], score: 0, timeLeft: 30,
    gameOver: false, paused: false, animFrame: null,
    timer: null, spawnTimer: null,

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.handleClick = this.handleClick.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });

        const cols = 3, rows = 3, hw = 90, hh = 70, gap = 15;
        const startX = (ui.canvasW - (cols * hw + (cols-1) * gap)) / 2;
        const startY = 150;
        this.holes = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.holes.push({ x: startX + c * (hw + gap), y: startY + r * (hh + gap + 20), w: hw, h: hh });
            }
        }
    },

    start() {
        this.score = 0; this.timeLeft = 30; this.gameOver = false; this.paused = false;
        this.moles = []; this.ui.setScore(0); this.ui.hideGameOver(); this.ui.hidePause();
        this.timer = setInterval(() => {
            if (this.paused) return;
            this.timeLeft--;
            if (this.timeLeft <= 0) this.endGame();
        }, 1000);
        this.spawnTimer = setInterval(() => {
            if (this.paused || this.gameOver) return;
            this.spawnMole();
        }, 800);
        this.loop();
    },

    spawnMole() {
        const idx = Math.floor(Math.random() * this.holes.length);
        if (!this.moles.find(m => m.hole === idx)) {
            this.moles.push({ hole: idx, timer: 60 + Math.random() * 40, hit: false, popY: 1 });
        }
    },

    loop() {
        if (this.gameOver) return;
        if (!this.paused) this.update();
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update() {
        for (let i = this.moles.length - 1; i >= 0; i--) {
            const m = this.moles[i];
            if (m.popY < 1) m.popY = Math.min(1, m.popY + 0.1);
            m.timer--;
            if (m.hit) { m.popY -= 0.15; if (m.popY <= 0) this.moles.splice(i, 1); }
            else if (m.timer <= 0) { m.popY -= 0.08; if (m.popY <= 0) this.moles.splice(i, 1); }
        }
    },

    processHit(x, y) {
        if (this.gameOver || this.paused) return;
        for (const m of this.moles) {
            if (m.hit) continue;
            const h = this.holes[m.hole];
            const mx = h.x + h.w/2, my = h.y + 10;
            if (Math.abs(x - mx) < h.w/2 && Math.abs(y - my) < h.h/2) {
                m.hit = true;
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

        // Timer
        ctx.fillStyle = '#e8e8f0'; ctx.font = 'bold 24px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Time: ${this.timeLeft}s`, w/2, 50);
        ctx.fillStyle = '#8888a0'; ctx.font = '14px Outfit, sans-serif';
        ctx.fillText('Tap the moles!', w/2, 80);

        // Holes and moles
        for (let i = 0; i < this.holes.length; i++) {
            const hole = this.holes[i];
            // Hole
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath(); ctx.ellipse(hole.x + hole.w/2, hole.y + hole.h - 10, hole.w/2, 18, 0, 0, Math.PI * 2); ctx.fill();

            const mole = this.moles.find(m => m.hole === i);
            if (mole) {
                const pop = Math.max(0, mole.popY);
                ctx.save();
                ctx.beginPath();
                ctx.rect(hole.x, hole.y - 20, hole.w, hole.h + 10);
                ctx.clip();
                const moleY = hole.y + hole.h - 20 - pop * 40;
                ctx.fillStyle = mole.hit ? '#ff2d7b' : '#8B4513';
                ctx.beginPath(); ctx.arc(hole.x + hole.w/2, moleY, 22, 0, Math.PI * 2); ctx.fill();
                // Eyes
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(hole.x + hole.w/2 - 8, moleY - 5, 4, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(hole.x + hole.w/2 + 8, moleY - 5, 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(hole.x + hole.w/2 - 8, moleY - 5, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(hole.x + hole.w/2 + 8, moleY - 5, 2, 0, Math.PI * 2); ctx.fill();
                // Nose
                ctx.fillStyle = '#ff9999';
                ctx.beginPath(); ctx.arc(hole.x + hole.w/2, moleY + 3, 3, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
        }

        // Hole front covers
        for (const hole of this.holes) {
            ctx.fillStyle = '#2a2a3e';
            ctx.beginPath(); ctx.ellipse(hole.x + hole.w/2, hole.y + hole.h - 5, hole.w/2 + 4, 12, 0, 0, Math.PI); ctx.fill();
        }
    },

    endGame() {
        this.gameOver = true;
        clearInterval(this.timer); clearInterval(this.spawnTimer);
        cancelAnimationFrame(this.animFrame);
        this.ui.setHighScore(this.score);
        this.ui.showGameOver(this.score, this.ui.getHighScore());
    },

    pause() { this.paused = true; this.ui.showPause(); },
    resume() { this.paused = false; this.ui.hidePause(); },
    reset() { clearInterval(this.timer); clearInterval(this.spawnTimer); cancelAnimationFrame(this.animFrame); },
    destroy() { clearInterval(this.timer); clearInterval(this.spawnTimer); cancelAnimationFrame(this.animFrame); }
};
export default WhackAMole;
