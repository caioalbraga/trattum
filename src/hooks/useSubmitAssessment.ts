import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { QuizAnswers } from '@/types/quiz';
import { calculateBMI } from '@/lib/assessment-logic';
import { toast } from 'sonner';

interface SubmitResult {
  success: boolean;
  assessmentId?: string;
  error?: string;
}

export function useSubmitAssessment() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateRiskScore = (answers: QuizAnswers): number => {
    let score = 0;

    // Medical conditions increase risk
    const conditions = answers['condicoes_medicas'] as string[] | undefined;
    if (conditions && conditions.length > 0) {
      score += conditions.length * 10;
      if (conditions.includes('diabetes_tipo_2')) score += 15;
      if (conditions.includes('hipertensao')) score += 10;
      if (conditions.includes('problemas_cardiacos')) score += 20;
    }

    // BMI-based risk - support both old and new field formats
    const alturaData = answers['altura_peso'] as { altura?: number; peso?: number } | undefined;
    const pesoAtual = answers['peso_atual'] as number | undefined;
    const alturaVal = answers['altura'] as number | undefined;
    
    let bmi: number | null = null;
    if (alturaData?.altura && alturaData?.peso) {
      bmi = calculateBMI(alturaData.peso, alturaData.altura);
    } else if (pesoAtual && alturaVal) {
      bmi = calculateBMI(pesoAtual, alturaVal);
    }
    
    if (bmi) {
      if (bmi >= 40) score += 30;
      else if (bmi >= 35) score += 20;
      else if (bmi >= 30) score += 10;
    }

    // Medications increase risk
    const takesRiskMeds = answers['medicamentos_risco'] as string | undefined;
    const usaMedicamento = answers['usa_medicamento_continuo'] as string | undefined;
    if (takesRiskMeds === 'sim' || usaMedicamento === 'sim') score += 15;

    // Age factor
    const age = answers['idade'] as number | undefined;
    if (age && age >= 60) score += 10;
    else if (age && age >= 50) score += 5;

    return Math.min(score, 100);
  };

  const submitAssessment = async (answers: QuizAnswers): Promise<SubmitResult> => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Store answers temporarily for submission after account creation
        sessionStorage.setItem('pendingQuizAnswers', JSON.stringify(answers));
        // Store a temporary assessment ID so Results page can show treatment preview
        sessionStorage.setItem('pendingAssessmentPreview', 'true');
        // Redirect to results to show treatment before account creation
        navigate('/results');
        return { success: false, error: 'auth_required' };
      }

      // Calculate IMC and risk score - support both old and new formats
      const alturaData = answers['altura_peso'] as { altura?: number; peso?: number } | undefined;
      const pesoAtual = answers['peso_atual'] as number | undefined;
      const alturaVal = answers['altura'] as number | undefined;
      
      let imc: number | null = null;
      if (alturaData?.altura && alturaData?.peso) {
        imc = calculateBMI(alturaData.peso, alturaData.altura);
      } else if (pesoAtual && alturaVal) {
        imc = calculateBMI(pesoAtual, alturaVal);
      }

      const scoreRisco = calculateRiskScore(answers);

      // Insert assessment into database
      const { data, error } = await supabase
        .from('avaliacoes')
        .insert({
          user_id: user.id,
          respostas: answers,
          status: 'pendente',
          imc: imc,
          score_risco: scoreRisco,
        })
        .select('id')
        .single();

      if (error) {
        if (import.meta.env.DEV) {
          console.error('Assessment submission error:', error);
        }
        toast.error('Erro ao salvar avaliação. Tente novamente.');
        return { success: false, error: error.message };
      }

      // Store assessment ID for Results page
      sessionStorage.setItem('assessmentId', data.id);
      // Clear any pending answers
      sessionStorage.removeItem('pendingQuizAnswers');

      return { success: true, assessmentId: data.id };
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Unexpected error:', err);
      }
      toast.error('Erro inesperado. Tente novamente.');
      return { success: false, error: 'unexpected_error' };
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkPendingAssessment = async (): Promise<boolean> => {
    const pendingAnswers = sessionStorage.getItem('pendingQuizAnswers');
    if (!pendingAnswers) return false;

    try {
      const answers = JSON.parse(pendingAnswers) as QuizAnswers;
      const result = await submitAssessment(answers);
      return result.success;
    } catch {
      sessionStorage.removeItem('pendingQuizAnswers');
      return false;
    }
  };

  return {
    submitAssessment,
    checkPendingAssessment,
    isSubmitting,
  };
}
