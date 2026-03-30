import Storage from './storage.js';

const GAME_META = {
    // Arcade
    snake:         { title: 'Snake',               hint: 'Arrow keys to move \u2022 Swipe on mobile \u2022 P to pause', module: './games/arcade/snake.js' },
    breakout:      { title: 'Breakout',            hint: 'Mouse/touch to move paddle \u2022 Click/SPACE to launch \u2022 P to pause', module: './games/arcade/breakout.js' },
    pong:          { title: 'Pong',                hint: 'Mouse/touch/arrows to move paddle \u2022 P to pause', module: './games/arcade/pong.js' },
    flappy:        { title: 'Flappy Bird',         hint: 'SPACE or tap to flap \u2022 P to pause', module: './games/arcade/flappy.js' },
    asteroids:     { title: 'Asteroids',           hint: 'Arrows/WASD to steer \u2022 SPACE to shoot \u2022 P to pause', module: './games/arcade/asteroids.js' },
    spaceinvaders: { title: 'Space Invaders',      hint: 'Arrows to move \u2022 SPACE to shoot \u2022 P to pause', module: './games/arcade/spaceinvaders.js' },
    tetris:        { title: 'Tetris',              hint: 'Arrows to move/rotate \u2022 SPACE to drop \u2022 P to pause', module: './games/arcade/tetris.js' },
    doodlejump:    { title: 'Doodle Jump',         hint: 'Arrows/WASD to move \u2022 Tap sides on mobile \u2022 P to pause', module: './games/arcade/doodlejump.js' },
    runner:        { title: 'Endless Runner',      hint: 'SPACE or tap to jump \u2022 P to pause', module: './games/arcade/runner.js' },
    helicopter:    { title: 'Helicopter',           hint: 'Hold SPACE/click/tap to fly up \u2022 Release to descend', module: './games/arcade/helicopter.js' },
    pinball:       { title: 'Pinball',               hint: 'Left/Right arrows for flippers \u2022 SPACE to launch', module: './games/arcade/pinball.js' },
    platformer:    { title: 'Platformer',            hint: 'Arrows/WASD to move \u2022 SPACE to jump \u2022 Collect coins!', module: './games/arcade/platformer.js' },

    // Puzzle & Logic
    puzzle:        { title: 'Daily Puzzle',        hint: 'Guess the daily number in 6 tries', module: './games/puzzle/puzzle.js' },
    game2048:      { title: '2048',                hint: 'Arrow keys or swipe to slide tiles', module: './games/puzzle/game2048.js' },
    slidingpuzzle: { title: 'Sliding Puzzle',      hint: 'Click a tile next to the gap to slide it', module: './games/puzzle/slidingpuzzle.js' },
    minesweeper:   { title: 'Minesweeper',         hint: 'Click to reveal \u2022 Right-click or long-press to flag', module: './games/puzzle/minesweeper.js' },
    lightsout:     { title: 'Lights Out',          hint: 'Click a cell to toggle it and its neighbors', module: './games/puzzle/lightsout.js' },
    pipeconnect:   { title: 'Pipe Connect',        hint: 'Click pipes to rotate them \u2022 Connect source to drain', module: './games/puzzle/pipeconnect.js' },
    towerofhanoi:  { title: 'Tower of Hanoi',      hint: 'Click a peg to pick up/place discs \u2022 Keys 1-3', module: './games/puzzle/towerofhanoi.js' },
    sudoku:        { title: 'Sudoku',               hint: 'Click a cell, then press 1-4 or use number pad', module: './games/puzzle/sudoku.js' },
    wordsearch:    { title: 'Word Search',          hint: 'Click and drag to select words', module: './games/puzzle/wordsearch.js' },
    maze:          { title: 'Maze Runner',          hint: 'Arrow keys or swipe to navigate the maze', module: './games/puzzle/maze.js' },

    // Reflex & Speed
    reaction:      { title: 'Reaction Test',      hint: 'Click or tap when the screen turns green', module: './games/reflex/reaction.js' },
    colormatch:    { title: 'Color Match',         hint: 'A/\u2190 = Match \u2022 D/\u2192 = Nope \u2022 or tap buttons', module: './games/reflex/colormatch.js' },
    whackamole:    { title: 'Whack-a-Mole',       hint: 'Click or tap the moles!', module: './games/reflex/whackamole.js' },
    aimtrainer:    { title: 'Aim Trainer',         hint: 'Click the targets before they disappear', module: './games/reflex/aimtrainer.js' },
    typing:        { title: 'Speed Typing',        hint: 'Type the falling words on your keyboard', module: './games/reflex/typing.js' },
    quickmath:     { title: 'Quick Math',          hint: 'Type the answer and press Enter', module: './games/reflex/quickmath.js' },
    tapcounter:    { title: 'Tap Counter',         hint: 'Tap or press SPACE as fast as you can!', module: './games/reflex/tapcounter.js' },
    rhythmtap:     { title: 'Rhythm Tap',           hint: 'D/F/J/K keys or tap lanes when notes reach the line', module: './games/reflex/rhythmtap.js' },

    // Skill & Timing
    stack:         { title: 'Stack Game',          hint: 'Click, tap, or SPACE to drop the block \u2022 P to pause', module: './games/skill/stack.js' },
    catchball:     { title: 'Catch the Ball',      hint: 'Move paddle with mouse/touch/arrow keys', module: './games/skill/catchball.js' },
    ballbounce:    { title: 'Ball Bounce',          hint: 'Move paddle with mouse/touch/arrow keys', module: './games/skill/ballbounce.js' },
    knifethrow:    { title: 'Knife Throw',          hint: 'SPACE or tap to throw the knife', module: './games/skill/knifethrow.js' },
    archery:       { title: 'Archery',              hint: 'Hold SPACE/click to charge \u2022 Release to shoot', module: './games/skill/archery.js' },
    darts:         { title: 'Darts',                hint: 'SPACE or tap to throw when crosshair is on target', module: './games/skill/darts.js' },
    golfputt:      { title: 'Golf Putt',            hint: 'Aim with mouse \u2022 Hold click to set power \u2022 Release to putt', module: './games/skill/golfputt.js' },
    fruitslicer:   { title: 'Fruit Slicer',         hint: 'Click/drag across fruits to slice them', module: './games/skill/fruitslicer.js' },
    dodger:        { title: 'Dodger',                hint: 'Mouse/touch/arrows to dodge falling objects', module: './games/skill/dodger.js' },

    // Strategy
    tictactoe:     { title: 'Tic-Tac-Toe',        hint: 'Click or tap a cell to place your X', module: './games/strategy/tictactoe.js' },
    connectfour:   { title: 'Connect Four',        hint: 'Click a column to drop your disc', module: './games/strategy/connectfour.js' },
    tanks:         { title: 'Tanks',                 hint: 'WASD to move \u2022 Mouse to aim \u2022 Click/SPACE to fire', module: './games/strategy/tanks.js' },
    rps:           { title: 'Rock Paper Scissors',  hint: 'Click or press 1/2/3 to choose', module: './games/strategy/rps.js' },

    // Card Games
    hearts:        { title: 'Hearts',                hint: 'Click cards to play \u2022 Arrow keys to navigate \u2022 Avoid hearts & Queen of Spades', module: './games/cards/hearts.js' },
    blackjack:     { title: 'Blackjack',              hint: 'H=Hit \u2022 S=Stand \u2022 D=Double \u2022 1/2/3 to bet', module: './games/cards/blackjack.js' },
    solitaire:     { title: 'Solitaire',              hint: 'Drag cards to move \u2022 Double-click to auto-move \u2022 Click stock to draw', module: './games/cards/solitaire.js' },
    crazyeights:   { title: 'Crazy Eights',           hint: 'Click cards to play \u2022 Click stock to draw \u2022 Arrows + Enter \u2022 P to pause', module: './games/cards/crazyeights.js' },
    war:           { title: 'War',                    hint: 'Click, tap, or SPACE to battle \u2022 P to pause', module: './games/cards/war.js' },

    // Casual
    simon:         { title: 'Simon Says',          hint: 'Watch the pattern, then tap it back', module: './games/casual/simon.js' },
    patternmemory: { title: 'Pattern Memory',     hint: 'Memorize the pattern, then tap the cells', module: './games/casual/patternmemory.js' },
    memorycards:   { title: 'Memory Cards',         hint: 'Click to flip cards \u2022 Match the pairs', module: './games/casual/memorycards.js' },
    colorfill:     { title: 'Color Fill',           hint: 'Click colors or press 1-6 to flood fill', module: './games/casual/colorfill.js' },
    numbersort:    { title: 'Number Sort',          hint: 'Click adjacent numbers to swap them', module: './games/casual/numbersort.js' },
    bubblepop:     { title: 'Bubble Pop',           hint: 'Click or tap bubbles to pop them', module: './games/casual/bubblepop.js' },
    matching:      { title: 'Pattern Match',         hint: 'Memorize the pattern \u2022 Click cells to recreate it', module: './games/casual/matching.js' }
};

const CANVAS_W = 800;
const CANVAS_H = 620;

// Per-game canvas size overrides
const CANVAS_OVERRIDES = {
    snake:         { w: 620, h: 620 },
    pong:          { w: 900, h: 440 },
    tanks:         { w: 900, h: 620 },
    asteroids:     { w: 900, h: 620 },
    spaceinvaders: { w: 850, h: 620 },
    tetris:        { w: 750, h: 650 },
    minesweeper:   { w: 850, h: 620 },
    wordsearch:    { w: 850, h: 620 }
};

// Games with level/difficulty selection
const GAME_LEVELS = {
    breakout: [
        { key: 'easy', name: 'Easy', desc: '4 rows, slow ball', css: 'level-btn-easy' },
        { key: 'medium', name: 'Medium', desc: '6 rows, normal speed', css: 'level-btn-medium' },
        { key: 'hard', name: 'Hard', desc: '8 rows, fast ball', css: 'level-btn-hard' }
    ],
    spaceinvaders: [
        { key: 'easy', name: 'Easy', desc: '3 rows, slow invaders', css: 'level-btn-easy' },
        { key: 'medium', name: 'Medium', desc: '4 rows, normal speed', css: 'level-btn-medium' },
        { key: 'hard', name: 'Hard', desc: '6 rows, fast & aggressive', css: 'level-btn-hard' }
    ],
    snake: [
        { key: 'easy', name: 'Easy', desc: 'No walls, slow', css: 'level-btn-easy' },
        { key: 'medium', name: 'Medium', desc: 'Some obstacles, normal', css: 'level-btn-medium' },
        { key: 'hard', name: 'Hard', desc: 'Many obstacles, fast', css: 'level-btn-hard' }
    ],
    platformer: [
        { key: 'easy', name: 'Level 1', desc: 'Simple platforms', css: 'level-btn-easy' },
        { key: 'medium', name: 'Level 2', desc: 'Moving platforms', css: 'level-btn-medium' },
        { key: 'hard', name: 'Level 3', desc: 'Expert course', css: 'level-btn-hard' }
    ],
    minesweeper: [
        { key: 'easy', name: 'Easy', desc: '8\u00d78 grid, 10 mines', css: 'level-btn-easy' },
        { key: 'medium', name: 'Medium', desc: '10\u00d710, 15 mines', css: 'level-btn-medium' },
        { key: 'hard', name: 'Hard', desc: '14\u00d714, 35 mines', css: 'level-btn-hard' }
    ],
    sudoku: [
        { key: 'easy', name: 'Easy', desc: '4\u00d74 grid', css: 'level-btn-easy' },
        { key: 'medium', name: 'Medium', desc: '6\u00d76 grid', css: 'level-btn-medium' },
        { key: 'hard', name: 'Hard', desc: '9\u00d79 grid', css: 'level-btn-hard' }
    ],
    slidingpuzzle: [
        { key: 'easy', name: 'Easy', desc: '3\u00d73 grid (8 tiles)', css: 'level-btn-easy' },
        { key: 'medium', name: 'Medium', desc: '4\u00d74 grid (15 tiles)', css: 'level-btn-medium' },
        { key: 'hard', name: 'Hard', desc: '5\u00d75 grid (24 tiles)', css: 'level-btn-hard' }
    ],
    maze: [
        { key: 'easy', name: 'Small', desc: '10\u00d713 maze', css: 'level-btn-easy' },
        { key: 'medium', name: 'Medium', desc: '15\u00d719 maze', css: 'level-btn-medium' },
        { key: 'hard', name: 'Large', desc: '22\u00d729 maze', css: 'level-btn-hard' },
        { key: 'expert', name: 'Huge', desc: '30\u00d739 maze', css: 'level-btn-expert' }
    ],
    pipeconnect: [
        { key: 'easy', name: 'Easy', desc: '4\u00d74 grid', css: 'level-btn-easy' },
        { key: 'medium', name: 'Medium', desc: '6\u00d76 grid', css: 'level-btn-medium' },
        { key: 'hard', name: 'Hard', desc: '8\u00d78 grid', css: 'level-btn-hard' }
    ],
    lightsout: [
        { key: 'easy', name: 'Easy', desc: '3\u00d73 grid', css: 'level-btn-easy' },
        { key: 'medium', name: 'Medium', desc: '5\u00d75 grid', css: 'level-btn-medium' },
        { key: 'hard', name: 'Hard', desc: '7\u00d77 grid', css: 'level-btn-hard' }
    ],
    towerofhanoi: [
        { key: 'easy', name: 'Easy', desc: '3 discs (7 moves)', css: 'level-btn-easy' },
        { key: 'medium', name: 'Medium', desc: '5 discs (31 moves)', css: 'level-btn-medium' },
        { key: 'hard', name: 'Hard', desc: '7 discs (127 moves)', css: 'level-btn-hard' }
    ],
    wordsearch: [
        { key: 'easy', name: 'Easy', desc: '8\u00d78, 4 words', css: 'level-btn-easy' },
        { key: 'medium', name: 'Medium', desc: '10\u00d710, 6 words', css: 'level-btn-medium' },
        { key: 'hard', name: 'Hard', desc: '14\u00d714, 10 words', css: 'level-btn-hard' }
    ],
    colorfill: [
        { key: 'easy', name: 'Easy', desc: '8\u00d78, 4 colors, 25 moves', css: 'level-btn-easy' },
        { key: 'medium', name: 'Medium', desc: '10\u00d710, 6 colors, 25 moves', css: 'level-btn-medium' },
        { key: 'hard', name: 'Hard', desc: '14\u00d714, 7 colors, 22 moves', css: 'level-btn-hard' }
    ]
};

let currentGame = null;

async function init() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const mode = params.get('mode') || '1p'; // '1p' or '2p'
    const meta = GAME_META[id];

    if (!meta) {
        document.getElementById('gameTitle').style.display = 'none';
        document.getElementById('scoreBar').style.display = 'none';
        document.getElementById('canvasWrapper').style.display = 'none';
        document.getElementById('controlsHint').style.display = 'none';
        document.getElementById('gameError').style.display = 'block';
        return;
    }

    const modeLabel = mode === '2p' ? ' (2 Player)' : '';
    const pageTitle = `Play ${meta.title}${modeLabel} Free Online - Zehum Mini Games`;
    const pageDesc = `Play ${meta.title} for free online on Zehum Mini Games. No downloads, no installs. Challenge yourself and beat your high score!`;
    const pageUrl = `https://zehum.com/game?id=${id}`;

    document.title = pageTitle;
    document.getElementById('gameTitle').textContent = meta.title + modeLabel;
    document.getElementById('controlsHint').textContent = meta.hint;

    // Update meta tags for SEO / social sharing
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) descTag.setAttribute('content', pageDesc);
    const ogTitle = document.getElementById('ogTitle');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);
    const ogDesc = document.getElementById('ogDescription');
    if (ogDesc) ogDesc.setAttribute('content', pageDesc);
    const ogUrl = document.getElementById('ogUrl');
    if (ogUrl) ogUrl.setAttribute('content', pageUrl);
    const twTitle = document.getElementById('twTitle');
    if (twTitle) twTitle.setAttribute('content', pageTitle);
    const twDesc = document.getElementById('twDescription');
    if (twDesc) twDesc.setAttribute('content', pageDesc);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
        const link = document.createElement('link');
        link.rel = 'canonical';
        link.href = pageUrl;
        document.head.appendChild(link);
    }

    const canvas = document.getElementById('gameCanvas');
    const override = CANVAS_OVERRIDES[id];
    const cw = override ? override.w : CANVAS_W;
    const ch = override ? override.h : CANVAS_H;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const best = Storage.getHighScore(id);
    document.getElementById('highScore').textContent = best || '\u2014';

    const mod = await import(meta.module);
    const game = mod.default;
    currentGame = game;

    let selectedLevel = params.get('level') || null;

    function buildUI(level) {
        return {
            setScore(val) { document.getElementById('currentScore').textContent = val; },
            getHighScore() { return Storage.getHighScore(id); },
            setHighScore(val) {
                const isNew = Storage.setHighScore(id, val);
                document.getElementById('highScore').textContent = Storage.getHighScore(id);
                return isNew;
            },
            showGameOver(score, best) {
                document.getElementById('overlayScore').textContent = score;
                document.getElementById('overlayBest').textContent = best;
                document.getElementById('gameOverlay').style.display = 'flex';
            },
            hideGameOver() { document.getElementById('gameOverlay').style.display = 'none'; },
            showPause() { document.getElementById('pauseOverlay').style.display = 'flex'; },
            hidePause() { document.getElementById('pauseOverlay').style.display = 'none'; },
            gameName: meta.title,
            canvasW: cw,
            canvasH: ch,
            mode: mode,
            level: level || 'medium'
        };
    }

    let playCount = 0;

    function shouldShowInterstitial() {
        playCount++;
        // Show on 1st play, then every 10th play after that
        return playCount === 1 || playCount % 10 === 0;
    }

    function showInterstitial() {
        if (!shouldShowInterstitial()) {
            return Promise.resolve();
        }
        return new Promise(resolve => {
            const overlay = document.getElementById('interstitialOverlay');
            const timerEl = document.getElementById('interstitialTimer');
            const skipBtn = document.getElementById('interstitialSkip');
            const adContainer = document.getElementById('interstitialAdContainer');

            // Clear previous ad and inject a fresh one
            adContainer.innerHTML = '';
            const ins = document.createElement('ins');
            ins.className = 'adsbygoogle';
            ins.style.display = 'block';
            ins.setAttribute('data-ad-client', 'ca-pub-3366385543056829');
            ins.setAttribute('data-ad-slot', '1810232737');
            ins.setAttribute('data-ad-format', 'auto');
            ins.setAttribute('data-full-width-responsive', 'true');
            adContainer.appendChild(ins);

            // Show overlay first so the container has width
            overlay.style.display = 'flex';

            // Now push the ad (container is visible, has width)
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                // Ad failed to load
            }

            // Fallback: if ad doesn't fill after 1.5s, show a self-promo ad
            setTimeout(() => {
                const status = ins.getAttribute('data-ad-status');
                if (!status || status === 'unfilled' || ins.innerHTML.trim() === '') {
                    adContainer.innerHTML = `
                        <div style="width:100%;max-width:400px;padding:32px;text-align:center;">
                            <div style="font-size:2.5rem;margin-bottom:16px;">🎮</div>
                            <h3 style="color:#e8e8f0;font-size:1.3rem;margin-bottom:8px;font-family:Outfit,sans-serif;">Zehum Mini Games</h3>
                            <p style="color:#8888a0;font-size:0.9rem;line-height:1.6;margin-bottom:20px;font-family:Outfit,sans-serif;">
                                50+ free games at your fingertips!<br>
                                Challenge friends, beat high scores, and have fun.
                            </p>
                            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                                <a href="/game?id=tetris" style="background:#00d4ff;color:#000;padding:8px 16px;border-radius:8px;text-decoration:none;font-family:Outfit,sans-serif;font-weight:600;font-size:0.85rem;">Play Tetris</a>
                                <a href="/game?id=snake" style="background:#00e676;color:#000;padding:8px 16px;border-radius:8px;text-decoration:none;font-family:Outfit,sans-serif;font-weight:600;font-size:0.85rem;">Play Snake</a>
                                <a href="/game?id=flappy" style="background:#ffd60a;color:#000;padding:8px 16px;border-radius:8px;text-decoration:none;font-family:Outfit,sans-serif;font-weight:600;font-size:0.85rem;">Play Flappy</a>
                            </div>
                            <p style="color:#555;font-size:0.7rem;margin-top:16px;font-family:Outfit,sans-serif;">zehum.com — No downloads. Just play.</p>
                        </div>
                    `;
                }
            }, 1500);

            let seconds = 5;
            timerEl.textContent = seconds;
            skipBtn.disabled = true;
            skipBtn.textContent = 'Wait...';

            const interval = setInterval(() => {
                seconds--;
                timerEl.textContent = seconds;
                if (seconds <= 0) {
                    clearInterval(interval);
                    skipBtn.disabled = false;
                    skipBtn.textContent = 'Play Now';
                }
            }, 1000);

            skipBtn.addEventListener('click', function handler() {
                skipBtn.removeEventListener('click', handler);
                overlay.style.display = 'none';
                resolve();
            });
        });
    }

    async function startGame(level) {
        selectedLevel = level;
        document.getElementById('levelSelect').style.display = 'none';
        await showInterstitial();
        game.init(canvas, ctx, buildUI(level));
        game.start();
    }

    const levels = GAME_LEVELS[id];
    if (levels && !selectedLevel) {
        // Show level selector
        const container = document.getElementById('levelButtons');
        container.innerHTML = levels.map(lv => `
            <button class="level-btn ${lv.css}" data-level="${lv.key}">
                <div class="level-btn-info">
                    <span class="level-btn-name">${lv.name}</span>
                    <span class="level-btn-desc">${lv.desc}</span>
                </div>
                <span class="level-btn-badge">${lv.name}</span>
            </button>
        `).join('');
        document.getElementById('levelSelect').style.display = 'flex';

        container.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', () => startGame(btn.dataset.level));
        });
    } else {
        // No levels or level pre-selected via URL
        startGame(selectedLevel || 'medium');
    }

    document.getElementById('playAgainBtn').addEventListener('click', async () => {
        document.getElementById('gameOverlay').style.display = 'none';
        await showInterstitial();
        game.reset();
        game.start();
    });

    document.getElementById('resumeBtn').addEventListener('click', () => {
        document.getElementById('pauseOverlay').style.display = 'none';
        game.resume();
    });

    document.getElementById('shareBtn').addEventListener('click', () => {
        const score = document.getElementById('overlayScore').textContent;
        const text = `\uD83C\uDFAE I scored ${score} on ${meta.title} in Zehum Mini Games! Can you beat me?`;
        if (navigator.share) {
            navigator.share({ text });
        } else {
            navigator.clipboard.writeText(text).then(() => {
                const btn = document.getElementById('shareBtn');
                btn.textContent = 'Copied!';
                setTimeout(() => btn.textContent = 'Share Score', 1500);
            });
        }
    });
    // Render suggested games
    renderSuggested(id);
}

const SUGGESTED_DATA = [
    { id: 'reaction', title: 'Reaction Test', icon: '\u26A1', gradient: 'linear-gradient(135deg, #00e676, #00b0ff)' },
    { id: 'snake', title: 'Snake', icon: '\uD83D\uDC0D', gradient: 'linear-gradient(135deg, #00e676, #76ff03)' },
    { id: 'runner', title: 'Endless Runner', icon: '\uD83C\uDFC3', gradient: 'linear-gradient(135deg, #ff2d7b, #ff6d00)' },
    { id: 'stack', title: 'Stack Game', icon: '\uD83E\uDDF1', gradient: 'linear-gradient(135deg, #ffd60a, #ff6d00)' },
    { id: 'puzzle', title: 'Daily Puzzle', icon: '\uD83E\uDDE9', gradient: 'linear-gradient(135deg, #7c4dff, #00b0ff)' },
    { id: 'colormatch', title: 'Color Match', icon: '\uD83C\uDFA8', gradient: 'linear-gradient(135deg, #ff2d7b, #b44dff)' },
    { id: 'whackamole', title: 'Whack-a-Mole', icon: '\uD83D\uDD28', gradient: 'linear-gradient(135deg, #8B4513, #ff6d00)' },
    { id: 'aimtrainer', title: 'Aim Trainer', icon: '\uD83C\uDFAF', gradient: 'linear-gradient(135deg, #ff2d7b, #ff0000)' },
    { id: 'typing', title: 'Speed Typing', icon: '\u2328\uFE0F', gradient: 'linear-gradient(135deg, #00d4ff, #7c4dff)' },
    { id: 'quickmath', title: 'Quick Math', icon: '\uD83E\uDDEE', gradient: 'linear-gradient(135deg, #00e676, #ffd60a)' },
    { id: 'tapcounter', title: 'Tap Counter', icon: '\uD83D\uDC46', gradient: 'linear-gradient(135deg, #00d4ff, #00e676)' },
    { id: 'simon', title: 'Simon Says', icon: '\uD83D\uDFE2', gradient: 'linear-gradient(135deg, #00e676, #ffd60a)' },
    { id: 'catchball', title: 'Catch the Ball', icon: '\uD83E\uDD4E', gradient: 'linear-gradient(135deg, #ffd60a, #ff8c00)' },
    { id: 'breakout', title: 'Breakout', icon: '\uD83E\uDDF1', gradient: 'linear-gradient(135deg, #ff2d7b, #ffd60a)' },
    { id: 'pong', title: 'Pong', icon: '\uD83C\uDFD3', gradient: 'linear-gradient(135deg, #00d4ff, #ff2d7b)' },
    { id: 'flappy', title: 'Flappy Bird', icon: '\uD83D\uDC26', gradient: 'linear-gradient(135deg, #ffd60a, #00e676)' },
    { id: 'asteroids', title: 'Asteroids', icon: '\u2604\uFE0F', gradient: 'linear-gradient(135deg, #8888a0, #00d4ff)' },
    { id: 'spaceinvaders', title: 'Space Invaders', icon: '\uD83D\uDC7E', gradient: 'linear-gradient(135deg, #00e676, #00d4ff)' },
    { id: 'tetris', title: 'Tetris', icon: '\uD83D\uDFE6', gradient: 'linear-gradient(135deg, #7c4dff, #00d4ff)' },
    { id: 'doodlejump', title: 'Doodle Jump', icon: '\uD83E\uDE82', gradient: 'linear-gradient(135deg, #00e676, #ffd60a)' },
    { id: 'game2048', title: '2048', icon: '\uD83D\uDD22', gradient: 'linear-gradient(135deg, #f4a261, #e76f51)' },
    { id: 'slidingpuzzle', title: 'Sliding Puzzle', icon: '\uD83E\uDDE9', gradient: 'linear-gradient(135deg, #2a9d8f, #264653)' },
    { id: 'minesweeper', title: 'Minesweeper', icon: '\uD83D\uDCA3', gradient: 'linear-gradient(135deg, #888, #ff2d7b)' },
    { id: 'tictactoe', title: 'Tic-Tac-Toe', icon: '\u274C', gradient: 'linear-gradient(135deg, #00d4ff, #ff2d7b)' },
    { id: 'connectfour', title: 'Connect Four', icon: '\uD83D\uDD34', gradient: 'linear-gradient(135deg, #ff2d7b, #ffd60a)' },
    { id: 'lightsout', title: 'Lights Out', icon: '\uD83D\uDCA1', gradient: 'linear-gradient(135deg, #ffd60a, #ff8c00)' },
    { id: 'helicopter', title: 'Helicopter', icon: '\uD83D\uDE81', gradient: 'linear-gradient(135deg, #00d4ff, #00e676)' },
    { id: 'knifethrow', title: 'Knife Throw', icon: '\uD83D\uDD2A', gradient: 'linear-gradient(135deg, #888, #ffd60a)' },
    { id: 'archery', title: 'Archery', icon: '\uD83C\uDFF9', gradient: 'linear-gradient(135deg, #00e676, #ffd60a)' },
    { id: 'darts', title: 'Darts', icon: '\uD83C\uDFAF', gradient: 'linear-gradient(135deg, #ff2d7b, #00e676)' },
    { id: 'rhythmtap', title: 'Rhythm Tap', icon: '\uD83C\uDFB5', gradient: 'linear-gradient(135deg, #b44dff, #ff2d7b)' },
    { id: 'maze', title: 'Maze Runner', icon: '\uD83C\uDF10', gradient: 'linear-gradient(135deg, #00d4ff, #b44dff)' },
    { id: 'memorycards', title: 'Memory Cards', icon: '\uD83C\uDCCF', gradient: 'linear-gradient(135deg, #7c4dff, #ff2d7b)' },
    { id: 'fruitslicer', title: 'Fruit Slicer', icon: '\uD83C\uDF49', gradient: 'linear-gradient(135deg, #ff2d7b, #00e676)' },
    { id: 'platformer', title: 'Platformer', icon: '\uD83C\uDFAE', gradient: 'linear-gradient(135deg, #00d4ff, #ffd60a)' },
    { id: 'dodger', title: 'Dodger', icon: '\uD83D\uDCA8', gradient: 'linear-gradient(135deg, #ff2d7b, #888)' },
    { id: 'pinball', title: 'Pinball', icon: '\uD83E\uDE99', gradient: 'linear-gradient(135deg, #ffd60a, #ff2d7b)' },
    { id: 'tanks', title: 'Tanks', icon: '\uD83D\uDE82', gradient: 'linear-gradient(135deg, #00e676, #888)' },
    { id: 'golfputt', title: 'Golf Putt', icon: '\u26F3', gradient: 'linear-gradient(135deg, #00e676, #264653)' },
    { id: 'sudoku', title: 'Sudoku', icon: '\uD83E\uDDEE', gradient: 'linear-gradient(135deg, #7c4dff, #00e676)' },
    { id: 'colorfill', title: 'Color Fill', icon: '\uD83C\uDF08', gradient: 'linear-gradient(135deg, #ff2d7b, #ffd60a)' },
    { id: 'bubblepop', title: 'Bubble Pop', icon: '\uD83E\uDEE7', gradient: 'linear-gradient(135deg, #00d4ff, #b44dff)' },
    { id: 'rps', title: 'Rock Paper Scissors', icon: '\u270A', gradient: 'linear-gradient(135deg, #888, #00d4ff)' },
    { id: 'ballbounce', title: 'Ball Bounce', icon: '\u26BD', gradient: 'linear-gradient(135deg, #00d4ff, #7c4dff)' },
    { id: 'patternmemory', title: 'Pattern Memory', icon: '\uD83E\uDDE0', gradient: 'linear-gradient(135deg, #00d4ff, #b44dff)' },
    { id: 'hearts', title: 'Hearts', icon: '\u2665\uFE0F', gradient: 'linear-gradient(135deg, #ff2d7b, #b44dff)' },
    { id: 'blackjack', title: 'Blackjack', icon: '\uD83C\uDCCF', gradient: 'linear-gradient(135deg, #1a5c3a, #00e676)' },
    { id: 'solitaire', title: 'Solitaire', icon: '\uD83C\uDCC1', gradient: 'linear-gradient(135deg, #00e676, #1a5c3a)' },
    { id: 'crazyeights', title: 'Crazy Eights', icon: '\uD83C\uDCB8', gradient: 'linear-gradient(135deg, #ffd60a, #ff6d00)' },
    { id: 'war', title: 'War', icon: '\u2694\uFE0F', gradient: 'linear-gradient(135deg, #ff2d7b, #ffd60a)' }
];

function renderSuggested(currentId) {
    const grid = document.getElementById('suggestedGrid');
    if (!grid) return;

    // Pick 6 random games excluding the current one
    const others = SUGGESTED_DATA.filter(g => g.id !== currentId);
    const shuffled = others.sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, 6);

    grid.innerHTML = picks.map(game => `
        <a href="game?id=${game.id}" class="suggested-card">
            <div class="suggested-icon" style="background: ${game.gradient}">
                <span>${game.icon}</span>
            </div>
            <span class="suggested-name">${game.title}</span>
        </a>
    `).join('');
}

init();
