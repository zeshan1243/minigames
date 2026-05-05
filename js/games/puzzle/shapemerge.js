// Shape Merge Puzzle - 2048-style game with geometric shapes
// Shapes merge: circle -> triangle -> square -> pentagon -> hexagon -> star -> diamond -> crown

const GRID_SIZE = 4;
const SHAPE_NAMES = ['circle', 'triangle', 'square', 'pentagon', 'hexagon', 'star', 'diamond', 'crown'];
const SHAPE_COLORS = {
    circle:   '#00d4ff', // cyan
    triangle: '#00e676', // green
    square:   '#ffd60a', // yellow
    pentagon: '#ff9100', // orange
    hexagon:  '#ff4081', // pink
    star:     '#b388ff', // purple
    diamond:  '#ffd700', // gold
    crown:    '#ffffff', // white with glow
};

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

const ShapeMerge = {
    canvas: null,
    ctx: null,
    ui: null,

    // Grid state: 0 = empty, 1-8 = shape level
    grid: null,
    score: 0,
    bestScore: 0,
    gameOver: false,
    paused: false,
    animFrameId: null,

    // Animation state
    animations: [],      // sliding tiles
    mergeAnims: [],      // merge pop effects
    spawnAnims: [],      // new tile fade-in
    particles: [],       // merge particles
    isAnimating: false,

    // Layout
    padding: 0,
    cellSize: 0,
    cellGap: 0,
    gridOffsetX: 0,
    gridOffsetY: 0,

    // Touch
    touchStartX: 0,
    touchStartY: 0,
    touchStartTime: 0,

    // Bound handlers
    _handleKey: null,
    _handleTouchStart: null,
    _handleTouchEnd: null,

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;

        this._handleKey = this.handleKey.bind(this);
        this._handleTouchStart = this.handleTouchStart.bind(this);
        this._handleTouchEnd = this.handleTouchEnd.bind(this);

        document.addEventListener('keydown', this._handleKey);
        canvas.addEventListener('touchstart', this._handleTouchStart, { passive: false });
        canvas.addEventListener('touchend', this._handleTouchEnd, { passive: false });
    },

    start() {
        this.score = 0;
        this.bestScore = this.ui.getHighScore() || 0;
        this.gameOver = false;
        this.paused = false;
        this.animations = [];
        this.mergeAnims = [];
        this.spawnAnims = [];
        this.particles = [];
        this.isAnimating = false;

        this.ui.hideGameOver();
        this.ui.hidePause();

        // Calculate layout
        this.calculateLayout();

        // Init empty grid
        this.grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));

        // Spawn 2 initial tiles
        this.spawnTile();
        this.spawnTile();

        this.ui.setScore(this.score);
        this.loop();
    },

    calculateLayout() {
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;
        const gridDim = Math.min(w - 40, h - 120, 500);
        this.cellGap = Math.round(gridDim * 0.03);
        this.cellSize = Math.floor((gridDim - this.cellGap * (GRID_SIZE + 1)) / GRID_SIZE);
        const totalGrid = this.cellSize * GRID_SIZE + this.cellGap * (GRID_SIZE + 1);
        this.gridOffsetX = Math.floor((w - totalGrid) / 2);
        this.gridOffsetY = Math.floor((h - totalGrid) / 2) + 30;
    },

    getCellCenter(row, col) {
        const x = this.gridOffsetX + this.cellGap * (col + 1) + this.cellSize * col + this.cellSize / 2;
        const y = this.gridOffsetY + this.cellGap * (row + 1) + this.cellSize * row + this.cellSize / 2;
        return { x, y };
    },

    spawnTile() {
        const empty = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (this.grid[r][c] === 0) empty.push({ r, c });
            }
        }
        if (empty.length === 0) return false;
        const cell = empty[Math.floor(Math.random() * empty.length)];
        // 90% circle (level 1), 10% triangle (level 2)
        this.grid[cell.r][cell.c] = Math.random() < 0.9 ? 1 : 2;
        this.spawnAnims.push({ r: cell.r, c: cell.c, t: 0, duration: 200 });
        return true;
    },

    move(direction) {
        if (this.gameOver || this.paused || this.isAnimating) return;

        const oldGrid = this.grid.map(row => [...row]);
        this.animations = [];
        this.mergeAnims = [];
        let moved = false;
        let mergeScore = 0;

        // Process based on direction
        const vectors = {
            up:    { dr: -1, dc: 0 },
            down:  { dr: 1, dc: 0 },
            left:  { dr: 0, dc: -1 },
            right: { dr: 0, dc: 1 },
        };
        const vec = vectors[direction];

        // Build traversal order
        const rows = [];
        const cols = [];
        for (let i = 0; i < GRID_SIZE; i++) {
            rows.push(i);
            cols.push(i);
        }
        if (vec.dr === 1) rows.reverse();
        if (vec.dc === 1) cols.reverse();

        const merged = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));

        for (const r of rows) {
            for (const c of cols) {
                if (this.grid[r][c] === 0) continue;

                let nr = r;
                let nc = c;

                // Slide as far as possible
                while (true) {
                    const nextr = nr + vec.dr;
                    const nextc = nc + vec.dc;
                    if (nextr < 0 || nextr >= GRID_SIZE || nextc < 0 || nextc >= GRID_SIZE) break;
                    if (this.grid[nextr][nextc] === 0) {
                        nr = nextr;
                        nc = nextc;
                    } else if (this.grid[nextr][nextc] === this.grid[r][c] && !merged[nextr][nextc] && this.grid[r][c] < SHAPE_NAMES.length) {
                        // Merge
                        nr = nextr;
                        nc = nextc;
                        break;
                    } else {
                        break;
                    }
                }

                if (nr !== r || nc !== c) {
                    moved = true;
                    const val = this.grid[r][c];

                    if (this.grid[nr][nc] === val && !merged[nr][nc] && val < SHAPE_NAMES.length) {
                        // Merge
                        const newVal = val + 1;
                        this.grid[nr][nc] = newVal;
                        this.grid[r][c] = 0;
                        merged[nr][nc] = true;
                        const pts = newVal * 10;
                        mergeScore += pts;

                        this.animations.push({
                            fromR: r, fromC: c, toR: nr, toC: nc,
                            val: val, t: 0, duration: 120, merge: true, newVal: newVal
                        });
                    } else {
                        // Slide only
                        this.grid[nr][nc] = this.grid[r][c];
                        this.grid[r][c] = 0;

                        this.animations.push({
                            fromR: r, fromC: c, toR: nr, toC: nc,
                            val: this.grid[nr][nc], t: 0, duration: 120, merge: false
                        });
                    }
                }
            }
        }

        if (moved) {
            this.score += mergeScore;
            this.ui.setScore(this.score);

            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                this.ui.setHighScore(this.bestScore);
            }

            this.isAnimating = true;
            this.animStartTime = performance.now();
        }
    },

    finishAnimations() {
        // Trigger merge animations
        for (const anim of this.animations) {
            if (anim.merge) {
                const center = this.getCellCenter(anim.toR, anim.toC);
                this.mergeAnims.push({
                    r: anim.toR, c: anim.toC, val: anim.newVal,
                    t: 0, duration: 250
                });
                // Spawn particles
                const color = SHAPE_COLORS[SHAPE_NAMES[anim.newVal - 1]] || '#fff';
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 * i) / 8;
                    this.particles.push({
                        x: center.x, y: center.y,
                        vx: Math.cos(angle) * (2 + Math.random() * 3),
                        vy: Math.sin(angle) * (2 + Math.random() * 3),
                        life: 1, decay: 0.02 + Math.random() * 0.02,
                        size: 3 + Math.random() * 3,
                        color: color
                    });
                }
            }
        }
        this.animations = [];
        this.isAnimating = false;

        // Spawn new tile
        this.spawnTile();

        // Check game over
        if (this.checkGameOver()) {
            this.gameOver = true;
            this.ui.showGameOver(this.score, this.bestScore);
        }
    },

    checkGameOver() {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (this.grid[r][c] === 0) return false;
                const val = this.grid[r][c];
                // Check neighbors
                if (r > 0 && this.grid[r - 1][c] === val) return false;
                if (r < GRID_SIZE - 1 && this.grid[r + 1][c] === val) return false;
                if (c > 0 && this.grid[r][c - 1] === val) return false;
                if (c < GRID_SIZE - 1 && this.grid[r][c + 1] === val) return false;
            }
        }
        return true;
    },

    // --- Input Handlers ---

    handleKey(e) {
        if (this.gameOver) return;

        const map = {
            ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
            w: 'up', s: 'down', a: 'left', d: 'right',
        };

        if (e.key === 'p' || e.key === 'P') {
            e.preventDefault();
            if (this.paused) this.resume();
            else this.pause();
            return;
        }

        const dir = map[e.key];
        if (dir) {
            e.preventDefault();
            this.move(dir);
        }
    },

    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.touchStartTime = performance.now();
        }
    },

    handleTouchEnd(e) {
        e.preventDefault();
        if (this.gameOver || this.paused || this.isAnimating) return;
        const dx = e.changedTouches[0].clientX - this.touchStartX;
        const dy = e.changedTouches[0].clientY - this.touchStartY;
        const elapsed = performance.now() - this.touchStartTime;

        if (elapsed > 1000) return; // too slow
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        const minSwipe = 30;

        if (Math.max(absDx, absDy) < minSwipe) return;

        if (absDx > absDy) {
            this.move(dx > 0 ? 'right' : 'left');
        } else {
            this.move(dy > 0 ? 'down' : 'up');
        }
    },

    // --- Rendering ---

    loop() {
        if (this.gameOver && this.particles.length === 0 && this.mergeAnims.length === 0 && this.spawnAnims.length === 0) {
            this.render();
            return;
        }

        const now = performance.now();
        this.update(now);
        this.render();
        this.animFrameId = requestAnimationFrame(() => this.loop());
    },

    update(now) {
        const dt = 16; // approximate

        // Update slide animations
        if (this.isAnimating) {
            let allDone = true;
            for (const anim of this.animations) {
                anim.t += dt;
                if (anim.t < anim.duration) allDone = false;
            }
            if (allDone && this.animations.length > 0) {
                this.finishAnimations();
            }
        }

        // Update merge anims
        for (let i = this.mergeAnims.length - 1; i >= 0; i--) {
            this.mergeAnims[i].t += dt;
            if (this.mergeAnims[i].t >= this.mergeAnims[i].duration) {
                this.mergeAnims.splice(i, 1);
            }
        }

        // Update spawn anims
        for (let i = this.spawnAnims.length - 1; i >= 0; i--) {
            this.spawnAnims[i].t += dt;
            if (this.spawnAnims[i].t >= this.spawnAnims[i].duration) {
                this.spawnAnims.splice(i, 1);
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.96;
            p.vy *= 0.96;
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    },

    render() {
        const ctx = this.ctx;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;

        // Clear
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Title
        ctx.fillStyle = '#e8e8f0';
        ctx.font = 'bold 22px "Outfit", "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Shape Merge', w / 2, this.gridOffsetY - 30);

        // Score display
        ctx.font = '14px "JetBrains Mono", monospace';
        ctx.fillStyle = '#8888a0';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${this.score}`, this.gridOffsetX, this.gridOffsetY - 8);
        ctx.textAlign = 'right';
        const totalGrid = this.cellSize * GRID_SIZE + this.cellGap * (GRID_SIZE + 1);
        ctx.fillText(`Best: ${this.bestScore}`, this.gridOffsetX + totalGrid, this.gridOffsetY - 8);

        // Grid background
        const gridW = this.cellSize * GRID_SIZE + this.cellGap * (GRID_SIZE + 1);
        const gridH = gridW;
        ctx.fillStyle = '#12121a';
        this.roundRect(ctx, this.gridOffsetX, this.gridOffsetY, gridW, gridH, 12);
        ctx.fill();

        // Empty cells
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cx = this.gridOffsetX + this.cellGap * (c + 1) + this.cellSize * c;
                const cy = this.gridOffsetY + this.cellGap * (r + 1) + this.cellSize * r;
                ctx.fillStyle = '#1a1a2e';
                this.roundRect(ctx, cx, cy, this.cellSize, this.cellSize, 8);
                ctx.fill();
            }
        }

        // Determine which cells are being animated (slide)
        const animatingCells = new Set();
        if (this.isAnimating) {
            for (const anim of this.animations) {
                animatingCells.add(`${anim.fromR},${anim.fromC}`);
                if (anim.merge) animatingCells.add(`${anim.toR},${anim.toC}`);
            }
        }

        // Determine spawning cells
        const spawningCells = new Set();
        for (const sa of this.spawnAnims) {
            spawningCells.add(`${sa.r},${sa.c}`);
        }

        // Draw static tiles
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (this.grid[r][c] === 0) continue;
                const key = `${r},${c}`;
                if (animatingCells.has(key)) continue;

                let scale = 1;
                let alpha = 1;

                // Check if spawning
                if (spawningCells.has(key)) {
                    const sa = this.spawnAnims.find(a => a.r === r && a.c === c);
                    if (sa) {
                        const progress = Math.min(sa.t / sa.duration, 1);
                        const ep = easeOutCubic(progress);
                        scale = ep * 1.0;
                        alpha = ep;
                    }
                }

                // Check if merge animating
                const ma = this.mergeAnims.find(a => a.r === r && a.c === c);
                if (ma) {
                    const progress = Math.min(ma.t / ma.duration, 1);
                    // Pop then settle: scale up to 1.3 then back to 1
                    if (progress < 0.4) {
                        scale = 1 + 0.3 * easeOutCubic(progress / 0.4);
                    } else {
                        scale = 1.3 - 0.3 * easeOutCubic((progress - 0.4) / 0.6);
                    }
                }

                const center = this.getCellCenter(r, c);
                this.drawShape(ctx, this.grid[r][c], center.x, center.y, this.cellSize * 0.38 * scale, alpha);
            }
        }

        // Draw sliding tiles
        if (this.isAnimating) {
            for (const anim of this.animations) {
                const progress = Math.min(anim.t / anim.duration, 1);
                const ep = easeOutCubic(progress);
                const from = this.getCellCenter(anim.fromR, anim.fromC);
                const to = this.getCellCenter(anim.toR, anim.toC);
                const x = lerp(from.x, to.x, ep);
                const y = lerp(from.y, to.y, ep);
                this.drawShape(ctx, anim.val, x, y, this.cellSize * 0.38, 1);
            }
        }

        // Draw particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Legend at bottom
        this.drawLegend(ctx, w, h);

        // Pause overlay
        if (this.paused && !this.gameOver) {
            ctx.fillStyle = 'rgba(10,10,15,0.7)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#e8e8f0';
            ctx.font = 'bold 28px "Outfit", "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', w / 2, h / 2 - 10);
            ctx.font = '14px "Outfit", "Segoe UI", sans-serif';
            ctx.fillStyle = '#8888a0';
            ctx.fillText('Press P to resume', w / 2, h / 2 + 20);
        }
    },

    drawLegend(ctx, w, h) {
        const legendY = this.gridOffsetY + this.cellSize * GRID_SIZE + this.cellGap * (GRID_SIZE + 1) + 24;
        const iconSize = 10;
        const spacing = Math.min(90, (w - 40) / SHAPE_NAMES.length);
        const startX = w / 2 - (SHAPE_NAMES.length * spacing) / 2 + spacing / 2;

        ctx.font = '9px "Outfit", "Segoe UI", sans-serif';
        ctx.textAlign = 'center';

        for (let i = 0; i < SHAPE_NAMES.length; i++) {
            const x = startX + i * spacing;
            this.drawShape(ctx, i + 1, x, legendY, iconSize, 1);
            ctx.fillStyle = '#8888a0';
            ctx.fillText(SHAPE_NAMES[i], x, legendY + 20);
            if (i < SHAPE_NAMES.length - 1) {
                ctx.fillStyle = '#555';
                ctx.fillText('\u2192', x + spacing / 2, legendY);
            }
        }
    },

    drawShape(ctx, level, x, y, radius, alpha) {
        if (level < 1 || level > SHAPE_NAMES.length) return;
        const name = SHAPE_NAMES[level - 1];
        const color = SHAPE_COLORS[name];

        ctx.save();
        ctx.globalAlpha = alpha;

        // Glow for crown
        if (name === 'crown') {
            ctx.shadowColor = 'rgba(255,255,255,0.6)';
            ctx.shadowBlur = 15;
        } else {
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
        }

        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        switch (name) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'triangle':
                ctx.beginPath();
                for (let i = 0; i < 3; i++) {
                    const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 3;
                    const px = x + Math.cos(angle) * radius;
                    const py = y + Math.sin(angle) * radius;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                break;

            case 'square':
                ctx.beginPath();
                const sr = radius * 0.85;
                ctx.rect(x - sr, y - sr, sr * 2, sr * 2);
                ctx.fill();
                break;

            case 'pentagon':
                this.drawRegularPolygon(ctx, x, y, radius, 5);
                ctx.fill();
                break;

            case 'hexagon':
                this.drawRegularPolygon(ctx, x, y, radius, 6);
                ctx.fill();
                break;

            case 'star':
                this.drawStar(ctx, x, y, radius, radius * 0.5, 5);
                ctx.fill();
                break;

            case 'diamond':
                ctx.beginPath();
                ctx.moveTo(x, y - radius);
                ctx.lineTo(x + radius * 0.7, y);
                ctx.lineTo(x, y + radius);
                ctx.lineTo(x - radius * 0.7, y);
                ctx.closePath();
                ctx.fill();
                break;

            case 'crown':
                this.drawCrown(ctx, x, y, radius);
                ctx.fill();
                break;
        }

        ctx.shadowBlur = 0;
        ctx.restore();
    },

    drawRegularPolygon(ctx, x, y, radius, sides) {
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = -Math.PI / 2 + (Math.PI * 2 * i) / sides;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
    },

    drawStar(ctx, x, y, outerR, innerR, points) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const angle = -Math.PI / 2 + (Math.PI * i) / points;
            const r = i % 2 === 0 ? outerR : innerR;
            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
    },

    drawCrown(ctx, x, y, radius) {
        const w = radius * 1.2;
        const h = radius;
        ctx.beginPath();
        // Base
        ctx.moveTo(x - w, y + h * 0.5);
        ctx.lineTo(x - w, y - h * 0.2);
        ctx.lineTo(x - w * 0.5, y + h * 0.15);
        ctx.lineTo(x, y - h * 0.7);
        ctx.lineTo(x + w * 0.5, y + h * 0.15);
        ctx.lineTo(x + w, y - h * 0.2);
        ctx.lineTo(x + w, y + h * 0.5);
        ctx.closePath();
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

    // --- Lifecycle ---

    pause() {
        this.paused = true;
        this.ui.showPause();
        this.render();
    },

    resume() {
        this.paused = false;
        this.ui.hidePause();
        if (!this.gameOver) this.loop();
    },

    reset() {
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        this.start();
    },

    destroy() {
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        document.removeEventListener('keydown', this._handleKey);
        if (this.canvas) {
            this.canvas.removeEventListener('touchstart', this._handleTouchStart);
            this.canvas.removeEventListener('touchend', this._handleTouchEnd);
        }
    }
};

export default ShapeMerge;
