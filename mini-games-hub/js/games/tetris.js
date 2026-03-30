const SHAPES = [
    [[1,1,1,1]], // I
    [[1,1],[1,1]], // O
    [[0,1,0],[1,1,1]], // T
    [[1,0],[1,0],[1,1]], // L
    [[0,1],[0,1],[1,1]], // J
    [[0,1,1],[1,1,0]], // S
    [[1,1,0],[0,1,1]]  // Z
];
const SHAPE_COLORS = ['#00d4ff','#ffd60a','#b44dff','#ff8c00','#2d7bff','#00e676','#ff2d7b'];

const Tetris = {
    canvas: null, ctx: null, ui: null,
    cols: 10, rows: 20, cellSize: 0, board: [],
    current: null, score: 0, lines: 0, level: 1,
    gameOver: false, paused: false, animFrame: null,
    dropTimer: 0, dropInterval: 45,

    // Animation state
    flashRows: [],       // rows currently flashing [{row, frame}]
    flashDuration: 20,   // frames for flash fade-out
    pendingClear: null,   // rows to collapse after flash finishes
    particles: [],        // line-clear particles [{x, y, vx, vy, life, maxLife, color}]

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.cellSize = Math.min(Math.floor(ui.canvasW / (this.cols + 6)), Math.floor(ui.canvasH / this.rows));
        this.handleKey = this.handleKey.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        document.addEventListener('keydown', this.handleKey);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
    },

    start() {
        this.board = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
        this.score = 0; this.lines = 0; this.level = 1; this.dropInterval = 45;
        this.gameOver = false; this.paused = false; this.dropTimer = 0;
        this.flashRows = []; this.pendingClear = null; this.particles = [];
        this.ui.setScore(0); this.ui.hideGameOver(); this.ui.hidePause();
        this.spawnPiece();
        this.loop();
    },

    spawnPiece() {
        const idx = Math.floor(Math.random() * SHAPES.length);
        const shape = SHAPES[idx].map(r => [...r]);
        this.current = { shape, color: SHAPE_COLORS[idx], x: Math.floor(this.cols/2) - Math.floor(shape[0].length/2), y: 0 };
        if (this.collides(this.current.shape, this.current.x, this.current.y)) this.endGame();
    },

    collides(shape, ox, oy) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (!shape[r][c]) continue;
                const nx = ox + c, ny = oy + r;
                if (nx < 0 || nx >= this.cols || ny >= this.rows) return true;
                if (ny >= 0 && this.board[ny][nx]) return true;
            }
        }
        return false;
    },

    lock() {
        const { shape, color, x, y } = this.current;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] && y + r >= 0) this.board[y + r][x + c] = color;
            }
        }
        this.clearLines();
        this.spawnPiece();
    },

    clearLines() {
        let clearedRows = [];
        for (let r = this.rows - 1; r >= 0; r--) {
            if (this.board[r].every(c => c)) {
                clearedRows.push(r);
            }
        }
        if (clearedRows.length) {
            // Start flash animation instead of immediately collapsing
            this.flashRows = clearedRows.map(row => ({ row, frame: 0 }));
            this.pendingClear = clearedRows;

            // Spawn particles for each cleared row
            const cs = this.cellSize;
            const ox = (this.ui.canvasW - this.cols * cs) / 2;
            const oy = (this.ui.canvasH - this.rows * cs) / 2;
            for (const row of clearedRows) {
                for (let c = 0; c < this.cols; c++) {
                    const color = this.board[row][c] || '#ffffff';
                    const cx = ox + c * cs + cs / 2;
                    const cy = oy + row * cs + cs / 2;
                    for (let p = 0; p < 3; p++) {
                        this.particles.push({
                            x: cx, y: cy,
                            vx: (Math.random() - 0.5) * 4,
                            vy: (Math.random() - 0.5) * 4 - 1,
                            life: 0,
                            maxLife: 20 + Math.random() * 15,
                            color: color
                        });
                    }
                }
            }

            // Update score and level
            const cleared = clearedRows.length;
            this.lines += cleared;
            this.score += [0, 100, 300, 500, 800][cleared] * this.level;
            this.ui.setScore(this.score);
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(5, 45 - this.level * 4);
        }
    },

    // Collapse the pending rows after flash animation completes
    collapsePendingRows() {
        if (!this.pendingClear) return;
        // Sort rows descending so splicing from bottom up works
        const rows = this.pendingClear.sort((a, b) => b - a);
        for (const r of rows) {
            this.board.splice(r, 1);
            this.board.unshift(Array(this.cols).fill(0));
        }
        this.pendingClear = null;
    },

    rotate() {
        const s = this.current.shape;
        const rotated = s[0].map((_, c) => s.map(r => r[c]).reverse());
        if (!this.collides(rotated, this.current.x, this.current.y)) this.current.shape = rotated;
    },

    loop() {
        if (this.gameOver) return;
        if (!this.paused) this.update();
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update() {
        // Update flash animation
        if (this.flashRows.length > 0) {
            let allDone = true;
            for (const fr of this.flashRows) {
                fr.frame++;
                if (fr.frame < this.flashDuration) allDone = false;
            }
            if (allDone) {
                this.flashRows = [];
                this.collapsePendingRows();
            }
            // Don't drop piece while flash is playing
        } else {
            this.dropTimer++;
            if (this.dropTimer >= this.dropInterval) {
                this.dropTimer = 0;
                if (!this.collides(this.current.shape, this.current.x, this.current.y + 1)) {
                    this.current.y++;
                } else {
                    this.lock();
                }
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // gravity
            p.life++;
            if (p.life >= p.maxLife) {
                this.particles.splice(i, 1);
            }
        }
    },

    handleKey(e) {
        if (this.gameOver) return;
        if (e.key === 'p' || e.key === 'P') { this.paused = !this.paused; if (this.paused) this.ui.showPause(); else this.ui.hidePause(); return; }
        if (this.paused) return;
        if (this.flashRows.length > 0) return; // block input during flash
        if (e.key === 'ArrowLeft' || e.key === 'a') { if (!this.collides(this.current.shape, this.current.x - 1, this.current.y)) this.current.x--; }
        if (e.key === 'ArrowRight' || e.key === 'd') { if (!this.collides(this.current.shape, this.current.x + 1, this.current.y)) this.current.x++; }
        if (e.key === 'ArrowDown' || e.key === 's') { if (!this.collides(this.current.shape, this.current.x, this.current.y + 1)) { this.current.y++; this.score++; this.ui.setScore(this.score); } }
        if (e.key === 'ArrowUp' || e.key === 'w') this.rotate();
        if (e.key === ' ') { e.preventDefault(); while (!this.collides(this.current.shape, this.current.x, this.current.y + 1)) { this.current.y++; this.score += 2; } this.lock(); this.ui.setScore(this.score); }
    },

    handleTouch(e) {
        e.preventDefault();
        if (this.flashRows.length > 0) return; // block input during flash
        const r = this.canvas.getBoundingClientRect();
        const tx = e.touches[0].clientX - r.left, ty = e.touches[0].clientY - r.top;
        const w = this.ui.canvasW, h = this.ui.canvasH;
        if (ty < h * 0.4) this.rotate();
        else if (tx < w / 3) { if (!this.collides(this.current.shape, this.current.x - 1, this.current.y)) this.current.x--; }
        else if (tx > w * 2/3) { if (!this.collides(this.current.shape, this.current.x + 1, this.current.y)) this.current.x++; }
        else { while (!this.collides(this.current.shape, this.current.x, this.current.y + 1)) { this.current.y++; this.score += 2; } this.lock(); this.ui.setScore(this.score); }
    },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH, cs = this.cellSize;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        const ox = (w - this.cols * cs) / 2, oy = (h - this.rows * cs) / 2;

        // Board border
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
        ctx.strokeRect(ox - 1, oy - 1, this.cols * cs + 2, this.rows * cs + 2);

        // Set of flashing rows for quick lookup
        const flashMap = {};
        for (const fr of this.flashRows) {
            flashMap[fr.row] = fr.frame;
        }

        // Board
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const color = this.board[r][c];
                if (r in flashMap) {
                    // Flash effect: white fading out
                    const progress = flashMap[r] / this.flashDuration;
                    const alpha = 1 - progress;
                    ctx.fillStyle = color || '#111';
                    ctx.fillRect(ox + c * cs, oy + r * cs, cs - 1, cs - 1);
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.fillRect(ox + c * cs, oy + r * cs, cs - 1, cs - 1);
                } else {
                    ctx.fillStyle = color || '#111';
                    ctx.fillRect(ox + c * cs, oy + r * cs, cs - 1, cs - 1);
                }
            }
        }

        // Current piece
        if (this.current) {
            const { shape, color, x, y } = this.current;
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c]) {
                        ctx.fillStyle = color;
                        ctx.fillRect(ox + (x + c) * cs, oy + (y + r) * cs, cs - 1, cs - 1);
                    }
                }
            }
        }

        // Particles
        for (const p of this.particles) {
            const alpha = 1 - p.life / p.maxLife;
            const size = 3 * alpha;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Info
        ctx.fillStyle = '#8888a0'; ctx.font = '12px Outfit, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`Level: ${this.level}`, ox, oy - 10);
        ctx.textAlign = 'right';
        ctx.fillText(`Lines: ${this.lines}`, ox + this.cols * cs, oy - 10);
    },

    endGame() {
        this.gameOver = true; cancelAnimationFrame(this.animFrame);
        this.ui.setHighScore(this.score); this.ui.showGameOver(this.score, this.ui.getHighScore());
    },

    pause() { this.paused = true; this.ui.showPause(); },
    resume() { this.paused = false; this.ui.hidePause(); },
    reset() { cancelAnimationFrame(this.animFrame); },
    destroy() { cancelAnimationFrame(this.animFrame); document.removeEventListener('keydown', this.handleKey); }
};
export default Tetris;
