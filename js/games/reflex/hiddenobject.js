// Hidden Object Speed Hunt
// Find specific target objects scattered among a messy scene of random shapes

const SHAPE_TYPES = ['circle', 'square', 'triangle', 'star', 'diamond'];
const SHAPE_COLORS = [
    '#ff2d2d', '#2d7bff', '#00e676', '#ffd60a',
    '#b44dff', '#ff8c00', '#00d4ff', '#ff2d7b',
    '#ff6b9d', '#40e0d0', '#ff4500', '#7fff00'
];
const SHAPE_SIZES = [18, 22, 26, 30, 34];

function drawShape(ctx, type, x, y, size, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha || 1;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    switch (type) {
        case 'circle':
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'square':
            ctx.fillRect(x - size / 2, y - size / 2, size, size);
            break;
        case 'triangle':
            ctx.beginPath();
            ctx.moveTo(x, y - size / 2);
            ctx.lineTo(x - size / 2, y + size / 2);
            ctx.lineTo(x + size / 2, y + size / 2);
            ctx.closePath();
            ctx.fill();
            break;
        case 'star': {
            const spikes = 5;
            const outerR = size / 2;
            const innerR = size / 4;
            ctx.beginPath();
            for (let i = 0; i < spikes * 2; i++) {
                const r = i % 2 === 0 ? outerR : innerR;
                const angle = (Math.PI / 2 * -1) + (Math.PI / spikes) * i;
                const px = x + Math.cos(angle) * r;
                const py = y + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            break;
        }
        case 'diamond':
            ctx.beginPath();
            ctx.moveTo(x, y - size / 2);
            ctx.lineTo(x + size / 3, y);
            ctx.lineTo(x, y + size / 2);
            ctx.lineTo(x - size / 3, y);
            ctx.closePath();
            ctx.fill();
            break;
    }
    ctx.restore();
}

function shapesMatch(a, b) {
    return a.type === b.type && a.color === b.color && a.size === b.size;
}

const HiddenObject = {
    canvas: null,
    ctx: null,
    ui: null,

    // Game state
    score: 0,
    round: 0,
    gameOver: false,
    paused: false,
    animFrame: null,

    // Scene
    sceneObjects: [],   // all shapes in the scene
    targets: [],        // target shapes to find (3-5 descriptors)
    found: [],          // boolean array, which targets are found
    targetsPerRound: 3,

    // Timer
    timeLimit: 15000,
    timeLeft: 0,
    startTime: 0,
    timerInterval: null,
    penaltyFlash: 0,    // frames remaining for penalty flash

    // Feedback
    feedback: null,      // { type: 'correct'|'wrong', timer, x, y }
    particles: [],

    // Bound handlers
    handleClick: null,
    handleTouch: null,
    handleKey: null,

    // Scene area (below target bar)
    sceneTop: 100,

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;

        this.handleClick = this._onClick.bind(this);
        this.handleTouch = this._onTouch.bind(this);
        this.handleKey = this._onKey.bind(this);

        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
        document.addEventListener('keydown', this.handleKey);
    },

    start() {
        this.score = 0;
        this.round = 0;
        this.gameOver = false;
        this.paused = false;
        this.particles = [];
        this.feedback = null;
        this.penaltyFlash = 0;
        this.ui.setScore(0);
        this.ui.hideGameOver();
        this.nextRound();
        this._renderLoop();
    },

    nextRound() {
        this.round++;
        // Targets per round: 3 for rounds 1-3, 4 for 4-7, 5 for 8+
        if (this.round >= 8) this.targetsPerRound = 5;
        else if (this.round >= 4) this.targetsPerRound = 4;
        else this.targetsPerRound = 3;

        // Time limit: starts at 15s, decreases by 1s every 3 rounds, min 8s
        this.timeLimit = Math.max(8000, 15000 - Math.floor((this.round - 1) / 3) * 1000);

        this._generateScene();
        this._startTimer();
    },

    _generateScene() {
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;
        const sceneH = h - this.sceneTop - 10;
        const margin = 25;

        // Generate 45-55 random objects
        const totalObjects = 45 + Math.floor(Math.random() * 11);
        this.sceneObjects = [];

        for (let i = 0; i < totalObjects; i++) {
            this.sceneObjects.push({
                type: SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)],
                color: SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)],
                size: SHAPE_SIZES[Math.floor(Math.random() * SHAPE_SIZES.length)],
                x: margin + Math.random() * (w - margin * 2),
                y: this.sceneTop + margin + Math.random() * (sceneH - margin * 2),
                rotation: Math.random() * Math.PI * 2
            });
        }

        // Pick targets from distinct shape/color/size combos
        this.targets = [];
        this.found = [];
        const usedCombos = new Set();

        for (let t = 0; t < this.targetsPerRound; t++) {
            let attempts = 0;
            let target;
            do {
                const idx = Math.floor(Math.random() * this.sceneObjects.length);
                const obj = this.sceneObjects[idx];
                const key = `${obj.type}-${obj.color}-${obj.size}`;
                if (!usedCombos.has(key)) {
                    usedCombos.add(key);
                    target = { type: obj.type, color: obj.color, size: obj.size, sceneIdx: idx };
                }
                attempts++;
            } while (!target && attempts < 200);

            if (!target) {
                // Fallback: just pick any object
                const idx = Math.floor(Math.random() * this.sceneObjects.length);
                const obj = this.sceneObjects[idx];
                target = { type: obj.type, color: obj.color, size: obj.size, sceneIdx: idx };
            }
            this.targets.push(target);
            this.found.push(false);
        }
    },

    _startTimer() {
        this.timeLeft = this.timeLimit;
        this.startTime = performance.now();
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.paused || this.gameOver) return;
            this.timeLeft = Math.max(0, this.timeLimit - (performance.now() - this.startTime));
            if (this.timeLeft <= 0) {
                this._endGame();
            }
        }, 30);
    },

    _onClick(e) {
        if (this.gameOver || this.paused) return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.ui.canvasW / rect.width;
        const scaleY = this.ui.canvasH / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        this._handleInput(x, y);
    },

    _onTouch(e) {
        e.preventDefault();
        if (this.gameOver || this.paused) return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.ui.canvasW / rect.width;
        const scaleY = this.ui.canvasH / rect.height;
        const x = (e.touches[0].clientX - rect.left) * scaleX;
        const y = (e.touches[0].clientY - rect.top) * scaleY;
        this._handleInput(x, y);
    },

    _onKey(e) {
        if (e.key === 'p' || e.key === 'P') {
            if (this.gameOver) return;
            if (this.paused) this.resume();
            else this.pause();
        }
    },

    _handleInput(x, y) {
        // Only check objects in the scene area
        if (y < this.sceneTop) return;

        // Find the topmost (last drawn) object under click
        let hitIdx = -1;
        for (let i = this.sceneObjects.length - 1; i >= 0; i--) {
            const obj = this.sceneObjects[i];
            const dx = x - obj.x;
            const dy = y - obj.y;
            const hitR = obj.size / 2 + 6; // generous hit area
            if (dx * dx + dy * dy <= hitR * hitR) {
                hitIdx = i;
                break;
            }
        }

        if (hitIdx === -1) return; // clicked empty space

        const hitObj = this.sceneObjects[hitIdx];

        // Check if this object matches any unfound target
        let matchedTarget = -1;
        for (let t = 0; t < this.targets.length; t++) {
            if (this.found[t]) continue;
            if (shapesMatch(hitObj, this.targets[t])) {
                matchedTarget = t;
                break;
            }
        }

        if (matchedTarget >= 0) {
            // Correct find
            this.found[matchedTarget] = true;
            this.feedback = { type: 'correct', timer: 20, x: hitObj.x, y: hitObj.y };
            this._spawnParticles(hitObj.x, hitObj.y, hitObj.color);

            // Remove found object from scene so it can't be clicked again
            this.sceneObjects.splice(hitIdx, 1);

            // Check if all targets found
            if (this.found.every(f => f)) {
                this.score++;
                this.ui.setScore(this.score);
                clearInterval(this.timerInterval);
                // Brief pause then next round
                setTimeout(() => {
                    if (!this.gameOver) this.nextRound();
                }, 600);
            }
        } else {
            // Wrong click: -2 seconds penalty
            this.feedback = { type: 'wrong', timer: 15, x: hitObj.x, y: hitObj.y };
            this.penaltyFlash = 12;
            const elapsed = performance.now() - this.startTime;
            this.startTime -= 2000; // effectively removes 2 seconds
            this.timeLeft = Math.max(0, this.timeLimit - (performance.now() - this.startTime));
            if (this.timeLeft <= 0) {
                this._endGame();
            }
        }
    },

    _spawnParticles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i + Math.random() * 0.3;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 30 + Math.floor(Math.random() * 15),
                maxLife: 45,
                color,
                size: 2 + Math.random() * 3
            });
        }
    },

    _updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // gravity
            p.life--;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    },

    _endGame() {
        this.gameOver = true;
        clearInterval(this.timerInterval);
        cancelAnimationFrame(this.animFrame);
        // Score = rounds completed (current round was not completed)
        const finalScore = Math.max(0, this.score);
        this.ui.setHighScore(finalScore);
        const best = this.ui.getHighScore();
        this.ui.showGameOver(finalScore, best);
    },

    _renderLoop() {
        if (this.gameOver) return;
        this._updateParticles();
        if (this.feedback && this.feedback.timer > 0) this.feedback.timer--;
        if (this.penaltyFlash > 0) this.penaltyFlash--;
        this._render();
        this.animFrame = requestAnimationFrame(() => this._renderLoop());
    },

    _render() {
        const ctx = this.ctx;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Penalty flash
        if (this.penaltyFlash > 0) {
            ctx.fillStyle = `rgba(255,45,45,${this.penaltyFlash * 0.02})`;
            ctx.fillRect(0, 0, w, h);
        }

        // Correct flash
        if (this.feedback && this.feedback.type === 'correct' && this.feedback.timer > 0) {
            ctx.fillStyle = `rgba(0,230,118,${this.feedback.timer * 0.008})`;
            ctx.fillRect(0, 0, w, h);
        }

        // --- Target bar at top ---
        ctx.fillStyle = '#12121a';
        ctx.fillRect(0, 0, w, this.sceneTop);
        // Bottom border
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, this.sceneTop);
        ctx.lineTo(w, this.sceneTop);
        ctx.stroke();

        // "Find these:" label
        ctx.fillStyle = '#8888a0';
        ctx.font = '14px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('Find these:', 15, 22);

        // Round counter
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 14px JetBrains Mono, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`Round ${this.round}`, w - 15, 22);

        // Draw target shapes
        const targetY = 60;
        const totalTargetW = this.targets.length * 60;
        const startX = (w - totalTargetW) / 2 + 30;

        for (let t = 0; t < this.targets.length; t++) {
            const tx = startX + t * 60;
            const target = this.targets[t];

            // Background circle for target slot
            ctx.fillStyle = this.found[t] ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.05)';
            ctx.beginPath();
            ctx.arc(tx, targetY, 22, 0, Math.PI * 2);
            ctx.fill();

            // Border
            ctx.strokeStyle = this.found[t] ? '#00e676' : 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            if (this.found[t]) {
                // Checkmark
                ctx.strokeStyle = '#00e676';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(tx - 8, targetY);
                ctx.lineTo(tx - 2, targetY + 7);
                ctx.lineTo(tx + 10, targetY - 7);
                ctx.stroke();
            } else {
                // Draw the target shape (scaled to fit in slot)
                const displaySize = Math.min(target.size, 28);
                drawShape(ctx, target.type, tx, targetY, displaySize, target.color, 1);
            }
        }

        // Timer bar
        const barMargin = 15;
        const barW = w - barMargin * 2;
        const barH = 6;
        const barY = this.sceneTop - 12;

        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.roundRect(barMargin, barY, barW, barH, 3);
        ctx.fill();

        const pct = this.timeLeft / this.timeLimit;
        const timerColor = pct > 0.5 ? '#00d4ff' : pct > 0.25 ? '#ffd60a' : '#ff2d7b';
        if (pct > 0) {
            ctx.fillStyle = timerColor;
            ctx.beginPath();
            ctx.roundRect(barMargin, barY, barW * pct, barH, 3);
            ctx.fill();
        }

        // --- Scene objects ---
        for (let i = 0; i < this.sceneObjects.length; i++) {
            const obj = this.sceneObjects[i];
            // Highlight objects that match an unfound target with a subtle pulse
            let isTarget = false;
            for (let t = 0; t < this.targets.length; t++) {
                if (!this.found[t] && shapesMatch(obj, this.targets[t])) {
                    isTarget = true;
                    break;
                }
            }
            drawShape(ctx, obj.type, obj.x, obj.y, obj.size, obj.color, isTarget ? 1 : 0.7);
        }

        // --- Particles ---
        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // --- Feedback indicator ---
        if (this.feedback && this.feedback.timer > 0) {
            const f = this.feedback;
            const alpha = f.timer / 20;
            if (f.type === 'wrong') {
                ctx.strokeStyle = `rgba(255,45,45,${alpha})`;
                ctx.lineWidth = 3;
                const s = 14;
                ctx.beginPath();
                ctx.moveTo(f.x - s, f.y - s);
                ctx.lineTo(f.x + s, f.y + s);
                ctx.moveTo(f.x + s, f.y - s);
                ctx.lineTo(f.x - s, f.y + s);
                ctx.stroke();

                // Penalty text
                ctx.fillStyle = `rgba(255,45,45,${alpha})`;
                ctx.font = 'bold 16px JetBrains Mono, monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText('-2s', f.x, f.y - 18);
                ctx.textBaseline = 'alphabetic';
            }
        }

        // --- Pause overlay ---
        if (this.paused) {
            ctx.fillStyle = 'rgba(10,10,15,0.8)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#e8e8f0';
            ctx.font = 'bold 36px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', w / 2, h / 2 - 10);
            ctx.fillStyle = '#8888a0';
            ctx.font = '16px Outfit, sans-serif';
            ctx.fillText('Press P to resume', w / 2, h / 2 + 25);
        }
    },

    pause() {
        if (this.gameOver) return;
        this.paused = true;
        // Adjust start time so timer pauses correctly
        this._pauseElapsed = performance.now() - this.startTime;
        this.ui.showPause();
    },

    resume() {
        if (this.gameOver) return;
        this.paused = false;
        // Restore start time so timer continues from where it paused
        this.startTime = performance.now() - this._pauseElapsed;
        this.ui.hidePause();
    },

    reset() {
        clearInterval(this.timerInterval);
        cancelAnimationFrame(this.animFrame);
        this.particles = [];
        this.feedback = null;
    },

    destroy() {
        clearInterval(this.timerInterval);
        cancelAnimationFrame(this.animFrame);
        if (this.canvas) {
            this.canvas.removeEventListener('click', this.handleClick);
            this.canvas.removeEventListener('touchstart', this.handleTouch);
        }
        document.removeEventListener('keydown', this.handleKey);
    }
};

export default HiddenObject;
