const Matching = {
    canvas: null,
    ctx: null,
    ui: null,
    animFrame: null,
    gameOver: false,
    paused: false,
    lastTime: 0,
    score: 0,

    // Game state
    level: 1,
    gridSize: 2,
    pattern: [],
    playerPattern: [],
    phase: 'show', // 'show', 'play', 'feedback'
    showTimer: 0,
    showDuration: 2,
    feedbackTimer: 0,
    colors: ['#00d4ff', '#ff2d7b', '#ffd60a', '#00e676', '#b388ff'],
    colorNames: ['Cyan', 'Pink', 'Gold', 'Green', 'Purple'],
    selectedColor: 0,
    cellSize: 0,
    gridOffsetX: 0,
    gridOffsetY: 0,
    fadeIn: 0,
    correctCells: [],
    wrongCells: [],

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this.handleClick = this.handleClick.bind(this);
        this.handleKey = this.handleKey.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        document.addEventListener('keydown', this.handleKey);
    },

    start() {
        this.reset();
        this.gameOver = false;
        this.paused = false;
        this.ui.hideGameOver();
        this.ui.hidePause();
        this.lastTime = performance.now();
        this.startLevel();
        this.loop();
    },

    reset() {
        cancelAnimationFrame(this.animFrame);
        this.score = 0;
        this.level = 1;
        this.gridSize = 2;
        this.selectedColor = 0;
        this.correctCells = [];
        this.wrongCells = [];
        this.ui.setScore(0);
    },

    startLevel() {
        this.gridSize = Math.min(6, this.level + 1);
        this.phase = 'show';
        this.showDuration = Math.max(0.8, 2.5 - this.level * 0.2);
        this.showTimer = 0;
        this.fadeIn = 0;
        this.correctCells = [];
        this.wrongCells = [];
        this.calculateGrid();

        // Generate pattern
        const numColors = Math.min(this.colors.length, 2 + Math.floor(this.level / 2));
        this.pattern = [];
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            this.pattern.push(Math.floor(Math.random() * numColors));
        }

        // Clear player pattern
        this.playerPattern = new Array(this.gridSize * this.gridSize).fill(-1);
    },

    calculateGrid() {
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        const maxCellSize = Math.min(
            (W - 60) / this.gridSize,
            (H - 160) / this.gridSize
        );
        this.cellSize = Math.floor(Math.min(maxCellSize, 80));
        const gridW = this.cellSize * this.gridSize;
        const gridH = this.cellSize * this.gridSize;
        this.gridOffsetX = (W - gridW) / 2;
        this.gridOffsetY = (H - gridH) / 2 - 20;
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
        if (this.phase === 'show') {
            this.fadeIn = Math.min(1, this.fadeIn + dt * 3);
            this.showTimer += dt;
            if (this.showTimer >= this.showDuration + 0.5) {
                this.phase = 'play';
            }
        } else if (this.phase === 'feedback') {
            this.feedbackTimer += dt;
            if (this.feedbackTimer >= 1.2) {
                // Check if correct
                if (this.wrongCells.length === 0) {
                    this.score++;
                    this.level++;
                    this.ui.setScore(this.score);
                    this.startLevel();
                } else {
                    this.endGame();
                }
            }
        }
    },

    handleClick(e) {
        if (this.gameOver || this.paused) return;
        const rect = this.canvas.getBoundingClientRect();
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        const mx = (e.clientX - rect.left) * (W / rect.width);
        const my = (e.clientY - rect.top) * (H / rect.height);
        this.processClick(mx, my);
    },

    handleTouchStart(e) {
        e.preventDefault();
        if (this.gameOver || this.paused) return;
        const rect = this.canvas.getBoundingClientRect();
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        const mx = (e.touches[0].clientX - rect.left) * (W / rect.width);
        const my = (e.touches[0].clientY - rect.top) * (H / rect.height);
        this.processClick(mx, my);
    },

    processClick(mx, my) {
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;

        // Color palette click
        const paletteY = H - 55;
        const numColors = Math.min(this.colors.length, 2 + Math.floor(this.level / 2));
        const palW = numColors * 50;
        const palX = (W - palW) / 2;
        if (my >= paletteY - 20 && my <= paletteY + 25) {
            for (let i = 0; i < numColors; i++) {
                const cx = palX + i * 50 + 20;
                if (mx >= cx - 18 && mx <= cx + 18) {
                    this.selectedColor = i;
                    return;
                }
            }
        }

        // Grid cell click
        if (this.phase !== 'play') return;
        const gx = Math.floor((mx - this.gridOffsetX) / this.cellSize);
        const gy = Math.floor((my - this.gridOffsetY) / this.cellSize);
        if (gx >= 0 && gx < this.gridSize && gy >= 0 && gy < this.gridSize) {
            const idx = gy * this.gridSize + gx;
            this.playerPattern[idx] = this.selectedColor;

            // Check if all filled
            if (this.playerPattern.every(c => c >= 0)) {
                this.checkPattern();
            }
        }
    },

    checkPattern() {
        this.phase = 'feedback';
        this.feedbackTimer = 0;
        this.correctCells = [];
        this.wrongCells = [];
        for (let i = 0; i < this.pattern.length; i++) {
            if (this.playerPattern[i] === this.pattern[i]) {
                this.correctCells.push(i);
            } else {
                this.wrongCells.push(i);
            }
        }
    },

    render() {
        const ctx = this.ctx;
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Level info
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Level ${this.level}`, W / 2, 30);

        // Phase info
        ctx.fillStyle = '#888';
        ctx.font = '14px sans-serif';
        if (this.phase === 'show') {
            ctx.fillStyle = '#ffd60a';
            ctx.fillText('Memorize the pattern!', W / 2, 52);
        } else if (this.phase === 'play') {
            ctx.fillText('Recreate the pattern', W / 2, 52);
        } else if (this.phase === 'feedback') {
            ctx.fillStyle = this.wrongCells.length === 0 ? '#00e676' : '#ff2d7b';
            ctx.fillText(this.wrongCells.length === 0 ? 'Correct!' : 'Wrong!', W / 2, 52);
        }

        const cs = this.cellSize;
        const ox = this.gridOffsetX;
        const oy = this.gridOffsetY;
        const gap = 4;

        // Grid
        for (let gy = 0; gy < this.gridSize; gy++) {
            for (let gx = 0; gx < this.gridSize; gx++) {
                const idx = gy * this.gridSize + gx;
                const x = ox + gx * cs + gap / 2;
                const y = oy + gy * cs + gap / 2;
                const w = cs - gap;
                const h = cs - gap;

                if (this.phase === 'show') {
                    // Show pattern
                    const colorIdx = this.pattern[idx];
                    ctx.globalAlpha = this.fadeIn;
                    ctx.fillStyle = this.colors[colorIdx];
                    ctx.shadowColor = this.colors[colorIdx];
                    ctx.shadowBlur = 8;
                    this.roundRect(ctx, x, y, w, h, 8);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.globalAlpha = 1;
                } else if (this.phase === 'play') {
                    // Show player pattern or empty
                    if (this.playerPattern[idx] >= 0) {
                        ctx.fillStyle = this.colors[this.playerPattern[idx]];
                        this.roundRect(ctx, x, y, w, h, 8);
                        ctx.fill();
                    } else {
                        ctx.fillStyle = '#1a1a2e';
                        this.roundRect(ctx, x, y, w, h, 8);
                        ctx.fill();
                        ctx.strokeStyle = '#333';
                        ctx.lineWidth = 1;
                        this.roundRect(ctx, x, y, w, h, 8);
                        ctx.stroke();
                    }
                } else if (this.phase === 'feedback') {
                    // Show result
                    const colorIdx = this.playerPattern[idx] >= 0 ? this.playerPattern[idx] : 0;
                    ctx.fillStyle = this.colors[colorIdx];
                    this.roundRect(ctx, x, y, w, h, 8);
                    ctx.fill();

                    if (this.correctCells.includes(idx)) {
                        ctx.strokeStyle = '#00e676';
                        ctx.lineWidth = 3;
                        this.roundRect(ctx, x, y, w, h, 8);
                        ctx.stroke();
                    } else if (this.wrongCells.includes(idx)) {
                        ctx.strokeStyle = '#ff2d7b';
                        ctx.lineWidth = 3;
                        this.roundRect(ctx, x, y, w, h, 8);
                        ctx.stroke();
                        // Show correct color indicator
                        ctx.fillStyle = this.colors[this.pattern[idx]];
                        ctx.beginPath();
                        ctx.arc(x + w - 10, y + 10, 6, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        }

        // Color palette
        const numColors = Math.min(this.colors.length, 2 + Math.floor(this.level / 2));
        const paletteY = H - 55;
        const palW = numColors * 50;
        const palX = (W - palW) / 2;

        ctx.fillStyle = '#1a1a2e';
        this.roundRect(ctx, palX - 10, paletteY - 25, palW + 20, 50, 10);
        ctx.fill();

        for (let i = 0; i < numColors; i++) {
            const cx = palX + i * 50 + 20;
            const cy = paletteY;
            const selected = i === this.selectedColor;

            if (selected) {
                ctx.shadowColor = this.colors[i];
                ctx.shadowBlur = 12;
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(cx, cy, 20, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.fillStyle = this.colors[i];
            ctx.beginPath();
            ctx.arc(cx, cy, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Timer bar during show phase
        if (this.phase === 'show') {
            const barW = 200;
            const barH = 6;
            const barX = (W - barW) / 2;
            const barY = 62;
            ctx.fillStyle = '#1a1a2e';
            this.roundRect(ctx, barX, barY, barW, barH, 3);
            ctx.fill();
            const progress = 1 - this.showTimer / this.showDuration;
            ctx.fillStyle = '#ffd60a';
            this.roundRect(ctx, barX, barY, barW * Math.max(0, progress), barH, 3);
            ctx.fill();
        }
    },

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    },

    endGame() {
        this.gameOver = true;
        cancelAnimationFrame(this.animFrame);
        this.render();
        this.ui.setHighScore(this.score);
        const best = this.ui.getHighScore();
        this.ui.showGameOver(this.score, best);
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') { this.togglePause(); return; }
        // Number keys to select color
        const num = parseInt(e.key);
        if (num >= 1 && num <= 5) {
            const numColors = Math.min(this.colors.length, 2 + Math.floor(this.level / 2));
            if (num <= numColors) {
                this.selectedColor = num - 1;
            }
        }
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
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        document.removeEventListener('keydown', this.handleKey);
    }
};

export default Matching;
