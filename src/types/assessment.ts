export interface AssessmentData {
  // Step 1: Basic Info
  currentWeight: number;
  height: number;
  targetWeight: number;
  
  // Step 2: Goals
  primaryGoal: 'lose_weight' | 'health' | 'energy' | 'appearance';
  timeline: '3_months' | '6_months' | '12_months';
  
  // Step 3: Health History
  hasTriedDiets: boolean;
  hasMedicalConditions: boolean;
  medicalConditions: string[];
  takesMedication: boolean;
  
  // Step 4: Lifestyle
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
  eatingHabits: 'regular' | 'irregular' | 'emotional';
  sleepQuality: 'poor' | 'average' | 'good';
}

export type TreatmentType = 'injectable' | 'oral' | 'lifestyle';

export interface TreatmentRecommendation {
  type: TreatmentType;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  features: string[];
}

export interface WeightProjection {
  month: string;
  weight: number;
}
