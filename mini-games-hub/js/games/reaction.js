const Reaction = {
    canvas: null,
    ctx: null,
    ui: null,
    state: 'idle', // idle, waiting, ready, result, early
    startTime: 0,
    timeoutId: null,
    reactionTime: 0,

    // 2P state
    p1: null,
    p2: null,
    round: 0,
    p1Wins: 0,
    p2Wins: 0,
    matchOver: false,

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this.handleClick = this.handleClick.bind(this);
        this._handleClick2P = this._handleClick2P.bind(this);
        this._handleTouch2P = this._handleTouch2P.bind(this);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleClick(); }, { passive: false });
    },

    start() {
        if (this.ui.mode === '2p') {
            this.start2P();
            return;
        }
        this.state = 'idle';
        this.ui.setScore('—');
        this.render();
    },

    handleClick(e) {
        if (this.ui.mode === '2p') return; // 2P uses its own handler
        switch (this.state) {
            case 'idle':
                this.startWaiting();
                break;
            case 'waiting':
                // Too early
                clearTimeout(this.timeoutId);
                this.state = 'early';
                this.render();
                setTimeout(() => {
                    this.state = 'idle';
                    this.render();
                }, 1500);
                break;
            case 'ready':
                this.reactionTime = Math.round(performance.now() - this.startTime);
                this.state = 'result';
                this.ui.setScore(this.reactionTime + 'ms');
                const best = this.ui.getHighScore();
                this.ui.setHighScore(this.reactionTime);
                this.render();
                break;
            case 'result':
                this.startWaiting();
                break;
            case 'early':
                break;
        }
    },

    startWaiting() {
        this.state = 'waiting';
        this.render();
        const delay = Math.random() * 3000 + 2000;
        this.timeoutId = setTimeout(() => {
            this.state = 'ready';
            this.startTime = performance.now();
            this.render();
        }, delay);
    },

    render() {
        if (this.ui.mode === '2p') { this.render2P(); return; }
        const ctx = this.ctx;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;

        ctx.clearRect(0, 0, w, h);

        let bg, mainText, subText;

        switch (this.state) {
            case 'idle':
                bg = '#1a1a2e';
                mainText = 'Click to Start';
                subText = 'Test your reaction speed';
                break;
            case 'waiting':
                bg = '#c0392b';
                mainText = 'Wait...';
                subText = 'Click when the screen turns green';
                break;
            case 'ready':
                bg = '#00e676';
                mainText = 'CLICK NOW!';
                subText = '';
                break;
            case 'result':
                bg = '#1a1a2e';
                mainText = this.reactionTime + ' ms';
                subText = 'Click to try again';
                break;
            case 'early':
                bg = '#ff2d7b';
                mainText = 'Too early!';
                subText = 'Wait for the green screen';
                break;
        }

        // Background
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Main text
        ctx.fillStyle = this.state === 'ready' ? '#000' : '#e8e8f0';
        ctx.font = 'bold 48px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(mainText, w / 2, h / 2 - 20);

        // Sub text
        if (subText) {
            ctx.fillStyle = this.state === 'ready' ? 'rgba(0,0,0,0.6)' : 'rgba(232,232,240,0.5)';
            ctx.font = '18px Outfit, sans-serif';
            ctx.fillText(subText, w / 2, h / 2 + 30);
        }

        // Show best on result
        if (this.state === 'result') {
            const best = this.ui.getHighScore();
            if (best > 0) {
                ctx.fillStyle = '#ffd60a';
                ctx.font = '16px JetBrains Mono, monospace';
                ctx.fillText(`Personal Best: ${best}ms`, w / 2, h / 2 + 70);
            }
        }
    },

    // ========== 2P MODE ==========

    _defaultPlayerState() {
        return { state: 'idle', timeoutId: null, startTime: 0, reactionTime: 0 };
    },

    start2P() {
        this.p1 = this._defaultPlayerState();
        this.p2 = this._defaultPlayerState();
        this.round = 0;
        this.p1Wins = 0;
        this.p2Wins = 0;
        this.matchOver = false;
        this.ui.setScore('P1: 0 | P2: 0');
        this.canvas.addEventListener('click', this._handleClick2P);
        this.canvas.addEventListener('touchstart', this._handleTouch2P, { passive: false });
        this.render2P();
    },

    _handleTouch2P(e) {
        e.preventDefault();
        const r = this.canvas.getBoundingClientRect();
        const x = e.touches[0].clientX - r.left;
        this._click2P(x);
    },

    _handleClick2P(e) {
        const r = this.canvas.getBoundingClientRect();
        const x = e.clientX - r.left;
        this._click2P(x);
    },

    _click2P(x) {
        if (this.matchOver) {
            // Restart match
            this.start2P();
            return;
        }
        const w = this.ui.canvasW;
        const half = w / 2;
        const player = x < half ? this.p1 : this.p2;
        const pName = x < half ? 'p1' : 'p2';

        switch (player.state) {
            case 'idle':
                this._startPlayerWaiting(player);
                break;
            case 'waiting':
                clearTimeout(player.timeoutId);
                player.state = 'early';
                this.render2P();
                setTimeout(() => {
                    player.state = 'idle';
                    this.render2P();
                }, 1500);
                break;
            case 'ready':
                player.reactionTime = Math.round(performance.now() - player.startTime);
                player.state = 'result';
                this.render2P();
                this._checkRoundComplete();
                break;
            case 'result':
            case 'early':
                break;
        }
    },

    _startPlayerWaiting(player) {
        player.state = 'waiting';
        this.render2P();
        const delay = Math.random() * 3000 + 2000;
        player.timeoutId = setTimeout(() => {
            player.state = 'ready';
            player.startTime = performance.now();
            this.render2P();
        }, delay);
    },

    _checkRoundComplete() {
        if (this.p1.state === 'result' && this.p2.state === 'result') {
            this.round++;
            if (this.p1.reactionTime < this.p2.reactionTime) this.p1Wins++;
            else if (this.p2.reactionTime < this.p1.reactionTime) this.p2Wins++;
            this.ui.setScore(`P1: ${this.p1Wins} | P2: ${this.p2Wins}`);
            this.render2P();

            if (this.round >= 3) {
                // Match over
                setTimeout(() => {
                    this.matchOver = true;
                    this.render2P();
                }, 1500);
            } else {
                // Next round after delay
                setTimeout(() => {
                    this.p1 = this._defaultPlayerState();
                    this.p2 = this._defaultPlayerState();
                    this.render2P();
                }, 2000);
            }
        }
    },

    render2P() {
        const ctx = this.ctx;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;
        ctx.clearRect(0, 0, w, h);

        if (this.matchOver) {
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#e8e8f0';
            ctx.font = 'bold 36px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            let winner;
            if (this.p1Wins > this.p2Wins) winner = 'Player 1 Wins!';
            else if (this.p2Wins > this.p1Wins) winner = 'Player 2 Wins!';
            else winner = "It's a Tie!";
            ctx.fillText(winner, w / 2, h / 2 - 30);
            ctx.fillStyle = '#ffd60a';
            ctx.font = '20px JetBrains Mono, monospace';
            ctx.fillText(`P1: ${this.p1Wins}  |  P2: ${this.p2Wins}`, w / 2, h / 2 + 20);
            ctx.fillStyle = 'rgba(232,232,240,0.5)';
            ctx.font = '16px Outfit, sans-serif';
            ctx.fillText('Click to play again', w / 2, h / 2 + 60);
            return;
        }

        const half = w / 2;

        // Draw each half
        this._renderHalf(ctx, 0, half, h, this.p1, 'Player 1');
        this._renderHalf(ctx, half, half, h, this.p2, 'Player 2');

        // Divider
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(half, 0);
        ctx.lineTo(half, h);
        ctx.stroke();

        // Round indicator at top center
        ctx.fillStyle = '#ffd60a';
        ctx.font = 'bold 16px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`Round ${this.round + 1} / 3`, w / 2, 10);
        ctx.textBaseline = 'middle';
    },

    _renderHalf(ctx, x, halfW, h, player, label) {
        let bg, mainText, subText;
        switch (player.state) {
            case 'idle':
                bg = '#1a1a2e'; mainText = 'Tap to Start'; subText = 'Wait for green'; break;
            case 'waiting':
                bg = '#c0392b'; mainText = 'Wait...'; subText = ''; break;
            case 'ready':
                bg = '#00e676'; mainText = 'TAP!'; subText = ''; break;
            case 'result':
                bg = '#1a1a2e'; mainText = player.reactionTime + ' ms'; subText = ''; break;
            case 'early':
                bg = '#ff2d7b'; mainText = 'Too early!'; subText = ''; break;
        }
        ctx.fillStyle = bg;
        ctx.fillRect(x, 0, halfW, h);

        ctx.fillStyle = player.state === 'ready' ? '#000' : '#e8e8f0';
        ctx.font = 'bold 14px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + halfW / 2, 40);

        ctx.font = 'bold 30px Outfit, sans-serif';
        ctx.fillText(mainText, x + halfW / 2, h / 2 - 10);

        if (subText) {
            ctx.fillStyle = player.state === 'ready' ? 'rgba(0,0,0,0.6)' : 'rgba(232,232,240,0.5)';
            ctx.font = '14px Outfit, sans-serif';
            ctx.fillText(subText, x + halfW / 2, h / 2 + 25);
        }
    },

    pause() {},
    resume() {},
    reset() {
        clearTimeout(this.timeoutId);
        if (this.p1) clearTimeout(this.p1.timeoutId);
        if (this.p2) clearTimeout(this.p2.timeoutId);
        this.state = 'idle';
    },
    destroy() {
        clearTimeout(this.timeoutId);
        if (this.p1) clearTimeout(this.p1.timeoutId);
        if (this.p2) clearTimeout(this.p2.timeoutId);
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('click', this._handleClick2P);
        this.canvas.removeEventListener('touchstart', this._handleTouch2P);
    }
};

export default Reaction;
