// Reaction Duel — Player vs AI, best of 7 rounds
// Symbol appears (sword=ATTACK, shield=DEFEND), first correct press wins the round.

const ReactionDuel = {
    canvas: null,
    ctx: null,
    ui: null,

    // Game state
    phase: 'intro',   // intro, countdown, waiting, symbol, resolved, matchOver
    round: 0,
    maxRounds: 7,
    playerWins: 0,
    aiWins: 0,
    symbol: null,      // 'sword' or 'shield'
    countdownNum: 3,
    countdownScale: 1,
    waitDelay: 0,
    waitStart: 0,
    symbolStart: 0,
    aiReactionBase: 500,   // AI gets faster over rounds
    aiReactionTime: 0,
    aiResponded: false,
    playerResponded: false,
    playerChoice: null,    // 'attack' or 'defend'
    roundWinner: null,     // 'player', 'ai', 'draw', 'early', 'wrong'
    roundMessage: '',
    roundMessageTimer: 0,

    // Particles
    particles: [],

    // Animation
    animFrame: null,
    lastTime: 0,
    flashAlpha: 0,
    flashColor: '#fff',

    // Buttons (touch)
    attackBtn: { x: 0, y: 0, w: 0, h: 0 },
    defendBtn: { x: 0, y: 0, w: 0, h: 0 },
    hoverBtn: null,  // 'attack' or 'defend' or null

    // Round indicator dots
    roundResults: [],  // array of 'player', 'ai', 'draw' per round

    // Timing IDs
    timeoutIds: [],

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this._onKey = this._onKey.bind(this);
        this._onClick = this._onClick.bind(this);
        this._onContext = this._onContext.bind(this);
        this._onTouch = this._onTouch.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        document.addEventListener('keydown', this._onKey);
        canvas.addEventListener('click', this._onClick);
        canvas.addEventListener('contextmenu', this._onContext);
        canvas.addEventListener('touchstart', this._onTouch, { passive: false });
        canvas.addEventListener('mousemove', this._onMouseMove);
    },

    start() {
        this.round = 0;
        this.playerWins = 0;
        this.aiWins = 0;
        this.roundResults = [];
        this.particles = [];
        this.aiReactionBase = 500;
        this.ui.setScore(0);
        this.ui.hideGameOver();
        this.ui.hidePause();
        this._computeButtons();
        this._startIntro();
        this.lastTime = performance.now();
        this._loop();
    },

    _computeButtons() {
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;
        const btnW = Math.min(160, w * 0.22);
        const btnH = 56;
        const gap = 30;
        const y = h - btnH - 40;
        // Player buttons on the left half
        const leftCenter = w * 0.25;
        this.attackBtn = { x: leftCenter - btnW - gap / 2, y, w: btnW, h: btnH };
        this.defendBtn = { x: leftCenter + gap / 2, y, w: btnW, h: btnH };
    },

    _clearTimeouts() {
        this.timeoutIds.forEach(id => clearTimeout(id));
        this.timeoutIds = [];
    },

    _setTimeout(fn, ms) {
        const id = setTimeout(fn, ms);
        this.timeoutIds.push(id);
        return id;
    },

    // ========== PHASE TRANSITIONS ==========

    _startIntro() {
        this.phase = 'intro';
        this._setTimeout(() => this._startCountdown(), 1500);
    },

    _startCountdown() {
        this.phase = 'countdown';
        this.countdownNum = 3;
        this.countdownScale = 1.5;
        this._tickCountdown();
    },

    _tickCountdown() {
        if (this.countdownNum <= 0) {
            this._startWaiting();
            return;
        }
        this.countdownScale = 1.5;
        this._setTimeout(() => {
            this.countdownNum--;
            if (this.countdownNum > 0) {
                this.countdownScale = 1.5;
            }
            this._tickCountdown();
        }, 800);
    },

    _startWaiting() {
        this.phase = 'waiting';
        this.playerResponded = false;
        this.aiResponded = false;
        this.playerChoice = null;
        this.roundWinner = null;
        // Random delay 2-5s
        this.waitDelay = Math.random() * 3000 + 2000;
        this.waitStart = performance.now();
        this._setTimeout(() => this._showSymbol(), this.waitDelay);
    },

    _showSymbol() {
        this.phase = 'symbol';
        this.symbol = Math.random() < 0.5 ? 'sword' : 'shield';
        this.symbolStart = performance.now();
        this.playerResponded = false;
        this.aiResponded = false;
        // AI responds after a delay
        const aiMin = Math.max(200, this.aiReactionBase - this.round * 40);
        const aiMax = aiMin + 150;
        this.aiReactionTime = Math.random() * (aiMax - aiMin) + aiMin;
        this._setTimeout(() => this._aiRespond(), this.aiReactionTime);
    },

    _aiRespond() {
        if (this.phase !== 'symbol' || this.aiResponded) return;
        this.aiResponded = true;
        // AI always picks correct answer
        if (!this.playerResponded) {
            // AI wins the round
            this._resolveRound('ai');
        }
        // If player already responded, resolution already happened
    },

    _playerAction(choice) {
        // choice: 'attack' or 'defend'
        if (this.phase === 'waiting') {
            // Too early!
            this.playerResponded = true;
            this.playerChoice = choice;
            this._resolveRound('early');
            return;
        }
        if (this.phase !== 'symbol' || this.playerResponded) return;
        this.playerResponded = true;
        this.playerChoice = choice;

        const correct = this.symbol === 'sword' ? 'attack' : 'defend';
        if (choice !== correct) {
            // Wrong button
            this._resolveRound('wrong');
            return;
        }
        // Correct button, player beats AI (AI hasn't responded yet)
        if (!this.aiResponded) {
            this._resolveRound('player');
        }
        // If AI already responded, it was resolved in _aiRespond
    },

    _resolveRound(winner) {
        this._clearTimeouts();
        this.phase = 'resolved';
        this.roundWinner = winner;

        if (winner === 'player') {
            this.playerWins++;
            this.roundMessage = 'YOU WIN THE ROUND!';
            this.flashColor = '#00e676';
            this._spawnParticles(this.ui.canvasW * 0.25, this.ui.canvasH * 0.4, '#00e676');
        } else if (winner === 'ai') {
            this.aiWins++;
            this.roundMessage = 'AI WINS THE ROUND!';
            this.flashColor = '#ff2d7b';
        } else if (winner === 'early') {
            this.aiWins++;
            this.roundMessage = 'TOO EARLY! AI WINS!';
            this.flashColor = '#ff2d7b';
        } else if (winner === 'wrong') {
            this.aiWins++;
            this.roundMessage = 'WRONG BUTTON! AI WINS!';
            this.flashColor = '#ff2d7b';
        }

        this.flashAlpha = 0.6;
        this.roundResults.push(winner === 'player' ? 'player' : (winner === 'ai' || winner === 'early' || winner === 'wrong') ? 'ai' : 'draw');
        this.round++;
        this.roundMessageTimer = 2000;

        this.ui.setScore(this.playerWins);

        // Check if match is over (best of 7 = first to 4, or all 7 played)
        const winsNeeded = Math.ceil(this.maxRounds / 2);
        if (this.playerWins >= winsNeeded || this.aiWins >= winsNeeded || this.round >= this.maxRounds) {
            this._setTimeout(() => this._endMatch(), 2200);
        } else {
            // Make AI slightly faster each round
            this.aiReactionBase = Math.max(200, this.aiReactionBase - 30);
            this._setTimeout(() => this._startCountdown(), 2200);
        }
    },

    _endMatch() {
        this.phase = 'matchOver';
        const score = this.playerWins;
        const best = this.ui.getHighScore();
        this.ui.setHighScore(score);
        if (this.playerWins > this.aiWins) {
            this._spawnParticles(this.ui.canvasW / 2, this.ui.canvasH / 2, '#ffd60a');
            this._spawnParticles(this.ui.canvasW / 2 - 80, this.ui.canvasH / 2 + 40, '#00d4ff');
            this._spawnParticles(this.ui.canvasW / 2 + 80, this.ui.canvasH / 2 + 40, '#00e676');
        }
        this.ui.showGameOver(score, Math.max(score, best || 0));
    },

    // ========== PARTICLES ==========

    _spawnParticles(cx, cy, color) {
        for (let i = 0; i < 24; i++) {
            const angle = (Math.PI * 2 / 24) * i + Math.random() * 0.3;
            const speed = 80 + Math.random() * 160;
            this.particles.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.6 + Math.random() * 0.6,
                size: 3 + Math.random() * 4,
                color
            });
        }
    },

    _updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 200 * dt; // gravity
            p.life -= p.decay * dt;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    },

    _renderParticles(ctx) {
        for (const p of this.particles) {
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    },

    // ========== INPUT HANDLERS ==========

    _onKey(e) {
        if (this.phase === 'matchOver') return;
        if (e.key === 'a' || e.key === 'A') {
            e.preventDefault();
            this._playerAction('attack');
        } else if (e.key === 'd' || e.key === 'D') {
            e.preventDefault();
            this._playerAction('defend');
        }
    },

    _onClick(e) {
        if (this.phase === 'matchOver') return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const hit = this._hitTestButtons(x, y);
        if (hit) {
            this._playerAction(hit);
        }
    },

    _onContext(e) {
        e.preventDefault();
        if (this.phase === 'matchOver') return;
        this._playerAction('defend');
    },

    _onTouch(e) {
        e.preventDefault();
        if (this.phase === 'matchOver') return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        const hit = this._hitTestButtons(x, y);
        if (hit) {
            this._playerAction(hit);
        }
    },

    _onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.hoverBtn = this._hitTestButtons(x, y);
    },

    _hitTestButtons(x, y) {
        const a = this.attackBtn;
        const d = this.defendBtn;
        if (x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h) return 'attack';
        if (x >= d.x && x <= d.x + d.w && y >= d.y && y <= d.y + d.h) return 'defend';
        return null;
    },

    // ========== GAME LOOP ==========

    _loop() {
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;

        this._update(dt);
        this._render();

        if (this.phase !== 'matchOver') {
            this.animFrame = requestAnimationFrame(() => this._loop());
        } else {
            // Keep rendering for particles
            if (this.particles.length > 0) {
                this.animFrame = requestAnimationFrame(() => this._loop());
            }
        }
    },

    _update(dt) {
        // Countdown scale ease
        if (this.phase === 'countdown' && this.countdownScale > 1) {
            this.countdownScale = Math.max(1, this.countdownScale - dt * 3);
        }
        // Flash decay
        if (this.flashAlpha > 0) {
            this.flashAlpha = Math.max(0, this.flashAlpha - dt * 1.5);
        }
        // Round message timer
        if (this.roundMessageTimer > 0) {
            this.roundMessageTimer -= dt * 1000;
        }
        // Particles
        this._updateParticles(dt);
    },

    // ========== RENDERING ==========

    _render() {
        const ctx = this.ctx;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;
        ctx.clearRect(0, 0, w, h);

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Divider line
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w / 2, h);
        ctx.stroke();

        // Side labels
        this._renderSideLabels(ctx, w, h);

        // Avatars
        this._renderAvatars(ctx, w, h);

        // Round indicator dots
        this._renderRoundDots(ctx, w, h);

        // Phase-specific rendering
        switch (this.phase) {
            case 'intro':
                this._renderIntro(ctx, w, h);
                break;
            case 'countdown':
                this._renderCountdown(ctx, w, h);
                break;
            case 'waiting':
                this._renderWaiting(ctx, w, h);
                break;
            case 'symbol':
                this._renderSymbol(ctx, w, h);
                break;
            case 'resolved':
                this._renderResolved(ctx, w, h);
                break;
            case 'matchOver':
                this._renderMatchOver(ctx, w, h);
                break;
        }

        // Buttons (always visible for player)
        this._renderButtons(ctx, w, h);

        // Controls hint
        this._renderControlsHint(ctx, w, h);

        // Flash overlay
        if (this.flashAlpha > 0) {
            ctx.globalAlpha = this.flashAlpha * 0.3;
            ctx.fillStyle = this.flashColor;
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = 1;
        }

        // Particles on top
        this._renderParticles(ctx);
    },

    _renderSideLabels(ctx, w, h) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = 'bold 16px Outfit, sans-serif';
        ctx.fillStyle = '#00d4ff';
        ctx.fillText('YOU', w * 0.25, 16);
        ctx.fillStyle = '#ff2d7b';
        ctx.fillText('AI', w * 0.75, 16);

        // Scores
        ctx.font = 'bold 28px JetBrains Mono, monospace';
        ctx.fillStyle = '#00d4ff';
        ctx.fillText(String(this.playerWins), w * 0.25, 40);
        ctx.fillStyle = '#ff2d7b';
        ctx.fillText(String(this.aiWins), w * 0.75, 40);
    },

    _renderAvatars(ctx, w, h) {
        const avatarY = 120;
        const avatarR = 32;

        // Player avatar (left)
        ctx.beginPath();
        ctx.arc(w * 0.25, avatarY, avatarR, 0, Math.PI * 2);
        ctx.fillStyle = '#12121a';
        ctx.fill();
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Simple face
        ctx.fillStyle = '#00d4ff';
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\u{1F9D1}', w * 0.25, avatarY);

        // AI avatar (right)
        ctx.beginPath();
        ctx.arc(w * 0.75, avatarY, avatarR, 0, Math.PI * 2);
        ctx.fillStyle = '#12121a';
        ctx.fill();
        ctx.strokeStyle = '#ff2d7b';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#ff2d7b';
        ctx.font = '28px sans-serif';
        ctx.fillText('\u{1F916}', w * 0.75, avatarY);
    },

    _renderRoundDots(ctx, w, h) {
        const dotY = 88;
        const dotR = 6;
        const gap = 18;
        const totalW = this.maxRounds * (dotR * 2 + gap) - gap;
        const startX = (w - totalW) / 2;

        for (let i = 0; i < this.maxRounds; i++) {
            const cx = startX + i * (dotR * 2 + gap) + dotR;
            ctx.beginPath();
            ctx.arc(cx, dotY, dotR, 0, Math.PI * 2);
            if (i < this.roundResults.length) {
                ctx.fillStyle = this.roundResults[i] === 'player' ? '#00e676' : '#ff2d7b';
            } else if (i === this.round && this.phase !== 'matchOver') {
                ctx.fillStyle = '#ffd60a';
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
            }
            ctx.fill();
        }
    },

    _renderIntro(ctx, w, h) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#e8e8f0';
        ctx.font = 'bold 32px Outfit, sans-serif';
        ctx.fillText('REACTION DUEL', w / 2, h * 0.35);
        ctx.fillStyle = '#8888a0';
        ctx.font = '18px Outfit, sans-serif';
        ctx.fillText('Best of 7 rounds vs AI', w / 2, h * 0.35 + 40);
        ctx.fillText('\u2694\uFE0F Sword = ATTACK  |  \uD83D\uDEE1\uFE0F Shield = DEFEND', w / 2, h * 0.35 + 70);
    },

    _renderCountdown(ctx, w, h) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.save();
        const scale = this.countdownScale;
        ctx.translate(w / 2, h * 0.42);
        ctx.scale(scale, scale);
        ctx.fillStyle = '#ffd60a';
        ctx.font = 'bold 80px JetBrains Mono, monospace';
        ctx.fillText(String(this.countdownNum), 0, 0);
        ctx.restore();

        ctx.fillStyle = '#8888a0';
        ctx.font = '16px Outfit, sans-serif';
        ctx.fillText('Get ready...', w / 2, h * 0.42 + 60);
    },

    _renderWaiting(ctx, w, h) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#c0392b';
        ctx.font = 'bold 36px Outfit, sans-serif';
        ctx.fillText('WAIT FOR IT...', w / 2, h * 0.38);
        ctx.fillStyle = '#8888a0';
        ctx.font = '16px Outfit, sans-serif';
        ctx.fillText('Do NOT press yet!', w / 2, h * 0.38 + 40);

        // Pulsing border glow
        const t = performance.now() / 500;
        const pulse = (Math.sin(t) + 1) / 2;
        ctx.strokeStyle = `rgba(192, 57, 43, ${0.2 + pulse * 0.3})`;
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, w - 20, h - 20);
    },

    _renderSymbol(ctx, w, h) {
        const centerY = h * 0.38;

        // Draw the symbol
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (this.symbol === 'sword') {
            // Sword icon - drawn as crossed swords
            this._drawSword(ctx, w / 2, centerY);
            ctx.fillStyle = '#ff2d7b';
            ctx.font = 'bold 28px Outfit, sans-serif';
            ctx.fillText('ATTACK!', w / 2, centerY + 70);
        } else {
            // Shield icon
            this._drawShield(ctx, w / 2, centerY);
            ctx.fillStyle = '#00d4ff';
            ctx.font = 'bold 28px Outfit, sans-serif';
            ctx.fillText('DEFEND!', w / 2, centerY + 70);
        }

        // Urgency glow
        ctx.strokeStyle = this.symbol === 'sword' ? 'rgba(255,45,123,0.4)' : 'rgba(0,212,255,0.4)';
        ctx.lineWidth = 4;
        ctx.strokeRect(6, 6, w - 12, h - 12);
    },

    _drawSword(ctx, cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);

        // Blade
        ctx.fillStyle = '#e8e8f0';
        ctx.beginPath();
        ctx.moveTo(0, -50);
        ctx.lineTo(8, -10);
        ctx.lineTo(8, 20);
        ctx.lineTo(-8, 20);
        ctx.lineTo(-8, -10);
        ctx.closePath();
        ctx.fill();

        // Blade edge highlight
        ctx.fillStyle = '#ccc';
        ctx.beginPath();
        ctx.moveTo(0, -50);
        ctx.lineTo(-8, -10);
        ctx.lineTo(-8, 20);
        ctx.lineTo(0, 18);
        ctx.closePath();
        ctx.fill();

        // Guard
        ctx.fillStyle = '#ffd60a';
        ctx.fillRect(-20, 20, 40, 6);

        // Grip
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-5, 26, 10, 18);

        // Pommel
        ctx.fillStyle = '#ffd60a';
        ctx.beginPath();
        ctx.arc(0, 48, 5, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.shadowColor = '#ff2d7b';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = 'rgba(255,45,123,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -50);
        ctx.lineTo(8, -10);
        ctx.lineTo(8, 20);
        ctx.lineTo(-8, 20);
        ctx.lineTo(-8, -10);
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();
    },

    _drawShield(ctx, cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);

        // Shield shape
        ctx.beginPath();
        ctx.moveTo(0, -45);
        ctx.quadraticCurveTo(40, -40, 40, -10);
        ctx.quadraticCurveTo(40, 30, 0, 50);
        ctx.quadraticCurveTo(-40, 30, -40, -10);
        ctx.quadraticCurveTo(-40, -40, 0, -45);
        ctx.closePath();

        // Shield gradient
        const grad = ctx.createLinearGradient(-40, -45, 40, 50);
        grad.addColorStop(0, '#1a6dcc');
        grad.addColorStop(1, '#0e3d7a');
        ctx.fillStyle = grad;
        ctx.fill();

        // Shield border
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Inner cross
        ctx.strokeStyle = '#ffd60a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(0, 30);
        ctx.moveTo(-20, 0);
        ctx.lineTo(20, 0);
        ctx.stroke();

        // Glow
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(0, -45);
        ctx.quadraticCurveTo(40, -40, 40, -10);
        ctx.quadraticCurveTo(40, 30, 0, 50);
        ctx.quadraticCurveTo(-40, 30, -40, -10);
        ctx.quadraticCurveTo(-40, -40, 0, -45);
        ctx.closePath();
        ctx.strokeStyle = 'rgba(0,212,255,0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();
    },

    _renderResolved(ctx, w, h) {
        // Show what the symbol was
        const centerY = h * 0.32;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (this.symbol === 'sword') {
            this._drawSword(ctx, w / 2, centerY - 10);
        } else {
            this._drawShield(ctx, w / 2, centerY - 10);
        }

        // Round result message
        if (this.roundMessageTimer > 0) {
            const alpha = Math.min(1, this.roundMessageTimer / 500);
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 30px Outfit, sans-serif';
            const isPlayerWin = this.roundWinner === 'player';
            ctx.fillStyle = isPlayerWin ? '#00e676' : '#ff2d7b';

            // Scale animation
            const msgScale = 1 + Math.max(0, (this.roundMessageTimer - 1500) / 500) * 0.3;
            ctx.save();
            ctx.translate(w / 2, h * 0.55);
            ctx.scale(msgScale, msgScale);
            ctx.fillText(this.roundMessage, 0, 0);
            ctx.restore();
            ctx.globalAlpha = 1;
        }
    },

    _renderMatchOver(ctx, w, h) {
        const playerWon = this.playerWins > this.aiWins;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Big result text
        ctx.font = 'bold 40px Outfit, sans-serif';
        ctx.fillStyle = playerWon ? '#ffd60a' : '#ff2d7b';
        ctx.fillText(playerWon ? 'YOU WIN!' : 'AI WINS!', w / 2, h * 0.35);

        // Score
        ctx.font = 'bold 24px JetBrains Mono, monospace';
        ctx.fillStyle = '#e8e8f0';
        ctx.fillText(`${this.playerWins} - ${this.aiWins}`, w / 2, h * 0.35 + 50);

        // Subtitle
        ctx.font = '16px Outfit, sans-serif';
        ctx.fillStyle = '#8888a0';
        const diff = Math.abs(this.playerWins - this.aiWins);
        if (playerWon) {
            ctx.fillText(diff >= 3 ? 'Dominant victory!' : 'Close match!', w / 2, h * 0.35 + 85);
        } else {
            ctx.fillText(diff >= 3 ? 'AI was too fast!' : 'So close!', w / 2, h * 0.35 + 85);
        }
    },

    _renderButtons(ctx, w, h) {
        const a = this.attackBtn;
        const d = this.defendBtn;
        const canPress = this.phase === 'waiting' || this.phase === 'symbol';

        // Attack button
        const aHover = this.hoverBtn === 'attack';
        ctx.fillStyle = canPress ? (aHover ? '#ff4a8f' : '#ff2d7b') : 'rgba(255,45,123,0.3)';
        this._roundRect(ctx, a.x, a.y, a.w, a.h, 12);
        ctx.fill();
        if (canPress) {
            ctx.strokeStyle = 'rgba(255,45,123,0.6)';
            ctx.lineWidth = 2;
            this._roundRect(ctx, a.x, a.y, a.w, a.h, 12);
            ctx.stroke();
        }
        ctx.fillStyle = canPress ? '#fff' : 'rgba(255,255,255,0.4)';
        ctx.font = 'bold 16px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\u2694\uFE0F ATTACK', a.x + a.w / 2, a.y + a.h / 2 - 2);
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.fillStyle = canPress ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)';
        ctx.fillText('[A] / L-Click', a.x + a.w / 2, a.y + a.h / 2 + 16);

        // Defend button
        const dHover = this.hoverBtn === 'defend';
        ctx.fillStyle = canPress ? (dHover ? '#1ae0ff' : '#00d4ff') : 'rgba(0,212,255,0.3)';
        this._roundRect(ctx, d.x, d.y, d.w, d.h, 12);
        ctx.fill();
        if (canPress) {
            ctx.strokeStyle = 'rgba(0,212,255,0.6)';
            ctx.lineWidth = 2;
            this._roundRect(ctx, d.x, d.y, d.w, d.h, 12);
            ctx.stroke();
        }
        ctx.fillStyle = canPress ? '#fff' : 'rgba(255,255,255,0.4)';
        ctx.font = 'bold 16px Outfit, sans-serif';
        ctx.fillText('\uD83D\uDEE1\uFE0F DEFEND', d.x + d.w / 2, d.y + d.h / 2 - 2);
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.fillStyle = canPress ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)';
        ctx.fillText('[D] / R-Click', d.x + d.w / 2, d.y + d.h / 2 + 16);
    },

    _renderControlsHint(ctx, w, h) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = 'rgba(136,136,160,0.5)';
        ctx.font = '12px Outfit, sans-serif';
        ctx.fillText('A key / Left-click = Attack  |  D key / Right-click = Defend', w / 2, h - 10);
    },

    _roundRect(ctx, x, y, w, h, r) {
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

    // ========== LIFECYCLE ==========

    pause() {
        // No pause in this game type
    },

    resume() {},

    reset() {
        this._clearTimeouts();
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        this.animFrame = null;
        this.phase = 'intro';
        this.particles = [];
    },

    destroy() {
        this._clearTimeouts();
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        this.animFrame = null;
        document.removeEventListener('keydown', this._onKey);
        this.canvas.removeEventListener('click', this._onClick);
        this.canvas.removeEventListener('contextmenu', this._onContext);
        this.canvas.removeEventListener('touchstart', this._onTouch);
        this.canvas.removeEventListener('mousemove', this._onMouseMove);
    }
};

export default ReactionDuel;
