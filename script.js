// script.js

const gameBoard = document.getElementById('game-board');
const nextBlockDisplay = document.getElementById('next-block');
const scoreDisplay = document.getElementById('score');
const linesDisplay = document.getElementById('lines');
const levelDisplay = document.getElementById('level');
const startButton = document.getElementById('start-button');

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 25; // CSS에서 정의한 셀 크기와 동일하게

let board = [];
let currentTetromino = null;
let nextTetromino = null;
let score = 0;
let lines = 0;
let level = 1;
let gameInterval;
let gameSpeed = 1000; // 블록이 떨어지는 속도 (ms)

// 테트로미노 모양 정의 (각 블록의 회전 형태 포함)
const TETROMINOS = {
    'I': {
        shape: [
            [[0,0], [1,0], [2,0], [3,0]],
            [[1,0], [1,1], [1,2], [1,3]]
        ],
        color: 'cyan'
    },
    'J': {
        shape: [
            [[0,0], [0,1], [1,1], [2,1]],
            [[1,0], [2,0], [1,1], [1,2]],
            [[0,1], [1,1], [2,1], [2,2]],
            [[1,0], [1,1], [0,2], [1,2]]
        ],
        color: 'blue'
    },
    'L': {
        shape: [
            [[0,1], [1,1], [2,1], [2,0]],
            [[1,0], [1,1], [1,2], [2,2]],
            [[0,2], [0,1], [1,1], [2,1]],
            [[0,0], [1,0], [1,1], [1,2]]
        ],
        color: 'orange'
    },
    'O': {
        shape: [
            [[0,0], [1,0], [0,1], [1,1]]
        ],
        color: 'yellow'
    },
    'S': {
        shape: [
            [[1,0], [2,0], [0,1], [1,1]],
            [[0,0], [0,1], [1,1], [1,2]]
        ],
        color: 'limegreen'
    },
    'T': {
        shape: [
            [[1,0], [0,1], [1,1], [2,1]],
            [[1,0], [1,1], [2,1], [1,2]],
            [[0,1], [1,1], [2,1], [1,2]],
            [[0,1], [1,0], [1,1], [1,2]]
        ],
        color: 'purple'
    },
    'Z': {
        shape: [
            [[0,0], [1,0], [1,1], [2,1]],
            [[2,0], [1,1], [2,1], [1,2]]
        ],
        color: 'red'
    }
};

// 게임 보드 초기화 함수
function initBoard() {
    gameBoard.innerHTML = ''; // 기존 보드 초기화
    board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0)); // 0은 빈 셀
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            gameBoard.appendChild(cell);
        }
    }
}

// 블록 렌더링 함수
function drawTetromino() {
    // 현재 블록 지우기 (이동 전에)
    if (currentTetromino) {
        currentTetromino.shape[currentTetromino.rotation].forEach(segment => {
            const [y, x] = segment;
            const cell = gameBoard.querySelector(`[data-row="${currentTetromino.y + y}"][data-col="${currentTetromino.x + x}"]`);
            if (cell) {
                cell.classList.remove('tetromino', currentTetromino.colorClass);
            }
        });
    }

    // 보드 상태에 따라 모든 블록 다시 그리기
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = gameBoard.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (board[r][c] !== 0) {
                cell.classList.add('tetromino', board[r][c]); // board[r][c]에 색상 클래스 저장
            } else {
                cell.classList.remove('tetromino', 'I', 'J', 'L', 'O', 'S', 'T', 'Z'); // 모든 테트로미노 클래스 제거
            }
        }
    }

    // 현재 블록 그리기
    if (currentTetromino) {
        currentTetromino.shape[currentTetromino.rotation].forEach(segment => {
            const [y, x] = segment;
            const cell = gameBoard.querySelector(`[data-row="${currentTetromino.y + y}"][data-col="${currentTetromino.x + x}"]`);
            if (cell) {
                cell.classList.add('tetromino', currentTetromino.colorClass);
            }
        });
    }
}

// 랜덤 테트로미노 생성
function createTetromino() {
    const tetrominoNames = Object.keys(TETROMINOS);
    const randomName = tetrominoNames[Math.floor(Math.random() * tetrominoNames.length)];
    const tetrominoData = TETROMINOS[randomName];

    return {
        name: randomName,
        shape: tetrominoData.shape,
        colorClass: randomName, // CSS 클래스 이름으로 사용
        x: Math.floor(COLS / 2) - 1, // 중앙에서 시작
        y: 0, // 맨 위에서 시작
        rotation: 0
    };
}

// 다음 블록 미리보기 렌더링
function drawNextTetromino() {
    nextBlockDisplay.innerHTML = ''; // 초기화
    const shapeToDraw = nextTetromino.shape[0]; // 첫 번째 회전 형태
    
    // 4x4 그리드 생성
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell'); // 일반 셀 스타일 적용
            nextBlockDisplay.appendChild(cell);
        }
    }

    // 다음 블록 그리기
    shapeToDraw.forEach(segment => {
        const [y, x] = segment;
        // 4x4 그리드에 맞게 인덱스 계산
        const cellIndex = (y * 4) + x;
        const cell = nextBlockDisplay.children[cellIndex];
        if (cell) {
            cell.classList.add('tetromino', nextTetromino.colorClass);
        }
    });
}

// 게임 시작 함수
function startGame() {
    initBoard();
    score = 0;
    lines = 0;
    level = 1;
    scoreDisplay.textContent = score;
    linesDisplay.textContent = lines;
    levelDisplay.textContent = level;

    nextTetromino = createTetromino();
    spawnTetromino();
    drawNextTetromino();

    clearInterval(gameInterval);
    gameInterval = setInterval(moveDown, gameSpeed);
}

// 새 블록 스폰
function spawnTetromino() {
    currentTetromino = nextTetromino;
    nextTetromino = createTetromino();
    drawNextTetromino();

    if (checkCollision(0, 0, currentTetromino.rotation)) {
        // 게임 오버
        clearInterval(gameInterval);
        alert('게임 오버!');
        startButton.textContent = '다시 시작';
        return false;
    }
    drawTetromino();
    return true;
}

// 충돌 감지 함수
function checkCollision(offsetX, offsetY, newRotation) {
    const currentShape = currentTetromino.shape[newRotation];
    for (const segment of currentShape) {
        const [y, x] = segment;
        const newX = currentTetromino.x + x + offsetX;
        const newY = currentTetromino.y + y + offsetY;

        // 보드 경계를 벗어나는지 확인
        if (newX < 0 || newX >= COLS || newY >= ROWS) {
            return true;
        }
        // 보드 내부의 다른 블록과 충돌하는지 확인 (newY가 0보다 클 때만)
        if (newY >= 0 && board[newY][newX] !== 0) {
            return true;
        }
    }
    return false;
}

// 블록을 보드에 고정하는 함수
function solidifyTetromino() {
    currentTetromino.shape[currentTetromino.rotation].forEach(segment => {
        const [y, x] = segment;
        const boardX = currentTetromino.x + x;
        const boardY = currentTetromino.y + y;
        if (boardY >= 0) { // 보드 위로 올라간 블록은 고정하지 않음
            board[boardY][boardX] = currentTetromino.colorClass;
        }
    });
}

// 블록 아래로 이동
function moveDown() {
    if (!checkCollision(0, 1, currentTetromino.rotation)) {
        currentTetromino.y++;
    } else {
        solidifyTetromino();
        clearLines(); // 라인 클리어 함수 호출
        // 새로운 블록 스폰
        if (!spawnTetromino()) {
            return; // 게임 오버 시 종료
        }
    }
    drawTetromino();
}

// 라인 클리어 함수
function clearLines() {
    let linesClearedThisTurn = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r].every(cell => cell !== 0)) {
            // 줄이 가득 찼으면 제거하고 맨 위에 새 줄 추가
            board.splice(r, 1);
            board.unshift(Array(COLS).fill(0));
            linesClearedThisTurn++;
            r++; // 현재 줄이 제거되었으므로 인덱스 조정
        }
    }

    if (linesClearedThisTurn > 0) {
        lines += linesClearedThisTurn;
        linesDisplay.textContent = lines;
        updateScore(linesClearedThisTurn);
        updateLevel();
    }
}

// 점수 업데이트 함수
function updateScore(linesCleared) {
    const scorePerLine = [0, 100, 300, 500, 800]; // 1줄, 2줄, 3줄, 4줄 클리어 시 점수
    score += scorePerLine[linesCleared] * level;
    scoreDisplay.textContent = score;
}

// 레벨 업데이트 함수
function updateLevel() {
    const newLevel = Math.floor(lines / 10) + 1; // 10줄마다 레벨업
    if (newLevel > level) {
        level = newLevel;
        levelDisplay.textContent = level;
        gameSpeed = Math.max(100, 1000 - (level - 1) * 100); // 레벨업 시 속도 증가 (최소 100ms)
        clearInterval(gameInterval);
        gameInterval = setInterval(moveDown, gameSpeed);
    }
}

// 키보드 이벤트 리스너
document.addEventListener('keydown', (e) => {
    if (!currentTetromino) return;

    switch (e.key) {
        case 'ArrowLeft':
            if (!checkCollision(-1, 0, currentTetromino.rotation)) {
                currentTetromino.x--;
            }
            break;
        case 'ArrowRight':
            if (!checkCollision(1, 0, currentTetromino.rotation)) {
                currentTetromino.x++;
            }
            break;
        case 'ArrowDown':
            moveDown();
            score += 1; // 소프트 드롭 점수
            scoreDisplay.textContent = score;
            break;
        case 'ArrowUp': // 회전
            const newRotation = (currentTetromino.rotation + 1) % currentTetromino.shape.length;
            if (!checkCollision(0, 0, newRotation)) {
                currentTetromino.rotation = newRotation;
            }
            break;
        case ' ': // 스페이스바 (하드 드롭)
            while (!checkCollision(0, 1, currentTetromino.rotation)) {
                currentTetromino.y++;
                score += 2; // 하드 드롭 점수
            }
            solidifyTetromino();
            clearLines(); // 라인 클리어 함수 호출
            if (!spawnTetromino()) {
                return; // 게임 오버 시 종료
            }
            scoreDisplay.textContent = score;
            break;
    }
    drawTetromino();
});

startButton.addEventListener('click', () => {
    if (startButton.textContent === 'START GAME' || startButton.textContent === '다시 시작') {
        startGame();
        startButton.textContent = '게임 중'; // 게임 시작 후 버튼 텍스트 변경
    }
});

// 초기 게임 보드 렌더링 (시작 전)
initBoard();
