const Storage = {
    getHighScore(gameId) {
        const val = localStorage.getItem(`mgh_high_${gameId}`);
        return val ? Number(val) : 0;
    },

    // Games where lower score is better
    _lowerIsBetter: new Set(['reaction', 'slidingpuzzle', 'memorycards', 'numbersort', 'maze', 'sudoku', 'towerofhanoi', 'lightsout', 'golfputt']),

    setHighScore(gameId, score) {
        const current = this.getHighScore(gameId);
        if (this._lowerIsBetter.has(gameId)) {
            if (current === 0 || score < current) {
                localStorage.setItem(`mgh_high_${gameId}`, score);
                return true;
            }
        } else {
            if (score > current) {
                localStorage.setItem(`mgh_high_${gameId}`, score);
                return true;
            }
        }
        return false;
    },

    getDailyPuzzleState() {
        const raw = localStorage.getItem('mgh_daily_puzzle');
        return raw ? JSON.parse(raw) : null;
    },

    setDailyPuzzleState(state) {
        localStorage.setItem('mgh_daily_puzzle', JSON.stringify(state));
    },

    getAllScores() {
        const ids = [
            'reaction','snake','runner','stack','puzzle','colormatch',
            'whackamole','aimtrainer','typing','quickmath','tapcounter','simon','catchball','patternmemory',
            'breakout','pong','flappy','asteroids','spaceinvaders','tetris','doodlejump','game2048',
            'slidingpuzzle','minesweeper','tictactoe','connectfour','lightsout','pipeconnect','towerofhanoi','helicopter',
            'ballbounce','knifethrow','archery','darts','rhythmtap','maze','colorfill','memorycards',
            'numbersort','bubblepop','rps','wordsearch','sudoku','golfputt','fruitslicer','platformer',
            'dodger','pinball','tanks','matching'
        ];
        const scores = {};
        for (const id of ids) {
            const s = this.getHighScore(id);
            if (s > 0) scores[id] = s;
        }
        return scores;
    }
};

export default Storage;
