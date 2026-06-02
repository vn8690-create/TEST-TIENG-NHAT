/**
 * questionEngine.js — NihongoQuest Random Engine
 * Generates deterministic or seeded exam sets from data pools
 */

const QuestionEngine = (() => {

  // ── Seeded RNG (Mulberry32) ───────────────────────────────
  const mulberry32 = (seed) => {
    return () => {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };

  const seededShuffle = (arr, rng) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // ── Seed encoding ─────────────────────────────────────────
  const seedToExamId = (seed) => `#${seed.toString().padStart(5, '0')}`;

  const generateSeed = () => Math.floor(Math.random() * 99999) + 1;

  // ── Pool management ───────────────────────────────────────
  let dataPool = {}; // { N5: { kanji: [...], vocab: [...], grammar: [...] } }

  const loadLevel = async (level) => {
    if (dataPool[level]) return dataPool[level];
    const categories = ['kanji', 'vocab', 'grammar'];
    const levelData = {};
    for (const cat of categories) {
      try {
// Sửa lại đúng dòng này trong questionEngine.js:
const res = await fetch(`data/${level}/${cat}.json`);
        if (res.ok) levelData[cat] = await res.json();
        else levelData[cat] = [];
      } catch {
        levelData[cat] = [];
      }
    }
    dataPool[level] = levelData;
    return levelData;
  };

  const getAllQuestions = (level) => {
    const data = dataPool[level] || {};
    return [
      ...(data.kanji  || []),
      ...(data.vocab  || []),
      ...(data.grammar|| []),
    ];
  };

  // ── Exam builders ─────────────────────────────────────────

  /**
   * Mock Test: 60 questions (20 kanji + 20 vocab + 20 grammar)
   * Uses seed for reproducibility
   */
  const buildMockTest = (level, seed) => {
    const rng = mulberry32(seed);
    const data = dataPool[level] || {};
    const pick = (pool, n) => seededShuffle(pool, rng).slice(0, n);

    const questions = [
      ...pick(data.kanji  || [], 20),
      ...pick(data.vocab  || [], 20),
      ...pick(data.grammar|| [], 20),
    ];

    return {
      type: 'mock',
      examId: seedToExamId(seed),
      seed,
      level,
      questions: seededShuffle(questions, rng),
      timeLimit: 60 * 60, // 60 min in seconds
    };
  };

  /**
   * Random Exam: 60 questions from any category, fully random per session
   */
  const buildRandomExam = (level, seed) => {
    const rng = mulberry32(seed);
    const all = getAllQuestions(level);
    const questions = seededShuffle(all, rng).slice(0, 60);
    return {
      type: 'random',
      examId: seedToExamId(seed),
      seed,
      level,
      questions,
      timeLimit: 60 * 60,
    };
  };

  /**
   * Quick Test: 10 random questions
   */
  const buildQuickTest = (level, seed) => {
    const rng = mulberry32(seed);
    const all = getAllQuestions(level);
    const questions = seededShuffle(all, rng).slice(0, 10);
    return {
      type: 'quick',
      examId: seedToExamId(seed),
      seed,
      level,
      questions,
      timeLimit: 10 * 60, // 10 min
    };
  };

  /**
   * Survival Mode: questions come one by one until 3 wrong answers
   */
  const buildSurvival = (level, seed) => {
    const rng = mulberry32(seed);
    const all = getAllQuestions(level);
    const questions = seededShuffle(all, rng); // All, served one-by-one
    return {
      type: 'survival',
      examId: seedToExamId(seed),
      seed,
      level,
      questions,
      maxLives: 3,
      timeLimit: null,
    };
  };

  /**
   * Review Wrong: uses saved wrong answers
   */
  const buildWrongReview = (wrongQuestions, seed) => {
    const rng = mulberry32(seed);
    const questions = seededShuffle(wrongQuestions, rng);
    return {
      type: 'review',
      examId: 'REVIEW',
      seed,
      level: 'MIXED',
      questions,
      timeLimit: null,
    };
  };

  // ── Scoring ───────────────────────────────────────────────
  const RANKS = [
    { min: 90, rank: 'S', label: '合格 — 素晴らしい！', color: '#FFD700' },
    { min: 75, rank: 'A', label: '合格 — よくできました', color: '#C0F080' },
    { min: 60, rank: 'B', label: '合格 — まあまあです', color: '#80C0FF' },
    { min: 0,  rank: 'C', label: '不合格 — もっと頑張って', color: '#FF8080' },
  ];

  const calcRank = (correct, total) => {
    const pct = (correct / total) * 100;
    return RANKS.find(r => pct >= r.min) || RANKS[RANKS.length - 1];
  };

  const calcScore = (correct, total, timeUsed, timeLimit) => {
    const base = Math.round((correct / total) * 100);
    const rank = calcRank(correct, total);
    return { correct, total, percentage: base, rank, timeUsed, timeLimit };
  };

  // ── Public API ────────────────────────────────────────────
  return {
    loadLevel,
    generateSeed,
    seedToExamId,
    buildMockTest,
    buildRandomExam,
    buildQuickTest,
    buildSurvival,
    buildWrongReview,
    calcScore,
    calcRank,
    RANKS,
  };
})();
