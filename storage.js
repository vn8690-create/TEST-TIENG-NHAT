/**
 * storage.js — NihongoQuest LocalStorage Manager
 * Handles: progress, exam history, wrong answers, settings
 */

const Storage = (() => {
  const KEYS = {
    HISTORY: 'nq_history',
    WRONG:   'nq_wrong',
    SETTINGS:'nq_settings',
    PROGRESS:'nq_progress',
  };

  // ── helpers ──────────────────────────────────────────────
  const get = (key) => {
    try { return JSON.parse(localStorage.getItem(key)) || null; }
    catch { return null; }
  };
  const set = (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch { return false; }
  };

  // ── Exam History ─────────────────────────────────────────
  const saveExamResult = (result) => {
    const history = get(KEYS.HISTORY) || [];
    history.unshift({ ...result, timestamp: Date.now() });
    if (history.length > 50) history.pop(); // keep last 50
    set(KEYS.HISTORY, history);
  };

  const getHistory = () => get(KEYS.HISTORY) || [];

  // ── Wrong Answers ─────────────────────────────────────────
  const addWrong = (question) => {
    const wrongs = get(KEYS.WRONG) || {};
    const id = question.id;
    if (!wrongs[id]) {
      wrongs[id] = { ...question, wrongCount: 1, lastWrong: Date.now() };
    } else {
      wrongs[id].wrongCount++;
      wrongs[id].lastWrong = Date.now();
    }
    set(KEYS.WRONG, wrongs);
  };

  const removeWrong = (questionId) => {
    const wrongs = get(KEYS.WRONG) || {};
    delete wrongs[questionId];
    set(KEYS.WRONG, wrongs);
  };

  const getWrongs = () => {
    const wrongs = get(KEYS.WRONG) || {};
    return Object.values(wrongs).sort((a, b) => b.lastWrong - a.lastWrong);
  };

  const getWrongCount = () => Object.keys(get(KEYS.WRONG) || {}).length;

  // ── Progress (per level) ──────────────────────────────────
  const getProgress = (level) => {
    const all = get(KEYS.PROGRESS) || {};
    return all[level] || { totalAnswered: 0, totalCorrect: 0, bestScore: 0 };
  };

  const updateProgress = (level, correct, total) => {
    const all = get(KEYS.PROGRESS) || {};
    const prev = all[level] || { totalAnswered: 0, totalCorrect: 0, bestScore: 0 };
    const pct = Math.round((correct / total) * 100);
    all[level] = {
      totalAnswered: prev.totalAnswered + total,
      totalCorrect:  prev.totalCorrect  + correct,
      bestScore:     Math.max(prev.bestScore, pct),
    };
    set(KEYS.PROGRESS, all);
  };

  // ── Settings ──────────────────────────────────────────────
  const getSettings = () => get(KEYS.SETTINGS) || {
    showExplanation: true,
    timerEnabled: true,
    language: 'vi', // 'ja' or 'vi'
  };

  const saveSettings = (s) => set(KEYS.SETTINGS, { ...getSettings(), ...s });

  // ── Clear ─────────────────────────────────────────────────
  const clearAll = () => {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  };

  return {
    saveExamResult, getHistory,
    addWrong, removeWrong, getWrongs, getWrongCount,
    getProgress, updateProgress,
    getSettings, saveSettings,
    clearAll,
  };
})();
