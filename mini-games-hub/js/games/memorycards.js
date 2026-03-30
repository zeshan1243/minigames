const MemoryCards = {
    canvas: null,
    ctx: null,
    ui: null,
    score: 0,
    gameOver: false,
    paused: false,
    animFrame: null,
    cards: [],
    gridCols: 4,
    gridRows: 4,
    cardW: 0,
    cardH: 0,
    gap: 8,
    offsetX: 0,
    offsetY: 0,
    flipped: [],
    matched: [],
    moves: 0,
    canFlip: true,
    symbols: ['🌟', '🔥', '💎', '🎯', '⚡', '🎵', '🍀', '💜'],
    board: [],
    flipAnims: {},
    matchFlash: 0,
    peekTimer: 0,
    peeking: true,

    // Animation state
    matchPulseAnims: {},   // { cardIndex: { frame:0, maxFrames:20 } } - glow pulse on match
    mismatchFlashAnims: {}, // { cardIndex: { frame:0, maxFrames:12 } } - red flash on mismatch

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
        this.reset();
        this.gameOver = false;
        this.paused = false;
        this.ui.hideGameOver();
        this.ui.hidePause();
        this.loop();
    },

    reset() {
        cancelAnimationFrame(this.animFrame);
        this.moves = 0;
        this.score = 0;
        this.flipped = [];
        this.matched = [];
        this.canFlip = true;
        this.flipAnims = {};
        this.matchFlash = 0;
        this.matchPulseAnims = {};
        this.mismatchFlashAnims = {};
        this.peeking = true;
        this.peekTimer = 120; // ~2 seconds at 60fps
        this.ui.setScore('0 moves');

        const w = this.ui.canvasW;
        const h = this.ui.canvasH;

        // Calculate card sizes
        const totalCards = this.gridCols * this.gridRows;
        this.cardW = Math.floor((w - 30 - (this.gridCols - 1) * this.gap) / this.gridCols);
        this.cardH = Math.floor((h - 80 - (this.gridRows - 1) * this.gap) / this.gridRows);
        this.cardW = Math.min(this.cardW, this.cardH * 0.75);
        this.cardH = this.cardW / 0.75;
        this.offsetX = Math.floor((w - (this.gridCols * this.cardW + (this.gridCols - 1) * this.gap)) / 2);
        this.offsetY = Math.floor((h - 30 - (this.gridRows * this.cardH + (this.gridRows - 1) * this.gap)) / 2) + 30;

        // Create pairs
        const pairs = this.symbols.slice(0, totalCards / 2);
        const deck = [...pairs, ...pairs];

        // Shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        this.board = [];
        let idx = 0;
        for (let r = 0; r < this.gridRows; r++) {
            for (let c = 0; c < this.gridCols; c++) {
                this.board.push({
                    r, c,
                    symbol: deck[idx],
                    id: idx
                });
                idx++;
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
        // Peek countdown
        if (this.peeking) {
            this.peekTimer--;
            if (this.peekTimer <= 0) {
                this.peeking = false;
            }
        }

        // Flip animations
        for (const id in this.flipAnims) {
            const anim = this.flipAnims[id];
            if (anim.opening) {
                anim.progress = Math.min(1, anim.progress + 0.067); // ~15 frames
            } else {
                anim.progress = Math.max(0, anim.progress - 0.067);
                if (anim.progress <= 0) delete this.flipAnims[id];
            }
        }

        if (this.matchFlash > 0) this.matchFlash -= 0.04;

        // Match pulse animations
        for (const id in this.matchPulseAnims) {
            const a = this.matchPulseAnims[id];
            a.frame++;
            if (a.frame >= a.maxFrames) delete this.matchPulseAnims[id];
        }

        // Mismatch flash animations
        for (const id in this.mismatchFlashAnims) {
            const a = this.mismatchFlashAnims[id];
            a.frame++;
            if (a.frame >= a.maxFrames) delete this.mismatchFlashAnims[id];
        }
    },

    flipCard(cardIdx) {
        if (this.gameOver || this.paused || !this.canFlip || this.peeking) return;
        if (this.flipped.includes(cardIdx) || this.matched.includes(cardIdx)) return;

        this.flipped.push(cardIdx);
        this.flipAnims[cardIdx] = { progress: 0, opening: true };

        if (this.flipped.length === 2) {
            this.moves++;
            this.ui.setScore(`${this.moves} moves`);
            this.canFlip = false;

            const [a, b] = this.flipped;
            if (this.board[a].symbol === this.board[b].symbol) {
                // Match!
                this.matched.push(a, b);
                this.matchFlash = 1;
                // Trigger match pulse animation
                this.matchPulseAnims[a] = { frame: 0, maxFrames: 25 };
                this.matchPulseAnims[b] = { frame: 0, maxFrames: 25 };
                this.flipped = [];
                this.canFlip = true;

                // Check win
                if (this.matched.length === this.board.length) {
                    this.score = this.moves;
                    setTimeout(() => this.endGame(), 600);
                }
            } else {
                // No match - trigger mismatch flash, then flip back after delay
                this.mismatchFlashAnims[a] = { frame: 0, maxFrames: 12 };
                this.mismatchFlashAnims[b] = { frame: 0, maxFrames: 12 };
                setTimeout(() => {
                    if (this.flipAnims[a]) this.flipAnims[a].opening = false;
                    if (this.flipAnims[b]) this.flipAnims[b].opening = false;
                    this.flipped = [];
                    this.canFlip = true;
                }, 800);
            }
        }
    },

    getCardBounds(card) {
        return {
            x: this.offsetX + card.c * (this.cardW + this.gap),
            y: this.offsetY + card.r * (this.cardH + this.gap),
            w: this.cardW,
            h: this.cardH
        };
    },

    render() {
        const ctx = this.ctx;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Match flash
        if (this.matchFlash > 0) {
            ctx.fillStyle = `rgba(0,230,118,${this.matchFlash * 0.08})`;
            ctx.fillRect(0, 0, w, h);
        }

        // Cards
        for (let i = 0; i < this.board.length; i++) {
            const card = this.board[i];
            const bounds = this.getCardBounds(card);
            const isFlipped = this.flipped.includes(i) || this.matched.includes(i) || this.peeking;
            const isMatched = this.matched.includes(i);
            const anim = this.flipAnims[i];
            const flipProgress = anim ? anim.progress : (isMatched || this.peeking ? 1 : 0);

            ctx.save();
            const cx = bounds.x + bounds.w / 2;
            const cy = bounds.y + bounds.h / 2;

            // Smooth flip: scaleX goes 1 -> 0 -> 1 as flipProgress goes 0 -> 0.5 -> 1
            const scaleX = Math.abs(Math.cos(flipProgress * Math.PI));
            const showFace = flipProgress > 0.5 || isMatched || this.peeking;

            // Match pulse animation: scale bounce
            let pulseScale = 1;
            const pulseAnim = this.matchPulseAnims[i];
            if (pulseAnim) {
                const t = pulseAnim.frame / pulseAnim.maxFrames;
                pulseScale = 1 + 0.08 * Math.sin(t * Math.PI) * (1 - t);
            }

            // Mismatch red flash amount
            let mismatchAlpha = 0;
            const mmAnim = this.mismatchFlashAnims[i];
            if (mmAnim) {
                const t = mmAnim.frame / mmAnim.maxFrames;
                mismatchAlpha = Math.sin(t * Math.PI) * 0.5;
            }

            ctx.translate(cx, cy);
            ctx.scale(Math.max(0.01, scaleX) * pulseScale, pulseScale);
            ctx.translate(-cx, -cy);

            if (showFace && (isFlipped || this.peeking)) {
                // Card face
                const faceColor = isMatched ? '#0d2a1a' : '#12122a';
                ctx.beginPath();
                ctx.roundRect(bounds.x, bounds.y, bounds.w, bounds.h, 8);
                ctx.fillStyle = faceColor;
                ctx.fill();
                ctx.strokeStyle = isMatched ? '#00e676' : '#00d4ff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Symbol
                ctx.font = `${Math.min(bounds.w, bounds.h) * 0.45}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(card.symbol, cx, cy);
                ctx.textBaseline = 'alphabetic';

                // Match glow (persistent on matched cards)
                if (isMatched) {
                    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, bounds.w * 0.6);
                    grd.addColorStop(0, 'rgba(0,230,118,0.15)');
                    grd.addColorStop(1, 'rgba(0,230,118,0)');
                    ctx.fillStyle = grd;
                    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
                }

                // Match pulse glow overlay
                if (pulseAnim) {
                    const t = pulseAnim.frame / pulseAnim.maxFrames;
                    const alpha = (1 - t) * 0.35;
                    ctx.save();
                    ctx.shadowBlur = 20 * (1 - t);
                    ctx.shadowColor = '#00e676';
                    ctx.beginPath();
                    ctx.roundRect(bounds.x, bounds.y, bounds.w, bounds.h, 8);
                    ctx.strokeStyle = `rgba(0,230,118,${alpha})`;
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    ctx.restore();
                }

                // Mismatch red flash overlay
                if (mismatchAlpha > 0) {
                    ctx.fillStyle = `rgba(255,45,123,${mismatchAlpha})`;
                    ctx.beginPath();
                    ctx.roundRect(bounds.x, bounds.y, bounds.w, bounds.h, 8);
                    ctx.fill();
                }
            } else {
                // Card back
                ctx.beginPath();
                ctx.roundRect(bounds.x, bounds.y, bounds.w, bounds.h, 8);
                ctx.fillStyle = '#1a1a2e';
                ctx.fill();
                ctx.strokeStyle = 'rgba(0,212,255,0.3)';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Back pattern
                ctx.strokeStyle = 'rgba(0,212,255,0.1)';
                ctx.lineWidth = 1;
                const padding = 8;
                ctx.beginPath();
                ctx.roundRect(bounds.x + padding, bounds.y + padding, bounds.w - padding * 2, bounds.h - padding * 2, 4);
                ctx.stroke();

                // Diamond pattern
                ctx.fillStyle = 'rgba(0,212,255,0.08)';
                ctx.beginPath();
                ctx.moveTo(cx, bounds.y + padding + 4);
                ctx.lineTo(bounds.x + bounds.w - padding - 4, cy);
                ctx.lineTo(cx, bounds.y + bounds.h - padding - 4);
                ctx.lineTo(bounds.x + padding + 4, cy);
                ctx.closePath();
                ctx.fill();

                // Center dot
                ctx.beginPath();
                ctx.arc(cx, cy, 3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0,212,255,0.2)';
                ctx.fill();

                // Mismatch red flash on card back (during flip-back)
                if (mismatchAlpha > 0) {
                    ctx.fillStyle = `rgba(255,45,123,${mismatchAlpha})`;
                    ctx.beginPath();
                    ctx.roundRect(bounds.x, bounds.y, bounds.w, bounds.h, 8);
                    ctx.fill();
                }
            }

            ctx.restore();
        }

        // HUD
        ctx.fillStyle = '#ffd60a';
        ctx.font = 'bold 16px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Moves: ${this.moves}`, w / 2, 22);

        // Pairs found
        const pairsFound = this.matched.length / 2;
        const totalPairs = this.board.length / 2;
        ctx.fillStyle = '#00e676';
        ctx.font = '13px Outfit, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${pairsFound}/${totalPairs} pairs`, w - 15, 22);

        // Peek indicator
        if (this.peeking) {
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '14px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Memorize the cards...', w / 2, h - 12);
        }
    },

    endGame() {
        this.gameOver = true;
        cancelAnimationFrame(this.animFrame);
        // Lower moves = better. Store moves as score.
        this.ui.setHighScore(this.moves);
        const best = this.ui.getHighScore();
        this.ui.showGameOver(this.moves, best);
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') {
            this.togglePause();
            return;
        }
    },

    handleClick(e) {
        if (this.gameOver || this.paused || this.peeking) return;
        const rect = this.canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (this.ui.canvasW / rect.width);
        const my = (e.clientY - rect.top) * (this.ui.canvasH / rect.height);
        this.checkCardClick(mx, my);
    },

    handleTouch(e) {
        e.preventDefault();
        if (this.gameOver || this.paused || this.peeking) return;
        const rect = this.canvas.getBoundingClientRect();
        const tx = (e.touches[0].clientX - rect.left) * (this.ui.canvasW / rect.width);
        const ty = (e.touches[0].clientY - rect.top) * (this.ui.canvasH / rect.height);
        this.checkCardClick(tx, ty);
    },

    checkCardClick(mx, my) {
        for (let i = 0; i < this.board.length; i++) {
            const bounds = this.getCardBounds(this.board[i]);
            if (mx >= bounds.x && mx <= bounds.x + bounds.w && my >= bounds.y && my <= bounds.y + bounds.h) {
                this.flipCard(i);
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

export default MemoryCards;
