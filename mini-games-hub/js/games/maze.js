const Maze = {
    canvas: null,
    ctx: null,
    ui: null,
    score: 0,
    gameOver: false,
    paused: false,
    animFrame: null,
    grid: [],
    cols: 0,
    rows: 0,
    cellSize: 0,
    player: null,
    end: null,
    startTime: 0,
    elapsed: 0,
    trail: [],
    winFlash: 0,
    offsetX: 0,
    offsetY: 0,
    touchStart: null,

    // Animation state
    moving: false,
    moveFrom: null,
    moveTo: null,
    moveProgress: 0,
    moveFrames: 8,
    fadingTrail: [],   // last 10 positions with alpha

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this.handleKey = this.handleKey.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        document.addEventListener('keydown', this.handleKey);
        canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    },

    start() {
        this.reset();
        this.gameOver = false;
        this.paused = false;
        this.ui.hideGameOver();
        this.ui.hidePause();
        this.startTime = performance.now();
        this.loop();
    },

    reset() {
        cancelAnimationFrame(this.animFrame);
        this.elapsed = 0;
        this.trail = [];
        this.winFlash = 0;
        this.moving = false;
        this.moveFrom = null;
        this.moveTo = null;
        this.moveProgress = 0;
        this.fadingTrail = [];
        this.ui.setScore(0);

        const w = this.ui.canvasW;
        const h = this.ui.canvasH;

        // Configure difficulty
        const level = this.ui.level || 'medium';
        if (level === 'easy') { this.cols = 10; this.rows = 13; }
        else if (level === 'hard') { this.cols = 22; this.rows = 29; }
        else if (level === 'expert') { this.cols = 30; this.rows = 39; }
        else { this.cols = 15; this.rows = 19; }
        this.cellSize = Math.floor(Math.min((w - 20) / this.cols, (h - 60) / this.rows));
        this.offsetX = Math.floor((w - this.cols * this.cellSize) / 2);
        this.offsetY = Math.floor((h - 40 - this.rows * this.cellSize) / 2) + 30;

        this.generateMaze();

        this.player = { col: 0, row: 0 };
        this.end = { col: this.cols - 1, row: this.rows - 1 };
        this.trail = [{ col: 0, row: 0 }];
        this.fadingTrail = [{ col: 0, row: 0 }];
    },

    generateMaze() {
        // Initialize grid with all walls
        this.grid = [];
        for (let r = 0; r < this.rows; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.grid[r][c] = { top: true, right: true, bottom: true, left: true, visited: false };
            }
        }

        // Recursive backtracking
        const stack = [];
        const start = this.grid[0][0];
        start.visited = true;
        stack.push({ r: 0, c: 0 });

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = this.getUnvisitedNeighbors(current.r, current.c);

            if (neighbors.length === 0) {
                stack.pop();
            } else {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                this.removeWall(current.r, current.c, next.r, next.c);
                this.grid[next.r][next.c].visited = false;
                this.grid[next.r][next.c].visited = true;
                stack.push(next);
            }
        }
    },

    getUnvisitedNeighbors(r, c) {
        const neighbors = [];
        if (r > 0 && !this.grid[r - 1][c].visited) neighbors.push({ r: r - 1, c });
        if (r < this.rows - 1 && !this.grid[r + 1][c].visited) neighbors.push({ r: r + 1, c });
        if (c > 0 && !this.grid[r][c - 1].visited) neighbors.push({ r, c: c - 1 });
        if (c < this.cols - 1 && !this.grid[r][c + 1].visited) neighbors.push({ r, c: c + 1 });
        return neighbors;
    },

    removeWall(r1, c1, r2, c2) {
        if (r2 === r1 - 1) { this.grid[r1][c1].top = false; this.grid[r2][c2].bottom = false; }
        if (r2 === r1 + 1) { this.grid[r1][c1].bottom = false; this.grid[r2][c2].top = false; }
        if (c2 === c1 - 1) { this.grid[r1][c1].left = false; this.grid[r2][c2].right = false; }
        if (c2 === c1 + 1) { this.grid[r1][c1].right = false; this.grid[r2][c2].left = false; }
    },

    // EaseOut function for smooth deceleration
    easeOut(t) {
        return 1 - (1 - t) * (1 - t);
    },

    loop() {
        if (this.gameOver) return;
        if (!this.paused) {
            this.update();
        }
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update() {
        if (!this.gameOver && !this.paused) {
            this.elapsed = (performance.now() - this.startTime) / 1000;
            this.ui.setScore(this.elapsed.toFixed(1) + 's');
        }
        if (this.winFlash > 0) this.winFlash -= 0.02;

        // Animate player movement
        if (this.moving) {
            this.moveProgress++;
            if (this.moveProgress >= this.moveFrames) {
                // Animation complete: snap to target
                this.player.col = this.moveTo.col;
                this.player.row = this.moveTo.row;
                this.moving = false;
                this.moveFrom = null;
                this.moveTo = null;
                this.moveProgress = 0;

                // Check win after movement completes
                if (this.player.row === this.end.row && this.player.col === this.end.col) {
                    this.winFlash = 1;
                    this.score = Math.round(this.elapsed * 10) / 10;
                    setTimeout(() => this.endGame(), 800);
                }
            }
        }
    },

    movePlayer(dr, dc) {
        if (this.gameOver || this.paused || this.moving) return;
        const p = this.player;
        const cell = this.grid[p.row][p.col];

        // Check wall
        if (dc === -1 && cell.left) return;
        if (dc === 1 && cell.right) return;
        if (dr === -1 && cell.top) return;
        if (dr === 1 && cell.bottom) return;

        const nr = p.row + dr;
        const nc = p.col + dc;
        if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) return;

        // Start smooth movement animation
        this.moveFrom = { col: p.col, row: p.row };
        this.moveTo = { col: nc, row: nr };
        this.moveProgress = 0;
        this.moving = true;

        // Add to trail and fading trail
        this.trail.push({ col: nc, row: nr });
        this.fadingTrail.push({ col: nc, row: nr });
        // Keep only last 10 positions in fading trail
        if (this.fadingTrail.length > 10) {
            this.fadingTrail.shift();
        }
    },

    // Get interpolated player position for rendering
    getPlayerRenderPos() {
        const cs = this.cellSize;
        const ox = this.offsetX;
        const oy = this.offsetY;

        if (this.moving && this.moveFrom && this.moveTo) {
            const t = this.easeOut(this.moveProgress / this.moveFrames);
            const fromX = ox + this.moveFrom.col * cs + cs / 2;
            const fromY = oy + this.moveFrom.row * cs + cs / 2;
            const toX = ox + this.moveTo.col * cs + cs / 2;
            const toY = oy + this.moveTo.row * cs + cs / 2;
            return {
                x: fromX + (toX - fromX) * t,
                y: fromY + (toY - fromY) * t
            };
        }

        return {
            x: ox + this.player.col * cs + cs / 2,
            y: oy + this.player.row * cs + cs / 2
        };
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
        if (this.winFlash > 0) {
            ctx.fillStyle = `rgba(0,230,118,${this.winFlash * 0.1})`;
            ctx.fillRect(0, 0, w, h);
        }

        // Maze background
        ctx.fillStyle = '#0d0d18';
        ctx.fillRect(ox - 2, oy - 2, this.cols * cs + 4, this.rows * cs + 4);

        // Trail (full trail, dimmer)
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const alpha = 0.05 + (i / this.trail.length) * 0.15;
            ctx.fillStyle = `rgba(0,212,255,${alpha})`;
            ctx.fillRect(ox + t.col * cs + 1, oy + t.row * cs + 1, cs - 2, cs - 2);
        }

        // Fading trail (last 10 positions with decreasing alpha)
        for (let i = 0; i < this.fadingTrail.length; i++) {
            const t = this.fadingTrail[i];
            const alpha = ((i + 1) / this.fadingTrail.length) * 0.4;
            ctx.save();
            ctx.shadowColor = 'rgba(255,45,123,' + alpha + ')';
            ctx.shadowBlur = 6;
            ctx.fillStyle = `rgba(255,45,123,${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(
                ox + t.col * cs + cs / 2,
                oy + t.row * cs + cs / 2,
                cs * 0.2, 0, Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
        }

        // End cell glow
        const endPulse = 0.3 + Math.sin(performance.now() / 500) * 0.15;
        ctx.fillStyle = `rgba(0,230,118,${endPulse})`;
        ctx.fillRect(ox + this.end.col * cs + 1, oy + this.end.row * cs + 1, cs - 2, cs - 2);

        // Walls
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.grid[r][c];
                const x = ox + c * cs;
                const y = oy + r * cs;

                if (cell.top) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + cs, y);
                    ctx.stroke();
                }
                if (cell.right) {
                    ctx.beginPath();
                    ctx.moveTo(x + cs, y);
                    ctx.lineTo(x + cs, y + cs);
                    ctx.stroke();
                }
                if (cell.bottom) {
                    ctx.beginPath();
                    ctx.moveTo(x, y + cs);
                    ctx.lineTo(x + cs, y + cs);
                    ctx.stroke();
                }
                if (cell.left) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, y + cs);
                    ctx.stroke();
                }
            }
        }

        // Outer border
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(ox, oy, this.cols * cs, this.rows * cs);

        // Player (using interpolated position for smooth movement)
        const playerPos = this.getPlayerRenderPos();
        const px = playerPos.x;
        const py = playerPos.y;
        const pr = cs * 0.3;

        // Player glow
        const pgrd = ctx.createRadialGradient(px, py, 0, px, py, cs * 1.2);
        pgrd.addColorStop(0, 'rgba(255,45,123,0.25)');
        pgrd.addColorStop(1, 'rgba(255,45,123,0)');
        ctx.fillStyle = pgrd;
        ctx.fillRect(px - cs * 1.2, py - cs * 1.2, cs * 2.4, cs * 2.4);

        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = '#ff2d7b';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px - pr * 0.2, py - pr * 0.2, pr * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fill();

        // End marker
        const ex = ox + this.end.col * cs + cs / 2;
        const ey = oy + this.end.row * cs + cs / 2;
        ctx.beginPath();
        ctx.arc(ex, ey, pr * 0.8, 0, Math.PI * 2);
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#00e676';
        ctx.font = `${cs * 0.5}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\u2605', ex, ey);
        ctx.textBaseline = 'alphabetic';

        // Timer display
        ctx.fillStyle = '#ffd60a';
        ctx.font = '16px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Time: ${this.elapsed.toFixed(1)}s`, w / 2, 20);

        // Controls hint
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.font = '11px Outfit, sans-serif';
        ctx.fillText('Arrow keys / Swipe to move', w / 2, h - 8);
    },

    endGame() {
        this.gameOver = true;
        cancelAnimationFrame(this.animFrame);
        // For maze, lower time is better. Store as inverted score for high score comparison.
        // We'll store the time as score. The UI can display it.
        this.score = Math.round(this.elapsed * 10) / 10;
        this.ui.setHighScore(this.score);
        const best = this.ui.getHighScore();
        this.ui.showGameOver(this.score, best);
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') {
            this.togglePause();
            return;
        }
        if (e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); this.movePlayer(-1, 0); }
        if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); this.movePlayer(1, 0); }
        if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); this.movePlayer(0, -1); }
        if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); this.movePlayer(0, 1); }
    },

    handleTouchStart(e) {
        e.preventDefault();
        this.touchStart = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    },

    handleTouchEnd(e) {
        e.preventDefault();
        if (!this.touchStart) return;
        const dx = e.changedTouches[0].clientX - this.touchStart.x;
        const dy = e.changedTouches[0].clientY - this.touchStart.y;
        const threshold = 20;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (Math.abs(dx) > threshold) {
                this.movePlayer(0, dx > 0 ? 1 : -1);
            }
        } else {
            if (Math.abs(dy) > threshold) {
                this.movePlayer(dy > 0 ? 1 : -1, 0);
            }
        }
        this.touchStart = null;
    },

    togglePause() {
        if (this.gameOver) return;
        this.paused = !this.paused;
        if (this.paused) {
            this.pauseStart = performance.now();
            this.ui.showPause();
        } else {
            // Adjust start time to account for pause duration
            this.startTime += performance.now() - this.pauseStart;
            this.ui.hidePause();
        }
    },

    pause() { if (!this.paused) this.togglePause(); },
    resume() { if (this.paused) this.togglePause(); },

    destroy() {
        cancelAnimationFrame(this.animFrame);
        document.removeEventListener('keydown', this.handleKey);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    }
};

export default Maze;
