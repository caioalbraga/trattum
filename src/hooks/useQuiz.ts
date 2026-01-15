import { useState, useCallback, useMemo } from 'react';
import { Question, QuizAnswers } from '@/types/quiz';
import questionsData from '@/data/questions.json';

const questions = questionsData as Question[];

export function useQuiz() {
  const [currentQuestionId, setCurrentQuestionId] = useState<string>(questions[0]?.id || '');
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [history, setHistory] = useState<string[]>([]);

  const currentQuestion = useMemo(() => {
    return questions.find(q => q.id === currentQuestionId);
  }, [currentQuestionId]);

  const totalSteps = useMemo(() => {
    return Math.max(...questions.filter(q => q.type !== 'logic').map(q => q.step));
  }, []);

  const progress = useMemo(() => {
    if (!currentQuestion || currentQuestion.type === 'logic') return 0;
    return (currentQuestion.step / totalSteps) * 100;
  }, [currentQuestion, totalSteps]);

  const evaluateLogicCondition = useCallback((condition: string): boolean => {
    try {
      const altura = (answers['altura_peso'] as { altura?: number; peso?: number })?.altura || 0;
      const peso = (answers['altura_peso'] as { altura?: number; peso?: number })?.peso || 0;
      
      // Create a safe evaluation context
      const evalContext = { altura, peso };
      
      // Simple condition evaluation
      if (condition.includes('||')) {
        const parts = condition.split('||').map(p => p.trim());
        return parts.some(part => evaluateSingleCondition(part, evalContext));
      }
      
      return evaluateSingleCondition(condition, evalContext);
    } catch {
      return false;
    }
  }, [answers]);

  const evaluateSingleCondition = (condition: string, ctx: { altura: number; peso: number }): boolean => {
    const { altura, peso } = ctx;
    
    // BMI calculation check
    if (condition.includes('peso/((altura/100)*(altura/100))')) {
      const bmi = peso / Math.pow(altura / 100, 2);
      const match = condition.match(/<\s*(\d+)/);
      if (match) {
        return bmi < parseFloat(match[1]);
      }
    }
    
    // Height checks
    if (condition.includes('altura <')) {
      const match = condition.match(/altura\s*<\s*(\d+)/);
      if (match) return altura < parseFloat(match[1]);
    }
    if (condition.includes('altura >')) {
      const match = condition.match(/altura\s*>\s*(\d+)/);
      if (match) return altura > parseFloat(match[1]);
    }
    
    return false;
  };

  const goToQuestion = useCallback((questionId: string) => {
    const targetQuestion = questions.find(q => q.id === questionId);
    
    if (!targetQuestion) return;
    
    // Handle logic questions automatically
    if (targetQuestion.type === 'logic') {
      const result = evaluateLogicCondition(targetQuestion.condition);
      const nextId = result ? targetQuestion.if_true : targetQuestion.if_false;
      goToQuestion(nextId);
      return;
    }
    
    setCurrentQuestionId(questionId);
  }, [evaluateLogicCondition]);

  const setAnswer = useCallback((questionId: string, value: string | string[] | number | { [fieldId: string]: number }) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }, []);

  const goNext = useCallback((nextId: string) => {
    setHistory(prev => [...prev, currentQuestionId]);
    goToQuestion(nextId);
  }, [currentQuestionId, goToQuestion]);

  const goBack = useCallback(() => {
    if (history.length === 0) return;
    
    const newHistory = [...history];
    const previousId = newHistory.pop();
    
    setHistory(newHistory);
    if (previousId) {
      setCurrentQuestionId(previousId);
    }
  }, [history]);

  const resetQuiz = useCallback(() => {
    setCurrentQuestionId(questions[0]?.id || '');
    setAnswers({});
    setHistory([]);
  }, []);

  const canGoBack = history.length > 0;

  return {
    currentQuestion,
    answers,
    progress,
    canGoBack,
    setAnswer,
    goNext,
    goBack,
    resetQuiz,
  };
}
