import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Heart, Zap, Sparkles, Scale, Calendar } from "lucide-react";

interface StepGoalsProps {
  data: {
    primaryGoal: 'lose_weight' | 'health' | 'energy' | 'appearance' | '';
    timeline: '3_months' | '6_months' | '12_months' | '';
  };
  onUpdate: (data: Partial<StepGoalsProps['data']>) => void;
  onNext: () => void;
  onBack: () => void;
}

const goals = [
  { id: 'lose_weight', label: 'Perder peso', icon: Scale, description: 'Alcançar um peso saudável' },
  { id: 'health', label: 'Melhorar saúde', icon: Heart, description: 'Prevenir doenças e viver melhor' },
  { id: 'energy', label: 'Mais energia', icon: Zap, description: 'Sentir-se mais disposto' },
  { id: 'appearance', label: 'Aparência', icon: Sparkles, description: 'Melhorar autoestima' },
] as const;

const timelines = [
  { id: '3_months', label: '3 meses', description: 'Resultados rápidos' },
  { id: '6_months', label: '6 meses', description: 'Recomendado' },
  { id: '12_months', label: '12 meses', description: 'Mudança sustentável' },
] as const;

export function StepGoals({ data, onUpdate, onNext, onBack }: StepGoalsProps) {
  const isValid = data.primaryGoal && data.timeline;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground mb-2">
          Quais são seus objetivos?
        </h2>
        <p className="text-muted-foreground">
          Entender suas metas nos ajuda a recomendar o melhor tratamento
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium mb-4">O que você mais deseja?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {goals.map((goal) => (
              <Card
                key={goal.id}
                className={cn(
                  "p-4 cursor-pointer transition-all duration-200 hover:shadow-card-hover",
                  data.primaryGoal === goal.id
                    ? "border-2 border-primary bg-secondary/50"
                    : "border border-border hover:border-primary/50"
                )}
                onClick={() => onUpdate({ primaryGoal: goal.id })}
              >
                <div className="flex items-start gap-3">
                  <div className="icon-container shrink-0">
                    <goal.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{goal.label}</h4>
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Em quanto tempo?
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {timelines.map((timeline) => (
              <Card
                key={timeline.id}
                className={cn(
                  "p-4 cursor-pointer text-center transition-all duration-200 hover:shadow-card-hover",
                  data.timeline === timeline.id
                    ? "border-2 border-primary bg-secondary/50"
                    : "border border-border hover:border-primary/50"
                )}
                onClick={() => onUpdate({ timeline: timeline.id })}
              >
                <h4 className="font-semibold">{timeline.label}</h4>
                <p className="text-xs text-muted-foreground mt-1">{timeline.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Voltar
        </Button>
        <Button variant="coral" size="lg" onClick={onNext} disabled={!isValid}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
