const DistanceGuess = {
    canvas: null,
    ctx: null,
    ui: null,

    // Game state
    cities: [],
    currentPair: null,
    actualDistance: 0,
    guess: 5000,
    round: 0,
    totalRounds: 10,
    totalScore: 0,
    roundScore: 0,
    phase: 'guessing', // guessing, result, gameover
    usedPairs: [],
    roundResults: [],

    // Slider state
    sliderX: 0,
    sliderWidth: 0,
    sliderY: 0,
    sliderKnobRadius: 14,
    dragging: false,
    sliderMin: 0,
    sliderMax: 20000,

    // Button rects for hit testing
    submitBtn: { x: 0, y: 0, w: 0, h: 0 },
    nextBtn: { x: 0, y: 0, w: 0, h: 0 },
    plusBtn: { x: 0, y: 0, w: 0, h: 0 },
    minusBtn: { x: 0, y: 0, w: 0, h: 0 },

    // Animation
    animFrame: null,
    showActualAnim: 0,
    animStartTime: 0,

    // Input state
    typingMode: false,
    typedValue: '',

    // Bound handlers
    _boundMouseDown: null,
    _boundMouseMove: null,
    _boundMouseUp: null,
    _boundTouchStart: null,
    _boundTouchMove: null,
    _boundTouchEnd: null,
    _boundKeyDown: null,
    _boundClick: null,

    // City data: [name, lat, lng]
    CITIES_DATA: [
        ['Tokyo', 35.6762, 139.6503],
        ['New York', 40.7128, -74.0060],
        ['London', 51.5074, -0.1278],
        ['Paris', 48.8566, 2.3522],
        ['Sydney', -33.8688, 151.2093],
        ['Dubai', 25.2048, 55.2708],
        ['Moscow', 55.7558, 37.6173],
        ['Beijing', 39.9042, 116.4074],
        ['Mumbai', 19.0760, 72.8777],
        ['Cairo', 30.0444, 31.2357],
        ['Rio de Janeiro', -22.9068, -43.1729],
        ['Los Angeles', 34.0522, -118.2437],
        ['Toronto', 43.6532, -79.3832],
        ['Berlin', 52.5200, 13.4050],
        ['Rome', 41.9028, 12.4964],
        ['Bangkok', 13.7563, 100.5018],
        ['Singapore', 1.3521, 103.8198],
        ['Istanbul', 41.0082, 28.9784],
        ['Nairobi', -1.2921, 36.8219],
        ['Buenos Aires', -34.6037, -58.3816],
        ['Seoul', 37.5665, 126.9780],
        ['Mexico City', 19.4326, -99.1332],
        ['Jakarta', -6.2088, 106.8456],
        ['Lagos', 6.5244, 3.3792],
        ['Cape Town', -33.9249, 18.4241],
        ['Doha', 25.2854, 51.5310],
        ['Lima', -12.0464, -77.0428],
        ['Madrid', 40.4168, -3.7038],
        ['Stockholm', 59.3293, 18.0686],
        ['Helsinki', 60.1699, 24.9384],
        ['Lisbon', 38.7223, -9.1393],
        ['Athens', 37.9838, 23.7275],
        ['Vienna', 48.2082, 16.3738],
        ['Warsaw', 52.2297, 21.0122],
        ['Prague', 50.0755, 14.4378],
        ['Amsterdam', 52.3676, 4.9041],
        ['Zurich', 47.3769, 8.5417],
        ['Manila', 14.5995, 120.9842],
        ['Kuala Lumpur', 3.1390, 101.6869],
        ['Santiago', -33.4489, -70.6693]
    ],

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;

        // Build city objects
        this.cities = this.CITIES_DATA.map(([name, lat, lng]) => ({ name, lat, lng }));

        // Bind event handlers
        this._boundMouseDown = this._onMouseDown.bind(this);
        this._boundMouseMove = this._onMouseMove.bind(this);
        this._boundMouseUp = this._onMouseUp.bind(this);
        this._boundTouchStart = this._onTouchStart.bind(this);
        this._boundTouchMove = this._onTouchMove.bind(this);
        this._boundTouchEnd = this._onTouchEnd.bind(this);
        this._boundKeyDown = this._onKeyDown.bind(this);
        this._boundClick = this._onClick.bind(this);

        canvas.addEventListener('mousedown', this._boundMouseDown);
        canvas.addEventListener('mousemove', this._boundMouseMove);
        canvas.addEventListener('mouseup', this._boundMouseUp);
        canvas.addEventListener('touchstart', this._boundTouchStart, { passive: false });
        canvas.addEventListener('touchmove', this._boundTouchMove, { passive: false });
        canvas.addEventListener('touchend', this._boundTouchEnd, { passive: false });
        canvas.addEventListener('click', this._boundClick);
        window.addEventListener('keydown', this._boundKeyDown);
    },

    start() {
        this.round = 0;
        this.totalScore = 0;
        this.usedPairs = [];
        this.roundResults = [];
        this.typingMode = false;
        this.typedValue = '';
        this.ui.setScore(0);
        this.ui.hideGameOver();
        this._nextRound();
    },

    pause() {
        if (this.animFrame) {
            cancelAnimationFrame(this.animFrame);
            this.animFrame = null;
        }
    },

    resume() {
        if (this.phase === 'result') {
            this._animateResult();
        } else {
            this.render();
        }
    },

    reset() {
        if (this.animFrame) {
            cancelAnimationFrame(this.animFrame);
            this.animFrame = null;
        }
        this.round = 0;
        this.totalScore = 0;
        this.usedPairs = [];
        this.roundResults = [];
        this.phase = 'guessing';
        this.dragging = false;
        this.typingMode = false;
        this.typedValue = '';
    },

    destroy() {
        if (this.animFrame) {
            cancelAnimationFrame(this.animFrame);
            this.animFrame = null;
        }
        this.canvas.removeEventListener('mousedown', this._boundMouseDown);
        this.canvas.removeEventListener('mousemove', this._boundMouseMove);
        this.canvas.removeEventListener('mouseup', this._boundMouseUp);
        this.canvas.removeEventListener('touchstart', this._boundTouchStart);
        this.canvas.removeEventListener('touchmove', this._boundTouchMove);
        this.canvas.removeEventListener('touchend', this._boundTouchEnd);
        this.canvas.removeEventListener('click', this._boundClick);
        window.removeEventListener('keydown', this._boundKeyDown);
    },

    // ==================== Haversine ====================

    _haversine(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth radius in km
        const toRad = (deg) => deg * Math.PI / 180;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                  Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c);
    },

    // ==================== Round Logic ====================

    _nextRound() {
        this.round++;
        if (this.round > this.totalRounds) {
            this._endGame();
            return;
        }

        // Pick two unique cities not used as a pair before
        let c1, c2, pairKey;
        let attempts = 0;
        do {
            c1 = Math.floor(Math.random() * this.cities.length);
            c2 = Math.floor(Math.random() * this.cities.length);
            pairKey = Math.min(c1, c2) + '-' + Math.max(c1, c2);
            attempts++;
        } while ((c1 === c2 || this.usedPairs.includes(pairKey)) && attempts < 200);

        this.usedPairs.push(pairKey);
        this.currentPair = [this.cities[c1], this.cities[c2]];
        this.actualDistance = this._haversine(
            this.cities[c1].lat, this.cities[c1].lng,
            this.cities[c2].lat, this.cities[c2].lng
        );

        // Reset guess to midpoint
        this.guess = 5000;
        this.phase = 'guessing';
        this.typingMode = false;
        this.typedValue = '';
        this.render();
    },

    _submitGuess() {
        if (this.phase !== 'guessing') return;

        const diff = Math.abs(this.guess - this.actualDistance);
        const pctError = diff / this.actualDistance;

        // Score: 1000 for perfect (within 5%), scales down, minimum 0
        let score;
        if (pctError <= 0.05) {
            score = 1000;
        } else if (pctError <= 0.10) {
            score = 900;
        } else if (pctError <= 0.20) {
            score = Math.round(900 - (pctError - 0.10) * 4000);
        } else if (pctError <= 0.50) {
            score = Math.round(500 - (pctError - 0.20) * 1000);
        } else if (pctError <= 1.0) {
            score = Math.round(200 - (pctError - 0.50) * 400);
        } else {
            score = 0;
        }
        score = Math.max(0, score);

        this.roundScore = score;
        this.totalScore += score;
        this.ui.setScore(this.totalScore);

        this.roundResults.push({
            cities: [this.currentPair[0].name, this.currentPair[1].name],
            actual: this.actualDistance,
            guess: this.guess,
            score: score
        });

        this.phase = 'result';
        this.showActualAnim = 0;
        this.animStartTime = performance.now();
        this._animateResult();
    },

    _animateResult() {
        const elapsed = performance.now() - this.animStartTime;
        this.showActualAnim = Math.min(1, elapsed / 600);
        this.render();

        if (this.showActualAnim < 1) {
            this.animFrame = requestAnimationFrame(() => this._animateResult());
        } else {
            this.animFrame = null;
        }
    },

    _endGame() {
        this.phase = 'gameover';
        const best = this.ui.getHighScore();
        this.ui.setHighScore(this.totalScore);
        const newBest = this.ui.getHighScore();
        this.ui.showGameOver(this.totalScore, newBest);
        this.render();
    },

    // ==================== Coordinate Helpers ====================

    _getSliderLayout() {
        const w = this.ui.canvasW;
        const padding = 60;
        const sliderX = padding;
        const sliderWidth = w - padding * 2;
        const sliderY = 370;
        return { sliderX, sliderWidth, sliderY };
    },

    _guessToSliderPos(guess) {
        const { sliderX, sliderWidth } = this._getSliderLayout();
        return sliderX + (guess / this.sliderMax) * sliderWidth;
    },

    _sliderPosToGuess(posX) {
        const { sliderX, sliderWidth } = this._getSliderLayout();
        let t = (posX - sliderX) / sliderWidth;
        t = Math.max(0, Math.min(1, t));
        return Math.round(t * this.sliderMax);
    },

    _getCanvasPos(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.ui.canvasW / rect.width;
        const scaleY = this.ui.canvasH / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    },

    _isInRect(px, py, rect) {
        return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
    },

    // ==================== Map Drawing ====================

    _lngToMapX(lng) {
        const w = this.ui.canvasW;
        const mapLeft = 40;
        const mapWidth = w - 80;
        return mapLeft + ((lng + 180) / 360) * mapWidth;
    },

    _latToMapY(lat) {
        const mapTop = 80;
        const mapHeight = 160;
        // Simple Mercator-like projection clamped
        const latRad = lat * Math.PI / 180;
        const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
        const yNorm = (1 - mercN / Math.PI) / 2;
        return mapTop + yNorm * mapHeight;
    },

    _drawWorldMap() {
        const ctx = this.ctx;
        const w = this.ui.canvasW;

        // Draw simple map background
        const mapLeft = 40;
        const mapTop = 80;
        const mapWidth = w - 80;
        const mapHeight = 160;

        ctx.fillStyle = 'rgba(26, 26, 46, 0.8)';
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(mapLeft - 10, mapTop - 10, mapWidth + 20, mapHeight + 20, 8);
        ctx.fill();
        ctx.stroke();

        // Grid lines for reference
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 0.5;
        for (let lng = -180; lng <= 180; lng += 60) {
            const x = this._lngToMapX(lng);
            ctx.beginPath();
            ctx.moveTo(x, mapTop);
            ctx.lineTo(x, mapTop + mapHeight);
            ctx.stroke();
        }
        for (let lat = -60; lat <= 60; lat += 30) {
            const y = this._latToMapY(lat);
            ctx.beginPath();
            ctx.moveTo(mapLeft, y);
            ctx.lineTo(mapLeft + mapWidth, y);
            ctx.stroke();
        }

        // Draw small dots for all cities
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        for (const city of this.cities) {
            const cx = this._lngToMapX(city.lng);
            const cy = this._latToMapY(city.lat);
            ctx.beginPath();
            ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw current pair
        if (this.currentPair) {
            const [c1, c2] = this.currentPair;
            const x1 = this._lngToMapX(c1.lng);
            const y1 = this._latToMapY(c1.lat);
            const x2 = this._lngToMapX(c2.lng);
            const y2 = this._latToMapY(c2.lat);

            // Connection line
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.setLineDash([]);

            // City dots
            ctx.fillStyle = '#00d4ff';
            ctx.beginPath();
            ctx.arc(x1, y1, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff2d7b';
            ctx.beginPath();
            ctx.arc(x2, y2, 5, 0, Math.PI * 2);
            ctx.fill();

            // Glow
            ctx.shadowColor = '#00d4ff';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#00d4ff';
            ctx.beginPath();
            ctx.arc(x1, y1, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowColor = '#ff2d7b';
            ctx.fillStyle = '#ff2d7b';
            ctx.beginPath();
            ctx.arc(x2, y2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
        }
    },

    // ==================== Rendering ====================

    render() {
        const ctx = this.ctx;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Round indicator
        ctx.fillStyle = '#8888a0';
        ctx.font = '14px JetBrains Mono, monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        const roundText = this.phase === 'gameover'
            ? 'Game Over'
            : `Round ${Math.min(this.round, this.totalRounds)} / ${this.totalRounds}`;
        ctx.fillText(roundText, w - 20, 15);

        // Total score
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffd60a';
        ctx.fillText(`Score: ${this.totalScore}`, 20, 15);

        if (this.phase === 'gameover') {
            this._drawGameOverCanvas();
            return;
        }

        // Map
        this._drawWorldMap();

        // City names
        if (this.currentPair) {
            const [c1, c2] = this.currentPair;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.fillStyle = '#00d4ff';
            ctx.font = 'bold 28px Outfit, sans-serif';
            ctx.fillText(c1.name, w / 2 - 20, 265);

            ctx.fillStyle = '#8888a0';
            ctx.font = '24px Outfit, sans-serif';
            ctx.fillText('\u2192', w / 2 + 60 + ctx.measureText(c1.name).width / 2 - 60, 265);

            // Measure to position arrow properly
            const name1W = ctx.measureText(c1.name).width;
            ctx.font = 'bold 28px Outfit, sans-serif';
            const name2W = ctx.measureText(c2.name).width;
            const totalW = name1W + 40 + name2W; // 40 for arrow spacing
            const startX = (w - totalW) / 2;

            // Redraw properly centered
            ctx.fillStyle = '#00d4ff';
            ctx.font = 'bold 28px Outfit, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(c1.name, startX, 265);

            ctx.fillStyle = '#8888a0';
            ctx.font = '24px Outfit, sans-serif';
            ctx.fillText('\u2192', startX + name1W + 10, 265);

            ctx.fillStyle = '#ff2d7b';
            ctx.font = 'bold 28px Outfit, sans-serif';
            ctx.fillText(c2.name, startX + name1W + 40, 265);
        }

        if (this.phase === 'guessing') {
            this._drawGuessUI();
        } else if (this.phase === 'result') {
            this._drawResultUI();
        }
    },

    _drawGuessUI() {
        const ctx = this.ctx;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;
        const { sliderX, sliderWidth, sliderY } = this._getSliderLayout();

        // Slider track
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.roundRect(sliderX, sliderY - 4, sliderWidth, 8, 4);
        ctx.fill();

        // Filled portion
        const knobX = this._guessToSliderPos(this.guess);
        const gradient = ctx.createLinearGradient(sliderX, 0, knobX, 0);
        gradient.addColorStop(0, '#00d4ff');
        gradient.addColorStop(1, '#ff2d7b');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(sliderX, sliderY - 4, knobX - sliderX, 8, 4);
        ctx.fill();

        // Knob
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#e8e8f0';
        ctx.beginPath();
        ctx.arc(knobX, sliderY, this.sliderKnobRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        // Knob inner
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.arc(knobX, sliderY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Scale labels
        ctx.fillStyle = '#8888a0';
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('0 km', sliderX, sliderY + 20);
        ctx.textAlign = 'center';
        ctx.fillText('10,000', sliderX + sliderWidth / 2, sliderY + 20);
        ctx.textAlign = 'right';
        ctx.fillText('20,000 km', sliderX + sliderWidth, sliderY + 20);

        // Current guess display
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#e8e8f0';
        ctx.font = 'bold 36px JetBrains Mono, monospace';
        const displayVal = this.typingMode ? (this.typedValue || '|') : this.guess.toLocaleString();
        ctx.fillText(displayVal + (this.typingMode ? '' : ' km'), w / 2, 320);

        // Hint text
        ctx.fillStyle = '#8888a0';
        ctx.font = '13px Outfit, sans-serif';
        ctx.fillText(this.typingMode ? 'Type a number, Enter to submit' : 'Drag slider, use \u2190\u2192 keys, or type a number', w / 2, 348);

        // +/- buttons
        const btnSize = 40;
        const btnY = sliderY - btnSize / 2;
        const minusBtnX = sliderX - btnSize - 10;
        const plusBtnX = sliderX + sliderWidth + 10;

        this.minusBtn = { x: minusBtnX, y: btnY, w: btnSize, h: btnSize };
        this.plusBtn = { x: plusBtnX, y: btnY, w: btnSize, h: btnSize };

        // Minus button
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.roundRect(minusBtnX, btnY, btnSize, btnSize, 8);
        ctx.fill();
        ctx.fillStyle = '#e8e8f0';
        ctx.font = 'bold 22px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\u2212', minusBtnX + btnSize / 2, btnY + btnSize / 2);

        // Plus button
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.roundRect(plusBtnX, btnY, btnSize, btnSize, 8);
        ctx.fill();
        ctx.fillStyle = '#e8e8f0';
        ctx.fillText('+', plusBtnX + btnSize / 2, btnY + btnSize / 2);

        // Submit button
        const submitW = 200;
        const submitH = 48;
        const submitX = (w - submitW) / 2;
        const submitY = 440;
        this.submitBtn = { x: submitX, y: submitY, w: submitW, h: submitH };

        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.roundRect(submitX, submitY, submitW, submitH, 12);
        ctx.fill();

        ctx.fillStyle = '#0a0a0f';
        ctx.font = 'bold 18px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Submit Guess', submitX + submitW / 2, submitY + submitH / 2);

        // Keyboard hint
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.font = '12px Outfit, sans-serif';
        ctx.fillText('Press Enter to submit', w / 2, submitY + submitH + 24);
    },

    _drawResultUI() {
        const ctx = this.ctx;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;
        const { sliderX, sliderWidth, sliderY } = this._getSliderLayout();

        // Slider track (static)
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.roundRect(sliderX, sliderY - 4, sliderWidth, 8, 4);
        ctx.fill();

        // Guess marker
        const guessX = this._guessToSliderPos(this.guess);
        ctx.fillStyle = '#8888a0';
        ctx.beginPath();
        ctx.arc(guessX, sliderY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Actual marker (animated)
        const actualX = this._guessToSliderPos(this.actualDistance);
        const animActualX = guessX + (actualX - guessX) * this.showActualAnim;

        ctx.shadowColor = '#00e676';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#00e676';
        ctx.beginPath();
        ctx.arc(animActualX, sliderY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        // Scale labels
        ctx.fillStyle = '#8888a0';
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('0 km', sliderX, sliderY + 20);
        ctx.textAlign = 'center';
        ctx.fillText('10,000', sliderX + sliderWidth / 2, sliderY + 20);
        ctx.textAlign = 'right';
        ctx.fillText('20,000 km', sliderX + sliderWidth, sliderY + 20);

        // Result info
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const diff = Math.abs(this.guess - this.actualDistance);

        ctx.fillStyle = '#8888a0';
        ctx.font = '16px Outfit, sans-serif';
        ctx.fillText('Your guess', w / 2 - 140, 310);
        ctx.fillText('Actual distance', w / 2 + 140, 310);

        ctx.fillStyle = '#e8e8f0';
        ctx.font = 'bold 22px JetBrains Mono, monospace';
        ctx.fillText(this.guess.toLocaleString() + ' km', w / 2 - 140, 340);

        ctx.fillStyle = '#00e676';
        ctx.fillText(this.actualDistance.toLocaleString() + ' km', w / 2 + 140, 340);

        // Difference
        ctx.fillStyle = '#ff2d7b';
        ctx.font = '16px Outfit, sans-serif';
        ctx.fillText('Off by ' + diff.toLocaleString() + ' km', w / 2, 390);

        // Round score
        const scoreColor = this.roundScore >= 900 ? '#00e676' :
                           this.roundScore >= 500 ? '#ffd60a' :
                           this.roundScore >= 200 ? '#ff8c00' : '#ff2d7b';
        ctx.fillStyle = scoreColor;
        ctx.font = 'bold 32px JetBrains Mono, monospace';
        ctx.fillText('+' + this.roundScore, w / 2, 430);

        // Accuracy label
        const pctError = diff / this.actualDistance;
        let label;
        if (pctError <= 0.05) label = 'PERFECT!';
        else if (pctError <= 0.10) label = 'Excellent!';
        else if (pctError <= 0.20) label = 'Great!';
        else if (pctError <= 0.35) label = 'Good';
        else if (pctError <= 0.50) label = 'Not bad';
        else label = 'Way off!';

        ctx.fillStyle = scoreColor;
        ctx.font = 'bold 18px Outfit, sans-serif';
        ctx.fillText(label, w / 2, 465);

        // Next / Finish button
        const isLast = this.round >= this.totalRounds;
        const btnLabel = isLast ? 'See Results' : 'Next Round \u2192';
        const btnW = 200;
        const btnH = 48;
        const btnX = (w - btnW) / 2;
        const btnY = 510;
        this.nextBtn = { x: btnX, y: btnY, w: btnW, h: btnH };

        ctx.fillStyle = '#ff2d7b';
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 12);
        ctx.fill();

        ctx.fillStyle = '#e8e8f0';
        ctx.font = 'bold 18px Outfit, sans-serif';
        ctx.fillText(btnLabel, btnX + btnW / 2, btnY + btnH / 2);

        // Hint
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.font = '12px Outfit, sans-serif';
        ctx.fillText('Press Enter or Space to continue', w / 2, btnY + btnH + 24);
    },

    _drawGameOverCanvas() {
        const ctx = this.ctx;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;

        // Summary of rounds
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = '#e8e8f0';
        ctx.font = 'bold 28px Outfit, sans-serif';
        ctx.fillText('Final Results', w / 2, 60);

        // Table header
        const tableTop = 90;
        const rowH = 42;
        ctx.fillStyle = '#8888a0';
        ctx.font = '12px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Cities', 30, tableTop);
        ctx.textAlign = 'right';
        ctx.fillText('Guess', w - 220, tableTop);
        ctx.fillText('Actual', w - 120, tableTop);
        ctx.fillText('Score', w - 30, tableTop);

        // Separator
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(20, tableTop + 12);
        ctx.lineTo(w - 20, tableTop + 12);
        ctx.stroke();

        // Rows
        const maxVisible = Math.min(this.roundResults.length, 10);
        for (let i = 0; i < maxVisible; i++) {
            const r = this.roundResults[i];
            const y = tableTop + 30 + i * rowH;

            // Alternate row bg
            if (i % 2 === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.02)';
                ctx.fillRect(20, y - 14, w - 40, rowH);
            }

            ctx.textAlign = 'left';
            ctx.fillStyle = '#e8e8f0';
            ctx.font = '13px Outfit, sans-serif';
            const cityText = r.cities[0] + ' \u2192 ' + r.cities[1];
            // Truncate if too long
            const maxCityW = w - 300;
            let displayCity = cityText;
            if (ctx.measureText(displayCity).width > maxCityW) {
                while (ctx.measureText(displayCity + '...').width > maxCityW && displayCity.length > 0) {
                    displayCity = displayCity.slice(0, -1);
                }
                displayCity += '...';
            }
            ctx.fillText(displayCity, 30, y + 4);

            ctx.textAlign = 'right';
            ctx.fillStyle = '#8888a0';
            ctx.font = '13px JetBrains Mono, monospace';
            ctx.fillText(r.guess.toLocaleString(), w - 220, y + 4);

            ctx.fillStyle = '#00e676';
            ctx.fillText(r.actual.toLocaleString(), w - 120, y + 4);

            const sc = r.score;
            ctx.fillStyle = sc >= 900 ? '#00e676' : sc >= 500 ? '#ffd60a' : sc >= 200 ? '#ff8c00' : '#ff2d7b';
            ctx.font = 'bold 14px JetBrains Mono, monospace';
            ctx.fillText('+' + sc, w - 30, y + 4);
        }

        // Total
        const totalY = tableTop + 30 + maxVisible * rowH + 20;
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.moveTo(20, totalY - 10);
        ctx.lineTo(w - 20, totalY - 10);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd60a';
        ctx.font = 'bold 24px JetBrains Mono, monospace';
        ctx.fillText('Total: ' + this.totalScore.toLocaleString() + ' / ' + (this.totalRounds * 1000).toLocaleString(), w / 2, totalY + 14);

        // Average accuracy
        const avgScore = Math.round(this.totalScore / this.totalRounds);
        ctx.fillStyle = '#8888a0';
        ctx.font = '14px Outfit, sans-serif';
        ctx.fillText('Average: ' + avgScore + ' pts per round', w / 2, totalY + 44);
    },

    // ==================== Event Handlers ====================

    _onMouseDown(e) {
        if (this.phase !== 'guessing') return;
        const pos = this._getCanvasPos(e.clientX, e.clientY);
        const { sliderY } = this._getSliderLayout();
        const knobX = this._guessToSliderPos(this.guess);

        const dx = pos.x - knobX;
        const dy = pos.y - sliderY;
        if (dx * dx + dy * dy < (this.sliderKnobRadius + 8) ** 2) {
            this.dragging = true;
        }
    },

    _onMouseMove(e) {
        if (!this.dragging) return;
        const pos = this._getCanvasPos(e.clientX, e.clientY);
        this.guess = this._sliderPosToGuess(pos.x);
        this.typingMode = false;
        this.typedValue = '';
        this.render();
    },

    _onMouseUp(e) {
        this.dragging = false;
    },

    _onTouchStart(e) {
        e.preventDefault();
        if (this.phase !== 'guessing') {
            // Handle button taps on touch
            if (e.touches.length > 0) {
                const pos = this._getCanvasPos(e.touches[0].clientX, e.touches[0].clientY);
                this._handleTap(pos.x, pos.y);
            }
            return;
        }
        if (e.touches.length > 0) {
            const pos = this._getCanvasPos(e.touches[0].clientX, e.touches[0].clientY);
            const { sliderY } = this._getSliderLayout();
            const knobX = this._guessToSliderPos(this.guess);
            const dx = pos.x - knobX;
            const dy = pos.y - sliderY;
            if (dx * dx + dy * dy < (this.sliderKnobRadius + 16) ** 2) {
                this.dragging = true;
            } else {
                // Check button taps
                this._handleTap(pos.x, pos.y);
            }
        }
    },

    _onTouchMove(e) {
        e.preventDefault();
        if (!this.dragging || e.touches.length === 0) return;
        const pos = this._getCanvasPos(e.touches[0].clientX, e.touches[0].clientY);
        this.guess = this._sliderPosToGuess(pos.x);
        this.typingMode = false;
        this.typedValue = '';
        this.render();
    },

    _onTouchEnd(e) {
        e.preventDefault();
        this.dragging = false;
    },

    _onClick(e) {
        const pos = this._getCanvasPos(e.clientX, e.clientY);
        this._handleTap(pos.x, pos.y);
    },

    _handleTap(x, y) {
        if (this.phase === 'guessing') {
            // Submit button
            if (this._isInRect(x, y, this.submitBtn)) {
                this._finalizeTyping();
                this._submitGuess();
                return;
            }
            // Plus/Minus buttons
            if (this._isInRect(x, y, this.minusBtn)) {
                this.guess = Math.max(0, this.guess - 500);
                this.typingMode = false;
                this.typedValue = '';
                this.render();
                return;
            }
            if (this._isInRect(x, y, this.plusBtn)) {
                this.guess = Math.min(this.sliderMax, this.guess + 500);
                this.typingMode = false;
                this.typedValue = '';
                this.render();
                return;
            }
            // Click on slider track to jump
            const { sliderX, sliderWidth, sliderY } = this._getSliderLayout();
            if (y >= sliderY - 20 && y <= sliderY + 20 && x >= sliderX && x <= sliderX + sliderWidth) {
                this.guess = this._sliderPosToGuess(x);
                this.typingMode = false;
                this.typedValue = '';
                this.render();
            }
        } else if (this.phase === 'result') {
            if (this._isInRect(x, y, this.nextBtn)) {
                this._nextRound();
            }
        }
    },

    _onKeyDown(e) {
        if (this.phase === 'guessing') {
            if (e.key === 'Enter') {
                e.preventDefault();
                this._finalizeTyping();
                this._submitGuess();
                return;
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.guess = Math.max(0, this.guess - (e.shiftKey ? 1000 : 100));
                this.typingMode = false;
                this.typedValue = '';
                this.render();
                return;
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.guess = Math.min(this.sliderMax, this.guess + (e.shiftKey ? 1000 : 100));
                this.typingMode = false;
                this.typedValue = '';
                this.render();
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.guess = Math.min(this.sliderMax, this.guess + 500);
                this.typingMode = false;
                this.typedValue = '';
                this.render();
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.guess = Math.max(0, this.guess - 500);
                this.typingMode = false;
                this.typedValue = '';
                this.render();
                return;
            }
            // Number typing
            if (e.key >= '0' && e.key <= '9') {
                if (!this.typingMode) {
                    this.typingMode = true;
                    this.typedValue = '';
                }
                if (this.typedValue.length < 5) {
                    this.typedValue += e.key;
                    this.render();
                }
                return;
            }
            if (e.key === 'Backspace' && this.typingMode) {
                this.typedValue = this.typedValue.slice(0, -1);
                if (this.typedValue.length === 0) {
                    this.typingMode = false;
                }
                this.render();
                return;
            }
            if (e.key === 'Escape' && this.typingMode) {
                this.typingMode = false;
                this.typedValue = '';
                this.render();
                return;
            }
        } else if (this.phase === 'result') {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this._nextRound();
            }
        }
    },

    _finalizeTyping() {
        if (this.typingMode && this.typedValue.length > 0) {
            let val = parseInt(this.typedValue, 10);
            if (!isNaN(val)) {
                this.guess = Math.max(0, Math.min(this.sliderMax, val));
            }
            this.typingMode = false;
            this.typedValue = '';
        }
    }
};

export default DistanceGuess;
