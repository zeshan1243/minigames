// Hearts Card Game
// 4-player trick-taking card game with smooth animations

const Hearts = {
    canvas: null,
    ctx: null,
    ui: null,
    animFrame: null,
    paused: false,
    gameOver: false,

    // Constants
    SUITS: ['clubs', 'diamonds', 'hearts', 'spades'],
    SUIT_SYMBOLS: { clubs: '\u2663', diamonds: '\u2666', hearts: '\u2665', spades: '\u2660' },
    SUIT_COLORS: { clubs: '#e8e8f0', diamonds: '#ff2d7b', hearts: '#ff2d7b', spades: '#e8e8f0' },
    VALUES: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    VALUE_NAMES: { 2:'2', 3:'3', 4:'4', 5:'5', 6:'6', 7:'7', 8:'8', 9:'9', 10:'10', 11:'J', 12:'Q', 13:'K', 14:'A' },
    CARD_W: 60,
    CARD_H: 84,
    CARD_R: 6,
    PLAYER_NAMES: ['You', 'West', 'North', 'East'],

    // Game state
    deck: [],
    hands: [[], [], [], []],
    scores: [0, 0, 0, 0],
    roundScores: [0, 0, 0, 0],
    trick: [null, null, null, null],
    trickWinner: -1,
    tricksTaken: [[], [], [], []],
    heartsBroken: false,
    currentPlayer: -1,
    leadPlayer: -1,
    roundNumber: 0,
    tricksPlayed: 0,

    // Passing
    passDirection: 0,
    passPhase: false,
    selectedPass: [],
    passConfirmed: false,

    // UI state
    selectedCardIndex: -1,
    hoveredCardIndex: -1,
    validCards: [],
    phase: 'idle',
    message: '',
    cardHoverY: [],  // smooth y offset per card in hand

    // Animations
    cardAnims: [],        // {card, fromX, fromY, toX, toY, startTime, duration, faceDown, onDone, delay}
    trickCollectAnim: null, // {startTime, duration, winnerIdx}
    dealQueue: [],         // cards to deal one by one
    dealIndex: 0,
    showRoundSummary: false,
    summaryAlpha: 0,
    lastTime: 0,

    // Particles
    particles: [],

    // Button areas
    passButton: null,
    continueButton: null,
    cardAreas: [],

    // Event handlers
    _handleClick: null,
    _handleMove: null,
    _handleKey: null,
    _handleTouch: null,

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this._handleClick = this.handleClick.bind(this);
        this._handleMove = this.handleMove.bind(this);
        this._handleKey = this.handleKey.bind(this);
        this._handleTouch = this.handleTouch.bind(this);
        canvas.addEventListener('click', this._handleClick);
        canvas.addEventListener('mousemove', this._handleMove);
        canvas.addEventListener('touchstart', this._handleTouch, { passive: false });
        canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        document.addEventListener('keydown', this._handleKey);
    },

    start() {
        this.scores = [0, 0, 0, 0];
        this.roundNumber = 0;
        this.gameOver = false;
        this.paused = false;
        this.passDirection = 0;
        this.cardAnims = [];
        this.particles = [];
        this.trickCollectAnim = null;
        if (this.ui) { this.ui.hideGameOver(); this.ui.hidePause(); this.ui.setScore(0); }
        this.startRound();
        this.lastTime = performance.now();
        this.loop();
    },

    pause() { this.paused = true; if (this.ui) this.ui.showPause(); },
    resume() { this.paused = false; if (this.ui) this.ui.hidePause(); },

    reset() {
        cancelAnimationFrame(this.animFrame);
        this.scores = [0, 0, 0, 0];
        this.roundNumber = 0;
        this.gameOver = false;
        this.paused = false;
        this.passDirection = 0;
        this.phase = 'idle';
        this.selectedCardIndex = -1;
        this.hoveredCardIndex = -1;
        this.cardAnims = [];
        this.particles = [];
        this.trickCollectAnim = null;
        if (this.ui) { this.ui.hideGameOver(); this.ui.hidePause(); this.ui.setScore(0); }
    },

    destroy() {
        cancelAnimationFrame(this.animFrame);
        if (this.canvas) {
            this.canvas.removeEventListener('click', this._handleClick);
            this.canvas.removeEventListener('mousemove', this._handleMove);
            this.canvas.removeEventListener('touchstart', this._handleTouch);
        }
        document.removeEventListener('keydown', this._handleKey);
    },

    // ─── Easing ───
    easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); },
    easeOutBack(t) { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },

    // ─── Particles ───
    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0,
                maxLife: 20 + Math.random() * 20,
                color,
                size: 2 + Math.random() * 3
            });
        }
    },

    // ─── Deck & Deal ───
    createDeck() {
        const deck = [];
        for (const suit of this.SUITS) {
            for (const val of this.VALUES) deck.push({ suit, value: val });
        }
        return deck;
    },

    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    sortHand(hand) {
        const suitOrder = { clubs: 0, diamonds: 1, spades: 2, hearts: 3 };
        hand.sort((a, b) => {
            if (suitOrder[a.suit] !== suitOrder[b.suit]) return suitOrder[a.suit] - suitOrder[b.suit];
            return a.value - b.value;
        });
    },

    startRound() {
        this.roundNumber++;
        this.deck = this.shuffle(this.createDeck());
        this.hands = [[], [], [], []];
        this.roundScores = [0, 0, 0, 0];
        this.tricksTaken = [[], [], [], []];
        this.heartsBroken = false;
        this.trick = [null, null, null, null];
        this.trickWinner = -1;
        this.tricksPlayed = 0;
        this.selectedCardIndex = -1;
        this.hoveredCardIndex = -1;
        this.selectedPass = [];
        this.passConfirmed = false;
        this.showRoundSummary = false;
        this.summaryAlpha = 0;
        this.cardAnims = [];
        this.trickCollectAnim = null;

        // Deal cards with animation
        this.phase = 'dealing';
        this.dealQueue = [];
        for (let i = 0; i < 52; i++) {
            this.dealQueue.push({ card: this.deck[i], player: i % 4 });
        }
        this.dealIndex = 0;
        this.dealNextCard();
    },

    dealNextCard() {
        if (this.dealIndex >= this.dealQueue.length) {
            // Done dealing
            for (let i = 0; i < 4; i++) this.sortHand(this.hands[i]);
            const dir = (this.roundNumber - 1) % 4;
            this.passDirection = dir;
            if (dir === 3) {
                this.passPhase = false;
                this.phase = 'playing';
                this.findFirstLead();
            } else {
                this.passPhase = true;
                this.phase = 'passing';
                this.message = this.getPassMessage();
            }
            return;
        }

        const item = this.dealQueue[this.dealIndex];
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        const fromX = W / 2 - this.CARD_W / 2;
        const fromY = H / 2 - this.CARD_H / 2;

        this.hands[item.player].push(item.card);
        const handSize = this.hands[item.player].length;
        const area = this.getPlayerCardArea(item.player, handSize - 1, handSize);

        this.cardAnims.push({
            card: item.card,
            player: item.player,
            fromX, fromY,
            toX: area.x, toY: area.y,
            startTime: performance.now(),
            duration: 150,
            faceDown: item.player !== 0,
            onDone: null
        });

        this.dealIndex++;
        setTimeout(() => this.dealNextCard(), 35);
    },

    getPassMessage() {
        return ['Pass 3 cards LEFT', 'Pass 3 cards RIGHT', 'Pass 3 cards ACROSS', 'No passing'][this.passDirection];
    },

    getPassTarget(from) {
        if (this.passDirection === 0) return (from + 1) % 4;
        if (this.passDirection === 1) return (from + 3) % 4;
        if (this.passDirection === 2) return (from + 2) % 4;
        return from;
    },

    getAiPassCards(playerIdx) {
        const hand = this.hands[playerIdx];
        const scored = hand.map((c, i) => {
            let danger = c.value;
            if (c.suit === 'hearts') danger += 15;
            if (c.suit === 'spades' && c.value === 12) danger += 30;
            if (c.suit === 'spades' && c.value >= 13) danger += 10;
            return { idx: i, danger };
        });
        scored.sort((a, b) => b.danger - a.danger);
        return [scored[0].idx, scored[1].idx, scored[2].idx];
    },

    executePass() {
        const passCards = [[], [], [], []];
        passCards[0] = this.selectedPass.map(i => this.hands[0][i]);
        for (let p = 1; p < 4; p++) {
            passCards[p] = this.getAiPassCards(p).map(i => this.hands[p][i]);
        }

        // Animate pass cards
        const now = performance.now();
        for (let p = 0; p < 4; p++) {
            const target = this.getPassTarget(p);
            for (let ci = 0; ci < passCards[p].length; ci++) {
                const card = passCards[p][ci];
                const fromArea = this.getPlayerCardArea(p, 6, 13); // approximate from position
                const toArea = this.getPlayerCardArea(target, 6, 13);
                this.cardAnims.push({
                    card, player: -1,
                    fromX: fromArea.x, fromY: fromArea.y,
                    toX: toArea.x, toY: toArea.y,
                    startTime: now + ci * 80,
                    duration: 300,
                    faceDown: p !== 0,
                    onDone: null
                });
            }
        }

        // Remove and add after delay
        setTimeout(() => {
            for (let p = 0; p < 4; p++) {
                this.hands[p] = this.hands[p].filter(c => !passCards[p].includes(c));
            }
            for (let p = 0; p < 4; p++) {
                const target = this.getPassTarget(p);
                this.hands[target].push(...passCards[p]);
            }
            for (let i = 0; i < 4; i++) this.sortHand(this.hands[i]);
            this.passPhase = false;
            this.phase = 'playing';
            this.selectedPass = [];
            this.findFirstLead();
        }, 500);
    },

    findFirstLead() {
        for (let p = 0; p < 4; p++) {
            for (const c of this.hands[p]) {
                if (c.suit === 'clubs' && c.value === 2) {
                    this.currentPlayer = p;
                    this.leadPlayer = p;
                    this.trick = [null, null, null, null];
                    this.computeValidCards();
                    if (p !== 0) this.scheduleAiPlay();
                    return;
                }
            }
        }
    },

    // ─── Validity ───
    isFirstTrick() { return this.tricksPlayed === 0; },

    computeValidCards() {
        const hand = this.hands[this.currentPlayer];
        this.validCards = [];

        if (this.isFirstTrick() && this.trick.every(c => c === null)) {
            for (let i = 0; i < hand.length; i++) {
                if (hand[i].suit === 'clubs' && hand[i].value === 2) { this.validCards.push(i); return; }
            }
        }

        const leadCard = this.trick[this.leadPlayer];
        if (leadCard) {
            const suitCards = [];
            for (let i = 0; i < hand.length; i++) {
                if (hand[i].suit === leadCard.suit) suitCards.push(i);
            }
            if (suitCards.length > 0) {
                this.validCards = suitCards;
            } else {
                if (this.isFirstTrick()) {
                    const nonPenalty = [];
                    for (let i = 0; i < hand.length; i++) {
                        if (hand[i].suit !== 'hearts' && !(hand[i].suit === 'spades' && hand[i].value === 12)) nonPenalty.push(i);
                    }
                    this.validCards = nonPenalty.length > 0 ? nonPenalty : hand.map((_, i) => i);
                } else {
                    this.validCards = hand.map((_, i) => i);
                }
            }
        } else {
            if (!this.heartsBroken) {
                const nonHearts = [];
                for (let i = 0; i < hand.length; i++) { if (hand[i].suit !== 'hearts') nonHearts.push(i); }
                this.validCards = nonHearts.length > 0 ? nonHearts : hand.map((_, i) => i);
            } else {
                this.validCards = hand.map((_, i) => i);
            }
        }
    },

    // ─── Playing ───
    playCard(playerIdx, cardIdx) {
        const card = this.hands[playerIdx][cardIdx];
        const handArea = this.getPlayerCardArea(playerIdx, cardIdx, this.hands[playerIdx].length);
        const trickPos = this.getTrickCardPos(playerIdx);

        // Animate card flying to center
        this.cardAnims.push({
            card, player: playerIdx,
            fromX: handArea.x, fromY: handArea.y,
            toX: trickPos.x, toY: trickPos.y,
            startTime: performance.now(),
            duration: 250,
            faceDown: false,
            onDone: null
        });

        this.trick[playerIdx] = card;
        this.hands[playerIdx].splice(cardIdx, 1);
        if (card.suit === 'hearts') this.heartsBroken = true;

        // Penalty card particles
        if (card.suit === 'hearts' || (card.suit === 'spades' && card.value === 12)) {
            this.spawnParticles(trickPos.x + this.CARD_W / 2, trickPos.y + this.CARD_H / 2, '#ff2d7b', 12);
        }

        const cardsPlayed = this.trick.filter(c => c !== null).length;
        if (cardsPlayed === 4) {
            setTimeout(() => this.resolveTrick(), 350);
        } else {
            this.currentPlayer = (this.currentPlayer + 1) % 4;
            this.computeValidCards();
            if (this.currentPlayer !== 0) this.scheduleAiPlay();
        }
    },

    resolveTrick() {
        const leadSuit = this.trick[this.leadPlayer].suit;
        let winner = this.leadPlayer;
        let highestVal = 0;
        for (let i = 0; i < 4; i++) {
            if (this.trick[i].suit === leadSuit && this.trick[i].value > highestVal) {
                highestVal = this.trick[i].value;
                winner = i;
            }
        }

        this.trickWinner = winner;
        for (let i = 0; i < 4; i++) this.tricksTaken[winner].push(this.trick[i]);

        let points = 0;
        for (let i = 0; i < 4; i++) {
            if (this.trick[i].suit === 'hearts') points += 1;
            if (this.trick[i].suit === 'spades' && this.trick[i].value === 12) points += 13;
        }
        this.roundScores[winner] += points;

        if (points > 0) {
            this.spawnParticles(this.ui.canvasW / 2, this.ui.canvasH / 2, '#ff2d7b', 20);
        }

        this.tricksPlayed++;
        this.phase = 'trickEnd';

        // Animate cards flying to winner
        const winPos = this.getPlayerLabelPos(winner);
        this.trickCollectAnim = { startTime: performance.now() + 800, duration: 400, winnerIdx: winner };
    },

    getPlayerLabelPos(p) {
        const W = this.ui.canvasW, H = this.ui.canvasH;
        if (p === 0) return { x: W / 2, y: H - 100 };
        if (p === 1) return { x: 80, y: H / 2 };
        if (p === 2) return { x: W / 2, y: 100 };
        return { x: W - 80, y: H / 2 };
    },

    finishTrick() {
        const winner = this.trickWinner;
        this.trick = [null, null, null, null];
        this.trickWinner = -1;
        this.trickCollectAnim = null;

        if (this.tricksPlayed >= 13) {
            this.endRound();
        } else {
            this.leadPlayer = winner;
            this.currentPlayer = winner;
            this.phase = 'playing';
            this.computeValidCards();
            if (this.currentPlayer !== 0) this.scheduleAiPlay();
        }
    },

    endRound() {
        for (let p = 0; p < 4; p++) {
            if (this.roundScores[p] === 26) {
                for (let q = 0; q < 4; q++) this.roundScores[q] = q === p ? 0 : 26;
                this.spawnParticles(this.ui.canvasW / 2, this.ui.canvasH / 2, '#ffd60a', 40);
                break;
            }
        }
        for (let p = 0; p < 4; p++) this.scores[p] += this.roundScores[p];
        if (this.ui) this.ui.setScore(this.scores[0]);

        const maxScore = Math.max(...this.scores);
        if (maxScore >= 100) {
            this.phase = 'gameEnd';
            this.showRoundSummary = true;
            this.gameOver = true;
            const humanScore = this.scores[0];
            const minScore = Math.min(...this.scores);
            const won = humanScore === minScore;
            const finalScore = won ? 1000 - humanScore + this.roundNumber * 10 : this.roundNumber;
            const best = this.ui ? this.ui.getHighScore() : 0;
            if (this.ui && finalScore > best) this.ui.setHighScore(finalScore);
            if (this.ui) this.ui.showGameOver(finalScore, Math.max(finalScore, best));
        } else {
            this.phase = 'roundEnd';
            this.showRoundSummary = true;
        }
    },

    // ─── AI ───
    scheduleAiPlay() {
        setTimeout(() => {
            if (this.paused || this.gameOver || this.phase !== 'playing') return;
            if (this.currentPlayer === 0) return;
            this.aiPlayCard();
        }, 500 + Math.random() * 300);
    },

    aiPlayCard() {
        const p = this.currentPlayer;
        const hand = this.hands[p];
        this.computeValidCards();
        if (this.validCards.length === 0) return;

        let chosenIdx = this.validCards[0];
        const leadCard = this.trick[this.leadPlayer];

        if (leadCard) {
            const leadSuit = leadCard.suit;
            const canFollow = this.validCards.some(i => hand[i].suit === leadSuit);

            if (canFollow) {
                const suitCards = this.validCards.filter(i => hand[i].suit === leadSuit);
                let highestInTrick = 0;
                for (let i = 0; i < 4; i++) {
                    if (this.trick[i] && this.trick[i].suit === leadSuit) highestInTrick = Math.max(highestInTrick, this.trick[i].value);
                }
                const ducking = suitCards.filter(i => hand[i].value < highestInTrick);
                chosenIdx = ducking.length > 0 ? ducking[ducking.length - 1] : suitCards[0];
            } else {
                const qos = this.validCards.find(i => hand[i].suit === 'spades' && hand[i].value === 12);
                if (qos !== undefined) {
                    chosenIdx = qos;
                } else {
                    const hearts = this.validCards.filter(i => hand[i].suit === 'hearts');
                    if (hearts.length > 0) {
                        hearts.sort((a, b) => hand[b].value - hand[a].value);
                        chosenIdx = hearts[0];
                    } else {
                        let highest = this.validCards[0];
                        for (const i of this.validCards) { if (hand[i].value > hand[highest].value) highest = i; }
                        chosenIdx = highest;
                    }
                }
            }
        } else {
            const nonHearts = this.validCards.filter(i => hand[i].suit !== 'hearts');
            if (nonHearts.length > 0) {
                let best = nonHearts[0];
                for (const i of nonHearts) { if (hand[i].value < hand[best].value) best = i; }
                chosenIdx = best;
            } else {
                chosenIdx = this.validCards[0];
                for (const i of this.validCards) { if (hand[i].value < hand[chosenIdx].value) chosenIdx = i; }
            }
        }

        this.playCard(p, chosenIdx);
    },

    // ─── Input ───
    getCanvasPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.ui.canvasW / rect.width),
            y: (e.clientY - rect.top) * (this.ui.canvasH / rect.height)
        };
    },

    handleTouch(e) {
        e.preventDefault();
        this.handleClick({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    },

    handleClick(e) {
        if (this.paused || this.gameOver) return;
        const pos = this.getCanvasPos(e);

        if (this.phase === 'passing') {
            this.handlePassClick(pos);
        } else if (this.phase === 'playing' && this.currentPlayer === 0) {
            this.handlePlayClick(pos);
        } else if (this.phase === 'trickEnd') {
            // Speed up trick end
            if (this.trickCollectAnim) {
                this.trickCollectAnim.startTime = performance.now() - 1000;
            }
        } else if (this.phase === 'roundEnd' && this.showRoundSummary) {
            this.handleRoundEndClick(pos);
        }
    },

    handlePassClick(pos) {
        const hand = this.hands[0];
        for (let i = hand.length - 1; i >= 0; i--) {
            const area = this.getPlayerCardArea(0, i, hand.length);
            if (this.pointInRect(pos, area)) {
                const selIdx = this.selectedPass.indexOf(i);
                if (selIdx >= 0) { this.selectedPass.splice(selIdx, 1); }
                else if (this.selectedPass.length < 3) { this.selectedPass.push(i); }
                return;
            }
        }
        if (this.selectedPass.length === 3 && this.passButton && this.pointInRect(pos, this.passButton)) {
            this.executePass();
        }
    },

    handlePlayClick(pos) {
        const hand = this.hands[0];
        for (let i = hand.length - 1; i >= 0; i--) {
            const area = this.getPlayerCardArea(0, i, hand.length);
            // Adjust for hover raise
            const yOff = (this.hoveredCardIndex === i || this.selectedCardIndex === i) ? -12 : 0;
            const adjustedArea = { x: area.x, y: area.y + yOff, w: area.w, h: area.h };
            if (this.pointInRect(pos, adjustedArea) || this.pointInRect(pos, area)) {
                if (this.validCards.includes(i)) this.playCard(0, i);
                return;
            }
        }
    },

    handleRoundEndClick(pos) {
        if (this.continueButton && this.pointInRect(pos, this.continueButton)) {
            this.showRoundSummary = false;
            this.startRound();
        }
    },

    handleMove(e) {
        if (this.paused || this.gameOver) return;
        const pos = this.getCanvasPos(e);
        this.hoveredCardIndex = -1;
        if (this.phase === 'passing' || (this.phase === 'playing' && this.currentPlayer === 0)) {
            const hand = this.hands[0];
            for (let i = hand.length - 1; i >= 0; i--) {
                const area = this.getPlayerCardArea(0, i, hand.length);
                if (this.pointInRect(pos, area)) { this.hoveredCardIndex = i; break; }
            }
        }
        this.canvas.style.cursor = this.hoveredCardIndex >= 0 ? 'pointer' : 'default';
    },

    handleKey(e) {
        if (this.gameOver) return;
        if (e.key === 'p' || e.key === 'P') { if (this.paused) this.resume(); else this.pause(); return; }
        if (this.paused) return;

        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter'].includes(e.key)) e.preventDefault();

        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            if (this.phase === 'playing' && this.currentPlayer === 0) {
                const hand = this.hands[0];
                if (hand.length === 0) return;
                if (this.selectedCardIndex < 0) { this.selectedCardIndex = 0; }
                else {
                    this.selectedCardIndex = Math.max(0, Math.min(hand.length - 1, this.selectedCardIndex + (e.key === 'ArrowRight' ? 1 : -1)));
                }
            }
        }

        if (e.key === 'Enter' || e.key === ' ') {
            if (this.phase === 'playing' && this.currentPlayer === 0 && this.selectedCardIndex >= 0) {
                if (this.validCards.includes(this.selectedCardIndex)) {
                    this.playCard(0, this.selectedCardIndex);
                    this.selectedCardIndex = -1;
                }
            } else if (this.phase === 'trickEnd') {
                if (this.trickCollectAnim) this.trickCollectAnim.startTime = performance.now() - 1000;
            } else if (this.phase === 'roundEnd' && this.showRoundSummary) {
                this.showRoundSummary = false;
                this.startRound();
            } else if (this.phase === 'passing' && this.selectedPass.length === 3) {
                this.executePass();
            }
        }
    },

    pointInRect(pos, rect) {
        return pos.x >= rect.x && pos.x <= rect.x + rect.w && pos.y >= rect.y && pos.y <= rect.y + rect.h;
    },

    // ─── Card Positions ───
    getPlayerCardArea(player, cardIdx, handSize) {
        const W = this.ui.canvasW, H = this.ui.canvasH;
        const cw = this.CARD_W, ch = this.CARD_H;

        if (player === 0) {
            const maxSpread = Math.min(42, (W - 120 - cw) / Math.max(1, handSize - 1));
            const totalW = cw + (handSize - 1) * maxSpread;
            const startX = (W - totalW) / 2;
            return { x: startX + cardIdx * maxSpread, y: H - ch - 20, w: cw, h: ch };
        } else if (player === 1) {
            const maxSpread = Math.min(25, (H - 220 - ch) / Math.max(1, handSize - 1));
            const totalH = ch + (handSize - 1) * maxSpread;
            const startY = (H - totalH) / 2;
            return { x: 15, y: startY + cardIdx * maxSpread, w: cw, h: ch };
        } else if (player === 2) {
            const maxSpread = Math.min(42, (W - 120 - cw) / Math.max(1, handSize - 1));
            const totalW = cw + (handSize - 1) * maxSpread;
            const startX = (W - totalW) / 2;
            return { x: startX + cardIdx * maxSpread, y: 15, w: cw, h: ch };
        } else {
            const maxSpread = Math.min(25, (H - 220 - ch) / Math.max(1, handSize - 1));
            const totalH = ch + (handSize - 1) * maxSpread;
            const startY = (H - totalH) / 2;
            return { x: W - cw - 15, y: startY + cardIdx * maxSpread, w: cw, h: ch };
        }
    },

    getTrickCardPos(player) {
        const W = this.ui.canvasW, H = this.ui.canvasH;
        const cx = W / 2 - this.CARD_W / 2;
        const cy = H / 2 - this.CARD_H / 2;
        const off = 52;
        if (player === 0) return { x: cx, y: cy + off };
        if (player === 1) return { x: cx - off - 15, y: cy };
        if (player === 2) return { x: cx, y: cy - off };
        return { x: cx + off + 15, y: cy };
    },

    // ─── Render Loop ───
    loop() {
        if (this.gameOver && this.phase !== 'gameEnd' && !this.showRoundSummary) return;
        const now = performance.now();
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;
        this.update(now, dt);
        this.render(now);
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update(now, dt) {
        // Clean finished card anims
        this.cardAnims = this.cardAnims.filter(a => {
            const elapsed = now - a.startTime;
            return elapsed < a.duration;
        });

        // Trick collect animation
        if (this.phase === 'trickEnd' && this.trickCollectAnim) {
            const t = (now - this.trickCollectAnim.startTime) / this.trickCollectAnim.duration;
            if (t >= 1) {
                this.finishTrick();
            }
        }

        // Summary fade in
        if (this.showRoundSummary && this.summaryAlpha < 1) {
            this.summaryAlpha = Math.min(1, this.summaryAlpha + dt * 3);
        }

        // Smooth card hover offsets
        const hand = this.hands[0];
        while (this.cardHoverY.length < hand.length) this.cardHoverY.push(0);
        this.cardHoverY.length = hand.length;
        for (let i = 0; i < hand.length; i++) {
            const isHovered = this.hoveredCardIndex === i;
            const isSelected = this.selectedCardIndex === i;
            const isPassSelected = this.phase === 'passing' && this.selectedPass.includes(i);
            let target = 0;
            if (isPassSelected) target = -18;
            else if (isHovered || isSelected) target = -12;
            this.cardHoverY[i] += (target - this.cardHoverY[i]) * Math.min(1, dt * 14);
            if (Math.abs(this.cardHoverY[i] - target) < 0.3) this.cardHoverY[i] = target;
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.95;
            p.vy *= 0.95;
            p.life++;
            if (p.life >= p.maxLife) this.particles.splice(i, 1);
        }
    },

    render(now) {
        const ctx = this.ctx;
        const W = this.ui.canvasW, H = this.ui.canvasH;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Subtle play area
        const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 200);
        grad.addColorStop(0, '#0f0f1a');
        grad.addColorStop(1, '#0a0a0f');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(W / 2, H / 2, 190, 150, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Trick cards (with collect animation)
        this.drawTrickCards(ctx, now);

        // Hands
        this.drawHands(ctx, now);

        // Card flight animations
        this.drawCardAnims(ctx, now);

        // Player labels (drawn after hands so they're always visible)
        this.drawPlayerLabels(ctx, W, H);

        // Particles
        this.drawParticles(ctx);

        // Pass UI
        if (this.phase === 'passing') this.drawPassUI(ctx, W, H);

        // Trick winner text
        if (this.phase === 'trickEnd' && this.trickWinner >= 0) {
            const elapsed = now - (this.trickCollectAnim ? this.trickCollectAnim.startTime - 800 : now);
            const alpha = Math.min(1, elapsed / 300);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#00d4ff';
            ctx.font = 'bold 16px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.PLAYER_NAMES[this.trickWinner] + ' takes the trick', W / 2, H / 2 + 95);
            ctx.fillStyle = '#8888a0';
            ctx.font = '12px Outfit, sans-serif';
            ctx.fillText('Click to continue', W / 2, H / 2 + 112);
            ctx.restore();
        }

        // Thinking text
        if (this.phase === 'playing' && this.currentPlayer !== 0) {
            const dots = '.'.repeat(Math.floor((now / 400) % 4));
            ctx.fillStyle = '#8888a0';
            ctx.font = '14px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.PLAYER_NAMES[this.currentPlayer] + ' thinking' + dots, W / 2, H / 2 + 110);
        }

        // Round summary
        if (this.showRoundSummary) this.drawRoundSummary(ctx, W, H);
    },

    drawPlayerLabels(ctx, W, H) {
        const positions = [
            { x: W / 2, y: H - 125 },   // South - above cards
            { x: 80, y: H / 2 + 75 },    // West - below card fan
            { x: W / 2, y: 115 },         // North - below cards
            { x: W - 80, y: H / 2 + 75 }  // East - below card fan
        ];

        for (let i = 0; i < 4; i++) {
            const pos = positions[i];
            const isCurrent = this.currentPlayer === i && this.phase === 'playing';

            // Background pill for readability
            const labelW = 120, labelH = 32;
            ctx.fillStyle = 'rgba(10, 10, 15, 0.85)';
            this.roundRect(ctx, pos.x - labelW / 2, pos.y - 14, labelW, labelH, 8);
            ctx.fill();

            if (isCurrent) {
                ctx.strokeStyle = 'rgba(0,212,255,0.3)';
                ctx.lineWidth = 1;
                this.roundRect(ctx, pos.x - labelW / 2, pos.y - 14, labelW, labelH, 8);
                ctx.stroke();
            }

            ctx.textAlign = 'center';
            ctx.font = isCurrent ? 'bold 13px Outfit, sans-serif' : '12px Outfit, sans-serif';
            ctx.fillStyle = isCurrent ? '#00d4ff' : '#c0c0d0';
            ctx.fillText(this.PLAYER_NAMES[i], pos.x, pos.y);

            ctx.font = '10px JetBrains Mono, monospace';
            ctx.fillStyle = this.roundScores[i] > 0 ? '#ff2d7b' : '#666';
            ctx.fillText(`${this.scores[i]} pts (+${this.roundScores[i]})`, pos.x, pos.y + 13);
        }
    },

    drawHands(ctx, now) {
        for (let p = 0; p < 4; p++) {
            const hand = this.hands[p];
            for (let i = 0; i < hand.length; i++) {
                const area = this.getPlayerCardArea(p, i, hand.length);

                if (p === 0) {
                    const isValid = this.phase === 'playing' && this.currentPlayer === 0 && this.validCards.includes(i);
                    const isHovered = this.hoveredCardIndex === i;
                    const isPassSelected = this.phase === 'passing' && this.selectedPass.includes(i);
                    const dimmed = this.phase === 'playing' && this.currentPlayer === 0 && !isValid;

                    const yOff = this.cardHoverY[i] || 0;

                    // Glow for valid hovered card
                    if (isHovered && isValid) {
                        ctx.save();
                        ctx.shadowColor = '#00d4ff';
                        ctx.shadowBlur = 15;
                        this.drawCard(ctx, hand[i], area.x, area.y + yOff, false, false, true);
                        ctx.restore();
                        continue;
                    }

                    this.drawCard(ctx, hand[i], area.x, area.y + yOff, false, dimmed, isPassSelected);
                } else {
                    this.drawCardBack(ctx, area.x, area.y);
                }
            }
        }
    },

    drawCardAnims(ctx, now) {
        for (const a of this.cardAnims) {
            const elapsed = now - a.startTime;
            if (elapsed < 0) continue;
            const t = this.easeOutCubic(Math.min(elapsed / a.duration, 1));
            const x = a.fromX + (a.toX - a.fromX) * t;
            const y = a.fromY + (a.toY - a.fromY) * t;
            // Scale pop on arrival
            const scale = t > 0.8 ? 1 + (1 - t) * 0.15 : 0.9 + t * 0.1;

            ctx.save();
            ctx.translate(x + this.CARD_W / 2, y + this.CARD_H / 2);
            ctx.scale(scale, scale);
            ctx.translate(-this.CARD_W / 2, -this.CARD_H / 2);

            if (a.faceDown) this.drawCardBack(ctx, 0, 0);
            else if (a.card) this.drawCard(ctx, a.card, 0, 0, false, false, false);

            ctx.restore();
        }
    },

    drawTrickCards(ctx, now) {
        const collecting = this.trickCollectAnim && now >= this.trickCollectAnim.startTime;
        const winPos = collecting ? this.getPlayerLabelPos(this.trickCollectAnim.winnerIdx) : null;
        const collectT = collecting ? this.easeInOutQuad(Math.min((now - this.trickCollectAnim.startTime) / this.trickCollectAnim.duration, 1)) : 0;

        for (let i = 0; i < 4; i++) {
            if (this.trick[i]) {
                const pos = this.getTrickCardPos(i);
                let x = pos.x, y = pos.y;
                let alpha = 1;

                if (collecting) {
                    x = pos.x + (winPos.x - this.CARD_W / 2 - pos.x) * collectT;
                    y = pos.y + (winPos.y - this.CARD_H / 2 - pos.y) * collectT;
                    alpha = 1 - collectT * 0.7;
                    const scale = 1 - collectT * 0.3;
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.translate(x + this.CARD_W / 2, y + this.CARD_H / 2);
                    ctx.scale(scale, scale);
                    ctx.translate(-this.CARD_W / 2, -this.CARD_H / 2);
                    this.drawCard(ctx, this.trick[i], 0, 0, false, false, false);
                    ctx.restore();
                } else {
                    this.drawCard(ctx, this.trick[i], x, y, false, false, false);
                }
            }
        }
    },

    drawParticles(ctx) {
        for (const p of this.particles) {
            const alpha = 1 - p.life / p.maxLife;
            const size = p.size * alpha;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0, size), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    },

    drawCard(ctx, card, x, y, faceDown, dimmed, highlighted) {
        const w = this.CARD_W, h = this.CARD_H, r = this.CARD_R;
        if (faceDown) { this.drawCardBack(ctx, x, y); return; }

        ctx.save();
        if (dimmed) ctx.globalAlpha = 0.3;

        // Shadow
        ctx.shadowColor = highlighted ? 'rgba(0,212,255,0.4)' : 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = highlighted ? 12 : 6;
        ctx.shadowOffsetY = 2;

        this.roundRect(ctx, x, y, w, h, r);
        ctx.fillStyle = '#1a1a2e';
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = highlighted ? '#00d4ff' : 'rgba(255,255,255,0.08)';
        ctx.lineWidth = highlighted ? 2 : 1;
        ctx.stroke();

        const color = this.SUIT_COLORS[card.suit];
        const symbol = this.SUIT_SYMBOLS[card.suit];
        const valStr = this.VALUE_NAMES[card.value];

        ctx.fillStyle = color;
        ctx.font = 'bold 14px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(valStr, x + 5, y + 16);
        ctx.font = '12px sans-serif';
        ctx.fillText(symbol, x + 5, y + 30);

        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(symbol, x + w / 2, y + h / 2 + 8);

        ctx.font = 'bold 14px JetBrains Mono, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(valStr, x + w - 5, y + h - 8);

        ctx.restore();
    },

    drawCardBack(ctx, x, y) {
        const w = this.CARD_W, h = this.CARD_H, r = this.CARD_R;

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 2;

        this.roundRect(ctx, x, y, w, h, r);
        const grad = ctx.createLinearGradient(x, y, x + w, y + h);
        grad.addColorStop(0, '#1a1a3e');
        grad.addColorStop(0.5, '#151530');
        grad.addColorStop(1, '#0d0d2a');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = 'rgba(0,212,255,0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Diamond pattern
        ctx.fillStyle = 'rgba(0,212,255,0.06)';
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 4; j++) {
                const dx = x + 12 + i * 16;
                const dy = y + 12 + j * 16;
                ctx.beginPath();
                ctx.moveTo(dx + 5, dy);
                ctx.lineTo(dx + 10, dy + 6);
                ctx.lineTo(dx + 5, dy + 12);
                ctx.lineTo(dx, dy + 6);
                ctx.closePath();
                ctx.fill();
            }
        }
        ctx.restore();
    },

    drawPassUI(ctx, W, H) {
        ctx.fillStyle = '#ffd60a';
        ctx.font = 'bold 18px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.getPassMessage(), W / 2, H / 2 - 35);

        ctx.fillStyle = '#8888a0';
        ctx.font = '13px Outfit, sans-serif';
        ctx.fillText('Select 3 cards from your hand', W / 2, H / 2 - 14);

        // Selected dots
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(W / 2 - 16 + i * 16, H / 2 + 6, 5, 0, Math.PI * 2);
            ctx.fillStyle = i < this.selectedPass.length ? '#00d4ff' : '#333';
            ctx.fill();
        }

        if (this.selectedPass.length === 3) {
            const bw = 130, bh = 38;
            const bx = W / 2 - bw / 2;
            const by = H / 2 + 22;
            this.passButton = { x: bx, y: by, w: bw, h: bh };

            ctx.save();
            ctx.shadowColor = 'rgba(0,212,255,0.4)';
            ctx.shadowBlur = 12;
            this.roundRect(ctx, bx, by, bw, bh, 10);
            ctx.fillStyle = '#00d4ff';
            ctx.fill();
            ctx.restore();

            ctx.fillStyle = '#0a0a0f';
            ctx.font = 'bold 14px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Pass Cards', W / 2, by + 24);
        } else {
            this.passButton = null;
        }
    },

    drawRoundSummary(ctx, W, H) {
        ctx.save();
        ctx.globalAlpha = this.summaryAlpha;

        ctx.fillStyle = 'rgba(10, 10, 15, 0.92)';
        ctx.fillRect(0, 0, W, H);

        const panelW = 380, panelH = 310;
        const px = (W - panelW) / 2;
        const py = (H - panelH) / 2;

        // Panel shadow
        ctx.shadowColor = 'rgba(0,212,255,0.15)';
        ctx.shadowBlur = 30;
        this.roundRect(ctx, px, py, panelW, panelH, 16);
        ctx.fillStyle = '#12121a';
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = 'rgba(0,212,255,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Title
        ctx.fillStyle = '#e8e8f0';
        ctx.font = 'bold 20px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.gameOver ? 'Game Over!' : `Round ${this.roundNumber} Complete`, W / 2, py + 38);

        // Header row
        const startY = py + 68;
        ctx.font = 'bold 12px Outfit, sans-serif';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'left';
        ctx.fillText('PLAYER', px + 30, startY);
        ctx.textAlign = 'center';
        ctx.fillText('ROUND', px + 220, startY);
        ctx.fillText('TOTAL', px + 310, startY);

        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.moveTo(px + 20, startY + 10);
        ctx.lineTo(px + panelW - 20, startY + 10);
        ctx.stroke();

        for (let i = 0; i < 4; i++) {
            const row = startY + 35 + i * 34;
            const isHuman = i === 0;
            const isLowest = this.scores[i] === Math.min(...this.scores);

            // Row highlight for human
            if (isHuman) {
                ctx.fillStyle = 'rgba(0,212,255,0.05)';
                this.roundRect(ctx, px + 15, row - 14, panelW - 30, 30, 6);
                ctx.fill();
            }

            ctx.textAlign = 'left';
            ctx.font = isHuman ? 'bold 14px Outfit, sans-serif' : '14px Outfit, sans-serif';
            ctx.fillStyle = isHuman ? '#00d4ff' : '#e8e8f0';
            ctx.fillText(this.PLAYER_NAMES[i], px + 30, row);

            ctx.textAlign = 'center';
            ctx.font = '14px JetBrains Mono, monospace';
            ctx.fillStyle = this.roundScores[i] > 0 ? '#ff2d7b' : '#00e676';
            ctx.fillText(this.roundScores[i] > 0 ? '+' + this.roundScores[i] : '0', px + 220, row);

            ctx.fillStyle = isLowest ? '#00e676' : '#e8e8f0';
            ctx.font = isLowest ? 'bold 14px JetBrains Mono, monospace' : '14px JetBrains Mono, monospace';
            ctx.fillText(this.scores[i].toString(), px + 310, row);
        }

        if (this.gameOver) {
            const winner = this.scores.indexOf(Math.min(...this.scores));
            ctx.fillStyle = winner === 0 ? '#00e676' : '#ff2d7b';
            ctx.font = 'bold 18px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(winner === 0 ? 'You Win!' : this.PLAYER_NAMES[winner] + ' Wins!', W / 2, py + panelH - 55);
        } else {
            const bw = 150, bh = 40;
            const bx = W / 2 - bw / 2;
            const by = py + panelH - 55;
            this.continueButton = { x: bx, y: by, w: bw, h: bh };

            ctx.save();
            ctx.shadowColor = 'rgba(0,212,255,0.3)';
            ctx.shadowBlur = 15;
            this.roundRect(ctx, bx, by, bw, bh, 10);
            ctx.fillStyle = '#00d4ff';
            ctx.fill();
            ctx.restore();

            ctx.fillStyle = '#0a0a0f';
            ctx.font = 'bold 14px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Next Round', W / 2, by + 26);
        }

        ctx.restore();
    },

    // ─── Helpers ───
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

export default Hearts;
