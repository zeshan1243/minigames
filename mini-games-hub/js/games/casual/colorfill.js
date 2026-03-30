const ColorFill = {
    canvas: null,
    ctx: null,
    ui: null,
    score: 0,
    gameOver: false,
    paused: false,
    animFrame: null,
    grid: [],
    gridSize: 10,
    cellSize: 0,
    movesLeft: 25,
    maxMoves: 25,
    colors: [],
    colorValues: ['#00d4ff', '#ff2d7b', '#ffd60a', '#00e676', '#9b59b6', '#ff6b35'],
    selectedColor: -1,
    offsetX: 0,
    offsetY: 0,
    fillAnim: [],
    winAnim: 0,

    // Wave animation state
    waveQueue: [],        // array of wave rings: each ring is [{r,c}, ...]
    waveWaveIdx: 0,       // current wave ring being processed
    waveFrameCounter: 0,  // frame counter for wave timing
    waveAnimating: false,  // true while wave animation is running
    cellFlash: [],        // per-cell flash intensity (1 = white, fades to 0)
    pendingNewColor: -1,  // the new color being applied
    pendingOldColor: -1,  // the old color being replaced
    wavePendingGrid: [],  // snapshot grid: cells not yet wave-changed still show old color

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
        // Configure difficulty
        const level = this.ui.level || 'medium';
        if (level === 'easy') { this.gridSize = 8; this.colorValues = ['#00d4ff', '#ff2d7b', '#ffd60a', '#00e676']; this.maxMoves = 25; }
        else if (level === 'hard' || level === 'expert') { this.gridSize = 14; this.colorValues = ['#00d4ff', '#ff2d7b', '#ffd60a', '#00e676', '#9b59b6', '#ff6b35', '#e74c3c']; this.maxMoves = 22; }
        else { this.gridSize = 10; this.colorValues = ['#00d4ff', '#ff2d7b', '#ffd60a', '#00e676', '#9b59b6', '#ff6b35']; this.maxMoves = 25; }

        this.reset();
        this.gameOver = false;
        this.paused = false;
        this.ui.hideGameOver();
        this.ui.hidePause();
        this.loop();
    },

    reset() {
        cancelAnimationFrame(this.animFrame);
        this.movesLeft = this.maxMoves;
        this.score = 0;
        this.fillAnim = [];
        this.winAnim = 0;
        this.waveQueue = [];
        this.waveWaveIdx = 0;
        this.waveFrameCounter = 0;
        this.waveAnimating = false;
        this.cellFlash = [];
        this.pendingNewColor = -1;
        this.pendingOldColor = -1;
        this.wavePendingGrid = [];
        this.ui.setScore(this.maxMoves);

        const w = this.ui.canvasW;
        const h = this.ui.canvasH;
        this.cellSize = Math.floor(Math.min((w - 30) / this.gridSize, (h - 120) / this.gridSize));
        this.offsetX = Math.floor((w - this.gridSize * this.cellSize) / 2);
        this.offsetY = Math.floor((h - 80 - this.gridSize * this.cellSize) / 2) + 30;

        // Generate random grid
        this.colors = this.colorValues.length;
        this.grid = [];
        this.cellFlash = [];
        for (let r = 0; r < this.gridSize; r++) {
            this.grid[r] = [];
            this.cellFlash[r] = [];
            for (let c = 0; c < this.gridSize; c++) {
                this.grid[r][c] = Math.floor(Math.random() * this.colors);
                this.cellFlash[r][c] = 0;
            }
        }
    },

    loop() {
        if (!this.paused) {
            this.update();
        }
        this.render();
        if (!this.gameOver) {
            this.animFrame = requestAnimationFrame(() => this.loop());
        }
    },

    update() {
        // Fill animations (legacy particles)
        for (let i = this.fillAnim.length - 1; i >= 0; i--) {
            this.fillAnim[i].life -= 0.05;
            if (this.fillAnim[i].life <= 0) this.fillAnim.splice(i, 1);
        }
        if (this.winAnim > 0) this.winAnim -= 0.01;

        // Wave animation update
        if (this.waveAnimating) {
            this.waveFrameCounter++;

            // Every 2 frames, reveal the next wave ring
            if (this.waveFrameCounter % 2 === 0 && this.waveWaveIdx < this.waveQueue.length) {
                const ring = this.waveQueue[this.waveWaveIdx];
                for (const cell of ring) {
                    // Apply the color change to the display grid
                    this.wavePendingGrid[cell.r][cell.c] = this.pendingNewColor;
                    // Start a white flash
                    this.cellFlash[cell.r][cell.c] = 1.0;
                }
                this.waveWaveIdx++;
            }

            // Fade flash values
            let allDone = true;
            for (let r = 0; r < this.gridSize; r++) {
                for (let c = 0; c < this.gridSize; c++) {
                    if (this.cellFlash[r][c] > 0) {
                        this.cellFlash[r][c] = Math.max(0, this.cellFlash[r][c] - 0.08);
                        if (this.cellFlash[r][c] > 0) allDone = false;
                    }
                }
            }

            if (this.waveWaveIdx < this.waveQueue.length) allDone = false;

            if (allDone) {
                this.waveAnimating = false;
                this.waveQueue = [];
                this.wavePendingGrid = [];
            }
        }
    },

    floodFill(newColorIdx) {
        if (this.gameOver || this.paused || this.waveAnimating) return;
        const oldColor = this.grid[0][0];
        if (oldColor === newColorIdx) return;

        this.movesLeft--;
        this.score = this.movesLeft;
        this.ui.setScore(`${this.movesLeft} moves`);

        // BFS flood fill from top-left, grouping cells by wave distance
        const visited = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(false));
        const queue = [{ r: 0, c: 0, dist: 0 }];
        visited[0][0] = true;
        const waves = [];

        while (queue.length > 0) {
            const { r, c, dist } = queue.shift();
            if (this.grid[r][c] !== oldColor) continue;

            if (!waves[dist]) waves[dist] = [];
            waves[dist].push({ r, c });

            const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dr, dc] of dirs) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize && !visited[nr][nc]) {
                    visited[nr][nc] = true;
                    if (this.grid[nr][nc] === oldColor) {
                        queue.push({ r: nr, c: nc, dist: dist + 1 });
                    }
                }
            }
        }

        // Apply the fill to the actual grid immediately (for game logic / win check)
        for (const wave of waves) {
            for (const cell of wave) {
                this.grid[cell.r][cell.c] = newColorIdx;
            }
        }

        // Set up wave animation using a display-grid snapshot
        this.wavePendingGrid = [];
        for (let r = 0; r < this.gridSize; r++) {
            this.wavePendingGrid[r] = [];
            for (let c = 0; c < this.gridSize; c++) {
                this.wavePendingGrid[r][c] = this.grid[r][c];
            }
        }
        // Revert wave cells in the display grid to old color so they animate
        for (const wave of waves) {
            for (const cell of wave) {
                this.wavePendingGrid[cell.r][cell.c] = oldColor;
            }
        }

        this.waveQueue = waves;
        this.waveWaveIdx = 0;
        this.waveFrameCounter = 0;
        this.waveAnimating = true;
        this.pendingNewColor = newColorIdx;
        this.pendingOldColor = oldColor;

        // Also add legacy fillAnim particles
        for (const wave of waves) {
            for (const cell of wave) {
                this.fillAnim.push({ r: cell.r, c: cell.c, life: 1 });
            }
        }

        // Check win
        if (this.checkWin()) {
            this.winAnim = 1;
            this.score = this.movesLeft;
            setTimeout(() => this.endGame(), 800);
            return;
        }

        // Check loss (no moves left)
        if (this.movesLeft <= 0) {
            this.score = 0;
            setTimeout(() => this.endGame(), 500);
        }
    },

    checkWin() {
        const target = this.grid[0][0];
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (this.grid[r][c] !== target) return false;
            }
        }
        return true;
    },

    getColorButtonBounds() {
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;
        const btnSize = 36;
        const gap = 10;
        const totalW = this.colors * btnSize + (this.colors - 1) * gap;
        const startX = (w - totalW) / 2;
        const y = this.offsetY + this.gridSize * this.cellSize + 25;
        const bounds = [];
        for (let i = 0; i < this.colors; i++) {
            bounds.push({
                x: startX + i * (btnSize + gap),
                y,
                w: btnSize,
                h: btnSize,
                colorIdx: i
            });
        }
        return bounds;
    },

    render() {
        const ctx = this.ctx;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;
        const cs = this.cellSize;
        const ox = this.offsetX;
        const oy = this.offsetY;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Win flash
        if (this.winAnim > 0) {
            ctx.fillStyle = `rgba(0,230,118,${this.winAnim * 0.15})`;
            ctx.fillRect(0, 0, w, h);
        }

        // Grid
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                // Use wave display grid if animating, otherwise actual grid
                const colorIdx = this.waveAnimating ? this.wavePendingGrid[r][c] : this.grid[r][c];
                const x = ox + c * cs;
                const y = oy + r * cs;

                ctx.fillStyle = this.colorValues[colorIdx];
                ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);

                // White flash overlay for wave animation
                const flash = this.cellFlash[r] ? this.cellFlash[r][c] : 0;
                if (flash > 0) {
                    ctx.fillStyle = `rgba(255,255,255,${flash * 0.7})`;
                    ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
                }

                // Highlight for recently filled cells (legacy fill anim)
                const anim = this.fillAnim.find(a => a.r === r && a.c === c);
                if (anim && !this.waveAnimating) {
                    ctx.fillStyle = `rgba(255,255,255,${anim.life * 0.4})`;
                    ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
                }

                // Subtle inner shadow
                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                ctx.fillRect(x + 1, y + cs - 3, cs - 2, 2);
                ctx.fillRect(x + cs - 3, y + 1, 2, cs - 2);
            }
        }

        // Grid border
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(ox, oy, this.gridSize * cs, this.gridSize * cs);

        // Origin indicator
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(ox, oy, cs, cs);

        // Color palette buttons
        const buttons = this.getColorButtonBounds();
        const currentColor = this.grid[0][0];

        for (const btn of buttons) {
            // Button glow for current color
            if (btn.colorIdx === currentColor) {
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.roundRect(btn.x - 3, btn.y - 3, btn.w + 6, btn.h + 6, 8);
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 6);
            ctx.fillStyle = this.colorValues[btn.colorIdx];
            ctx.fill();

            // Disabled overlay for current color
            if (btn.colorIdx === currentColor) {
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                ctx.fill();
            }

            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.beginPath();
            ctx.roundRect(btn.x + 2, btn.y + 2, btn.w - 4, btn.h / 2 - 2, 4);
            ctx.fill();
        }

        // Moves counter
        ctx.fillStyle = this.movesLeft <= 5 ? '#ff2d7b' : '#ffd60a';
        ctx.font = 'bold 16px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Moves: ${this.movesLeft} / ${this.maxMoves}`, w / 2, 22);

        // Percentage filled
        const totalCells = this.gridSize * this.gridSize;
        const currentColorCount = this.grid.flat().filter(c => c === this.grid[0][0]).length;
        const pct = Math.round((currentColorCount / totalCells) * 100);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '12px Outfit, sans-serif';
        ctx.fillText(`${pct}% filled`, w / 2, h - 10);
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
        // Number keys 1-6 to pick color
        const num = parseInt(e.key);
        if (num >= 1 && num <= this.colors) {
            e.preventDefault();
            this.floodFill(num - 1);
        }
    },

    handleClick(e) {
        if (this.gameOver || this.paused || this.waveAnimating) return;
        const rect = this.canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (this.ui.canvasW / rect.width);
        const my = (e.clientY - rect.top) * (this.ui.canvasH / rect.height);
        this.checkButtonClick(mx, my);
    },

    handleTouch(e) {
        e.preventDefault();
        if (this.gameOver || this.paused || this.waveAnimating) return;
        const rect = this.canvas.getBoundingClientRect();
        const tx = (e.touches[0].clientX - rect.left) * (this.ui.canvasW / rect.width);
        const ty = (e.touches[0].clientY - rect.top) * (this.ui.canvasH / rect.height);
        this.checkButtonClick(tx, ty);
    },

    checkButtonClick(mx, my) {
        const buttons = this.getColorButtonBounds();
        for (const btn of buttons) {
            if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
                this.floodFill(btn.colorIdx);
                return;
            }
        }
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

export default ColorFill;
