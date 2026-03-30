const LightsOut = {
    canvas: null, ctx: null, ui: null,
    grid: null, size: 5, cellSize: 0, offsetX: 0, offsetY: 0,
    moves: 0, gameOver: false, paused: false, animFrame: null,
    pulses: null, winAnim: 0,

    // Animation state
    cellAnims: null, // per-cell animation: { scale, scaleTarget, scaleVel, glowIntensity }

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.handleClick = this.handleClick.bind(this);
        this.handleKey = this.handleKey.bind(this);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            this.handleClick({ clientX: t.clientX, clientY: t.clientY });
        }, { passive: false });
        document.addEventListener('keydown', this.handleKey);
    },

    start() {
        // Configure difficulty
        const level = this.ui.level || 'medium';
        if (level === 'easy') { this.size = 3; }
        else if (level === 'hard' || level === 'expert') { this.size = 7; }
        else { this.size = 5; }

        this.ui.hideGameOver(); this.ui.hidePause();
        this.newPuzzle();
        this.loop();
    },

    newPuzzle() {
        this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(false));
        this.pulses = Array.from({ length: this.size }, () => Array(this.size).fill(0));
        this.cellAnims = Array.from({ length: this.size }, () =>
            Array.from({ length: this.size }, () => ({
                scale: 1, scaleTarget: 1, scaleVel: 0,
                flash: 0, delayFrames: 0, glowPulse: 0
            }))
        );
        this.moves = 0; this.gameOver = false; this.winAnim = 0;
        this.ui.setScore('Moves: 0');

        // Generate solvable puzzle by performing random toggles from solved state
        const toggles = 8 + Math.floor(Math.random() * 8);
        for (let i = 0; i < toggles; i++) {
            const r = Math.floor(Math.random() * this.size);
            const c = Math.floor(Math.random() * this.size);
            this.toggleCell(r, c, false);
        }
        // Ensure at least some lights are on
        if (this.grid.every(row => row.every(v => !v))) {
            this.toggleCell(2, 2, false);
            this.toggleCell(1, 1, false);
        }

        const w = this.ui.canvasW, h = this.ui.canvasH;
        this.cellSize = Math.min((w - 20) / this.size, (h - 80) / this.size);
        this.offsetX = (w - this.cellSize * this.size) / 2;
        this.offsetY = (h - this.cellSize * this.size) / 2;
    },

    toggleCell(r, c, countMove) {
        const dirs = [[0,0],[-1,0],[1,0],[0,-1],[0,1]];
        for (let idx = 0; idx < dirs.length; idx++) {
            const [dr, dc] = dirs[idx];
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size) {
                this.grid[nr][nc] = !this.grid[nr][nc];
                if (countMove) {
                    this.pulses[nr][nc] = 1;
                    // Trigger scale-up animation with ripple delay
                    // Center cell (idx=0) fires immediately, neighbors delayed by 2 frames each
                    const anim = this.cellAnims[nr][nc];
                    anim.delayFrames = idx * 2;
                    anim.flash = 1;
                    anim.scaleTarget = 1.1;
                    anim.scaleVel = 0;
                }
            }
        }
        if (countMove) {
            this.moves++;
            this.ui.setScore(`Moves: ${this.moves}`);
        }
    },

    getCell(clientX, clientY) {
        const r = this.canvas.getBoundingClientRect();
        const mx = clientX - r.left, my = clientY - r.top;
        const col = Math.floor((mx - this.offsetX) / this.cellSize);
        const row = Math.floor((my - this.offsetY) / this.cellSize);
        if (col >= 0 && col < this.size && row >= 0 && row < this.size) return [row, col];
        return null;
    },

    handleClick(e) {
        if (this.paused) return;
        if (this.gameOver) { this.newPuzzle(); return; }
        const cell = this.getCell(e.clientX, e.clientY);
        if (!cell) return;
        this.toggleCell(cell[0], cell[1], true);

        if (this.grid.every(row => row.every(v => !v))) {
            this.gameOver = true;
            const best = this.ui.getHighScore() || Infinity;
            if (this.moves < best || best === 0) this.ui.setHighScore(this.moves);
            this.ui.showGameOver(this.moves + ' moves', 'Best: ' + (this.ui.getHighScore() || this.moves));
        }
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') {
            this.paused = !this.paused;
            if (this.paused) this.ui.showPause(); else this.ui.hidePause();
        }
    },

    loop() {
        this.updateAnims();
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    updateAnims() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const anim = this.cellAnims[r][c];

                // Handle ripple delay
                if (anim.delayFrames > 0) {
                    anim.delayFrames--;
                    continue;
                }

                // Scale animation: spring towards target then back to 1.0
                if (anim.scaleTarget > 1.0) {
                    // Animate to 1.1
                    anim.scale += (anim.scaleTarget - anim.scale) * 0.3;
                    if (anim.scale >= 1.09) {
                        anim.scaleTarget = 1.0; // start returning
                    }
                } else if (anim.scale > 1.001) {
                    // Ease back to 1.0
                    anim.scale += (1.0 - anim.scale) * 0.2;
                    if (anim.scale < 1.001) anim.scale = 1.0;
                }

                // Flash decay
                if (anim.flash > 0) {
                    anim.flash = Math.max(0, anim.flash - 0.08);
                }

                // Glow pulse for lit cells
                if (this.grid[r][c]) {
                    anim.glowPulse += 0.06;
                } else {
                    anim.glowPulse = 0;
                }
            }
        }
    },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        const cs = this.cellSize, ox = this.offsetX, oy = this.offsetY;
        const gap = 4;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        if (this.gameOver) this.winAnim += 0.03;

        // Title
        ctx.fillStyle = '#555'; ctx.font = '14px JetBrains Mono, monospace'; ctx.textAlign = 'center';
        ctx.fillText('Turn all lights OFF', w / 2, oy - 20);

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const x = ox + c * cs + gap / 2;
                const y = oy + r * cs + gap / 2;
                const s = cs - gap;

                // Pulse decay
                if (this.pulses[r][c] > 0) this.pulses[r][c] = Math.max(0, this.pulses[r][c] - 0.03);

                const anim = this.cellAnims[r][c];
                const scale = anim.scale;
                const flash = anim.flash;

                ctx.save();

                // Apply scale transform around cell center
                if (scale !== 1.0) {
                    const cx = x + s / 2;
                    const cy = y + s / 2;
                    ctx.translate(cx, cy);
                    ctx.scale(scale, scale);
                    ctx.translate(-cx, -cy);
                }

                if (this.grid[r][c]) {
                    const pulse = this.pulses[r][c];
                    const glowExtra = Math.sin(anim.glowPulse) * 0.4 + 0.4;
                    ctx.shadowColor = '#ffd60a';
                    ctx.shadowBlur = 10 + pulse * 15 + glowExtra * 8;

                    // Flash: briefly go brighter
                    const flashBoost = flash * 80;
                    ctx.fillStyle = `rgb(${Math.min(255, 255 + flash * 20)}, ${Math.min(255, Math.floor(214 + pulse * 40 + flashBoost))}, ${Math.min(255, Math.floor(10 + pulse * 80 + flashBoost))})`;
                } else {
                    if (this.gameOver) {
                        ctx.shadowColor = '#00e676';
                        ctx.shadowBlur = 6 + Math.sin(this.winAnim + r + c) * 4;
                        ctx.fillStyle = '#0a2a1a';
                    } else {
                        // Subtle flash on toggle-off
                        if (flash > 0) {
                            ctx.shadowColor = 'rgba(100,100,200,' + flash * 0.5 + ')';
                            ctx.shadowBlur = flash * 10;
                        }
                        ctx.fillStyle = flash > 0
                            ? `rgb(${Math.floor(17 + flash * 40)},${Math.floor(17 + flash * 40)},${Math.floor(34 + flash * 60)})`
                            : '#111122';
                    }
                }
                ctx.beginPath(); ctx.roundRect(x, y, s, s, 6); ctx.fill();

                // Inner glow for lit cells (enhanced with pulsing)
                if (this.grid[r][c]) {
                    const glowExtra = Math.sin(anim.glowPulse) * 0.08 + 0.08;
                    const grd = ctx.createRadialGradient(x + s/2, y + s/2, 0, x + s/2, y + s/2, s/2);
                    grd.addColorStop(0, `rgba(255, 255, 255, ${0.15 + glowExtra + flash * 0.3})`);
                    grd.addColorStop(1, 'rgba(255, 214, 10, 0)');
                    ctx.fillStyle = grd;
                    ctx.beginPath(); ctx.roundRect(x, y, s, s, 6); ctx.fill();
                }
                ctx.restore();
            }
        }

        // Lights remaining count
        const litCount = this.grid.flat().filter(v => v).length;
        ctx.fillStyle = '#888'; ctx.font = '14px JetBrains Mono, monospace'; ctx.textAlign = 'center';
        ctx.fillText(`Lights on: ${litCount}`, w / 2, oy + cs * this.size + 30);

        if (this.gameOver) {
            ctx.fillStyle = '#00e676'; ctx.font = 'bold 22px JetBrains Mono, monospace';
            ctx.fillText('Solved!', w / 2, oy + cs * this.size + 60);
            ctx.fillStyle = '#555'; ctx.font = '14px JetBrains Mono, monospace';
            ctx.fillText('Click for new puzzle', w / 2, oy + cs * this.size + 85);
        }
    },

    pause() { this.paused = true; this.ui.showPause(); },
    resume() { this.paused = false; this.ui.hidePause(); },
    reset() { cancelAnimationFrame(this.animFrame); },
    destroy() { cancelAnimationFrame(this.animFrame); document.removeEventListener('keydown', this.handleKey); }
};
export default LightsOut;
