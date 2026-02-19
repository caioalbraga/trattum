import { Header } from "@/components/layout/Header";
import { QuizContainer } from "@/components/quiz/QuizContainer";

export default function Anamnese() {
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

        <QuizContainer />
      </main>
    </div>
  );
}
