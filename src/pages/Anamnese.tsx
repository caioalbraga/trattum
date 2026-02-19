import { Header } from "@/components/layout/Header";
import { QuizContainer } from "@/components/quiz/QuizContainer";
import { ConsentInlineStep } from "@/components/consent/ConsentInlineStep";
import { useConsent } from "@/hooks/useConsent";

export default function Anamnese() {
  const {
    isLoading,
    isChecking,
    error,
    hasValidConsent,
    acceptConsent,
  } = useConsent();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 pb-24">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Anamnese Clínica
          </h1>
          <p className="text-muted-foreground">
            Responda algumas perguntas para personalizarmos seu tratamento
          </p>
        </div>

        {isChecking ? (
          <div className="max-w-xl mx-auto text-center py-12">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted animate-pulse" />
          </div>
        ) : hasValidConsent ? (
          <QuizContainer />
        ) : (
          <ConsentInlineStep
            isLoading={isLoading}
            error={error}
            onAccept={acceptConsent}
          />
        )}
      </main>
    </div>
  );
}
