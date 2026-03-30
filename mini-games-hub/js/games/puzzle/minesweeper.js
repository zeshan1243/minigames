const Minesweeper = {
    canvas: null, ctx: null, ui: null,
    rows: 10, cols: 10, mines: 15, cellSize: 0,
    board: [], revealed: [], flagged: [], gameOver: false, won: false, firstClick: true,

    // Animation state
    revealAlpha: [],      // per-cell alpha for fade-in (0..1)
    revealQueue: [],      // array of wave rings: each ring is [{r,c}, ...]
    revealWaveIdx: 0,     // current wave ring index being processed
    revealFrameCounter: 0,// frame counter for wave timing
    animating: false,     // true while cascading reveal animation is running
    animFrame: null,

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.cellSize = Math.min((ui.canvasW - 20) / this.cols, (ui.canvasH - 100) / this.rows);
        this.handleClick = this.handleClick.bind(this);
        this.handleContext = this.handleContext.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('contextmenu', this.handleContext);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
        this.longPress = null;
    },

    start() {
        // Configure difficulty
        const level = this.ui.level || 'medium';
        if (level === 'easy') { this.rows = 8; this.cols = 8; this.mines = 10; }
        else if (level === 'hard' || level === 'expert') { this.rows = 14; this.cols = 14; this.mines = 35; }
        else { this.rows = 10; this.cols = 10; this.mines = 15; }
        this.cellSize = Math.min((this.ui.canvasW - 20) / this.cols, (this.ui.canvasH - 100) / this.rows);

        this.board = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
        this.revealed = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
        this.flagged = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
        this.revealAlpha = Array.from({ length: this.rows }, () => Array(this.cols).fill(1));
        this.gameOver = false; this.won = false; this.firstClick = true;
        this.animating = false;
        this.revealQueue = [];
        this.revealWaveIdx = 0;
        this.revealFrameCounter = 0;
        cancelAnimationFrame(this.animFrame);
        this.ui.setScore(0); this.ui.hideGameOver();
        this.render();
    },

    placeMines(safeR, safeC) {
        let placed = 0;
        while (placed < this.mines) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);
            if (this.board[r][c] === -1) continue;
            if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
            this.board[r][c] = -1; placed++;
        }
        // Calculate numbers
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c] === -1) continue;
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
                    const nr = r+dr, nc = c+dc;
                    if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.board[nr][nc] === -1) count++;
                }
                this.board[r][c] = count;
            }
        }
    },

    // Original reveal logic: marks cells as revealed via BFS/recursion
    reveal(r, c) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return;
        if (this.revealed[r][c] || this.flagged[r][c]) return;
        this.revealed[r][c] = true;
        if (this.board[r][c] === 0) {
            for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) this.reveal(r+dr, c+dc);
        }
    },

    // Cascading reveal: compute wave rings via BFS by distance from origin, then animate
    revealAnimated(r, c) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return;
        if (this.revealed[r][c] || this.flagged[r][c]) return;

        // BFS to find all cells that would be revealed, grouped by wave distance
        const waves = [];
        const visited = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
        const queue = [{r, c, dist: 0}];
        visited[r][c] = true;

        while (queue.length > 0) {
            const {r: cr, c: cc, dist} = queue.shift();
            if (this.revealed[cr][cc] || this.flagged[cr][cc]) continue;

            if (!waves[dist]) waves[dist] = [];
            waves[dist].push({r: cr, c: cc});

            // Only expand through empty (0) cells
            if (this.board[cr][cc] === 0) {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = cr + dr, nc = cc + dc;
                        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && !visited[nr][nc]) {
                            visited[nr][nc] = true;
                            queue.push({r: nr, c: nc, dist: dist + 1});
                        }
                    }
                }
            }
        }

        // If only one cell to reveal, just reveal it instantly
        if (waves.length <= 1 && waves[0] && waves[0].length <= 1) {
            this.revealed[r][c] = true;
            this.revealAlpha[r][c] = 1;
            return;
        }

        // Set up wave animation
        this.revealQueue = waves;
        this.revealWaveIdx = 0;
        this.revealFrameCounter = 0;
        this.animating = true;

        // Mark all cells as revealed immediately in data (for win-check), but set alpha to 0
        for (const wave of waves) {
            for (const cell of wave) {
                this.revealed[cell.r][cell.c] = true;
                this.revealAlpha[cell.r][cell.c] = 0;
            }
        }

        // Start animation loop
        this.startAnimLoop();
    },

    startAnimLoop() {
        cancelAnimationFrame(this.animFrame);
        const tick = () => {
            if (!this.animating) return;

            this.revealFrameCounter++;

            // Every 3 frames, reveal the next wave ring
            if (this.revealFrameCounter % 3 === 0 && this.revealWaveIdx < this.revealQueue.length) {
                this.revealWaveIdx++;
            }

            // Fade in alphas for all revealed-so-far wave rings
            let allDone = true;
            for (let w = 0; w < this.revealWaveIdx; w++) {
                const wave = this.revealQueue[w];
                for (const cell of wave) {
                    if (this.revealAlpha[cell.r][cell.c] < 1) {
                        this.revealAlpha[cell.r][cell.c] = Math.min(1, this.revealAlpha[cell.r][cell.c] + 0.12);
                        if (this.revealAlpha[cell.r][cell.c] < 1) allDone = false;
                    }
                }
            }

            // Check if we still have waves to reveal
            if (this.revealWaveIdx < this.revealQueue.length) allDone = false;

            this.render();

            if (allDone) {
                this.animating = false;
                // Ensure all alphas are exactly 1
                for (const wave of this.revealQueue) {
                    for (const cell of wave) {
                        this.revealAlpha[cell.r][cell.c] = 1;
                    }
                }
                this.revealQueue = [];
                this.render();
            } else {
                this.animFrame = requestAnimationFrame(tick);
            }
        };
        this.animFrame = requestAnimationFrame(tick);
    },

    getRC(x, y) {
        const ox = (this.ui.canvasW - this.cols * this.cellSize) / 2;
        const oy = 80;
        const c = Math.floor((x - ox) / this.cellSize);
        const r = Math.floor((y - oy) / this.cellSize);
        return (r >= 0 && r < this.rows && c >= 0 && c < this.cols) ? [r, c] : null;
    },

    handleClick(e) {
        if (this.gameOver || this.animating) return;
        const rect = this.canvas.getBoundingClientRect();
        const pos = this.getRC(e.clientX - rect.left, e.clientY - rect.top);
        if (!pos) return;
        const [r, c] = pos;
        if (this.flagged[r][c]) return;
        if (this.firstClick) { this.firstClick = false; this.placeMines(r, c); }
        if (this.board[r][c] === -1) { this.loseGame(); return; }
        this.revealAnimated(r, c);
        this.checkWin();
        if (!this.animating) this.render();
    },

    handleContext(e) {
        e.preventDefault();
        if (this.gameOver || this.animating) return;
        const rect = this.canvas.getBoundingClientRect();
        const pos = this.getRC(e.clientX - rect.left, e.clientY - rect.top);
        if (!pos) return;
        const [r, c] = pos;
        if (!this.revealed[r][c]) this.flagged[r][c] = !this.flagged[r][c];
        this.render();
    },

    handleTouch(e) {
        e.preventDefault();
        if (this.gameOver || this.animating) return;
        const rect = this.canvas.getBoundingClientRect();
        const pos = this.getRC(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
        if (!pos) return;
        const [r, c] = pos;

        // Long press for flag
        clearTimeout(this.longPress);
        const startTime = Date.now();
        const onEnd = () => {
            clearTimeout(this.longPress);
            this.canvas.removeEventListener('touchend', onEnd);
            if (Date.now() - startTime > 400) {
                if (!this.revealed[r][c]) this.flagged[r][c] = !this.flagged[r][c];
            } else {
                if (this.flagged[r][c]) return;
                if (this.firstClick) { this.firstClick = false; this.placeMines(r, c); }
                if (this.board[r][c] === -1) { this.loseGame(); return; }
                this.revealAnimated(r, c);
                this.checkWin();
            }
            if (!this.animating) this.render();
        };
        this.canvas.addEventListener('touchend', onEnd, { once: true });
    },

    checkWin() {
        let unrevealed = 0;
        for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
            if (!this.revealed[r][c] && this.board[r][c] !== -1) unrevealed++;
        }
        if (unrevealed === 0) { this.won = true; this.gameOver = true; this.ui.setHighScore(1); this.ui.showGameOver('You Win!', 'All mines cleared'); }
    },

    loseGame() {
        this.gameOver = true;
        for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
            this.revealed[r][c] = true;
            this.revealAlpha[r][c] = 1;
        }
        this.render();
        this.ui.showGameOver('Boom!', 'Hit a mine');
    },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        const cs = this.cellSize;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#e8e8f0'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Minesweeper', w/2, 30);
        ctx.fillStyle = '#8888a0'; ctx.font = '12px Outfit, sans-serif';
        ctx.fillText('Click: reveal \u2022 Right-click/Long-press: flag', w/2, 55);

        const ox = (w - this.cols * cs) / 2, oy = 80;
        const numColors = ['','#2d7bff','#00e676','#ff2d7b','#b44dff','#8B4513','#00d4ff','#333','#888'];

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const x = ox + c * cs, y = oy + r * cs;
                if (this.revealed[r][c]) {
                    const alpha = this.revealAlpha[r][c];
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(x+1, y+1, cs-2, cs-2);
                    const val = this.board[r][c];
                    if (val === -1) {
                        ctx.fillStyle = '#ff2d7b';
                        ctx.beginPath(); ctx.arc(x+cs/2, y+cs/2, cs/4, 0, Math.PI*2); ctx.fill();
                    } else if (val > 0) {
                        ctx.fillStyle = numColors[val]; ctx.font = `bold ${cs*0.5}px JetBrains Mono, monospace`;
                        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                        ctx.fillText(String(val), x+cs/2, y+cs/2);
                        ctx.textBaseline = 'alphabetic';
                    }
                    ctx.restore();

                    // If not fully revealed yet, draw the unrevealed tile underneath at inverse alpha
                    if (alpha < 1) {
                        ctx.save();
                        ctx.globalAlpha = 1 - alpha;
                        ctx.fillStyle = '#2a2a3e'; ctx.beginPath(); ctx.roundRect(x+1, y+1, cs-2, cs-2, 3); ctx.fill();
                        ctx.restore();
                    }
                } else {
                    ctx.fillStyle = '#2a2a3e'; ctx.beginPath(); ctx.roundRect(x+1, y+1, cs-2, cs-2, 3); ctx.fill();
                    if (this.flagged[r][c]) {
                        ctx.fillStyle = '#ffd60a'; ctx.font = `${cs*0.5}px sans-serif`;
                        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                        ctx.fillText('\u2691', x+cs/2, y+cs/2);
                        ctx.textBaseline = 'alphabetic';
                    }
                }
            }
        }
    },

    pause() {}, resume() {},
    reset() { cancelAnimationFrame(this.animFrame); this.animating = false; },
    destroy() { cancelAnimationFrame(this.animFrame); this.animating = false; }
};
export default Minesweeper;
