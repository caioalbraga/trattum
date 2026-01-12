import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, ArrowLeft, Stethoscope, Heart, Phone } from "lucide-react";

export default function NotEligible() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-12 max-w-2xl mx-auto">
        <div className="animate-fade-in">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-amber-600" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="heading-section mb-4">
              Vamos parar por aqui
            </h1>
            <p className="text-body-lg max-w-lg mx-auto">
              Com base nas informações fornecidas, seu Índice de Massa Corporal (IMC) 
              está abaixo de 27, o que não indica necessidade de tratamento medicamentoso 
              para perda de peso.
            </p>
          </div>

          {/* Explanation Card */}
          <Card className="p-6 mb-8 card-elevated">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-coral" />
              Por que não posso continuar?
            </h3>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Os medicamentos para tratamento de obesidade são indicados apenas para 
                pessoas com IMC igual ou superior a 27, conforme diretrizes médicas. 
                Prescrever esses medicamentos fora dessa indicação pode trazer riscos 
                à sua saúde.
              </p>
              <p>
                Se você está buscando melhorar sua composição corporal ou ter hábitos 
                mais saudáveis, recomendamos uma consulta presencial com um 
                endocrinologista ou nutricionista.
              </p>
            </div>
          </Card>

          {/* Recommendations */}
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

          {/* Agreement */}
          <div className="bg-muted/50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Checkbox
                id="agreement"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked as boolean)}
                className="mt-1"
              />
              <label 
                htmlFor="agreement" 
                className="text-sm cursor-pointer leading-relaxed"
              >
                Confirmo que forneci informações verdadeiras e entendo que o tratamento 
                medicamentoso não é indicado para o meu perfil atual.
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/assessment')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Revisar minhas respostas
            </Button>
            <Button
              variant="coral"
              className="flex-1"
              disabled={!agreed}
              onClick={() => navigate('/')}
            >
              Entendi, voltar ao início
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
