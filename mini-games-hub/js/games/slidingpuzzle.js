const SlidingPuzzle = {
    canvas: null, ctx: null, ui: null,
    size: 4, grid: [], cellSize: 0, moves: 0, gameOver: false, animFrame: null,
    // Animation
    animating: false,
    animTile: null,   // { val, fromR, fromC, toR, toC }
    animProgress: 0,

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.cellSize = (Math.min(ui.canvasW, ui.canvasH) - 160) / this.size;
        this.handleClick = this.handleClick.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        this.handleKey = this.handleKey.bind(this);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
        document.addEventListener('keydown', this.handleKey);
    },

    start() {
        // Configure difficulty
        const level = this.ui.level || 'medium';
        if (level === 'easy') { this.size = 3; }
        else if (level === 'hard' || level === 'expert') { this.size = 5; }
        else { this.size = 4; }
        this.cellSize = (Math.min(this.ui.canvasW, this.ui.canvasH) - 160) / this.size;

        this.moves = 0; this.gameOver = false;
        this.animating = false; this.animTile = null;
        this.ui.setScore(0); this.ui.hideGameOver();
        this.grid = [];
        for (let i = 1; i < this.size * this.size; i++) this.grid.push(i);
        this.grid.push(0);
        this.shuffle();
        this.render();
    },

    shuffle() {
        for (let i = 0; i < 200; i++) {
            const empty = this.grid.indexOf(0);
            const er = Math.floor(empty / this.size), ec = empty % this.size;
            const dirs = [];
            if (er > 0) dirs.push(-this.size);
            if (er < this.size - 1) dirs.push(this.size);
            if (ec > 0) dirs.push(-1);
            if (ec < this.size - 1) dirs.push(1);
            const d = dirs[Math.floor(Math.random() * dirs.length)];
            this.grid[empty] = this.grid[empty + d];
            this.grid[empty + d] = 0;
        }
    },

    tryMove(idx) {
        if (this.gameOver || this.animating) return;
        const empty = this.grid.indexOf(0);
        const er = Math.floor(empty / this.size), ec = empty % this.size;
        const tr = Math.floor(idx / this.size), tc = idx % this.size;
        if ((Math.abs(er - tr) === 1 && ec === tc) || (Math.abs(ec - tc) === 1 && er === tr)) {
            const val = this.grid[idx];
            // Start animation: tile slides from idx position to empty position
            this.animTile = { val, fromR: tr, fromC: tc, toR: er, toC: ec };
            this.animating = true;
            this.animProgress = 0;

            // Update grid immediately (logically)
            this.grid[empty] = this.grid[idx];
            this.grid[idx] = 0;
            this.moves++;
            this.ui.setScore(this.moves);

            this.runAnim();
        }
    },

    runAnim() {
        this.animProgress += 0.1;
        if (this.animProgress >= 1) {
            this.animProgress = 1;
            this.animating = false;
            this.animTile = null;
            if (this.isSolved()) this.endGame();
            this.render();
            return;
        }
        this.render();
        this.animFrame = requestAnimationFrame(() => this.runAnim());
    },

    easeOut(t) {
        return 1 - (1 - t) * (1 - t);
    },

    isSolved() {
        for (let i = 0; i < this.grid.length - 1; i++) {
            if (this.grid[i] !== i + 1) return false;
        }
        return true;
    },

    handleClick(e) {
        const r = this.canvas.getBoundingClientRect();
        this.processXY(e.clientX - r.left, e.clientY - r.top);
    },
    handleTouch(e) {
        e.preventDefault();
        const r = this.canvas.getBoundingClientRect();
        this.processXY(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top);
    },
    processXY(x, y) {
        const cs = this.cellSize, s = this.size;
        const w = this.ui.canvasW, h = this.ui.canvasH;
        const gridTotal = cs * s;
        const ox = (w - gridTotal) / 2;
        const oy = 90 + (h - 90 - gridTotal) / 2;
        const col = Math.floor((x - ox) / cs);
        const row = Math.floor((y - oy) / cs);
        if (col >= 0 && col < this.size && row >= 0 && row < this.size) {
            this.tryMove(row * this.size + col);
        }
    },
    handleKey(e) {
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
        const empty = this.grid.indexOf(0);
        const er = Math.floor(empty / this.size), ec = empty % this.size;
        if (e.key === 'ArrowUp' && er < this.size - 1) this.tryMove((er+1)*this.size + ec);
        if (e.key === 'ArrowDown' && er > 0) this.tryMove((er-1)*this.size + ec);
        if (e.key === 'ArrowLeft' && ec < this.size - 1) this.tryMove(er*this.size + ec + 1);
        if (e.key === 'ArrowRight' && ec > 0) this.tryMove(er*this.size + ec - 1);
    },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        const cs = this.cellSize, s = this.size;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#e8e8f0'; ctx.font = 'bold 22px Outfit, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Sliding Puzzle', w/2, 40);
        ctx.fillStyle = '#8888a0'; ctx.font = '14px Outfit, sans-serif';
        ctx.fillText(`Moves: ${this.moves}`, w/2, 70);

        const gridTotal = cs * s;
        const ox = (w - gridTotal) / 2;
        const oy = 90 + (h - 90 - gridTotal) / 2;
        const t = this.easeOut(this.animProgress);

        // Determine which grid index is being animated (the destination)
        let animIdx = -1;
        if (this.animTile) {
            animIdx = this.animTile.toR * s + this.animTile.toC;
        }

        for (let i = 0; i < this.grid.length; i++) {
            const val = this.grid[i];
            const r = Math.floor(i / s), c = i % s;

            if (val === 0) {
                // Empty cell background
                const x = ox + c * cs + 2, y2 = oy + r * cs + 2, cw = cs - 4;
                ctx.fillStyle = '#111'; ctx.fillRect(x, y2, cw, cw);
                continue;
            }

            // Check if this tile is the one being animated
            if (this.animating && this.animTile && i === animIdx) {
                const a = this.animTile;
                const fromX = ox + a.fromC * cs + 2;
                const fromY = oy + a.fromR * cs + 2;
                const toX = ox + a.toC * cs + 2;
                const toY = oy + a.toR * cs + 2;
                const x = fromX + (toX - fromX) * t;
                const y2 = fromY + (toY - fromY) * t;
                const cw = cs - 4;
                this.drawTile(ctx, val, x, y2, cw, s);
            } else {
                const x = ox + c * cs + 2, y2 = oy + r * cs + 2, cw = cs - 4;
                this.drawTile(ctx, val, x, y2, cw, s);
            }
        }

        // Also draw the empty slot where the animated tile came FROM (during animation)
        if (this.animating && this.animTile) {
            const a = this.animTile;
            // The "from" position is now the empty cell in the grid, already drawn above
            // But we also need to draw the empty bg at the old position during animation
            const oldIdx = a.fromR * s + a.fromC;
            const fromX = ox + a.fromC * cs + 2;
            const fromY = oy + a.fromR * cs + 2;
            const cw = cs - 4;
            ctx.fillStyle = '#111'; ctx.fillRect(fromX, fromY, cw, cw);

            // Re-draw animated tile on top
            const toX = ox + a.toC * cs + 2;
            const toY = oy + a.toR * cs + 2;
            const x = fromX + (toX - fromX) * t;
            const y2 = fromY + (toY - fromY) * t;
            this.drawTile(ctx, a.val, x, y2, cw, s);
        }
    },

    drawTile(ctx, val, x, y, cw, s) {
        const hue = (val / (s * s)) * 200 + 150;
        ctx.fillStyle = `hsl(${hue}, 60%, 40%)`;
        ctx.beginPath(); ctx.roundRect(x, y, cw, cw, 8); ctx.fill();

        // Highlight border
        ctx.strokeStyle = `hsl(${hue}, 60%, 55%)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(x, y, cw, cw, 8); ctx.stroke();

        ctx.fillStyle = '#e8e8f0';
        ctx.font = `bold ${cw > 60 ? 28 : 20}px JetBrains Mono, monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(val), x + cw / 2, y + cw / 2);
        ctx.textBaseline = 'alphabetic';
    },

    endGame() {
        this.gameOver = true;
        this.ui.setHighScore(this.moves);
        this.ui.showGameOver(`${this.moves} moves`, this.ui.getHighScore());
    },

    pause() {}, resume() {},
    reset() { cancelAnimationFrame(this.animFrame); },
    destroy() { cancelAnimationFrame(this.animFrame); document.removeEventListener('keydown', this.handleKey); }
};
export default SlidingPuzzle;
