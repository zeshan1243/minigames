const PatternMemory = {
    canvas: null, ctx: null, ui: null,
    grid: [], gridSize: 4, cellSize: 80, gap: 8,
    pattern: [], playerPicks: [], phase: 'show', // show, pick
    score: 0, level: 1, showTimer: 0, gameOver: false, animFrame: null,
    feedback: null,

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.handleClick = this.handleClick.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
    },

    start() {
        this.score = 0; this.level = 1; this.gameOver = false; this.feedback = null;
        this.ui.setScore(0); this.ui.hideGameOver();
        this.buildGrid();
        this.nextRound();
        this.loop();
    },

    buildGrid() {
        const total = this.gridSize * this.gridSize;
        const startX = (this.ui.canvasW - (this.gridSize * this.cellSize + (this.gridSize - 1) * this.gap)) / 2;
        const startY = 120;
        this.grid = [];
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                this.grid.push({
                    x: startX + c * (this.cellSize + this.gap),
                    y: startY + r * (this.cellSize + this.gap),
                    idx: r * this.gridSize + c
                });
            }
        }
    },

    nextRound() {
        const count = this.level + 2; // 3 cells at level 1
        const indices = [];
        while (indices.length < count) {
            const idx = Math.floor(Math.random() * this.grid.length);
            if (!indices.includes(idx)) indices.push(idx);
        }
        this.pattern = indices;
        this.playerPicks = [];
        this.phase = 'show';
        this.showTimer = 60 + this.level * 10;
    },

    loop() {
        if (this.gameOver) return;
        this.update();
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update() {
        if (this.phase === 'show') {
            this.showTimer--;
            if (this.showTimer <= 0) this.phase = 'pick';
        }
        if (this.feedback) {
            this.feedback.timer--;
            if (this.feedback.timer <= 0) this.feedback = null;
        }
    },

    processClick(x, y) {
        if (this.phase !== 'pick' || this.gameOver) return;
        for (let i = 0; i < this.grid.length; i++) {
            const cell = this.grid[i];
            if (x >= cell.x && x <= cell.x + this.cellSize && y >= cell.y && y <= cell.y + this.cellSize) {
                if (this.playerPicks.includes(i)) return;
                this.playerPicks.push(i);
                if (this.pattern.includes(i)) {
                    if (this.playerPicks.filter(p => this.pattern.includes(p)).length === this.pattern.length) {
                        this.score += this.level;
                        this.level++;
                        this.ui.setScore(this.score);
                        this.feedback = { type: 'correct', timer: 30 };
                        setTimeout(() => this.nextRound(), 500);
                    }
                } else {
                    this.endGame();
                }
                return;
            }
        }
    },

    handleClick(e) { const r = this.canvas.getBoundingClientRect(); this.processClick(e.clientX - r.left, e.clientY - r.top); },
    handleTouch(e) { e.preventDefault(); const r = this.canvas.getBoundingClientRect(); this.processClick(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top); },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#e8e8f0'; ctx.font = 'bold 18px Outfit, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(this.phase === 'show' ? 'Memorize the pattern!' : 'Tap the highlighted cells!', w/2, 40);
        ctx.fillStyle = '#8888a0'; ctx.font = '14px Outfit, sans-serif';
        ctx.fillText(`Level ${this.level} \u2022 ${this.pattern.length} cells`, w/2, 65);

        for (let i = 0; i < this.grid.length; i++) {
            const cell = this.grid[i];
            const inPattern = this.pattern.includes(i);
            const picked = this.playerPicks.includes(i);

            if (this.phase === 'show' && inPattern) {
                ctx.fillStyle = '#00d4ff';
            } else if (this.phase === 'pick' && picked) {
                ctx.fillStyle = inPattern ? '#00e676' : '#ff2d7b';
            } else {
                ctx.fillStyle = '#1a1a2e';
            }
            ctx.beginPath(); ctx.roundRect(cell.x, cell.y, this.cellSize, this.cellSize, 10); ctx.fill();
            ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.roundRect(cell.x, cell.y, this.cellSize, this.cellSize, 10); ctx.stroke();
        }

        if (this.feedback && this.feedback.type === 'correct') {
            ctx.fillStyle = '#00e676'; ctx.font = 'bold 28px Outfit, sans-serif';
            ctx.fillText('Correct!', w/2, h - 60);
        }
    },

    endGame() {
        this.gameOver = true; cancelAnimationFrame(this.animFrame);
        this.ui.setHighScore(this.score); this.ui.showGameOver(this.score, this.ui.getHighScore());
    },

    pause() {}, resume() {},
    reset() { cancelAnimationFrame(this.animFrame); },
    destroy() { cancelAnimationFrame(this.animFrame); }
};
export default PatternMemory;
