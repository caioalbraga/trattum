import { supabase } from '@/integrations/supabase/client';
import { calculateBMI } from '@/lib/assessment-logic';
import { normalizeTreatmentStatus } from '@/lib/treatment-status';

const STORAGE_KEY = 'anamnese_pendente';

/**
 * Saves anamnese data to localStorage for persistence across auth flows.
 */
export function savePendingAnamnese(dados: Record<string, unknown>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    dados,
    salvo_em: new Date().toISOString(),
  }));
}

/**
 * Checks if there is a pending anamnese in localStorage.
 */
export function hasPendingAnamnese(): boolean {
  return !!localStorage.getItem(STORAGE_KEY);
}

/**
 * Submits pending anamnese from localStorage, linked to the given userId.
 * After success, clears the stored data.
 * Never throws — errors are logged but don't block the caller.
 */
export async function submitPendingAnamnese(userId: string): Promise<boolean> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;

  // Also check sessionStorage (legacy)
  const sessionRaw = sessionStorage.getItem('pendingQuizAnswers');

  try {
    const { dados } = JSON.parse(raw);
    if (!dados || typeof dados !== 'object') {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }

    // Calculate BMI
    const pesoAtual = dados.peso_atual as number | undefined;
    const alturaVal = dados.altura as number | undefined;
    let imc: number | null = null;
    if (pesoAtual && alturaVal) {
      imc = calculateBMI(pesoAtual, alturaVal);
    }

    // Calculate risk score (simplified)
    let scoreRisco = 0;
    if (imc) {
      if (imc >= 40) scoreRisco += 30;
      else if (imc >= 35) scoreRisco += 20;
      else if (imc >= 30) scoreRisco += 10;
    }
    if (dados.usa_medicamento_continuo === 'sim') scoreRisco += 15;

    // Insert assessment
    const { error } = await supabase
      .from('avaliacoes')
      .insert({
        user_id: userId,
        respostas: dados,
        status: 'pendente',
        imc,
        score_risco: Math.min(scoreRisco, 100),
      });

    if (error) {
      console.error('[pending-anamnese] Erro ao submeter avaliação:', error);
      return false;
    }

    // Ensure treatment record exists
    try {
      const { data: existingTreatment } = await supabase
        .from('tratamentos')
        .select('id, status')
        .eq('user_id', userId)
        .maybeSingle();

      const nextStatus = normalizeTreatmentStatus(existingTreatment?.status, 'pendente');

      if (existingTreatment?.id) {
        await supabase
          .from('tratamentos')
          .update({ status: nextStatus })
          .eq('id', existingTreatment.id);
      } else {
        await supabase
          .from('tratamentos')
          .insert({ user_id: userId, status: nextStatus });
      }
    } catch (treatmentErr) {
      console.error('[pending-anamnese] Erro ao atualizar tratamento:', treatmentErr);
    }

    // Update profile name
    if (dados.nome_completo) {
      try {
        await supabase
          .from('profiles')
          .update({ nome: dados.nome_completo as string })
          .eq('user_id', userId);
      } catch (profileErr) {
        console.error('[pending-anamnese] Erro ao atualizar perfil:', profileErr);
      }
    }

    // Persist any pending consents from localStorage
    try {
      const consentKeys = [
        { key: 'consent_tcle', termo: 'tcle' },
        { key: 'consent_declaracao_veracidade', termo: 'declaracao_veracidade' },
        { key: 'consent_termos_uso', termo: 'termos_uso' },
        { key: 'consent_politica_privacidade', termo: 'politica_privacidade' },
      ];
      const consentsToInsert: Array<{ user_id: string; termo: string; aceito: boolean; aceito_em: string }> = [];
      const now = new Date().toISOString();

      for (const { key, termo } of consentKeys) {
        const consentRaw = localStorage.getItem(key);
        if (consentRaw) {
          try {
            const parsed = JSON.parse(consentRaw);
            if (parsed.aceito) {
              consentsToInsert.push({ user_id: userId, termo, aceito: true, aceito_em: parsed.aceito_em || now });
            }
          } catch { /* ignore */ }
        }
      }

      if (consentsToInsert.length > 0) {
        await supabase.from('user_consents').insert(consentsToInsert);
        consentKeys.forEach(({ key }) => localStorage.removeItem(key));
      }
    } catch (consentErr) {
      console.error('[pending-anamnese] Erro ao registrar consentimentos:', consentErr);
    }

    // Clean up
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem('pendingQuizAnswers');
    sessionStorage.removeItem('pendingAssessmentPreview');

    return true;
  } catch (err) {
    console.error('[pending-anamnese] Erro inesperado:', err);
    return false;
  }
}
