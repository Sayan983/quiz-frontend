// quiz.js

// === Redirect if not logged in ===
const username = localStorage.getItem("quizUsername");
if (!username) {
  window.location.href = "index.html#login";
}

// Display username in header
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("user-name").innerText = username;
});

function logout() {
  localStorage.removeItem("quizUsername");
  window.location.href = "index.html#login";
}

let currentQuestionIndex = 0;
let score = 0;
let questions = [];
let timerInterval;
let currentCategoryName = "";

const correctSound = new Audio('correct-answer.mp3');
const incorrectSound = new Audio('incorrect-answer.mp3');

// === Fetch Questions ===
async function fetchQuestions(category, categoryName) {
  currentCategoryName = categoryName;
  try {
    const response = await fetch(`https://opentdb.com/api.php?amount=5&category=${category}&type=multiple`);
    const data = await response.json();
    if (data.response_code === 0) {
      questions = data.results.map(item => {
        let options = [...item.incorrect_answers, item.correct_answer];
        // shuffle
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [options[i], options[j]] = [options[j], options[i]];
        }
        return {
          question: item.question,
          options: options,
          correctAnswer: item.correct_answer
        };
      });
      startQuiz();
    } else {
      throw new Error();
    }
  } catch {
    alert('Failed to load questions.');
  }
}

function selectCategory() {
  const categorySelect = document.getElementById('category-select');
  const selectedCategory = categorySelect.value;
  const categoryName = categorySelect.options[categorySelect.selectedIndex].text;
  fetchQuestions(selectedCategory, categoryName);
}

function startQuiz() {
  currentQuestionIndex = 0;
  score = 0;
  document.getElementById('quiz').innerHTML = `
    <div id="question-container">
      <div class="question"></div>
      <div class="options"></div>
    </div>
    <div id="feedback"></div>
    <div id="timer"></div>
    <button id="next-button" onclick="nextQuestion()" style="display:none;">Next Question</button>
    <div id="score"></div>`;
  loadQuestion();
  startTimer();
}

function loadQuestion() {
  const q = questions[currentQuestionIndex];
  document.querySelector('.question').innerHTML = q.question;
  const optionsContainer = document.querySelector('.options');
  optionsContainer.innerHTML = '';
  q.options.forEach(option => {
    const btn = document.createElement('button');
    btn.classList.add('option');
    btn.innerHTML = option;
    btn.onclick = () => checkAnswer(option);
    optionsContainer.appendChild(btn);
  });
}

function startTimer() {
  let timeLeft = 15;
  document.getElementById('timer').innerText = `Time Left: ${timeLeft} sec`;
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('timer').innerText = `Time Left: ${timeLeft} sec`;
    if (!timeLeft) {
      clearInterval(timerInterval);
      nextQuestion();
    }
  }, 1000);
}

function checkAnswer(selected) {
  clearInterval(timerInterval);
  const q = questions[currentQuestionIndex];
  const options = document.querySelectorAll('.option');
  options.forEach(o => o.disabled = true);
  document.getElementById('next-button').style.display = 'inline-block';

  if (selected === q.correctAnswer) {
    document.getElementById('feedback').innerText = "✅ Correct!";
    score++;
    correctSound.play();
  } else {
    document.getElementById('feedback').innerText = `❌ Incorrect! Correct: ${q.correctAnswer}`;
    incorrectSound.play();
  }
  document.getElementById('score').innerText = `Score: ${score}`;
}

function nextQuestion() {
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    loadQuestion();
    document.getElementById('next-button').style.display = 'none';
    document.getElementById('feedback').innerHTML = '';
    startTimer();
  } else {
    showQuizCompleted();
  }
}

function showQuizCompleted() {
  saveAnalytics();
  document.getElementById('quiz').innerHTML = `
    <h2>Quiz Completed!</h2>
    <p>Your score: ${score}/${questions.length}</p>
    <button class="primary-cta" onclick="showAnalytics()">📊 View Analytics</button>
    <button class="primary-cta" onclick="window.location.reload()">Play Again</button>`;
}

// === Analytics Save and Display ===
function saveAnalytics() {
  let allResults = JSON.parse(localStorage.getItem("quizResults") || "[]");
  allResults.push({
    username,
    category: currentCategoryName,
    score: score,
    total: questions.length,
    date: new Date().toLocaleString()
  });
  localStorage.setItem("quizResults", JSON.stringify(allResults));
}

function showAnalytics() {
  let allResults = JSON.parse(localStorage.getItem("quizResults") || "[]");
  if (!allResults.length) {
    document.getElementById('quiz').innerHTML = `<p>No analytics data available yet.</p>`;
    return;
  }
  let tableHTML = `
    <h2>Quiz Analytics</h2>
    <table cellpadding="8" style="width:100%; text-align:center;">
      <tr>
        <th>Username</th>
        <th>Category</th>
        <th>Score</th>
        <th>Total</th>
        <th>Date</th>
      </tr>`;
  allResults.forEach(r => {
    tableHTML += `
      <tr>
        <td>${r.username}</td>
        <td>${r.category}</td>
        <td>${r.score}</td>
        <td>${r.total}</td>
        <td>${r.date}</td>
      </tr>`;
  });
  tableHTML += `</table>
    <button class="primary-cta" onclick="window.location.reload()">Play Again</button>`;
  document.getElementById('quiz').innerHTML = tableHTML;
}
