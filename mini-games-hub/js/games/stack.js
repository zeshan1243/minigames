const Stack = {
    canvas: null,
    ctx: null,
    ui: null,
    blocks: [],
    currentBlock: null,
    score: 0,
    gameOver: false,
    paused: false,
    animFrame: null,
    cameraY: 0,
    blockHeight: 25,
    baseWidth: 200,
    speed: 2,
    direction: 1,
    fallingPieces: [],
    perfectFlash: 0,

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this.handleKey = this.handleKey.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        document.addEventListener('keydown', this.handleKey);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
    },

    start() {
        this.reset();
        this.gameOver = false;
        this.paused = false;
        this.ui.hideGameOver();
        this.ui.hidePause();
        this.loop();
    },

    reset() {
        cancelAnimationFrame(this.animFrame);
        this.blocks = [];
        this.fallingPieces = [];
        this.score = 0;
        this.cameraY = 0;
        this.speed = 2;
        this.perfectFlash = 0;
        this.ui.setScore(0);

        // Base block
        const w = this.ui.canvasW;
        const baseX = (w - this.baseWidth) / 2;
        const baseY = this.ui.canvasH - 100;
        this.blocks.push({
            x: baseX, y: baseY,
            w: this.baseWidth, h: this.blockHeight
        });

        this.spawnBlock();
    },

    spawnBlock() {
        const prev = this.blocks[this.blocks.length - 1];
        const y = prev.y - this.blockHeight;
        this.direction = (this.blocks.length % 2 === 0) ? 1 : -1;
        this.currentBlock = {
            x: this.direction === 1 ? -prev.w : this.ui.canvasW,
            y: y,
            w: prev.w,
            h: this.blockHeight,
            moving: true
        };
    },

    loop() {
        if (this.gameOver) return;
        if (!this.paused) {
            this.update();
        }
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update() {
        const cb = this.currentBlock;
        if (!cb || !cb.moving) return;

        cb.x += this.speed * this.direction;

        // Bounce
        if (cb.x + cb.w > this.ui.canvasW) {
            this.direction = -1;
        } else if (cb.x < 0) {
            this.direction = 1;
        }

        // Update falling pieces
        for (let i = this.fallingPieces.length - 1; i >= 0; i--) {
            const fp = this.fallingPieces[i];
            fp.vy += 0.3;
            fp.y += fp.vy;
            fp.rotation += fp.rotSpeed;
            if (fp.y > this.ui.canvasH + 100) {
                this.fallingPieces.splice(i, 1);
            }
        }

        // Camera
        const targetCamY = Math.max(0, (this.blocks.length - 10) * this.blockHeight);
        this.cameraY += (targetCamY - this.cameraY) * 0.08;

        // Flash decay
        if (this.perfectFlash > 0) this.perfectFlash -= 0.02;
    },

    placeBlock() {
        if (this.gameOver || this.paused || !this.currentBlock || !this.currentBlock.moving) return;

        const cb = this.currentBlock;
        const prev = this.blocks[this.blocks.length - 1];

        const overlapStart = Math.max(cb.x, prev.x);
        const overlapEnd = Math.min(cb.x + cb.w, prev.x + prev.w);
        const overlapWidth = overlapEnd - overlapStart;

        if (overlapWidth <= 0) {
            // Miss — entire block falls
            this.fallingPieces.push({
                x: cb.x, y: cb.y, w: cb.w, h: cb.h,
                vy: 0, rotation: 0,
                rotSpeed: (Math.random() - 0.5) * 0.1,
                hue: this.getBlockHue(this.blocks.length)
            });
            this.endGame();
            return;
        }

        // Perfect check (>= 95% overlap)
        const isPerfect = overlapWidth >= prev.w * 0.95;

        if (isPerfect) {
            // Perfect — keep full width
            this.blocks.push({
                x: prev.x, y: cb.y, w: prev.w, h: cb.h
            });
            this.perfectFlash = 1;
        } else {
            // Trim
            this.blocks.push({
                x: overlapStart, y: cb.y, w: overlapWidth, h: cb.h
            });

            // Falling trimmed piece
            if (cb.x < prev.x) {
                // Left overhang
                this.fallingPieces.push({
                    x: cb.x, y: cb.y, w: prev.x - cb.x, h: cb.h,
                    vy: 0, rotation: 0,
                    rotSpeed: -0.05,
                    hue: this.getBlockHue(this.blocks.length)
                });
            }
            if (cb.x + cb.w > prev.x + prev.w) {
                // Right overhang
                this.fallingPieces.push({
                    x: prev.x + prev.w, y: cb.y,
                    w: (cb.x + cb.w) - (prev.x + prev.w), h: cb.h,
                    vy: 0, rotation: 0,
                    rotSpeed: 0.05,
                    hue: this.getBlockHue(this.blocks.length)
                });
            }
        }

        this.score++;
        this.ui.setScore(this.score);

        // Speed up
        if (this.score % 5 === 0) {
            this.speed = Math.min(8, this.speed + 0.5);
        }

        this.currentBlock = null;
        this.spawnBlock();
    },

    getBlockHue(index) {
        return (index * 25) % 360;
    },

    render() {
        const ctx = this.ctx;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Perfect flash
        if (this.perfectFlash > 0) {
            ctx.fillStyle = `rgba(255,214,10,${this.perfectFlash * 0.1})`;
            ctx.fillRect(0, 0, w, h);
        }

        ctx.save();
        ctx.translate(0, this.cameraY);

        // Placed blocks
        for (let i = 0; i < this.blocks.length; i++) {
            const b = this.blocks[i];
            const hue = this.getBlockHue(i);
            ctx.fillStyle = `hsl(${hue}, 70%, 55%)`;
            ctx.fillRect(b.x, b.y, b.w, b.h);
            // Top highlight
            ctx.fillStyle = `hsl(${hue}, 70%, 70%)`;
            ctx.fillRect(b.x, b.y, b.w, 3);
            // Side shadow
            ctx.fillStyle = `hsl(${hue}, 70%, 35%)`;
            ctx.fillRect(b.x, b.y + b.h - 3, b.w, 3);
        }

        // Current moving block
        if (this.currentBlock) {
            const cb = this.currentBlock;
            const hue = this.getBlockHue(this.blocks.length);
            ctx.fillStyle = `hsl(${hue}, 70%, 55%)`;
            ctx.fillRect(cb.x, cb.y, cb.w, cb.h);
            ctx.fillStyle = `hsl(${hue}, 70%, 70%)`;
            ctx.fillRect(cb.x, cb.y, cb.w, 3);

            // Guide lines (subtle)
            const prev = this.blocks[this.blocks.length - 1];
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(prev.x, cb.y - 20);
            ctx.lineTo(prev.x, cb.y + cb.h + 5);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(prev.x + prev.w, cb.y - 20);
            ctx.lineTo(prev.x + prev.w, cb.y + cb.h + 5);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Falling pieces
        for (const fp of this.fallingPieces) {
            ctx.save();
            ctx.translate(fp.x + fp.w / 2, fp.y + fp.h / 2);
            ctx.rotate(fp.rotation);
            ctx.fillStyle = `hsla(${fp.hue}, 70%, 55%, 0.7)`;
            ctx.fillRect(-fp.w / 2, -fp.h / 2, fp.w, fp.h);
            ctx.restore();
        }

        ctx.restore();

        // Perfect text
        if (this.perfectFlash > 0.3) {
            ctx.fillStyle = `rgba(255,214,10,${this.perfectFlash})`;
            ctx.font = 'bold 32px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('PERFECT!', w / 2, 80);
        }
    },

    endGame() {
        this.gameOver = true;
        cancelAnimationFrame(this.animFrame);
        this.ui.setHighScore(this.score);
        const best = this.ui.getHighScore();
        this.ui.showGameOver(this.score, best);
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') {
            this.togglePause();
            return;
        }
        if (e.key === ' ') {
            e.preventDefault();
            this.placeBlock();
        }
    },

    handleClick() {
        this.placeBlock();
    },

    handleTouch(e) {
        e.preventDefault();
        this.placeBlock();
    },

    togglePause() {
        if (this.gameOver) return;
        this.paused = !this.paused;
        if (this.paused) {
            this.ui.showPause();
        } else {
            this.ui.hidePause();
        }
    },

    pause() { if (!this.paused) this.togglePause(); },
    resume() { if (this.paused) this.togglePause(); },

    destroy() {
        cancelAnimationFrame(this.animFrame);
        document.removeEventListener('keydown', this.handleKey);
    }
};

export default Stack;
