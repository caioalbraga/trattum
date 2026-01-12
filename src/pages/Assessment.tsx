import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ProgressBar } from "@/components/assessment/ProgressBar";
import { StepBasicInfo } from "@/components/assessment/StepBasicInfo";
import { StepGoals } from "@/components/assessment/StepGoals";
import { StepHealth } from "@/components/assessment/StepHealth";
import { StepLifestyle } from "@/components/assessment/StepLifestyle";
import { AssessmentData } from "@/types/assessment";
import { calculateBMI, isEligibleForMedication } from "@/lib/assessment-logic";

const initialData: AssessmentData = {
  currentWeight: 0,
  height: 0,
  targetWeight: 0,
  primaryGoal: 'lose_weight',
  timeline: '6_months',
  hasTriedDiets: false,
  hasMedicalConditions: false,
  medicalConditions: [],
  takesMedication: false,
  activityLevel: 'sedentary',
  eatingHabits: 'regular',
  sleepQuality: 'average',
};

export default function Assessment() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<AssessmentData>(initialData);

  const steps = [
    { id: 1, name: 'Dados', completed: currentStep > 1 },
    { id: 2, name: 'Objetivos', completed: currentStep > 2 },
    { id: 3, name: 'Saúde', completed: currentStep > 3 },
    { id: 4, name: 'Estilo de Vida', completed: currentStep > 4 },
  ];

  const updateData = (updates: Partial<AssessmentData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const handleComplete = () => {
    // Calculate BMI and check eligibility
    const bmi = calculateBMI(data.currentWeight, data.height);
    
    // Store data
    sessionStorage.setItem('assessmentData', JSON.stringify(data));
    
    // Check if eligible for medication (BMI >= 27)
    if (!isEligibleForMedication(bmi)) {
      navigate('/not-eligible');
      return;
    }
    
    navigate('/results');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 pb-24">
        <ProgressBar steps={steps} currentStep={currentStep} />

        {currentStep === 1 && (
          <StepBasicInfo
            data={data}
            onUpdate={updateData}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <StepGoals
            data={data}
            onUpdate={updateData}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <StepHealth
            data={data}
            onUpdate={updateData}
            onNext={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && (
          <StepLifestyle
            data={data}
            onUpdate={updateData}
            onNext={handleComplete}
            onBack={() => setCurrentStep(3)}
          />
        )}
      </main>
    </div>
  );
}
