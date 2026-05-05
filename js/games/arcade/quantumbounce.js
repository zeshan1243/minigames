// ─── Quantum Bounce: Physics Ball Platformer ───
const SAVE_KEY = 'quantumbounce_progress';

function loadProgress() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || { unlocked: 1, deaths: 0, completed: {} }; }
    catch { return { unlocked: 1, deaths: 0, completed: {} }; }
}
function saveProgress(p) { localStorage.setItem(SAVE_KEY, JSON.stringify(p)); }

// ─── Level Builder ───
function LEVELS(W, H) {
    // Helpers
    const P = (x, y, w, h) => ({ x, y, w, h: h || 16, type: 'solid' }); // platform
    const MP = (x, y, w, h, axis, range, spd) => ({ x, y, w, h: h || 16, type: 'moving', axis, originX: x, originY: y, range, speed: spd }); // moving platform
    const SPR = (x, y) => ({ x, y, w: 30, h: 12, type: 'spring' }); // spring pad
    const PORT = (x1, y1, x2, y2) => [{ x: x1, y: y1, pair: 1 }, { x: x2, y: y2, pair: 1 }]; // portal pair
    const SZ = (x, y, w, h, mult) => ({ x, y, w, h, multiplier: mult }); // speed zone
    const SPIKE = (x, y, w, dir) => ({ x, y, w, h: 14, dir: dir || 'up' }); // spike/hazard
    const COIN = (x, y) => ({ x, y, collected: false }); // collectible
    const gY = H - 16; // ground Y
    const G = P(0, gY, W, 20); // full ground

    return [
        { // Level 1: Basics — platforms, coins, simple jumps
            name: 'First Steps',
            hint: 'Move + Jump. Collect coins. Reach the flag.',
            playerStart: { x: 60, y: gY - 20 },
            goal: { x: 720, y: gY - 50 },
            platforms: [
                G,
                P(150, gY - 60, 100), P(300, gY - 110, 100), P(460, gY - 70, 120),
                P(620, gY - 120, 120)
            ],
            springs: [],
            portals: [],
            speedZones: [],
            spikes: [],
            coins: [COIN(200, gY - 90), COIN(350, gY - 140), COIN(520, gY - 100), COIN(680, gY - 150)],
            movingPlatforms: []
        },
        { // Level 2: Springs + Moving Platforms
            name: 'Spring Loaded',
            hint: 'Springs launch you! Moving platforms carry you.',
            playerStart: { x: 60, y: gY - 20 },
            goal: { x: 720, y: gY - 50 },
            platforms: [
                G,
                P(150, gY - 50, 80), P(350, gY - 50, 80),
                P(550, gY - 50, 100), P(680, gY - 100, 100)
            ],
            springs: [SPR(170, gY - 66), SPR(370, gY - 66)],
            portals: [],
            speedZones: [],
            spikes: [SPIKE(240, gY - 14, 80)],
            coins: [COIN(190, gY - 160), COIN(390, gY - 160), COIN(600, gY - 80), COIN(730, gY - 130)],
            movingPlatforms: [MP(460, gY - 100, 70, 16, 'y', 40, 40)]
        },
        { // Level 3: Portals
            name: 'Portal Hop',
            hint: 'Enter a portal, exit the other! Press G to flip gravity.',
            playerStart: { x: 60, y: gY - 20 },
            goal: { x: 720, y: 80 },
            platforms: [
                G,
                P(0, 60, W, 16), // ceiling
                P(180, gY - 80, 80), P(400, gY - 140, 80),
                P(500, 100, 100),
                P(660, 60, 110)
            ],
            springs: [],
            portals: [
                { x: 450, y: gY - 170, pair: 0 }, { x: 520, y: 120, pair: 0 }
            ],
            speedZones: [],
            spikes: [SPIKE(280, gY - 14, 100), SPIKE(600, gY - 14, 50)],
            coins: [COIN(220, gY - 110), COIN(440, gY - 170), COIN(550, 80), COIN(700, 40)],
            movingPlatforms: []
        },
        { // Level 4: Speed Zones + Gravity Flip
            name: 'Speed Warp',
            hint: 'Green = fast, Red = slow. Flip gravity to navigate!',
            playerStart: { x: 60, y: gY - 20 },
            goal: { x: 720, y: 80 },
            platforms: [
                G,
                P(0, 60, W, 16), // ceiling
                P(200, gY - 80, 90), P(350, gY - 150, 80),
                P(500, 100, 100),
                P(650, 80, 120)
            ],
            springs: [SPR(220, gY - 96)],
            portals: [],
            speedZones: [
                SZ(100, gY - 30, 80, 30, 2.0), // speed boost
                SZ(500, gY - 30, 80, 30, 0.3), // slow zone
            ],
            spikes: [SPIKE(300, gY - 14, 40), SPIKE(420, gY - 14, 60), SPIKE(200, 76, 60, 'down')],
            coins: [COIN(140, gY - 60), COIN(390, gY - 180), COIN(550, 80), COIN(700, 50)],
            movingPlatforms: [MP(430, gY - 100, 70, 16, 'y', 50, 40)]
        },
        { // Level 5: Everything combined
            name: 'Quantum Chaos',
            hint: 'All mechanics! Springs, portals, speed, gravity. Good luck!',
            playerStart: { x: 60, y: gY - 20 },
            goal: { x: 700, y: 80 },
            platforms: [
                P(0, gY, 250, 20), P(350, gY, 200, 20), P(620, gY, 180, 20),
                P(0, 60, W, 16), // ceiling
                P(180, gY - 100, 70), P(450, gY - 80, 70),
                P(300, 100, 80), P(550, 120, 80),
                P(650, 80, 120)
            ],
            springs: [SPR(190, gY - 116), SPR(460, gY - 96)],
            portals: [
                { x: 230, y: gY - 140, pair: 0 }, { x: 320, y: 120, pair: 0 },
                { x: 600, y: gY - 40, pair: 1 }, { x: 570, y: 140, pair: 1 }
            ],
            speedZones: [
                SZ(350, gY - 30, 60, 30, 2.5),
                SZ(620, gY - 30, 50, 30, 0.3)
            ],
            spikes: [
                SPIKE(250, gY - 14, 80), SPIKE(560, gY - 14, 50),
                SPIKE(400, 76, 40, 'down'), SPIKE(500, 76, 40, 'down')
            ],
            coins: [
                COIN(200, gY - 140), COIN(350, 80), COIN(470, gY - 120),
                COIN(580, 100), COIN(700, 50)
            ],
            movingPlatforms: [
                MP(280, gY - 50, 60, 16, 'x', 50, 60),
                MP(520, 180, 70, 16, 'y', 60, 45)
            ]
        },
        { // Level 6: Vertical gauntlet
            name: 'Ascension',
            hint: 'Go up. Way up. Don\'t fall.',
            playerStart: { x: 60, y: gY - 20 },
            goal: { x: 400, y: 50 },
            platforms: [
                P(0, gY, 200, 20),
                P(120, gY - 80, 80), P(260, gY - 160, 80),
                P(100, gY - 250, 80), P(280, gY - 330, 80),
                P(140, gY - 410, 80), P(320, gY - 470, 100),
                P(350, 30, 140)
            ],
            springs: [SPR(140, gY - 96), SPR(280, gY - 346), SPR(160, gY - 426)],
            portals: [],
            speedZones: [],
            spikes: [SPIKE(200, gY - 14, 50), SPIKE(180, gY - 250, 40, 'down')],
            coins: [COIN(160, gY - 120), COIN(300, gY - 200), COIN(140, gY - 290), COIN(320, gY - 370), COIN(400, 20)],
            movingPlatforms: [MP(200, gY - 160, 60, 16, 'x', 50, 50)]
        },
        { // Level 7: Portal maze
            name: 'Wormhole',
            hint: 'Chain portals. Think before you jump.',
            playerStart: { x: 40, y: gY - 20 },
            goal: { x: 720, y: gY - 50 },
            platforms: [
                P(0, gY, 120, 20), P(250, gY, 80, 20), P(500, gY, 80, 20), P(680, gY, 120, 20),
                P(100, gY - 120, 80), P(350, gY - 200, 80),
                P(550, gY - 120, 80), P(200, gY - 280, 80)
            ],
            springs: [],
            portals: [
                { x: 130, y: gY - 150, pair: 0 }, { x: 370, y: gY - 230, pair: 0 },
                { x: 420, y: gY - 230, pair: 1 }, { x: 570, y: gY - 150, pair: 1 },
                { x: 230, y: gY - 310, pair: 2 }, { x: 700, y: gY - 30, pair: 2 }
            ],
            speedZones: [],
            spikes: [SPIKE(130, gY - 14, 100), SPIKE(350, gY - 14, 120), SPIKE(590, gY - 14, 70)],
            coins: [COIN(140, gY - 160), COIN(390, gY - 240), COIN(590, gY - 160), COIN(240, gY - 320)],
            movingPlatforms: []
        },
        { // Level 8: Speed run
            name: 'Velocity',
            hint: 'Speed zones everywhere. Control is key.',
            playerStart: { x: 40, y: gY - 20 },
            goal: { x: 720, y: gY - 50 },
            platforms: [
                G,
                P(140, gY - 60, 80), P(300, gY - 110, 80), P(460, gY - 60, 80), P(620, gY - 110, 100)
            ],
            springs: [SPR(160, gY - 76)],
            portals: [],
            speedZones: [
                SZ(50, gY - 30, 70, 30, 2.5),
                SZ(220, gY - 30, 60, 30, 0.3),
                SZ(380, gY - 30, 60, 30, 2.8),
                SZ(550, gY - 30, 50, 30, 0.2)
            ],
            spikes: [SPIKE(170, gY - 14, 40), SPIKE(330, gY - 14, 40), SPIKE(500, gY - 14, 40)],
            coins: [COIN(80, gY - 60), COIN(340, gY - 140), COIN(500, gY - 90), COIN(670, gY - 140)],
            movingPlatforms: [MP(380, gY - 80, 60, 16, 'y', 40, 60)]
        },
        { // Level 9: Gravity dance
            name: 'Upside Down',
            hint: 'Master gravity flipping. The ceiling is your friend.',
            playerStart: { x: 40, y: gY - 20 },
            goal: { x: 720, y: 80 },
            platforms: [
                P(0, gY, 180, 20), P(280, gY, 100, 20), P(480, gY, 100, 20),
                P(0, 60, W, 16),
                P(180, gY - 80, 70), P(400, 80, 70), P(560, gY - 80, 70),
                P(660, 60, 120)
            ],
            springs: [],
            portals: [],
            speedZones: [],
            spikes: [
                SPIKE(190, gY - 14, 70), SPIKE(400, gY - 14, 70),
                SPIKE(300, 76, 60, 'down'), SPIKE(500, 76, 50, 'down')
            ],
            coins: [COIN(220, gY - 110), COIN(420, 60), COIN(590, gY - 110), COIN(700, 50)],
            movingPlatforms: []
        },
        { // Level 10: The gauntlet — everything
            name: 'The Gauntlet',
            hint: 'Every mechanic. No mercy. You\'ve earned this.',
            playerStart: { x: 40, y: gY - 20 },
            goal: { x: 700, y: 50 },
            platforms: [
                P(0, gY, 150, 20), P(300, gY, 80, 20), P(550, gY, 80, 20),
                P(0, 40, W, 16),
                P(150, gY - 100, 60), P(350, gY - 160, 60),
                P(250, 80, 60), P(500, 100, 60),
                P(650, 40, 120)
            ],
            springs: [SPR(160, gY - 116), SPR(360, gY - 176)],
            portals: [
                { x: 200, y: gY - 150, pair: 0 }, { x: 270, y: 100, pair: 0 },
                { x: 520, y: 120, pair: 1 }, { x: 670, y: 60, pair: 1 }
            ],
            speedZones: [
                SZ(50, gY - 30, 80, 30, 2.0),
                SZ(300, gY - 30, 60, 30, 0.3),
                SZ(430, 60, 50, 30, 2.5)
            ],
            spikes: [
                SPIKE(160, gY - 14, 120), SPIKE(400, gY - 14, 130),
                SPIKE(150, 56, 80, 'down'), SPIKE(400, 56, 80, 'down')
            ],
            coins: [
                COIN(80, gY - 60), COIN(180, gY - 140), COIN(380, gY - 200),
                COIN(280, 60), COIN(530, 80), COIN(700, 20)
            ],
            movingPlatforms: [
                MP(220, gY - 50, 60, 16, 'x', 60, 55),
                MP(450, gY - 100, 60, 16, 'y', 80, 40),
                MP(580, 150, 60, 16, 'y', 50, 50)
            ]
        }
    ];
}

const MAX_LEVEL = 10;

// ─── Particle System ───
class Particle {
    constructor(x, y, vx, vy, color, life, size) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.color = color; this.life = life; this.maxLife = life;
        this.size = size;
    }
    update(dt, grav) {
        this.x += this.vx * dt; this.y += this.vy * dt;
        this.vy += grav * 0.3 * dt;
        this.life -= dt;
    }
    draw(ctx) {
        const a = Math.max(0, this.life / this.maxLife);
        ctx.globalAlpha = a;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * a, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// ─── Main Game ───
const QuantumBounce = {
    canvas: null, ctx: null, ui: null, animFrame: null,
    W: 800, H: 620,
    screen: 'select', // 'select' | 'play'
    progress: null,
    selectHover: -1,

    // Game state
    level: 1, deaths: 0, levelDeaths: 0,
    paused: false, gameOver: false, levelComplete: false,
    levelCompleteTimer: 0,

    // Ball (player)
    ball: null,
    BALL_R: 12,
    GRAVITY: 900,
    JUMP_VEL: -420,
    MOVE_ACCEL: 1400,
    MAX_SPEED: 280,
    FRICTION: 0.88,
    BOUNCE_FACTOR: 0.35,
    gravityFlipped: false,
    gravityFlipCooldown: 0,

    // Level data
    platforms: [], springs: [], portals: [], speedZones: [],
    spikes: [], coins: [], movingPlatforms: [], goal: null,

    // Effects
    particles: [],
    shakeTimer: 0, shakeX: 0, shakeY: 0,
    portalCooldown: 0,
    trailPositions: [],

    // Input
    keys: {},
    touchLeft: false, touchRight: false, touchJump: false,
    _onClick: null,

    // Colors
    C: {
        bg: '#0a0a1a',
        ball: '#00d4ff',
        ballGlow: 'rgba(0,212,255,0.3)',
        platform: '#1e2a4a',
        platformTop: '#2a3a6a',
        spring: '#00e676',
        portal1: '#b44dff',
        portal2: '#ff2d7b',
        speedFast: 'rgba(0,230,118,0.25)',
        speedSlow: 'rgba(255,45,123,0.25)',
        spike: '#ff2d7b',
        coin: '#ffd60a',
        coinGlow: 'rgba(255,214,10,0.3)',
        goal: '#00e676',
        goalGlow: 'rgba(0,230,118,0.4)',
        text: '#e8e8f0',
        accent: '#00d4ff',
        deathCounter: '#ff2d7b'
    },

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.W = ui.canvasW; this.H = ui.canvasH;
        this.progress = loadProgress();
        this.deaths = this.progress.deaths || 0;

        this._onKey = (e) => this.handleKey(e);
        this._onKeyUp = (e) => this.handleKeyUp(e);
        this._onTouchStart = (e) => this.handleTouchStart(e);
        this._onTouchEnd = (e) => this.handleTouchEnd(e);
        this._onClick = (e) => this.handleClick(e);
        this._onMouseMove = (e) => this.handleMouseMove(e);
        document.addEventListener('keydown', this._onKey);
        document.addEventListener('keyup', this._onKeyUp);
        canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
        canvas.addEventListener('touchend', this._onTouchEnd, { passive: false });
        canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        canvas.addEventListener('click', this._onClick);
        canvas.addEventListener('mousemove', this._onMouseMove);
    },

    start() {
        this.screen = 'select'; this.gameOver = false; this.paused = false;
        this.ui.hideGameOver(); this.ui.hidePause();
        this.ui.setScore(`${Object.keys(this.progress.completed).length}/${MAX_LEVEL} cleared`);
        this.lastTime = performance.now(); this.loop();
    },
    reset() { this.progress = loadProgress(); this.deaths = this.progress.deaths || 0; this.screen = 'select'; this.gameOver = false; this.paused = false; },
    pause() { this.paused = true; this.ui.showPause(); },
    resume() { this.paused = false; this.ui.hidePause(); this.lastTime = performance.now(); this.loop(); },
    destroy() {
        document.removeEventListener('keydown', this._onKey);
        document.removeEventListener('keyup', this._onKeyUp);
        this.canvas.removeEventListener('touchstart', this._onTouchStart);
        this.canvas.removeEventListener('touchend', this._onTouchEnd);
        this.canvas.removeEventListener('click', this._onClick);
        this.canvas.removeEventListener('mousemove', this._onMouseMove);
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
    },

    // ─── Input ───
    getCanvasPos(e) {
        const r = this.canvas.getBoundingClientRect();
        return { x: (e.clientX - r.left) * (this.W / r.width), y: (e.clientY - r.top) * (this.H / r.height) };
    },
    handleClick(e) {
        if (this.screen !== 'select') return;
        const p = this.getCanvasPos(e);
        const lv = this.hitTestLevel(p.x, p.y);
        if (lv > 0 && lv <= this.progress.unlocked) this.startLevel(lv);
    },
    handleMouseMove(e) {
        if (this.screen !== 'select') return;
        const p = this.getCanvasPos(e);
        this.selectHover = this.hitTestLevel(p.x, p.y);
    },
    hitTestLevel(mx, my) {
        const cols = 5, cellW = 120, cellH = 100;
        const ox = (this.W - cols * cellW) / 2, oy = 160;
        for (let i = 0; i < MAX_LEVEL; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            const cx = ox + col * cellW + cellW / 2, cy = oy + row * cellH + cellH / 2;
            if ((mx - cx) ** 2 + (my - cy) ** 2 < 34 * 34) return i + 1;
        }
        return -1;
    },
    handleKey(e) {
        const k = e.key;
        if (this.screen === 'select') return;
        if (k === 'Escape') { this.screen = 'select'; this.ui.setScore(`${Object.keys(this.progress.completed).length}/${MAX_LEVEL} cleared`); return; }
        if (k === 'r' || k === 'R') { this.startLevel(this.level); return; }
        if (k === 'p' || k === 'P') { if (!this.gameOver && !this.levelComplete) { this.paused ? this.resume() : this.pause(); } return; }
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','w','W','a','A','d','D','g','G'].includes(k)) e.preventDefault();
        this.keys[k] = true;
    },
    handleKeyUp(e) { this.keys[e.key] = false; },
    handleTouchStart(e) {
        e.preventDefault();
        if (this.screen === 'select') {
            const t = e.changedTouches[0], p = this.getCanvasPos(t);
            const lv = this.hitTestLevel(p.x, p.y);
            if (lv > 0 && lv <= this.progress.unlocked) this.startLevel(lv);
            return;
        }
        const rect = this.canvas.getBoundingClientRect(), sx = this.W / rect.width;
        for (const t of e.changedTouches) {
            const x = (t.clientX - rect.left) * sx;
            if (x < this.W * 0.33) this.touchLeft = true;
            else if (x > this.W * 0.66) this.touchRight = true;
            else this.touchJump = true;
        }
    },
    handleTouchEnd(e) { e.preventDefault(); this.touchLeft = this.touchRight = this.touchJump = false; },

    // ─── Level Select ───
    renderSelect() {
        const ctx = this.ctx, W = this.W, H = this.H;
        ctx.fillStyle = this.C.bg; ctx.fillRect(0, 0, W, H);

        // Animated BG particles
        const t = performance.now() / 1000;
        for (let i = 0; i < 30; i++) {
            const px = (i * 137.5 + t * 20) % W;
            const py = (i * 89.3 + Math.sin(t + i) * 30) % H;
            ctx.fillStyle = `rgba(0,212,255,${0.03 + Math.sin(t + i * 0.5) * 0.02})`;
            ctx.beginPath(); ctx.arc(px, py, 2 + Math.sin(t + i) * 1, 0, Math.PI * 2); ctx.fill();
        }

        // Title
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px Outfit, sans-serif';
        const grad = ctx.createLinearGradient(W/2 - 150, 0, W/2 + 150, 0);
        grad.addColorStop(0, '#00d4ff'); grad.addColorStop(1, '#b44dff');
        ctx.fillStyle = grad;
        ctx.fillText('QUANTUM BOUNCE', W / 2, 55);

        // Subtitle
        ctx.font = '14px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText('Springs \u2022 Portals \u2022 Speed Zones \u2022 Gravity Flip', W / 2, 80);

        // Stats
        ctx.font = 'bold 14px JetBrains Mono, monospace';
        ctx.fillStyle = this.C.deathCounter; ctx.textAlign = 'left';
        ctx.fillText(`\uD83D\uDC80 Deaths: ${this.deaths}`, 20, 120);
        const cleared = Object.keys(this.progress.completed).length;
        ctx.textAlign = 'right'; ctx.fillStyle = '#00e676';
        ctx.fillText(`\u2705 ${cleared}/${MAX_LEVEL}`, W - 20, 120);

        // Level grid
        const cols = 5, cellW = 120, cellH = 100;
        const ox = (W - cols * cellW) / 2, oy = 160;
        const levels = LEVELS(W, H);

        for (let i = 0; i < MAX_LEVEL; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            const cx = ox + col * cellW + cellW / 2, cy = oy + row * cellH + cellH / 2;
            const lv = i + 1, unlocked = lv <= this.progress.unlocked;
            const completed = !!this.progress.completed[lv];
            const hovered = this.selectHover === lv;

            // Glow for unlocked
            if (unlocked && !completed) {
                ctx.save();
                ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = hovered ? 20 : 8;
                ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0,212,255,0.05)'; ctx.fill();
                ctx.restore();
            }

            const r = hovered && unlocked ? 32 : 28;
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);

            if (completed) {
                ctx.fillStyle = '#00e676'; ctx.fill();
                ctx.fillStyle = '#000'; ctx.font = 'bold 18px Outfit, sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('\u2713', cx, cy + 7);
            } else if (unlocked) {
                ctx.fillStyle = hovered ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.06)'; ctx.fill();
                ctx.strokeStyle = '#00d4ff'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = hovered ? '#00d4ff' : this.C.text;
                ctx.font = 'bold 18px Outfit, sans-serif'; ctx.textAlign = 'center';
                ctx.fillText(lv, cx, cy + 7);
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.02)'; ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.stroke();
                ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('\uD83D\uDD12', cx, cy + 6);
            }

            // Level name
            if (unlocked && levels[i]) {
                ctx.font = '10px Outfit, sans-serif';
                ctx.fillStyle = completed ? 'rgba(0,230,118,0.6)' : 'rgba(255,255,255,0.35)';
                ctx.textAlign = 'center';
                ctx.fillText(levels[i].name, cx, cy + r + 16);
            }

            // Best deaths
            if (completed && this.progress.completed[lv] !== undefined) {
                ctx.font = '9px JetBrains Mono, monospace'; ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillText(`${this.progress.completed[lv]}\uD83D\uDC80`, cx, cy - r - 6);
            }
        }

        ctx.font = '12px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.textAlign = 'center';
        ctx.fillText('Click level \u2022 Arrows/WASD + Space \u2022 G = gravity flip \u2022 R = retry \u2022 ESC = back', W / 2, H - 18);
    },

    // ─── Level Loading ───
    startLevel(num) {
        this.screen = 'play'; this.level = num;
        this.levelDeaths = 0; this.levelComplete = false;
        this.loadLevel(num); this.lastTime = performance.now();
    },

    loadLevel(num) {
        const levels = LEVELS(this.W, this.H);
        const def = levels[num - 1];
        if (!def) return;

        this.platforms = JSON.parse(JSON.stringify(def.platforms));
        this.springs = JSON.parse(JSON.stringify(def.springs));
        this.portals = JSON.parse(JSON.stringify(def.portals));
        this.speedZones = JSON.parse(JSON.stringify(def.speedZones));
        this.spikes = JSON.parse(JSON.stringify(def.spikes));
        this.coins = JSON.parse(JSON.stringify(def.coins));
        this.movingPlatforms = JSON.parse(JSON.stringify(def.movingPlatforms));
        this.goal = JSON.parse(JSON.stringify(def.goal));
        this.allPlatforms = [...this.platforms, ...this.movingPlatforms];

        this.ball = {
            x: def.playerStart.x, y: def.playerStart.y,
            vx: 0, vy: 0, r: this.BALL_R,
            grounded: false, dead: false, rotation: 0
        };

        this.gravityFlipped = false; this.gravityFlipCooldown = 0;
        this.portalCooldown = 0;
        this.particles = []; this.trailPositions = [];
        this.shakeTimer = 0; this.shakeX = this.shakeY = 0;
        this.levelComplete = false; this.levelCompleteTimer = 0;
        this.keys = {}; this.touchLeft = this.touchRight = this.touchJump = false;

        this.ui.setScore(`Level ${num}: ${def.name}`);
    },

    // ─── Particles ───
    emitParticles(x, y, color, count, speed) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const sp = speed * (0.5 + Math.random() * 0.5);
            this.particles.push(new Particle(
                x, y, Math.cos(angle) * sp, Math.sin(angle) * sp,
                color, 0.4 + Math.random() * 0.4, 2 + Math.random() * 3
            ));
        }
    },

    emitTrail() {
        if (Math.abs(this.ball.vx) > 30 || Math.abs(this.ball.vy) > 30) {
            this.trailPositions.push({ x: this.ball.x, y: this.ball.y, life: 0.3 });
            if (this.trailPositions.length > 20) this.trailPositions.shift();
        }
    },

    // ─── Update ───
    update(dt) {
        if (this.screen === 'select') return;
        if (this.ball.dead || this.levelComplete) {
            for (const p of this.particles) p.update(dt, this.gravityFlipped ? -this.GRAVITY : this.GRAVITY);
            this.particles = this.particles.filter(p => p.life > 0);
            if (this.shakeTimer > 0) { this.shakeTimer -= dt; this.shakeX = (Math.random() - 0.5) * 6; this.shakeY = (Math.random() - 0.5) * 6; }
            else { this.shakeX = this.shakeY = 0; }
            return;
        }

        // Cooldowns
        if (this.gravityFlipCooldown > 0) this.gravityFlipCooldown -= dt;
        if (this.portalCooldown > 0) this.portalCooldown -= dt;
        if (this.shakeTimer > 0) { this.shakeTimer -= dt; this.shakeX = (Math.random() - 0.5) * 6; this.shakeY = (Math.random() - 0.5) * 6; }
        else { this.shakeX = this.shakeY = 0; }

        // Trail
        for (let i = this.trailPositions.length - 1; i >= 0; i--) {
            this.trailPositions[i].life -= dt;
            if (this.trailPositions[i].life <= 0) this.trailPositions.splice(i, 1);
        }
        this.emitTrail();

        // Input
        let moveL = this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A'] || this.touchLeft;
        let moveR = this.keys['ArrowRight'] || this.keys['d'] || this.keys['D'] || this.touchRight;
        let jumpKey = this.keys[' '] || this.keys['ArrowUp'] || this.keys['w'] || this.keys['W'] || this.touchJump;
        let gravKey = this.keys['g'] || this.keys['G'];

        // Gravity flip
        if (gravKey && this.gravityFlipCooldown <= 0) {
            this.gravityFlipped = !this.gravityFlipped;
            this.gravityFlipCooldown = 0.4;
            this.emitParticles(this.ball.x, this.ball.y, '#b44dff', 12, 150);
            this.shakeTimer = 0.1;
        }

        // Movement
        const accel = this.MOVE_ACCEL;
        if (moveL) this.ball.vx -= accel * dt;
        if (moveR) this.ball.vx += accel * dt;
        if (!moveL && !moveR) this.ball.vx *= this.FRICTION;
        this.ball.vx = Math.max(-this.MAX_SPEED, Math.min(this.MAX_SPEED, this.ball.vx));

        // Jump
        if (jumpKey && this.ball.grounded) {
            this.ball.vy = this.gravityFlipped ? -this.JUMP_VEL : this.JUMP_VEL;
            this.ball.grounded = false;
            this.emitParticles(this.ball.x, this.ball.y + (this.gravityFlipped ? -this.ball.r : this.ball.r), 'rgba(0,212,255,0.6)', 6, 100);
        }

        // Gravity
        const grav = this.gravityFlipped ? -this.GRAVITY : this.GRAVITY;
        this.ball.vy += grav * dt;

        // Speed zones
        for (const sz of this.speedZones) {
            if (this.circleRect(this.ball, sz)) {
                this.ball.vx *= (1 + (sz.multiplier - 1) * dt * 3);
            }
        }

        // Move
        this.ball.x += this.ball.vx * dt;
        this.ball.y += this.ball.vy * dt;
        this.ball.rotation += this.ball.vx * dt * 0.02;
        this.ball.grounded = false;

        // Update moving platforms
        for (const mp of this.movingPlatforms) {
            if (mp.axis === 'x') mp.x = mp.originX + Math.sin(performance.now() / 1000 * (mp.speed / 50)) * mp.range;
            else mp.y = mp.originY + Math.sin(performance.now() / 1000 * (mp.speed / 50)) * mp.range;
        }
        this.allPlatforms = [...this.platforms, ...this.movingPlatforms];

        // Platform collision
        for (const p of this.allPlatforms) {
            if (this.circleRect(this.ball, p)) {
                // Resolve collision
                const bx = this.ball.x, by = this.ball.y, br = this.ball.r;
                const nearX = Math.max(p.x, Math.min(bx, p.x + p.w));
                const nearY = Math.max(p.y, Math.min(by, p.y + (p.h || 16)));
                const dx = bx - nearX, dy = by - nearY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < br && dist > 0) {
                    const overlap = br - dist;
                    const nx = dx / dist, ny = dy / dist;
                    this.ball.x += nx * overlap;
                    this.ball.y += ny * overlap;

                    // Determine if top/bottom/side hit
                    if (Math.abs(ny) > Math.abs(nx)) {
                        this.ball.vy = -this.ball.vy * this.BOUNCE_FACTOR;
                        if ((!this.gravityFlipped && ny < 0) || (this.gravityFlipped && ny > 0)) {
                            this.ball.grounded = true;
                            if (Math.abs(this.ball.vy) < 20) this.ball.vy = 0;
                        }
                    } else {
                        this.ball.vx = -this.ball.vx * this.BOUNCE_FACTOR;
                    }
                }
            }
        }

        // Wall clamp
        if (this.ball.x - this.ball.r < 0) { this.ball.x = this.ball.r; this.ball.vx = Math.abs(this.ball.vx) * this.BOUNCE_FACTOR; }
        if (this.ball.x + this.ball.r > this.W) { this.ball.x = this.W - this.ball.r; this.ball.vx = -Math.abs(this.ball.vx) * this.BOUNCE_FACTOR; }

        // Springs
        for (const s of this.springs) {
            const sRect = { x: s.x, y: s.y, w: s.w, h: s.h };
            if (this.circleRect(this.ball, sRect)) {
                const launchVel = this.gravityFlipped ? 550 : -550;
                this.ball.vy = launchVel;
                this.ball.grounded = false;
                this.emitParticles(s.x + s.w / 2, s.y, '#00e676', 10, 120);
                this.shakeTimer = 0.08;
            }
        }

        // Portals
        if (this.portalCooldown <= 0) {
            for (let i = 0; i < this.portals.length; i++) {
                const p = this.portals[i];
                const dx = this.ball.x - p.x, dy = this.ball.y - p.y;
                if (dx * dx + dy * dy < 25 * 25) {
                    // Find paired portal
                    const other = this.portals.find((o, j) => j !== i && o.pair === p.pair);
                    if (other) {
                        this.ball.x = other.x; this.ball.y = other.y;
                        this.portalCooldown = 0.5;
                        this.emitParticles(p.x, p.y, '#b44dff', 10, 100);
                        this.emitParticles(other.x, other.y, '#ff2d7b', 10, 100);
                        break;
                    }
                }
            }
        }

        // Spikes
        for (const s of this.spikes) {
            const sRect = { x: s.x + 3, y: s.y + 3, w: s.w - 6, h: s.h - 6 };
            if (this.circleRect(this.ball, sRect)) {
                this.die(); return;
            }
        }

        // Coins
        for (const c of this.coins) {
            if (c.collected) continue;
            const dx = this.ball.x - c.x, dy = this.ball.y - c.y;
            if (dx * dx + dy * dy < (this.ball.r + 10) ** 2) {
                c.collected = true;
                this.emitParticles(c.x, c.y, '#ffd60a', 8, 80);
            }
        }

        // Goal
        if (this.goal) {
            const dx = this.ball.x - this.goal.x, dy = this.ball.y - this.goal.y;
            if (dx * dx + dy * dy < (this.ball.r + 20) ** 2) {
                this.winLevel();
            }
        }

        // Fell off screen
        if (this.ball.y > this.H + 50 || this.ball.y < -50) { this.die(); }

        // Particles
        for (const p of this.particles) p.update(dt, grav);
        this.particles = this.particles.filter(p => p.life > 0);
    },

    circleRect(ball, rect) {
        const cx = Math.max(rect.x, Math.min(ball.x, rect.x + rect.w));
        const cy = Math.max(rect.y, Math.min(ball.y, rect.y + (rect.h || 16)));
        const dx = ball.x - cx, dy = ball.y - cy;
        return dx * dx + dy * dy < ball.r * ball.r;
    },

    die() {
        if (this.ball.dead) return;
        this.ball.dead = true;
        this.deaths++; this.levelDeaths++;
        this.progress.deaths = this.deaths; saveProgress(this.progress);
        this.emitParticles(this.ball.x, this.ball.y, '#ff2d7b', 25, 200);
        this.emitParticles(this.ball.x, this.ball.y, '#00d4ff', 15, 150);
        this.shakeTimer = 0.3;
        setTimeout(() => { if (this.screen === 'play') this.loadLevel(this.level); }, 600);
    },

    winLevel() {
        if (this.levelComplete) return;
        this.levelComplete = true;
        this.emitParticles(this.goal.x, this.goal.y, '#00e676', 30, 200);
        this.emitParticles(this.goal.x, this.goal.y, '#ffd60a', 20, 150);

        const prev = this.progress.completed[this.level] || Infinity;
        this.progress.completed[this.level] = Math.min(prev, this.levelDeaths);
        if (this.level >= this.progress.unlocked && this.level < MAX_LEVEL) this.progress.unlocked = this.level + 1;
        saveProgress(this.progress);
        this.ui.setHighScore(this.deaths);

        if (this.level >= MAX_LEVEL) {
            setTimeout(() => { this.gameOver = true; this.ui.showGameOver(`${this.deaths} deaths`, this.ui.getHighScore() + ' deaths'); }, 1500);
        } else {
            setTimeout(() => { this.screen = 'select'; this.ui.setScore(`${Object.keys(this.progress.completed).length}/${MAX_LEVEL} cleared`); }, 1200);
        }
    },

    // ─── Render ───
    render() {
        if (this.screen === 'select') { this.renderSelect(); return; }
        const ctx = this.ctx, W = this.W, H = this.H;
        ctx.save();
        ctx.translate(this.shakeX, this.shakeY);

        // BG
        ctx.fillStyle = this.C.bg; ctx.fillRect(-10, -10, W + 20, H + 20);

        // BG grid
        ctx.strokeStyle = 'rgba(255,255,255,0.015)'; ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // Speed zones
        for (const sz of this.speedZones) {
            ctx.fillStyle = sz.multiplier > 1 ? this.C.speedFast : this.C.speedSlow;
            ctx.fillRect(sz.x, sz.y, sz.w, sz.h);
            ctx.strokeStyle = sz.multiplier > 1 ? 'rgba(0,230,118,0.4)' : 'rgba(255,45,123,0.4)';
            ctx.lineWidth = 1; ctx.strokeRect(sz.x, sz.y, sz.w, sz.h);
            ctx.fillStyle = sz.multiplier > 1 ? '#00e676' : '#ff2d7b';
            ctx.font = 'bold 10px JetBrains Mono, monospace'; ctx.textAlign = 'center';
            ctx.fillText(sz.multiplier > 1 ? 'FAST' : 'SLOW', sz.x + sz.w / 2, sz.y + sz.h / 2 + 4);
        }

        // Platforms
        for (const p of this.allPlatforms) {
            ctx.fillStyle = this.C.platform;
            ctx.fillRect(p.x, p.y, p.w, p.h || 16);
            ctx.fillStyle = this.C.platformTop;
            ctx.fillRect(p.x, p.y, p.w, 3);
            if (p.type === 'moving') {
                ctx.fillStyle = 'rgba(0,212,255,0.15)'; ctx.fillRect(p.x, p.y, p.w, p.h || 16);
            }
        }

        // Springs
        for (const s of this.springs) {
            ctx.fillStyle = this.C.spring;
            // Coil shape
            ctx.fillRect(s.x + 4, s.y + 4, s.w - 8, s.h - 4);
            ctx.fillStyle = '#00c060';
            ctx.fillRect(s.x, s.y, s.w, 4);
            // Arrow
            ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('\u25B2', s.x + s.w / 2, s.y + 2);
        }

        // Portals
        const t = performance.now() / 1000;
        for (let i = 0; i < this.portals.length; i++) {
            const p = this.portals[i];
            const pulseR = 16 + Math.sin(t * 3 + i) * 3;
            const color = i % 2 === 0 ? this.C.portal1 : this.C.portal2;

            ctx.save();
            ctx.shadowColor = color; ctx.shadowBlur = 15;
            ctx.strokeStyle = color; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(p.x, p.y, pulseR, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();

            // Inner swirl
            ctx.save();
            ctx.translate(p.x, p.y); ctx.rotate(t * 2 + i);
            ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5;
            ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI); ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.restore();
        }

        // Spikes
        for (const s of this.spikes) {
            ctx.fillStyle = this.C.spike;
            const cnt = Math.max(1, Math.floor(s.w / 14)), sw = s.w / cnt;
            const up = s.dir !== 'down';
            for (let i = 0; i < cnt; i++) {
                ctx.beginPath();
                if (up) {
                    ctx.moveTo(s.x + i * sw, s.y + s.h);
                    ctx.lineTo(s.x + i * sw + sw / 2, s.y);
                    ctx.lineTo(s.x + (i + 1) * sw, s.y + s.h);
                } else {
                    ctx.moveTo(s.x + i * sw, s.y);
                    ctx.lineTo(s.x + i * sw + sw / 2, s.y + s.h);
                    ctx.lineTo(s.x + (i + 1) * sw, s.y);
                }
                ctx.closePath(); ctx.fill();
            }
        }

        // Coins
        for (const c of this.coins) {
            if (c.collected) continue;
            const pulse = 1 + Math.sin(t * 4 + c.x) * 0.15;
            ctx.save();
            ctx.shadowColor = this.C.coin; ctx.shadowBlur = 10;
            ctx.fillStyle = this.C.coin;
            ctx.beginPath(); ctx.arc(c.x, c.y, 7 * pulse, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
            ctx.fillStyle = '#000'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('\u2605', c.x, c.y + 3);
        }

        // Goal flag
        if (this.goal) {
            const pulse = 1 + Math.sin(t * 3) * 0.1;
            ctx.save();
            ctx.shadowColor = this.C.goal; ctx.shadowBlur = 20 * pulse;
            ctx.fillStyle = this.C.goal;
            // Flag pole
            ctx.fillRect(this.goal.x - 1, this.goal.y - 30, 3, 35);
            // Flag
            ctx.beginPath();
            ctx.moveTo(this.goal.x + 2, this.goal.y - 30);
            ctx.lineTo(this.goal.x + 22, this.goal.y - 22);
            ctx.lineTo(this.goal.x + 2, this.goal.y - 14);
            ctx.closePath(); ctx.fill();
            ctx.restore();
        }

        // Ball trail
        for (const tp of this.trailPositions) {
            const a = tp.life / 0.3;
            ctx.globalAlpha = a * 0.3;
            ctx.fillStyle = this.C.ball;
            ctx.beginPath(); ctx.arc(tp.x, tp.y, this.ball.r * a * 0.6, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Ball
        if (!this.ball.dead) {
            const b = this.ball;
            ctx.save();

            // Glow
            ctx.shadowColor = this.C.ball; ctx.shadowBlur = 18;

            // Ball body with gradient
            const grad = ctx.createRadialGradient(b.x - 3, b.y - 3, 0, b.x, b.y, b.r);
            grad.addColorStop(0, '#4df0ff'); grad.addColorStop(0.7, this.C.ball); grad.addColorStop(1, '#0090aa');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();

            // Specular highlight
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath(); ctx.arc(b.x - 3, b.y - 4, b.r * 0.35, 0, Math.PI * 2); ctx.fill();

            // Rotation line
            ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(b.x + Math.cos(b.rotation) * b.r * 0.5, b.y + Math.sin(b.rotation) * b.r * 0.5);
            ctx.lineTo(b.x - Math.cos(b.rotation) * b.r * 0.5, b.y - Math.sin(b.rotation) * b.r * 0.5);
            ctx.stroke();

            ctx.restore();
        }

        // Particles
        for (const p of this.particles) p.draw(ctx);

        // HUD
        ctx.fillStyle = this.C.deathCounter; ctx.font = 'bold 14px JetBrains Mono, monospace'; ctx.textAlign = 'left';
        ctx.fillText(`\uD83D\uDC80 ${this.levelDeaths}`, 12, 22);

        // Coins collected
        const totalCoins = this.coins.length;
        const collected = this.coins.filter(c => c.collected).length;
        ctx.fillStyle = this.C.coin; ctx.font = 'bold 13px JetBrains Mono, monospace'; ctx.textAlign = 'left';
        ctx.fillText(`\u2605 ${collected}/${totalCoins}`, 12, 42);

        ctx.fillStyle = this.C.text; ctx.font = 'bold 14px Outfit, sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(`Level ${this.level}`, W - 12, 22);
        ctx.font = '11px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillText('R = retry \u2022 ESC = levels \u2022 G = gravity', W - 12, 40);

        // Gravity indicator
        if (this.gravityFlipped) {
            ctx.fillStyle = 'rgba(180,77,255,0.8)'; ctx.font = 'bold 12px JetBrains Mono, monospace'; ctx.textAlign = 'center';
            ctx.fillText('\uD83D\uDE43 GRAVITY FLIPPED', W / 2, 22);
        }

        // Level complete message
        if (this.levelComplete) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = this.C.goal; ctx.font = 'bold 32px Outfit, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('\u2705 Level Complete!', W / 2, H / 2 - 10);
            ctx.font = '16px Outfit, sans-serif'; ctx.fillStyle = this.C.text;
            ctx.fillText(`Deaths: ${this.levelDeaths} \u2022 Coins: ${collected}/${totalCoins}`, W / 2, H / 2 + 25);
        }

        // Touch hint
        if ('ontouchstart' in window) {
            ctx.globalAlpha = 0.25; ctx.fillStyle = '#fff'; ctx.font = '11px Outfit, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('\u25C0 Left | Jump | Right \u25B6', W / 2, H - 14);
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    },

    // ─── Loop ───
    loop() {
        if (this.gameOver || this.paused) return;
        const now = performance.now();
        let dt = (now - this.lastTime) / 1000; this.lastTime = now;
        if (dt > 0.04) dt = 0.04;
        this.update(dt); this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    }
};

export default QuantumBounce;
