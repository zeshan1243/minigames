// ─── Troll Escape: 30 Levels of Mixed Chaos ───
// Combines: fake platforms, invisible floors, shrinking world, moving exits,
// reversed controls, gravity flips, lying instructions, trap memory,
// darkness, speed boost, bouncy physics, mirror world, zoom, screen shake
const SAVE_KEY = 'trollescape_progress';

function loadProgress() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || { unlocked: 1, deaths: 0, completed: {} }; }
    catch { return { unlocked: 1, deaths: 0, completed: {} }; }
}
function saveProgress(p) { localStorage.setItem(SAVE_KEY, JSON.stringify(p)); }

// ─── Level Builder Helpers ───
function LEVELS(W, H, gY, C) {
    const S = (x, y, w, h) => ({ x, y, w, h: h||20, type: 'solid', color: C.platform });
    const F = (x, y, w) => ({ x, y, w, h: 20, type: 'fake', stepTimer: 0, fallen: false, color: C.platform, shakeTimer: 0 });
    const M = (x, y, w, oX, rng, spd) => ({ x, y, w, h: 20, type: 'moving', originX: oX, rangeX: rng, speed: spd, color: C.platform });
    const SH = (x, y, w, lifetime) => ({ x, y, w, h: 20, type: 'shrinking', lifetime: lifetime, timer: 0, state: 'solid', color: C.platform });
    const INV = (x, y, w) => ({ x, y, w, h: 20, type: 'invisible', color: C.platform, revealed: false });
    const SK = (x, y, w, vis) => ({ x, y, w, h: 20, visible: vis !== false });
    const HIDDEN_SK = (x, y, w) => ({ x, y, w, h: 20, visible: false, hidden: true, revealed: false });
    const G = { x: 0, y: gY, w: W, h: 40, type: 'solid', color: C.ground };
    const CEIL = { x: 0, y: 0, w: W, h: 20, type: 'solid', color: C.ground };

    // Troll event helpers
    const tRev = (tx) => ({ type: 'reverse_controls', triggerX: tx, triggered: false });
    const tGrav = (tx) => ({ type: 'gravity_flip', triggerX: tx, triggered: false });
    const tShake = (tx) => ({ type: 'screen_shake', triggerX: tx, triggered: false });
    const tJump = (tx) => ({ type: 'jump_disable', triggerX: tx, triggered: false });
    const tZoom = (tx) => ({ type: 'zoom_in', triggerX: tx, triggered: false });
    const tDark = (tx) => ({ type: 'darkness', triggerX: tx, triggered: false });
    const tSpeed = (tx) => ({ type: 'speed_boost', triggerX: tx, triggered: false });
    const tBouncy = (tx) => ({ type: 'bouncy_floor', triggerX: tx, triggered: false });
    const tMirror = (tx) => ({ type: 'mirror_world', triggerX: tx, triggered: false });
    const tShrink = (tx) => ({ type: 'shrink_player', triggerX: tx, triggered: false });
    const tSpike = (tx, s) => ({ type: 'delayed_spike', triggerX: tx, triggered: false, spike: s });
    const tInvis = (tx, s) => ({ type: 'invisible_spike', triggerX: tx, triggered: false, spike: s });
    const tLie = (tx, msg) => ({ type: 'lie_instruction', triggerX: 0, triggered: false, message: msg, showAtStart: true });
    const tShrinkAll = (tx, time) => ({ type: 'shrink_world', triggerX: tx, triggered: false, timer: time });

    return [
        // ═══ 1-5: WARM UP (still tricky) ═══
        { // 1 — Fake platforms intro: 3 paths, 2 are fake
            intro: 'Pick a path. Two are lies. 😈',
            platforms: [G, S(150,gY-80,90), F(300,gY-80,90), S(450,gY-80,90), F(600,gY-80,90),
                        F(150,gY-160,90), S(300,gY-160,90), F(450,gY-160,90)],
            spikes: [SK(140,gY-20,100), SK(290,gY-20,100), SK(440,gY-20,100), SK(590,gY-20,100)],
            door: { x: 350, y: gY-220, w: 40, h: 60 },
            trollEvents: []
        },
        { // 2 — Hidden spikes + lying instruction
            intro: '"The floor is totally safe!" 🤥',
            platforms: [G, S(200,gY-80,100), S(400,gY-130,100), S(600,gY-80,100)],
            spikes: [],
            door: { x: 700, y: gY-60, w: 40, h: 60 },
            trollEvents: [
                tLie(0, '→ The floor is safe! Just run right!'),
                tInvis(150, {x:250,y:gY-20,w:80,h:20,visible:false}),
                tInvis(350, {x:480,y:gY-20,w:80,h:20,visible:false})
            ]
        },
        { // 3 — Moving exit + fake platforms
            intro: 'Catch the door... if you can 🚪💨',
            platforms: [G, F(200,gY-80,100), S(350,gY-80,100), F(500,gY-80,100), S(650,gY-80,100)],
            spikes: [SK(190,gY-20,120), SK(490,gY-20,120)],
            door: { x: 700, y: gY-60, w: 40, h: 60, runsAway: true, maxRuns: 2 },
            trollEvents: []
        },
        { // 4 — Shrinking world: platforms disappear after 4s
            intro: 'Everything is crumbling. HURRY! ⏳',
            platforms: [G, SH(150,gY-80,100,4), SH(320,gY-140,100,5), SH(490,gY-80,100,3.5), S(660,gY-140,80)],
            spikes: [SK(140,gY-20,120), SK(310,gY-20,110), SK(480,gY-20,120)],
            door: { x: 700, y: gY-200, w: 40, h: 60 },
            trollEvents: []
        },
        { // 5 — Invisible platforms: can't see where to jump
            intro: 'Trust your instincts... the floor is invisible 👻',
            platforms: [G, INV(200,gY-80,100), INV(380,gY-140,100), INV(560,gY-80,100)],
            spikes: [SK(300,gY-20,60)],
            door: { x: 680, y: gY-60, w: 40, h: 60 },
            trollEvents: []
        },

        // ═══ 6-10: DECEPTION ═══
        { // 6 — Lie: "Go right" but door is left + reversed controls
            intro: '"Go right to win!" ➡️',
            platforms: [G, S(200,gY-80,100), S(400,gY-130,100), S(600,gY-80,100)],
            spikes: [SK(620,gY-20,80)],
            door: { x: 40, y: gY-60, w: 40, h: 60 },
            trollEvents: [tLie(0, '→→→ Go RIGHT to reach the exit! →→→'), tRev(300)]
        },
        { // 7 — Dark + fake platforms: memorize in the flash
            intro: 'Lights out. Which platforms are real? 🌑',
            platforms: [G, S(180,gY-80,80), F(300,gY-80,80), S(420,gY-130,80), F(540,gY-80,80), S(660,gY-130,80)],
            spikes: [SK(290,gY-20,100), SK(530,gY-20,100)],
            door: { x: 710, y: gY-190, w: 40, h: 60 },
            trollEvents: [tDark(100)]
        },
        { // 8 — Bouncy floor + ceiling spikes
            intro: 'Boing! Try not to hit the ceiling... 🤸',
            platforms: [G, S(200,gY-80,100), S(400,gY-80,100), S(600,gY-80,100)],
            spikes: [SK(180,60,120), SK(380,60,120), SK(580,60,120)],
            door: { x: 720, y: gY-60, w: 40, h: 60 },
            trollEvents: [tBouncy(50)]
        },
        { // 9 — Fake door + trap memory: hidden spikes revealed on death
            intro: 'Run to the exit! What could go wrong? 😊',
            platforms: [G, S(200,gY-80,120), S(420,gY-130,120), S(620,gY-80,100)],
            spikes: [],
            door: { x: 720, y: gY-60, w: 40, h: 60, isFake: true },
            realDoor: { x: 50, y: gY-60, w: 40, h: 60, active: false },
            trollEvents: [
                tInvis(300, {x:350,y:gY-20,w:60,h:20,visible:false}),
                tInvis(500, {x:550,y:gY-20,w:60,h:20,visible:false})
            ]
        },
        { // 10 — Speed boost into spike gauntlet
            intro: '"Take the speed boost, it helps!" 💨',
            platforms: [G, S(200,gY-80,80), S(350,gY-80,80), S(500,gY-80,80), S(650,gY-80,80)],
            spikes: [SK(280,gY-20,50), SK(430,gY-20,50), SK(580,gY-20,50)],
            door: { x: 720, y: gY-60, w: 40, h: 60 },
            trollEvents: [tLie(0, '💨 Grab the speed boost ahead!'), tSpeed(150)]
        },

        // ═══ 11-15: MIND GAMES ═══
        { // 11 — Gravity flip + invisible platforms on ceiling
            intro: 'What goes up must... stay up? 🙃',
            platforms: [G, CEIL, S(200,gY-100,100), INV(400,20,100), INV(600,20,100)],
            spikes: [],
            door: { x: 700, y: 20, w: 40, h: 60 },
            trollEvents: [tGrav(250)]
        },
        { // 12 — Mirror world + reversed controls (double confusion)
            intro: 'Everything is backwards... literally 🪞',
            platforms: [G, S(200,gY-90,100), S(400,gY-150,100), S(600,gY-90,100)],
            spikes: [SK(300,gY-20,60), SK(500,gY-20,60)],
            door: { x: 700, y: gY-60, w: 40, h: 60 },
            trollEvents: [tMirror(100), tRev(350)]
        },
        { // 13 — Shrinking + darkness combo
            intro: 'Can\'t see. Can\'t stay. Good luck. 💀',
            platforms: [G, SH(180,gY-80,90,5), SH(350,gY-140,90,6), SH(520,gY-80,90,4), S(680,gY-140,80)],
            spikes: [SK(170,gY-20,110), SK(340,gY-20,110)],
            door: { x: 730, y: gY-200, w: 40, h: 60 },
            trollEvents: [tDark(120)]
        },
        { // 14 — Jump disabled + fake path (must find walkable route)
            intro: '"You\'ll definitely need to jump here!" 🐸',
            platforms: [
                G, S(0,gY-60,800,60), // raised floor — can walk across
                F(200,gY-120,80), F(400,gY-120,80), F(600,gY-120,80) // fake upper platforms
            ],
            spikes: [],
            door: { x: 720, y: gY-120, w: 40, h: 60 },
            trollEvents: [tLie(0, '🐸 Jump across the platforms!'), tJump(50)]
        },
        { // 15 — Moving exit + zoom in (can barely see it)
            intro: 'Find the door... while zoomed in 🔍',
            platforms: [G, S(200,gY-80,100), S(400,gY-130,100), S(600,gY-80,100)],
            spikes: [SK(300,gY-20,60)],
            door: { x: 700, y: gY-60, w: 40, h: 60, runsAway: true, maxRuns: 3 },
            trollEvents: [tZoom(100)]
        },

        // ═══ 16-20: CRUELTY ═══
        { // 16 — All platforms shrink + moving platforms are the only safe ones
            intro: 'Only moving things survive ⚡',
            platforms: [G, SH(180,gY-80,90,3), M(350,gY-130,80,310,80,60), SH(500,gY-80,90,2.5), M(650,gY-150,80,610,60,80)],
            spikes: [SK(170,gY-20,110), SK(490,gY-20,110)],
            door: { x: 720, y: gY-210, w: 40, h: 60 },
            trollEvents: [tShake(200)]
        },
        { // 17 — Lie: "Avoid red" but red is safe, normal kills
            intro: '"AVOID the red platforms! They kill!" 🔴',
            platforms: [
                G,
                { x:200, y:gY-80, w:90, h:20, type:'solid', color:'#ff2d7b' }, // red = safe
                { x:350, y:gY-80, w:90, h:20, type:'fake', stepTimer:0, fallen:false, color:C.platform, shakeTimer:0 }, // normal = fake
                { x:500, y:gY-130, w:90, h:20, type:'solid', color:'#ff2d7b' }, // red = safe
                { x:650, y:gY-80, w:90, h:20, type:'fake', stepTimer:0, fallen:false, color:C.platform, shakeTimer:0 }
            ],
            spikes: [SK(340,gY-20,110), SK(640,gY-20,110)],
            door: { x: 550, y: gY-190, w: 40, h: 60 },
            trollEvents: [tLie(0, '🔴 AVOID red platforms! They KILL you!')]
        },
        { // 18 — Dark + bouncy + ceiling spikes + shrink player
            intro: 'Small, bouncy, blind. Enjoy. 😈',
            platforms: [G, S(200,gY-80,80), S(380,gY-80,80), S(560,gY-80,80)],
            spikes: [SK(180,70,100), SK(360,70,100), SK(540,70,100)],
            door: { x: 700, y: gY-60, w: 40, h: 60 },
            trollEvents: [tShrink(50), tBouncy(50), tDark(200)]
        },
        { // 19 — Invisible platforms + gravity flip mid-way + ceiling spikes
            intro: 'Invisible floor, flipping gravity, ceiling spikes. Sure. 🫠',
            platforms: [G, CEIL, INV(200,gY-80,100), INV(400,gY-140,100), INV(550,20,100), S(700,20,80)],
            spikes: [SK(300,gY-20,60)],
            door: { x: 740, y: 20, w: 40, h: 60 },
            trollEvents: [tGrav(420)]
        },
        { // 20 — EVERYTHING shrinks, door runs, screen shakes, controls reversed
            intro: 'Welcome to hell\'s lobby 🔥',
            platforms: [G, SH(180,gY-80,80,4), SH(340,gY-140,80,5), SH(500,gY-80,80,3.5), S(660,gY-140,80)],
            spikes: [SK(170,gY-20,100), SK(490,gY-20,100)],
            door: { x: 720, y: gY-200, w: 40, h: 60, runsAway: true, maxRuns: 2 },
            trollEvents: [tRev(200), tShake(350)]
        },

        // ═══ 21-25: NIGHTMARE ═══
        { // 21 — Fake exit + invisible real path + darkness
            intro: '"The exit is right there!" (it\'s not) 🤡',
            platforms: [G, S(200,gY-80,100), INV(400,gY-80,80), INV(550,gY-140,80), S(680,gY-80,80)],
            spikes: [SK(600,gY-20,60)],
            door: { x: 720, y: gY-60, w: 40, h: 60, isFake: true },
            realDoor: { x: 600, y: gY-200, w: 40, h: 60, active: false },
            trollEvents: [tDark(300), tLie(0, '🚪 The exit is on the far right!')]
        },
        { // 22 — Speed + mirror + shrinking world
            intro: 'Fast, mirrored, and disappearing. Classic. 🏎️',
            platforms: [G, SH(180,gY-80,80,4), SH(340,gY-130,80,5), SH(500,gY-80,80,3), S(660,gY-130,80)],
            spikes: [SK(250,gY-20,60), SK(420,gY-20,60)],
            door: { x: 710, y: gY-190, w: 40, h: 60 },
            trollEvents: [tSpeed(100), tMirror(300)]
        },
        { // 23 — Multiple gravity flips + invisible platforms
            intro: 'Up. Down. Up. Down. Can\'t see. 🎢',
            platforms: [G, CEIL, INV(200,gY-100,80), S(350,20,80), INV(500,gY-100,80), S(650,20,80)],
            spikes: [],
            door: { x: 720, y: gY-60, w: 40, h: 60 },
            trollEvents: [tGrav(230), tGrav(380), tGrav(530), tGrav(680)]
        },
        { // 24 — Bouncy + zoom + reversed + spikes everywhere
            intro: 'Bouncing blind in a mirror of spikes 🪩',
            platforms: [G, S(200,gY-80,70), S(360,gY-80,70), S(520,gY-80,70), S(680,gY-80,70)],
            spikes: [SK(260,gY-20,40), SK(420,gY-20,40), SK(580,gY-20,40), SK(180,50,100), SK(500,50,100)],
            door: { x: 730, y: gY-60, w: 40, h: 60 },
            trollEvents: [tBouncy(50), tZoom(200), tRev(400)]
        },
        { // 25 — Dark + all platforms fake EXCEPT moving ones + speed
            intro: 'In darkness, only motion is real ⚡🌑',
            platforms: [G, F(180,gY-80,80), M(340,gY-120,70,310,60,60), F(480,gY-80,80), M(620,gY-140,70,590,60,80)],
            spikes: [SK(170,gY-20,100), SK(470,gY-20,100)],
            door: { x: 700, y: gY-200, w: 40, h: 60 },
            trollEvents: [tDark(100), tSpeed(300)]
        },

        // ═══ 26-30: PURE CHAOS ═══
        { // 26 — Shrink world + dark + gravity flip + fake door
            intro: 'Disappearing dark upside-down fake exit 💀',
            platforms: [G, CEIL, SH(180,gY-80,80,5), SH(350,gY-140,80,6), S(520,20,80), S(680,20,80)],
            spikes: [SK(170,gY-20,100)],
            door: { x: 720, y: gY-60, w: 40, h: 60, isFake: true },
            realDoor: { x: 720, y: 20, w: 40, h: 60, active: false },
            trollEvents: [tDark(100), tGrav(400), tShake(250)]
        },
        { // 27 — Lie + speed + mirror + invisible + bouncy
            intro: '"Go slow and avoid the gaps!" (do the opposite)',
            platforms: [G, INV(200,gY-80,80), INV(380,gY-80,80), INV(560,gY-80,80)],
            spikes: [SK(280,gY-20,60), SK(460,gY-20,60)],
            door: { x: 700, y: gY-60, w: 40, h: 60 },
            trollEvents: [tLie(0, '🐌 Go SLOW! Avoid ALL gaps!'), tSpeed(100), tMirror(300), tBouncy(50)]
        },
        { // 28 — Moving exit + shrink world + reversed + dark (4s to catch door)
            intro: 'Catch the door. In the dark. Backwards. While everything crumbles. 🫣',
            platforms: [G, SH(180,gY-80,80,4), SH(350,gY-120,80,5), SH(520,gY-80,80,3.5), S(680,gY-120,80)],
            spikes: [SK(260,gY-20,60), SK(430,gY-20,60)],
            door: { x: 720, y: gY-180, w: 40, h: 60, runsAway: true, maxRuns: 3 },
            trollEvents: [tRev(150), tDark(250)]
        },
        { // 29 — All mechanics: fake + invis + shrink + dark + reverse + gravity + bouncy + speed
            intro: 'This level shouldn\'t exist. 🚫',
            platforms: [G, CEIL, F(160,gY-80,70), INV(300,gY-140,70), SH(440,gY-80,70,4),
                        M(580,gY-150,70,550,60,80), S(700,20,70)],
            spikes: [SK(150,gY-20,90), SK(430,gY-20,90)],
            door: { x: 740, y: 20, w: 40, h: 60 },
            trollEvents: [tBouncy(50), tDark(150), tRev(250), tGrav(400), tSpeed(550)]
        },
        { // 30 — THE FINAL LEVEL: fake door, real door hidden, ALL trolls fire in sequence
            intro: '🔥 FINAL LEVEL. Everything we\'ve got. 🔥',
            platforms: [G, CEIL,
                        F(150,gY-80,70), SH(280,gY-140,70,5), M(420,gY-80,70,390,70,70),
                        INV(560,gY-150,70), S(690,gY-80,70)],
            spikes: [SK(140,gY-20,90), SK(340,gY-20,60), SK(550,gY-20,80)],
            door: { x: 730, y: gY-60, w: 40, h: 60, runsAway: true, maxRuns: 2, isFake: true },
            realDoor: { x: 60, y: gY-60, w: 40, h: 60, active: false },
            trollEvents: [
                tLie(0, '🚪 Sprint right! The exit awaits!'),
                tShake(100), tBouncy(150), tRev(250), tDark(350), tSpeed(500)
            ]
        }
    ];
}

// ─── Main Game Object ───
const TrollEscape = {
    canvas: null, ctx: null, ui: null, animFrame: null,
    gameOver: false, paused: false, lastTime: 0,
    W: 800, H: 620,

    screen: 'select',
    progress: null, level: 1, deaths: 0, levelDeaths: 0,
    selectHover: -1,

    // Player
    player: null, gravity: 1400, jumpForce: -550, moveSpeed: 260, keys: {},

    // World
    platforms: [], spikes: [], door: null, realDoor: null,
    trollEvents: [], doorRunCount: 0,
    fakeDoorTriggered: false,

    // Troll states
    controlsReversed: false, gravityFlipped: false,
    shakeTimer: 0, shakeX: 0, shakeY: 0,
    jumpDisabledTimer: 0, zoomTimer: 0, zoomScale: 1,
    darknessActive: false, darknessRadius: 120, darknessTimer: 0, darknessFlashing: false,
    speedMultiplier: 1, playerShrunk: false, bouncyFloor: false, mirrorWorld: false,
    lieMessage: '', lieActive: false,
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
        this.screen = 'select'; this.gameOver = false; this.paused = false;
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
        if (lv > 0 && lv <= this.progress.unlocked) this.startLevel(lv);
    },
    handleMouseMove(e) {
        if (this.screen !== 'select') return;
        const p = this.getCanvasPos(e);
        this.selectHover = this.hitTestLevel(p.x, p.y);
    },
    hitTestLevel(mx, my) {
        const cols = 6, cellW = 100, cellH = 80, ox = (this.W - cols * cellW) / 2, oy = 130;
        for (let i = 0; i < 30; i++) {
            const cx = ox + (i % cols) * cellW + cellW / 2, cy = oy + Math.floor(i / cols) * cellH + cellH / 2;
            if ((mx - cx) ** 2 + (my - cy) ** 2 < 28 * 28) return i + 1;
        }
        return -1;
    },
    handleKey(e) {
        const k = e.key;
        if (this.screen === 'select') return;
        if (k === 'Escape') { this.screen = 'select'; this.ui.setScore(`${Object.keys(this.progress.completed).length}/30 cleared`); return; }
        if (k === 'r' || k === 'R') { this.startLevel(this.level); return; }
        if (k === 'p' || k === 'P') { if (!this.gameOver) { this.paused ? this.resume() : this.pause(); } return; }
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','w','W'].includes(k)) e.preventDefault();
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
        ctx.fillStyle = this.colors.bg; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(255,255,255,0.015)';
        for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        ctx.textAlign = 'center';
        ctx.font = 'bold 32px Outfit, sans-serif'; ctx.fillStyle = this.colors.troll;
        ctx.fillText('TROLL ESCAPE', W / 2, 48);
        ctx.font = '13px Outfit, sans-serif'; ctx.fillStyle = this.colors.text;
        ctx.fillText('Fake paths \u2022 Invisible floors \u2022 Lying instructions \u2022 Shrinking worlds \u2022 Pure chaos', W / 2, 72);

        ctx.font = 'bold 14px JetBrains Mono, monospace';
        ctx.fillStyle = this.colors.deathCounter; ctx.textAlign = 'left';
        ctx.fillText(`\uD83D\uDC80 Total deaths: ${this.deaths}`, 20, 105);
        const cleared = Object.keys(this.progress.completed).length;
        ctx.textAlign = 'right'; ctx.fillStyle = '#00e676';
        ctx.fillText(`\u2705 ${cleared}/30 cleared`, W - 20, 105);

        const cols = 6, cellW = 100, cellH = 80, ox = (W - cols * cellW) / 2, oy = 130;
        const zColors = ['#00d4ff', '#00e676', '#b44dff', '#ff6d00', '#ff2d7b', '#ffd60a'];
        const zNames = ['Warm Up', 'Deceit', 'Mind', 'Cruel', 'Nightmare', 'Chaos'];

        for (let i = 0; i < 30; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            const cx = ox + col * cellW + cellW / 2, cy = oy + row * cellH + cellH / 2;
            const lv = i + 1, unlocked = lv <= this.progress.unlocked, completed = !!this.progress.completed[lv];
            const hovered = this.selectHover === lv, zone = Math.floor(i / 5), zc = zColors[zone];

            if (col === 0) {
                ctx.save(); ctx.font = 'bold 10px Outfit, sans-serif'; ctx.fillStyle = zc;
                ctx.globalAlpha = 0.6; ctx.textAlign = 'right';
                ctx.fillText(zNames[zone].toUpperCase(), ox - 8, cy + 4); ctx.restore();
            }

            const r = hovered && unlocked ? 28 : 24;
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
            if (completed) {
                ctx.fillStyle = '#00e676'; ctx.fill();
                ctx.fillStyle = '#000'; ctx.font = 'bold 16px Outfit, sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('\u2713', cx, cy + 6);
            } else if (unlocked) {
                ctx.fillStyle = hovered ? zc : 'rgba(255,255,255,0.08)'; ctx.fill();
                ctx.strokeStyle = zc; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = hovered ? '#000' : this.colors.text;
                ctx.font = 'bold 16px Outfit, sans-serif'; ctx.textAlign = 'center';
                ctx.fillText(lv, cx, cy + 6);
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.stroke();
                ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('\uD83D\uDD12', cx, cy + 5);
            }
            if (completed && this.progress.completed[lv] !== undefined) {
                ctx.font = '9px JetBrains Mono, monospace'; ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.textAlign = 'center';
                ctx.fillText(`${this.progress.completed[lv]}\uD83D\uDC80`, cx, cy + 22);
            }
        }
        ctx.font = '12px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.textAlign = 'center';
        ctx.fillText('Click a level to play \u2022 ESC to return during gameplay \u2022 R to retry', W / 2, H - 16);
    },

    // ─── Level Loading ───
    startLevel(num) {
        this.screen = 'play'; this.level = num; this.levelDeaths = 0;
        this.fakeDoorTriggered = false;
        this.loadLevel(num); this.lastTime = performance.now();
    },

    loadLevel(num) {
        const W = this.W, H = this.H, gY = H - 40;
        const levels = LEVELS(W, H, gY, this.colors);
        const def = levels[num - 1];
        if (!def) return;

        // Reset all troll states
        this.controlsReversed = false; this.gravityFlipped = false;
        this.shakeTimer = 0; this.shakeX = 0; this.shakeY = 0;
        this.jumpDisabledTimer = 0; this.zoomTimer = 0; this.zoomScale = 1;
        this.darknessActive = false; this.darknessTimer = 0; this.darknessFlashing = false;
        this.speedMultiplier = 1; this.playerShrunk = false; this.bouncyFloor = false; this.mirrorWorld = false;
        this.lieMessage = ''; this.lieActive = false;
        this.levelCompleteActive = false; this.levelCompleteTimer = 0;
        this.trollMessage = ''; this.trollMessageTimer = 0;
        this.doorRunCount = 0; this.particles = [];
        this.keys = {}; this.touchLeft = this.touchRight = this.touchJump = false;

        this.platforms = JSON.parse(JSON.stringify(def.platforms));
        this.spikes = JSON.parse(JSON.stringify(def.spikes));
        this.door = JSON.parse(JSON.stringify(def.door)); this.door.reached = false;
        this.realDoor = def.realDoor ? JSON.parse(JSON.stringify(def.realDoor)) : null;
        this.trollEvents = JSON.parse(JSON.stringify(def.trollEvents));

        // Process start-time events (lies)
        for (const ev of this.trollEvents) {
            if (ev.showAtStart && !ev.triggered) { ev.triggered = true; this.executeTroll(ev); }
        }

        if (this.fakeDoorTriggered) {
            if (this.door.isFake) this.door.isFake = false;
            if (this.realDoor) { this.realDoor.active = true; this.door = this.realDoor; }
        }

        const ph = 36, pw = 28;
        this.player = { x: 60, y: gY - ph, w: pw, h: ph, vx: 0, vy: 0, grounded: false, facingRight: true, animTimer: 0 };
        this.showTroll(def.intro);
        this.ui.setScore(`Level ${num}/30 \u2022 \uD83D\uDC80 ${this.deaths}`);
    },

    showTroll(msg) { this.trollMessage = msg; this.trollMessageTimer = 2.5; },

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++)
            this.particles.push({ x, y, vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 1) * 250, life: 0.6 + Math.random() * 0.5, size: 2 + Math.random() * 4, color });
    },

    die(reason) {
        this.deaths++; this.levelDeaths++;
        this.progress.deaths = this.deaths; saveProgress(this.progress);
        this.shakeTimer = 0.3;
        this.spawnParticles(this.player.x + 14, this.player.y + 18, '#ff2d7b', 20);
        const msgs = ['\uD83D\uDE02 Gotcha!','\uD83D\uDC80 Nope!','\uD83D\uDE08 Trolled!','\uD83E\uDD21 Nice try!','\uD83D\uDD25 Rekt!','\uD83D\uDCA9 Oops!','\uD83C\uDFAA Surprise!','\uD83E\uDD23 LOL!','\uD83D\uDC80 Ded.', reason || '\uD83D\uDE02 You got trolled!'];
        this.showTroll(msgs[Math.floor(Math.random() * msgs.length)]);
        this.player.vx = 0; this.player.vy = 0; this.player.dead = true;
        setTimeout(() => { if (this.screen === 'play') this.loadLevel(this.level); }, 700);
    },

    winLevel() {
        if (this.levelCompleteActive) return;
        this.levelCompleteActive = true;
        this.spawnParticles(this.door.x + 20, this.door.y + 30, '#00e676', 30);
        this.spawnParticles(this.door.x + 20, this.door.y + 30, '#ffd60a', 20);
        const prev = this.progress.completed[this.level] || Infinity;
        this.progress.completed[this.level] = Math.min(prev, this.levelDeaths);
        if (this.level >= this.progress.unlocked && this.level < 30) this.progress.unlocked = this.level + 1;
        saveProgress(this.progress);
        this.ui.setHighScore(this.deaths);
        if (this.level >= 30) {
            this.showTroll('\uD83C\uDF89 YOU BEAT ALL 30 LEVELS! LEGEND!');
            setTimeout(() => { this.gameOver = true; this.ui.showGameOver(`${this.deaths} deaths`, this.ui.getHighScore() + ' deaths'); }, 1600);
        } else {
            this.showTroll(`\u2705 Level ${this.level} cleared! (${this.levelDeaths} deaths)`);
            setTimeout(() => { this.screen = 'select'; this.ui.setScore(`${Object.keys(this.progress.completed).length}/30 cleared`); }, 1500);
        }
    },

    // ─── Update ───
    update(dt) {
        if (this.screen === 'select') return;
        if (this.player.dead) { this.updateParticles(dt); this.updateShake(dt); return; }
        if (this.levelCompleteActive) { this.updateParticles(dt); return; }

        if (this.trollMessageTimer > 0) this.trollMessageTimer -= dt;
        if (this.jumpDisabledTimer > 0) this.jumpDisabledTimer -= dt;
        if (this.zoomTimer > 0) { this.zoomTimer -= dt; if (this.zoomTimer <= 0) this.zoomScale = 1; }

        // Darkness flash cycle
        if (this.darknessActive) {
            this.darknessTimer += dt;
            if (!this.darknessFlashing && this.darknessTimer >= 3) { this.darknessFlashing = true; this.darknessTimer = 0; }
            else if (this.darknessFlashing && this.darknessTimer >= 0.5) { this.darknessFlashing = false; this.darknessTimer = 0; }
        }

        // Shrinking platforms
        for (const p of this.platforms) {
            if (p.type === 'shrinking' && p.state === 'solid') {
                p.timer += dt;
                if (p.timer >= p.lifetime * 0.7) p.state = 'fading';
                if (p.timer >= p.lifetime * 0.9) p.state = 'shaking';
                if (p.timer >= p.lifetime) { p.state = 'fallen'; p.fallVy = 0; }
            }
            if (p.type === 'shrinking' && p.state === 'fallen') {
                p.fallVy = (p.fallVy || 0) + 800 * dt; p.y += p.fallVy * dt;
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
            this.player.vy = this.bouncyFloor ? this.jumpForce * 1.6 : (this.gravityFlipped ? -this.jumpForce : this.jumpForce);
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
            if ((p.type === 'fake' && p.fallen) || (p.type === 'shrinking' && p.state === 'fallen')) continue;
            if (p.type === 'invisible' && !p.revealed) {
                // Check if player is near — reveal on contact
                if (this.rectOverlap(this.player, p)) p.revealed = true;
                else continue; // can't collide until revealed... but actually we want collision even invisible
            }
            if (p.type === 'moving') p.x = p.originX + Math.sin(performance.now() / 1000 * (p.speed / 50)) * p.rangeX;

            if (this.rectOverlap(this.player, p)) {
                // Invisible: reveal on touch
                if (p.type === 'invisible') p.revealed = true;

                if (!this.gravityFlipped) {
                    if (this.player.vy >= 0 && this.player.y + this.player.h - this.player.vy * dt <= p.y + 5) {
                        this.player.y = p.y - this.player.h;
                        this.player.vy = this.bouncyFloor ? -400 : 0;
                        this.player.grounded = !this.bouncyFloor;
                        if (p.type === 'fake' && !p.fallen) {
                            p.stepTimer += dt; p.shakeTimer = Math.min(p.stepTimer * 8, 3);
                            if (p.stepTimer > 0.2) { p.fallen = true; p.fallVy = 0; this.spawnParticles(p.x + p.w/2, p.y, '#8888a0', 8); }
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

        // Falling fake/shrink platforms
        for (const p of this.platforms) {
            if (p.type === 'fake' && p.fallen) { p.fallVy = (p.fallVy || 0) + 800 * dt; p.y += p.fallVy * dt; }
        }

        if (this.player.y > this.H + 50 || this.player.y < -100) { this.die('\uD83D\uDC80 Fell into the void!'); return; }

        // Spike collision
        for (const s of this.spikes) {
            if (!s.visible) continue;
            if (this.rectOverlap(this.player, { x: s.x + 4, y: s.y + 4, w: s.w - 8, h: s.h - 4 })) { this.die('\uD83D\uDE08 Spiky!'); return; }
        }

        // Troll events
        for (const ev of this.trollEvents) {
            if (ev.triggered) continue;
            if (ev.showAtStart) continue; // already handled
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
                    this.showTroll(this.doorRunCount === 1 ? '\uD83D\uDEAA "Nope!" \uD83D\uDE02' : '\uD83D\uDEAA "Catch me!"');
                    this.shakeTimer = 0.2;
                }
            }
            if (this.rectOverlap(this.player, this.door)) {
                if (this.door.isFake) {
                    this.door.isFake = false; this.fakeDoorTriggered = true;
                    this.die('\uD83D\uDC80 FAKE DOOR! Hahaha!');
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
            case 'delayed_spike': ev.spike.visible = true; this.spikes.push(ev.spike); this.showTroll('\uD83D\uDE08 Watch out...'); this.shakeTimer = 0.15; break;
            case 'invisible_spike': ev.spike.visible = true; this.spikes.push(ev.spike); this.showTroll('\uD83D\uDE08 Surprise spike!'); break;
            case 'reverse_controls': this.controlsReversed = !this.controlsReversed; this.showTroll(this.controlsReversed ? '\uD83D\uDD04 Controls reversed!' : '\uD83D\uDD04 Controls... fixed?'); this.shakeTimer = 0.2; break;
            case 'gravity_flip': this.gravityFlipped = !this.gravityFlipped; this.player.vy = 0; this.showTroll('\uD83D\uDE43 Gravity flipped!'); this.shakeTimer = 0.3; break;
            case 'screen_shake': this.shakeTimer = 2; this.showTroll('\uD83E\uDEE8 EARTHQUAKE!'); break;
            case 'jump_disable': this.jumpDisabledTimer = 4; this.showTroll('\uD83D\uDEAB Jump broke! \uD83D\uDE02'); break;
            case 'zoom_in': this.zoomScale = 1.8; this.zoomTimer = 5; this.showTroll('\uD83D\uDD0D Too close!'); break;
            case 'darkness': this.darknessActive = true; this.darknessTimer = 0; this.darknessFlashing = false; this.showTroll('\uD83C\uDF11 Lights out!'); break;
            case 'speed_boost': this.speedMultiplier = 2.2; this.showTroll('\uD83D\uDCA8 TURBO!'); this.shakeTimer = 0.2; break;
            case 'bouncy_floor': this.bouncyFloor = true; this.showTroll('\uD83E\uDD38 Bouncy floor!'); break;
            case 'mirror_world': this.mirrorWorld = true; this.showTroll('\uD83E\uDE9E Everything mirrored!'); break;
            case 'shrink_player': this.playerShrunk = true; this.player.w = 16; this.player.h = 20; this.player.y += 16; this.showTroll('\uD83D\uDC1C You shrunk!'); break;
            case 'lie_instruction': this.lieMessage = ev.message; this.lieActive = true; break;
        }
    },

    updateShake(dt) {
        if (this.shakeTimer > 0) { this.shakeTimer -= dt; this.shakeX = (Math.random() - 0.5) * 8; this.shakeY = (Math.random() - 0.5) * 8; }
        else { this.shakeX = this.shakeY = 0; }
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
        if (this.mirrorWorld) { ctx.translate(W, 0); ctx.scale(-1, 1); }
        ctx.translate(this.shakeX, this.shakeY);
        if (this.zoomScale !== 1) {
            const cx = this.player.x + this.player.w / 2, cy = this.player.y + this.player.h / 2;
            ctx.translate(cx, cy); ctx.scale(this.zoomScale, this.zoomScale); ctx.translate(-cx, -cy);
        }

        // BG
        ctx.fillStyle = this.colors.bg; ctx.fillRect(-20, -20, W + 40, H + 40);
        ctx.strokeStyle = 'rgba(255,255,255,0.02)'; ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, W - 2, H - 2);

        // Platforms
        for (const p of this.platforms) {
            if ((p.type === 'fake' && p.fallen && p.y > H + 50) || (p.type === 'shrinking' && p.state === 'fallen' && p.y > H + 50)) continue;
            if (p.type === 'invisible' && !p.revealed) {
                // Draw faint dotted outline as hint
                ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
                ctx.strokeRect(p.x, p.y, p.w, p.h); ctx.setLineDash([]); ctx.restore();
                continue;
            }
            ctx.save();
            if (p.type === 'fake' && !p.fallen && p.shakeTimer > 0) ctx.translate((Math.random() - 0.5) * p.shakeTimer * 3, 0);
            if (p.type === 'shrinking' && p.state === 'shaking') ctx.translate((Math.random() - 0.5) * 4, 0);

            ctx.globalAlpha = p.type === 'shrinking' && p.state === 'fading' ? 0.5 : 1;
            ctx.fillStyle = p.color || this.colors.platform;
            this.roundRect(ctx, p.x, p.y, p.w, p.h || 20, 4); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(p.x + 2, p.y, p.w - 4, 3);

            // Fake crack hint
            if (p.type === 'fake' && !p.fallen) {
                ctx.strokeStyle = 'rgba(255,45,123,0.12)'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(p.x + p.w * 0.3, p.y + 2); ctx.lineTo(p.x + p.w * 0.5, (p.h || 20) + p.y - 2); ctx.stroke();
            }
            // Shrinking glow
            if (p.type === 'shrinking' && p.state === 'solid') {
                const pct = p.timer / p.lifetime;
                if (pct > 0.5) {
                    ctx.strokeStyle = `rgba(255,45,123,${(pct - 0.5) * 0.6})`; ctx.lineWidth = 2;
                    ctx.strokeRect(p.x, p.y, p.w, p.h || 20);
                }
            }
            // Invisible revealed styling
            if (p.type === 'invisible' && p.revealed) {
                ctx.strokeStyle = 'rgba(0,212,255,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
                ctx.strokeRect(p.x, p.y, p.w, p.h || 20); ctx.setLineDash([]);
            }
            ctx.globalAlpha = 1;
            ctx.restore();
        }

        // Spikes
        for (const s of this.spikes) {
            if (!s.visible) continue;
            ctx.fillStyle = this.colors.spike;
            const cnt = Math.max(1, Math.floor(s.w / 12)), sw = s.w / cnt;
            for (let i = 0; i < cnt; i++) {
                ctx.beginPath(); ctx.moveTo(s.x + i * sw, s.y + s.h); ctx.lineTo(s.x + i * sw + sw / 2, s.y); ctx.lineTo(s.x + (i + 1) * sw, s.y + s.h); ctx.closePath(); ctx.fill();
            }
        }

        // Door
        if (this.door && !this.door.reached) this.renderDoor(ctx, this.door, !this.door.isFake);
        if (this.realDoor && this.realDoor.active) {
            this.renderDoor(ctx, this.realDoor, true);
            ctx.fillStyle = this.colors.troll; ctx.font = '11px Outfit, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('\u2190 Real door!', this.realDoor.x + 20, this.realDoor.y - 10);
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
            ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(-20, -20, W + 40, H + 40);
            ctx.globalCompositeOperation = 'destination-out';
            const r = this.darknessRadius;
            const grad = ctx.createRadialGradient(this.player.x + 14, this.player.y + 18, 0, this.player.x + 14, this.player.y + 18, r);
            grad.addColorStop(0, 'rgba(0,0,0,1)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(this.player.x + 14 - r, this.player.y + 18 - r, r * 2, r * 2);
            ctx.restore();
        }

        // HUD
        ctx.save();
        if (this.mirrorWorld) { ctx.translate(W, 0); ctx.scale(-1, 1); }
        ctx.fillStyle = this.colors.deathCounter; ctx.font = 'bold 15px JetBrains Mono, monospace'; ctx.textAlign = 'left';
        ctx.fillText(`\uD83D\uDC80 ${this.levelDeaths} (total: ${this.deaths})`, 12, 24);
        ctx.fillStyle = this.colors.text; ctx.font = 'bold 14px Outfit, sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(`Level ${this.level}/30`, W - 12, 24);
        ctx.font = '11px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillText('R = retry \u2022 ESC = levels', W - 12, 42);

        // Lie instruction
        if (this.lieActive && this.lieMessage) {
            ctx.globalAlpha = 0.9; ctx.font = 'bold 16px Outfit, sans-serif'; ctx.textAlign = 'center';
            const tw = ctx.measureText(this.lieMessage).width;
            ctx.fillStyle = 'rgba(255,214,10,0.15)';
            this.roundRect(ctx, W/2 - tw/2 - 12, H - 40, tw + 24, 30, 8); ctx.fill();
            ctx.fillStyle = this.colors.troll;
            ctx.fillText(this.lieMessage, W / 2, H - 20);
            ctx.globalAlpha = 1;
        }

        // Troll message
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

        // Status indicators
        let statusY = 55;
        if (this.controlsReversed) { ctx.fillStyle = 'rgba(255,45,123,0.8)'; ctx.font = 'bold 11px JetBrains Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText('\u26A0 REVERSED', W / 2, statusY); statusY += 15; }
        if (this.gravityFlipped) { ctx.fillStyle = 'rgba(180,77,255,0.8)'; ctx.font = 'bold 11px JetBrains Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText('\uD83D\uDE43 GRAVITY', W / 2, statusY); statusY += 15; }
        if (this.jumpDisabledTimer > 0) { ctx.fillStyle = 'rgba(255,214,10,0.8)'; ctx.font = 'bold 11px JetBrains Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText(`\uD83D\uDEAB JUMP (${this.jumpDisabledTimer.toFixed(1)}s)`, W / 2, statusY); statusY += 15; }
        if (this.mirrorWorld) { ctx.fillStyle = 'rgba(0,212,255,0.7)'; ctx.font = 'bold 11px JetBrains Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText('\uD83E\uDE9E MIRROR', W / 2, statusY); statusY += 15; }
        if (this.darknessActive) { ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = 'bold 11px JetBrains Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText('\uD83C\uDF11 DARK', W / 2, statusY); statusY += 15; }
        if (this.bouncyFloor) { ctx.fillStyle = 'rgba(0,230,118,0.7)'; ctx.font = 'bold 11px JetBrains Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText('\uD83E\uDD38 BOUNCY', W / 2, statusY); }

        if ('ontouchstart' in window) { ctx.globalAlpha = 0.3; ctx.fillStyle = '#fff'; ctx.font = '11px Outfit, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('\u25C0 Left | Jump | Right \u25B6', W / 2, H - 50); ctx.globalAlpha = 1; }
        ctx.restore();
        ctx.restore();
    },

    renderPlayer(ctx) {
        const p = this.player;
        ctx.save();
        if (this.gravityFlipped) { ctx.translate(0, p.y * 2 + p.h); ctx.scale(1, -1); }
        ctx.fillStyle = this.playerShrunk ? '#ffd60a' : this.colors.player;
        this.roundRect(ctx, p.x, p.y, p.w, p.h, this.playerShrunk ? 4 : 6); ctx.fill();
        const s = this.playerShrunk;
        const ex = p.facingRight ? p.x + (s ? 10 : 17) : p.x + (s ? 4 : 7), ey = p.y + (s ? 6 : 10);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, ey, s ? 3 : 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(ex + (p.facingRight ? 1.5 : -1.5), ey, s ? 1.5 : 2, 0, Math.PI * 2); ctx.fill();
        if (Math.abs(p.vx) > 10 && p.grounded) {
            const lp = Math.sin(p.animTimer * 12) * (s ? 3 : 5);
            ctx.strokeStyle = s ? '#ffd60a' : this.colors.player; ctx.lineWidth = s ? 2 : 3; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(p.x + p.w * 0.3, p.y + p.h); ctx.lineTo(p.x + p.w * 0.3 + lp, p.y + p.h + 5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(p.x + p.w * 0.7, p.y + p.h); ctx.lineTo(p.x + p.w * 0.7 - lp, p.y + p.h + 5); ctx.stroke();
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
        if (this.gameOver || this.paused) return;
        const now = performance.now();
        let dt = (now - this.lastTime) / 1000; this.lastTime = now;
        if (dt > 0.05) dt = 0.05;
        this.update(dt); this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    }
};

export default TrollEscape;
