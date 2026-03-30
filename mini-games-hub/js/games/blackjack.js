const Blackjack = {
    canvas: null,
    ctx: null,
    ui: null,
    animFrame: null,

    // Game state
    deck: [],
    playerHand: [],
    dealerHand: [],
    chips: 1000,
    bet: 0,
    phase: 'betting', // 'betting' | 'dealing' | 'playing' | 'dealerTurn' | 'result' | 'gameover'
    result: '',       // 'WIN' | 'LOSE' | 'PUSH' | 'BLACKJACK'
    resultText: '',

    // Animation state
    cardAnims: [],        // {card, targetX, targetY, x, y, startTime, duration, hand, faceUp, flipStart}
    chipAnim: { current: 1000, target: 1000 },
    resultAlpha: 0,
    resultScale: 0,
    particles: [],
    dealerRevealTime: 0,
    dealerRevealFlip: 0,
    dealerHitQueue: [],
    dealerHitDelay: 0,

    // Button definitions
    betButtons: [],
    actionButtons: [],
    dealButton: null,

    // Bound handlers
    _handleKey: null,
    _handleClick: null,
    _handleTouch: null,
    _handleTouchMove: null,

    // Card dimensions
    CARD_W: 70,
    CARD_H: 98,
    CARD_GAP: 28,

    suits: ['hearts', 'diamonds', 'clubs', 'spades'],
    ranks: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;

        this._handleKey = this.handleKey.bind(this);
        this._handleClick = this.handleClick.bind(this);
        this._handleTouch = this.handleTouch.bind(this);
        this._handleTouchMove = (e) => e.preventDefault();

        document.addEventListener('keydown', this._handleKey);
        canvas.addEventListener('click', this._handleClick);
        canvas.addEventListener('touchstart', this._handleTouch, { passive: false });
        canvas.addEventListener('touchmove', this._handleTouchMove, { passive: false });

        this.initButtons();
    },

    initButtons() {
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        const btnW = 100, btnH = 44, gap = 16;

        // Bet buttons
        const bets = [50, 100, 200];
        const totalBetW = bets.length * btnW + (bets.length - 1) * gap;
        const betStartX = (W - totalBetW) / 2;
        this.betButtons = bets.map((amt, i) => ({
            x: betStartX + i * (btnW + gap),
            y: H - 140,
            w: btnW, h: btnH,
            label: `$${amt}`,
            amount: amt,
            hover: false
        }));

        // Deal button
        this.dealButton = {
            x: (W - 120) / 2, y: H - 80,
            w: 120, h: btnH,
            label: 'DEAL', hover: false
        };

        // Action buttons
        const actions = [
            { label: 'HIT', action: 'hit', color: '#00d4ff' },
            { label: 'STAND', action: 'stand', color: '#ffd60a' },
            { label: 'DOUBLE', action: 'double', color: '#ff2d7b' }
        ];
        const totalActW = actions.length * btnW + (actions.length - 1) * gap;
        const actStartX = (W - totalActW) / 2;
        this.actionButtons = actions.map((a, i) => ({
            x: actStartX + i * (btnW + gap),
            y: H - 80,
            w: btnW, h: btnH,
            label: a.label,
            action: a.action,
            color: a.color,
            hover: false
        }));
    },

    start() {
        this.chips = 1000;
        this.bet = 0;
        this.phase = 'betting';
        this.result = '';
        this.resultText = '';
        this.resultAlpha = 0;
        this.resultScale = 0;
        this.particles = [];
        this.cardAnims = [];
        this.playerHand = [];
        this.dealerHand = [];
        this.chipAnim = { current: 1000, target: 1000 };
        this.deck = [];
        this.dealerRevealTime = 0;
        this.dealerRevealFlip = 0;
        this.dealerHitQueue = [];
        this.dealerHitDelay = 0;
        this.ui.hideGameOver();
        this.ui.hidePause();
        this.ui.setScore(1000);
        this.shuffleDeck();
        this.loop();
    },

    pause() {},
    resume() {},

    reset() {
        cancelAnimationFrame(this.animFrame);
        this.animFrame = null;
    },

    destroy() {
        cancelAnimationFrame(this.animFrame);
        this.animFrame = null;
        document.removeEventListener('keydown', this._handleKey);
        if (this.canvas) {
            this.canvas.removeEventListener('click', this._handleClick);
            this.canvas.removeEventListener('touchstart', this._handleTouch);
            this.canvas.removeEventListener('touchmove', this._handleTouchMove);
        }
    },

    // --- Deck ---
    shuffleDeck() {
        this.deck = [];
        for (const suit of this.suits) {
            for (const rank of this.ranks) {
                this.deck.push({ suit, rank });
            }
        }
        // Fisher-Yates
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    },

    drawCard() {
        if (this.deck.length < 10) this.shuffleDeck();
        return this.deck.pop();
    },

    cardValue(card) {
        if (['J', 'Q', 'K'].includes(card.rank)) return 10;
        if (card.rank === 'A') return 11;
        return parseInt(card.rank);
    },

    handValue(hand) {
        let total = 0, aces = 0;
        for (const c of hand) {
            total += this.cardValue(c);
            if (c.rank === 'A') aces++;
        }
        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }
        return total;
    },

    isBlackjack(hand) {
        return hand.length === 2 && this.handValue(hand) === 21;
    },

    // --- Dealing animation helpers ---
    getCardPos(hand, index, isDealer) {
        const W = this.ui.canvasW;
        const totalW = hand.length * this.CARD_W + (hand.length - 1) * this.CARD_GAP;
        const startX = (W - totalW) / 2;
        const y = isDealer ? 80 : 340;
        return {
            x: startX + index * (this.CARD_W + this.CARD_GAP),
            y
        };
    },

    dealInitialCards() {
        this.phase = 'dealing';
        this.playerHand = [];
        this.dealerHand = [];
        this.cardAnims = [];
        this.resultAlpha = 0;
        this.resultScale = 0;
        this.result = '';
        this.resultText = '';

        const cards = [
            { hand: 'player', faceUp: true },
            { hand: 'dealer', faceUp: true },
            { hand: 'player', faceUp: true },
            { hand: 'dealer', faceUp: false }  // hole card
        ];

        const now = performance.now();
        cards.forEach((c, i) => {
            const card = this.drawCard();
            if (c.hand === 'player') this.playerHand.push(card);
            else this.dealerHand.push(card);

            const handArr = c.hand === 'player' ? this.playerHand : this.dealerHand;
            const idx = handArr.length - 1;
            const pos = this.getCardPos(handArr, idx, c.hand === 'dealer');

            // Recalculate positions for all cards in this hand
            this.recalcCardAnimPositions(c.hand);

            const sx = this.ui.canvasW / 2 - this.CARD_W / 2;
            const sy = -this.CARD_H;
            this.cardAnims.push({
                card,
                startX: sx, startY: sy,
                x: sx, y: sy,
                targetX: pos.x,
                targetY: pos.y,
                startTime: now + i * 250,
                duration: 400,
                hand: c.hand,
                faceUp: c.faceUp,
                index: idx,
                flipStart: 0,
                flipProgress: 1
            });
        });

        // After all dealing done, check for blackjack
        setTimeout(() => {
            if (this.phase !== 'dealing') return;
            if (this.isBlackjack(this.playerHand)) {
                this.phase = 'dealerTurn';
                this.revealDealerAndResolve();
            } else {
                this.phase = 'playing';
            }
        }, cards.length * 250 + 500);
    },

    recalcCardAnimPositions(handName) {
        const hand = handName === 'player' ? this.playerHand : this.dealerHand;
        const isDealer = handName === 'dealer';
        for (const anim of this.cardAnims) {
            if (anim.hand === handName) {
                const pos = this.getCardPos(hand, anim.index, isDealer);
                anim.targetX = pos.x;
                anim.targetY = pos.y;
            }
        }
    },

    addCardAnim(card, handName, faceUp) {
        const hand = handName === 'player' ? this.playerHand : this.dealerHand;
        const idx = hand.length - 1;
        const pos = this.getCardPos(hand, idx, handName === 'dealer');

        this.recalcCardAnimPositions(handName);

        const now = performance.now();
        const sx = this.ui.canvasW / 2 - this.CARD_W / 2;
        const sy = -this.CARD_H;
        this.cardAnims.push({
            card,
            startX: sx, startY: sy,
            x: sx, y: sy,
            targetX: pos.x,
            targetY: pos.y,
            startTime: now,
            duration: 350,
            hand: handName,
            faceUp,
            index: idx,
            flipStart: 0,
            flipProgress: 1
        });
    },

    // --- Actions ---
    placeBet(amount) {
        if (this.phase !== 'betting') return;
        if (this.chips < amount) return;
        this.bet = amount;
        this.chips -= amount;
        this.chipAnim.target = this.chips;
        this.ui.setScore(this.chips);
        this.dealInitialCards();
    },

    hit() {
        if (this.phase !== 'playing') return;
        const card = this.drawCard();
        this.playerHand.push(card);
        this.addCardAnim(card, 'player', true);

        setTimeout(() => {
            if (this.handValue(this.playerHand) > 21) {
                this.endRound('LOSE', 'BUST!');
            }
        }, 400);
    },

    stand() {
        if (this.phase !== 'playing') return;
        this.phase = 'dealerTurn';
        this.revealDealerAndResolve();
    },

    doubleDown() {
        if (this.phase !== 'playing') return;
        if (this.playerHand.length !== 2) return;
        if (this.chips < this.bet) return;

        this.chips -= this.bet;
        this.bet *= 2;
        this.chipAnim.target = this.chips;
        this.ui.setScore(this.chips);

        const card = this.drawCard();
        this.playerHand.push(card);
        this.addCardAnim(card, 'player', true);

        setTimeout(() => {
            if (this.handValue(this.playerHand) > 21) {
                this.endRound('LOSE', 'BUST!');
            } else {
                this.phase = 'dealerTurn';
                this.revealDealerAndResolve();
            }
        }, 450);
    },

    revealDealerAndResolve() {
        // Flip the hole card
        const holeAnim = this.cardAnims.find(a => a.hand === 'dealer' && a.index === 1);
        if (holeAnim && !holeAnim.faceUp) {
            holeAnim.flipStart = performance.now();
            holeAnim.flipProgress = 0;
            holeAnim.faceUp = true;
        }

        // Dealer draws after reveal
        setTimeout(() => this.dealerDraw(), 600);
    },

    dealerDraw() {
        if (this.handValue(this.dealerHand) < 17) {
            const card = this.drawCard();
            this.dealerHand.push(card);
            this.addCardAnim(card, 'dealer', true);
            setTimeout(() => this.dealerDraw(), 500);
        } else {
            setTimeout(() => this.resolveRound(), 300);
        }
    },

    resolveRound() {
        const pv = this.handValue(this.playerHand);
        const dv = this.handValue(this.dealerHand);
        const playerBJ = this.isBlackjack(this.playerHand);
        const dealerBJ = this.isBlackjack(this.dealerHand);

        if (playerBJ && dealerBJ) {
            this.endRound('PUSH', 'Both Blackjack - Push');
        } else if (playerBJ) {
            this.endRound('BLACKJACK', 'BLACKJACK!');
        } else if (dealerBJ) {
            this.endRound('LOSE', 'Dealer Blackjack');
        } else if (pv > 21) {
            this.endRound('LOSE', 'BUST!');
        } else if (dv > 21) {
            this.endRound('WIN', 'Dealer Busts!');
        } else if (pv > dv) {
            this.endRound('WIN', 'You Win!');
        } else if (dv > pv) {
            this.endRound('LOSE', 'Dealer Wins');
        } else {
            this.endRound('PUSH', 'Push');
        }
    },

    endRound(result, text) {
        this.result = result;
        this.resultText = text;
        this.resultAlpha = 0;
        this.resultScale = 0;

        // Calculate payout
        if (result === 'BLACKJACK') {
            this.chips += this.bet + Math.floor(this.bet * 1.5);
        } else if (result === 'WIN') {
            this.chips += this.bet * 2;
        } else if (result === 'PUSH') {
            this.chips += this.bet;
        }
        // LOSE: bet already deducted

        this.chipAnim.target = this.chips;
        this.ui.setScore(this.chips);

        // Update high score
        const best = this.ui.getHighScore() || 0;
        if (this.chips > best) {
            this.ui.setHighScore(this.chips);
        }

        // Particles on blackjack or big win
        if (result === 'BLACKJACK' || (result === 'WIN' && this.bet >= 200)) {
            this.spawnParticles(this.ui.canvasW / 2, 270, 30);
        }

        this.phase = 'result';

        // Check game over or allow next hand
        setTimeout(() => {
            if (this.chips <= 0) {
                this.phase = 'gameover';
                this.ui.showGameOver(0, this.ui.getHighScore() || 0);
            } else {
                this.phase = 'betting';
                this.bet = 0;
                this.result = '';
                this.resultText = '';
                this.resultAlpha = 0;
                this.resultScale = 0;
                this.cardAnims = [];
                this.playerHand = [];
                this.dealerHand = [];
            }
        }, 2500);
    },

    spawnParticles(cx, cy, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            const colors = ['#ffd60a', '#00e676', '#00d4ff', '#ff2d7b'];
            this.particles.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 1,
                decay: 0.01 + Math.random() * 0.015,
                size: 2 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
    },

    // --- Input ---
    handleKey(e) {
        if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
            e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
        }

        if (this.phase === 'betting') {
            if (e.key === '1') this.placeBet(50);
            else if (e.key === '2') this.placeBet(100);
            else if (e.key === '3') this.placeBet(200);
        } else if (this.phase === 'playing') {
            const k = e.key.toLowerCase();
            if (k === 'h') this.hit();
            else if (k === 's') this.stand();
            else if (k === 'd') this.doubleDown();
        }
    },

    getClickPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.ui.canvasW / rect.width;
        const scaleY = this.ui.canvasH / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    },

    handleClick(e) {
        const pos = this.getClickPos(e);
        this.processClick(pos.x, pos.y);
    },

    handleTouch(e) {
        e.preventDefault();
        if (e.touches.length > 0) {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.ui.canvasW / rect.width;
            const scaleY = this.ui.canvasH / rect.height;
            const x = (e.touches[0].clientX - rect.left) * scaleX;
            const y = (e.touches[0].clientY - rect.top) * scaleY;
            this.processClick(x, y);
        }
    },

    processClick(x, y) {
        if (this.phase === 'betting') {
            for (const btn of this.betButtons) {
                if (this.inRect(x, y, btn)) {
                    this.placeBet(btn.amount);
                    return;
                }
            }
        } else if (this.phase === 'playing') {
            for (const btn of this.actionButtons) {
                if (this.inRect(x, y, btn)) {
                    if (btn.action === 'hit') this.hit();
                    else if (btn.action === 'stand') this.stand();
                    else if (btn.action === 'double') this.doubleDown();
                    return;
                }
            }
        }
    },

    inRect(px, py, btn) {
        return px >= btn.x && px <= btn.x + btn.w && py >= btn.y && py <= btn.y + btn.h;
    },

    // --- Rendering ---
    loop() {
        this.update();
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update() {
        const now = performance.now();

        // Animate card positions
        for (const a of this.cardAnims) {
            const elapsed = now - a.startTime;
            if (elapsed < 0) continue; // not started yet (staggered dealing)
            const t = Math.min(1, elapsed / a.duration);
            const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
            a.x = a.startX + (a.targetX - a.startX) * ease;
            a.y = a.startY + (a.targetY - a.startY) * ease;

            // Flip animation
            if (a.flipStart > 0) {
                const flipElapsed = now - a.flipStart;
                a.flipProgress = Math.min(1, flipElapsed / 300);
            }
        }

        // Chip counter animation
        const diff = this.chipAnim.target - this.chipAnim.current;
        if (Math.abs(diff) > 0.5) {
            this.chipAnim.current += diff * 0.08;
        } else {
            this.chipAnim.current = this.chipAnim.target;
        }

        // Result text animation
        if (this.phase === 'result' || (this.result && this.resultAlpha < 1)) {
            this.resultAlpha = Math.min(1, this.resultAlpha + 0.04);
            this.resultScale = Math.min(1, this.resultScale + 0.06);
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.08;
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    },

    render() {
        const ctx = this.ctx;
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Green felt table
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(W / 2, H / 2 - 20, W * 0.44, H * 0.38, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#0d3320';
        ctx.fill();
        ctx.strokeStyle = '#1a5c3a';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();

        // Dealer label
        ctx.fillStyle = '#8888a0';
        ctx.font = '14px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DEALER', W / 2, 60);

        // Player label
        ctx.fillText('PLAYER', W / 2, 330);

        // Draw cards
        this.renderCards(ctx);

        // Hand values
        if (this.playerHand.length > 0) {
            const pv = this.handValue(this.playerHand);
            this.drawHandValue(ctx, pv, W / 2, 455, false);
        }
        if (this.dealerHand.length > 0) {
            const showAll = this.phase === 'dealerTurn' || this.phase === 'result' ||
                            this.phase === 'gameover' || this.phase === 'betting' && this.result;
            if (showAll) {
                const dv = this.handValue(this.dealerHand);
                this.drawHandValue(ctx, dv, W / 2, 195, true);
            } else if (this.dealerHand.length >= 1) {
                const firstVal = this.cardValue(this.dealerHand[0]);
                this.drawHandValue(ctx, firstVal, W / 2, 195, true, true);
            }
        }

        // Chip display
        this.renderChips(ctx, W, H);

        // Bet display
        if (this.bet > 0 && this.phase !== 'gameover') {
            ctx.fillStyle = '#ffd60a';
            ctx.font = 'bold 18px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`BET: $${this.bet}`, W / 2, H - 170);
        }

        // Buttons
        if (this.phase === 'betting') {
            this.renderBetButtons(ctx);
        } else if (this.phase === 'playing') {
            this.renderActionButtons(ctx);
        }

        // Result text
        if (this.result && this.resultAlpha > 0) {
            this.renderResult(ctx, W, H);
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

    renderCards(ctx) {
        for (const a of this.cardAnims) {
            const flip = a.flipProgress !== undefined ? a.flipProgress : 1;
            const showFace = a.faceUp;

            ctx.save();
            ctx.translate(a.x + this.CARD_W / 2, a.y + this.CARD_H / 2);

            if (a.flipStart > 0 && flip < 1) {
                // Flip animation: scale X through 0 and back
                let scaleX;
                if (flip < 0.5) {
                    scaleX = 1 - flip * 2;  // 1 -> 0 (showing back)
                } else {
                    scaleX = (flip - 0.5) * 2;  // 0 -> 1 (showing face)
                }
                ctx.scale(scaleX, 1);

                if (flip < 0.5) {
                    this.drawCardBack(ctx, -this.CARD_W / 2, -this.CARD_H / 2);
                } else {
                    this.drawCardFace(ctx, a.card, -this.CARD_W / 2, -this.CARD_H / 2);
                }
            } else if (showFace) {
                this.drawCardFace(ctx, a.card, -this.CARD_W / 2, -this.CARD_H / 2);
            } else {
                this.drawCardBack(ctx, -this.CARD_W / 2, -this.CARD_H / 2);
            }
            ctx.restore();
        }
    },

    drawCardFace(ctx, card, x, y) {
        const W = this.CARD_W, H = this.CARD_H;
        const r = 6;

        // Card background
        ctx.fillStyle = '#f0f0e8';
        this.roundRect(ctx, x, y, W, H, r);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, W, H, r);
        ctx.stroke();

        // Color
        const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
        ctx.fillStyle = isRed ? '#ff2d7b' : '#1a1a2e';

        // Rank top-left
        ctx.font = 'bold 16px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(card.rank, x + 6, y + 18);

        // Suit symbol
        const suitSymbol = { hearts: '\u2665', diamonds: '\u2666', clubs: '\u2663', spades: '\u2660' }[card.suit];
        ctx.font = '14px sans-serif';
        ctx.fillText(suitSymbol, x + 6, y + 34);

        // Large center suit
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(suitSymbol, x + W / 2, y + H / 2 + 10);

        // Rank bottom-right (upside down)
        ctx.save();
        ctx.translate(x + W - 6, y + H - 6);
        ctx.rotate(Math.PI);
        ctx.font = 'bold 16px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(card.rank, 0, 12);
        ctx.font = '14px sans-serif';
        ctx.fillText(suitSymbol, 0, 28);
        ctx.restore();
    },

    drawCardBack(ctx, x, y) {
        const W = this.CARD_W, H = this.CARD_H;
        const r = 6;

        // Card background
        const grad = ctx.createLinearGradient(x, y, x + W, y + H);
        grad.addColorStop(0, '#1a1a3e');
        grad.addColorStop(1, '#0d0d2a');
        ctx.fillStyle = grad;
        this.roundRect(ctx, x, y, W, H, r);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#3a3a6e';
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, x, y, W, H, r);
        ctx.stroke();

        // Diamond pattern
        ctx.strokeStyle = 'rgba(100,100,180,0.3)';
        ctx.lineWidth = 0.8;
        const step = 12;
        for (let i = 0; i < W + H; i += step) {
            ctx.beginPath();
            ctx.moveTo(x + i, y);
            ctx.lineTo(x, y + i);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + W - i, y);
            ctx.lineTo(x + W, y + i);
            ctx.stroke();
        }

        // Center diamond
        ctx.fillStyle = '#4a4a8e';
        ctx.beginPath();
        ctx.moveTo(x + W / 2, y + H / 2 - 12);
        ctx.lineTo(x + W / 2 + 8, y + H / 2);
        ctx.lineTo(x + W / 2, y + H / 2 + 12);
        ctx.lineTo(x + W / 2 - 8, y + H / 2);
        ctx.closePath();
        ctx.fill();
    },

    drawHandValue(ctx, val, x, y, isDealer, hasHidden) {
        ctx.fillStyle = '#e8e8f0';
        ctx.font = 'bold 20px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        const text = hasHidden ? `${val} + ?` : `${val}`;
        ctx.fillText(text, x, y);
    },

    renderChips(ctx, W, H) {
        const chipVal = Math.round(this.chipAnim.current);
        ctx.fillStyle = '#e8e8f0';
        ctx.font = 'bold 22px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`$${chipVal}`, W / 2, H - 195);

        // Chip icon
        const cx = W / 2 - 60;
        const cy = H - 202;
        const chipColors = ['#ff2d7b', '#00d4ff', '#ffd60a'];
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(cx - i * 6, cy + i * 2, 10, 0, Math.PI * 2);
            ctx.fillStyle = chipColors[i];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    },

    renderBetButtons(ctx) {
        for (const btn of this.betButtons) {
            const canAfford = this.chips >= btn.amount;
            ctx.fillStyle = canAfford ? '#1a5c3a' : '#333';
            this.roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 10);
            ctx.fill();

            ctx.strokeStyle = canAfford ? '#00e676' : '#555';
            ctx.lineWidth = 2;
            this.roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 10);
            ctx.stroke();

            ctx.fillStyle = canAfford ? '#e8e8f0' : '#666';
            ctx.font = 'bold 18px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 6);
        }

        // Deal button hint
        ctx.fillStyle = '#8888a0';
        ctx.font = '13px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Press 1, 2, or 3 to bet', this.ui.canvasW / 2, this.ui.canvasH - 45);
    },

    renderActionButtons(ctx) {
        for (const btn of this.actionButtons) {
            let enabled = true;
            if (btn.action === 'double' && (this.playerHand.length !== 2 || this.chips < this.bet)) {
                enabled = false;
            }

            ctx.fillStyle = enabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)';
            this.roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 10);
            ctx.fill();

            ctx.strokeStyle = enabled ? btn.color : '#444';
            ctx.lineWidth = 2;
            this.roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 10);
            ctx.stroke();

            ctx.fillStyle = enabled ? btn.color : '#555';
            ctx.font = 'bold 16px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 6);
        }

        // Controls hint
        ctx.fillStyle = '#8888a0';
        ctx.font = '13px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('H = Hit  |  S = Stand  |  D = Double', this.ui.canvasW / 2, this.ui.canvasH - 30);
    },

    renderResult(ctx, W, H) {
        const colors = {
            'WIN': '#00e676',
            'LOSE': '#ff2d7b',
            'PUSH': '#ffd60a',
            'BLACKJACK': '#ffd60a'
        };

        ctx.save();
        ctx.globalAlpha = this.resultAlpha;

        // Background dim
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 220, W, 80);

        // Result text
        const scale = 0.5 + this.resultScale * 0.5;
        ctx.translate(W / 2, 265);
        ctx.scale(scale, scale);

        ctx.fillStyle = colors[this.result] || '#e8e8f0';
        ctx.font = 'bold 36px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Glow for blackjack
        if (this.result === 'BLACKJACK') {
            ctx.shadowColor = '#ffd60a';
            ctx.shadowBlur = 30;
        }

        ctx.fillText(this.resultText, 0, 0);
        ctx.shadowBlur = 0;

        ctx.restore();
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

export default Blackjack;
