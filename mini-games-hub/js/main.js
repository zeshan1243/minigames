import Storage from './storage.js';

const CATEGORIES = [
    { key: 'all', label: 'All Games' },
    { key: 'arcade', label: 'Arcade' },
    { key: 'puzzle', label: 'Puzzle & Logic' },
    { key: 'reflex', label: 'Reflex & Speed' },
    { key: 'skill', label: 'Skill & Timing' },
    { key: 'strategy', label: 'Strategy' },
    { key: 'casual', label: 'Casual' },
    { key: 'multiplayer', label: '2 Player' }
];

const GAMES = [
    // Arcade
    { id: 'snake', title: 'Snake', description: 'Eat, grow, survive. The classic reimagined.', icon: '\uD83D\uDC0D', gradient: 'linear-gradient(135deg, #00e676, #76ff03)', scoreUnit: '', category: 'arcade', multiplayer: true, thumb: 'snake.png' },
    { id: 'breakout', title: 'Breakout', description: 'Smash all the bricks with the bouncing ball.', icon: '\uD83E\uDDF1', gradient: 'linear-gradient(135deg, #ff2d7b, #ffd60a)', scoreUnit: '', category: 'arcade', multiplayer: true, thumb: 'breakout.png' },
    { id: 'pong', title: 'Pong', description: 'Classic paddle battle — 1P vs AI or 2P!', icon: '\uD83C\uDFD3', gradient: 'linear-gradient(135deg, #00d4ff, #ff2d7b)', scoreUnit: '', category: 'arcade', multiplayer: true, thumb: 'pong.png' },
    { id: 'flappy', title: 'Flappy Bird', description: 'Tap to fly through the pipes. Don\'t crash!', icon: '\uD83D\uDC26', gradient: 'linear-gradient(135deg, #ffd60a, #00e676)', scoreUnit: '', category: 'arcade', thumb: 'flappy.png' },
    { id: 'asteroids', title: 'Asteroids', description: 'Blast space rocks in the void.', icon: '\u2604\uFE0F', gradient: 'linear-gradient(135deg, #8888a0, #00d4ff)', scoreUnit: '', category: 'arcade', thumb: 'asteroids.png' },
    { id: 'spaceinvaders', title: 'Space Invaders', description: 'Defend Earth from the alien invasion.', icon: '\uD83D\uDC7E', gradient: 'linear-gradient(135deg, #00e676, #00d4ff)', scoreUnit: '', category: 'arcade', thumb: 'spaceinvaders.png' },
    { id: 'tetris', title: 'Tetris', description: 'Fit the blocks. Clear the lines.', icon: '\uD83D\uDFE6', gradient: 'linear-gradient(135deg, #7c4dff, #00d4ff)', scoreUnit: '', category: 'arcade', thumb: 'tetris.png' },
    { id: 'doodlejump', title: 'Doodle Jump', description: 'Bounce your way to the top!', icon: '\uD83E\uDE82', gradient: 'linear-gradient(135deg, #00e676, #ffd60a)', scoreUnit: '', category: 'arcade', thumb: 'doodlejump.png' },
    { id: 'runner', title: 'Endless Runner', description: 'Jump over obstacles in this infinite sprint.', icon: '\uD83C\uDFC3', gradient: 'linear-gradient(135deg, #ff2d7b, #ff6d00)', scoreUnit: '', category: 'arcade', thumb: 'runner.png' },
    { id: 'helicopter', title: 'Helicopter', description: 'Hold to fly through the cave. Don\'t crash!', icon: '\uD83D\uDE81', gradient: 'linear-gradient(135deg, #00d4ff, #00e676)', scoreUnit: '', category: 'arcade', thumb: 'helicopter.png' },
    { id: 'pinball', title: 'Pinball', description: 'Flip the ball and rack up points!', icon: '\uD83E\uDE99', gradient: 'linear-gradient(135deg, #ffd60a, #ff2d7b)', scoreUnit: '', category: 'arcade', thumb: 'pinball.png' },
    { id: 'platformer', title: 'Platformer', description: 'Jump, collect coins, reach the flag!', icon: '\uD83C\uDFAE', gradient: 'linear-gradient(135deg, #00d4ff, #ffd60a)', scoreUnit: '', category: 'arcade', thumb: 'platformer.png' },

    // Puzzle & Logic
    { id: 'puzzle', title: 'Daily Puzzle', description: 'A new number puzzle every day. Can you crack it?', icon: '\uD83E\uDDE9', gradient: 'linear-gradient(135deg, #7c4dff, #00b0ff)', scoreUnit: '', category: 'puzzle', thumb: 'puzzle.png' },
    { id: 'game2048', title: '2048', description: 'Slide tiles and merge to reach 2048.', icon: '\uD83D\uDD22', gradient: 'linear-gradient(135deg, #f4a261, #e76f51)', scoreUnit: '', category: 'puzzle', thumb: 'game2048.png' },
    { id: 'slidingpuzzle', title: 'Sliding Puzzle', description: 'Slide tiles into the correct order.', icon: '\uD83E\uDDE9', gradient: 'linear-gradient(135deg, #2a9d8f, #264653)', scoreUnit: '', category: 'puzzle', thumb: 'slidingpuzzle.png' },
    { id: 'minesweeper', title: 'Minesweeper', description: 'Uncover the grid without hitting a mine.', icon: '\uD83D\uDCA3', gradient: 'linear-gradient(135deg, #888, #ff2d7b)', scoreUnit: '', category: 'puzzle', thumb: 'minesweeper.png' },
    { id: 'lightsout', title: 'Lights Out', description: 'Toggle all the lights off to win.', icon: '\uD83D\uDCA1', gradient: 'linear-gradient(135deg, #ffd60a, #ff8c00)', scoreUnit: '', category: 'puzzle', thumb: 'lightsout.png' },
    { id: 'pipeconnect', title: 'Pipe Connect', description: 'Rotate pipes to connect source to drain.', icon: '\uD83D\uDEB0', gradient: 'linear-gradient(135deg, #00d4ff, #00e676)', scoreUnit: '', category: 'puzzle', thumb: 'pipeconnect.png' },
    { id: 'towerofhanoi', title: 'Tower of Hanoi', description: 'Move all discs to the last peg.', icon: '\uD83D\uDDFC', gradient: 'linear-gradient(135deg, #b44dff, #ff2d7b)', scoreUnit: '', category: 'puzzle', thumb: 'towerofhanoi.png' },
    { id: 'sudoku', title: 'Sudoku', description: 'Fill the 4x4 grid with logic.', icon: '\uD83E\uDDEE', gradient: 'linear-gradient(135deg, #7c4dff, #00e676)', scoreUnit: '', category: 'puzzle', thumb: 'sudoku.png' },
    { id: 'wordsearch', title: 'Word Search', description: 'Find all hidden words in the grid.', icon: '\uD83D\uDD0D', gradient: 'linear-gradient(135deg, #00e676, #00d4ff)', scoreUnit: '', category: 'puzzle', thumb: 'wordsearch.png' },
    { id: 'maze', title: 'Maze Runner', description: 'Navigate through the procedural maze.', icon: '\uD83C\uDF10', gradient: 'linear-gradient(135deg, #00d4ff, #b44dff)', scoreUnit: '', category: 'puzzle', thumb: 'maze.png' },

    // Reflex & Speed
    { id: 'reaction', title: 'Reaction Test', description: 'Test your reflexes — 1P or 2P showdown!', icon: '\u26A1', gradient: 'linear-gradient(135deg, #00e676, #00b0ff)', scoreUnit: 'ms', category: 'reflex', multiplayer: true, thumb: 'reaction.png' },
    { id: 'colormatch', title: 'Color Match', description: 'Does the word match its color? Think fast!', icon: '\uD83C\uDFA8', gradient: 'linear-gradient(135deg, #ff2d7b, #b44dff)', scoreUnit: '', category: 'reflex', thumb: 'colormatch.png' },
    { id: 'whackamole', title: 'Whack-a-Mole', description: 'Smash the moles before they hide!', icon: '\uD83D\uDD28', gradient: 'linear-gradient(135deg, #8B4513, #ff6d00)', scoreUnit: '', category: 'reflex', thumb: 'whackamole.png' },
    { id: 'aimtrainer', title: 'Aim Trainer', description: 'Click the targets before they vanish.', icon: '\uD83C\uDFAF', gradient: 'linear-gradient(135deg, #ff2d7b, #ff0000)', scoreUnit: '', category: 'reflex', thumb: 'aimtrainer.png' },
    { id: 'typing', title: 'Speed Typing', description: 'Type falling words before they hit the ground.', icon: '\u2328\uFE0F', gradient: 'linear-gradient(135deg, #00d4ff, #7c4dff)', scoreUnit: '', category: 'reflex', thumb: 'typing.png' },
    { id: 'quickmath', title: 'Quick Math', description: 'Solve math problems — 1P or 2P race!', icon: '\uD83E\uDDEE', gradient: 'linear-gradient(135deg, #00e676, #ffd60a)', scoreUnit: '', category: 'reflex', multiplayer: true, thumb: 'quickmath.png' },
    { id: 'tapcounter', title: 'Tap Counter', description: 'How many taps in 10 seconds? 1P or 2P!', icon: '\uD83D\uDC46', gradient: 'linear-gradient(135deg, #00d4ff, #00e676)', scoreUnit: '', category: 'reflex', multiplayer: true, thumb: 'tapcounter.png' },
    { id: 'rhythmtap', title: 'Rhythm Tap', description: 'Hit the notes to the beat.', icon: '\uD83C\uDFB5', gradient: 'linear-gradient(135deg, #b44dff, #ff2d7b)', scoreUnit: '', category: 'reflex', thumb: 'rhythmtap.png' },

    // Skill & Timing
    { id: 'stack', title: 'Stack Game', description: 'Stack blocks with precision. How high can you go?', icon: '\uD83E\uDDF1', gradient: 'linear-gradient(135deg, #ffd60a, #ff6d00)', scoreUnit: '', category: 'skill', thumb: 'stack.png' },
    { id: 'catchball', title: 'Catch the Ball', description: 'Catch gold balls, dodge the bombs!', icon: '\uD83E\uDD4E', gradient: 'linear-gradient(135deg, #ffd60a, #ff8c00)', scoreUnit: '', category: 'skill', thumb: 'catchball.png' },
    { id: 'ballbounce', title: 'Ball Bounce', description: 'Keep the ball bouncing on the paddle.', icon: '\u26BD', gradient: 'linear-gradient(135deg, #00d4ff, #7c4dff)', scoreUnit: '', category: 'skill', thumb: 'ballbounce.png' },
    { id: 'knifethrow', title: 'Knife Throw', description: 'Throw knives at the spinning log.', icon: '\uD83D\uDD2A', gradient: 'linear-gradient(135deg, #888, #ffd60a)', scoreUnit: '', category: 'skill', thumb: 'knifethrow.png' },
    { id: 'archery', title: 'Archery', description: 'Aim, charge, and hit the bullseye!', icon: '\uD83C\uDFF9', gradient: 'linear-gradient(135deg, #00e676, #ffd60a)', scoreUnit: '', category: 'skill', thumb: 'archery.png' },
    { id: 'darts', title: 'Darts', description: 'Throw darts at the swaying board.', icon: '\uD83C\uDFAF', gradient: 'linear-gradient(135deg, #ff2d7b, #00e676)', scoreUnit: '', category: 'skill', thumb: 'darts.png' },
    { id: 'golfputt', title: 'Golf Putt', description: 'Aim and putt into the hole!', icon: '\u26F3', gradient: 'linear-gradient(135deg, #00e676, #264653)', scoreUnit: '', category: 'skill', thumb: 'golfputt.png' },
    { id: 'fruitslicer', title: 'Fruit Slicer', description: 'Slice the fruits, avoid the bombs!', icon: '\uD83C\uDF49', gradient: 'linear-gradient(135deg, #ff2d7b, #00e676)', scoreUnit: '', category: 'skill', thumb: 'fruitslicer.png' },
    { id: 'dodger', title: 'Dodger', description: 'Dodge falling objects as long as you can.', icon: '\uD83D\uDCA8', gradient: 'linear-gradient(135deg, #ff2d7b, #888)', scoreUnit: '', category: 'skill', thumb: 'dodger.png' },

    // Strategy
    { id: 'tictactoe', title: 'Tic-Tac-Toe', description: 'Classic X vs O — AI or 2P!', icon: '\u274C', gradient: 'linear-gradient(135deg, #00d4ff, #ff2d7b)', scoreUnit: '', category: 'strategy', multiplayer: true, thumb: 'tictactoe.png' },
    { id: 'connectfour', title: 'Connect Four', description: 'Drop discs to connect four — AI or 2P!', icon: '\uD83D\uDD34', gradient: 'linear-gradient(135deg, #ff2d7b, #ffd60a)', scoreUnit: '', category: 'strategy', multiplayer: true, thumb: 'connectfour.png' },
    { id: 'tanks', title: 'Tanks', description: 'Blast enemy tanks — solo or 2P battle!', icon: '\uD83D\uDE82', gradient: 'linear-gradient(135deg, #00e676, #888)', scoreUnit: '', category: 'strategy', multiplayer: true, thumb: 'tanks.png' },
    { id: 'rps', title: 'Rock Paper Scissors', description: 'Best of 5 against the AI.', icon: '\u270A', gradient: 'linear-gradient(135deg, #888, #00d4ff)', scoreUnit: '', category: 'strategy', thumb: 'rps.png' },

    // Casual
    { id: 'simon', title: 'Simon Says', description: 'Remember and repeat the color sequence.', icon: '\uD83D\uDFE2', gradient: 'linear-gradient(135deg, #00e676, #ffd60a)', scoreUnit: '', category: 'casual', thumb: 'simon.png' },
    { id: 'patternmemory', title: 'Pattern Memory', description: 'Memorize the grid pattern and tap it back.', icon: '\uD83E\uDDE0', gradient: 'linear-gradient(135deg, #00d4ff, #b44dff)', scoreUnit: '', category: 'casual', thumb: 'patternmemory.png' },
    { id: 'memorycards', title: 'Memory Cards', description: 'Flip and match all the card pairs.', icon: '\uD83C\uDCCF', gradient: 'linear-gradient(135deg, #7c4dff, #ff2d7b)', scoreUnit: '', category: 'casual', thumb: 'memorycards.png' },
    { id: 'colorfill', title: 'Color Fill', description: 'Flood the board with one color.', icon: '\uD83C\uDF08', gradient: 'linear-gradient(135deg, #ff2d7b, #ffd60a)', scoreUnit: '', category: 'casual', thumb: 'colorfill.png' },
    { id: 'numbersort', title: 'Number Sort', description: 'Swap numbers into ascending order.', icon: '\uD83D\uDD22', gradient: 'linear-gradient(135deg, #00d4ff, #ffd60a)', scoreUnit: '', category: 'casual', thumb: 'numbersort.png' },
    { id: 'bubblepop', title: 'Bubble Pop', description: 'Pop rising bubbles before they escape!', icon: '\uD83E\uDEE7', gradient: 'linear-gradient(135deg, #00d4ff, #b44dff)', scoreUnit: '', category: 'casual', thumb: 'bubblepop.png' },
    { id: 'matching', title: 'Pattern Match', description: 'Recreate the color pattern from memory.', icon: '\uD83D\uDDBC\uFE0F', gradient: 'linear-gradient(135deg, #b44dff, #ffd60a)', scoreUnit: '', category: 'casual', thumb: 'matching.png' }
];

let activeCategory = 'all';

function renderCategoryNav() {
    const nav = document.getElementById('categoryNav');
    nav.innerHTML = CATEGORIES.map(cat => `
        <button class="cat-btn ${cat.key === activeCategory ? 'active' : ''}" data-cat="${cat.key}">
            ${cat.label}
            <span class="cat-count">${cat.key === 'all' ? GAMES.length : cat.key === 'multiplayer' ? GAMES.filter(g => g.multiplayer).length : GAMES.filter(g => g.category === cat.key).length}</span>
        </button>
    `).join('');

    nav.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeCategory = btn.dataset.cat;
            renderCategoryNav();
            renderCards();
        });
    });
}

function renderCards() {
    const grid = document.getElementById('gameGrid');
    const scores = Storage.getAllScores();

    let filtered;
    if (activeCategory === 'all') {
        filtered = GAMES;
    } else if (activeCategory === 'multiplayer') {
        filtered = GAMES.filter(g => g.multiplayer);
    } else {
        filtered = GAMES.filter(g => g.category === activeCategory);
    }

    grid.innerHTML = filtered.map((game, i) => {
        const score = scores[game.id];
        const scoreDisplay = score
            ? `<span class="high-score-badge">Best: ${score}${game.scoreUnit}</span>`
            : '';

        const mpBadge = game.multiplayer
            ? '<span class="mp-badge">1P / 2P</span>'
            : '';

        const modeButtons = game.multiplayer
            ? `<div class="mode-buttons">
                   <a href="game?id=${game.id}&mode=1p" class="btn btn-play">1 Player</a>
                   <a href="game?id=${game.id}&mode=2p" class="btn btn-play btn-2p">2 Players</a>
               </div>`
            : `<a href="game?id=${game.id}" class="btn btn-play">Play</a>`;

        const thumb = game.thumb
            ? `<img class="card-thumb-img" src="assets/thumbnails/${game.thumb}" alt="${game.title}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
               <span class="card-thumb-fallback" style="display:none;background:${game.gradient}">${game.icon}</span>`
            : `<span>${game.icon}</span>`;

        return `
        <div class="game-card" style="animation-delay: ${Math.min(i * 0.05, 1)}s">
            <div class="card-thumbnail" style="background: ${game.thumb ? '#000' : game.gradient}">
                ${thumb}
                ${mpBadge}
            </div>
            <div class="card-body">
                <h3 class="card-title">${game.title}</h3>
                <p class="card-desc">${game.description}</p>
                <div class="card-footer">
                    ${scoreDisplay}
                    ${modeButtons}
                </div>
            </div>
        </div>`;
    }).join('');
}

renderCategoryNav();
renderCards();
