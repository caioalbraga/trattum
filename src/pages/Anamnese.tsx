import { Header } from "@/components/layout/Header";
import { QuizContainer } from "@/components/quiz/QuizContainer";
import { ConsentModal } from "@/components/consent/ConsentModal";
import { useConsent } from "@/hooks/useConsent";

export default function Anamnese() {
  const {
    showModal,
    isLoading,
    isChecking,
    error,
    scrollCompleted,
    termsCheckbox,
    ageCheckbox,
    canAccept,
    hasValidConsent,
    setTermsCheckbox,
    setAgeCheckbox,
    onScrollComplete,
    acceptConsent,
  } = useConsent();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Consent gate modal */}
      <ConsentModal
        open={showModal}
        scrollCompleted={scrollCompleted}
        termsCheckbox={termsCheckbox}
        ageCheckbox={ageCheckbox}
        canAccept={canAccept}
        isLoading={isLoading}
        error={error}
        onScrollComplete={onScrollComplete}
        onTermsChange={setTermsCheckbox}
        onAgeChange={setAgeCheckbox}
        onAccept={acceptConsent}
      />

      <main className="container py-8 pb-24">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Anamnese Clínica
          </h1>
          <p className="text-muted-foreground">
            Responda algumas perguntas para personalizarmos seu tratamento
          </p>
        </div>

        {/* Only show quiz when consent is valid or still checking */}
        {(hasValidConsent || isChecking) && <QuizContainer />}
      </main>
    </div>
  );
}
