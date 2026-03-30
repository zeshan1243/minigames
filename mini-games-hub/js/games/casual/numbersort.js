const NumberSort = {
    canvas: null, ctx: null, ui: null,
    numbers: [], slots: [], slotWidth: 0, slotHeight: 0,
    offsetX: 0, offsetY: 0, selected: -1,
    score: 0, startTime: 0, timerInterval: null,
    gameOver: false, paused: false, animFrame: null,
    swapAnim: null, count: 8,

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.handleClick = this.handleClick.bind(this);
        this.handleKey = this.handleKey.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
        document.addEventListener('keydown', this.handleKey);
    },

    start() {
        this.reset();
        this.gameOver = false; this.paused = false;
        this.ui.hideGameOver(); this.ui.hidePause();
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            if (!this.paused && !this.gameOver) {
                const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
                this.ui.setScore(elapsed + 's');
            }
        }, 100);
        this.loop();
    },

    reset() {
        cancelAnimationFrame(this.animFrame);
        clearInterval(this.timerInterval);
        this.selected = -1; this.swapAnim = null;
        this.numbers = [];
        for (let i = 1; i <= this.count; i++) this.numbers.push(i);
        // Shuffle until not sorted
        do {
            for (let i = this.numbers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.numbers[i], this.numbers[j]] = [this.numbers[j], this.numbers[i]];
            }
        } while (this.isSorted());
        this.computeLayout();
    },

    computeLayout() {
        const w = this.ui.canvasW, h = this.ui.canvasH;
        const maxSlotW = (w - 40) / this.count;
        this.slotWidth = Math.min(maxSlotW, 70);
        this.slotHeight = this.slotWidth * 1.3;
        const totalW = this.slotWidth * this.count + 8 * (this.count - 1);
        this.offsetX = (w - totalW) / 2;
        this.offsetY = (h - this.slotHeight) / 2;
        this.slots = [];
        for (let i = 0; i < this.count; i++) {
            this.slots.push({
                x: this.offsetX + i * (this.slotWidth + 8),
                y: this.offsetY,
                displayX: this.offsetX + i * (this.slotWidth + 8),
                displayY: this.offsetY
            });
        }
    },

    isSorted() {
        for (let i = 0; i < this.numbers.length - 1; i++) {
            if (this.numbers[i] > this.numbers[i + 1]) return false;
        }
        return true;
    },

    getSlotAt(clientX, clientY) {
        const r = this.canvas.getBoundingClientRect();
        const mx = clientX - r.left, my = clientY - r.top;
        for (let i = 0; i < this.slots.length; i++) {
            const s = this.slots[i];
            if (mx >= s.x && mx <= s.x + this.slotWidth && my >= s.y && my <= s.y + this.slotHeight) {
                return i;
            }
        }
        return -1;
    },

    handleTouch(e) {
        e.preventDefault();
        const t = e.touches[0];
        this.handleClick({ clientX: t.clientX, clientY: t.clientY });
    },

    handleClick(e) {
        if (this.paused || this.gameOver || this.swapAnim) return;
        const idx = this.getSlotAt(e.clientX, e.clientY);
        if (idx < 0) return;
        if (this.selected === -1) {
            this.selected = idx;
        } else {
            if (Math.abs(idx - this.selected) === 1) {
                this.animateSwap(this.selected, idx);
            }
            this.selected = -1;
        }
    },

    animateSwap(a, b) {
        const startX_a = this.slots[a].x;
        const startX_b = this.slots[b].x;
        this.swapAnim = { a, b, progress: 0, startX_a, startX_b };
    },

    updateSwapAnim() {
        if (!this.swapAnim) return;
        this.swapAnim.progress += 0.06;
        if (this.swapAnim.progress >= 1) {
            this.swapAnim.progress = 1;
            const { a, b } = this.swapAnim;
            [this.numbers[a], this.numbers[b]] = [this.numbers[b], this.numbers[a]];
            this.slots[a].displayX = this.slots[a].x;
            this.slots[b].displayX = this.slots[b].x;
            this.swapAnim = null;
            if (this.isSorted()) this.endGame();
        }
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') this.togglePause();
    },

    togglePause() {
        if (this.gameOver) return;
        this.paused = !this.paused;
        if (this.paused) this.ui.showPause(); else this.ui.hidePause();
    },

    endGame() {
        this.gameOver = true;
        clearInterval(this.timerInterval);
        const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
        this.score = parseFloat(elapsed);
        const best = this.ui.getHighScore() || 9999;
        if (this.score < best) this.ui.setHighScore(this.score);
        this.ui.showGameOver(this.score + 's', (Math.min(this.score, best)) + 's');
    },

    loop() {
        this.animFrame = requestAnimationFrame(() => this.loop());
        if (this.paused) return;
        this.updateSwapAnim();
        this.draw();
    },

    draw() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Title
        ctx.fillStyle = '#00d4ff';
        ctx.font = `bold ${Math.min(w * 0.06, 28)}px 'Segoe UI', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('Sort the Numbers (ascending)', w / 2, this.offsetY - 40);

        // Hint
        ctx.fillStyle = '#667';
        ctx.font = `${Math.min(w * 0.035, 16)}px 'Segoe UI', sans-serif`;
        ctx.fillText('Tap two adjacent slots to swap', w / 2, this.offsetY - 15);

        // Draw slots
        for (let i = 0; i < this.count; i++) {
            let dx = this.slots[i].x;
            let dy = this.slots[i].y;

            // Swap animation offset
            if (this.swapAnim) {
                const { a, b, progress, startX_a, startX_b } = this.swapAnim;
                const ease = 0.5 - 0.5 * Math.cos(progress * Math.PI);
                if (i === a) dx = startX_a + (startX_b - startX_a) * ease;
                else if (i === b) dx = startX_b + (startX_a - startX_b) * ease;
            }

            const isSelected = (i === this.selected);
            const num = this.numbers[i];
            const sorted = this.isSorted();

            // Slot background
            const grad = ctx.createLinearGradient(dx, dy, dx, dy + this.slotHeight);
            if (sorted) {
                grad.addColorStop(0, '#00e676'); grad.addColorStop(1, '#00a84e');
            } else if (isSelected) {
                grad.addColorStop(0, '#ff2d7b'); grad.addColorStop(1, '#c41f5e');
            } else {
                grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(1, '#16162a');
            }
            ctx.fillStyle = grad;
            this.roundRect(ctx, dx, dy, this.slotWidth, this.slotHeight, 10);
            ctx.fill();

            // Border
            ctx.strokeStyle = isSelected ? '#ff2d7b' : sorted ? '#00e676' : '#00d4ff44';
            ctx.lineWidth = isSelected ? 3 : 1.5;
            this.roundRect(ctx, dx, dy, this.slotWidth, this.slotHeight, 10);
            ctx.stroke();

            // Number
            ctx.fillStyle = sorted ? '#0a0a0f' : '#ffd60a';
            ctx.font = `bold ${this.slotWidth * 0.5}px 'Segoe UI', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(num, dx + this.slotWidth / 2, dy + this.slotHeight / 2);
        }

        // Sorted message
        if (this.isSorted() && !this.swapAnim) {
            ctx.fillStyle = '#00e676';
            ctx.font = `bold ${Math.min(w * 0.07, 32)}px 'Segoe UI', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Sorted!', w / 2, this.offsetY + this.slotHeight + 50);
        }
    },

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
    },

    pause() { this.togglePause(); },
    resume() { if (this.paused) this.togglePause(); },

    destroy() {
        cancelAnimationFrame(this.animFrame);
        clearInterval(this.timerInterval);
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('touchstart', this.handleTouch);
        document.removeEventListener('keydown', this.handleKey);
    }
};

export default NumberSort;
