const CrazyEights = {
    canvas: null,
    ctx: null,
    ui: null,
    animFrame: null,

    // Card dimensions
    CARD_W: 60,
    CARD_H: 84,
    CARD_R: 6,

    // Deck / game state
    deck: [],
    playerHand: [],
    aiHand: [],
    discardPile: [],
    stockPile: [],

    // Scores across rounds
    playerScore: 0,
    aiScore: 0,
    targetScore: 200,

    // Turn state
    isPlayerTurn: true,
    drawCount: 0,
    maxDrawsPerTurn: 3,
    gameOver: false,
    paused: false,
    roundOver: false,

    // Suit chooser
    choosingSuit: false,
    pendingEightCard: null,
    suitButtons: [],

    // Required suit (set by 8s)
    requiredSuit: null, // null means use top discard suit

    // Hover / selection
    hoveredCardIndex: -1,
    selectedCardIndex: -1,

    // Animations
    animations: [],
    particles: [],
    aiThinking: false,
    aiThinkTimer: null,
    turnGlow: 0,
    turnGlowDir: 1,
    lastTime: 0,

    // Draw button
    drawBtnRect: { x: 0, y: 0, w: 100, h: 36 },
    drawBtnHover: false,

    // Card positions (computed)
    playerCardPositions: [],
    aiCardPositions: [],
    discardPos: { x: 0, y: 0 },
    stockPos: { x: 0, y: 0 },

    // Event handlers (bound)
    _handleClick: null,
    _handleMove: null,
    _handleKey: null,
    _handleTouchStart: null,

    // Suits and ranks
    SUITS: ['hearts', 'diamonds', 'clubs', 'spades'],
    SUIT_SYMBOLS: { hearts: '\u2665', diamonds: '\u2666', clubs: '\u2663', spades: '\u2660' },
    SUIT_COLORS: {
        hearts: '#cc0000',
        diamonds: '#cc0000',
        clubs: '#111111',
        spades: '#111111'
    },
    RANKS: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;

        this._handleClick = this.handleClick.bind(this);
        this._handleMove = this.handleMove.bind(this);
        this._handleKey = this.handleKey.bind(this);
        this._handleTouchStart = this.handleTouchStart.bind(this);

        canvas.addEventListener('click', this._handleClick);
        canvas.addEventListener('mousemove', this._handleMove);
        canvas.addEventListener('touchstart', this._handleTouchStart, { passive: false });
        document.addEventListener('keydown', this._handleKey);

        // Compute positions
        this.discardPos = { x: ui.canvasW / 2 - 70, y: ui.canvasH / 2 - 42 };
        this.stockPos = { x: ui.canvasW / 2 + 30, y: ui.canvasH / 2 - 42 };
        this.drawBtnRect = { x: ui.canvasW / 2 + 15, y: ui.canvasH / 2 + 52, w: 90, h: 32 };

        // Suit chooser buttons
        const bx = ui.canvasW / 2 - 120;
        const by = ui.canvasH / 2 - 40;
        this.suitButtons = this.SUITS.map((s, i) => ({
            suit: s,
            x: bx + i * 65,
            y: by,
            w: 56,
            h: 56
        }));
    },

    start() {
        this.playerScore = 0;
        this.aiScore = 0;
        this.gameOver = false;
        this.paused = false;
        this.ui.hideGameOver();
        this.startRound();
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    },

    startRound() {
        this.roundOver = false;
        this.animations = [];
        this.particles = [];
        this.choosingSuit = false;
        this.pendingEightCard = null;
        this.requiredSuit = null;
        this.hoveredCardIndex = -1;
        this.selectedCardIndex = -1;
        this.drawCount = 0;
        this.aiThinking = false;
        if (this.aiThinkTimer) clearTimeout(this.aiThinkTimer);

        // Build and shuffle deck
        this.deck = [];
        for (const suit of this.SUITS) {
            for (const rank of this.RANKS) {
                this.deck.push({ suit, rank });
            }
        }
        this.shuffle(this.deck);

        // Deal 7 each
        this.playerHand = this.deck.splice(0, 7);
        this.aiHand = this.deck.splice(0, 7);

        // Flip starter — make sure it's not an 8
        let starter = this.deck.shift();
        while (starter.rank === '8') {
            this.deck.push(starter);
            this.shuffle(this.deck);
            starter = this.deck.shift();
        }
        this.discardPile = [starter];
        this.stockPile = [...this.deck];
        this.deck = [];

        this.sortHand(this.playerHand);

        this.isPlayerTurn = true;
        this.drawCount = 0;
        this.updateScoreDisplay();
    },

    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    },

    sortHand(hand) {
        const suitOrder = { clubs: 0, spades: 1, hearts: 2, diamonds: 3 };
        const rankOrder = {};
        this.RANKS.forEach((r, i) => rankOrder[r] = i);
        hand.sort((a, b) => suitOrder[a.suit] - suitOrder[b.suit] || rankOrder[a.rank] - rankOrder[b.rank]);
    },

    topDiscard() {
        return this.discardPile[this.discardPile.length - 1];
    },

    currentSuit() {
        return this.requiredSuit || this.topDiscard().suit;
    },

    currentRank() {
        return this.topDiscard().rank;
    },

    canPlay(card) {
        if (card.rank === '8') return true;
        const suit = this.currentSuit();
        const rank = this.currentRank();
        return card.suit === suit || card.rank === rank;
    },

    hasPlayableCard(hand) {
        return hand.some(c => this.canPlay(c));
    },

    cardValue(card) {
        if (card.rank === '8') return 50;
        if (['J', 'Q', 'K'].includes(card.rank)) return 10;
        if (card.rank === 'A') return 1;
        return parseInt(card.rank);
    },

    handValue(hand) {
        return hand.reduce((sum, c) => sum + this.cardValue(c), 0);
    },

    playCard(hand, index) {
        const card = hand.splice(index, 1)[0];
        this.discardPile.push(card);
        this.requiredSuit = null;
        this.drawCount = 0;

        // Animate card to discard
        const fromPos = this.getCardSourcePos(hand === this.playerHand, index, hand.length + 1);
        this.addCardAnimation(fromPos, this.discardPos, card, 300);

        return card;
    },

    drawCard(hand) {
        if (this.stockPile.length === 0) {
            // Reshuffle discard into stock, keep top card
            if (this.discardPile.length <= 1) return null;
            const top = this.discardPile.pop();
            this.stockPile = [...this.discardPile];
            this.shuffle(this.stockPile);
            this.discardPile = [top];
        }
        if (this.stockPile.length === 0) return null;
        const card = this.stockPile.pop();
        hand.push(card);

        // Animate
        const toPos = this.getCardSourcePos(hand === this.playerHand, hand.length - 1, hand.length);
        this.addCardAnimation(this.stockPos, toPos, hand === this.playerHand ? card : null, 250);

        return card;
    },

    getCardSourcePos(isPlayer, index, handSize) {
        const positions = this.computeHandPositions(handSize, isPlayer);
        if (index >= 0 && index < positions.length) return positions[index];
        return isPlayer
            ? { x: this.ui.canvasW / 2, y: this.ui.canvasH - 60 }
            : { x: this.ui.canvasW / 2, y: 30 };
    },

    computeHandPositions(count, isPlayer) {
        const maxSpread = Math.min(count * 42, this.ui.canvasW - 80);
        const spacing = count > 1 ? maxSpread / (count - 1) : 0;
        const startX = (this.ui.canvasW - maxSpread) / 2;
        const y = isPlayer ? this.ui.canvasH - 110 : 20;
        const positions = [];
        for (let i = 0; i < count; i++) {
            positions.push({ x: startX + i * spacing, y });
        }
        return positions;
    },

    addCardAnimation(from, to, card, duration) {
        this.animations.push({
            type: 'card',
            from: { ...from },
            to: { ...to },
            card,
            elapsed: 0,
            duration,
            done: false
        });
    },

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    },

    // --- Turn logic ---

    playerPlay(index) {
        if (!this.isPlayerTurn || this.choosingSuit || this.aiThinking || this.roundOver || this.gameOver || this.paused) return;
        if (this.animations.some(a => !a.done)) return;

        const card = this.playerHand[index];
        if (!this.canPlay(card)) return;

        if (card.rank === '8') {
            this.pendingEightCard = index;
            this.choosingSuit = true;
            return;
        }

        this.playCard(this.playerHand, index);
        this.sortHand(this.playerHand);
        this.selectedCardIndex = -1;
        this.hoveredCardIndex = -1;

        if (this.playerHand.length === 0) {
            this.endRound(true);
            return;
        }

        this.endPlayerTurn();
    },

    chooseSuit(suit) {
        if (this.pendingEightCard === null) return;
        this.playCard(this.playerHand, this.pendingEightCard);
        this.requiredSuit = suit;
        this.sortHand(this.playerHand);
        this.choosingSuit = false;
        this.pendingEightCard = null;
        this.selectedCardIndex = -1;

        if (this.playerHand.length === 0) {
            this.endRound(true);
            return;
        }

        this.endPlayerTurn();
    },

    playerDraw() {
        if (!this.isPlayerTurn || this.choosingSuit || this.aiThinking || this.roundOver || this.gameOver || this.paused) return;
        if (this.animations.some(a => !a.done)) return;

        if (this.drawCount >= this.maxDrawsPerTurn) {
            // Pass turn
            this.endPlayerTurn();
            return;
        }

        const card = this.drawCard(this.playerHand);
        if (!card) {
            this.endPlayerTurn();
            return;
        }
        this.drawCount++;
        this.sortHand(this.playerHand);

        if (this.drawCount >= this.maxDrawsPerTurn && !this.hasPlayableCard(this.playerHand)) {
            // Auto-pass after max draws if no playable card
            setTimeout(() => {
                if (this.isPlayerTurn && !this.roundOver) this.endPlayerTurn();
            }, 400);
        }
    },

    endPlayerTurn() {
        this.isPlayerTurn = false;
        this.drawCount = 0;
        this.aiThinking = true;
        const delay = 500 + Math.random() * 300;
        this.aiThinkTimer = setTimeout(() => {
            this.aiPlay();
        }, delay);
    },

    aiPlay() {
        if (this.roundOver || this.gameOver || this.paused) {
            this.aiThinking = false;
            return;
        }

        // AI strategy: play matching card, prefer non-8s, save 8s
        let bestIndex = -1;
        let eightIndex = -1;

        for (let i = 0; i < this.aiHand.length; i++) {
            const c = this.aiHand[i];
            if (c.rank === '8') {
                eightIndex = i;
                continue;
            }
            if (this.canPlay(c)) {
                bestIndex = i;
                // Prefer cards that match suit (to keep options open)
                if (c.suit === this.currentSuit()) break;
            }
        }

        if (bestIndex === -1 && eightIndex !== -1) {
            bestIndex = eightIndex;
        }

        if (bestIndex !== -1) {
            const card = this.playCard(this.aiHand, bestIndex);

            if (card.rank === '8') {
                // AI picks most common suit in hand
                const suitCounts = {};
                this.SUITS.forEach(s => suitCounts[s] = 0);
                this.aiHand.forEach(c => suitCounts[c.suit]++);
                let bestSuit = this.SUITS[0];
                for (const s of this.SUITS) {
                    if (suitCounts[s] > suitCounts[bestSuit]) bestSuit = s;
                }
                this.requiredSuit = bestSuit;
            }

            if (this.aiHand.length === 0) {
                this.aiThinking = false;
                this.endRound(false);
                return;
            }

            this.aiThinking = false;
            this.isPlayerTurn = true;
            this.drawCount = 0;
        } else {
            // Draw
            let drew = 0;
            const drawNext = () => {
                if (drew >= this.maxDrawsPerTurn || this.hasPlayableCard(this.aiHand)) {
                    this.aiThinking = false;
                    this.isPlayerTurn = true;
                    this.drawCount = 0;
                    return;
                }
                const c = this.drawCard(this.aiHand);
                if (!c) {
                    this.aiThinking = false;
                    this.isPlayerTurn = true;
                    this.drawCount = 0;
                    return;
                }
                drew++;
                setTimeout(drawNext, 250);
            };
            drawNext();
        }
    },

    endRound(playerWon) {
        this.roundOver = true;
        const winnerHand = playerWon ? this.aiHand : this.playerHand;
        const points = this.handValue(winnerHand);

        if (playerWon) {
            this.playerScore += points;
        } else {
            this.aiScore += points;
        }

        this.updateScoreDisplay();

        // Particles for winner
        if (playerWon) {
            this.spawnCelebration();
        }

        // Check if game is over
        if (this.playerScore >= this.targetScore || this.aiScore >= this.targetScore) {
            this.gameOver = true;
            const finalScore = this.playerScore;
            const best = this.ui.getHighScore();
            if (finalScore > best) {
                this.ui.setHighScore(finalScore);
            }
            setTimeout(() => {
                this.ui.showGameOver(finalScore, Math.max(finalScore, best));
            }, 1500);
        } else {
            // Start next round after delay
            setTimeout(() => {
                if (!this.gameOver) this.startRound();
            }, 2000);
        }
    },

    updateScoreDisplay() {
        this.ui.setScore(this.playerScore);
    },

    spawnCelebration() {
        const cx = this.ui.canvasW / 2;
        const cy = this.ui.canvasH / 2;
        const colors = ['#00d4ff', '#ff2d7b', '#ffd60a', '#00e676'];
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            this.particles.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.008 + Math.random() * 0.012,
                size: 2 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
    },

    // --- Input handlers ---

    getCanvasPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.ui.canvasW / rect.width;
        const scaleY = this.ui.canvasH / rect.height;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    },

    handleClick(e) {
        if (this.gameOver || this.paused) return;
        const pos = this.getCanvasPos(e);

        // Suit chooser
        if (this.choosingSuit) {
            for (const btn of this.suitButtons) {
                if (pos.x >= btn.x && pos.x <= btn.x + btn.w && pos.y >= btn.y && pos.y <= btn.y + btn.h) {
                    this.chooseSuit(btn.suit);
                    return;
                }
            }
            return;
        }

        if (!this.isPlayerTurn || this.aiThinking) return;

        // Check player cards (reverse order for overlapping)
        const positions = this.computeHandPositions(this.playerHand.length, true);
        for (let i = this.playerHand.length - 1; i >= 0; i--) {
            const p = positions[i];
            const hovered = i === this.hoveredCardIndex;
            const cy = hovered ? p.y - 12 : p.y;
            if (pos.x >= p.x && pos.x <= p.x + this.CARD_W && pos.y >= cy && pos.y <= cy + this.CARD_H) {
                this.playerPlay(i);
                return;
            }
        }

        // Check stock pile click
        if (pos.x >= this.stockPos.x && pos.x <= this.stockPos.x + this.CARD_W &&
            pos.y >= this.stockPos.y && pos.y <= this.stockPos.y + this.CARD_H) {
            this.playerDraw();
            return;
        }

        // Check draw button
        const db = this.drawBtnRect;
        if (pos.x >= db.x && pos.x <= db.x + db.w && pos.y >= db.y && pos.y <= db.y + db.h) {
            this.playerDraw();
            return;
        }
    },

    handleMove(e) {
        if (this.gameOver || this.paused || this.choosingSuit) return;
        const pos = this.getCanvasPos(e);

        // Check draw button hover
        const db = this.drawBtnRect;
        this.drawBtnHover = pos.x >= db.x && pos.x <= db.x + db.w && pos.y >= db.y && pos.y <= db.y + db.h;

        if (!this.isPlayerTurn) {
            this.hoveredCardIndex = -1;
            return;
        }

        const positions = this.computeHandPositions(this.playerHand.length, true);
        let found = -1;
        for (let i = this.playerHand.length - 1; i >= 0; i--) {
            const p = positions[i];
            const hovered = i === this.hoveredCardIndex;
            const cy = hovered ? p.y - 12 : p.y;
            if (pos.x >= p.x && pos.x <= p.x + this.CARD_W && pos.y >= cy && pos.y <= cy + this.CARD_H) {
                found = i;
                break;
            }
        }
        this.hoveredCardIndex = found;
    },

    handleTouchStart(e) {
        e.preventDefault();
        this.handleClick(e);
    },

    handleKey(e) {
        if (this.gameOver) return;

        if (e.key === 'p' || e.key === 'P') {
            if (this.paused) this.resume();
            else this.pause();
            return;
        }

        if (this.paused || !this.isPlayerTurn || this.aiThinking) return;

        if (this.choosingSuit) {
            const map = { ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, ArrowDown: 3 };
            if (e.key === 'Enter' && this.selectedCardIndex >= 0 && this.selectedCardIndex < 4) {
                this.chooseSuit(this.SUITS[this.selectedCardIndex]);
                e.preventDefault();
                return;
            }
            if (map[e.key] !== undefined) {
                this.selectedCardIndex = map[e.key];
                e.preventDefault();
            }
            return;
        }

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.selectedCardIndex = Math.max(0, (this.selectedCardIndex < 0 ? 0 : this.selectedCardIndex) - 1);
            this.hoveredCardIndex = this.selectedCardIndex;
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.selectedCardIndex = Math.min(this.playerHand.length - 1,
                (this.selectedCardIndex < 0 ? -1 : this.selectedCardIndex) + 1);
            this.hoveredCardIndex = this.selectedCardIndex;
        } else if (e.key === 'Enter' && this.selectedCardIndex >= 0) {
            e.preventDefault();
            this.playerPlay(this.selectedCardIndex);
        } else if (e.key === ' ' || e.key === 'd' || e.key === 'D') {
            e.preventDefault();
            this.playerDraw();
        }
    },

    pause() {
        this.paused = true;
        this.ui.showPause();
    },

    resume() {
        this.paused = false;
        this.ui.hidePause();
        this.lastTime = performance.now();
    },

    reset() {
        if (this.aiThinkTimer) clearTimeout(this.aiThinkTimer);
        this.animations = [];
        this.particles = [];
        this.aiThinking = false;
        this.choosingSuit = false;
        this.pendingEightCard = null;
    },

    destroy() {
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        if (this.aiThinkTimer) clearTimeout(this.aiThinkTimer);
        this.canvas.removeEventListener('click', this._handleClick);
        this.canvas.removeEventListener('mousemove', this._handleMove);
        this.canvas.removeEventListener('touchstart', this._handleTouchStart);
        document.removeEventListener('keydown', this._handleKey);
    },

    // --- Main loop ---

    loop(timestamp) {
        const dt = Math.min(timestamp - this.lastTime, 50) / 1000;
        this.lastTime = timestamp;

        if (!this.paused) {
            this.update(dt);
        }
        this.render();

        this.animFrame = requestAnimationFrame(this.loop.bind(this));
    },

    update(dt) {
        // Turn glow
        this.turnGlow += this.turnGlowDir * dt * 2;
        if (this.turnGlow > 1) { this.turnGlow = 1; this.turnGlowDir = -1; }
        if (this.turnGlow < 0.3) { this.turnGlow = 0.3; this.turnGlowDir = 1; }

        // Animations
        for (const anim of this.animations) {
            if (anim.done) continue;
            anim.elapsed += dt * 1000;
            if (anim.elapsed >= anim.duration) {
                anim.done = true;
            }
        }
        this.animations = this.animations.filter(a => !a.done);

        // Particles
        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05;
            p.life -= p.decay;
        }
        this.particles = this.particles.filter(p => p.life > 0);
    },

    // --- Rendering ---

    render() {
        const ctx = this.ctx;
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Subtle radial glow
        const grd = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 400);
        grd.addColorStop(0, 'rgba(0,212,255,0.03)');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);

        // Turn indicator glow
        const glowAlpha = this.turnGlow * 0.15;
        if (this.isPlayerTurn && !this.choosingSuit) {
            ctx.fillStyle = `rgba(0,212,255,${glowAlpha})`;
            ctx.fillRect(0, H - 140, W, 140);
        } else if (!this.isPlayerTurn) {
            ctx.fillStyle = `rgba(255,45,123,${glowAlpha})`;
            ctx.fillRect(0, 0, W, 100);
        }

        // Labels
        ctx.font = 'bold 13px "Outfit", sans-serif';
        ctx.fillStyle = '#8888a0';
        ctx.textAlign = 'center';
        ctx.fillText(`AI (${this.aiScore} pts) — ${this.aiHand.length} cards`, W / 2, 14);
        ctx.fillText(`You (${this.playerScore} pts)`, W / 2, H - 6);

        // AI hand (face down)
        this.renderAIHand(ctx);

        // Discard pile
        this.renderDiscardPile(ctx);

        // Stock pile
        this.renderStockPile(ctx);

        // Current suit indicator
        this.renderSuitIndicator(ctx);

        // Draw button
        this.renderDrawButton(ctx);

        // Player hand
        this.renderPlayerHand(ctx);

        // Animations
        this.renderAnimations(ctx);

        // Suit chooser overlay
        if (this.choosingSuit) {
            this.renderSuitChooser(ctx);
        }

        // Round over message
        if (this.roundOver && !this.gameOver) {
            this.renderRoundMessage(ctx);
        }

        // AI thinking indicator
        if (this.aiThinking) {
            ctx.font = 'bold 14px "Outfit", sans-serif';
            ctx.fillStyle = '#ff2d7b';
            ctx.textAlign = 'center';
            const dots = '.'.repeat(Math.floor(performance.now() / 400) % 4);
            ctx.fillText(`AI thinking${dots}`, W / 2, H / 2 - 70);
        }

        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    },

    renderAIHand(ctx) {
        const positions = this.computeHandPositions(this.aiHand.length, false);
        for (let i = 0; i < this.aiHand.length; i++) {
            this.drawCardBack(ctx, positions[i].x, positions[i].y);
        }
    },

    renderPlayerHand(ctx) {
        const positions = this.computeHandPositions(this.playerHand.length, true);
        this.playerCardPositions = positions;
        for (let i = 0; i < this.playerHand.length; i++) {
            const p = positions[i];
            const hovered = i === this.hoveredCardIndex;
            const yOff = hovered ? -12 : 0;
            const playable = this.isPlayerTurn && this.canPlay(this.playerHand[i]);

            // Dim unplayable cards
            if (this.isPlayerTurn && !playable && !this.choosingSuit) {
                ctx.globalAlpha = 0.5;
            }

            this.drawCardFace(ctx, p.x, p.y + yOff, this.playerHand[i]);

            if (playable && hovered) {
                ctx.strokeStyle = '#00d4ff';
                ctx.lineWidth = 2;
                this.roundRect(ctx, p.x - 1, p.y + yOff - 1, this.CARD_W + 2, this.CARD_H + 2, this.CARD_R + 1);
                ctx.stroke();
            }

            ctx.globalAlpha = 1;
        }
    },

    renderDiscardPile(ctx) {
        if (this.discardPile.length === 0) return;
        // Shadow of stack
        if (this.discardPile.length > 1) {
            ctx.globalAlpha = 0.3;
            this.drawCardBack(ctx, this.discardPos.x + 2, this.discardPos.y + 2);
            ctx.globalAlpha = 1;
        }
        this.drawCardFace(ctx, this.discardPos.x, this.discardPos.y, this.topDiscard());

        // Label
        ctx.font = '10px "Outfit", sans-serif';
        ctx.fillStyle = '#8888a0';
        ctx.textAlign = 'center';
        ctx.fillText('DISCARD', this.discardPos.x + this.CARD_W / 2, this.discardPos.y + this.CARD_H + 14);
    },

    renderStockPile(ctx) {
        if (this.stockPile.length === 0) {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            this.roundRect(ctx, this.stockPos.x, this.stockPos.y, this.CARD_W, this.CARD_H, this.CARD_R);
            ctx.stroke();
            ctx.setLineDash([]);
        } else {
            // Stack effect
            if (this.stockPile.length > 2) {
                ctx.globalAlpha = 0.2;
                this.drawCardBack(ctx, this.stockPos.x + 3, this.stockPos.y + 3);
                ctx.globalAlpha = 0.5;
                this.drawCardBack(ctx, this.stockPos.x + 1.5, this.stockPos.y + 1.5);
                ctx.globalAlpha = 1;
            }
            this.drawCardBack(ctx, this.stockPos.x, this.stockPos.y);
        }

        // Count label
        ctx.font = '10px "Outfit", sans-serif';
        ctx.fillStyle = '#8888a0';
        ctx.textAlign = 'center';
        ctx.fillText(`STOCK (${this.stockPile.length})`, this.stockPos.x + this.CARD_W / 2, this.stockPos.y + this.CARD_H + 14);
    },

    renderSuitIndicator(ctx) {
        const suit = this.currentSuit();
        const symbol = this.SUIT_SYMBOLS[suit];
        const color = this.SUIT_COLORS[suit];

        const ix = this.discardPos.x - 40;
        const iy = this.discardPos.y + this.CARD_H / 2;

        // Glow
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.font = 'bold 28px serif';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, ix, iy);
        ctx.shadowBlur = 0;

        ctx.font = '9px "Outfit", sans-serif';
        ctx.fillStyle = '#8888a0';
        ctx.fillText('SUIT', ix, iy + 22);
        ctx.textBaseline = 'alphabetic';
    },

    renderDrawButton(ctx) {
        if (!this.isPlayerTurn || this.choosingSuit) return;

        const db = this.drawBtnRect;
        const canDraw = this.drawCount < this.maxDrawsPerTurn && this.stockPile.length > 0;
        const label = this.drawCount >= this.maxDrawsPerTurn ? 'PASS' : `DRAW (${this.maxDrawsPerTurn - this.drawCount})`;

        ctx.fillStyle = this.drawBtnHover ? '#1a1a2e' : '#12121a';
        ctx.strokeStyle = canDraw ? '#00d4ff' : '#ff2d7b';
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, db.x, db.y, db.w, db.h, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 11px "Outfit", sans-serif';
        ctx.fillStyle = canDraw ? '#00d4ff' : '#ff2d7b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, db.x + db.w / 2, db.y + db.h / 2);
        ctx.textBaseline = 'alphabetic';
    },

    renderAnimations(ctx) {
        for (const anim of this.animations) {
            if (anim.done) continue;
            const t = this.easeOutCubic(Math.min(anim.elapsed / anim.duration, 1));
            const x = anim.from.x + (anim.to.x - anim.from.x) * t;
            const y = anim.from.y + (anim.to.y - anim.from.y) * t;

            if (anim.card) {
                this.drawCardFace(ctx, x, y, anim.card);
            } else {
                this.drawCardBack(ctx, x, y);
            }
        }
    },

    renderSuitChooser(ctx) {
        // Overlay
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, this.ui.canvasW, this.ui.canvasH);

        ctx.font = 'bold 16px "Outfit", sans-serif';
        ctx.fillStyle = '#e8e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Choose a suit', this.ui.canvasW / 2, this.ui.canvasH / 2 - 55);

        for (let i = 0; i < this.suitButtons.length; i++) {
            const btn = this.suitButtons[i];
            const color = this.SUIT_COLORS[btn.suit];

            ctx.fillStyle = '#1a1a2e';
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            this.roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 10);
            ctx.fill();
            ctx.stroke();

            ctx.font = 'bold 28px serif';
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.SUIT_SYMBOLS[btn.suit], btn.x + btn.w / 2, btn.y + btn.h / 2);
        }
        ctx.textBaseline = 'alphabetic';
    },

    renderRoundMessage(ctx) {
        const lastWinner = this.discardPile.length > 0 && this.playerHand.length === 0;
        const msg = lastWinner ? 'You win this round!' : 'AI wins this round!';
        const sub = `Score: You ${this.playerScore} — AI ${this.aiScore}`;

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, this.ui.canvasH / 2 - 40, this.ui.canvasW, 80);

        ctx.font = 'bold 20px "Outfit", sans-serif';
        ctx.fillStyle = lastWinner ? '#00e676' : '#ff2d7b';
        ctx.textAlign = 'center';
        ctx.fillText(msg, this.ui.canvasW / 2, this.ui.canvasH / 2 - 5);

        ctx.font = '14px "Outfit", sans-serif';
        ctx.fillStyle = '#e8e8f0';
        ctx.fillText(sub, this.ui.canvasW / 2, this.ui.canvasH / 2 + 22);
    },

    // --- Card drawing ---

    drawCardFace(ctx, x, y, card) {
        // Card body
        ctx.fillStyle = '#ffffff';
        this.roundRect(ctx, x, y, this.CARD_W, this.CARD_H, this.CARD_R);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, this.CARD_W, this.CARD_H, this.CARD_R);
        ctx.stroke();

        const color = this.SUIT_COLORS[card.suit];
        const symbol = this.SUIT_SYMBOLS[card.suit];

        // Rank top-left
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.fillText(card.rank, x + 5, y + 16);

        // Suit top-left
        ctx.font = '12px serif';
        ctx.fillText(symbol, x + 5, y + 30);

        // Center suit large
        ctx.font = 'bold 24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, x + this.CARD_W / 2, y + this.CARD_H / 2);
        ctx.textBaseline = 'alphabetic';

        // Rank bottom-right (upside down effect)
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(card.rank, x + this.CARD_W - 5, y + this.CARD_H - 8);

        // Highlight 8s with glow
        if (card.rank === '8') {
            ctx.strokeStyle = '#ffd60a';
            ctx.lineWidth = 1.5;
            ctx.shadowColor = '#ffd60a';
            ctx.shadowBlur = 6;
            this.roundRect(ctx, x, y, this.CARD_W, this.CARD_H, this.CARD_R);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    },

    drawCardBack(ctx, x, y) {
        // Card body
        const grad = ctx.createLinearGradient(x, y, x + this.CARD_W, y + this.CARD_H);
        grad.addColorStop(0, '#1a1a3e');
        grad.addColorStop(1, '#0e0e24');
        ctx.fillStyle = grad;
        this.roundRect(ctx, x, y, this.CARD_W, this.CARD_H, this.CARD_R);
        ctx.fill();

        ctx.strokeStyle = '#2a2a4e';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, this.CARD_W, this.CARD_H, this.CARD_R);
        ctx.stroke();

        // Diamond pattern
        ctx.strokeStyle = '#252548';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 10; j++) {
                const cx = x + 8 + i * (this.CARD_W - 16) / 7;
                const cy = y + 8 + j * (this.CARD_H - 16) / 9;
                ctx.beginPath();
                ctx.moveTo(cx, cy - 3);
                ctx.lineTo(cx + 2.5, cy);
                ctx.lineTo(cx, cy + 3);
                ctx.lineTo(cx - 2.5, cy);
                ctx.closePath();
                ctx.stroke();
            }
        }
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
    }
};

export default CrazyEights;
