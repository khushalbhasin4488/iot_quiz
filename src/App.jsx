import { useState, useMemo, useCallback, useEffect } from 'react';
import questionsData from './data/questions.json';

// Utility: shuffle array (Fisher-Yates)
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Extract option keys from a question object
function getOptionKeys(q) {
  return Object.keys(q)
    .filter((k) => /^option\d+$/.test(k))
    .sort((a, b) => {
      const na = parseInt(a.replace('option', ''), 10);
      const nb = parseInt(b.replace('option', ''), 10);
      return na - nb;
    });
}

// Phases
const PHASE = {
  START: 'start',
  QUIZ: 'quiz',
  RESULTS: 'results',
};

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export default function App() {
  const [phase, setPhase] = useState(PHASE.START);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState([]);

  // Each question gets shuffled options
  const [shuffledOptions, setShuffledOptions] = useState([]);

  const totalQuestions = questionsData.length;

  // Start quiz
  const startQuiz = useCallback(() => {
    const sq = shuffleArray(questionsData);
    setShuffledQuestions(sq);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setScore(0);
    setWrongAnswers([]);
    setPhase(PHASE.QUIZ);

    // Prepare shuffled options for first question
    const firstQ = sq[0];
    const keys = getOptionKeys(firstQ);
    const opts = keys.map((k) => firstQ[k]);
    setShuffledOptions(shuffleArray(opts));
  }, []);

  // When currentIndex changes, shuffle options for that question
  useEffect(() => {
    if (phase === PHASE.QUIZ && shuffledQuestions.length > 0 && currentIndex < shuffledQuestions.length) {
      const q = shuffledQuestions[currentIndex];
      const keys = getOptionKeys(q);
      const opts = keys.map((k) => q[k]);
      setShuffledOptions(shuffleArray(opts));
    }
  }, [currentIndex, phase, shuffledQuestions]);

  const currentQuestion = phase === PHASE.QUIZ ? shuffledQuestions[currentIndex] : null;

  // Handle option click
  const handleOptionClick = useCallback(
    (optionValue) => {
      if (answered) return;
      setSelectedAnswer(optionValue);
      setAnswered(true);

      const isCorrect = optionValue === currentQuestion.correct_option;
      if (isCorrect) {
        setScore((s) => s + 1);
      } else {
        setWrongAnswers((prev) => [
          ...prev,
          {
            question: currentQuestion,
            selectedAnswer: optionValue,
            questionNumber: currentIndex + 1,
          },
        ]);
      }
    },
    [answered, currentQuestion, currentIndex]
  );

  // Next question
  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= shuffledQuestions.length) {
      setPhase(PHASE.RESULTS);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    }
  }, [currentIndex, shuffledQuestions.length]);

  // Get option class
  const getOptionClass = (optionValue) => {
    if (!answered) return '';
    const isCorrect = optionValue === currentQuestion.correct_option;
    const isSelected = optionValue === selectedAnswer;
    if (isCorrect) return 'correct';
    if (isSelected && !isCorrect) return 'wrong';
    return 'dimmed';
  };

  // Score percentage
  const scorePercent = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  // Circumference for the ring
  const ringRadius = 68;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (scorePercent / 100) * ringCircumference;

  // Score color
  const getScoreColor = () => {
    if (scorePercent >= 80) return 'var(--correct-green)';
    if (scorePercent >= 50) return 'var(--accent-cyan)';
    return 'var(--wrong-red)';
  };

  // Results emoji
  const getResultEmoji = () => {
    if (scorePercent === 100) return '🏆';
    if (scorePercent >= 80) return '🎉';
    if (scorePercent >= 60) return '👏';
    if (scorePercent >= 40) return '💪';
    return '📚';
  };

  const getResultMessage = () => {
    if (scorePercent === 100) return 'Perfect Score!';
    if (scorePercent >= 80) return 'Excellent Work!';
    if (scorePercent >= 60) return 'Good Job!';
    if (scorePercent >= 40) return 'Keep Practicing!';
    return 'Time to Review!';
  };

  return (
    <>
      <div className="app-bg" />
      <div className="app-container">
        {/* ===== START SCREEN ===== */}
        {phase === PHASE.START && (
          <div className="start-screen">
            <div className="start-icon">🧠</div>
            <h1>IoT Quiz Practice</h1>
            <p className="subtitle">Test your Internet of Things knowledge</p>
            <div className="question-count">
              <span className="count-num">{totalQuestions}</span> questions • Randomized order & options
            </div>
            <button className="btn-start" onClick={startQuiz} id="btn-start-quiz">
              Start Quiz
            </button>
          </div>
        )}

        {/* ===== QUIZ SCREEN ===== */}
        {phase === PHASE.QUIZ && currentQuestion && (
          <>
            {/* Header with progress */}
            <div className="quiz-header">
              <div className="progress-section">
                <div className="progress-info">
                  <span className="progress-label">Progress</span>
                  <span className="progress-numbers">
                    <span>{currentIndex + 1}</span> / {totalQuestions}
                  </span>
                </div>
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>
              <div className="score-badge">
                <div className="score-val">{score}</div>
                <div className="score-label">Correct</div>
              </div>
            </div>

            {/* Question Card */}
            <div className="question-card" key={currentIndex}>
              <div className="question-number">Question {currentIndex + 1}</div>
              <div className="question-text">{currentQuestion.question}</div>

              <div className="options-grid">
                {shuffledOptions.map((opt, idx) => (
                  <button
                    key={`${currentIndex}-${idx}`}
                    className={`option-btn ${getOptionClass(opt)}`}
                    onClick={() => handleOptionClick(opt)}
                    disabled={answered}
                    id={`option-${idx}`}
                  >
                    <span className="option-letter">{OPTION_LETTERS[idx]}</span>
                    <span className="option-text">{opt}</span>
                  </button>
                ))}
              </div>

              {answered && (
                <div className="next-section">
                  <button className="btn-next" onClick={handleNext} id="btn-next">
                    {currentIndex + 1 >= totalQuestions ? 'View Results' : 'Next'}
                    <span className="arrow">→</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ===== RESULTS SCREEN ===== */}
        {phase === PHASE.RESULTS && (
          <div className="results-screen">
            <div className="results-header">
              <div className="results-emoji">{getResultEmoji()}</div>
              <h1>{getResultMessage()}</h1>
              <p className="results-subtitle">Here&apos;s how you performed</p>
            </div>

            {/* Score Card */}
            <div className="score-card">
              <div className="score-ring-container">
                <div className="score-ring">
                  <svg width="160" height="160" viewBox="0 0 160 160">
                    <circle className="score-ring-bg" cx="80" cy="80" r={ringRadius} />
                    <circle
                      className="score-ring-fill"
                      cx="80"
                      cy="80"
                      r={ringRadius}
                      stroke={getScoreColor()}
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                    />
                  </svg>
                  <div className="score-ring-text">
                    <span className="score-ring-percent" style={{ color: getScoreColor() }}>
                      {scorePercent}%
                    </span>
                    <span className="score-ring-label">Score</span>
                  </div>
                </div>
              </div>

              <div className="score-stats">
                <div className="stat">
                  <span className="stat-value green">{score}</span>
                  <span className="stat-label">Correct</span>
                </div>
                <div className="stat">
                  <span className="stat-value red">{totalQuestions - score}</span>
                  <span className="stat-label">Wrong</span>
                </div>
                <div className="stat">
                  <span className="stat-value" style={{ color: 'var(--text-primary)' }}>
                    {totalQuestions}
                  </span>
                  <span className="stat-label">Total</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="results-actions">
              <button className="btn-restart" onClick={startQuiz} id="btn-restart">
                🔄 Restart Quiz
              </button>
            </div>

            {/* Wrong Answers Review */}
            {wrongAnswers.length > 0 ? (
              <div className="review-section">
                <div className="review-title">
                  Review Wrong Answers
                  <span className="review-count">{wrongAnswers.length}</span>
                </div>

                {wrongAnswers.map((item, idx) => {
                  const q = item.question;
                  const keys = getOptionKeys(q);
                  const allOptions = keys.map((k) => q[k]);

                  return (
                    <div className="review-card" key={idx}>
                      <div className="review-q-num">Question {item.questionNumber}</div>
                      <div className="review-q-text">{q.question}</div>
                      <div className="review-options">
                        {allOptions.map((opt, oIdx) => {
                          const isCorrect = opt === q.correct_option;
                          const isWrongSelected = opt === item.selectedAnswer;
                          let cls = 'review-neutral';
                          let marker = OPTION_LETTERS[oIdx];
                          if (isCorrect) {
                            cls = 'review-correct';
                            marker = '✓';
                          } else if (isWrongSelected) {
                            cls = 'review-wrong';
                            marker = '✗';
                          }
                          return (
                            <div className={`review-option ${cls}`} key={oIdx}>
                              <span className="review-option-marker">{marker}</span>
                              <span>{opt}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="all-correct-msg">
                <div className="celebration-emoji">🌟</div>
                <p>You got every single question right! Amazing!</p>
              </div>
            )}
          </div>
        )}
        {/* ===== FOOTER ===== */}
        <footer className="site-footer">
          <span className="footer-name">Made by Khushal Bhasin</span>
          <div className="footer-links">
            <a href="https://github.com/khushalbhasin4488" target="_blank" rel="noopener noreferrer" className="footer-link" id="link-github">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
              GitHub
            </a>
            <a href="https://www.linkedin.com/in/khushal-bhasin-78504a284" target="_blank" rel="noopener noreferrer" className="footer-link" id="link-linkedin">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              LinkedIn
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}
