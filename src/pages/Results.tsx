import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { WeightChart } from "@/components/results/WeightChart";
import { BenefitsList } from "@/components/results/BenefitsList";
import { HelpTimeline } from "@/components/results/HelpTimeline";
import { TreatmentCard } from "@/components/results/TreatmentCard";
import { DiscountModal } from "@/components/results/DiscountModal";
import { FloatingCTA } from "@/components/layout/FloatingCTA";
import { AssessmentData, TreatmentType } from "@/types/assessment";
import { supabase } from "@/integrations/supabase/client";
import { useSubmitAssessment } from "@/hooks/useSubmitAssessment";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import {
  determineTier,
  getTreatmentDetails,
  calculateWeightProjection,
  calculateBMI,
  getGoalMotivation,
  hasRelevantComorbidity,
  calculatePotentialWeightLoss,
  TierInfo,
} from "@/lib/assessment-logic";

interface QuizResponses {
  altura_peso?: { altura?: number; peso?: number };
  motivos_emagrecer?: string[];
  frequencia_exercicios?: string;
  etapa_30?: string[];
  etapa_31?: string[];
  etapa_34?: string;
  metodos_anteriores?: string[];
  idade?: string;
}

export default function Results() {
  const navigate = useNavigate();
  const { checkPendingAssessment } = useSubmitAssessment();
  const [activeTab, setActiveTab] = useState<'metas' | 'tratamento'>('metas');
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [data, setData] = useState<AssessmentData | null>(null);
  const [quizResponses, setQuizResponses] = useState<QuizResponses | null>(null);
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAssessment = async () => {
      setIsLoading(true);

      try {
        // Check for pending assessment after auth redirect
        await checkPendingAssessment();

        // Get assessment ID from session
        const assessmentId = sessionStorage.getItem('assessmentId');

        if (!assessmentId) {
          navigate('/anamnese');
          return;
        }

        // Fetch assessment from database
        const { data: assessment, error } = await supabase
          .from('avaliacoes')
          .select('*')
          .eq('id', assessmentId)
          .maybeSingle();

        if (error || !assessment) {
          console.error('Failed to load assessment:', error);
          sessionStorage.removeItem('assessmentId');
          navigate('/anamnese');
          return;
        }

        const respostas = assessment.respostas as QuizResponses;
        setQuizResponses(respostas);
        
        const alturaData = respostas?.altura_peso;

        // Map goal values from quiz to internal types
        const goalMapping: Record<string, AssessmentData['primaryGoal']> = {
          'saude_fisica': 'health',
          'confianca_aparencia': 'appearance',
          'bem_estar': 'health',
          'vida_ativa': 'energy',
          'relacao_comida': 'health',
          'alimentacao': 'health',
        };

        // Map activity levels from quiz
        const activityMapping: Record<string, AssessmentData['activityLevel']> = {
          'sedentario': 'sedentary',
          'pouco': 'light',
          'moderado': 'moderate',
          'intenso': 'active',
        };

        // Get primary goal from motivos array
        const rawGoals = respostas?.motivos_emagrecer || [];
        const primaryGoal = rawGoals[0] ? goalMapping[rawGoals[0]] || 'lose_weight' : 'lose_weight';

        // Get activity level
        const rawActivity = respostas?.frequencia_exercicios || 'sedentario';
        const activityLevel = activityMapping[rawActivity] || 'sedentary';

        // Combine comorbidities from multiple fields
        const conditions = [
          ...(respostas?.etapa_30 || []),
          ...(respostas?.etapa_31 || []),
        ].filter(c => c && c !== 'nenhuma' && c !== 'nao');

        // Check if user tried diets before
        const previousMethods = respostas?.metodos_anteriores || [];
        const hasTriedDiets = previousMethods.some(m => 
          ['dieta', 'programas', 'medicamentos', 'calorias'].includes(m)
        );

        // Transform database response to AssessmentData
        const assessmentData: AssessmentData = {
          currentWeight: alturaData?.peso || 0,
          height: alturaData?.altura || 0,
          targetWeight: Math.round((alturaData?.peso || 0) * 0.82),
          primaryGoal,
          timeline: '6_months',
          hasTriedDiets,
          hasMedicalConditions: hasRelevantComorbidity(conditions),
          medicalConditions: conditions,
          takesMedication: previousMethods.includes('medicamentos'),
          activityLevel,
          eatingHabits: 'irregular',
          sleepQuality: 'average',
        };

        // Calculate tier based on BMI and comorbidities
        const bmi = calculateBMI(assessmentData.currentWeight, assessmentData.height);
        const tier = determineTier(bmi, assessmentData.hasMedicalConditions);
        
        setData(assessmentData);
        setTierInfo(tier);
      } catch (err) {
        console.error('Error loading assessment:', err);
        sessionStorage.removeItem('assessmentId');
        navigate('/anamnese');
      } finally {
        setIsLoading(false);
      }
    };

    loadAssessment();

    // Show discount modal after 5 seconds
    const timer = setTimeout(() => {
      setShowDiscountModal(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate, checkPendingAssessment]);

  // Calculate dynamic values
  const calculatedValues = useMemo(() => {
    if (!data) return null;
    
    const bmi = calculateBMI(data.currentWeight, data.height);
    // Map age category to approximate age for metabolic calculations
    const ageCategory = quizResponses?.idade || 'adulto';
    const age = ageCategory === 'senior' ? 60 : 35;
    const projection = calculateWeightProjection(data.currentWeight, data.height, age);
    const potentialLoss = calculatePotentialWeightLoss(data.currentWeight);
    
    return {
      bmi,
      projection,
      potentialLoss,
      weightToLose: potentialLoss.targetWeight ? data.currentWeight - potentialLoss.targetWeight : 0,
    };
  }, [data, quizResponses]);

  // Generate personalized title
  const personalizedTitle = useMemo(() => {
    if (!data || !quizResponses || !calculatedValues) return null;
    
    const weightToLose = calculatedValues.weightToLose;
    const rawGoals = quizResponses?.motivos_emagrecer || [];
    const motivation = getGoalMotivation(rawGoals[0] || 'lose_weight');
    
    return `Vimos que você deseja perder ${weightToLose}kg para ${motivation}`;
  }, [data, quizResponses, calculatedValues]);

  if (isLoading || !data || !tierInfo || !calculatedValues) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando seus resultados...</p>
        </div>
      </div>
    );
  }

  const treatment = getTreatmentDetails(tierInfo.treatmentType);

  const handleSelectTreatment = () => {
    // Store treatment selection for checkout
    sessionStorage.setItem('selectedTreatment', tierInfo.treatmentType);
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header />

      <main className="container py-8 max-w-4xl mx-auto">
        {/* Tier 1 Warning - Medication blocked */}
        {!tierInfo.medicationAllowed && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Medicação não indicada para seu perfil
              </p>
              <p className="text-sm text-amber-700">
                Com base no seu IMC de {calculatedValues.bmi.toFixed(1)}, recomendamos nosso programa de reeducação alimentar.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex justify-center gap-12 mb-10 border-b border-border/60">
          <button
            className={`pb-4 text-sm font-semibold tracking-wide uppercase transition-colors relative ${
              activeTab === 'metas'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('metas')}
          >
            Metas
            {activeTab === 'metas' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            )}
          </button>
          <button
            className={`pb-4 text-sm font-semibold tracking-wide uppercase transition-colors relative ${
              activeTab === 'tratamento'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('tratamento')}
          >
            Tratamento
            {activeTab === 'tratamento' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            )}
          </button>
        </div>

        {activeTab === 'metas' && (
          <div className="animate-fade-in">
            {/* Dynamic Header */}
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Badge variant="outline" className="text-xs tracking-widest uppercase">
                  IMC: {calculatedValues.bmi.toFixed(1)}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`text-xs tracking-widest uppercase ${
                    tierInfo.tierNumber === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    tierInfo.tierNumber === 2 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  Tier {tierInfo.tierNumber}
                </Badge>
              </div>
              <h1 className="heading-section mb-4">
                {personalizedTitle || 'Seu plano de metas personalizado'}
              </h1>
              <p className="text-body-lg max-w-2xl mx-auto">
                Agora que te conhecemos melhor, veja como podemos te ajudar a alcançar 
                suas metas com {tierInfo.medicationAllowed ? 'medicações aprovadas e' : ''} um time de saúde dedicado.
              </p>
            </div>

            <div className="space-y-10">
              <WeightChart
                data={calculatedValues.projection}
                currentWeight={data.currentWeight}
                targetWeight={calculatedValues.potentialLoss.targetWeight}
              />
              
              <BenefitsList />
              
              <HelpTimeline />
            </div>
          </div>
        )}

        {activeTab === 'tratamento' && (
          <div className="animate-fade-in max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <Badge 
                variant="outline" 
                className={`mb-3 text-xs tracking-widest uppercase ${
                  tierInfo.tierNumber === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  tierInfo.tierNumber === 2 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {tierInfo.name}
              </Badge>
              <h1 className="heading-section mb-4">
                {treatment.name}
              </h1>
              <p className="text-body-lg">
                {tierInfo.description}
              </p>
            </div>

            <TreatmentCard treatment={treatment} onSelect={handleSelectTreatment} />
          </div>
        )}
      </main>

      <FloatingCTA
        message="Perca peso com saúde e mantenha seus resultados"
        buttonText={activeTab === 'metas' ? 'Ver tratamento recomendado' : 'Iniciar tratamento'}
        onClick={() => {
          if (activeTab === 'metas') {
            setActiveTab('tratamento');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            handleSelectTreatment();
          }
        }}
      />

      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onSubmit={(email) => {
          // TODO: Save email to marketing list via secure backend
          setShowDiscountModal(false);
        }}
      />
    </div>
  );
}
