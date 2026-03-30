const TowerOfHanoi = {
    canvas: null, ctx: null, ui: null,
    pegs: null, numDiscs: 5, moves: 0,
    gameOver: false, paused: false, animFrame: null,
    selectedPeg: -1, pegX: [], pegY: 0, pegH: 0,
    discH: 0, baseY: 0, winAnim: 0,
    hoverPeg: -1,

    // Animation state
    discAnim: null,  // { disc, fromPeg, toPeg, fromSlot, toSlot, frame, totalFrames, phase }
    inputBlocked: false,

    DISC_COLORS: ['#00d4ff', '#00e676', '#ffd60a', '#ff2d7b', '#a855f7'],

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.handleClick = this.handleClick.bind(this);
        this.handleMove = this.handleMove.bind(this);
        this.handleKey = this.handleKey.bind(this);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('mousemove', this.handleMove);
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
        if (level === 'easy') { this.numDiscs = 3; }
        else if (level === 'hard' || level === 'expert') { this.numDiscs = 7; }
        else { this.numDiscs = 5; }
        // Extend color palette if needed
        while (this.DISC_COLORS.length < this.numDiscs) {
            this.DISC_COLORS.push(`hsl(${this.DISC_COLORS.length * 47 % 360}, 70%, 55%)`);
        }

        this.ui.hideGameOver(); this.ui.hidePause();
        this.newGame();
        this.loop();
    },

    newGame() {
        this.pegs = [[], [], []];
        for (let i = this.numDiscs; i >= 1; i--) this.pegs[0].push(i);
        this.moves = 0; this.gameOver = false; this.selectedPeg = -1;
        this.winAnim = 0; this.hoverPeg = -1;
        this.discAnim = null; this.inputBlocked = false;
        this.ui.setScore('Moves: 0');

        const w = this.ui.canvasW, h = this.ui.canvasH;
        const spacing = w / 4;
        this.pegX = [spacing, spacing * 2, spacing * 3];
        this.baseY = h * 0.78;
        this.pegH = h * 0.45;
        this.discH = Math.min(this.pegH / (this.numDiscs + 1), 28);
    },

    // Easing function: ease in-out cubic
    easeInOut(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },

    // Get the Y position for a disc at a given slot index on any peg
    getDiscY(slotIndex) {
        return this.baseY - (slotIndex + 1) * this.discH;
    },

    // Start animating a disc move
    startDiscAnimation(fromPeg, toPeg, disc, fromSlot, toSlot) {
        this.discAnim = {
            disc,
            fromPeg,
            toPeg,
            fromSlot,
            toSlot,
            frame: 0,
            totalFrames: 30,
        };
        this.inputBlocked = true;
    },

    // Get animated disc position based on current frame
    getAnimDiscPos() {
        const a = this.discAnim;
        if (!a) return null;

        const t = this.easeInOut(a.frame / a.totalFrames);

        const startX = this.pegX[a.fromPeg];
        const endX = this.pegX[a.toPeg];
        const startY = this.getDiscY(a.fromSlot);
        const endY = this.getDiscY(a.toSlot);
        const liftY = this.baseY - this.pegH - 30; // Above the pegs

        // Three-phase arc: lift up, move horizontally, lower down
        // We'll use a single parametric curve:
        //   Phase 1 (t 0..0.3): lift from startY to liftY, stay at startX
        //   Phase 2 (t 0.3..0.7): move from startX to endX at liftY
        //   Phase 3 (t 0.7..1.0): lower from liftY to endY, stay at endX
        let x, y;
        if (t <= 0.3) {
            const p = t / 0.3;
            x = startX;
            y = startY + (liftY - startY) * p;
        } else if (t <= 0.7) {
            const p = (t - 0.3) / 0.4;
            x = startX + (endX - startX) * p;
            y = liftY;
        } else {
            const p = (t - 0.7) / 0.3;
            x = endX;
            y = liftY + (endY - liftY) * p;
        }

        return { x, y, disc: a.disc };
    },

    getPeg(clientX) {
        const r = this.canvas.getBoundingClientRect();
        const mx = clientX - r.left;
        const w = this.ui.canvasW;
        const spacing = w / 4;
        let closest = -1, minDist = Infinity;
        for (let i = 0; i < 3; i++) {
            const d = Math.abs(mx - this.pegX[i]);
            if (d < spacing * 0.7 && d < minDist) { closest = i; minDist = d; }
        }
        return closest;
    },

    handleClick(e) {
        if (this.paused || this.inputBlocked) return;
        if (this.gameOver) { this.newGame(); return; }
        const peg = this.getPeg(e.clientX);
        if (peg < 0) return;

        if (this.selectedPeg < 0) {
            if (this.pegs[peg].length > 0) this.selectedPeg = peg;
        } else {
            if (peg === this.selectedPeg) {
                this.selectedPeg = -1; return;
            }
            const fromTop = this.pegs[this.selectedPeg][this.pegs[this.selectedPeg].length - 1];
            const toTop = this.pegs[peg].length > 0 ? this.pegs[peg][this.pegs[peg].length - 1] : Infinity;
            if (fromTop < toTop) {
                // Valid move: start animation instead of instant move
                const disc = this.pegs[this.selectedPeg].pop();
                const fromSlot = this.pegs[this.selectedPeg].length; // slot it was at (0-indexed)
                const toSlot = this.pegs[peg].length; // slot it will land at
                const fromPeg = this.selectedPeg;

                this.startDiscAnimation(fromPeg, peg, disc, fromSlot, toSlot);

                // We'll push the disc onto the destination peg when animation completes
                this.discAnim.destPeg = peg;

                this.moves++;
                this.ui.setScore(`Moves: ${this.moves}`);
                this.selectedPeg = -1;
            } else {
                // Invalid move - try selecting this peg instead
                if (this.pegs[peg].length > 0) this.selectedPeg = peg;
                else this.selectedPeg = -1;
            }
        }
    },

    handleMove(e) {
        this.hoverPeg = this.getPeg(e.clientX);
    },

    handleKey(e) {
        if (this.inputBlocked) return;
        if (e.key === 'p' || e.key === 'P') {
            this.paused = !this.paused;
            if (this.paused) this.ui.showPause(); else this.ui.hidePause();
        }
        if (e.key === '1' || e.key === '2' || e.key === '3') {
            const peg = parseInt(e.key) - 1;
            this.handleClick({ clientX: this.canvas.getBoundingClientRect().left + this.pegX[peg] });
        }
    },

    loop() {
        // Update animation
        if (this.discAnim) {
            this.discAnim.frame++;
            if (this.discAnim.frame >= this.discAnim.totalFrames) {
                // Animation complete: place disc on destination peg
                this.pegs[this.discAnim.destPeg].push(this.discAnim.disc);
                this.inputBlocked = false;

                // Check win after disc is placed
                if (this.pegs[2].length === this.numDiscs) {
                    this.gameOver = true;
                    const best = this.ui.getHighScore() || Infinity;
                    if (this.moves < best || best === 0) this.ui.setHighScore(this.moves);
                    this.ui.showGameOver(this.moves + ' moves', 'Best: ' + (this.ui.getHighScore() || this.moves));
                }

                this.discAnim = null;
            }
        }

        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        if (this.gameOver) this.winAnim += 0.04;

        const maxDiscW = w * 0.2;
        const minDiscW = 30;

        // Base
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath(); ctx.roundRect(w * 0.08, this.baseY, w * 0.84, 8, 4); ctx.fill();

        // Draw each peg
        for (let p = 0; p < 3; p++) {
            const px = this.pegX[p];
            const isSelected = p === this.selectedPeg;
            const isHover = p === this.hoverPeg && !this.gameOver;

            // Peg rod
            ctx.fillStyle = isSelected ? '#00d4ff' : '#222';
            ctx.beginPath();
            ctx.roundRect(px - 3, this.baseY - this.pegH, 6, this.pegH, 3);
            ctx.fill();

            // Selection indicator
            if (isSelected) {
                ctx.save();
                ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 12;
                ctx.fillStyle = '#00d4ff';
                ctx.beginPath(); ctx.arc(px, this.baseY - this.pegH - 15, 6, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }

            // Hover glow
            if (isHover && !isSelected) {
                ctx.fillStyle = 'rgba(0, 212, 255, 0.03)';
                ctx.beginPath(); ctx.arc(px, this.baseY - this.pegH / 2, maxDiscW * 0.7, 0, Math.PI * 2); ctx.fill();
            }

            // Discs (skip the animating disc)
            for (let d = 0; d < this.pegs[p].length; d++) {
                const disc = this.pegs[p][d];
                this.drawDisc(ctx, px, d, disc, maxDiscW, minDiscW, p, this.pegs[p].length);
            }

            // Peg label
            ctx.fillStyle = '#444'; ctx.font = '13px JetBrains Mono, monospace'; ctx.textAlign = 'center';
            ctx.fillText(`${p + 1}`, px, this.baseY + 25);
        }

        // Draw animating disc on top of everything
        if (this.discAnim) {
            const pos = this.getAnimDiscPos();
            if (pos) {
                const disc = pos.disc;
                const discW = minDiscW + (maxDiscW - minDiscW) * (disc / this.numDiscs);
                const color = this.DISC_COLORS[(disc - 1) % this.DISC_COLORS.length];

                ctx.save();
                ctx.shadowColor = color;
                ctx.shadowBlur = 14;

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.roundRect(pos.x - discW / 2, pos.y, discW, this.discH - 3, 5);
                ctx.fill();

                // Shine
                const grad = ctx.createLinearGradient(pos.x - discW / 2, pos.y, pos.x - discW / 2, pos.y + this.discH - 3);
                grad.addColorStop(0, 'rgba(255,255,255,0.2)');
                grad.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.roundRect(pos.x - discW / 2, pos.y, discW, this.discH - 3, 5);
                ctx.fill();
                ctx.restore();
            }
        }

        // Instructions
        ctx.fillStyle = '#555'; ctx.font = '13px JetBrains Mono, monospace'; ctx.textAlign = 'center';
        if (this.inputBlocked) {
            // Show nothing during animation
        } else if (this.selectedPeg >= 0) {
            ctx.fillText('Select destination peg', w / 2, 30);
        } else if (!this.gameOver) {
            ctx.fillText('Select a peg to pick up top disc', w / 2, 30);
        }

        // Optimal moves hint
        const optimal = Math.pow(2, this.numDiscs) - 1;
        ctx.fillStyle = '#333'; ctx.font = '12px JetBrains Mono, monospace';
        ctx.fillText(`Optimal: ${optimal} moves`, w / 2, h - 15);

        if (this.gameOver) {
            ctx.fillStyle = '#00e676'; ctx.font = 'bold 22px JetBrains Mono, monospace';
            ctx.fillText('Solved!', w / 2, 65);
            ctx.fillStyle = '#555'; ctx.font = '14px JetBrains Mono, monospace';
            ctx.fillText('Click to play again', w / 2, 90);
        }
    },

    // Helper to draw a single disc at a peg position
    drawDisc(ctx, px, slotIndex, disc, maxDiscW, minDiscW, pegIndex, pegLength) {
        const discW = minDiscW + (maxDiscW - minDiscW) * (disc / this.numDiscs);
        const dy = this.baseY - (slotIndex + 1) * this.discH;
        const color = this.DISC_COLORS[(disc - 1) % this.DISC_COLORS.length];

        ctx.save();
        if (this.gameOver && pegIndex === 2) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 6 + Math.sin(this.winAnim + slotIndex * 0.5) * 4;
        }
        if (pegIndex === this.selectedPeg && slotIndex === pegLength - 1) {
            ctx.shadowColor = color; ctx.shadowBlur = 10;
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(px - discW / 2, dy, discW, this.discH - 3, 5);
        ctx.fill();

        // Shine
        const grad = ctx.createLinearGradient(px - discW / 2, dy, px - discW / 2, dy + this.discH - 3);
        grad.addColorStop(0, 'rgba(255,255,255,0.15)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(px - discW / 2, dy, discW, this.discH - 3, 5);
        ctx.fill();
        ctx.restore();
    },

    pause() { this.paused = true; this.ui.showPause(); },
    resume() { this.paused = false; this.ui.hidePause(); },
    reset() { cancelAnimationFrame(this.animFrame); this.discAnim = null; this.inputBlocked = false; },
    destroy() { cancelAnimationFrame(this.animFrame); document.removeEventListener('keydown', this.handleKey); }
};
export default TowerOfHanoi;
