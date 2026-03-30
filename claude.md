# CLAUDE.md — Mini Games Hub

## Project Overview

A modern, web-based **Mini Games Hub** — a single-page gaming portal featuring 5 fully playable HTML5/Canvas games. The platform must feel like a premium indie gaming site: dark themed, sleek, professional, with buttery-smooth animations and a modern gaming aesthetic. Everything is frontend-only — no backend, no frameworks, pure vanilla HTML/CSS/JavaScript.

---

## Tech Stack

- **HTML5** (semantic markup)
- **CSS3** (custom properties, animations, transitions, grid/flexbox)
- **Vanilla JavaScript** (ES6+ modules)
- **Canvas API** (for all game rendering)
- **LocalStorage** (for score persistence)
- **No frameworks** — no React, Vue, Angular, Phaser.js, or any external JS library
- **No backend** — everything runs client-side in the browser

---

## Folder Structure

```
mini-games-hub/
├── index.html              # Homepage — game grid
├── game.html               # Reusable game page — loads game by URL param
├── css/
│   └── style.css           # Global styles (dark theme, layout, components)
├── js/
│   ├── main.js             # Homepage logic (card rendering, navigation)
│   ├── gameLoader.js       # Game page controller — reads URL param, loads correct game
│   ├── storage.js          # LocalStorage helper (get/set high scores, daily puzzle state)
│   └── games/
│       ├── reaction.js     # Reaction Test game
│       ├── snake.js         # Snake game
│       ├── runner.js        # Endless Runner game
│       ├── stack.js         # Stack Game
│       ├── puzzle.js        # Daily Puzzle game
│       └── colormatch.js    # Color Match game
└── assets/
    └── (optional: sound files, thumbnail images, favicon)
```

---

## Page Structure

### 1. Homepage (`index.html`)

The landing page displaying all 5 games in a responsive card grid.

**Layout Requirements:**
- Shared header/navigation bar at the top (logo + "Home" button)
- Hero section with a title like "Mini Games Hub" and a short tagline
- A responsive grid of 5 game cards (2-3 columns on desktop, 1 column on mobile)
- Footer with credits or branding (optional)

**Game Card Requirements:**
Each card must include:
- Game title (bold, prominent)
- A visual thumbnail or icon/illustration representing the game (can be a CSS/SVG graphic if no image assets)
- A short 1-line description of the game
- A "Play" button that navigates to `game.html?id=<game-id>`
- Hover effect: subtle scale-up, glow, or shadow lift
- Display the player's high score for that game (pulled from LocalStorage), if one exists

**Game IDs (used in URL param):**
| Game            | ID         |
|-----------------|------------|
| Reaction Test   | `reaction` |
| Snake           | `snake`    |
| Endless Runner  | `runner`   |
| Stack Game      | `stack`    |
| Daily Puzzle    | `puzzle`   |
| Color Match     | `colormatch` |

### 2. Game Page (`game.html`)

A single reusable page that dynamically loads and initializes the correct game based on the `?id=` URL parameter.

**Layout Requirements:**
- Shared header with logo and a "← Back to Games" / Home button
- Game title (dynamically set based on loaded game)
- Centered `<canvas>` element for game rendering
- Score display area (current score + high score)
- Game-specific controls hint (e.g., "Press SPACE to jump", "Tap to react")
- "Game Over" overlay with: final score, high score, "Play Again" button, optional "Share Score" button
- Pause/Resume button (for applicable games)

**Game Loader Logic (`gameLoader.js`):**
- Read `id` from URL search params
- Map the ID to the correct game module
- Call that game's `init(canvas, context)` function
- Handle invalid/missing IDs gracefully (show "Game not found" message with a link back home)

---

## Game Specifications

### Game 1: Reaction Test (`reaction.js`)

**Concept:** Measure how fast the user can click/tap after a visual cue.

**Gameplay Flow:**
1. Screen shows a message: "Wait for green..."
2. Background is a neutral/red color
3. After a random delay (2–5 seconds), the screen turns GREEN
4. User clicks/taps as fast as possible
5. Display reaction time in milliseconds
6. If user clicks BEFORE the screen turns green → show "Too early! Try again."
7. After showing the result, offer "Try Again" button

**Scoring:**
- Display current reaction time in ms
- Save best (lowest) reaction time to LocalStorage
- Show personal best on screen

**Technical Details:**
- Use `performance.now()` for precise timing
- Random delay: `Math.random() * 3000 + 2000` (2–5 seconds)
- Canvas-based rendering for the color change and text
- Touch + click support

---

### Game 2: Snake (`snake.js`)

**Concept:** Classic snake game — eat food, grow longer, don't crash.

**Gameplay Flow:**
1. Snake starts at center of grid, moving right
2. One food item appears at a random grid cell
3. Arrow keys (desktop) or swipe gestures (mobile) control direction
4. Snake moves one cell per tick
5. Eating food: snake grows by 1 segment, score +10, new food spawns
6. Collision with wall or own body → Game Over

**Grid & Rendering:**
- Canvas divided into a grid (e.g., 20×20 cells)
- Cell size adapts to canvas dimensions
- Snake rendered as connected rounded rectangles (head slightly different color)
- Food rendered as a circle or apple-like shape with a subtle glow

**Controls:**
- Desktop: Arrow keys (prevent 180° reversal, e.g., can't go left if currently going right)
- Mobile: Swipe detection (touchstart → touchend, calculate direction)
- Optional: on-screen D-pad for mobile

**Speed:**
- Starting speed: ~150ms per tick
- Optional: speed increases slightly every 5 food items

**Scoring:**
- +10 per food eaten
- High score saved to LocalStorage

**Game Loop:**
- Use `setTimeout` or `setInterval` controlled by `requestAnimationFrame` for smooth rendering
- Separate game logic tick from render frame

---

### Game 3: Endless Runner (`runner.js`)

**Concept:** A side-scrolling runner where the character auto-runs and the player jumps over obstacles.

**Gameplay Flow:**
1. Character is on the left side of the screen, running automatically
2. Ground scrolls left, obstacles spawn from the right edge
3. Player presses SPACE / taps screen to jump
4. Obstacles are rectangular blocks of varying heights/widths
5. If character collides with an obstacle → Game Over
6. Score increases over time (based on distance)

**Physics:**
- Gravity: constant downward acceleration
- Jump: apply upward velocity (only when grounded)
- No double-jump (unless as an enhancement)
- Character should feel responsive — jump arc should be satisfying, not floaty

**Obstacle System:**
- Obstacles spawn at intervals (random within a range)
- Move left at the current game speed
- Remove obstacles that go off-screen (left edge)
- Minimum gap between obstacles so the game remains fair

**Difficulty Scaling:**
- Game speed starts moderate and increases gradually over time
- Obstacle spawn rate may increase slightly
- Cap maximum speed so the game remains playable

**Rendering:**
- Simple geometric shapes (rectangles) for character and obstacles
- Scrolling ground line with texture/pattern
- Parallax background (optional: clouds or mountains scrolling at different speeds)
- Character has a simple running animation (toggle between 2-3 frames)

**Controls:**
- Desktop: SPACE key or UP arrow
- Mobile: Tap anywhere on the canvas
- Prevent default scroll on spacebar

**Scoring:**
- Score = distance traveled (increments each frame based on speed)
- Display as integer, updating in real-time
- High score saved to LocalStorage

---

### Game 4: Stack Game (`stack.js`)

**Concept:** Stack moving blocks as precisely as possible. Misaligned portions get trimmed.

**Gameplay Flow:**
1. A base block sits at the bottom center
2. A new block slides back and forth horizontally (or alternates horizontal/vertical)
3. Player clicks/taps to drop the block
4. If the block overlaps the one below, the overhanging portion is trimmed off — only the overlapping part stays
5. The remaining block becomes the new top of the stack
6. Camera/view pans upward as the stack grows
7. If the placed block has zero overlap → Game Over

**Block Mechanics:**
- Each block has: x, y, width, height, direction, speed
- Moving block oscillates between left and right bounds
- On placement: calculate overlap with the block below
  - `overlapStart = max(currentBlock.x, previousBlock.x)`
  - `overlapEnd = min(currentBlock.x + currentBlock.width, previousBlock.x + previousBlock.width)`
  - `overlapWidth = overlapEnd - overlapStart`
  - If `overlapWidth <= 0` → Game Over
  - Otherwise, trim block to the overlap region
- Trimmed/fallen piece should animate falling off (nice visual feedback)

**Rendering:**
- Isometric or flat 2D side view (flat is simpler, isometric is a bonus)
- Blocks are colored with a gradient or shift hue as the stack grows (rainbow progression)
- Smooth animation for the sliding block
- Camera scrolls up so the top of the stack is always visible
- Falling trimmed pieces animate downward with slight rotation (optional)

**Difficulty Scaling:**
- Block speed increases every 5-10 levels
- Block width does NOT shrink artificially — it only shrinks from player misalignment

**Controls:**
- Desktop: Click anywhere or press SPACE
- Mobile: Tap anywhere

**Scoring:**
- +1 per block placed
- Bonus: "Perfect" placement (overlap >= 95% of block width) → block doesn't shrink + visual/audio feedback
- High score saved to LocalStorage

---

### Game 5: Daily Puzzle (`puzzle.js`)

**Concept:** A simple number/logic puzzle that changes every day. Same puzzle for all players on the same date.

**Puzzle Type — Number Guessing / Math Puzzle:**
- Generate a target number based on the date seed
- Player is given a set of numbers and operations
- Goal: combine the given numbers using +, −, ×, ÷ to reach the target
- OR: simpler variant — guess a hidden number with "higher/lower" hints (like Wordle for numbers)

**Recommended Implementation — "Number Target":**
1. Use the current date as a seed: `seed = YYYYMMDD` as integer
2. Seeded RNG generates a target number (e.g., 1–100)
3. Player gets 6 attempts to guess the number
4. After each guess, show: "Too high", "Too low", or "Correct!"
5. Display remaining attempts
6. After winning or losing, show result and disable further guesses until tomorrow

**Alternative — "Daily Math":**
1. Date-seeded RNG generates 4 random numbers (1–9) and a target (10–50)
2. Player must use all 4 numbers with +, −, ×, ÷ to reach the target
3. Input via button taps (number buttons + operator buttons)
4. Submit to check answer
5. One attempt per day (or allow multiple attempts to solve)

**Pick ONE approach and implement it fully. The Number Target (guess the number) variant is the simpler, more reliable choice.**

**Date-Based Seed:**
```javascript
function getDailySeed() {
    const now = new Date();
    return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

function seededRandom(seed) {
    // Simple LCG or mulberry32
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
```

**State Persistence:**
- Save today's puzzle state to LocalStorage: `{ date: "2025-06-15", guesses: [...], solved: true/false }`
- On load, check if stored date matches today
  - If yes → restore state (don't let them re-play)
  - If no → generate new puzzle, clear old state

**UI:**
- Display target or prompt
- Input area for guesses
- History of guesses with feedback
- "Solved!" or "Better luck tomorrow!" message
- Countdown to next puzzle (optional)

---

### Game 6: Color Match (`colormatch.js`)

**Concept:** A Stroop-effect speed game — color words appear rendered in random colors. The player must quickly decide if the word matches the displayed color.

**Gameplay Flow:**
1. A color word (e.g., "RED") is displayed in a random color (e.g., blue text)
2. Player has a short time window (~2 seconds) to tap "Match" or "No Match"
3. If the word matches its display color (e.g., "RED" in red) → correct answer is "Match"
4. If they don't match → correct answer is "No Match"
5. Correct answer: +1 point, streak continues
6. Wrong answer or timeout: lose a life (3 lives total)
7. Game ends when all lives are lost

**Colors Used:**
- Red, Blue, Green, Yellow, Purple, Orange (6 colors — enough variety for confusion)

**Difficulty Scaling:**
- Time window starts at 2.5 seconds and decreases by 0.05s every 5 correct answers (minimum 1s)
- Match probability is ~40% so players can't just spam one button

**Rendering:**
- Large color word centered on canvas
- Countdown timer bar at top that shrinks
- Two large buttons: "MATCH" (green) and "NOPE" (red)
- Streak counter and lives display
- Correct/wrong flash feedback on the background

**Controls:**
- Desktop: Left arrow or A for "Match", Right arrow or D for "Nope" — or click buttons
- Mobile: Tap the on-screen buttons

**Scoring:**
- +1 per correct answer
- Streak bonus: consecutive correct answers shown as combo
- High score saved to LocalStorage

---

## Core Technical Requirements

### Game Loop Pattern
All games (except Reaction Test and Daily Puzzle) must use `requestAnimationFrame`:
```javascript
function gameLoop(timestamp) {
    if (!paused && !gameOver) {
        update(timestamp);
        render();
    }
    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }
}
```

### Modular Structure
Each game file must export (or expose) an object/interface:
```javascript
// Each game module pattern:
const GameName = {
    init(canvas, ctx) { /* setup */ },
    start() { /* begin game loop */ },
    pause() { /* pause loop */ },
    resume() { /* resume loop */ },
    reset() { /* reset state for replay */ },
    destroy() { /* cleanup event listeners, cancel animation frame */ }
};
```

### LocalStorage Helper (`storage.js`)
```javascript
const Storage = {
    getHighScore(gameId) { /* returns number or 0 */ },
    setHighScore(gameId, score) { /* saves if score > current best */ },
    getDailyPuzzleState() { /* returns saved state or null */ },
    setDailyPuzzleState(state) { /* saves state object */ },
    getAllScores() { /* returns { reaction: 230, snake: 150, ... } */ }
};
```

### Canvas Sizing
- Default canvas size: 400×600 or similar portrait ratio
- On mobile, canvas should scale to fit viewport width (max 100vw, maintain aspect ratio)
- Use `devicePixelRatio` for sharp rendering on high-DPI screens:
```javascript
const dpr = window.devicePixelRatio || 1;
canvas.width = displayWidth * dpr;
canvas.height = displayHeight * dpr;
ctx.scale(dpr, dpr);
canvas.style.width = displayWidth + 'px';
canvas.style.height = displayHeight + 'px';
```

### Game Over Flow
Every game must implement:
1. Freeze the game loop
2. Display a "Game Over" overlay on the canvas or as a DOM overlay
3. Show: final score, high score (updated if beaten), "Play Again" button
4. "Play Again" calls `reset()` + `start()`
5. Optional: "Share Score" button (copies text to clipboard: "I scored X on [Game Name]! 🎮")

### Pause/Resume
- Applicable to: Snake, Endless Runner, Stack Game
- Toggle with `P` key or a pause button in the UI
- Pause overlay on canvas: "PAUSED — Press P to resume"
- Reaction Test & Daily Puzzle don't need pause

---

## UI/UX Design Specifications

### Theme: Dark Gaming Aesthetic
Professional, sleek, modern — like a premium indie gaming portal.

**Color Palette:**
```css
:root {
    --bg-primary: #0a0a0f;        /* near-black background */
    --bg-secondary: #12121a;      /* card/surface background */
    --bg-tertiary: #1a1a2e;       /* elevated surfaces */
    --text-primary: #e8e8f0;      /* main text — off-white */
    --text-secondary: #8888a0;    /* muted text */
    --accent-cyan: #00d4ff;       /* primary accent */
    --accent-magenta: #ff2d7b;    /* secondary accent */
    --accent-yellow: #ffd60a;     /* highlight/gold accent */
    --accent-green: #00e676;      /* success states */
    --border-subtle: rgba(255,255,255,0.06);
    --glow-cyan: 0 0 20px rgba(0,212,255,0.3);
    --glow-magenta: 0 0 20px rgba(255,45,123,0.3);
}
```

**Typography:**
- Use a modern, clean sans-serif (Google Fonts): `Outfit` for headings, `JetBrains Mono` for scores/numbers
- Or alternatively: `Space Grotesk`, `Sora`, `Plus Jakarta Sans`
- Headings: bold/extrabold, slightly larger
- Body text: regular weight, good line-height (1.5+)
- Scores/numbers: monospace for alignment

**Visual Effects:**
- Subtle noise/grain overlay on the background (CSS pseudo-element with SVG noise filter)
- Soft glow orbs in the background (CSS radial-gradient blobs, animated slowly)
- Cards have a glass-morphism or frosted glass effect (`backdrop-filter: blur`)
- Hover states: slight scale, border glow, shadow lift
- Transitions: `0.3s ease` for all interactive elements
- Smooth page-like transitions (fade-in on load)

### Header/Navigation
- Fixed or sticky at the top
- Contains: logo (text or SVG), "Home" link/button
- On game page: "← Back" button instead of generic nav
- Minimal height (~60px)
- Subtle bottom border or shadow

### Game Cards (Homepage)
- Rounded corners (`border-radius: 16px`)
- Background: `var(--bg-secondary)` with subtle border
- Padding: generous (24px+)
- Thumbnail area: a colored/gradient section at top of card with a game icon or SVG illustration
- Title: bold, white
- Description: muted text, 1 line
- High score badge (if exists): small pill/badge showing "Best: 230ms"
- Play button: accent-colored, rounded, with hover glow
- Grid: CSS Grid, `gap: 24px`, responsive columns (`repeat(auto-fill, minmax(280px, 1fr))`)

### Game Page Layout
- Canvas centered horizontally
- Score bar above or below canvas (current score | high score)
- Controls hint below canvas (subtle, muted text)
- Game Over overlay: semi-transparent dark backdrop, centered card with results
- All text outside canvas uses DOM elements (not drawn on canvas)

### Responsive Design
- Breakpoints:
  - Desktop: 3 columns grid, canvas ~400px wide
  - Tablet (≤768px): 2 columns grid, canvas scales to ~90vw
  - Mobile (≤480px): 1 column grid, canvas full-width, touch controls
- Touch targets: minimum 44×44px for all interactive elements
- No horizontal scrolling at any viewport

### Animations
- Page load: cards fade in with staggered delay (`animation-delay: calc(var(--i) * 0.1s)`)
- Card hover: `transform: translateY(-4px); box-shadow: var(--glow-cyan);`
- Button press: slight scale-down (`transform: scale(0.97)`)
- Game Over screen: fade-in with slight scale-up
- Score counter: number tick-up animation (optional)
- Canvas games: smooth 60fps rendering via `requestAnimationFrame`

---

## Mobile / Touch Support

Every game must be playable on mobile:

| Game           | Mobile Control                              |
|----------------|---------------------------------------------|
| Reaction Test  | Tap anywhere on canvas                      |
| Snake          | Swipe gestures (or on-screen D-pad buttons) |
| Endless Runner | Tap anywhere to jump                        |
| Stack Game     | Tap anywhere to drop block                  |
| Daily Puzzle   | Tap on-screen buttons / input field         |
| Color Match    | Tap Match / Nope buttons on canvas          |

**Swipe Detection (for Snake):**
```javascript
let touchStartX, touchStartY;
canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});
canvas.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        direction = dx > 0 ? 'right' : 'left';
    } else {
        // Vertical swipe
        direction = dy > 0 ? 'down' : 'up';
    }
});
```

Prevent default touch behaviors on canvas to avoid scroll/zoom during gameplay:
```javascript
canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
```

---

## Optional Enhancements (Nice to Have)

1. **Sound Effects** — Use the Web Audio API or `<audio>` elements for:
   - Jump sound, collision sound, food pickup, block placement, "perfect" chime
   - Keep sounds short and lightweight
   - Add a mute/unmute toggle in the header

2. **Share Score** — "Share" button on Game Over screen:
   ```javascript
   function shareScore(gameName, score) {
       const text = `🎮 I scored ${score} on ${gameName} in Mini Games Hub! Can you beat me?`;
       if (navigator.share) {
           navigator.share({ text });
       } else {
           navigator.clipboard.writeText(text);
           // Show "Copied!" tooltip
       }
   }
   ```

3. **Local Leaderboard** — Store top 5 scores per game in LocalStorage, display in a modal or sidebar.

4. **Particle Effects** — On events like food pickup, perfect stack, game over — burst of small particles.

5. **Screen Shake** — Subtle CSS transform shake on collision/game over.

6. **Combo System** — In Stack Game, consecutive "perfect" placements could trigger a combo multiplier.

---

## Quality Checklist

Before considering the project complete, verify:

- [ ] All 5 games load correctly via `game.html?id=<gameId>`
- [ ] Each game is fully playable from start to game-over to replay
- [ ] High scores persist across page reloads (LocalStorage)
- [ ] Daily Puzzle generates the same puzzle for the same date and resets the next day
- [ ] No console errors during gameplay
- [ ] Games run at smooth 60fps (check with DevTools Performance tab)
- [ ] Homepage is responsive at 320px, 768px, and 1440px widths
- [ ] All games are playable with touch on mobile
- [ ] Game Over screen shows correctly with score, high score, and replay option
- [ ] Pause/Resume works for Snake, Runner, and Stack
- [ ] Invalid game ID in URL shows a user-friendly error
- [ ] No external API calls or backend dependencies — fully offline-capable
- [ ] Code is clean, commented, and organized per the folder structure
- [ ] Dark theme is consistent across all pages and game overlays

---

## Development Notes

- Start by building the homepage and game page shell (HTML + CSS) with the dark theme
- Implement `gameLoader.js` and `storage.js` as shared utilities first
- Build games one at a time, testing each fully before moving on
- Order of implementation (recommended, simple → complex):
  1. Reaction Test (simplest, no game loop)
  2. Daily Puzzle (no real-time loop, good for testing storage)
  3. Snake (classic grid-based loop)
  4. Endless Runner (continuous physics-based loop)
  5. Stack Game (most complex visuals/mechanics)
- Test on both Chrome desktop and Chrome mobile (or use DevTools responsive mode)
- Keep the canvas rendering simple — use solid colors, rectangles, circles. No need for sprite sheets or complex art. The visual quality comes from the UI surrounding the canvas, smooth animations, and polish details like glow effects and color choices.