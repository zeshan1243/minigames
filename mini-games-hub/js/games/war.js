const War = {
    canvas: null,
    ctx: null,
    ui: null,
    animFrame: null,
    paused: false,
    gameOver: false,

    // Decks
    playerDeck: [],
    aiDeck: [],
    playerWonPile: [],
    aiWonPile: [],

    // Battle state
    battleCards: [],      // { card, x, y, targetX, targetY, faceUp, flipProgress, owner }
    warCards: [],          // extra war cards on the field
    roundResult: null,     // 'player' | 'ai' | 'war' | null
    resultText: '',
    resultAlpha: 0,
    resultScale: 0,
    warTextScale: 0,
    warTextAlpha: 0,

    // Counters
    score: 0,
    rounds: 0,
    bestRounds: Infinity,

    // Timing
    phase: 'idle',  // 'idle' | 'dealing' | 'flipping' | 'result' | 'collecting' | 'war-dealing' | 'war-flipping' | 'war-result' | 'gameover'
    phaseTimer: 0,
    lastTime: 0,

    // Animations
    particles: [],
    shakeX: 0,
    shakeY: 0,
    shakeMag: 0,
    cardAnimations: [],  // { card, startX, startY, endX, endY, startTime, duration, easing, onDone, faceUp, flipAt }

    // Card dimensions
    CARD_W: 70,
    CARD_H: 98,
    CARD_R: 8,

    // Colors
    BG: '#0a0a0f',
    CARD_BACK_1: '#1a1a2e',
    CARD_BACK_2: '#12121a',
    RED_SUIT: '#cc0000',
    BLACK_SUIT: '#111111',
    ACCENT_CYAN: '#00d4ff',
    ACCENT_YELLOW: '#ffd60a',
    ACCENT_GREEN: '#00e676',

    SUITS: ['♠', '♥', '♦', '♣'],
    RANKS: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'],

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
        canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    },

    start() {
        this.reset();
        this.gameOver = false;
        this.paused = false;
        this.ui.hideGameOver();
        this.ui.hidePause();
        this.lastTime = performance.now();
        this.loop();
    },

    reset() {
        cancelAnimationFrame(this.animFrame);
        this.playerDeck = [];
        this.aiDeck = [];
        this.battleCards = [];
        this.warCards = [];
        this.cardAnimations = [];
        this.particles = [];
        this.roundResult = null;
        this.resultText = '';
        this.resultAlpha = 0;
        this.resultScale = 0;
        this.warTextScale = 0;
        this.warTextAlpha = 0;
        this.score = 0;
        this.rounds = 0;
        this.phase = 'idle';
        this.phaseTimer = 0;
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeMag = 0;
        this.gameOver = false;
        this.paused = false;

        // Build and shuffle deck
        const deck = [];
        for (const suit of this.SUITS) {
            for (let r = 0; r < this.RANKS.length; r++) {
                deck.push({ suit, rank: this.RANKS[r], value: r + 2 });
            }
        }
        this.shuffleArray(deck);
        this.playerDeck = deck.slice(0, 26);
        this.aiDeck = deck.slice(26);
        this.score = 26;
        this.ui.setScore(26);
    },

    shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    },

    handleKey(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            if (this.gameOver) return;
            if (this.paused) return;
            this.triggerNextRound();
        }
        if (e.code === 'KeyP') {
            if (this.gameOver) return;
            this.togglePause();
        }
    },

    handleClick() {
        if (this.gameOver) return;
        if (this.paused) return;
        this.triggerNextRound();
    },

    handleTouch(e) {
        e.preventDefault();
        if (this.gameOver) return;
        if (this.paused) return;
        this.triggerNextRound();
    },

    togglePause() {
        this.paused = !this.paused;
        if (this.paused) {
            this.ui.showPause();
        } else {
            this.ui.hidePause();
            this.lastTime = performance.now();
            this.loop();
        }
    },

    triggerNextRound() {
        if (this.phase !== 'idle') return;
        if (this.playerDeck.length === 0 || this.aiDeck.length === 0) return;
        this.startBattle();
    },

    startBattle() {
        this.rounds++;
        this.battleCards = [];
        this.warCards = [];
        this.roundResult = null;
        this.resultText = '';
        this.resultAlpha = 0;
        this.resultScale = 0;
        this.warTextScale = 0;
        this.warTextAlpha = 0;
        this.phase = 'dealing';
        this.cardAnimations = [];

        const pCard = this.playerDeck.shift();
        const aCard = this.aiDeck.shift();

        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        const centerY = H / 2;

        // Player card: from bottom deck to center-left
        const pTarget = { x: W / 2 - this.CARD_W - 10, y: centerY - this.CARD_H / 2 };
        const pStart = { x: W / 2 - this.CARD_W / 2, y: H - 70 };

        // AI card: from top deck to center-right
        const aTarget = { x: W / 2 + 10, y: centerY - this.CARD_H / 2 };
        const aStart = { x: W / 2 - this.CARD_W / 2, y: -30 };

        const pBattle = { card: pCard, x: pStart.x, y: pStart.y, faceUp: false, flipProgress: 0, owner: 'player' };
        const aBattle = { card: aCard, x: aStart.x, y: aStart.y, faceUp: false, flipProgress: 0, owner: 'ai' };
        this.battleCards = [pBattle, aBattle];

        const now = performance.now();

        // Animate dealing
        this.cardAnimations.push({
            target: pBattle, startX: pStart.x, startY: pStart.y,
            endX: pTarget.x, endY: pTarget.y,
            startTime: now, duration: 400, easing: 'easeOutCubic',
            flipAt: 0.6, faceUpAfterFlip: true
        });
        this.cardAnimations.push({
            target: aBattle, startX: aStart.x, startY: aStart.y,
            endX: aTarget.x, endY: aTarget.y,
            startTime: now + 100, duration: 400, easing: 'easeOutCubic',
            flipAt: 0.6, faceUpAfterFlip: true
        });

        // After both dealt + flipped, evaluate
        this.schedulePhase('flipping', 700);
    },

    schedulePhase(phase, delay) {
        this.phaseTimer = performance.now() + delay;
        this._pendingPhase = phase;
    },

    checkPendingPhase(now) {
        if (this._pendingPhase && now >= this.phaseTimer) {
            this.phase = this._pendingPhase;
            this._pendingPhase = null;
            this.onPhaseEnter(this.phase);
        }
    },

    onPhaseEnter(phase) {
        if (phase === 'flipping') {
            this.evaluateBattle();
        } else if (phase === 'collecting') {
            this.collectCards();
        } else if (phase === 'war-dealing') {
            this.dealWarCards();
        } else if (phase === 'war-flipping') {
            this.evaluateWar();
        } else if (phase === 'gameover') {
            this.endGame();
        }
    },

    evaluateBattle() {
        const pCard = this.battleCards[0].card;
        const aCard = this.battleCards[1].card;

        if (pCard.value > aCard.value) {
            this.roundResult = 'player';
            this.resultText = 'YOU WIN!';
            this.resultAlpha = 0;
            this.resultScale = 0.5;
            this.spawnParticles(this.ui.canvasW / 2, this.ui.canvasH / 2, 15, this.ACCENT_GREEN);
            this.schedulePhase('collecting', 1200);
        } else if (aCard.value > pCard.value) {
            this.roundResult = 'ai';
            this.resultText = 'AI WINS!';
            this.resultAlpha = 0;
            this.resultScale = 0.5;
            this.schedulePhase('collecting', 1200);
        } else {
            this.roundResult = 'war';
            this.resultText = 'WAR!';
            this.warTextScale = 2.5;
            this.warTextAlpha = 0;
            this.shakeMag = 8;
            this.spawnParticles(this.ui.canvasW / 2, this.ui.canvasH / 2, 25, this.ACCENT_YELLOW);
            this.schedulePhase('war-dealing', 1200);
        }
        this.phase = 'result';
    },

    collectCards() {
        const allCards = [
            ...this.battleCards.map(b => b.card),
            ...this.warCards.map(w => w.card)
        ];
        const now = performance.now();
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;

        if (this.roundResult === 'player') {
            // Animate cards to player deck
            const targets = [...this.battleCards, ...this.warCards];
            targets.forEach((b, i) => {
                this.cardAnimations.push({
                    target: b,
                    startX: b.x, startY: b.y,
                    endX: W / 2 - this.CARD_W / 2, endY: H - 70,
                    startTime: now + i * 80, duration: 500, easing: 'easeInOutQuad',
                    faceUpAfterFlip: false, flipAt: 0.4
                });
            });
            // Add cards to bottom of player deck after animation
            setTimeout(() => {
                this.shuffleArray(allCards);
                this.playerDeck.push(...allCards);
                this.score = this.playerDeck.length;
                this.ui.setScore(this.score);
                this.battleCards = [];
                this.warCards = [];
                this.checkGameEnd();
            }, 600);
        } else {
            const targets = [...this.battleCards, ...this.warCards];
            targets.forEach((b, i) => {
                this.cardAnimations.push({
                    target: b,
                    startX: b.x, startY: b.y,
                    endX: W / 2 - this.CARD_W / 2, endY: -30,
                    startTime: now + i * 80, duration: 500, easing: 'easeInOutQuad',
                    faceUpAfterFlip: false, flipAt: 0.4
                });
            });
            setTimeout(() => {
                this.shuffleArray(allCards);
                this.aiDeck.push(...allCards);
                this.score = this.playerDeck.length;
                this.ui.setScore(this.score);
                this.battleCards = [];
                this.warCards = [];
                this.checkGameEnd();
            }, 600);
        }

        this.phase = 'collecting';
        this.schedulePhase('idle', 700);
    },

    checkGameEnd() {
        if (this.playerDeck.length === 0 || this.aiDeck.length === 0) {
            this.schedulePhase('gameover', 300);
        }
    },

    dealWarCards() {
        // Check if players have enough cards for war
        if (this.playerDeck.length < 4) {
            this.roundResult = 'ai';
            this.resultText = 'NOT ENOUGH CARDS!';
            this.resultAlpha = 0;
            this.resultScale = 0.5;
            // Give remaining player cards to AI
            const remaining = [...this.battleCards.map(b => b.card), ...this.warCards.map(w => w.card)];
            this.aiDeck.push(...remaining, ...this.playerDeck.splice(0));
            this.battleCards = [];
            this.warCards = [];
            this.score = 0;
            this.ui.setScore(0);
            this.schedulePhase('gameover', 1500);
            this.phase = 'result';
            return;
        }
        if (this.aiDeck.length < 4) {
            this.roundResult = 'player';
            this.resultText = 'AI OUT OF CARDS!';
            this.resultAlpha = 0;
            this.resultScale = 0.5;
            const remaining = [...this.battleCards.map(b => b.card), ...this.warCards.map(w => w.card)];
            this.playerDeck.push(...remaining, ...this.aiDeck.splice(0));
            this.battleCards = [];
            this.warCards = [];
            this.score = this.playerDeck.length;
            this.ui.setScore(this.score);
            this.schedulePhase('gameover', 1500);
            this.phase = 'result';
            return;
        }

        const now = performance.now();
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        const centerY = H / 2;

        // 3 face-down cards + 1 face-up card per player
        const pFaceDown = [];
        const aFaceDown = [];
        for (let i = 0; i < 3; i++) {
            pFaceDown.push(this.playerDeck.shift());
            aFaceDown.push(this.aiDeck.shift());
        }
        const pFaceUp = this.playerDeck.shift();
        const aFaceUp = this.aiDeck.shift();

        // Layout: war cards spread to the left and right
        const spacing = this.CARD_W * 0.4;
        const startXPlayer = W / 2 - this.CARD_W - 10 - (3 * spacing) - this.CARD_W;
        const startXAI = W / 2 + 10 + this.CARD_W + spacing;

        // Player face-down cards
        for (let i = 0; i < 3; i++) {
            const wCard = {
                card: pFaceDown[i],
                x: W / 2 - this.CARD_W / 2, y: H - 70,
                faceUp: false, flipProgress: 0, owner: 'player'
            };
            this.warCards.push(wCard);
            const tx = startXPlayer + i * spacing;
            const ty = centerY + 15;
            this.cardAnimations.push({
                target: wCard,
                startX: wCard.x, startY: wCard.y,
                endX: tx, endY: ty,
                startTime: now + i * 150, duration: 350, easing: 'easeOutCubic'
            });
        }

        // Player face-up card
        const pUp = {
            card: pFaceUp,
            x: W / 2 - this.CARD_W / 2, y: H - 70,
            faceUp: false, flipProgress: 0, owner: 'player'
        };
        this.warCards.push(pUp);
        this.cardAnimations.push({
            target: pUp,
            startX: pUp.x, startY: pUp.y,
            endX: startXPlayer + 3 * spacing, endY: centerY + 15,
            startTime: now + 450, duration: 400, easing: 'easeOutCubic',
            flipAt: 0.6, faceUpAfterFlip: true
        });

        // AI face-down cards
        for (let i = 0; i < 3; i++) {
            const wCard = {
                card: aFaceDown[i],
                x: W / 2 - this.CARD_W / 2, y: -30,
                faceUp: false, flipProgress: 0, owner: 'ai'
            };
            this.warCards.push(wCard);
            const tx = startXAI + i * spacing;
            const ty = centerY - this.CARD_H - 15;
            this.cardAnimations.push({
                target: wCard,
                startX: wCard.x, startY: wCard.y,
                endX: tx, endY: ty,
                startTime: now + i * 150, duration: 350, easing: 'easeOutCubic'
            });
        }

        // AI face-up card
        const aUp = {
            card: aFaceUp,
            x: W / 2 - this.CARD_W / 2, y: -30,
            faceUp: false, flipProgress: 0, owner: 'ai'
        };
        this.warCards.push(aUp);
        this.cardAnimations.push({
            target: aUp,
            startX: aUp.x, startY: aUp.y,
            endX: startXAI + 3 * spacing, endY: centerY - this.CARD_H - 15,
            startTime: now + 450, duration: 400, easing: 'easeOutCubic',
            flipAt: 0.6, faceUpAfterFlip: true
        });

        this.score = this.playerDeck.length;
        this.ui.setScore(this.score);

        // Store the face-up cards for evaluation
        this._warFaceUpPlayer = pUp;
        this._warFaceUpAI = aUp;

        this.phase = 'war-dealing';
        this.schedulePhase('war-flipping', 1100);
    },

    evaluateWar() {
        const pCard = this._warFaceUpPlayer.card;
        const aCard = this._warFaceUpAI.card;

        if (pCard.value > aCard.value) {
            this.roundResult = 'player';
            this.resultText = 'YOU WIN THE WAR!';
            this.resultAlpha = 0;
            this.resultScale = 0.5;
            this.spawnParticles(this.ui.canvasW / 2, this.ui.canvasH / 2, 30, this.ACCENT_GREEN);
            this.schedulePhase('collecting', 1400);
            this.phase = 'result';
        } else if (aCard.value > pCard.value) {
            this.roundResult = 'ai';
            this.resultText = 'AI WINS THE WAR!';
            this.resultAlpha = 0;
            this.resultScale = 0.5;
            this.schedulePhase('collecting', 1400);
            this.phase = 'result';
        } else {
            // Another tie during war - war again!
            this.roundResult = 'war';
            this.resultText = 'DOUBLE WAR!';
            this.warTextScale = 2.5;
            this.warTextAlpha = 0;
            this.shakeMag = 12;
            this.spawnParticles(this.ui.canvasW / 2, this.ui.canvasH / 2, 35, this.RED_SUIT);
            this.phase = 'result';
            this.schedulePhase('war-dealing', 1400);
        }
    },

    endGame() {
        this.gameOver = true;
        this.phase = 'gameover';
        const won = this.playerDeck.length > this.aiDeck.length;

        if (won) {
            // High score = fewest rounds to win
            const best = this.ui.getHighScore();
            if (best === 0 || this.rounds < best) {
                this.ui.setHighScore(this.rounds);
            }
            this.spawnParticles(this.ui.canvasW / 2, this.ui.canvasH / 2, 80, this.ACCENT_CYAN);
            this.spawnParticles(this.ui.canvasW / 2, this.ui.canvasH / 2, 60, this.ACCENT_GREEN);
            this.spawnParticles(this.ui.canvasW / 2, this.ui.canvasH / 2, 60, this.ACCENT_YELLOW);
            this.victoryPulse = 0;
        }

        const bestScore = this.ui.getHighScore();
        this.ui.showGameOver(
            won ? `WON in ${this.rounds} rounds!` : `Lost after ${this.rounds} rounds`,
            bestScore > 0 ? `Best: ${bestScore} rounds` : 'No wins yet'
        );
    },

    // --- Easing functions ---
    easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); },
    easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
    easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    easeOutElastic(t) {
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
    },

    getEasing(name) {
        switch (name) {
            case 'easeOutCubic': return this.easeOutCubic;
            case 'easeInOutQuad': return this.easeInOutQuad;
            case 'easeOutBack': return this.easeOutBack;
            default: return this.easeOutCubic;
        }
    },

    // --- Particles ---
    spawnParticles(cx, cy, count, color) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            this.particles.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                life: 1,
                decay: 0.008 + Math.random() * 0.015,
                size: 2 + Math.random() * 4,
                color: color
            });
        }
    },

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt * 60;
            p.y += p.vy * dt * 60;
            p.vy += 0.05 * dt * 60;
            p.life -= p.decay * dt * 60;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    },

    // --- Main loop ---
    loop() {
        if (this.paused) return;
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;

        this.update(now, dt);
        this.render(now);

        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update(now, dt) {
        // Check pending phase transitions
        this.checkPendingPhase(now);

        // Update card animations
        for (let i = this.cardAnimations.length - 1; i >= 0; i--) {
            const a = this.cardAnimations[i];
            let t = (now - a.startTime) / a.duration;
            if (t < 0) continue; // hasn't started yet
            if (t > 1) t = 1;
            const easeFn = this.getEasing(a.easing);
            const et = easeFn(t);

            a.target.x = a.startX + (a.endX - a.startX) * et;
            a.target.y = a.startY + (a.endY - a.startY) * et;

            // Flip animation
            if (a.flipAt !== undefined) {
                if (t >= a.flipAt) {
                    const flipT = (t - a.flipAt) / (1 - a.flipAt);
                    if (flipT < 0.5) {
                        a.target.flipProgress = flipT * 2; // 0 to 1 (shrinking)
                    } else {
                        a.target.flipProgress = (1 - flipT) * 2; // 1 to 0 (expanding)
                        if (a.faceUpAfterFlip !== undefined) {
                            a.target.faceUp = a.faceUpAfterFlip;
                        }
                    }
                }
            } else if (a.faceUpAfterFlip !== undefined && t > 0.5) {
                // Simple flip at midpoint
                const flipT = (t - 0.3) / 0.4;
                if (flipT >= 0 && flipT <= 1) {
                    if (flipT < 0.5) {
                        a.target.flipProgress = flipT * 2;
                    } else {
                        a.target.flipProgress = (1 - flipT) * 2;
                        a.target.faceUp = a.faceUpAfterFlip;
                    }
                }
            }

            if (t >= 1) {
                a.target.flipProgress = 0;
                this.cardAnimations.splice(i, 1);
            }
        }

        // Update particles
        this.updateParticles(dt);

        // Update screen shake
        if (this.shakeMag > 0.1) {
            this.shakeMag *= 0.9;
            this.shakeX = (Math.random() - 0.5) * this.shakeMag * 2;
            this.shakeY = (Math.random() - 0.5) * this.shakeMag * 2;
        } else {
            this.shakeMag = 0;
            this.shakeX = 0;
            this.shakeY = 0;
        }

        // Animate result text
        if (this.roundResult && this.phase === 'result') {
            if (this.roundResult === 'war') {
                this.warTextAlpha = Math.min(1, this.warTextAlpha + dt * 4);
                this.warTextScale += (1 - this.warTextScale) * dt * 8;
            } else {
                this.resultAlpha = Math.min(1, this.resultAlpha + dt * 4);
                this.resultScale += (1 - this.resultScale) * dt * 6;
            }
        }

        // Victory pulse
        if (this.gameOver && this.playerDeck.length >= 52 && this.victoryPulse !== undefined) {
            this.victoryPulse += dt * 3;
            // Continuous particles
            if (Math.random() < dt * 20) {
                const W = this.ui.canvasW;
                const H = this.ui.canvasH;
                this.spawnParticles(
                    Math.random() * W, Math.random() * H,
                    3, [this.ACCENT_CYAN, this.ACCENT_GREEN, this.ACCENT_YELLOW, this.RED_SUIT][Math.floor(Math.random() * 4)]
                );
            }
        }
    },

    render(now) {
        const ctx = this.ctx;
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;

        ctx.save();
        ctx.translate(this.shakeX, this.shakeY);

        // Background
        ctx.fillStyle = this.BG;
        ctx.fillRect(-10, -10, W + 20, H + 20);

        // Subtle background glow
        const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 350);
        grad.addColorStop(0, 'rgba(0, 212, 255, 0.03)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Divider line
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(50, H / 2);
        ctx.lineTo(W - 50, H / 2);
        ctx.stroke();

        // "AI" label
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.font = 'bold 14px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('OPPONENT', W / 2, 30);

        // "YOU" label
        ctx.fillText('YOU', W / 2, H - 15);

        // Draw AI deck
        if (this.aiDeck.length > 0) {
            this.drawCardStack(ctx, W / 2 - this.CARD_W / 2, 40, Math.min(3, this.aiDeck.length));
            // Card count badge
            this.drawBadge(ctx, W / 2 + this.CARD_W / 2 + 15, 40 + this.CARD_H / 2, this.aiDeck.length, '#ff2d7b');
        }

        // Draw player deck
        if (this.playerDeck.length > 0) {
            this.drawCardStack(ctx, W / 2 - this.CARD_W / 2, H - 70 - this.CARD_H, Math.min(3, this.playerDeck.length));
            // Card count badge
            this.drawBadge(ctx, W / 2 + this.CARD_W / 2 + 15, H - 70 - this.CARD_H / 2, this.playerDeck.length, this.ACCENT_CYAN);
        }

        // Draw war cards
        for (const wc of this.warCards) {
            this.drawAnimatedCard(ctx, wc);
        }

        // Draw battle cards
        for (const bc of this.battleCards) {
            this.drawAnimatedCard(ctx, bc);
        }

        // Draw result text
        if (this.roundResult === 'war' && this.warTextAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = this.warTextAlpha;
            ctx.translate(W / 2, H / 2);
            ctx.scale(this.warTextScale, this.warTextScale);
            ctx.font = 'bold 64px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Glow
            ctx.shadowColor = this.ACCENT_YELLOW;
            ctx.shadowBlur = 30;
            ctx.fillStyle = this.ACCENT_YELLOW;
            ctx.fillText('WAR!', 0, 0);
            ctx.shadowBlur = 0;
            ctx.restore();
        } else if (this.resultText && this.resultAlpha > 0 && this.roundResult !== 'war') {
            ctx.save();
            ctx.globalAlpha = this.resultAlpha;
            ctx.translate(W / 2, H / 2);
            ctx.scale(this.resultScale, this.resultScale);
            ctx.font = 'bold 36px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const col = this.roundResult === 'player' ? this.ACCENT_GREEN : this.RED_SUIT;
            ctx.shadowColor = col;
            ctx.shadowBlur = 20;
            ctx.fillStyle = col;
            ctx.fillText(this.resultText, 0, 0);
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // Round counter
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '13px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Round ${this.rounds}`, 15, 25);

        // Prompt text when idle
        if (this.phase === 'idle' && !this.gameOver && this.playerDeck.length > 0 && this.aiDeck.length > 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.font = '14px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 500);
            ctx.globalAlpha = 0.3 + 0.4 * pulse;
            ctx.fillText('Click, tap, or press SPACE to battle', W / 2, H / 2);
            ctx.globalAlpha = 1;
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

        ctx.restore();
    },

    drawAnimatedCard(ctx, bc) {
        ctx.save();
        const cx = bc.x + this.CARD_W / 2;
        const cy = bc.y + this.CARD_H / 2;
        ctx.translate(cx, cy);

        // Flip: scale X
        const scaleX = 1 - bc.flipProgress;
        ctx.scale(scaleX || 0.01, 1);
        ctx.translate(-this.CARD_W / 2, -this.CARD_H / 2);

        if (bc.faceUp) {
            this.drawCardFace(ctx, 0, 0, bc.card);
        } else {
            this.drawCardBack(ctx, 0, 0);
        }
        ctx.restore();
    },

    drawCardStack(ctx, x, y, count) {
        for (let i = Math.min(count, 3) - 1; i >= 0; i--) {
            this.drawCardBack(ctx, x - i * 2, y - i * 2);
        }
    },

    drawCardBack(ctx, x, y) {
        const w = this.CARD_W;
        const h = this.CARD_H;
        const r = this.CARD_R;

        // Card shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;

        // Card body
        ctx.fillStyle = this.CARD_BACK_1;
        this.roundRect(ctx, x, y, w, h, r);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        // Gradient overlay
        const g = ctx.createLinearGradient(x, y, x + w, y + h);
        g.addColorStop(0, 'rgba(0, 212, 255, 0.08)');
        g.addColorStop(1, 'rgba(255, 45, 123, 0.08)');
        ctx.fillStyle = g;
        this.roundRect(ctx, x, y, w, h, r);
        ctx.fill();

        // Diamond pattern
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 0.5;
        const gap = 12;
        for (let dx = x + gap; dx < x + w; dx += gap) {
            for (let dy = y + gap; dy < y + h; dy += gap) {
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
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, w, h, r);
        ctx.stroke();

        ctx.restore();
    },

    drawCardFace(ctx, x, y, card) {
        const w = this.CARD_W;
        const h = this.CARD_H;
        const r = this.CARD_R;
        const isRed = card.suit === '♥' || card.suit === '♦';
        const suitColor = isRed ? this.RED_SUIT : this.BLACK_SUIT;

        // Card shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;

        // White card body
        ctx.fillStyle = '#ffffff';
        this.roundRect(ctx, x, y, w, h, r);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        // Slightly lighter inner area
        ctx.fillStyle = '#f5f5f0';
        this.roundRect(ctx, x + 3, y + 3, w - 6, h - 6, r - 2);
        ctx.fill();

        // Rank - top left
        ctx.fillStyle = suitColor;
        ctx.font = 'bold 16px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(card.rank, x + 6, y + 6);

        // Suit - top left under rank
        ctx.font = '14px sans-serif';
        ctx.fillText(card.suit, x + 6, y + 24);

        // Large center suit
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.suit, x + w / 2, y + h / 2);

        // Rank - bottom right (upside down effect)
        ctx.font = 'bold 16px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(card.rank, x + w - 6, y + h - 6);

        // Suit glow for face cards
        if (['J', 'Q', 'K', 'A'].includes(card.rank)) {
            ctx.shadowColor = suitColor;
            ctx.shadowBlur = 15;
            ctx.font = '32px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(card.suit, x + w / 2, y + h / 2);
            ctx.shadowBlur = 0;
        }

        // Border
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, w, h, r);
        ctx.stroke();

        ctx.restore();
    },

    drawBadge(ctx, x, y, count, color) {
        ctx.save();
        const text = String(count);
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        const tw = ctx.measureText(text).width;
        const pw = tw + 16;
        const ph = 24;

        // Pill background
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.15;
        this.roundRect(ctx, x - pw / 2, y - ph / 2, pw, ph, ph / 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Border
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5;
        this.roundRect(ctx, x - pw / 2, y - ph / 2, pw, ph, ph / 2);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Text
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);

        ctx.restore();
    },

    roundRect(ctx, x, y, w, h, r) {
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

    pause() {
        this.paused = true;
        this.ui.showPause();
    },

    resume() {
        this.paused = false;
        this.ui.hidePause();
        this.lastTime = performance.now();
        this.loop();
    },

    destroy() {
        cancelAnimationFrame(this.animFrame);
        document.removeEventListener('keydown', this.handleKey);
        if (this.canvas) {
            this.canvas.removeEventListener('click', this.handleClick);
            this.canvas.removeEventListener('touchstart', this.handleTouch);
        }
    }
};

export default War;
