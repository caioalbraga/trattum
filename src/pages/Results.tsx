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
import {
  determineTreatment,
  getTreatmentDetails,
  generateWeightProjection,
  calculateBMI,
} from "@/lib/assessment-logic";

export default function Results() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'metas' | 'tratamento'>('metas');
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [data, setData] = useState<AssessmentData | null>(null);
  const [treatmentType, setTreatmentType] = useState<TreatmentType>('injectable');

  useEffect(() => {
    const stored = sessionStorage.getItem('assessmentData');
    if (stored) {
      const parsed = JSON.parse(stored) as AssessmentData;
      setData(parsed);
      setTreatmentType(determineTreatment(parsed));
    } else {
      // Demo data if no assessment
      setData({
        currentWeight: 95,
        height: 170,
        targetWeight: 78,
        primaryGoal: 'lose_weight',
        timeline: '6_months',
        hasTriedDiets: true,
        hasMedicalConditions: false,
        medicalConditions: [],
        takesMedication: false,
        activityLevel: 'sedentary',
        eatingHabits: 'irregular',
        sleepQuality: 'average',
      });
    }

    // Show discount modal after 5 seconds
    const timer = setTimeout(() => {
      setShowDiscountModal(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!data) return null;

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
          console.log('Email captured:', email);
          setShowDiscountModal(false);
        }}
      />
    </div>
  );
}
