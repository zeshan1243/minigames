// ─── Troll Escape: 30 Levels of Deception ───
const SAVE_KEY = 'trollescape_progress';

function loadProgress() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || { unlocked: 1, deaths: 0, completed: {} }; }
    catch { return { unlocked: 1, deaths: 0, completed: {} }; }
}
function saveProgress(p) { localStorage.setItem(SAVE_KEY, JSON.stringify(p)); }

// ─── 30 Level Definitions (data-driven) ───
// Each returns { platforms, spikes, door, trollEvents, playerX?, realDoor?, intro }
function LEVELS(W, H, gY, C) {
    const S = (x, y, w) => ({ x, y, w, h: 20, type: 'solid', color: C.platform });
    const F = (x, y, w) => ({ x, y, w, h: 20, type: 'fake', stepTimer: 0, fallen: false, color: C.platform, shakeTimer: 0 });
    const M = (x, y, w, oX, rng, spd) => ({ x, y, w, h: 20, type: 'moving', originX: oX, rangeX: rng, speed: spd, color: C.platform });
    const SK = (x, y, w, vis = true) => ({ x, y: y, w, h: 20, visible: vis });
    const G = { x: 0, y: gY, w: W, h: 40, type: 'solid', color: C.ground };
    const tSpike = (tx, s) => ({ type: 'delayed_spike', triggerX: tx, triggered: false, spike: s });
    const tInvis = (tx, s) => ({ type: 'invisible_spike', triggerX: tx, triggered: false, spike: s });
    const tRev = (tx) => ({ type: 'reverse_controls', triggerX: tx, triggered: false });
    const tGrav = (tx) => ({ type: 'gravity_flip', triggerX: tx, triggered: false });
    const tShake = (tx) => ({ type: 'screen_shake', triggerX: tx, triggered: false });
    const tJump = (tx) => ({ type: 'jump_disable', triggerX: tx, triggered: false });
    const tZoom = (tx) => ({ type: 'zoom_in', triggerX: tx, triggered: false });
    const tDark = (tx) => ({ type: 'darkness', triggerX: tx, triggered: false });
    const tSpeed = (tx) => ({ type: 'speed_boost', triggerX: tx, triggered: false });
    const tSlow = (tx) => ({ type: 'slow_motion', triggerX: tx, triggered: false });
    const tShrink = (tx) => ({ type: 'shrink_player', triggerX: tx, triggered: false });
    const tBouncy = (tx) => ({ type: 'bouncy_floor', triggerX: tx, triggered: false });
    const tMirror = (tx) => ({ type: 'mirror_world', triggerX: tx, triggered: false });

    return [
        // ═══ ZONE 1: "Easy" Intro (1-5) ═══
        { // 1 — Pure bait. Genuinely easy.
            intro: 'Easy level. Just walk to the door! 😊',
            platforms: [G], spikes: [],
            door: { x: 700, y: gY - 60, w: 40, h: 60 },
            trollEvents: []
        },
        { // 2 — Spike appears behind you
            intro: 'Still easy... right? 🤔',
            platforms: [G, S(250, gY-80, 120), S(500, gY-80, 120)],
            spikes: [],
            door: { x: 700, y: gY - 60, w: 40, h: 60 },
            trollEvents: [tSpike(350, { x: 200, y: gY - 20, w: 80, h: 20, visible: false })]
        },
        { // 3 — One fake platform with spikes below
            intro: 'Every platform is safe... probably 🙃',
            platforms: [G, S(180, gY-80, 120), F(400, gY-100, 120), S(600, gY-80, 120)],
            spikes: [SK(390, gY - 20, 140)],
            door: { x: 680, y: gY - 60, w: 40, h: 60 },
            trollEvents: []
        },
        { // 4 — Door runs away once
            intro: 'Almost there! Just grab the door 🚪',
            platforms: [G, S(200, gY-90, 110), S(420, gY-90, 110)],
            spikes: [],
            door: { x: 700, y: gY - 60, w: 40, h: 60, runsAway: true, maxRuns: 1 },
            trollEvents: []
        },
        { // 5 — Ground disappears mid-level
            intro: 'Solid ground beneath your feet ☺️',
            platforms: [
                { x: 0, y: gY, w: 350, h: 40, type: 'solid', color: C.ground },
                { x: 350, y: gY, w: 150, h: 40, type: 'fake', stepTimer: 0, fallen: false, color: C.ground, shakeTimer: 0 },
                { x: 500, y: gY, w: 300, h: 40, type: 'solid', color: C.ground }
            ],
            spikes: [SK(360, gY + 40, 130)],
            door: { x: 700, y: gY - 60, w: 40, h: 60 },
            trollEvents: []
        },

        // ═══ ZONE 2: Trust Breaking (6-10) ═══
        { // 6 — All platforms are fake except one
            intro: 'Pick your platform wisely 😈',
            platforms: [G, F(150, gY-80, 100), F(310, gY-130, 100), S(470, gY-80, 100), F(620, gY-130, 100)],
            spikes: [SK(140, gY-20, 120), SK(300, gY-20, 120), SK(610, gY-20, 120)],
            door: { x: 720, y: gY - 60, w: 40, h: 60 },
            trollEvents: []
        },
        { // 7 — Invisible spike gauntlet
            intro: 'The path is clear... or is it? 👀',
            platforms: [G, S(200, gY-80, 100), S(380, gY-140, 100), S(560, gY-80, 100)],
            spikes: [],
            door: { x: 700, y: gY - 60, w: 40, h: 60 },
            trollEvents: [
                tInvis(180, { x: 300, y: gY-20, w: 50, h: 20, visible: false }),
                tInvis(400, { x: 480, y: gY-20, w: 50, h: 20, visible: false }),
                tInvis(580, { x: 640, y: gY-20, w: 50, h: 20, visible: false })
            ]
        },
        { // 8 — Moving platforms + spike ambush
            intro: 'Moving targets 🎯',
            platforms: [G, M(200, gY-90, 80, 180, 80, 60), M(420, gY-140, 80, 400, 80, 80), S(620, gY-80, 100)],
            spikes: [SK(300, gY-20, 80)],
            door: { x: 680, y: gY - 60, w: 40, h: 60 },
            trollEvents: [tSpike(550, { x: 600, y: gY-20, w: 80, h: 20, visible: false })]
        },
        { // 9 — Door is fake, real one appears after death
            intro: 'There is the exit! Go go go! 🏃',
            platforms: [G, S(200, gY-80, 120), S(400, gY-140, 120), S(600, gY-80, 100)],
            spikes: [],
            door: { x: 700, y: gY - 60, w: 40, h: 60, isFake: true },
            realDoor: { x: 50, y: gY - 60, w: 40, h: 60, active: false },
            trollEvents: []
        },
        { // 10 — Spike walls close in from sides
            intro: 'Simple jump course 😁',
            platforms: [G, S(150, gY-100, 100), S(350, gY-160, 100), S(550, gY-100, 100)],
            spikes: [SK(0, gY-20, 60), SK(W-60, gY-20, 60)],
            door: { x: 680, y: gY - 60, w: 40, h: 60 },
            trollEvents: [
                tSpike(300, { x: 250, y: gY-20, w: 80, h: 20, visible: false }),
                tSpike(500, { x: 450, y: gY-20, w: 80, h: 20, visible: false })
            ]
        },

        // ═══ ZONE 3: Mind Games (11-15) ═══
        { // 11 — Controls reverse
            intro: 'Standard platforming ahead ➡️',
            platforms: [G, S(200, gY-80, 110), S(400, gY-140, 110), S(600, gY-80, 110)],
            spikes: [SK(300, gY-20, 60), SK(500, gY-20, 60)],
            door: { x: 700, y: gY - 60, w: 40, h: 60 },
            trollEvents: [tRev(250)]
        },
        { // 12 — Gravity flip
            intro: 'What goes up... 🤷',
            platforms: [
                G,
                { x: 0, y: 0, w: W, h: 20, type: 'solid', color: C.ground }, // ceiling
                S(200, gY-100, 120), S(400, 20, 120), S(600, 20, 120)
            ],
            spikes: [],
            door: { x: 700, y: 20, w: 40, h: 60 },
            trollEvents: [tGrav(280)]
        },
        { // 13 — Jump button breaks
            intro: 'Lots of jumps in this one! 🐸',
            platforms: [G, S(180, gY-100, 80), S(320, gY-160, 80), S(460, gY-100, 80), S(600, gY-160, 80)],
            spikes: [SK(160, gY-20, 100), SK(440, gY-20, 100)],
            door: { x: 680, y: gY - 220, w: 40, h: 60 },
            trollEvents: [tJump(300)]
        },
        { // 14 — Screen shake + moving platforms
            intro: 'Steady hands required 🫨',
            platforms: [G, M(200, gY-80, 90, 160, 100, 70), S(400, gY-140, 90), M(580, gY-80, 90, 540, 80, 90)],
            spikes: [SK(300, gY-20, 60)],
            door: { x: 700, y: gY - 60, w: 40, h: 60 },
            trollEvents: [tShake(200)]
        },
        { // 15 — Zoom in + controls reverse combo
            intro: 'Perfectly normal level 🙂',
            platforms: [G, S(200, gY-90, 100), S(400, gY-150, 100), S(600, gY-90, 100)],
            spikes: [SK(280, gY-20, 80)],
            door: { x: 700, y: gY - 60, w: 40, h: 60 },
            trollEvents: [tZoom(250), tRev(450)]
        },

        // ═══ ZONE 4: Deception (16-20) ═══
        { // 16 — Darkness falls
            intro: 'Things look bright! ☀️',
            platforms: [G, S(180, gY-80, 120), S(380, gY-140, 120), S(580, gY-80, 120)],
            spikes: [SK(280, gY-20, 70), SK(500, gY-20, 70)],
            door: { x: 700, y: gY - 60, w: 40, h: 60 },
            trollEvents: [tDark(200)]
        },
        { // 17 — Speed boost into spikes
            intro: 'Gotta go fast! 💨',
            platforms: [G, S(250, gY-80, 100), S(480, gY-120, 100)],
            spikes: [SK(600, gY-20, 80)],
            door: { x: 720, y: gY - 60, w: 40, h: 60 },
            trollEvents: [tSpeed(200)]
        },
        { // 18 — Door runs away 3 times
            intro: 'The door is RIGHT there 🚪',
            platforms: [G, S(200, gY-80, 100), S(400, gY-80, 100)],
            spikes: [],
            door: { x: 700, y: gY - 60, w: 40, h: 60, runsAway: true, maxRuns: 3 },
            trollEvents: [tShake(200)]
        },
        { // 19 — Mirror world (screen flipped)
            intro: 'See things from another perspective 🪞',
            platforms: [G, S(180, gY-90, 110), S(380, gY-150, 100), S(580, gY-90, 110)],
            spikes: [SK(280, gY-20, 60)],
            door: { x: 700, y: gY - 60, w: 40, h: 60 },
            trollEvents: [tMirror(200)]
        },
        { // 20 — Fake door + gravity flip + real door on ceiling
            intro: 'Exit is in sight! Almost free! 🎉',
            platforms: [
                G,
                { x: 0, y: 0, w: W, h: 20, type: 'solid', color: C.ground },
                S(200, gY-80, 120), S(450, gY-140, 100), S(600, gY-80, 100)
            ],
            spikes: [],
            door: { x: 700, y: gY - 60, w: 40, h: 60, isFake: true },
            realDoor: { x: 400, y: 20, w: 40, h: 60, active: false },
            trollEvents: [tGrav(450)]
        },

        // ═══ ZONE 5: Chaos (21-25) ═══
        { // 21 — Reverse + gravity + fake platform
            intro: 'Welcome to chaos! 🌪️',
            platforms: [G, F(180, gY-80, 100), S(350, gY-150, 100), S(550, gY-80, 100)],
            spikes: [SK(170, gY-20, 120)],
            door: { x: 700, y: gY - 60, w: 40, h: 60 },
            trollEvents: [tRev(200), tGrav(400)]
        },
        { // 22 — Darkness + moving platforms + spikes
            intro: 'Lights out... literally 🕯️',
            platforms: [G, M(200, gY-80, 90, 160, 100, 60), M(420, gY-140, 90, 380, 80, 80), S(620, gY-80, 100)],
            spikes: [SK(300, gY-20, 80), SK(540, gY-20, 60)],
            door: { x: 700, y: gY - 60, w: 40, h: 60 },
            trollEvents: [tDark(150)]
        },
        { // 23 — Speed + zoom + fake platforms
            intro: 'Hyperspeed! 🚀',
            platforms: [G, F(180, gY-80, 100), S(340, gY-140, 80), F(500, gY-80, 100), S(660, gY-140, 80)],
            spikes: [SK(170, gY-20, 120), SK(490, gY-20, 120)],
            door: { x: 720, y: gY - 200, w: 40, h: 60 },
            trollEvents: [tSpeed(150), tZoom(400)]
        },
        { // 24 — Shrink player + everything is further apart
            intro: 'Feeling small today? 🐜',
            platforms: [G, S(220, gY-100, 60), S(400, gY-170, 60), S(580, gY-100, 60)],
            spikes: [SK(300, gY-20, 60), SK(480, gY-20, 60)],
            door: { x: 700, y: gY - 60, w: 40, h: 60 },
            trollEvents: [tShrink(100)]
        },
        { // 25 — Bouncy floor + spikes on ceiling
            intro: 'Boing boing boing! 🤸',
            platforms: [
                G,
                S(200, gY-80, 100), S(400, gY-80, 100), S(600, gY-80, 100)
            ],
            spikes: [SK(180, 60, 120), SK(380, 60, 120), SK(580, 60, 120)],
            door: { x: 720, y: gY - 60, w: 40, h: 60 },
            trollEvents: [tBouncy(50)]
        },

        // ═══ ZONE 6: Hell Mode (26-30) ═══
        { // 26 — Everything: dark + reverse + fake + moving
            intro: 'Hope is lost 💀',
            platforms: [G, F(160, gY-80, 100), M(340, gY-150, 80, 300, 100, 70), F(540, gY-80, 100), S(680, gY-150, 80)],
            spikes: [SK(150, gY-20, 120), SK(530, gY-20, 120)],
            door: { x: 730, y: gY - 210, w: 40, h: 60 },
            trollEvents: [tDark(150), tRev(350), tShake(500)]
        },
        { // 27 — Gravity flips multiple times
            intro: 'Which way is up? 🙃🙂🙃',
            platforms: [
                G,
                { x: 0, y: 0, w: W, h: 20, type: 'solid', color: C.ground },
                S(200, gY-100, 80), S(350, 20, 80), S(500, gY-100, 80), S(650, 20, 80)
            ],
            spikes: [],
            door: { x: 720, y: gY - 60, w: 40, h: 60 },
            trollEvents: [tGrav(230), tGrav(380), tGrav(530), tGrav(680)]
        },
        { // 28 — Speed + reverse + shrink + spikes everywhere
            intro: 'This is not possible 🚫',
            platforms: [G, S(180, gY-90, 70), S(320, gY-150, 70), S(460, gY-90, 70), S(600, gY-150, 70)],
            spikes: [SK(250, gY-20, 50), SK(390, gY-20, 50), SK(530, gY-20, 50)],
            door: { x: 700, y: gY - 210, w: 40, h: 60 },
            trollEvents: [tSpeed(100), tRev(300), tShrink(450)]
        },
        { // 29 — Door runs 3x + everything is fake + darkness
            intro: 'You will not beat this 😈',
            platforms: [G, F(180, gY-80, 100), F(380, gY-130, 100), F(580, gY-80, 100)],
            spikes: [],
            door: { x: 700, y: gY - 60, w: 40, h: 60, runsAway: true, maxRuns: 3 },
            trollEvents: [tDark(250), tShake(400)]
        },
        { // 30 — THE FINAL BOSS: every troll mechanic at once
            intro: '🔥 FINAL LEVEL. God help you. 🔥',
            platforms: [
                G,
                { x: 0, y: 0, w: W, h: 20, type: 'solid', color: C.ground },
                F(160, gY-80, 80),
                M(320, gY-130, 70, 290, 80, 70),
                S(500, gY-80, 90),
                S(650, gY-140, 80)
            ],
            spikes: [SK(140, gY-20, 100), SK(420, gY-20, 60)],
            door: { x: 720, y: gY - 60, w: 40, h: 60, runsAway: true, maxRuns: 2, isFake: true },
            realDoor: { x: 60, y: gY - 60, w: 40, h: 60, active: false },
            trollEvents: [tShake(100), tRev(250), tDark(400), tSpeed(550)]
        }
    ];
}

const TrollEscape = {
    canvas: null, ctx: null, ui: null, animFrame: null,
    gameOver: false, paused: false, lastTime: 0,
    W: 800, H: 620,

    // State
    screen: 'select', // 'select' | 'play'
    progress: null,
    level: 1,
    deaths: 0,
    levelDeaths: 0,

    // Level select
    selectHover: -1,
    selectScroll: 0,

    // Player
    player: null,
    gravity: 1400, jumpForce: -550, moveSpeed: 260,
    keys: {},

    // World
    platforms: [], spikes: [], door: null, realDoor: null,
    trollEvents: [],
    doorRunCount: 0, controlsReversed: false, gravityFlipped: false,
    shakeTimer: 0, shakeX: 0, shakeY: 0,
    jumpDisabledTimer: 0, zoomTimer: 0, zoomScale: 1,
    darknessActive: false, darknessRadius: 120, darknessTimer: 0, darknessFlashing: false,
    speedMultiplier: 1, playerShrunk: false, bouncyFloor: false,
    mirrorWorld: false,
    levelCompleteActive: false, levelCompleteTimer: 0,
    trollMessage: '', trollMessageTimer: 0,
    particles: [],

    // Touch
    touchLeft: false, touchRight: false, touchJump: false,
    _onClick: null,

    colors: {
        bg: '#0a0a0f', ground: '#1a1a2e', platform: '#2a2a4e',
        player: '#00d4ff', playerEye: '#fff', door: '#00e676', doorFrame: '#1a5c3a',
        spike: '#ff2d7b', text: '#e8e8f0', troll: '#ffd60a', deathCounter: '#ff2d7b'
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
        this.screen = 'select';
        this.gameOver = false; this.paused = false;
        this.ui.hideGameOver(); this.ui.hidePause();
        this.ui.setScore(`${Object.keys(this.progress.completed).length}/30 cleared`);
        this.lastTime = performance.now();
        this.loop();
    },

    reset() {
        this.progress = loadProgress();
        this.deaths = this.progress.deaths || 0;
        this.screen = 'select';
        this.gameOver = false; this.paused = false;
    },

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
        if (lv > 0 && lv <= this.progress.unlocked) {
            this.startLevel(lv);
        }
    },

    handleMouseMove(e) {
        if (this.screen !== 'select') return;
        const p = this.getCanvasPos(e);
        this.selectHover = this.hitTestLevel(p.x, p.y);
    },

    hitTestLevel(mx, my) {
        const cols = 6, cellW = 100, cellH = 80;
        const gridW = cols * cellW;
        const ox = (this.W - gridW) / 2, oy = 130;
        for (let i = 0; i < 30; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            const cx = ox + col * cellW + cellW / 2;
            const cy = oy + row * cellH + cellH / 2;
            const dx = mx - cx, dy = my - cy;
            if (dx * dx + dy * dy < 28 * 28) return i + 1;
        }
        return -1;
    },

    handleKey(e) {
        const k = e.key;
        if (this.screen === 'select') {
            if (k === 'Escape') return;
            return;
        }
        if (k === 'Escape') { this.screen = 'select'; this.ui.setScore(`${Object.keys(this.progress.completed).length}/30 cleared`); return; }
        if (k === 'r' || k === 'R') { this.startLevel(this.level); return; }
        if (k === 'p' || k === 'P') { if (!this.gameOver) { this.paused ? this.resume() : this.pause(); } return; }
        if (k === ' ' || k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight' || k === 'w' || k === 'W') e.preventDefault();
        this.keys[k] = true;
    },

    handleKeyUp(e) { this.keys[e.key] = false; },

    handleTouchStart(e) {
        e.preventDefault();
        if (this.screen === 'select') {
            const t = e.changedTouches[0];
            const p = this.getCanvasPos(t);
            const lv = this.hitTestLevel(p.x, p.y);
            if (lv > 0 && lv <= this.progress.unlocked) this.startLevel(lv);
            return;
        }
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.W / rect.width;
        for (const t of e.changedTouches) {
            const x = (t.clientX - rect.left) * scaleX;
            if (x < this.W * 0.33) this.touchLeft = true;
            else if (x > this.W * 0.66) this.touchRight = true;
            else this.touchJump = true;
        }
    },

    handleTouchEnd(e) {
        e.preventDefault();
        this.touchLeft = false; this.touchRight = false; this.touchJump = false;
    },

    // ─── Level Select Screen ───
    renderSelect() {
        const ctx = this.ctx, W = this.W, H = this.H;
        ctx.fillStyle = this.colors.bg;
        ctx.fillRect(0, 0, W, H);

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.015)';
        for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // Title
        ctx.textAlign = 'center';
        ctx.font = 'bold 32px Outfit, sans-serif';
        ctx.fillStyle = this.colors.troll;
        ctx.fillText('TROLL ESCAPE', W / 2, 48);
        ctx.font = '14px Outfit, sans-serif';
        ctx.fillStyle = this.colors.text;
        ctx.fillText('Select a level — each one lies to you 😈', W / 2, 72);

        // Death counter
        ctx.font = 'bold 14px JetBrains Mono, monospace';
        ctx.fillStyle = this.colors.deathCounter;
        ctx.textAlign = 'left';
        ctx.fillText(`💀 Total deaths: ${this.deaths}`, 20, 105);

        // Progress
        const cleared = Object.keys(this.progress.completed).length;
        ctx.textAlign = 'right';
        ctx.fillStyle = '#00e676';
        ctx.fillText(`✅ ${cleared}/30 cleared`, W - 20, 105);

        // Level grid
        const cols = 6, cellW = 100, cellH = 80;
        const gridW = cols * cellW;
        const ox = (W - gridW) / 2, oy = 130;

        const zoneColors = ['#00d4ff', '#00e676', '#b44dff', '#ff6d00', '#ff2d7b', '#ffd60a'];
        const zoneNames = ['Intro', 'Trust', 'Mind', 'Deceit', 'Chaos', 'Hell'];

        for (let i = 0; i < 30; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            const cx = ox + col * cellW + cellW / 2;
            const cy = oy + row * cellH + cellH / 2;
            const lvNum = i + 1;
            const unlocked = lvNum <= this.progress.unlocked;
            const completed = !!this.progress.completed[lvNum];
            const hovered = this.selectHover === lvNum;
            const zone = Math.floor(i / 5);
            const zColor = zoneColors[zone];

            // Zone label (left of first column in each zone)
            if (col === 0) {
                ctx.save();
                ctx.font = 'bold 10px Outfit, sans-serif';
                ctx.fillStyle = zColor;
                ctx.globalAlpha = 0.6;
                ctx.textAlign = 'right';
                ctx.fillText(zoneNames[zone].toUpperCase(), ox - 8, cy + 4);
                ctx.restore();
            }

            // Circle
            const r = hovered && unlocked ? 28 : 24;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);

            if (completed) {
                ctx.fillStyle = '#00e676';
                ctx.fill();
                ctx.fillStyle = '#000';
                ctx.font = 'bold 16px Outfit, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('✓', cx, cy + 6);
            } else if (unlocked) {
                ctx.fillStyle = hovered ? zColor : 'rgba(255,255,255,0.08)';
                ctx.fill();
                ctx.strokeStyle = zColor;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = hovered ? '#000' : this.colors.text;
                ctx.font = 'bold 16px Outfit, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(lvNum, cx, cy + 6);
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.03)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.08)';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.font = '14px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('🔒', cx, cy + 5);
            }

            // Best deaths for completed levels
            if (completed && this.progress.completed[lvNum]) {
                ctx.font = '9px JetBrains Mono, monospace';
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.textAlign = 'center';
                ctx.fillText(`${this.progress.completed[lvNum]}💀`, cx, cy + 22);
            }
        }

        // Footer hint
        ctx.font = '12px Outfit, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.textAlign = 'center';
        ctx.fillText('Click a level to play • ESC to return during gameplay', W / 2, H - 16);
    },

    // ─── Start a Level ───
    startLevel(num) {
        this.screen = 'play';
        this.level = num;
        this.levelDeaths = 0;
        this.fakeDoorTriggered = false; // resets per level attempt
        this.loadLevel(num);
        this.lastTime = performance.now();
    },

    loadLevel(num) {
        const W = this.W, H = this.H, gY = H - 40;
        const levels = LEVELS(W, H, gY, this.colors);
        const def = levels[num - 1];
        if (!def) return;

        // Reset troll states
        this.controlsReversed = false; this.gravityFlipped = false;
        this.shakeTimer = 0; this.shakeX = 0; this.shakeY = 0;
        this.jumpDisabledTimer = 0; this.zoomTimer = 0; this.zoomScale = 1;
        this.darknessActive = false; this.darknessTimer = 0; this.darknessFlashing = false; this.speedMultiplier = 1;
        this.playerShrunk = false; this.bouncyFloor = false; this.mirrorWorld = false;
        this.levelCompleteActive = false; this.levelCompleteTimer = 0;
        this.trollMessage = ''; this.trollMessageTimer = 0;
        this.doorRunCount = 0; this.particles = [];
        this.keys = {}; this.touchLeft = false; this.touchRight = false; this.touchJump = false;

        // Deep clone arrays from def
        this.platforms = JSON.parse(JSON.stringify(def.platforms));
        this.spikes = JSON.parse(JSON.stringify(def.spikes));
        this.door = JSON.parse(JSON.stringify(def.door));
        this.door.reached = false;
        this.realDoor = def.realDoor ? JSON.parse(JSON.stringify(def.realDoor)) : null;
        this.trollEvents = JSON.parse(JSON.stringify(def.trollEvents));

        // If player already hit the fake door, skip it and show real door directly
        if (this.fakeDoorTriggered) {
            if (this.door.isFake) this.door.isFake = false;
            if (this.realDoor) { this.realDoor.active = true; this.door = this.realDoor; }
        }

        const px = def.playerX || 60;
        const ph = this.playerShrunk ? 20 : 36;
        const pw = this.playerShrunk ? 16 : 28;
        this.player = { x: px, y: gY - ph, w: pw, h: ph, vx: 0, vy: 0, grounded: false, facingRight: true, animTimer: 0 };

        this.showTroll(def.intro);
        this.ui.setScore(`Level ${num}/30 • 💀 ${this.deaths}`);
    },

    showTroll(msg) { this.trollMessage = msg; this.trollMessageTimer = 2.5; },

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({ x, y, vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 1) * 250, life: 0.6 + Math.random() * 0.5, size: 2 + Math.random() * 4, color });
        }
    },

    die(reason) {
        this.deaths++; this.levelDeaths++;
        this.progress.deaths = this.deaths;
        saveProgress(this.progress);
        this.shakeTimer = 0.3;
        this.spawnParticles(this.player.x + 14, this.player.y + 18, '#ff2d7b', 20);

        const msgs = ['😂 Gotcha!','💀 Nope!','😈 Trolled!','🤡 Nice try!','🔥 Rekt!','💩 Oops!','🎪 Surprise!','🤣 LOL!','💀 Ded.', reason || '😂 You got trolled!'];
        this.showTroll(msgs[Math.floor(Math.random() * msgs.length)]);
        this.player.vx = 0; this.player.vy = 0; this.player.dead = true;

        setTimeout(() => {
            if (this.screen !== 'play') return;
            this.loadLevel(this.level);
        }, 700);
    },

    winLevel() {
        if (this.levelCompleteActive) return;
        this.levelCompleteActive = true;
        this.spawnParticles(this.door.x + 20, this.door.y + 30, '#00e676', 30);
        this.spawnParticles(this.door.x + 20, this.door.y + 30, '#ffd60a', 20);

        // Save progress
        const prev = this.progress.completed[this.level] || Infinity;
        this.progress.completed[this.level] = Math.min(prev, this.levelDeaths);
        if (this.level >= this.progress.unlocked && this.level < 30) {
            this.progress.unlocked = this.level + 1;
        }
        saveProgress(this.progress);

        const cleared = Object.keys(this.progress.completed).length;
        this.ui.setHighScore(this.deaths);

        if (this.level >= 30) {
            this.showTroll('🎉 YOU BEAT ALL 30 LEVELS! LEGEND!');
            setTimeout(() => {
                this.gameOver = true;
                this.ui.showGameOver(`${this.deaths} deaths`, this.ui.getHighScore() + ' deaths');
            }, 1600);
        } else {
            this.showTroll(`✅ Level ${this.level} cleared! (${this.levelDeaths} deaths)`);
            setTimeout(() => { this.screen = 'select'; this.ui.setScore(`${cleared}/30 cleared`); }, 1500);
        }
    },

    // ─── Update ───
    update(dt) {
        if (this.screen === 'select') return;
        if (this.player.dead) { this.updateParticles(dt); this.updateShake(dt); return; }
        if (this.levelCompleteActive) { this.updateParticles(dt); this.levelCompleteTimer -= dt; return; }

        if (this.trollMessageTimer > 0) this.trollMessageTimer -= dt;
        if (this.jumpDisabledTimer > 0) this.jumpDisabledTimer -= dt;
        if (this.zoomTimer > 0) { this.zoomTimer -= dt; if (this.zoomTimer <= 0) this.zoomScale = 1; }
        // Darkness flash cycle: 3s dark → 0.5s flash → repeat
        if (this.darknessActive) {
            this.darknessTimer += dt;
            if (!this.darknessFlashing && this.darknessTimer >= 3) {
                this.darknessFlashing = true; this.darknessTimer = 0;
            } else if (this.darknessFlashing && this.darknessTimer >= 0.5) {
                this.darknessFlashing = false; this.darknessTimer = 0;
            }
        }
        this.updateShake(dt);

        // Input
        let moveL = this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A'] || this.touchLeft;
        let moveR = this.keys['ArrowRight'] || this.keys['d'] || this.keys['D'] || this.touchRight;
        let jump = this.keys[' '] || this.keys['ArrowUp'] || this.keys['w'] || this.keys['W'] || this.touchJump;

        if (this.controlsReversed) [moveL, moveR] = [moveR, moveL];

        const spd = this.moveSpeed * this.speedMultiplier;
        this.player.vx = 0;
        if (moveL) { this.player.vx = -spd; this.player.facingRight = this.controlsReversed; }
        if (moveR) { this.player.vx = spd; this.player.facingRight = !this.controlsReversed; }

        if (jump && this.player.grounded && this.jumpDisabledTimer <= 0) {
            const jf = this.gravityFlipped ? -this.jumpForce : this.jumpForce;
            this.player.vy = this.bouncyFloor ? jf * 1.6 : jf;
            this.player.grounded = false;
        }

        const grav = this.gravityFlipped ? -this.gravity : this.gravity;
        this.player.vy += grav * dt;
        this.player.x += this.player.vx * dt;
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.w > this.W) this.player.x = this.W - this.player.w;
        this.player.y += this.player.vy * dt;
        this.player.grounded = false;

        // Platform collision
        for (const p of this.platforms) {
            if (p.type === 'fake' && p.fallen) continue;
            if (p.type === 'moving') p.x = p.originX + Math.sin(performance.now() / 1000 * (p.speed / 50)) * p.rangeX;

            if (this.rectOverlap(this.player, p)) {
                if (!this.gravityFlipped) {
                    if (this.player.vy >= 0 && this.player.y + this.player.h - this.player.vy * dt <= p.y + 5) {
                        this.player.y = p.y - this.player.h;
                        this.player.vy = this.bouncyFloor ? -400 : 0;
                        this.player.grounded = !this.bouncyFloor;
                        if (p.type === 'fake' && !p.fallen) {
                            p.stepTimer += dt; p.shakeTimer = Math.min(p.stepTimer * 8, 3);
                            if (p.stepTimer > 0.4) { p.fallen = true; p.fallVy = 0; }
                        }
                    } else if (this.player.vy < 0 && this.player.y - this.player.vy * dt >= p.y + p.h - 5) {
                        this.player.y = p.y + p.h; this.player.vy = 0;
                    }
                } else {
                    if (this.player.vy <= 0 && this.player.y - this.player.vy * dt >= p.y + p.h - 5) {
                        this.player.y = p.y + p.h; this.player.vy = 0; this.player.grounded = true;
                    }
                }
            }
        }

        for (const p of this.platforms) { if (p.type === 'fake' && p.fallen) { p.fallVy = (p.fallVy || 0) + 800 * dt; p.y += p.fallVy * dt; } }

        if (this.player.y > this.H + 50 || this.player.y < -100) { this.die('💀 Fell into the void!'); return; }

        for (const s of this.spikes) {
            if (!s.visible) continue;
            if (this.rectOverlap(this.player, { x: s.x + 4, y: s.y + 4, w: s.w - 8, h: s.h - 4 })) { this.die('😈 Spiky!'); return; }
        }

        // Troll events
        for (const ev of this.trollEvents) {
            if (ev.triggered) continue;
            if (this.player.x >= ev.triggerX) { ev.triggered = true; this.executeTroll(ev); }
        }

        // Door logic
        if (this.door) {
            const maxRuns = this.door.maxRuns || 2;
            if (this.door.runsAway && this.doorRunCount < maxRuns) {
                const dx = this.player.x - this.door.x, dy = this.player.y - this.door.y;
                if (Math.sqrt(dx * dx + dy * dy) < 80) {
                    this.doorRunCount++;
                    const positions = [{ x: 100, y: this.H - 100 }, { x: 400, y: this.H - 100 }, { x: 60, y: this.H - 100 }];
                    const pos = positions[(this.doorRunCount - 1) % positions.length];
                    this.door.x = pos.x; this.door.y = pos.y;
                    this.showTroll(this.doorRunCount === 1 ? '🚪 "Nope!" 😂' : '🚪 "Catch me!"');
                    this.shakeTimer = 0.2;
                }
            }
            if (this.rectOverlap(this.player, this.door)) {
                if (this.door.isFake) {
                    this.door.isFake = false;
                    this.fakeDoorTriggered = true; // persist across respawns
                    this.die('💀 FAKE DOOR! Hahaha!');
                    if (this.realDoor) this.realDoor.active = true;
                    return;
                }
                this.winLevel(); return;
            }
        }
        if (this.realDoor && this.realDoor.active && this.rectOverlap(this.player, this.realDoor)) {
            this.door = this.realDoor; this.winLevel(); return;
        }

        this.player.animTimer += dt;
        this.updateParticles(dt);
    },

    executeTroll(ev) {
        switch (ev.type) {
            case 'delayed_spike': ev.spike.visible = true; this.spikes.push(ev.spike); this.showTroll('😈 Watch your step...'); this.shakeTimer = 0.15; break;
            case 'invisible_spike': ev.spike.visible = true; this.spikes.push(ev.spike); this.showTroll('😈 Surprise spike!'); break;
            case 'reverse_controls': this.controlsReversed = !this.controlsReversed; this.showTroll(this.controlsReversed ? '🔄 Controls reversed! 😈' : '🔄 Controls fixed... or are they?'); this.shakeTimer = 0.2; break;
            case 'gravity_flip': this.gravityFlipped = !this.gravityFlipped; this.player.vy = 0; this.showTroll('🙃 Gravity flipped!'); this.shakeTimer = 0.3; break;
            case 'screen_shake': this.shakeTimer = 2; this.showTroll('🫨 EARTHQUAKE!'); break;
            case 'jump_disable': this.jumpDisabledTimer = 3.5; this.showTroll('🚫 Jump broke! 😂'); break;
            case 'zoom_in': this.zoomScale = 1.8; this.zoomTimer = 4; this.showTroll('🔍 Too close!'); break;
            case 'darkness': this.darknessActive = true; this.showTroll('🌑 Lights out!'); break;
            case 'speed_boost': this.speedMultiplier = 2.2; this.showTroll('💨 TURBO MODE!'); this.shakeTimer = 0.2; break;
            case 'slow_motion': this.speedMultiplier = 0.4; this.showTroll('🐌 Sloooow...'); break;
            case 'shrink_player':
                this.playerShrunk = true; this.player.w = 16; this.player.h = 20;
                this.player.y = this.player.y + 16; // adjust position
                this.showTroll('🐜 You shrunk!'); break;
            case 'bouncy_floor': this.bouncyFloor = true; this.showTroll('🤸 Bouncy floor!'); break;
            case 'mirror_world': this.mirrorWorld = true; this.showTroll('🪞 Everything is mirrored!'); break;
        }
    },

    updateShake(dt) {
        if (this.shakeTimer > 0) { this.shakeTimer -= dt; this.shakeX = (Math.random() - 0.5) * 8; this.shakeY = (Math.random() - 0.5) * 8; }
        else { this.shakeX = 0; this.shakeY = 0; }
    },

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 400 * dt; p.life -= dt;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    },

    rectOverlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; },

    // ─── Render ───
    render() {
        if (this.screen === 'select') { this.renderSelect(); return; }

        const ctx = this.ctx, W = this.W, H = this.H;
        ctx.save();

        // Mirror
        if (this.mirrorWorld) { ctx.translate(W, 0); ctx.scale(-1, 1); }

        ctx.translate(this.shakeX, this.shakeY);

        if (this.zoomScale !== 1) {
            const cx = this.player.x + this.player.w / 2, cy = this.player.y + this.player.h / 2;
            ctx.translate(cx, cy); ctx.scale(this.zoomScale, this.zoomScale); ctx.translate(-cx, -cy);
        }

        // BG
        ctx.fillStyle = this.colors.bg;
        ctx.fillRect(-20, -20, W + 40, H + 40);
        ctx.strokeStyle = 'rgba(255,255,255,0.02)'; ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // Play area border
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, W - 2, H - 2);
        // Side wall indicators
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(0, 0, 4, H);
        ctx.fillRect(W - 4, 0, 4, H);

        // Platforms
        for (const p of this.platforms) {
            if (p.type === 'fake' && p.fallen && p.y > H + 50) continue;
            ctx.save();
            if (p.type === 'fake' && !p.fallen && p.shakeTimer > 0) ctx.translate((Math.random() - 0.5) * p.shakeTimer * 3, 0);
            ctx.fillStyle = p.color || this.colors.platform;
            this.roundRect(ctx, p.x, p.y, p.w, p.h, 4); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(p.x + 2, p.y, p.w - 4, 3);
            if (p.type === 'fake' && !p.fallen) {
                ctx.strokeStyle = 'rgba(255,45,123,0.15)'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(p.x + p.w * 0.3, p.y + 2); ctx.lineTo(p.x + p.w * 0.5, p.y + p.h - 2); ctx.stroke();
            }
            ctx.restore();
        }

        // Spikes
        for (const s of this.spikes) {
            if (!s.visible) continue;
            ctx.fillStyle = this.colors.spike;
            const cnt = Math.floor(s.w / 12), sw = s.w / cnt;
            for (let i = 0; i < cnt; i++) {
                ctx.beginPath(); ctx.moveTo(s.x + i * sw, s.y + s.h); ctx.lineTo(s.x + i * sw + sw / 2, s.y); ctx.lineTo(s.x + (i + 1) * sw, s.y + s.h); ctx.closePath(); ctx.fill();
            }
        }

        // Door
        if (this.door && !this.door.reached) this.renderDoor(ctx, this.door, !this.door.isFake);
        if (this.realDoor && this.realDoor.active) {
            this.renderDoor(ctx, this.realDoor, true);
            ctx.fillStyle = this.colors.troll; ctx.font = '11px Outfit, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('← Real door!', this.realDoor.x + 20, this.realDoor.y - 10);
        }

        // Player
        if (!this.player.dead) this.renderPlayer(ctx);

        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = Math.max(0, p.life / 0.8); ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.globalAlpha = 1;

        // Darkness overlay
        if (this.darknessActive && !this.darknessFlashing && !this.player.dead) {
            ctx.save();
            ctx.fillStyle = '#000';
            ctx.fillRect(-20, -20, W + 40, H + 40);
            ctx.globalCompositeOperation = 'destination-out';
            const r = this.darknessRadius;
            const grad = ctx.createRadialGradient(this.player.x + 14, this.player.y + 18, 0, this.player.x + 14, this.player.y + 18, r);
            grad.addColorStop(0, 'rgba(0,0,0,1)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(this.player.x + 14 - r, this.player.y + 18 - r, r * 2, r * 2);
            ctx.restore();
        }

        // HUD (drawn after darkness so it's always visible)
        ctx.save();
        if (this.mirrorWorld) { ctx.translate(W, 0); ctx.scale(-1, 1); } // un-mirror HUD
        ctx.fillStyle = this.colors.deathCounter; ctx.font = 'bold 15px JetBrains Mono, monospace'; ctx.textAlign = 'left';
        ctx.fillText(`💀 ${this.levelDeaths} (total: ${this.deaths})`, 12, 24);
        ctx.fillStyle = this.colors.text; ctx.font = 'bold 14px Outfit, sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(`Level ${this.level}/30`, W - 12, 24);
        ctx.font = '11px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillText('R = retry • ESC = levels', W - 12, 42);

        if (this.trollMessageTimer > 0 && this.trollMessage) {
            const alpha = Math.min(1, this.trollMessageTimer / 0.3);
            ctx.globalAlpha = alpha; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.textAlign = 'center';
            const tw = ctx.measureText(this.trollMessage).width;
            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            this.roundRect(ctx, W / 2 - tw / 2 - 14, H / 2 - 80 - 14, tw + 28, 40, 10); ctx.fill();
            ctx.fillStyle = this.colors.troll;
            ctx.fillText(this.trollMessage, W / 2, H / 2 - 65);
            ctx.globalAlpha = 1;
        }
        if (this.controlsReversed) { ctx.fillStyle = 'rgba(255,45,123,0.8)'; ctx.font = 'bold 12px JetBrains Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText('⚠ CONTROLS REVERSED ⚠', W / 2, H - 8); }
        if (this.gravityFlipped) { ctx.fillStyle = 'rgba(180,77,255,0.8)'; ctx.font = 'bold 12px JetBrains Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText('🙃 GRAVITY FLIPPED', W / 2, 55); }
        if (this.jumpDisabledTimer > 0) { ctx.fillStyle = 'rgba(255,214,10,0.8)'; ctx.font = 'bold 12px JetBrains Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText(`🚫 JUMP BROKEN (${this.jumpDisabledTimer.toFixed(1)}s)`, W / 2, 72); }
        if (this.mirrorWorld) { ctx.fillStyle = 'rgba(0,212,255,0.7)'; ctx.font = 'bold 12px JetBrains Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText('🪞 MIRROR WORLD', W / 2, 90); }
        if ('ontouchstart' in window) { ctx.globalAlpha = 0.3; ctx.fillStyle = '#fff'; ctx.font = '11px Outfit, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('◀ Left | Jump | Right ▶', W / 2, H - 50); ctx.globalAlpha = 1; }
        ctx.restore();

        ctx.restore();
    },

    renderPlayer(ctx) {
        const p = this.player;
        ctx.save();
        if (this.gravityFlipped) { ctx.translate(0, p.y * 2 + p.h); ctx.scale(1, -1); }
        ctx.fillStyle = this.playerShrunk ? '#ffd60a' : this.colors.player;
        this.roundRect(ctx, p.x, p.y, p.w, p.h, this.playerShrunk ? 4 : 6); ctx.fill();
        const eyeOff = this.playerShrunk ? { ex: p.facingRight ? p.x + 10 : p.x + 4, ey: p.y + 6, r1: 3, r2: 1.5 } : { ex: p.facingRight ? p.x + 17 : p.x + 7, ey: p.y + 10, r1: 4, r2: 2 };
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(eyeOff.ex, eyeOff.ey, eyeOff.r1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(eyeOff.ex + (p.facingRight ? 1.5 : -1.5), eyeOff.ey, eyeOff.r2, 0, Math.PI * 2); ctx.fill();
        if (Math.abs(p.vx) > 10 && p.grounded) {
            const lp = Math.sin(p.animTimer * 12) * (this.playerShrunk ? 3 : 5);
            ctx.strokeStyle = this.playerShrunk ? '#ffd60a' : this.colors.player; ctx.lineWidth = this.playerShrunk ? 2 : 3; ctx.lineCap = 'round';
            const lx1 = p.x + p.w * 0.3, lx2 = p.x + p.w * 0.7;
            ctx.beginPath(); ctx.moveTo(lx1, p.y + p.h); ctx.lineTo(lx1 + lp, p.y + p.h + 5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(lx2, p.y + p.h); ctx.lineTo(lx2 - lp, p.y + p.h + 5); ctx.stroke();
        }
        ctx.restore();
    },

    renderDoor(ctx, door, isReal) {
        ctx.fillStyle = isReal ? this.colors.doorFrame : '#5c1a1a';
        this.roundRect(ctx, door.x - 4, door.y - 4, door.w + 8, door.h + 4, 4); ctx.fill();
        ctx.fillStyle = isReal ? this.colors.door : '#ff2d7b';
        this.roundRect(ctx, door.x, door.y, door.w, door.h, 2); ctx.fill();
        ctx.fillStyle = isReal ? '#ffd60a' : '#fff'; ctx.beginPath(); ctx.arc(door.x + door.w - 10, door.y + door.h / 2, 3, 0, Math.PI * 2); ctx.fill();
        if (door.isFake) { ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Outfit, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('EXIT', door.x + door.w / 2, door.y + door.h / 2 + 4); }
    },

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    },

    loop() {
        if (this.gameOver) return;
        if (this.paused) return;
        const now = performance.now();
        let dt = (now - this.lastTime) / 1000;
        this.lastTime = now;
        if (dt > 0.05) dt = 0.05;
        this.update(dt);
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    }
};

export default TrollEscape;
