import { useState, useEffect, useCallback, useRef } from 'react';
import { MCQQuestion, generateQuestions } from '../services/gemini';
import { useExamStore } from '../stores/examStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useGameQuestions } from './useGameQuestions';
import { useBookmarkStore } from '../stores/bookmarkStore';
import * as Haptics from 'expo-haptics';

export interface SlasherResult {
  q: MCQQuestion;
  chosen: string;
  correct: boolean;
}

export interface SlasherLogic {
  gameState: 'loading' | 'playing' | 'result';
  score: number;
  lives: number;
  combo: number;
  questions: MCQQuestion[];
  currentQuestion: MCQQuestion | null;
  questionVisible: boolean;
  setQuestionVisible: (v: boolean) => void;
  recordSlice: (isBomb: boolean) => any;
  recordMiss: () => void;
  handleQuestionResponse: (selected: string | Record<string, string>) => void;
  isPaused: boolean;
  toggleBookmark: (q: MCQQuestion) => void;
  isQuestionBookmarked: (id: string) => boolean;
  startGame: () => void;
  resetGame: () => void;
  loading: boolean;
  stats: { correct: number; incorrect: number; totalAsked: number };
  results: SlasherResult[];
  feedbackMessage: { text: string; type: 'success' | 'error' } | null;
}

export const useSyllabusSlasherLogic = (): SlasherLogic => {
  const { 
    selectedBranch, 
    selectedPSU, 
    selectedSections, 
    questionCount: storeQuestionCount 
  } = useExamStore();
  
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'result'>('loading');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<MCQQuestion | null>(null);
  const [questionVisible, setQuestionVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { toggleQuestionBookmark, isQuestionBookmarked } = useBookmarkStore();
  const [usedIndices, setUsedIndices] = useState<number[]>([]);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0, totalAsked: 0 });
  const [results, setResults] = useState<SlasherResult[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Use refs for values accessed in timeouts to prevent stale closures
  const livesRef = useRef(3);
  const usedIndicesRef = useRef<number[]>([]);
  const questionsRef = useRef<MCQQuestion[]>([]);
  const isQuestionActiveRef = useRef(false);

  const { loadQuestions: fetchQuestions } = useGameQuestions();
  const [loading, setLoading] = useState(true);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const q = await fetchQuestions('slasher', storeQuestionCount || 20);
      setQuestions(q as MCQQuestion[]);
      questionsRef.current = q as MCQQuestion[];
      setGameState('playing');
    } catch (error) {
      console.error('Slasher question error:', error);
      setGameState('playing'); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [selectedBranch, selectedPSU, selectedSections]);

  const comboTimer = useRef<NodeJS.Timeout | null>(null);

  const showLifeLossQuestion = useCallback(() => {
    if (isQuestionActiveRef.current) return;
    isQuestionActiveRef.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const unUsed = questionsRef.current.filter((_, i) => !usedIndicesRef.current.includes(i));
    if (unUsed.length > 0) {
      const nextQ = unUsed[0];
      const idx = questionsRef.current.indexOf(nextQ);
      usedIndicesRef.current.push(idx);
      setUsedIndices([...usedIndicesRef.current]);
      setCurrentQuestion(nextQ);
      setQuestionVisible(true);
      setIsPaused(true);
    } else {
      // No questions left — lose life directly
      livesRef.current -= 1;
      setLives(livesRef.current);
      if (livesRef.current <= 0) setGameState('result');
      isQuestionActiveRef.current = false;
    }
  }, []);

  const recordMiss = useCallback(() => {
    showLifeLossQuestion();
  }, [showLifeLossQuestion]);

  const recordSlice = (isBomb: boolean) => {
    if (isBomb) {
      setCombo(0);
      showLifeLossQuestion();
    } else {
      const isCritical = Math.random() < 0.1;
      const points = isCritical ? 10 : (1 + Math.floor(combo / 3));
      setScore(prev => prev + points);
      setCombo(prev => prev + 1);
      if (comboTimer.current) clearTimeout(comboTimer.current);
      comboTimer.current = setTimeout(() => setCombo(0), 800);
      if (isCritical) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      return { isCritical, points };
    }
  };

  const handleQuestionResponse = (selected: string | Record<string, string>) => {
    if (!currentQuestion || typeof selected !== 'string') return;
    const isCorrect = selected.charAt(0).toUpperCase() === currentQuestion.correct.toUpperCase();
    
    setResults(prev => [...prev, { q: currentQuestion, chosen: selected, correct: isCorrect }]);
    setStats(prev => ({
      totalAsked: prev.totalAsked + 1,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      incorrect: !isCorrect ? prev.incorrect + 1 : prev.incorrect,
    }));

    setQuestionVisible(false);
    
    if (isCorrect) {
      setFeedbackMessage({ text: "LIFE SAVED! ✓", type: 'success' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setFeedbackMessage({ text: "LIFE LOST! ✗", type: 'error' });
      livesRef.current -= 1;
      setLives(livesRef.current);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setTimeout(() => {
      setFeedbackMessage(null);
      isQuestionActiveRef.current = false;

      if (livesRef.current <= 0 && !isCorrect) {
         setGameState('result');
      } else if (usedIndicesRef.current.length >= questionsRef.current.length) {
         setGameState('result');
      } else {
         setIsPaused(false);
         setCurrentQuestion(null);
      }
    }, 2000);
  };

  const toggleBookmark = (q: MCQQuestion) => {
    toggleQuestionBookmark({
      id: q.id,
      question: q.question,
      options: q.options,
      correct: q.correct,
      explanation: q.explanation,
      topicTitle: q.topicTitle || 'General',
      psuName: selectedPSU?.name || '',
      branchName: selectedBranch?.name || ''
    });
  };

  const startGame = () => {
    setScore(0);
    setLives(3);
    livesRef.current = 3;
    setCombo(0);
    setUsedIndices([]);
    usedIndicesRef.current = [];
    setResults([]);
    setStats({ correct: 0, incorrect: 0, totalAsked: 0 });
    setFeedbackMessage(null);
    isQuestionActiveRef.current = false;
    setGameState('playing');
  };

  const resetGame = () => {
    setScore(0);
    setLives(3);
    livesRef.current = 3;
    setCombo(0);
    setUsedIndices([]);
    usedIndicesRef.current = [];
    setResults([]);
    setStats({ correct: 0, incorrect: 0, totalAsked: 0 });
    setFeedbackMessage(null);
    isQuestionActiveRef.current = false;
    setGameState('loading');
    loadQuestions();
  };

  return {
    gameState, score, lives, combo, questions, currentQuestion, questionVisible,
    setQuestionVisible, recordSlice, recordMiss, handleQuestionResponse, isPaused,
    toggleBookmark, isQuestionBookmarked, startGame, resetGame, loading, stats, results,
    feedbackMessage
  };
};
