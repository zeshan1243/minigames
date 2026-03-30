const TILE_COLORS = { 2:'#264653', 4:'#2a9d8f', 8:'#e9c46a', 16:'#f4a261', 32:'#e76f51', 64:'#d62828', 128:'#f77f00', 256:'#fcbf49', 512:'#eae2b7', 1024:'#00d4ff', 2048:'#ffd60a' };

const Game2048 = {
    canvas: null, ctx: null, ui: null,
    grid: [], size: 4, cellSize: 0, gap: 8, score: 0,
    gameOver: false, animFrame: null, touchStartX: 0, touchStartY: 0,
    // Animation state
    tiles: [],       // { val, r, c, fromR, fromC, scale, mergedFrom }
    animating: false,
    animProgress: 0,
    newTile: null,    // { r, c, scale }
    mergedCells: [],  // [{ r, c, scale }]

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        // Fit board within canvas, leaving space for title (80px top) and hint (60px bottom)
        const maxBoardW = ui.canvasW - 40;
        const maxBoardH = ui.canvasH - 140;
        const maxBoard = Math.min(maxBoardW, maxBoardH);
        this.cellSize = (maxBoard - this.gap * (this.size + 1)) / this.size;
        this.handleKey = this.handleKey.bind(this);
        this.handleTouchStart = (e) => { e.preventDefault(); this.touchStartX = e.touches[0].clientX; this.touchStartY = e.touches[0].clientY; };
        this.handleTouchEnd = (e) => { e.preventDefault(); const dx = e.changedTouches[0].clientX - this.touchStartX; const dy = e.changedTouches[0].clientY - this.touchStartY; if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return; if (Math.abs(dx) > Math.abs(dy)) this.move(dx > 0 ? 'right' : 'left'); else this.move(dy > 0 ? 'down' : 'up'); };
        document.addEventListener('keydown', this.handleKey);
        canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    },

    start() {
        this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(0));
        this.score = 0; this.gameOver = false;
        this.tiles = []; this.animating = false; this.newTile = null; this.mergedCells = [];
        this.ui.setScore(0); this.ui.hideGameOver();
        this.addTile(); this.addTile();
        this.buildTiles();
        // Pop-in the initial tiles
        for (const t of this.tiles) t.scale = 0;
        this.newTile = null;
        this.animating = true; this.animProgress = 0;
        this.loop();
    },

    buildTiles() {
        this.tiles = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c]) {
                    this.tiles.push({ val: this.grid[r][c], r, c, fromR: r, fromC: c, scale: 1 });
                }
            }
        }
    },

    addTile() {
        const empty = [];
        for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) if (!this.grid[r][c]) empty.push([r, c]);
        if (empty.length === 0) return;
        const [r, c] = empty[Math.floor(Math.random() * empty.length)];
        this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
        this.newTile = { r, c, scale: 0 };
    },

    move(dir) {
        if (this.gameOver || this.animating) return;
        const s = this.size;

        // Snapshot old positions
        const oldGrid = this.grid.map(r => [...r]);

        let moved = false;
        this.mergedCells = [];

        // Track tile movements: for each resulting cell, where did it come from?
        const origins = Array.from({ length: s }, () => Array.from({ length: s }, () => null));

        const slideWithTracking = (arr, indices) => {
            // indices: array of {r,c} for each element in arr (original positions)
            let filtered = [];
            let filteredIdx = [];
            for (let i = 0; i < arr.length; i++) {
                if (arr[i]) { filtered.push(arr[i]); filteredIdx.push(indices[i]); }
            }
            const result = [];
            const resultOrigins = [];
            let i = 0;
            while (i < filtered.length) {
                if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
                    const merged = filtered[i] * 2;
                    this.score += merged;
                    result.push(merged);
                    resultOrigins.push({ from: [filteredIdx[i], filteredIdx[i + 1]], merged: true });
                    i += 2;
                } else {
                    result.push(filtered[i]);
                    resultOrigins.push({ from: [filteredIdx[i]], merged: false });
                    i++;
                }
            }
            while (result.length < s) { result.push(0); resultOrigins.push(null); }
            return { result, resultOrigins };
        };

        // Build movement map
        const movements = []; // { val, toR, toC, fromR, fromC, merged }

        if (dir === 'left') {
            for (let r = 0; r < s; r++) {
                const indices = [];
                for (let c = 0; c < s; c++) indices.push({ r, c });
                const { result, resultOrigins } = slideWithTracking(this.grid[r], indices);
                if (result.join() !== this.grid[r].join()) moved = true;
                for (let c = 0; c < s; c++) {
                    this.grid[r][c] = result[c];
                    if (result[c] && resultOrigins[c]) {
                        for (const from of resultOrigins[c].from) {
                            movements.push({ val: result[c], toR: r, toC: c, fromR: from.r, fromC: from.c, merged: resultOrigins[c].merged });
                        }
                        if (resultOrigins[c].merged) this.mergedCells.push({ r, c, scale: 1 });
                    }
                }
            }
        } else if (dir === 'right') {
            for (let r = 0; r < s; r++) {
                const indices = [];
                for (let c = s - 1; c >= 0; c--) indices.push({ r, c });
                const arr = [...this.grid[r]].reverse();
                const { result, resultOrigins } = slideWithTracking(arr, indices);
                const finalRow = result.reverse();
                resultOrigins.reverse();
                if (finalRow.join() !== this.grid[r].join()) moved = true;
                for (let c = 0; c < s; c++) {
                    this.grid[r][c] = finalRow[c];
                    if (finalRow[c] && resultOrigins[c]) {
                        for (const from of resultOrigins[c].from) {
                            movements.push({ val: finalRow[c], toR: r, toC: c, fromR: from.r, fromC: from.c, merged: resultOrigins[c].merged });
                        }
                        if (resultOrigins[c].merged) this.mergedCells.push({ r, c, scale: 1 });
                    }
                }
            }
        } else if (dir === 'up') {
            for (let c = 0; c < s; c++) {
                const col = [], indices = [];
                for (let r = 0; r < s; r++) { col.push(this.grid[r][c]); indices.push({ r, c }); }
                const { result, resultOrigins } = slideWithTracking(col, indices);
                for (let r = 0; r < s; r++) {
                    if (this.grid[r][c] !== result[r]) moved = true;
                    this.grid[r][c] = result[r];
                    if (result[r] && resultOrigins[r]) {
                        for (const from of resultOrigins[r].from) {
                            movements.push({ val: result[r], toR: r, toC: c, fromR: from.r, fromC: from.c, merged: resultOrigins[r].merged });
                        }
                        if (resultOrigins[r].merged) this.mergedCells.push({ r, c, scale: 1 });
                    }
                }
            }
        } else if (dir === 'down') {
            for (let c = 0; c < s; c++) {
                const col = [], indices = [];
                for (let r = s - 1; r >= 0; r--) { col.push(this.grid[r][c]); indices.push({ r, c }); }
                const { result, resultOrigins } = slideWithTracking(col, indices);
                result.reverse(); resultOrigins.reverse();
                for (let r = 0; r < s; r++) {
                    if (this.grid[r][c] !== result[r]) moved = true;
                    this.grid[r][c] = result[r];
                    if (result[r] && resultOrigins[r]) {
                        for (const from of resultOrigins[r].from) {
                            movements.push({ val: result[r], toR: r, toC: c, fromR: from.r, fromC: from.c, merged: resultOrigins[r].merged });
                        }
                        if (resultOrigins[r].merged) this.mergedCells.push({ r, c, scale: 1 });
                    }
                }
            }
        }

        if (moved) {
            // Build animated tiles from movements
            this.tiles = [];
            const seen = new Set();
            for (const m of movements) {
                const key = `${m.toR},${m.toC}`;
                this.tiles.push({ val: m.val, r: m.toR, c: m.toC, fromR: m.fromR, fromC: m.fromC, scale: 1 });
                seen.add(key);
            }

            this.addTile();
            this.ui.setScore(this.score);
            this.animating = true;
            this.animProgress = 0;
            this.restartLoop();

            if (this.isGameOver()) {
                setTimeout(() => this.endGame(), 500);
            }
        } else {
            this.render();
        }
    },

    isGameOver() {
        const g = this.grid, s = this.size;
        for (let r = 0; r < s; r++) for (let c = 0; c < s; c++) {
            if (!g[r][c]) return false;
            if (c < s-1 && g[r][c] === g[r][c+1]) return false;
            if (r < s-1 && g[r][c] === g[r+1][c]) return false;
        }
        return true;
    },

    handleKey(e) {
        const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
        if (map[e.key]) { e.preventDefault(); this.move(map[e.key]); }
    },

    loop() {
        if (this.gameOver && !this.animating) return;
        this.updateAnim();
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    restartLoop() {
        cancelAnimationFrame(this.animFrame);
        this.loop();
    },

    updateAnim() {
        if (!this.animating) return;
        this.animProgress = Math.min(1, this.animProgress + 0.06);

        // Update new tile scale
        if (this.newTile) {
            this.newTile.scale = Math.min(1, this.newTile.scale + 0.08);
        }

        // Update merged cell pulse
        for (const mc of this.mergedCells) {
            if (this.animProgress < 0.5) mc.scale = 1 + 0.15 * (this.animProgress / 0.5);
            else mc.scale = 1.15 - 0.15 * ((this.animProgress - 0.5) / 0.5);
        }

        if (this.animProgress >= 1) {
            this.animating = false;
            this.buildTiles();
            this.newTile = null;
            this.mergedCells = [];
        }
    },

    easeOut(t) {
        return 1 - (1 - t) * (1 - t);
    },

    getCellPos(r, c) {
        const s = this.size, cs = this.cellSize, gap = this.gap;
        const ox = (this.ui.canvasW - (s * cs + (s+1) * gap)) / 2;
        const boardSize = s * cs + (s + 1) * gap;
        const oy = Math.max(80, (this.ui.canvasH - boardSize) / 2 + 20);
        return { x: ox + c * (cs + gap), y: oy + r * (cs + gap) };
    },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        const cs = this.cellSize, gap = this.gap, s = this.size;
        const ox = (w - (s * cs + (s+1) * gap)) / 2;
        const boardSize = s * cs + (s + 1) * gap;
        const oy = Math.max(80, (this.ui.canvasH - boardSize) / 2 + 20);

        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#e8e8f0'; ctx.font = 'bold 28px Outfit, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('2048', w/2, 50);

        // Board bg
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath(); ctx.roundRect(ox - gap, oy - gap, s * cs + (s+1) * gap, s * cs + (s+1) * gap, 12); ctx.fill();

        // Empty cells
        for (let r = 0; r < s; r++) {
            for (let c = 0; c < s; c++) {
                const pos = this.getCellPos(r, c);
                ctx.fillStyle = '#12121a';
                ctx.beginPath(); ctx.roundRect(pos.x, pos.y, cs, cs, 8); ctx.fill();
            }
        }

        const t = this.easeOut(this.animProgress);

        // Draw tiles with animation
        for (const tile of this.tiles) {
            const fromPos = this.getCellPos(tile.fromR, tile.fromC);
            const toPos = this.getCellPos(tile.r, tile.c);

            // Interpolate position
            let x, y;
            if (this.animating) {
                x = fromPos.x + (toPos.x - fromPos.x) * t;
                y = fromPos.y + (toPos.y - fromPos.y) * t;
            } else {
                x = toPos.x; y = toPos.y;
            }

            // Check if this is a merged cell for pulse effect
            let scale = tile.scale;
            const mc = this.mergedCells.find(m => m.r === tile.r && m.c === tile.c);
            if (mc && this.animating) scale = mc.scale;

            this.drawTile(ctx, tile.val, x, y, cs, scale);
        }

        // Draw new tile with pop-in
        if (this.newTile && this.animating) {
            const pos = this.getCellPos(this.newTile.r, this.newTile.c);
            const val = this.grid[this.newTile.r][this.newTile.c];
            if (val) {
                this.drawTile(ctx, val, pos.x, pos.y, cs, this.newTile.scale);
            }
        }

        // Controls hint
        ctx.fillStyle = '#8888a0'; ctx.font = '13px Outfit, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Arrow keys or swipe to move', w/2, h - 40);
    },

    drawTile(ctx, val, x, y, cs, scale) {
        ctx.save();
        const cx = x + cs / 2, cy = y + cs / 2;
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cs / 2, -cs / 2);

        ctx.fillStyle = TILE_COLORS[val] || '#333';
        ctx.beginPath(); ctx.roundRect(0, 0, cs, cs, 8); ctx.fill();

        ctx.fillStyle = val >= 8 ? '#000' : '#e8e8f0';
        ctx.font = `bold ${val >= 1000 ? 20 : val >= 100 ? 24 : 30}px JetBrains Mono, monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(val), cs / 2, cs / 2);
        ctx.textBaseline = 'alphabetic';

        ctx.restore();
    },

    endGame() {
        this.gameOver = true;
        this.ui.setHighScore(this.score); this.ui.showGameOver(this.score, this.ui.getHighScore());
    },

    pause() {}, resume() {},
    reset() { cancelAnimationFrame(this.animFrame); },
    destroy() { cancelAnimationFrame(this.animFrame); document.removeEventListener('keydown', this.handleKey); }
};
export default Game2048;
