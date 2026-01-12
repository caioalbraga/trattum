import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ProgressBar } from "@/components/assessment/ProgressBar";
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
        currentWeight: 150,
        height: 175,
        targetWeight: 130,
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

    // Show discount modal after 3 seconds
    const timer = setTimeout(() => {
      setShowDiscountModal(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!data) return null;

  const projection = generateWeightProjection(data.currentWeight, data.targetWeight);
  const treatment = getTreatmentDetails(treatmentType);

  const steps = [
    { id: 1, name: 'Questionário', completed: true },
    { id: 2, name: 'Metas', completed: activeTab === 'tratamento' },
    { id: 3, name: 'Tratamento', completed: false },
    { id: 4, name: 'Pedido', completed: false },
  ];

  const handleSelectTreatment = () => {
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="container py-8">
        {/* Tabs */}
        <div className="flex justify-center gap-8 mb-8 border-b">
          <button
            className={`pb-4 text-sm font-medium transition-colors ${
              activeTab === 'metas'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('metas')}
          >
            METAS
          </button>
          <button
            className={`pb-4 text-sm font-medium transition-colors ${
              activeTab === 'tratamento'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('tratamento')}
          >
            TRATAMENTO
          </button>
        </div>

        {activeTab === 'metas' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-serif font-semibold mb-2">
                Seu plano de metas
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Agora que te conhecemos melhor, veja como podemos te ajudar a alcançar suas metas com possíveis medicações e um time de saúde.
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-8">
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
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-serif font-semibold mb-2">
                Medicação e Suporte Nutricional
              </h1>
              <p className="text-muted-foreground">
                Com base no seu perfil, recomendamos o seguinte plano
              </p>
            </div>

            <TreatmentCard treatment={treatment} onSelect={handleSelectTreatment} />
          </div>
        )}
      </main>

      <FloatingCTA
        message="Perca peso com saúde e mantenha seus resultados"
        buttonText={activeTab === 'metas' ? 'Descubra o seu plano ideal' : 'Finalizar'}
        onClick={() => {
          if (activeTab === 'metas') {
            setActiveTab('tratamento');
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
          // Here you would save the email to your database
        }}
      />
    </div>
  );
}
