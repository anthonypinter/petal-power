class TileGame {
    constructor() {
        this.board = [];
        this.currentPosition = null;
        this.flippedTiles = new Set();
        this.nextGoalTile = 1;
        this.canMoveDiagonal = false;
        this.hasExtraLife = false;
        this.extraLifeUsed = false;
        this.isProcessingTurnEnd = false;
        this.canSelectAnyGoal = false;
        this.showAllTiles = false;
        this.collectedGoals = new Set();
        this.isWarping = false;
        this.isGrappling = false;
        this.grapplePosition = null;
        this.gameWon = false;

        this.initializeBoard();
        this.setupEventListeners();
    }

    initializeBoard() {
        const tiles = [
            ...Array(6).fill(0),
            1, 2, 3, 4, 5,
            6, 7, 8, 9, 10,
            ...Array(4).fill(11)
        ];
        
        for (let i = tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
        }

        this.board = Array(4).fill().map((_, i) => 
            tiles.slice(i * 5, (i + 1) * 5)
        );

        this.flippedTiles.clear();
        this.currentPosition = null;
        this.nextGoalTile = 1;
        this.canMoveDiagonal = false;
        this.hasExtraLife = false;
        this.extraLifeUsed = false;
        this.canSelectAnyGoal = false;
        this.collectedGoals.clear();
        this.isWarping = false;
        this.isGrappling = false;
        this.grapplePosition = null;
        this.isProcessingTurnEnd = false;
        this.gameWon = false;
        
        this.renderBoard();
        this.updateGameState();
        this.setGameMessage('Select a tile on the outer edge to start');
        this.hideVictoryModal();
        this.hideHelpModal();
    }

    getTileColor(value) {
        const colors = {
            0: '#e5e7eb',
            1: '#ef4444',
            2: '#f97316',
            3: '#eab308',
            4: '#22c55e',
            5: '#3b82f6',
            6: '#a855f7',
            7: '#ec4899',
            8: '#6366f1',
            9: '#14b8a6',
            10: '#06b6d4',
            11: '#000000'
        };
        return colors[value] || '#e5e7eb';
    }

    isValidMove(row, col) {
        if (this.isProcessingTurnEnd || this.gameWon) return false;
        
        
        if (this.isWarping || this.isGrappling) {
            return !this.flippedTiles.has(`${row}-${col}`);
        }

        if (this.currentPosition === null) {
            return row === 0 || row === 3 || col === 0 || col === 4;
        }

        const [currentRow, currentCol] = this.currentPosition;
        const orthogonal = (
            (Math.abs(row - currentRow) === 1 && col === currentCol) ||
            (Math.abs(col - currentCol) === 1 && row === currentRow)
        );
        
        const diagonal = this.canMoveDiagonal && (
            Math.abs(row - currentRow) === 1 && Math.abs(col - currentCol) === 1
        );

        const canMoveToTile = !this.flippedTiles.has(`${row}-${col}`) || 
                            (this.flippedTiles.has(`${row}-${col}`) && this.board[row][col] === 0);

        return (orthogonal || diagonal) && canMoveToTile;
    }

    handleTurnEnd(message, shouldResetBoard = false) {
        this.isProcessingTurnEnd = true;
        this.setGameMessage(message);
        
        // Immediately clear the current position to remove highlighting
        this.currentPosition = null;
        this.renderBoard();
        
        setTimeout(() => {
            if (shouldResetBoard) {
                this.flippedTiles.clear();
            }
            this.canMoveDiagonal = false;
            this.canSelectAnyGoal = false;
            this.hasExtraLife = false;
            this.extraLifeUsed = false;
            this.isWarping = false;
            this.isGrappling = false;
            this.grapplePosition = null;
            this.nextGoalTile = 1;
            this.isProcessingTurnEnd = false;
            
            this.setGameMessage('Select a tile on the outer edge to start');
            this.updateGameState();
            this.renderBoard();
        }, 1500);
    }

    showVictoryModal() {
        const modal = document.getElementById('victoryModal');
        modal.classList.remove('hidden');
        this.isProcessingTurnEnd = true;
        
        document.getElementById('revealBoardAfterWin').onclick = () => {
            this.hideVictoryModal();
            this.showAllTiles = true;
            this.isProcessingTurnEnd = false;
            // Update the Reveal Board button text
            const revealButton = document.getElementById('revealBtn');
            revealButton.innerHTML = `Hide Board`;
            this.renderBoard();
        };
        
        document.getElementById('newGameAfterWin').onclick = () => {
            this.hideVictoryModal();
            this.initializeBoard();
        };
    }

    hideVictoryModal() {
        const modal = document.getElementById('victoryModal');
        modal.classList.add('hidden');
        this.isProcessingTurnEnd = false;
    }

    showHelpModal() {
        const modal = document.getElementById('helpModal');
        modal.classList.remove('hidden');
    }

    hideHelpModal() {
        const modal = document.getElementById('helpModal');
        modal.classList.add('hidden');
    }

    handleTileEffect(row, col, tileValue, isGrappleEffect = false) {
        if (tileValue >= 1 && tileValue <= 5) {
            if (this.canSelectAnyGoal || tileValue === this.nextGoalTile) {
                this.collectedGoals.add(tileValue);

                if (this.extraLifeUsed) {
                    this.hasExtraLife = true;
                    this.extraLifeUsed = false;
                    this.setGameMessage(`Found tile ${tileValue}! Extra life refilled!`);
                } else {
                    this.setGameMessage(`Found tile ${tileValue}!`);
                }

                if (this.canSelectAnyGoal) {
                    this.canSelectAnyGoal = false;
                }

                this.nextGoalTile = this.getNextRequiredGoal();
                
                if (this.collectedGoals.size === 5) {
                    setTimeout(() => {
                        this.showVictoryModal();
                    }, 500);
                    return true;
                }
            } else {
                this.handleTurnEnd(`Wrong order! Needed ${this.nextGoalTile}, found ${tileValue}`, true);
                return true;
            }
        }

        if (tileValue === 6 && !isGrappleEffect) {
            this.isGrappling = true;
            this.grapplePosition = [row, col];
            this.setGameMessage('Select any unflipped tile to reveal');
            return false;
        }

        switch (tileValue) {
            case 7:
                this.hasExtraLife = true;
                this.extraLifeUsed = false;
                this.setGameMessage('Extra life gained!');
                break;

            case 8:
                this.canMoveDiagonal = true;
                this.setGameMessage('Diagonal movement enabled!');
                break;

            case 9:
                this.canSelectAnyGoal = true;
                this.setGameMessage('You can select your next goal tile in any order!');
                break;

            case 10:
                if (!isGrappleEffect) {
                    this.isWarping = true;
                    this.setGameMessage('Select any unflipped tile to warp to');
                }
                break;

            case 11:
                if (this.hasExtraLife) {
                    this.hasExtraLife = false;
                    this.extraLifeUsed = true;
                    this.setGameMessage('Extra life used!');
                } else {
                    this.handleTurnEnd('Death tile! Starting new attempt...', true);
                    return true;
                }
                break;
        }
        return false;
    }

    handleTileClick(row, col) {
        if (!this.isValidMove(row, col)) {
            return;
        }

        const tileValue = this.board[row][col];
        this.flippedTiles.add(`${row}-${col}`);

        if (this.isWarping) {
            this.isWarping = false;
            this.currentPosition = [row, col];
            const shouldEnd = this.handleTileEffect(row, col, tileValue);
            if (!shouldEnd) {
                this.setGameMessage(`Warped to tile ${tileValue}!`);
            }
            this.updateGameState();
            this.renderBoard();
            return;
        }

        if (this.isGrappling) {
            this.isGrappling = false;
            const shouldEnd = this.handleTileEffect(row, col, tileValue, true);
            if (!shouldEnd) {
                this.currentPosition = this.grapplePosition;
                this.setGameMessage(`Revealed tile ${tileValue}!`);
            }
            this.updateGameState();
            this.renderBoard();
            return;
        }

        this.currentPosition = [row, col];
        this.handleTileEffect(row, col, tileValue);
        this.updateGameState();
        this.renderBoard();
    }

    getNextRequiredGoal() {
        for (let i = 1; i <= 5; i++) {
            if (!this.collectedGoals.has(i)) {
                return i;
            }
        }
        return 5;
    }

    setGameMessage(message) {
        document.getElementById('gameMessage').textContent = message;
    }

    updateGameState() {
        document.getElementById('nextGoal').textContent = 
            `Next Goal: ${this.nextGoalTile <= 5 ? this.nextGoalTile : 'Complete!'}`;

        document.getElementById('extraLifeBubble').classList.toggle('hidden', !this.hasExtraLife);
        document.getElementById('anyOrderBubble').classList.toggle('hidden', !this.canSelectAnyGoal);
        document.getElementById('diagonalBubble').classList.toggle('hidden', !this.canMoveDiagonal);
        document.getElementById('warpBubble').classList.toggle('hidden', !this.isWarping);
        document.getElementById('grappleBubble').classList.toggle('hidden', !this.isGrappling);

        const buttons = document.querySelectorAll('.control-btn');
        buttons.forEach(button => {
            button.disabled = this.isProcessingTurnEnd;
        });
    }

    renderBoard() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = '';

        this.board.forEach((row, rowIndex) => {
            row.forEach((tile, colIndex) => {
                const tileElement = document.createElement('button');
                tileElement.className = 'tile';
                
                if (this.flippedTiles.has(`${rowIndex}-${colIndex}`) || this.showAllTiles) {
                    tileElement.classList.add('revealed');
                    tileElement.style.backgroundColor = this.getTileColor(tile);
                    tileElement.textContent = tile;
                }

                if (this.isValidMove(rowIndex, colIndex) && !this.isProcessingTurnEnd) {
                    tileElement.classList.add('valid-move');
                }

                if (this.currentPosition && 
                    this.currentPosition[0] === rowIndex && 
                    this.currentPosition[1] === colIndex) {
                    tileElement.classList.add('current');
                }

                tileElement.onclick = () => this.handleTileClick(rowIndex, colIndex);
                gameBoard.appendChild(tileElement);
            });
        });
    }

    setupEventListeners() {
        document.getElementById('newGameBtn').onclick = () => this.initializeBoard();
        
        document.getElementById('revealBtn').onclick = () => {
            this.showAllTiles = !this.showAllTiles;
            const button = document.getElementById('revealBtn');
            button.innerHTML = `
                              ${this.showAllTiles ? 'Hide Board' : 'Reveal Board'}`;
            this.renderBoard();
        };
        
        document.getElementById('restartBtn').onclick = () => {
            this.handleTurnEnd('Starting new attempt...', true);
        };

        document.getElementById('helpBtn').onclick = () => {
            this.showHelpModal();
        };

        document.getElementById('closeHelpBtn').onclick = () => {
            this.hideHelpModal();
        };

        document.getElementById('helpModal').onclick = (e) => {
            if (e.target.id === 'helpModal') {
                this.hideHelpModal();
            }
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TileGame();
});