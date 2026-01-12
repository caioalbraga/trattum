import { AssessmentData, TreatmentType, TreatmentRecommendation, WeightProjection } from '@/types/assessment';

export function calculateBMI(weight: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weight / (heightM * heightM);
}

export function determineTreatment(data: AssessmentData): TreatmentType {
  const bmi = calculateBMI(data.currentWeight, data.height);
  const weightToLose = data.currentWeight - data.targetWeight;
  const weightLossPercentage = (weightToLose / data.currentWeight) * 100;

  // Injectable treatment for severe cases
  if (bmi >= 35 || (bmi >= 30 && data.hasMedicalConditions)) {
    return 'injectable';
  }

  // Oral treatment for moderate cases
  if (bmi >= 27 || weightLossPercentage > 15) {
    return 'oral';
  }

  // Lifestyle changes for mild cases
  return 'lifestyle';
}

export function getTreatmentDetails(type: TreatmentType): TreatmentRecommendation {
  const treatments: Record<TreatmentType, TreatmentRecommendation> = {
    injectable: {
      type: 'injectable',
      name: 'Wegovy & Suporte Nutricional',
      description: 'Injeção semanal com acompanhamento completo',
      price: 910,
      originalPrice: 1300,
      features: [
        '1 caneta a cada 4 semanas',
        'Acompanhamento individualizado com nutricionista',
        'Plano flexível, cancele quando quiser',
        'Time clínico disponível via WhatsApp',
      ],
    },
    oral: {
      type: 'oral',
      name: 'Tratamento Oral & Suporte',
      description: 'Medicação via oral com acompanhamento',
      price: 590,
      originalPrice: 850,
      features: [
        'Medicação mensal para perda de peso',
        'Consultas com nutricionista',
        'Plano alimentar personalizado',
        'Suporte via WhatsApp',
      ],
    },
    lifestyle: {
      type: 'lifestyle',
      name: 'Programa de Mudança de Estilo de Vida',
      description: 'Reeducação alimentar e acompanhamento',
      price: 290,
      originalPrice: 450,
      features: [
        'Plano alimentar personalizado',
        'Consultas quinzenais com nutricionista',
        'Programa de atividades físicas',
        'Acesso à plataforma exclusiva',
      ],
    },
  };

  return treatments[type];
}

export function generateWeightProjection(
  currentWeight: number,
  targetWeight: number,
  months: number = 6
): WeightProjection[] {
  const projections: WeightProjection[] = [];
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const currentMonth = new Date().getMonth();
  
  const totalLoss = currentWeight - targetWeight;
  
  for (let i = 0; i <= months; i++) {
    const monthIndex = (currentMonth + i) % 12;
    // Exponential decay curve for realistic weight loss
    const progress = 1 - Math.pow(0.85, i);
    const weight = Math.round(currentWeight - (totalLoss * progress));
    
    projections.push({
      month: monthNames[monthIndex],
      weight: Math.max(weight, targetWeight),
    });
  }

  return projections;
}

export function calculatePotentialWeightLoss(currentWeight: number, targetWeight: number): number {
  return currentWeight - targetWeight;
}
