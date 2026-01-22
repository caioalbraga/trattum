import { useState, useEffect } from "react";
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
import {
  determineTreatment,
  getTreatmentDetails,
  generateWeightProjection,
  calculateBMI,
} from "@/lib/assessment-logic";

export default function Results() {
  const navigate = useNavigate();
  const { checkPendingAssessment } = useSubmitAssessment();
  const [activeTab, setActiveTab] = useState<'metas' | 'tratamento'>('metas');
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [data, setData] = useState<AssessmentData | null>(null);
  const [treatmentType, setTreatmentType] = useState<TreatmentType>('injectable');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAssessment = async () => {
      setIsLoading(true);

      // Check for pending assessment after auth redirect
      await checkPendingAssessment();

      // Get assessment ID from session
      const assessmentId = sessionStorage.getItem('assessmentId');

      if (assessmentId) {
        // Fetch assessment from database
        const { data: assessment, error } = await supabase
          .from('avaliacoes')
          .select('*')
          .eq('id', assessmentId)
          .single();

        if (!error && assessment) {
          const respostas = assessment.respostas as Record<string, unknown>;
          const alturaData = respostas?.altura_peso as { altura?: number; peso?: number } | undefined;

          // Map goal values to valid types
          const goalMap: Record<string, AssessmentData['primaryGoal']> = {
            'emagrecer': 'lose_weight',
            'saude': 'health',
            'energia': 'energy',
            'aparencia': 'appearance',
            'lose_weight': 'lose_weight',
            'health': 'health',
            'energy': 'energy',
            'appearance': 'appearance',
          };

          const activityMap: Record<string, AssessmentData['activityLevel']> = {
            'sedentario': 'sedentary',
            'leve': 'light',
            'moderado': 'moderate',
            'ativo': 'active',
            'sedentary': 'sedentary',
            'light': 'light',
            'moderate': 'moderate',
            'active': 'active',
          };

          const rawGoal = respostas?.objetivo as string || 'lose_weight';
          const rawActivity = respostas?.nivel_atividade as string || 'sedentary';

          // Transform database response to AssessmentData
          const assessmentData: AssessmentData = {
            currentWeight: alturaData?.peso || 0,
            height: alturaData?.altura || 0,
            targetWeight: Math.round((alturaData?.peso || 0) * 0.85),
            primaryGoal: goalMap[rawGoal] || 'lose_weight',
            timeline: '6_months',
            hasTriedDiets: respostas?.dietas_anteriores === 'sim',
            hasMedicalConditions: Array.isArray(respostas?.condicoes_medicas) && 
              (respostas.condicoes_medicas as string[]).length > 0,
            medicalConditions: (respostas?.condicoes_medicas as string[]) || [],
            takesMedication: respostas?.medicamentos_risco === 'sim',
            activityLevel: activityMap[rawActivity] || 'sedentary',
            eatingHabits: 'irregular',
            sleepQuality: 'average',
          };

          setData(assessmentData);
          setTreatmentType(determineTreatment(assessmentData));
          setIsLoading(false);
          return;
        }
      }

      // Redirect to quiz if no valid assessment
      navigate('/anamnese');
    };

    loadAssessment();

    // Show discount modal after 5 seconds
    const timer = setTimeout(() => {
      setShowDiscountModal(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate, checkPendingAssessment]);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando seus resultados...</p>
        </div>
      </div>
    );
  }

  const bmi = calculateBMI(data.currentWeight, data.height);
  const projection = generateWeightProjection(data.currentWeight, data.targetWeight);
  const treatment = getTreatmentDetails(treatmentType);

  const handleSelectTreatment = () => {
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header />

      <main className="container py-8 max-w-4xl mx-auto">
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
            {/* Header */}
            <div className="text-center mb-10">
              <p className="text-sm font-semibold tracking-widest text-teal uppercase mb-3">
                Seu IMC: {bmi.toFixed(1)}
              </p>
              <h1 className="heading-section mb-4">
                Seu plano de metas personalizado
              </h1>
              <p className="text-body-lg max-w-2xl mx-auto">
                Agora que te conhecemos melhor, veja como podemos te ajudar a alcançar 
                suas metas com medicações aprovadas e um time de saúde dedicado.
              </p>
            </div>

            <div className="space-y-10">
              <WeightChart
                data={projection}
                currentWeight={data.currentWeight}
                targetWeight={data.targetWeight}
              />
              
              <BenefitsList />
              
              <HelpTimeline />
            </div>
          </div>
        )}

        {activeTab === 'tratamento' && (
          <div className="animate-fade-in max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-sm font-semibold tracking-widest text-teal uppercase mb-3">
                Medicação recomendada
              </p>
              <h1 className="heading-section mb-4">
                {treatment.name}
              </h1>
              <p className="text-body-lg">
                Com base no seu perfil e IMC de {bmi.toFixed(1)}, este é o tratamento 
                mais indicado para você
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
