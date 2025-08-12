document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const resetButton = document.getElementById('reset-button');
    const minesCountDisplay = document.getElementById('mines-count');
    const timerDisplay = document.getElementById('timer');

    const boardSize = 10;
    const numMines = 15;
    let gameBoard = [];
    let minesLocation = [];
    let isGameOver = false;
    let timerInterval;
    let time = 0;
    let flaggedCellsCount = 0;

    // Configura la variable CSS para el tamaño de la cuadrícula
    board.style.setProperty('--board-size', boardSize);

    // Inicializa el juego
    function initGame() {
        // Limpiar el tablero y el estado del juego
        board.innerHTML = '';
        gameBoard = [];
        minesLocation = [];
        isGameOver = false;
        time = 0;
        flaggedCellsCount = 0;
        clearInterval(timerInterval);
        timerDisplay.textContent = '⏰: 0';
        minesCountDisplay.textContent = `💣: ${numMines}`;
        
        createBoard();
        placeMines();
        addEventListeners();
        startTimer();
    }

    // Crea la estructura del tablero en el DOM
    function createBoard() {
        for (let i = 0; i < boardSize; i++) {
            gameBoard.push([]);
            for (let j = 0; j < boardSize; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = i;
                cell.dataset.col = j;
                // Envuelve el contenido en un span para centrarlo correctamente
                cell.innerHTML = `<span></span>`; 
                board.appendChild(cell);
                gameBoard[i][j] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    adjacentMines: 0
                };
            }
        }
    }

    // Coloca las minas de forma aleatoria
    function placeMines() {
        let minesPlaced = 0;
        while (minesPlaced < numMines) {
            const row = Math.floor(Math.random() * boardSize);
            const col = Math.floor(Math.random() * boardSize);

            if (!gameBoard[row][col].isMine) {
                gameBoard[row][col].isMine = true;
                minesLocation.push({ row, col });
                minesPlaced++;
            }
        }
        calculateAdjacentMines();
    }

    // Calcula el número de minas adyacentes para cada celda
    function calculateAdjacentMines() {
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                if (!gameBoard[i][j].isMine) {
                    let count = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const newRow = i + dr;
                            const newCol = j + dc;
                            if (newRow >= 0 && newRow < boardSize &&
                                newCol >= 0 && newCol < boardSize &&
                                gameBoard[newRow][newCol].isMine) {
                                count++;
                            }
                        }
                    }
                    gameBoard[i][j].adjacentMines = count;
                }
            }
        }
    }

    // Maneja los eventos de clic del usuario
    function addEventListeners() {
        board.addEventListener('click', handleLeftClick);
        board.addEventListener('contextmenu', handleRightClick);
        resetButton.addEventListener('click', initGame);
    }

    // Función para manejar el clic izquierdo (revelar celda)
    function handleLeftClick(event) {
        if (isGameOver) return;
        const target = event.target.closest('.cell');
        if (!target || target.classList.contains('flagged')) return;

        const row = parseInt(target.dataset.row);
        const col = parseInt(target.dataset.col);

        if (gameBoard[row][col].isMine) {
            target.querySelector('span').textContent = '💣';
            target.classList.add('mine');
            gameOver(false);
        } else {
            revealCell(row, col);
            checkWin();
        }
    }

    // Función para manejar el clic derecho (poner bandera)
    function handleRightClick(event) {
        event.preventDefault();
        if (isGameOver) return;
        const target = event.target.closest('.cell');
        if (!target || target.classList.contains('revealed')) return;

        const row = parseInt(target.dataset.row);
        const col = parseInt(target.dataset.col);
        const cell = gameBoard[row][col];

        if (cell.isFlagged) {
            cell.isFlagged = false;
            target.classList.remove('flagged');
            flaggedCellsCount--;
        } else if (flaggedCellsCount < numMines) {
            cell.isFlagged = true;
            target.classList.add('flagged');
            flaggedCellsCount++;
        }
        minesCountDisplay.textContent = `💣: ${numMines - flaggedCellsCount}`;
        checkWin();
    }

    // Revela una celda y, si es 0, revela las adyacentes
    function revealCell(row, col) {
        if (row < 0 || row >= boardSize || col < 0 || col >= boardSize || gameBoard[row][col].isRevealed || gameBoard[row][col].isFlagged) {
            return;
        }

        const cellData = gameBoard[row][col];
        cellData.isRevealed = true;
        const cellElement = board.children[row * boardSize + col];
        cellElement.classList.add('revealed');
        cellElement.dataset.adjacent = cellData.adjacentMines;

        if (cellData.adjacentMines > 0) {
            cellElement.querySelector('span').textContent = cellData.adjacentMines;
        } else {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    revealCell(row + dr, col + dc);
                }
            }
        }
    }

    // Verifica si el jugador ha ganado
    function checkWin() {
        let revealedCount = 0;
        let flaggedMines = 0;

        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                if (gameBoard[i][j].isRevealed) {
                    revealedCount++;
                }
                if (gameBoard[i][j].isMine && gameBoard[i][j].isFlagged) {
                    flaggedMines++;
                }
            }
        }
        
        const totalNonMines = boardSize * boardSize - numMines;
        if (revealedCount === totalNonMines || flaggedMines === numMines && flaggedCellsCount === numMines) {
            gameOver(true);
        }
    }

    // Finaliza el juego y muestra el resultado
    function gameOver(hasWon) {
        isGameOver = true;
        clearInterval(timerInterval);
        
        if (hasWon) {
            alert('🎉 ¡Has ganado! 🎉');
        } else {
            alert('💥 ¡Has perdido! 💥');
            // Revelar todas las minas
            minesLocation.forEach(mine => {
                const mineCell = board.children[mine.row * boardSize + mine.col];
                mineCell.querySelector('span').textContent = '💣';
                mineCell.classList.add('mine');
            });
        }
    }

    // Inicia el contador de tiempo
    function startTimer() {
        timerInterval = setInterval(() => {
            time++;
            timerDisplay.textContent = `⏰: ${time}`;
        }, 1000);
    }

    // Inicia el juego al cargar la página
    initGame();
});