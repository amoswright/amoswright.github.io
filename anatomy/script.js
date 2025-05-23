document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('skeleton-canvas');
    const ctx = canvas.getContext('2d');

    const scoreEl = document.getElementById('score');
    const timerEl = document.getElementById('timer');
    const questionPromptEl = document.getElementById('question-prompt');
    const feedbackMessageEl = document.getElementById('feedback-message');
    const startGameBtn = document.getElementById('start-game-btn');
    const resetGameBtn = document.getElementById('reset-game-btn');
    const questionCountSelect = document.getElementById('question-count');
    const highScoresListEl = document.getElementById('high-scores-list');

    // Simplified bone data: { id, name, x, y, width, height, color, highlightColor }
    const bonesData = [
        { id: 'skull', name: 'Skull', x: canvas.width / 2 - 25, y: 20, width: 50, height: 40, color: '#E0E0E0', highlightColor: '#FFFF00' },
        { id: 'rib_cage', name: 'Rib Cage', x: canvas.width / 2 - 40, y: 70, width: 80, height: 70, color: '#D3D3D3', highlightColor: '#FFFF00' },
        { id: 'pelvis', name: 'Pelvis', x: canvas.width / 2 - 35, y: 150, width: 70, height: 40, color: '#C0C0C0', highlightColor: '#FFFF00' },
        { id: 'left_femur', name: 'Left Femur', x: canvas.width / 2 - 30, y: 200, width: 20, height: 100, color: '#A9A9A9', highlightColor: '#FFFF00' },
        { id: 'right_femur', name: 'Right Femur', x: canvas.width / 2 + 10, y: 200, width: 20, height: 100, color: '#A9A9A9', highlightColor: '#FFFF00' },
        { id: 'left_humerus', name: 'Left Humerus', x: canvas.width / 2 - 60, y: 75, width: 15, height: 60, color: '#BEBEBE', highlightColor: '#FFFF00' },
        { id: 'right_humerus', name: 'Right Humerus', x: canvas.width / 2 + 45, y: 75, width: 15, height: 60, color: '#BEBEBE', highlightColor: '#FFFF00' },
    ];

    let score = 0;
    let timerInterval;
    let secondsElapsed = 0;
    let currentQuestions = [];
    let currentQuestionIndex = -1;
    let highlightedBone = null;
    let gameActive = false;

    function drawBone(bone, isHighlighted = false) {
        ctx.fillStyle = isHighlighted ? bone.highlightColor : bone.color;
        ctx.fillRect(bone.x, bone.y, bone.width, bone.height);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(bone.x, bone.y, bone.width, bone.height);
    }

    function drawSkeleton() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        bonesData.forEach(bone => {
            drawBone(bone, highlightedBone === bone);
        });
    }

    function getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    function isPointInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.width &&
               y >= rect.y && y <= rect.y + rect.height;
    }

    function handleCanvasMouseMove(event) {
        if (!gameActive) return;
        const mousePos = getMousePos(canvas, event);
        let boneUnderMouse = null;
        for (const bone of bonesData) {
            if (isPointInRect(mousePos.x, mousePos.y, bone)) {
                boneUnderMouse = bone;
                break;
            }
        }

        if (highlightedBone !== boneUnderMouse) {
            highlightedBone = boneUnderMouse;
            drawSkeleton();
        }
    }

    function handleCanvasClick(event) {
        if (!gameActive || currentQuestionIndex < 0 || currentQuestionIndex >= currentQuestions.length) return;

        const mousePos = getMousePos(canvas, event);
        let clickedBone = null;
        for (const bone of bonesData) {
            if (isPointInRect(mousePos.x, mousePos.y, bone)) {
                clickedBone = bone;
                break;
            }
        }

        if (clickedBone) {
            checkAnswer(clickedBone.id);
        }
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function generateQuestions(count) {
        const availableBones = [...bonesData];
        shuffleArray(availableBones);
        currentQuestions = availableBones.slice(0, Math.min(count, availableBones.length));
    }

    function displayQuestion() {
        if (currentQuestionIndex < currentQuestions.length) {
            const boneToFind = currentQuestions[currentQuestionIndex];
            questionPromptEl.textContent = `Click on the: ${boneToFind.name}`;
            feedbackMessageEl.textContent = '';
        } else {
            endGame();
        }
    }

    function checkAnswer(clickedBoneId) {
        const correctBoneId = currentQuestions[currentQuestionIndex].id;
        if (clickedBoneId === correctBoneId) {
            score++;
            scoreEl.textContent = score;
            feedbackMessageEl.textContent = 'Correct!';
            feedbackMessageEl.style.color = 'green';
            currentQuestionIndex++;
            setTimeout(displayQuestion, 1000); // Delay for feedback visibility
        } else {
            const clickedBoneObj = bonesData.find(b => b.id === clickedBoneId);
            feedbackMessageEl.textContent = `Incorrect. That was the ${clickedBoneObj ? clickedBoneObj.name : 'empty space'}. Try again.`;
            feedbackMessageEl.style.color = 'red';
        }
    }

    function startTimer() {
        secondsElapsed = 0;
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            secondsElapsed++;
            updateTimerDisplay();
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(secondsElapsed / 60);
        const seconds = secondsElapsed % 60;
        timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function startGame() {
        score = 0;
        currentQuestionIndex = 0;
        gameActive = true;
        scoreEl.textContent = score;
        feedbackMessageEl.textContent = '';
        
        const numQuestions = parseInt(questionCountSelect.value);
        generateQuestions(numQuestions);
        
        if (currentQuestions.length === 0) {
            questionPromptEl.textContent = "No questions available.";
            gameActive = false;
            return;
        }

        displayQuestion();
        startTimer();

        startGameBtn.style.display = 'none';
        resetGameBtn.style.display = 'inline-block';
        questionCountSelect.disabled = true;
    }

    function endGame() {
        gameActive = false;
        stopTimer();
        questionPromptEl.textContent = `Game Over! Final Score: ${score}/${currentQuestions.length}`;
        feedbackMessageEl.textContent = `You took ${timerEl.textContent} to complete the quiz.`;
        feedbackMessageEl.style.color = 'blue';
        saveScore(score, secondsElapsed, currentQuestions.length);
        loadHighScores();
        
        startGameBtn.style.display = 'inline-block';
        startGameBtn.textContent = 'Play Again?';
        resetGameBtn.style.display = 'none'; // Or keep it as a dedicated reset
        questionCountSelect.disabled = false;
        highlightedBone = null; // Clear highlight
        drawSkeleton(); // Redraw to remove highlight
    }

    function resetGame() { // More of a full reset than just play again
        stopTimer();
        gameActive = false;
        score = 0;
        secondsElapsed = 0;
        currentQuestionIndex = -1;
        currentQuestions = [];
        
        scoreEl.textContent = '0';
        updateTimerDisplay();
        questionPromptEl.textContent = 'Click "Start Game" to begin.';
        feedbackMessageEl.textContent = '';
        highlightedBone = null;
        drawSkeleton();

        startGameBtn.style.display = 'inline-block';
        startGameBtn.textContent = 'Start Game';
        resetGameBtn.style.display = 'none';
        questionCountSelect.disabled = false;
    }


    // --- Local Storage for High Scores ---
    const HIGH_SCORES_KEY = 'anatomyQuizHighScores';

    function getHighScores() {
        const scoresJSON = localStorage.getItem(HIGH_SCORES_KEY);
        return scoresJSON ? JSON.parse(scoresJSON) : [];
    }

    function saveScore(currentScore, timeInSeconds, totalQuestions) {
        if (totalQuestions === 0) return; // Don't save if no questions were played

        const highScores = getHighScores();
        const newScoreEntry = {
            score: currentScore,
            total: totalQuestions,
            time: timeInSeconds,
            date: new Date().toLocaleDateString()
        };

        highScores.push(newScoreEntry);
        // Sort by score (desc), then by time (asc)
        highScores.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return a.time - b.time;
        });

        // Keep top 10 scores
        const topScores = highScores.slice(0, 10);
        localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(topScores));
    }

    function formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }

    function loadHighScores() {
        const highScores = getHighScores();
        highScoresListEl.innerHTML = ''; // Clear previous list

        if (highScores.length === 0) {
            highScoresListEl.innerHTML = '<li>No high scores yet. Play a game!</li>';
            return;
        }

        highScores.forEach(entry => {
            const li = document.createElement('li');
            li.textContent = `Score: ${entry.score}/${entry.total} - Time: ${formatTime(entry.time)} - Date: ${entry.date}`;
            highScoresListEl.appendChild(li);
        });
    }

    // --- Event Listeners ---
    startGameBtn.addEventListener('click', startGame);
    resetGameBtn.addEventListener('click', resetGame); // Or could be startGame if button text changes
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('click', handleCanvasClick);

    // --- Initial Setup ---
    function init() {
        drawSkeleton(); // Draw initial skeleton
        loadHighScores();
        resetGameBtn.style.display = 'none'; // Ensure reset is hidden initially
    }

    init();
});

// Helper function (if not already defined or for modules)
/*
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
*/

/*
To improve the skeleton:
1. Use more complex shapes (polygons) instead of just rectangles.
   ctx.beginPath();
   ctx.moveTo(x1, y1);
   ctx.lineTo(x2, y2);
   ...
   ctx.closePath();
   ctx.fill();
   ctx.stroke();
2. For hit detection with polygons, you'd need a point-in-polygon algorithm or use ctx.isPointInPath after redrawing the path invisibly.
3. Consider using an SVG image and manipulating its elements, which simplifies drawing and hit detection for complex shapes.
4. For a truly detailed model, a 2D skeletal animation library or WebGL might be more appropriate, but that significantly increases complexity.
*/