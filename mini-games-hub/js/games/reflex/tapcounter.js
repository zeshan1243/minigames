const TapCounter = {
    canvas: null, ctx: null, ui: null,
    count: 0, timeLeft: 10, gameOver: false, started: false,
    timer: null, animFrame: null, ripples: [],

    // 2P state
    p1Count: 0, p2Count: 0,
    p1Ripples: [], p2Ripples: [],

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.handleClick = this.handleClick.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        this.handleKey = this.handleKey.bind(this);
        this._handleClick2P = this._handleClick2P.bind(this);
        this._handleTouch2P = this._handleTouch2P.bind(this);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
        document.addEventListener('keydown', this.handleKey);
    },

    start() {
        if (this.ui.mode === '2p') { this.start2P(); return; }
        this.count = 0; this.timeLeft = 10; this.gameOver = false; this.started = false;
        this.ripples = []; this.ui.setScore(0); this.ui.hideGameOver();
        this.loop();
    },

    tap(x, y) {
        if (this.gameOver) return;
        if (!this.started) {
            this.started = true;
            this.timer = setInterval(() => {
                this.timeLeft--;
                if (this.timeLeft <= 0) this.endGame();
            }, 1000);
        }
        this.count++;
        this.ui.setScore(this.count);
        if (x && y) this.ripples.push({ x, y, r: 10, life: 20 });
    },

    handleClick(e) {
        if (this.ui.mode === '2p') return;
        const r = this.canvas.getBoundingClientRect(); this.tap(e.clientX - r.left, e.clientY - r.top);
    },
    handleTouch(e) {
        if (this.ui.mode === '2p') return;
        e.preventDefault(); const r = this.canvas.getBoundingClientRect(); this.tap(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top);
    },
    handleKey(e) {
        if (this.ui.mode === '2p') return;
        if (e.key === ' ') { e.preventDefault(); this.tap(this.ui.canvasW/2, this.ui.canvasH/2); }
    },

    loop() {
        if (this.gameOver) return;
        if (this.ui.mode === '2p') {
            this._updateRipples(this.p1Ripples);
            this._updateRipples(this.p2Ripples);
            this.render2P();
        } else {
            for (let i = this.ripples.length - 1; i >= 0; i--) {
                this.ripples[i].r += 3; this.ripples[i].life--;
                if (this.ripples[i].life <= 0) this.ripples.splice(i, 1);
            }
            this.render();
        }
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    _updateRipples(arr) {
        for (let i = arr.length - 1; i >= 0; i--) {
            arr[i].r += 3; arr[i].life--;
            if (arr[i].life <= 0) arr.splice(i, 1);
        }
    },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        // Ripples
        for (const rp of this.ripples) {
            ctx.strokeStyle = `rgba(0,212,255,${rp.life/20})`; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI*2); ctx.stroke();
        }

        // Timer
        ctx.fillStyle = this.timeLeft <= 3 ? '#ff2d7b' : '#e8e8f0';
        ctx.font = 'bold 36px JetBrains Mono, monospace'; ctx.textAlign = 'center';
        ctx.fillText(this.started ? `${this.timeLeft}s` : 'TAP TO START', w/2, 80);

        // Count
        ctx.fillStyle = '#00d4ff'; ctx.font = 'bold 120px JetBrains Mono, monospace';
        ctx.fillText(String(this.count), w/2, h/2 + 30);

        // Hint
        ctx.fillStyle = '#8888a0'; ctx.font = '16px Outfit, sans-serif';
        ctx.fillText(this.started ? 'Keep tapping!' : 'Tap or press SPACE', w/2, h/2 + 80);

        // TPS
        if (this.started && this.timeLeft < 10) {
            const elapsed = 10 - this.timeLeft;
            const tps = (this.count / elapsed).toFixed(1);
            ctx.fillStyle = '#ffd60a'; ctx.font = '18px JetBrains Mono, monospace';
            ctx.fillText(`${tps} taps/sec`, w/2, h - 80);
        }
    },

    endGame() {
        this.gameOver = true; clearInterval(this.timer); cancelAnimationFrame(this.animFrame);
        if (this.ui.mode === '2p') {
            this.render2PEnd();
            return;
        }
        this.ui.setHighScore(this.count); this.ui.showGameOver(this.count, this.ui.getHighScore());
    },

    // ========== 2P MODE ==========

    start2P() {
        this.p1Count = 0; this.p2Count = 0;
        this.timeLeft = 10; this.gameOver = false; this.started = false;
        this.p1Ripples = []; this.p2Ripples = [];
        this.ui.setScore('P1: 0 | P2: 0');
        this.ui.hideGameOver();
        this.canvas.addEventListener('click', this._handleClick2P);
        this.canvas.addEventListener('touchstart', this._handleTouch2P, { passive: false });
        this.loop();
    },

    _handleClick2P(e) {
        if (this.gameOver) return;
        const r = this.canvas.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        this._tap2P(x, y);
    },

    _handleTouch2P(e) {
        e.preventDefault();
        if (this.gameOver) return;
        const r = this.canvas.getBoundingClientRect();
        for (let i = 0; i < e.touches.length; i++) {
            const x = e.touches[i].clientX - r.left;
            const y = e.touches[i].clientY - r.top;
            this._tap2P(x, y);
        }
    },

    _tap2P(x, y) {
        if (this.gameOver) return;
        if (!this.started) {
            this.started = true;
            this.timer = setInterval(() => {
                this.timeLeft--;
                if (this.timeLeft <= 0) this.endGame();
            }, 1000);
        }
        const half = this.ui.canvasW / 2;
        if (x < half) {
            this.p1Count++;
            this.p1Ripples.push({ x, y, r: 10, life: 20 });
        } else {
            this.p2Count++;
            this.p2Ripples.push({ x, y, r: 10, life: 20 });
        }
        this.ui.setScore(`P1: ${this.p1Count} | P2: ${this.p2Count}`);
    },

    render2P() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        const half = w / 2;

        // Background for each half
        ctx.fillStyle = '#0a0a12'; ctx.fillRect(0, 0, half, h);
        ctx.fillStyle = '#0f0a12'; ctx.fillRect(half, 0, half, h);

        // Ripples P1 (cyan)
        for (const rp of this.p1Ripples) {
            ctx.strokeStyle = `rgba(0,212,255,${rp.life/20})`; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI*2); ctx.stroke();
        }
        // Ripples P2 (magenta)
        for (const rp of this.p2Ripples) {
            ctx.strokeStyle = `rgba(255,0,200,${rp.life/20})`; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI*2); ctx.stroke();
        }

        // Timer (center top)
        ctx.fillStyle = this.timeLeft <= 3 ? '#ff2d7b' : '#e8e8f0';
        ctx.font = 'bold 30px JetBrains Mono, monospace'; ctx.textAlign = 'center';
        ctx.fillText(this.started ? `${this.timeLeft}s` : 'TAP TO START', w/2, 50);

        // P1 label & count
        ctx.fillStyle = '#00d4ff'; ctx.font = 'bold 16px Outfit, sans-serif';
        ctx.fillText('Player 1', half/2, 90);
        ctx.font = 'bold 80px JetBrains Mono, monospace';
        ctx.fillText(String(this.p1Count), half/2, h/2 + 20);

        // P2 label & count
        ctx.fillStyle = '#ff00c8'; ctx.font = 'bold 16px Outfit, sans-serif';
        ctx.fillText('Player 2', half + half/2, 90);
        ctx.font = 'bold 80px JetBrains Mono, monospace';
        ctx.fillText(String(this.p2Count), half + half/2, h/2 + 20);

        // Divider
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(half, 0); ctx.lineTo(half, h); ctx.stroke();

        // Hints
        ctx.fillStyle = '#8888a0'; ctx.font = '14px Outfit, sans-serif';
        if (!this.started) {
            ctx.fillText('Tap your side!', w/2, h - 50);
        }

        // TPS per player
        if (this.started && this.timeLeft < 10) {
            const elapsed = 10 - this.timeLeft;
            ctx.font = '14px JetBrains Mono, monospace';
            ctx.fillStyle = '#00d4ff';
            ctx.fillText(`${(this.p1Count/elapsed).toFixed(1)} t/s`, half/2, h - 50);
            ctx.fillStyle = '#ff00c8';
            ctx.fillText(`${(this.p2Count/elapsed).toFixed(1)} t/s`, half + half/2, h - 50);
        }
    },

    render2PEnd() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        let winner;
        if (this.p1Count > this.p2Count) winner = 'Player 1 Wins!';
        else if (this.p2Count > this.p1Count) winner = 'Player 2 Wins!';
        else winner = "It's a Tie!";

        ctx.fillStyle = '#e8e8f0'; ctx.font = 'bold 36px Outfit, sans-serif';
        ctx.fillText(winner, w/2, h/2 - 50);

        ctx.fillStyle = '#00d4ff'; ctx.font = 'bold 24px JetBrains Mono, monospace';
        ctx.fillText(`P1: ${this.p1Count}`, w/2 - 80, h/2 + 10);
        ctx.fillStyle = '#ff00c8';
        ctx.fillText(`P2: ${this.p2Count}`, w/2 + 80, h/2 + 10);

        ctx.fillStyle = '#ffd60a'; ctx.font = '16px Outfit, sans-serif';
        ctx.fillText(`${this.p1Count} vs ${this.p2Count} taps`, w/2, h/2 + 50);

        ctx.textBaseline = 'alphabetic';
    },

    pause() {}, resume() {},
    reset() { clearInterval(this.timer); cancelAnimationFrame(this.animFrame); },
    destroy() {
        clearInterval(this.timer); cancelAnimationFrame(this.animFrame);
        document.removeEventListener('keydown', this.handleKey);
        this.canvas.removeEventListener('click', this._handleClick2P);
        this.canvas.removeEventListener('touchstart', this._handleTouch2P);
    }
};
export default TapCounter;
