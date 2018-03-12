(function(){
'use strict';

const DIRECTIONS = {
    left: 37,
    up: 38,
    right: 39,
    down: 40
};

const GAME_START_KEYS = {
    enter: 13,
    space: 32
};

const CELLTYPE = {
    basic: 'snake-game__matrix-cell',
    snakeBody: 'snake-game__matrix-cell_snake-body',
    food: 'snake-game__matrix-cell_food',
    gameOverSnakeHead: 'snake-game__matrix-cell_game-over-snake-head'
};

const MIN_CRAWLING_INTERVAL = 100;
const MAX_CRAWLING_INTERVAL = 1000;

class SnakeGame {
    constructor(containerElement, matrixSize, fadeDelay, crawlingInterval) {
        this.containerElement = containerElement;
        this.matrixSize = matrixSize;
        this.fadeDelay = fadeDelay;
        this.crawlingInterval = crawlingInterval;
    }

    init() {
        this.contentElement = this.containerElement.find('.snake-game__content');
        this.matrixElement = this.containerElement.find('.snake-game__matrix');
        this.infoElement = this.containerElement.find('.snake-game__msg');
        this.bodyLengthOutputElement = this.containerElement.find('.snake-game__snake-body-length-info-value');
        this.startGameButtonElement = this.containerElement.find('.snake-game__button_start');
        this.crawlingIntervalInputElement = this.containerElement.find('.snake-game__config-input');
        this.crawlingIntervalInputElement.prop('min', MIN_CRAWLING_INTERVAL);
        this.crawlingIntervalInputElement.prop('max', MAX_CRAWLING_INTERVAL);

        this.GAME_OVER_MESSAGE = `Game over %-(`;

        this.READY_TO_RUN_MESSAGE = `Get food and prevent collision with borders and your tail.<br>
                                Use arrow keys to change crawling direction.`;

        this.startGameButtonElement.click(this.startGameLoop.bind(this));

        this.crawlingIntervalInputElement.bind('change keyup input click',
            this.validateCrawlingIntervalOnChange.bind(this));

        this.crawlingIntervalInputElement.blur(this.validateCrawlingIntervalOnBlur.bind(this));

        this.initCrawlingInterval();

        this.containerElement.keydown(this.keydownHandler.bind(this));
        this.readyToRun();
    }

    readyToRun() {
        this.buildMatrix();

        this.createSnake();
        this.createFood();

        this.infoElement.html(this.READY_TO_RUN_MESSAGE);
        this.infoElement.attr('class', 'snake-game__msg');

        this.contentElement.fadeIn(this.fadeDelay);
        this.enableGameConfigForm();
        this.crawlingIntervalInputElement.focus();
    }

    initCrawlingInterval() {
        this.crawlingIntervalInputElement.val(this.crawlingInterval);
        this.validateCrawlingIntervalOnChange();
        this.validateCrawlingIntervalOnBlur();
    }

    validateCrawlingIntervalOnChange() {
        var value = this.crawlingIntervalInputElement.val();
        this.crawlingInterval = Number(value);

        if (this.crawlingInterval > MAX_CRAWLING_INTERVAL) {
            this.crawlingInterval = MAX_CRAWLING_INTERVAL;
        }

        if (String(this.crawlingInterval) !== value) {
            this.crawlingIntervalInputElement.val(this.crawlingInterval);
        }
    }

    validateCrawlingIntervalOnBlur() {
        if (this.crawlingInterval >= MIN_CRAWLING_INTERVAL) {
            return;
        }

        this.crawlingInterval = MIN_CRAWLING_INTERVAL;
        this.crawlingIntervalInputElement.val(MIN_CRAWLING_INTERVAL);
    }

    buildMatrix() {
        this.matrixElement.html('');

        for (let i = 0; i < this.matrixSize * this.matrixSize; i++) {
            $('<div>')
            .addClass(CELLTYPE.basic)
            .appendTo(this.matrixElement);
        }
    }

    createSnake() {
        this.snake = { body: [] };
        this.snake.body[0] = this.getRandomMatrixPosition();
        this.setSnakeBodyPart(this.snake.body[0]);

        do {
            this.initSnakeDirection();
        } while ( !this.isSnakePositionPrudent() );
    }

    initSnakeDirection() {
        const { up, down, left, right } = DIRECTIONS;
        const directions = [ up, down, left, right ];
        this.snake.direction = directions[ getRandInt(0, 3) ];
    }

    isSnakePositionPrudent() {
        return (
            (this.snake.direction !== DIRECTIONS.left  || this.snake.body[0].col > 2) &&
            (this.snake.direction !== DIRECTIONS.up    || this.snake.body[0].row > 2) &&
            (this.snake.direction !== DIRECTIONS.right || this.snake.body[0].col < this.matrixSize - 1) &&
            (this.snake.direction !== DIRECTIONS.down  || this.snake.body[0].row < this.matrixSize - 1)
        );
    }

    setSnakeBodyPart(snakeBodyPartPosition) {
        this.setCell(snakeBodyPartPosition, CELLTYPE.snakeBody);
        this.bodyLengthOutputElement.html(this.snake.body.length);
    }

    setCell(position, cellType = CELLTYPE.basic) {
        const cellIndex = (position.row - 1) * this.matrixSize + position.col - 1;
        const cellElement = this.matrixElement.children().eq(cellIndex);

        cellElement.attr('class', CELLTYPE.basic);

        if (cellType !== CELLTYPE.basic) {
            cellElement.addClass(cellType);
        }
    }

    getRandomMatrixPosition() {
        const matrixPosition = {};

        matrixPosition.row = getRandInt(1, this.matrixSize);
        matrixPosition.col = getRandInt(1, this.matrixSize);

        return matrixPosition;
    }

    createFood() {
        do {
            this.food = this.getRandomMatrixPosition();
        } while (this.isFoodSnakeCollapse());

        this.setFood();
    }

    isPositionsEqual(position1, position2) {
        return position1.row === position2.row && position1.col === position2.col;
    }

    isSnakeCollapse(position, index) {
        for (let i = index; i < this.snake.body.length; i++) {
            if (this.isPositionsEqual(position, this.snake.body[i])) {
                return true;
            }
        }

        return false;
    }

    isFoodSnakeCollapse() {
        return this.isSnakeCollapse(this.food, 0);
    }

    isSnakeHeadTailCollapse(newHeadPosition) {
        return this.isSnakeCollapse(newHeadPosition, 3);
    }

    setFood() {
        this.setCell(this.food, CELLTYPE.food);
    }

    setGameOverSnakeHead() {
        this.setCell(this.snake.body[0], CELLTYPE.gameOverSnakeHead);
    }

    enableGameConfigForm() {
        this.startGameButtonElement.prop('disabled', false);
        this.crawlingIntervalInputElement.prop('disabled', false);
    }

    disableGameConfigForm() {
        this.crawlingIntervalInputElement.prop('disabled', true);
        this.startGameButtonElement.prop('disabled', true);
    }

    startGameLoop() {
        this.gameLoopRuns = true;
        this.disableGameConfigForm();
        this.containerElement.focus();
        this.crawlingIntervalId = setInterval(() => this.gameLoop(), this.crawlingInterval);
    }

    gameLoop() {
        const newHeadPosition = _.cloneDeep(this.snake.body[0]);

        if (this.snake.newDirection) {
            this.snake.direction = this.snake.newDirection;
            this.snake.newDirection = false;
        }

        switch (this.snake.direction) {
            case DIRECTIONS.right:
                newHeadPosition.col++;
                break;
            case DIRECTIONS.left:
                newHeadPosition.col--;
                break;
            case DIRECTIONS.down:
                newHeadPosition.row++;
                break;
            case DIRECTIONS.up:
                newHeadPosition.row--;
                break;
        }

        if (this.isSnakeHitMatrixBorder(newHeadPosition) || this.isSnakeHeadTailCollapse(newHeadPosition)) {
            this.gameOver();
            return;
        }

        if (this.isSnakeGetFood(newHeadPosition)) {
            this.eatFood(newHeadPosition);
            this.createFood(newHeadPosition);
            return;
        }

        this.snakeCrawl(newHeadPosition);
    }

    isSnakeHitMatrixBorder(newHeadPosition) {
        return (
            newHeadPosition.row < 1 ||
            newHeadPosition.row > this.matrixSize ||
            newHeadPosition.col < 1 ||
            newHeadPosition.col > this.matrixSize
        );
    }

    gameOver() {
        clearInterval(this.crawlingIntervalId);
        this.setGameOverSnakeHead();

        this.infoElement.html(this.GAME_OVER_MESSAGE);
        this.infoElement.addClass('snake-game__msg_game-over');

        this.gameLoopRuns = false;

        this.reset();
    }

    isSnakeGetFood(newHeadPosition) {
        return this.food.col === newHeadPosition.col &&
               this.food.row === newHeadPosition.row;
    }

    eatFood(newHeadPosition) {
        this.snake.body.unshift(newHeadPosition);
        this.setSnakeBodyPart(newHeadPosition);
    }

    snakeCrawl(newSnakeHeadPosition) {
        let lastBodyPartPosition,
            newBodyPartPosition = newSnakeHeadPosition;

        for (let i = 0; i < this.snake.body.length; i++) {
            lastBodyPartPosition = _.cloneDeep(this.snake.body[i]);
            this.snake.body[i] = _.cloneDeep(newBodyPartPosition);
            this.snakeBodyPartCrawl(lastBodyPartPosition, this.snake.body[i]);
            newBodyPartPosition = _.cloneDeep(lastBodyPartPosition);
        }
    }

    snakeBodyPartCrawl(lastBodyPartPosition, newBodyPartPosition) {
        this.setCell(lastBodyPartPosition);
        this.setCell(newBodyPartPosition, CELLTYPE.snakeBody);
    }

    isArrowKeyCode(keyCode) {
        return _.includes(DIRECTIONS, keyCode);
    }

    isInputEditKeyCode(keyCode) {
        return (this.isArrowKeyCode(keyCode) ||
                keyCode === 8 ||
                keyCode === 9 ||
                keyCode === 46 ||
                keyCode >= 48 && keyCode <= 57 ||
                keyCode >= 96 && keyCode <= 105);
    }

    isGameStartKeyCode(keyCode) {
        return _.includes(GAME_START_KEYS, keyCode);
    }

    getOppositeArrowKeyCode(arrowKeyCode) {
        switch (arrowKeyCode) {
            case DIRECTIONS.up:
                return DIRECTIONS.down;
            case DIRECTIONS.down:
                return DIRECTIONS.up;
            case DIRECTIONS.left:
                return DIRECTIONS.right;
            case DIRECTIONS.right:
                return DIRECTIONS.left;
        }
    }

    keydownHandler(e) {
        if (!this.gameLoopRuns && this.isGameStartKeyCode(e.keyCode)) {
            this.validateCrawlingIntervalOnBlur();
            this.startGameLoop();
            return false;
        }

        if (!this.gameLoopRuns && !this.isInputEditKeyCode(e.keyCode)) {
            return false;
        }

        if (this.gameLoopRuns && this.isArrowKeyCode(e.keyCode)) {
            this.changeSnakeDirection(e.keyCode);
            return false;
        }
    }

    changeSnakeDirection(arrowKeyCode) {
        if (this.snake.direction === this.getOppositeArrowKeyCode(arrowKeyCode) &&
            this.snake.body.length > 1) {
                return;
        }

        this.snake.newDirection = arrowKeyCode;
   }

    reset() {
        this.contentElement.fadeOut(this.fadeDelay, this.readyToRun.bind(this));
    }
} // end of class SnakeGame

    window.addEventListener('load', function () {
        const snakeGame = new SnakeGame($('#snake-game'), 20, 1100, 333);

        snakeGame.init();
    });

    function getRandInt(min, max) {
        if (max < min) {
            [min, max] = [max, min];
        }

        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
})();
