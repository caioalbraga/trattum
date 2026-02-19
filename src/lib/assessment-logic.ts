import { AssessmentData, TreatmentRecommendation, WeightProjection } from '@/types/assessment';

// ============================================
// TIER SYSTEM - Clinical Treatment Matrix
// ============================================

export type TreatmentTier = 'tier1' | 'tier2' | 'tier3';

export interface TierInfo {
  tier: TreatmentTier;
  tierNumber: 1 | 2 | 3;
  name: string;
  description: string;
  medicationAllowed: boolean;
}

// ============================================
// BMI CALCULATIONS
// ============================================

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

// ============================================
// TIER DETERMINATION - Clinical Matrix
// ============================================

export function determineTier(bmi: number, hasComorbidities: boolean): TierInfo {
  if (bmi < 27) {
    return {
      tier: 'tier1',
      tierNumber: 1,
      name: 'Plano de Reeducação e Nutrição',
      description: 'Foco em mudança de hábitos com acompanhamento profissional',
      medicationAllowed: false,
    };
  }

  if (bmi > 30) {
    return {
      tier: 'tier3',
      tierNumber: 3,
      name: 'Pacote Trattum Completo',
      description: 'Tratamento completo com acompanhamento médico e nutricional intensivo',
      medicationAllowed: true,
    };
  }

  if (bmi >= 27 && bmi <= 30 && hasComorbidities) {
    return {
      tier: 'tier2',
      tierNumber: 2,
      name: 'Pacote Trattum + Suporte Nutricional',
      description: 'Tratamento personalizado com nutricionista dedicada',
      medicationAllowed: true,
    };
  }

  return {
    tier: 'tier1',
    tierNumber: 1,
    name: 'Plano de Reeducação e Nutrição',
    description: 'Foco em mudança de hábitos com acompanhamento profissional',
    medicationAllowed: false,
  };
}

// ============================================
// SINGLE PACKAGE DETAILS
// ============================================

export function getPackageDetails(): TreatmentRecommendation {
  return {
    type: 'injectable',
    name: 'Pacote Trattum',
    description: 'Pacote completo de tratamento com todos os medicamentos e acompanhamento necessários para o seu resultado.',
    price: 3000,
    originalPrice: 3000,
    features: [
      'Produto 1',
      'Produto 2',
      'Produto 3',
      'Produto 4',
      'Produto 5',
    ],
  };
}

// Legacy - kept for backwards compatibility
export function getTreatmentDetails(): TreatmentRecommendation {
  return getPackageDetails();
}

export function determineTreatment(data: AssessmentData) {
  const bmi = calculateBMI(data.currentWeight, data.height);
  return determineTier(bmi, data.hasMedicalConditions);
}

// ============================================
// WEIGHT PROJECTION - Logarithmic Curve
// ============================================

export function calculateWeightProjection(
  currentWeight: number,
  heightCm?: number,
  age?: number
): WeightProjection[] {
  const projections: WeightProjection[] = [];
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const currentMonth = new Date().getMonth();
  
  const targetLossPercent = 0.18;
  const targetWeight = currentWeight * (1 - targetLossPercent);
  const totalLoss = currentWeight - targetWeight;
  
  let metabolicFactor = 1.0;
  if (age) {
    if (age < 30) metabolicFactor = 1.05;
    else if (age > 50) metabolicFactor = 0.9;
    else if (age > 40) metabolicFactor = 0.95;
  }
  
  const months = 6;
  
  for (let i = 0; i <= months; i++) {
    const monthIndex = (currentMonth + i) % 12;
    const logProgress = Math.log(1 + i) / Math.log(1 + months);
    const adjustedProgress = logProgress * metabolicFactor;
    const weight = Math.round(currentWeight - (totalLoss * Math.min(adjustedProgress, 1)));
    
    projections.push({
      month: monthNames[monthIndex],
      weight: Math.max(weight, targetWeight),
    });
  }

  return projections;
}

export function generateWeightProjection(
  currentWeight: number,
  targetWeight: number,
  months: number = 6
): WeightProjection[] {
  return calculateWeightProjection(currentWeight);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function calculatePotentialWeightLoss(currentWeight: number): {
  conservative: number;
  optimistic: number;
  targetWeight: number;
  targetPercent: number;
} {
  const targetPercent = 18;
  const conservativeLoss = Math.round(currentWeight * 0.15);
  const optimisticLoss = Math.round(currentWeight * 0.20);
  const targetWeight = Math.round(currentWeight * (1 - targetPercent / 100));
  
  return {
    conservative: conservativeLoss,
    optimistic: optimisticLoss,
    targetWeight,
    targetPercent,
  };
}

export function getGoalMotivation(goalValue: string): string {
  const motivationMap: Record<string, string> = {
    'saude_fisica': 'melhorar sua saúde física',
    'confianca_aparencia': 'se sentir mais confiante',
    'bem_estar': 'melhorar seu bem-estar',
    'vida_ativa': 'ter uma vida mais ativa',
    'relacao_comida': 'ter uma relação melhor com a comida',
    'alimentacao': 'se alimentar melhor',
    'outras': 'alcançar seus objetivos',
    'emagrecer': 'perder peso de forma saudável',
    'saude': 'melhorar sua saúde',
    'energia': 'ter mais disposição no dia a dia',
    'aparencia': 'se sentir melhor consigo mesmo',
    'lose_weight': 'perder peso de forma saudável',
    'health': 'melhorar sua saúde',
    'energy': 'ter mais disposição no dia a dia',
    'appearance': 'se sentir melhor consigo mesmo',
  };
  
  return motivationMap[goalValue] || 'alcançar seus objetivos';
}

// ============================================
// COMORBIDITY DETECTION
// ============================================

export const RELEVANT_COMORBIDITIES = [
  'hipertensao',
  'infarto',
  'diabetes1',
  'diabetes_tipo_2',
  'colesterol_alto',
  'apneia_sono',
  'problemas_cardiacos',
  'sindrome_metabolica',
  'pressao_alta',
  'pre_diabetes',
  'dislipidemia',
];

export function hasRelevantComorbidity(conditions: string[]): boolean {
  if (!conditions || !Array.isArray(conditions)) return false;
  return conditions.some(c => RELEVANT_COMORBIDITIES.includes(c));
}

// ============================================
// DEBUG / TEST UTILITIES
// ============================================

export interface SimulationParams {
  weight: number;
  height: number;
  age: number;
  conditions: string[];
}

export interface SimulationResult {
  bmi: number;
  bmiCategory: { category: string; color: string };
  hasComorbidities: boolean;
  tierInfo: TierInfo;
  packageDetails: TreatmentRecommendation;
  weightProjection: WeightProjection[];
  potentialLoss: ReturnType<typeof calculatePotentialWeightLoss>;
}

export function runSimulation(params: SimulationParams): SimulationResult {
  const bmi = calculateBMI(params.weight, params.height);
  const hasComorbidities = hasRelevantComorbidity(params.conditions);
  const tierInfo = determineTier(bmi, hasComorbidities);
  
  return {
    bmi,
    bmiCategory: getBMICategory(bmi),
    hasComorbidities,
    tierInfo,
    packageDetails: getPackageDetails(),
    weightProjection: calculateWeightProjection(params.weight, params.height, params.age),
    potentialLoss: calculatePotentialWeightLoss(params.weight),
  };
}
