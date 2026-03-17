import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail } from "lucide-react";

export default function Confirmacao() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-16 max-w-xl mx-auto">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
          </div>

          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-3">
              Recebemos sua avaliação!
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
              Sua anamnese foi enviada com sucesso e será analisada pela nossa equipe médica.
            </p>
          </div>

          <Card className="card-elevated">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3 text-left">
                <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Assim que seu tratamento for avaliado, você receberá uma notificação no e-mail cadastrado.
                </p>
              </div>
            </CardContent>
          </Card>

          <Button asChild variant="outline" className="mt-6">
            <Link to="/dashboard">Ir para minha conta</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
