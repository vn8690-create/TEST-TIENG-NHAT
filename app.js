/**
 * app.js — NihongoQuest Main Application Controller
 */

const App = (() => {

  // ── State ─────────────────────────────────────────────────
  let state = {
    screen: 'home',       // home | exam | result | review | history
    currentLevel: 'N5',
    currentExam: null,
    currentIndex: 0,
    answers: [],          // { questionId, chosen, correct }
    lives: 3,
    startTime: null,
    questionTimer: null,
    examTimer: null,
    survivalScore: 0,
    selectedChoice: null,
    answered: false,
  };

  // ── DOM refs ──────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  // ── Screen navigation ─────────────────────────────────────
  const showScreen = (name) => {
    $$('.screen').forEach(s => s.classList.remove('active'));
    const el = $(`screen-${name}`);
    if (el) el.classList.add('active');
    state.screen = name;
  };

  // ── Level select ──────────────────────────────────────────
  const selectLevel = async (level) => {
    state.currentLevel = level;
    $$('.level-btn').forEach(b => b.classList.toggle('active', b.dataset.level === level));
    $('selected-level-badge').textContent = level;

    // update progress display
    const prog = Storage.getProgress(level);
    $('progress-answered').textContent = prog.totalAnswered;
    $('progress-correct').textContent  = prog.totalCorrect;
    $('progress-best').textContent     = prog.bestScore + '%';

    // Load data
    try {
      $('data-status').textContent = '読み込み中…';
      await QuestionEngine.loadLevel(level);
      $('data-status').textContent = 'データ準備完了 ✓';
    } catch {
      $('data-status').textContent = 'データエラー';
    }
  };

  // ── Start exam ────────────────────────────────────────────
  const startExam = async (mode) => {
    const level = state.currentLevel;
    const seed  = QuestionEngine.generateSeed();
    let exam;

    switch (mode) {
      case 'mock':     exam = QuestionEngine.buildMockTest(level, seed);   break;
      case 'random':   exam = QuestionEngine.buildRandomExam(level, seed); break;
      case 'quick':    exam = QuestionEngine.buildQuickTest(level, seed);  break;
      case 'survival': exam = QuestionEngine.buildSurvival(level, seed);   break;
      case 'review': {
        const wrongs = Storage.getWrongs();
        if (!wrongs.length) {
          showToast('間違えた問題がありません！', 'info');
          return;
        }
        exam = QuestionEngine.buildWrongReview(wrongs, seed);
        break;
      }
    }

    state.currentExam  = exam;
    state.currentIndex = 0;
    state.answers      = [];
    state.lives        = exam.maxLives || 3;
    state.startTime    = Date.now();
    state.survivalScore= 0;
    state.selectedChoice = null;
    state.answered     = false;

    showScreen('exam');
    renderExamHeader();
    renderQuestion();
    if (exam.timeLimit) startExamTimer(exam.timeLimit);
  };

  // ── Exam header ───────────────────────────────────────────
  const renderExamHeader = () => {
    const exam = state.currentExam;
    $('exam-id').textContent    = exam.examId;
    $('exam-level').textContent = exam.level;
    $('exam-mode').textContent  = modeLabel(exam.type);
    updateProgress();
    if (exam.type === 'survival') renderLives();
  };

  const modeLabel = t => ({
    mock:'Mock Test', random:'Random Exam', quick:'Quick Test',
    survival:'Survival', review:'Ôn tập'
  })[t] || t;

  // ── Lives (Survival) ─────────────────────────────────────
  const renderLives = () => {
    const el = $('lives-display');
    el.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const heart = document.createElement('span');
      heart.className = 'heart ' + (i < state.lives ? 'alive' : 'dead');
      heart.textContent = i < state.lives ? '❤️' : '🖤';
      el.appendChild(heart);
    }
  };

  // ── Progress bar ──────────────────────────────────────────
  const updateProgress = () => {
    const exam = state.currentExam;
    const total = exam.type === 'survival' ? exam.questions.length : exam.questions.length;
    const idx   = state.currentIndex;
    const pct   = Math.min(100, Math.round((idx / total) * 100));

    $('progress-bar-fill').style.width = pct + '%';
    $('progress-count').textContent = `${idx} / ${total}`;

    if (exam.type === 'survival') {
      $('survival-score').textContent = '⚔️ ' + state.survivalScore;
    }
  };

  // ── Exam timer ────────────────────────────────────────────
  const startExamTimer = (seconds) => {
    clearInterval(state.examTimer);
    let remaining = seconds;
    updateTimerDisplay(remaining);
    state.examTimer = setInterval(() => {
      remaining--;
      updateTimerDisplay(remaining);
      if (remaining <= 0) {
        clearInterval(state.examTimer);
        finishExam();
      }
    }, 1000);
  };

  const updateTimerDisplay = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    const el = $('exam-timer');
    el.textContent = `⏱ ${m}:${sec}`;
    el.classList.toggle('urgent', s <= 60);
  };

  // ── Render question ───────────────────────────────────────
  const renderQuestion = () => {
    const exam = state.currentExam;
    if (state.currentIndex >= exam.questions.length) {
      finishExam(); return;
    }

    state.selectedChoice = null;
    state.answered       = false;

    const q = exam.questions[state.currentIndex];
    const settings = Storage.getSettings();

    // Category badge
    const catColors = { kanji:'#FF6B6B', vocab:'#4ECDC4', grammar:'#45B7D1', reading:'#FF9F43' };
    const catEl = $('q-category');
    catEl.textContent = q.category.toUpperCase();
    catEl.style.background = catColors[q.category] || '#888';

    // Question number
    $('q-number').textContent = `Q${state.currentIndex + 1}`;

    // Question text - Display both Japanese and Vietnamese on separate lines
    const questionTextEl = $('q-text');
    questionTextEl.innerHTML = ''; // Clear previous content
    
    const jpQuestion = document.createElement('div');
    jpQuestion.className = 'q-text-jp';
    jpQuestion.textContent = q.question || '';
    questionTextEl.appendChild(jpQuestion);
    
    if (settings.language === 'vi' && q.questionVi) {
      const viQuestion = document.createElement('div');
      viQuestion.className = 'q-text-vi';
      viQuestion.textContent = q.questionVi;
      questionTextEl.appendChild(viQuestion);
    }

    // Kanji display (if present)
    if (q.kanji) {
      $('q-kanji').textContent = q.kanji;
      $('q-kanji').style.display = 'block';
    } else {
      $('q-kanji').style.display = 'none';
    }

    // Choices
    const choicesContainer = $('choices');
    choicesContainer.innerHTML = '';
    const displayChoices = (settings.language === 'vi' && q.choicesVi) ? q.choicesVi : q.choices;

    displayChoices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.dataset.idx = idx;
      btn.innerHTML = `<span class="choice-label">${['Ａ','Ｂ','Ｃ','Ｄ'][idx]}</span><span class="choice-text">${choice}</span>`;
      btn.addEventListener('click', () => selectAnswer(idx));
      choicesContainer.appendChild(btn);
    });

    // Hide explanation
    $('explanation-box').classList.add('hidden');
    $('next-btn').classList.add('hidden');

    // Animate in
    $('question-card').classList.remove('slide-in');
    void $('question-card').offsetWidth;
    $('question-card').classList.add('slide-in');
  };

  // ── Select answer ─────────────────────────────────────────
  const selectAnswer = (choiceIdx) => {
    if (state.answered) return;
    state.answered     = true;
    state.selectedChoice = choiceIdx;

    const q       = state.currentExam.questions[state.currentIndex];
    const correct = choiceIdx === q.answer;
    const settings = Storage.getSettings();

    // Visual feedback on buttons
    $$('.choice-btn').forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.answer) btn.classList.add('correct');
      if (i === choiceIdx && !correct) btn.classList.add('wrong');
    });

    // Record answer
    state.answers.push({ questionId: q.id, chosen: choiceIdx, correct });

    if (correct) {
      if (state.currentExam.type === 'survival') state.survivalScore++;
      playSound('correct');
      showToast('正解！ せいかい！', 'success');
      Storage.removeWrong(q.id); // remove from wrong list if answered correctly
    } else {
      playSound('wrong');
      showToast('不正解... ざんねん', 'error');
      Storage.addWrong(q);
      if (state.currentExam.type === 'survival') {
        state.lives--;
        renderLives();
        if (state.lives <= 0) {
          setTimeout(finishExam, 1200);
          return;
        }
      }
    }

    // Show explanation - Display both Japanese and Vietnamese on separate lines
    if (settings.showExplanation) {
      const explanationBoxEl = $('explanation-box');
      const explanationTextEl = $('explanation-text');
      explanationTextEl.innerHTML = '';
      
      const jpExplanation = document.createElement('div');
      jpExplanation.className = 'exp-text-jp';
      jpExplanation.textContent = q.explanation || '';
      explanationTextEl.appendChild(jpExplanation);
      
      if (settings.language === 'vi' && q.explanationVi) {
        const viExplanation = document.createElement('div');
        viExplanation.className = 'exp-text-vi';
        viExplanation.textContent = q.explanationVi;
        explanationTextEl.appendChild(viExplanation);
      }
      
      explanationBoxEl.classList.remove('hidden');
    }

    updateProgress();
    $('next-btn').classList.remove('hidden');
  };

  // ── Next question ─────────────────────────────────────────
  const nextQuestion = () => {
    state.currentIndex++;
    const exam = state.currentExam;
    if (state.currentIndex >= exam.questions.length) {
      finishExam();
    } else {
      renderQuestion();
    }
  };

  // ── Finish exam ───────────────────────────────────────────
  const finishExam = () => {
    clearInterval(state.examTimer);
    const exam     = state.currentExam;
    const timeUsed = Math.round((Date.now() - state.startTime) / 1000);
    const correct  = state.answers.filter(a => a.correct).length;
    const total    = state.answers.length || 1;

    const scoreData = QuestionEngine.calcScore(correct, total, timeUsed, exam.timeLimit);
    scoreData.mode  = exam.type;
    scoreData.level = exam.level;
    scoreData.examId= exam.examId;
    scoreData.survivalScore = state.survivalScore;

    // Save
    Storage.saveExamResult(scoreData);
    if (exam.level !== 'MIXED') Storage.updateProgress(exam.level, correct, total);

    showResult(scoreData);
  };

  // ── Show result ───────────────────────────────────────────
  const showResult = (data) => {
    showScreen('result');

    $('result-rank').textContent = data.rank.rank;
    $('result-rank').style.color = data.rank.color;
    $('result-label').textContent = data.rank.label;
    $('result-correct').textContent = data.correct;
    $('result-total').textContent   = data.total;
    $('result-pct').textContent     = data.percentage + '%';
    $('result-time').textContent    = formatTime(data.timeUsed);
    $('result-exam-id').textContent = data.examId;
    $('result-level').textContent   = data.level;
    $('result-mode').textContent    = modeLabel(data.mode);

    if (data.mode === 'survival') {
      $('result-survival-row').style.display = 'flex';
      $('result-survival-score').textContent = data.survivalScore;
    } else {
      $('result-survival-row').style.display = 'none';
    }

    // Animate rank
    $('result-rank').classList.remove('pop');
    void $('result-rank').offsetWidth;
    $('result-rank').classList.add('pop');

    // Wrong count update
    $('result-wrong-count').textContent = Storage.getWrongCount();
  };

  // ── History screen ────────────────────────────────────────
  const showHistory = () => {
    showScreen('history');
    const history = Storage.getHistory();
    const list = $('history-list');
    list.innerHTML = '';

    if (!history.length) {
      list.innerHTML = '<div class="empty-state">まだ受験していません</div>';
      return;
    }

    history.forEach(h => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <div class="hi-left">
          <span class="hi-rank" style="color:${h.rank.color}">${h.rank.rank}</span>
          <span class="hi-id">${h.examId}</span>
        </div>
        <div class="hi-center">
          <span>${h.level} · ${modeLabel(h.mode)}</span>
          <span>${h.correct}/${h.total} · ${h.percentage}%</span>
        </div>
        <div class="hi-right">
          <span class="hi-time">${new Date(h.timestamp).toLocaleDateString('ja-JP')}</span>
        </div>`;
      list.appendChild(item);
    });
  };

  // ── Wrong review screen ───────────────────────────────────
  const showWrongList = () => {
    showScreen('wronglist');
    const wrongs = Storage.getWrongs();
    const list = $('wronglist-items');
    list.innerHTML = '';
    $('wronglist-count').textContent = wrongs.length;

    if (!wrongs.length) {
      list.innerHTML = '<div class="empty-state">間違えた問題はありません 🎉</div>';
      return;
    }

    wrongs.forEach(q => {
      const item = document.createElement('div');
      item.className = 'wrong-item';
      item.innerHTML = `
        <div class="wi-q">${q.question}</div>
        <div class="wi-meta">
          <span class="wi-count">✗ ${q.wrongCount}回</span>
          <span class="wi-cat">${q.category}</span>
          <span class="wi-level">${q.level}</span>
          <button class="wi-remove" data-id="${q.id}">削除</button>
        </div>`;
      list.appendChild(item);
    });

    $$('.wi-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        Storage.removeWrong(e.target.dataset.id);
        showWrongList();
      });
    });
  };

  // ── Settings ──────────────────────────────────────────────
  const showSettings = () => {
    showScreen('settings');
    const s = Storage.getSettings();
    $('setting-explanation').checked = s.showExplanation;
    $('setting-timer').checked       = s.timerEnabled;
    $('setting-lang').value          = s.language;
  };

  const saveSettings = () => {
    Storage.saveSettings({
      showExplanation: $('setting-explanation').checked,
      timerEnabled:    $('setting-timer').checked,
      language:        $('setting-lang').value,
    });
    showToast('設定を保存しました', 'success');
  };

  // ── Utilities ─────────────────────────────────────────────
  const formatTime = (s) => {
    if (!s) return '--:--';
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  let toastTimer;
  const showToast = (msg, type = 'info') => {
    const el = $('toast');
    el.textContent = msg;
    el.className   = `toast ${type} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
  };

  const playSound = (type) => {
    // Simple Web Audio API beep
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = type === 'correct' ? 880 : 220;
      osc.type = type === 'correct' ? 'sine' : 'sawtooth';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  // ── Init ──────────────────────────────────────────────────
  const init = async () => {
    // Nav level buttons
    $$('.level-btn').forEach(btn => {
      btn.addEventListener('click', () => selectLevel(btn.dataset.level));
    });

    // Mode buttons
    $$('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => startExam(btn.dataset.mode));
    });

    // Exam controls
    $('next-btn').addEventListener('click', nextQuestion);
    $('quit-exam-btn').addEventListener('click', () => {
      clearInterval(state.examTimer);
      showScreen('home');
    });

    // Result buttons
    $('result-home-btn').addEventListener('click', () => showScreen('home'));
    $('result-retry-btn').addEventListener('click', () => {
      if (state.currentExam) startExam(state.currentExam.type);
    });
    $('result-review-btn').addEventListener('click', () => startExam('review'));

    // Nav buttons
    $('nav-history').addEventListener('click', showHistory);
    $('nav-wrong').addEventListener('click', showWrongList);
    $('nav-settings').addEventListener('click', showSettings);
    $('nav-home').addEventListener('click', () => showScreen('home'));

    // Wrong list
    $('wronglist-start-btn').addEventListener('click', () => startExam('review'));
    $('wronglist-clear-btn').addEventListener('click', () => {
      if (confirm('本当に全部消しますか？')) {
        Storage.clearAll();
        showWrongList();
        showToast('クリアしました', 'info');
      }
    });
    $('wronglist-back-btn').addEventListener('click', () => showScreen('home'));

    // History
    $('history-back-btn').addEventListener('click', () => showScreen('home'));

    // Settings
    $('settings-save-btn').addEventListener('click', saveSettings);
    $('settings-back-btn').addEventListener('click', () => showScreen('home'));
    $('settings-clear-btn').addEventListener('click', () => {
      if (confirm('全データを削除しますか？')) {
        Storage.clearAll();
        showToast('データを削除しました', 'info');
      }
    });

    // Init level
    await selectLevel('N5');
    showScreen('home');

    // Update wrong count badge
    const wc = Storage.getWrongCount();
    if (wc > 0) $('wrong-badge').textContent = wc;
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
