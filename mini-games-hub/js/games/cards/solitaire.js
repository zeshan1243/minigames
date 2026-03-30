const Solitaire = {
    canvas: null,
    ctx: null,
    ui: null,

    // Layout constants
    CARD_W: 60,
    CARD_H: 84,
    CARD_R: 6,
    GAP: 12,
    TOP_Y: 12,
    TAB_Y: 0, // computed in init

    // Suits & colors
    SUITS: ['♠', '♥', '♦', '♣'],
    SUIT_COLORS: { '♠': '#111111', '♥': '#cc0000', '♦': '#cc0000', '♣': '#111111' },
    RANKS: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],

    // Game state
    deck: [],
    stock: [],
    waste: [],
    foundations: [[], [], [], []],
    tableau: [[], [], [], [], [], [], []],
    score: 0,
    gameOver: false,
    paused: false,
    won: false,
    animFrame: null,
    moveHistory: [],

    // Drag state
    dragging: null,       // { cards: [], sourceType, sourceIdx, startX, startY, offsetX, offsetY }
    dragX: 0,
    dragY: 0,

    // Animations
    animations: [],       // { card, fromX, fromY, toX, toY, startTime, duration, onDone, flip }
    particles: [],
    dealAnimating: false,
    autoCompleting: false,

    // Double-click detection
    lastClickTime: 0,
    lastClickCard: null,

    // Computed positions (set in init)
    stockPos: null,
    wastePos: null,
    foundationPos: [],
    tableauPos: [],

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;

        const W = ui.canvasW;
        // Compute layout positions
        const startX = this.GAP;
        this.stockPos = { x: startX, y: this.TOP_Y };
        this.wastePos = { x: startX + this.CARD_W + this.GAP, y: this.TOP_Y };

        this.foundationPos = [];
        for (let i = 0; i < 4; i++) {
            this.foundationPos.push({
                x: W - (4 - i) * (this.CARD_W + this.GAP),
                y: this.TOP_Y
            });
        }

        this.TAB_Y = this.TOP_Y + this.CARD_H + 20;
        this.tableauPos = [];
        const tabGap = (W - 7 * this.CARD_W) / 8;
        for (let i = 0; i < 7; i++) {
            this.tableauPos.push({
                x: tabGap + i * (this.CARD_W + tabGap),
                y: this.TAB_Y
            });
        }

        // Bind event handlers
        this._onClick = this._handleClick.bind(this);
        this._onMouseDown = this._handleMouseDown.bind(this);
        this._onMouseMove = this._handleMouseMove.bind(this);
        this._onMouseUp = this._handleMouseUp.bind(this);
        this._onTouchStart = this._handleTouchStart.bind(this);
        this._onTouchMove = this._handleTouchMove.bind(this);
        this._onTouchEnd = this._handleTouchEnd.bind(this);
        this._onDblClick = this._handleDblClick.bind(this);
        this._onKey = this._handleKey.bind(this);

        canvas.addEventListener('mousedown', this._onMouseDown);
        canvas.addEventListener('mousemove', this._onMouseMove);
        canvas.addEventListener('mouseup', this._onMouseUp);
        canvas.addEventListener('dblclick', this._onDblClick);
        canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
        canvas.addEventListener('touchend', this._onTouchEnd, { passive: false });
        document.addEventListener('keydown', this._onKey);
    },

    start() {
        this.reset();
        this._deal();
    },

    pause() {
        this.paused = true;
        this.ui.showPause();
    },

    resume() {
        this.paused = false;
        this.ui.hidePause();
        if (!this.animFrame) this._loop();
    },

    reset() {
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.paused = false;
        this.dragging = null;
        this.animations = [];
        this.particles = [];
        this.dealAnimating = false;
        this.autoCompleting = false;
        this.moveHistory = [];
        this.stock = [];
        this.waste = [];
        this.foundations = [[], [], [], []];
        this.tableau = [[], [], [], [], [], [], []];
        this.ui.hideGameOver();
        this.ui.hidePause();
        this.ui.setScore(0);
        if (this.animFrame) {
            cancelAnimationFrame(this.animFrame);
            this.animFrame = null;
        }
    },

    destroy() {
        if (this.animFrame) {
            cancelAnimationFrame(this.animFrame);
            this.animFrame = null;
        }
        this.canvas.removeEventListener('mousedown', this._onMouseDown);
        this.canvas.removeEventListener('mousemove', this._onMouseMove);
        this.canvas.removeEventListener('mouseup', this._onMouseUp);
        this.canvas.removeEventListener('dblclick', this._onDblClick);
        this.canvas.removeEventListener('touchstart', this._onTouchStart);
        this.canvas.removeEventListener('touchmove', this._onTouchMove);
        this.canvas.removeEventListener('touchend', this._onTouchEnd);
        document.removeEventListener('keydown', this._onKey);
    },

    // ── Card Creation & Deck ──

    _createDeck() {
        const deck = [];
        for (const suit of this.SUITS) {
            for (let r = 0; r < 13; r++) {
                deck.push({
                    suit,
                    rank: r,          // 0=A, 1=2, ..., 12=K
                    label: this.RANKS[r],
                    faceUp: false,
                    animFlip: 0,      // 0=no flip, 0..1 animating
                    animX: null,
                    animY: null
                });
            }
        }
        return deck;
    },

    _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    _isRed(card) {
        return card.suit === '♥' || card.suit === '♦';
    },

    // ── Deal ──

    _deal() {
        const deck = this._shuffle(this._createDeck());
        this.dealAnimating = true;
        let idx = 0;
        const dealCards = [];

        // Place cards into tableau
        for (let col = 0; col < 7; col++) {
            for (let row = 0; row <= col; row++) {
                const card = deck[idx++];
                card.faceUp = (row === col);
                this.tableau[col].push(card);
                dealCards.push({ card, col, row });
            }
        }

        // Remaining go to stock
        while (idx < deck.length) {
            deck[idx].faceUp = false;
            this.stock.push(deck[idx++]);
        }

        // Animate deal
        const totalDelay = 600;
        const perCard = totalDelay / dealCards.length;
        let animsDone = 0;
        const totalAnims = dealCards.length;

        dealCards.forEach((dc, i) => {
            const targetPos = this._getTableauCardPos(dc.col, dc.row);
            this.animations.push({
                card: dc.card,
                fromX: this.stockPos.x,
                fromY: this.stockPos.y,
                toX: targetPos.x,
                toY: targetPos.y,
                startTime: performance.now() + i * perCard,
                duration: 200,
                flip: dc.card.faceUp,
                onDone: () => {
                    animsDone++;
                    if (animsDone >= totalAnims) {
                        this.dealAnimating = false;
                    }
                }
            });
        });

        this._loop();
    },

    _getTableauCardPos(col, row) {
        const overlap = 18;
        const faceDownOverlap = 8;
        const pile = this.tableau[col];
        let y = this.tableauPos[col].y;
        for (let i = 0; i < row; i++) {
            y += pile[i] && pile[i].faceUp ? overlap : faceDownOverlap;
        }
        return { x: this.tableauPos[col].x, y };
    },

    // ── Game Loop ──

    _loop() {
        const done = this.gameOver && this.animations.length === 0 && this.particles.length === 0;
        if (done) { this.animFrame = null; return; }
        this.animFrame = requestAnimationFrame((t) => {
            if (!this.paused) {
                this._update(t);
            }
            this._render(t);
            this._loop();
        });
    },

    _update(time) {
        // Update animations
        this.animations = this.animations.filter(a => {
            const elapsed = time - a.startTime;
            if (elapsed < 0) return true; // not started yet
            const t = Math.min(elapsed / a.duration, 1);
            const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
            a.card.animX = a.fromX + (a.toX - a.fromX) * ease;
            a.card.animY = a.fromY + (a.toY - a.fromY) * ease;

            if (a.flip) {
                // Flip animation: scale X goes 1->0->1, card flips at midpoint
                if (t < 0.5) {
                    a.card.animFlip = 1 - t * 2; // 1 -> 0
                } else {
                    a.card.faceUp = true;
                    a.card.animFlip = (t - 0.5) * 2; // 0 -> 1
                }
            }

            if (t >= 1) {
                a.card.animX = null;
                a.card.animY = null;
                a.card.animFlip = 0;
                if (a.onDone) a.onDone();
                return false;
            }
            return true;
        });

        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.life -= 1;
            return p.life > 0;
        });

        // Auto-complete check
        if (!this.autoCompleting && !this.dealAnimating && !this.won && this._canAutoComplete()) {
            this._autoComplete();
        }
    },

    // ── Auto-complete ──

    _canAutoComplete() {
        // All stock/waste exhausted and all tableau cards face up
        if (this.stock.length > 0 || this.waste.length > 0) return false;
        for (const col of this.tableau) {
            for (const card of col) {
                if (!card.faceUp) return false;
            }
        }
        return true;
    },

    _autoComplete() {
        this.autoCompleting = true;
        this._autoCompleteStep();
    },

    _autoCompleteStep() {
        if (this.won) return;

        // Find a card that can go to foundation
        for (let c = 0; c < 7; c++) {
            const col = this.tableau[c];
            if (col.length === 0) continue;
            const card = col[col.length - 1];
            const fi = this._findFoundationTarget(card);
            if (fi >= 0) {
                col.pop();
                const fromPos = this._getTableauCardPos(c, col.length);
                this.foundations[fi].push(card);
                this._addScore(10);

                const toPos = this.foundationPos[fi];
                this.animations.push({
                    card,
                    fromX: fromPos.x,
                    fromY: fromPos.y,
                    toX: toPos.x,
                    toY: toPos.y,
                    startTime: performance.now(),
                    duration: 150,
                    onDone: () => {
                        this._checkWin();
                        if (!this.won) {
                            setTimeout(() => this._autoCompleteStep(), 30);
                        }
                    }
                });
                return;
            }
        }
        // Nothing moved, stop
        this.autoCompleting = false;
    },

    _findFoundationTarget(card) {
        for (let fi = 0; fi < 4; fi++) {
            const pile = this.foundations[fi];
            if (pile.length === 0 && card.rank === 0) {
                // Check if this foundation is free or matches suit
                // Assign foundation to suit on first card
                return fi;
            }
            if (pile.length > 0) {
                const top = pile[pile.length - 1];
                if (top.suit === card.suit && card.rank === top.rank + 1) {
                    return fi;
                }
            }
        }
        return -1;
    },

    _checkWin() {
        const total = this.foundations.reduce((s, f) => s + f.length, 0);
        if (total === 52) {
            this.won = true;
            this.gameOver = true;
            this._spawnVictoryParticles();
            const best = this.ui.getHighScore();
            if (this.score > best) {
                this.ui.setHighScore(this.score);
            }
            setTimeout(() => {
                this.ui.showGameOver(this.score, Math.max(this.score, best));
            }, 2000);
        }
    },

    _spawnVictoryParticles() {
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        const colors = ['#00d4ff', '#ff2d7b', '#ffd60a', '#00e676', '#e8e8f0'];
        for (let i = 0; i < 150; i++) {
            this.particles.push({
                x: W / 2 + (Math.random() - 0.5) * 200,
                y: H / 2,
                vx: (Math.random() - 0.5) * 12,
                vy: -Math.random() * 10 - 2,
                life: 60 + Math.random() * 60,
                maxLife: 120,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 3 + Math.random() * 4
            });
        }
    },

    // ── Score ──

    _addScore(pts) {
        this.score += pts;
        this.ui.setScore(this.score);
    },

    // ── Rendering ──

    _render(time) {
        const ctx = this.ctx;
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Draw subtle felt texture
        ctx.fillStyle = 'rgba(20, 80, 40, 0.06)';
        ctx.fillRect(0, 0, W, H);

        // Stock pile
        this._renderStockPile(ctx);

        // Waste pile
        this._renderWastePile(ctx);

        // Foundation piles
        this._renderFoundations(ctx);

        // Tableau
        this._renderTableau(ctx);

        // Drag layer
        if (this.dragging) {
            this._renderDragCards(ctx);
        }

        // Particles
        this._renderParticles(ctx);
    },

    _renderStockPile(ctx) {
        const pos = this.stockPos;
        if (this.stock.length > 0) {
            // Draw back of top stock card
            this._drawCardBack(ctx, pos.x, pos.y);
            // Small count indicator
            ctx.fillStyle = '#8888a0';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.stock.length.toString(), pos.x + this.CARD_W / 2, pos.y + this.CARD_H + 12);
        } else {
            // Empty stock - draw recycle indicator
            this._drawEmptySlot(ctx, pos.x, pos.y, '↻');
        }
    },

    _renderWastePile(ctx) {
        const pos = this.wastePos;
        if (this.waste.length === 0) {
            this._drawEmptySlot(ctx, pos.x, pos.y);
            return;
        }
        const top = this.waste[this.waste.length - 1];
        if (top.animX != null) {
            this._drawCard(ctx, top, top.animX, top.animY);
        } else {
            this._drawCard(ctx, top, pos.x, pos.y);
        }
    },

    _renderFoundations(ctx) {
        for (let i = 0; i < 4; i++) {
            const pos = this.foundationPos[i];
            const pile = this.foundations[i];

            if (pile.length === 0) {
                // Draw suit placeholder
                const suitSymbol = this.SUITS[i];
                this._drawEmptySlot(ctx, pos.x, pos.y, suitSymbol);
            } else {
                const top = pile[pile.length - 1];
                if (top.animX != null) {
                    this._drawCard(ctx, top, top.animX, top.animY);
                } else {
                    this._drawCard(ctx, top, pos.x, pos.y);
                }
            }

            // Highlight valid drop
            if (this.dragging) {
                const dragCard = this.dragging.cards[0];
                if (this.dragging.cards.length === 1 && this._canPlaceOnFoundation(dragCard, i)) {
                    this._drawHighlight(ctx, pos.x, pos.y);
                }
            }
        }
    },

    _renderTableau(ctx) {
        for (let c = 0; c < 7; c++) {
            const col = this.tableau[c];
            const basePos = this.tableauPos[c];

            if (col.length === 0) {
                this._drawEmptySlot(ctx, basePos.x, basePos.y, 'K');
                // Highlight for king drops
                if (this.dragging && this.dragging.cards[0].rank === 12) {
                    this._drawHighlight(ctx, basePos.x, basePos.y);
                }
                continue;
            }

            // Find which cards are being dragged from this column
            let dragStartIdx = -1;
            if (this.dragging && this.dragging.sourceType === 'tableau' && this.dragging.sourceIdx === c) {
                dragStartIdx = col.length; // cards already removed, so skip
            }

            for (let r = 0; r < col.length; r++) {
                const card = col[r];
                const pos = this._getTableauCardPos(c, r);

                if (card.animX != null) {
                    if (card.faceUp || card.animFlip > 0) {
                        this._drawCard(ctx, card, card.animX, card.animY, card.animFlip || 1);
                    } else {
                        this._drawCardBack(ctx, card.animX, card.animY, card.animFlip || 1);
                    }
                } else if (card.faceUp) {
                    this._drawCard(ctx, card, pos.x, pos.y);
                } else {
                    this._drawCardBack(ctx, pos.x, pos.y);
                }
            }

            // Highlight valid drop on last card
            if (this.dragging && col.length > 0) {
                const topCard = col[col.length - 1];
                const dragCard = this.dragging.cards[0];
                if (topCard.faceUp && this._canPlaceOnTableau(dragCard, topCard)) {
                    const lastPos = this._getTableauCardPos(c, col.length - 1);
                    this._drawHighlight(ctx, lastPos.x, lastPos.y);
                }
            }
        }
    },

    _renderDragCards(ctx) {
        if (!this.dragging) return;
        const cards = this.dragging.cards;
        for (let i = 0; i < cards.length; i++) {
            const x = this.dragX - this.dragging.offsetX;
            const y = this.dragY - this.dragging.offsetY + i * 18;
            // Shadow
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetX = 4;
            ctx.shadowOffsetY = 4;
            this._drawCard(ctx, cards[i], x, y);
            ctx.restore();
        }
    },

    _renderParticles(ctx) {
        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    },

    // ── Card Drawing ──

    _drawCard(ctx, card, x, y, scaleX) {
        scaleX = scaleX != null ? scaleX : 1;
        const w = this.CARD_W;
        const h = this.CARD_H;
        const r = this.CARD_R;

        ctx.save();
        if (scaleX < 1) {
            ctx.translate(x + w / 2, y);
            ctx.scale(scaleX, 1);
            ctx.translate(-(x + w / 2), -y);
        }

        // Card shadow
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;

        // Card body
        ctx.fillStyle = '#ffffff';
        this._roundRect(ctx, x, y, w, h, r);
        ctx.fill();

        ctx.shadowColor = 'transparent';

        // Border
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        this._roundRect(ctx, x, y, w, h, r);
        ctx.stroke();

        // Suit color
        const color = this.SUIT_COLORS[card.suit];
        ctx.fillStyle = color;

        // Rank top-left
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(card.label, x + 5, y + 4);

        // Suit top-left
        ctx.font = '12px sans-serif';
        ctx.fillText(card.suit, x + 5, y + 20);

        // Rank bottom-right (inverted)
        ctx.save();
        ctx.translate(x + w - 5, y + h - 4);
        ctx.rotate(Math.PI);
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(card.label, 0, 0);
        ctx.font = '12px sans-serif';
        ctx.fillText(card.suit, 0, 16);
        ctx.restore();

        // Center suit large
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.suit, x + w / 2, y + h / 2);

        ctx.restore();
    },

    _drawCardBack(ctx, x, y, scaleX) {
        scaleX = scaleX != null ? scaleX : 1;
        const w = this.CARD_W;
        const h = this.CARD_H;
        const r = this.CARD_R;

        ctx.save();
        if (scaleX < 1) {
            ctx.translate(x + w / 2, y);
            ctx.scale(scaleX, 1);
            ctx.translate(-(x + w / 2), -y);
        }

        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;

        // Back gradient
        const grad = ctx.createLinearGradient(x, y, x + w, y + h);
        grad.addColorStop(0, '#1a3a5c');
        grad.addColorStop(0.5, '#0d2240');
        grad.addColorStop(1, '#1a3a5c');
        ctx.fillStyle = grad;
        this._roundRect(ctx, x, y, w, h, r);
        ctx.fill();

        ctx.shadowColor = 'transparent';

        // Pattern on back
        ctx.strokeStyle = 'rgba(0,212,255,0.15)';
        ctx.lineWidth = 0.5;
        const pad = 6;
        this._roundRect(ctx, x + pad, y + pad, w - pad * 2, h - pad * 2, r - 2);
        ctx.stroke();

        // Diamond pattern
        ctx.strokeStyle = 'rgba(0,212,255,0.08)';
        for (let dy = y + 14; dy < y + h - 10; dy += 10) {
            for (let dx = x + 14; dx < x + w - 10; dx += 10) {
                ctx.beginPath();
                ctx.moveTo(dx, dy - 4);
                ctx.lineTo(dx + 4, dy);
                ctx.lineTo(dx, dy + 4);
                ctx.lineTo(dx - 4, dy);
                ctx.closePath();
                ctx.stroke();
            }
        }

        // Border
        ctx.strokeStyle = 'rgba(0,212,255,0.2)';
        ctx.lineWidth = 1;
        this._roundRect(ctx, x, y, w, h, r);
        ctx.stroke();

        ctx.restore();
    },

    _drawEmptySlot(ctx, x, y, label) {
        const w = this.CARD_W;
        const h = this.CARD_H;
        const r = this.CARD_R;

        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1.5;
        this._roundRect(ctx, x, y, w, h, r);
        ctx.stroke();
        ctx.setLineDash([]);

        if (label) {
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.font = '22px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, x + w / 2, y + h / 2);
        }
        ctx.restore();
    },

    _drawHighlight(ctx, x, y) {
        ctx.save();
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00e676';
        ctx.shadowBlur = 8;
        this._roundRect(ctx, x - 2, y - 2, this.CARD_W + 4, this.CARD_H + 4, this.CARD_R + 1);
        ctx.stroke();
        ctx.restore();
    },

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    },

    // ── Input Handling ──

    _getCanvasPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.ui.canvasW / rect.width;
        const scaleY = this.ui.canvasH / rect.height;
        const clientX = e.clientX != null ? e.clientX : e.touches[0].clientX;
        const clientY = e.clientY != null ? e.clientY : e.touches[0].clientY;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    },

    _handleKey(e) {
        if (e.key === 'p' || e.key === 'P') {
            if (this.paused) this.resume();
            else if (!this.gameOver) this.pause();
        }
    },

    _handleTouchStart(e) {
        e.preventDefault();
        if (this.paused || this.gameOver || this.dealAnimating || this.autoCompleting) return;
        const touch = e.touches[0];
        const pos = this._getCanvasPos(touch);
        this._startDrag(pos.x, pos.y);
    },

    _handleTouchMove(e) {
        e.preventDefault();
        if (!this.dragging) return;
        const touch = e.touches[0];
        const pos = this._getCanvasPos(touch);
        this.dragX = pos.x;
        this.dragY = pos.y;
    },

    _handleTouchEnd(e) {
        e.preventDefault();
        if (this.dragging) {
            this._endDrag();
        } else if (this.paused || this.gameOver || this.dealAnimating || this.autoCompleting) {
            return;
        }
    },

    _handleMouseDown(e) {
        if (this.paused || this.gameOver || this.dealAnimating || this.autoCompleting) return;
        const pos = this._getCanvasPos(e);
        this._startDrag(pos.x, pos.y);
    },

    _handleMouseMove(e) {
        if (!this.dragging) return;
        const pos = this._getCanvasPos(e);
        this.dragX = pos.x;
        this.dragY = pos.y;
    },

    _handleMouseUp(e) {
        if (this.dragging) {
            this._endDrag();
        }
    },

    _handleDblClick(e) {
        if (this.paused || this.gameOver || this.dealAnimating || this.autoCompleting) return;
        const pos = this._getCanvasPos(e);
        this._tryAutoMoveToFoundation(pos.x, pos.y);
    },

    _handleClick(e) {
        // Handled via mousedown/up
    },

    // ── Hit Testing ──

    _hitRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    },

    _hitTest(px, py) {
        // Check stock
        if (this._hitRect(px, py, this.stockPos.x, this.stockPos.y, this.CARD_W, this.CARD_H)) {
            return { type: 'stock' };
        }

        // Check waste
        if (this.waste.length > 0 &&
            this._hitRect(px, py, this.wastePos.x, this.wastePos.y, this.CARD_W, this.CARD_H)) {
            return { type: 'waste', card: this.waste[this.waste.length - 1] };
        }

        // Check foundations
        for (let i = 0; i < 4; i++) {
            const pos = this.foundationPos[i];
            if (this._hitRect(px, py, pos.x, pos.y, this.CARD_W, this.CARD_H)) {
                if (this.foundations[i].length > 0) {
                    return { type: 'foundation', idx: i, card: this.foundations[i][this.foundations[i].length - 1] };
                }
                return { type: 'foundation_empty', idx: i };
            }
        }

        // Check tableau (reverse order for overlapping cards - top card first)
        for (let c = 0; c < 7; c++) {
            const col = this.tableau[c];
            for (let r = col.length - 1; r >= 0; r--) {
                const card = col[r];
                const pos = this._getTableauCardPos(c, r);
                const cardH = (r === col.length - 1) ? this.CARD_H : (col[r + 1] && col[r + 1].faceUp ? 18 : 8);
                if (this._hitRect(px, py, pos.x, pos.y, this.CARD_W, cardH)) {
                    if (card.faceUp) {
                        return { type: 'tableau', col: c, row: r, card };
                    } else if (r === col.length - 1) {
                        // Tapping face-down top card? Should not happen in valid game, but handle it
                        return null;
                    }
                    return null;
                }
            }
            // Check empty column
            if (col.length === 0) {
                const pos = this.tableauPos[c];
                if (this._hitRect(px, py, pos.x, pos.y, this.CARD_W, this.CARD_H)) {
                    return { type: 'tableau_empty', col: c };
                }
            }
        }

        return null;
    },

    // ── Drag & Drop ──

    _startDrag(px, py) {
        const hit = this._hitTest(px, py);
        if (!hit) return;

        if (hit.type === 'stock') {
            this._drawFromStock();
            return;
        }

        if (hit.type === 'waste') {
            const card = this.waste[this.waste.length - 1];
            this.waste.pop();
            this.dragging = {
                cards: [card],
                sourceType: 'waste',
                sourceIdx: 0,
                startX: this.wastePos.x,
                startY: this.wastePos.y,
                offsetX: px - this.wastePos.x,
                offsetY: py - this.wastePos.y
            };
            this.dragX = px;
            this.dragY = py;
            return;
        }

        if (hit.type === 'tableau') {
            const col = this.tableau[hit.col];
            const cards = col.splice(hit.row);
            const pos = this._getTableauCardPos(hit.col, hit.row);
            this.dragging = {
                cards,
                sourceType: 'tableau',
                sourceIdx: hit.col,
                sourceRow: hit.row,
                startX: pos.x,
                startY: pos.y,
                offsetX: px - pos.x,
                offsetY: py - pos.y
            };
            this.dragX = px;
            this.dragY = py;
            return;
        }

        if (hit.type === 'foundation' && this.foundations[hit.idx].length > 0) {
            const card = this.foundations[hit.idx].pop();
            const pos = this.foundationPos[hit.idx];
            this.dragging = {
                cards: [card],
                sourceType: 'foundation',
                sourceIdx: hit.idx,
                startX: pos.x,
                startY: pos.y,
                offsetX: px - pos.x,
                offsetY: py - pos.y
            };
            this.dragX = px;
            this.dragY = py;
        }
    },

    _endDrag() {
        if (!this.dragging) return;
        const dropX = this.dragX - this.dragging.offsetX + this.CARD_W / 2;
        const dropY = this.dragY - this.dragging.offsetY + this.CARD_H / 2;

        let placed = false;

        // Try foundations (single card only)
        if (this.dragging.cards.length === 1) {
            for (let i = 0; i < 4; i++) {
                const pos = this.foundationPos[i];
                if (this._hitRect(dropX, dropY, pos.x, pos.y, this.CARD_W, this.CARD_H)) {
                    if (this._canPlaceOnFoundation(this.dragging.cards[0], i)) {
                        this.foundations[i].push(this.dragging.cards[0]);
                        this._addScore(10);
                        this._revealTopCard(this.dragging.sourceType, this.dragging.sourceIdx);
                        placed = true;
                        break;
                    }
                }
            }
        }

        // Try tableau
        if (!placed) {
            for (let c = 0; c < 7; c++) {
                const col = this.tableau[c];
                let targetY;
                if (col.length === 0) {
                    targetY = this.tableauPos[c].y;
                } else {
                    const lastPos = this._getTableauCardPos(c, col.length - 1);
                    targetY = lastPos.y;
                }
                const targetX = this.tableauPos[c].x;

                // Check if drop position overlaps this column
                if (this._hitRect(dropX, dropY, targetX, targetY, this.CARD_W, this.CARD_H + 18)) {
                    if (col.length === 0) {
                        if (this.dragging.cards[0].rank === 12) { // King
                            for (const card of this.dragging.cards) col.push(card);
                            this._revealTopCard(this.dragging.sourceType, this.dragging.sourceIdx);
                            placed = true;
                            break;
                        }
                    } else {
                        const topCard = col[col.length - 1];
                        if (topCard.faceUp && this._canPlaceOnTableau(this.dragging.cards[0], topCard)) {
                            for (const card of this.dragging.cards) col.push(card);
                            this._revealTopCard(this.dragging.sourceType, this.dragging.sourceIdx);
                            placed = true;
                            break;
                        }
                    }
                }
            }
        }

        // Return cards to source if not placed
        if (!placed) {
            this._returnDragToSource();
        }

        this.dragging = null;
        this._checkWin();
    },

    _returnDragToSource() {
        const d = this.dragging;
        if (d.sourceType === 'waste') {
            this.waste.push(d.cards[0]);
        } else if (d.sourceType === 'tableau') {
            for (const card of d.cards) {
                this.tableau[d.sourceIdx].push(card);
            }
        } else if (d.sourceType === 'foundation') {
            this.foundations[d.sourceIdx].push(d.cards[0]);
        }
    },

    _revealTopCard(sourceType, sourceIdx) {
        if (sourceType === 'tableau') {
            const col = this.tableau[sourceIdx];
            if (col.length > 0 && !col[col.length - 1].faceUp) {
                const card = col[col.length - 1];
                card.faceUp = true;
                this._addScore(5);
                // Flip animation
                card.animFlip = 0;
                const pos = this._getTableauCardPos(sourceIdx, col.length - 1);
                this.animations.push({
                    card,
                    fromX: pos.x,
                    fromY: pos.y,
                    toX: pos.x,
                    toY: pos.y,
                    startTime: performance.now(),
                    duration: 250,
                    flip: true
                });
            }
        }
    },

    // ── Stock ──

    _drawFromStock() {
        if (this.stock.length === 0) {
            // Recycle waste back to stock
            if (this.waste.length > 0) {
                this.stock = this.waste.reverse();
                this.waste = [];
                for (const card of this.stock) {
                    card.faceUp = false;
                }
            }
            return;
        }

        const card = this.stock.pop();
        card.faceUp = true;
        this.waste.push(card);

        // Animate from stock to waste
        this.animations.push({
            card,
            fromX: this.stockPos.x,
            fromY: this.stockPos.y,
            toX: this.wastePos.x,
            toY: this.wastePos.y,
            startTime: performance.now(),
            duration: 150,
            flip: true
        });
    },

    // ── Move Validation ──

    _canPlaceOnFoundation(card, fi) {
        const pile = this.foundations[fi];
        if (pile.length === 0) {
            return card.rank === 0; // Ace
        }
        const top = pile[pile.length - 1];
        return top.suit === card.suit && card.rank === top.rank + 1;
    },

    _canPlaceOnTableau(card, targetCard) {
        // Must be descending rank, alternating color
        if (card.rank !== targetCard.rank - 1) return false;
        return this._isRed(card) !== this._isRed(targetCard);
    },

    // ── Auto-move to Foundation (double-click) ──

    _tryAutoMoveToFoundation(px, py) {
        const hit = this._hitTest(px, py);
        if (!hit) return;

        let card = null;
        let sourceType = null;
        let sourceIdx = 0;
        let removeCard = null;

        if (hit.type === 'waste' && this.waste.length > 0) {
            card = this.waste[this.waste.length - 1];
            sourceType = 'waste';
            removeCard = () => this.waste.pop();
        } else if (hit.type === 'tableau') {
            const col = this.tableau[hit.col];
            if (hit.row === col.length - 1) {
                card = col[col.length - 1];
                sourceType = 'tableau';
                sourceIdx = hit.col;
                removeCard = () => col.pop();
            }
        }

        if (!card) return;

        // Try each foundation
        const fi = this._findFoundationTarget(card);
        if (fi >= 0) {
            const fromPos = hit.type === 'waste' ? this.wastePos :
                this._getTableauCardPos(sourceIdx, this.tableau[sourceIdx].length - 1);
            removeCard();
            this.foundations[fi].push(card);
            this._addScore(10);
            this._revealTopCard(sourceType, sourceIdx);

            // Animate
            const toPos = this.foundationPos[fi];
            this.animations.push({
                card,
                fromX: fromPos.x,
                fromY: fromPos.y,
                toX: toPos.x,
                toY: toPos.y,
                startTime: performance.now(),
                duration: 200
            });

            this._checkWin();
        }
    }
};

export default Solitaire;
