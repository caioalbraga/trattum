import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Heart, Phone, Stethoscope } from "lucide-react";

export default function NotEligible() {
  const navigate = useNavigate();
  const reason = sessionStorage.getItem('notEligibleReason') || 'imc_minimo';

  const title = 'Tratamento não indicado no momento';

  const description =
    'Com base nas informações que você compartilhou conosco, o tratamento Trattum não é o mais adequado para o seu caso neste momento. Recomendamos que você procure acompanhamento médico tradicional para avaliar com cuidado o melhor caminho para você. Agradecemos muito o seu interesse em cuidar da sua saúde com a gente.';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-12 max-w-2xl mx-auto">
        <div className="animate-fade-in">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-amber-600" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="heading-section mb-4">{title}</h1>
            <p className="text-body-lg max-w-lg mx-auto">{description}</p>
          </div>

          <Card className="p-6 mb-8 card-elevated">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-coral" />
              O que recomendamos?
            </h3>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Se você está buscando melhorar sua composição corporal ou ter hábitos
                mais saudáveis, recomendamos uma consulta presencial com um
                endocrinologista ou nutricionista.
              </p>
            </div>
          </Card>

          <Card className="p-6 mb-8 card-subtle">
            <h3 className="font-semibold text-lg mb-4">O que você pode fazer:</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="icon-container-sm shrink-0 mt-0.5">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium">Consulta Presencial</p>
                  <p className="text-sm text-muted-foreground">
                    Agende uma consulta com um médico para avaliar suas necessidades específicas.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="icon-container-sm shrink-0 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium">Fale Conosco</p>
                  <p className="text-sm text-muted-foreground">
                    Nossa equipe está disponível para tirar suas dúvidas pelo WhatsApp.
                  </p>
                </div>
              </li>
            </ul>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/anamnese')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Revisar minhas respostas
            </Button>
            <Button
              className="flex-1"
              onClick={() => navigate('/')}
            >
              Voltar ao início
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
