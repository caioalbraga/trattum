import { AssessmentData, TreatmentType, TreatmentRecommendation, WeightProjection } from '@/types/assessment';

// ============================================
// TIER SYSTEM - Clinical Treatment Matrix
// ============================================

export type TreatmentTier = 'tier1' | 'tier2' | 'tier3';

export interface TierInfo {
  tier: TreatmentTier;
  tierNumber: 1 | 2 | 3;
  treatmentType: TreatmentType;
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

/**
 * Determines treatment tier based on clinical criteria:
 * - Tier 1 (IMC < 27): Lifestyle only, medication blocked
 * - Tier 2 (IMC 27-30 + comorbidity): Oral treatment
 * - Tier 3 (IMC > 30): Injectable (Wegovy)
 */
export function determineTier(bmi: number, hasComorbidities: boolean): TierInfo {
  // Tier 1: Healthy/Light Overweight - No medication
  if (bmi < 27) {
    return {
      tier: 'tier1',
      tierNumber: 1,
      treatmentType: 'lifestyle',
      name: 'Plano de Reeducação e Nutrição',
      description: 'Foco em mudança de hábitos com acompanhamento profissional',
      medicationAllowed: false,
    };
  }

  // Tier 3: Clinical Obesity - Injectable treatment
  if (bmi > 30) {
    return {
      tier: 'tier3',
      tierNumber: 3,
      treatmentType: 'injectable',
      name: 'Tratamento Injetável + Time Clínico Completo',
      description: 'Wegovy® com acompanhamento médico e nutricional intensivo',
      medicationAllowed: true,
    };
  }

  // Tier 2: Grade I Obesity with comorbidity - Oral treatment
  if (bmi >= 27 && bmi <= 30 && hasComorbidities) {
    return {
      tier: 'tier2',
      tierNumber: 2,
      treatmentType: 'oral',
      name: 'Tratamento Oral + Suporte Nutricional',
      description: 'Medicação oral personalizada com nutricionista dedicada',
      medicationAllowed: true,
    };
  }

  // IMC 27-30 without comorbidity - still lifestyle focused
  return {
    tier: 'tier1',
    tierNumber: 1,
    treatmentType: 'lifestyle',
    name: 'Plano de Reeducação e Nutrição',
    description: 'Foco em mudança de hábitos com acompanhamento profissional',
    medicationAllowed: false,
  };
}

export function determineTreatment(data: AssessmentData): TreatmentType {
  const bmi = calculateBMI(data.currentWeight, data.height);
  const tierInfo = determineTier(bmi, data.hasMedicalConditions);
  return tierInfo.treatmentType;
}

// ============================================
// TREATMENT DETAILS
// ============================================

export function getTreatmentDetails(type: TreatmentType): TreatmentRecommendation {
  const treatments: Record<TreatmentType, TreatmentRecommendation> = {
    injectable: {
      type: 'injectable',
      name: 'Wegovy® (Semaglutida)',
      description: 'Injeção semanal de semaglutida 2,4mg com acompanhamento clínico completo. Indicado para obesidade clínica.',
      price: 910,
      originalPrice: 1300,
      features: [
        'Redução média de 15-20% do peso corporal',
        '1 caneta de aplicação a cada 4 semanas',
        'Acompanhamento individualizado com nutricionista',
        'Time clínico completo (médico + nutricionista)',
        'Suporte via WhatsApp 7 dias por semana',
      ],
    },
    oral: {
      type: 'oral',
      name: 'Tratamento Oral + Suporte Nutricional',
      description: 'Medicação via oral formulada para seu perfil específico, com acompanhamento nutricional.',
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
      name: 'Plano de Reeducação e Nutrição',
      description: 'Programa completo de mudança de hábitos com acompanhamento profissional. Medicamentos não são indicados para seu perfil.',
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

// ============================================
// WEIGHT PROJECTION - Logarithmic Curve
// ============================================

/**
 * Generates weight projection with logarithmic curve
 * Target: 18% weight loss over 6 months
 * Curve is steeper at the beginning (months 1-2)
 * 
 * @param currentWeight - Current weight in kg
 * @param heightCm - Height in cm (optional, for BMI-based adjustments)
 * @param age - Age in years (optional, for metabolic adjustments)
 */
export function calculateWeightProjection(
  currentWeight: number,
  heightCm?: number,
  age?: number
): WeightProjection[] {
  const projections: WeightProjection[] = [];
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const currentMonth = new Date().getMonth();
  
  // Target: 18% weight loss over 6 months
  const targetLossPercent = 0.18;
  const targetWeight = currentWeight * (1 - targetLossPercent);
  const totalLoss = currentWeight - targetWeight;
  
  // Apply metabolic adjustments based on age
  let metabolicFactor = 1.0;
  if (age) {
    if (age < 30) metabolicFactor = 1.05; // Faster metabolism
    else if (age > 50) metabolicFactor = 0.9; // Slower metabolism
    else if (age > 40) metabolicFactor = 0.95;
  }
  
  const months = 6;
  
  for (let i = 0; i <= months; i++) {
    const monthIndex = (currentMonth + i) % 12;
    
    // Logarithmic curve: steeper at the beginning
    // Using natural log transformation for more aggressive initial drop
    // Formula: progress = ln(1 + t) / ln(1 + T) where t = current month, T = total months
    const logProgress = Math.log(1 + i) / Math.log(1 + months);
    
    // Apply metabolic factor
    const adjustedProgress = logProgress * metabolicFactor;
    
    // Calculate weight with smooth curve
    const weight = Math.round(currentWeight - (totalLoss * Math.min(adjustedProgress, 1)));
    
    projections.push({
      month: monthNames[monthIndex],
      weight: Math.max(weight, targetWeight),
    });
  }

  return projections;
}

// Legacy function for backwards compatibility
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

/**
 * Maps quiz goal answers to human-readable motivation text
 */
export function getGoalMotivation(goalValue: string): string {
  const motivationMap: Record<string, string> = {
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
  'diabetes_tipo_2',
  'hipertensao',
  'colesterol_alto',
  'apneia_sono',
  'problemas_cardiacos',
  'sindrome_metabolica',
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
  treatmentDetails: TreatmentRecommendation;
  weightProjection: WeightProjection[];
  potentialLoss: ReturnType<typeof calculatePotentialWeightLoss>;
}

/**
 * Runs a complete simulation for testing purposes
 */
export function runSimulation(params: SimulationParams): SimulationResult {
  const bmi = calculateBMI(params.weight, params.height);
  const hasComorbidities = hasRelevantComorbidity(params.conditions);
  const tierInfo = determineTier(bmi, hasComorbidities);
  
  return {
    bmi,
    bmiCategory: getBMICategory(bmi),
    hasComorbidities,
    tierInfo,
    treatmentDetails: getTreatmentDetails(tierInfo.treatmentType),
    weightProjection: calculateWeightProjection(params.weight, params.height, params.age),
    potentialLoss: calculatePotentialWeightLoss(params.weight),
  };
}
