import { AssessmentData, TreatmentType, TreatmentRecommendation, WeightProjection } from '@/types/assessment';

export function calculateBMI(weight: number, heightCm: number): number {
  if (!weight || !heightCm || heightCm === 0) return 0;
  const heightM = heightCm / 100;
  return weight / (heightM * heightM);
}

export function getBMICategory(bmi: number): { category: string; color: string } {
  if (bmi < 18.5) return { category: 'Abaixo do peso', color: 'text-amber-600' };
  if (bmi < 25) return { category: 'Peso normal', color: 'text-teal' };
  if (bmi < 27) return { category: 'Leve sobrepeso', color: 'text-amber-500' };
  if (bmi < 30) return { category: 'Sobrepeso', color: 'text-orange-500' };
  if (bmi < 35) return { category: 'Obesidade Grau I', color: 'text-orange-600' };
  if (bmi < 40) return { category: 'Obesidade Grau II', color: 'text-red-500' };
  return { category: 'Obesidade Grau III', color: 'text-red-600' };
}

export function isEligibleForMedication(bmi: number): boolean {
  return bmi >= 27;
}

export function determineTreatment(data: AssessmentData): TreatmentType {
  const bmi = calculateBMI(data.currentWeight, data.height);
  const weightToLose = data.currentWeight - data.targetWeight;
  const weightLossPercentage = (weightToLose / data.currentWeight) * 100;

  // Not eligible for medication - lifestyle only
  if (bmi < 27) {
    return 'lifestyle';
  }

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
      name: 'Wegovy® (Semaglutida)',
      description: 'Injeção semanal de semaglutida 2,4mg com acompanhamento clínico completo',
      price: 910,
      originalPrice: 1300,
      features: [
        'Redução média de 15-20% do peso corporal',
        '1 caneta de aplicação a cada 4 semanas',
        'Acompanhamento individualizado com nutricionista',
        'Plano flexível, cancele quando quiser',
        'Time clínico disponível via WhatsApp',
      ],
    },
    oral: {
      type: 'oral',
      name: 'Tratamento Oral Composto',
      description: 'Medicação via oral formulada para seu perfil específico',
      price: 590,
      originalPrice: 850,
      features: [
        'Medicação personalizada para seu metabolismo',
        'Consultas mensais com nutricionista',
        'Plano alimentar individualizado',
        'Suporte contínuo via WhatsApp',
        'Ajustes de dosagem conforme evolução',
      ],
    },
    lifestyle: {
      type: 'lifestyle',
      name: 'Programa de Reeducação',
      description: 'Mudança de hábitos com acompanhamento profissional',
      price: 290,
      originalPrice: 450,
      features: [
        'Plano alimentar 100% personalizado',
        'Consultas quinzenais com nutricionista',
        'Programa de atividades físicas orientado',
        'Acesso à plataforma exclusiva de conteúdos',
        'Grupo de apoio com outros pacientes',
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
    const progress = 1 - Math.pow(0.82, i);
    const weight = Math.round(currentWeight - (totalLoss * progress));
    
    projections.push({
      month: monthNames[monthIndex],
      weight: Math.max(weight, targetWeight),
    });
  }

  return projections;
}

export function calculatePotentialWeightLoss(currentWeight: number): {
  conservative: number;
  optimistic: number;
  targetWeight: number;
} {
  const conservativeLoss = Math.round(currentWeight * 0.15);
  const optimisticLoss = Math.round(currentWeight * 0.20);
  const targetWeight = Math.round(currentWeight * 0.82);
  
  return {
    conservative: conservativeLoss,
    optimistic: optimisticLoss,
    targetWeight,
  };
}
