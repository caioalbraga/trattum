export function mapEvaluationToTreatmentStatus(evaluationStatus?: string | null): string | null {
  if (!evaluationStatus) return null;

  switch (evaluationStatus) {
    case 'pendente':
    case 'ajuste':
      return 'em_analise';
    case 'aprovado':
      return 'aprovado';
    default:
      return null;
  }
}

export function normalizeTreatmentStatus(
  treatmentStatus?: string | null,
  evaluationStatus?: string | null,
): string {
  if (treatmentStatus && treatmentStatus !== 'nenhum') {
    return treatmentStatus === 'ativo' ? 'em_andamento' : treatmentStatus;
  }

  return mapEvaluationToTreatmentStatus(evaluationStatus) ?? treatmentStatus ?? 'nenhum';
}
