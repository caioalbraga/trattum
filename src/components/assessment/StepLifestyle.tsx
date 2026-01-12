import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Activity, Utensils, Moon } from "lucide-react";

interface StepLifestyleProps {
  data: {
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | '';
    eatingHabits: 'regular' | 'irregular' | 'emotional' | '';
    sleepQuality: 'poor' | 'average' | 'good' | '';
  };
  onUpdate: (data: Partial<StepLifestyleProps['data']>) => void;
  onNext: () => void;
  onBack: () => void;
}

const activityLevels = [
  { id: 'sedentary', label: 'Sedentário', description: 'Pouca ou nenhuma atividade' },
  { id: 'light', label: 'Leve', description: '1-2x por semana' },
  { id: 'moderate', label: 'Moderado', description: '3-4x por semana' },
  { id: 'active', label: 'Ativo', description: '5+ vezes por semana' },
] as const;

const eatingHabits = [
  { id: 'regular', label: 'Regular', description: 'Horários fixos, porções controladas' },
  { id: 'irregular', label: 'Irregular', description: 'Pula refeições, come em horários variados' },
  { id: 'emotional', label: 'Emocional', description: 'Come por estresse ou ansiedade' },
] as const;

const sleepQualities = [
  { id: 'poor', label: 'Ruim', description: 'Menos de 5h ou sono interrompido' },
  { id: 'average', label: 'Regular', description: '5-7h de sono' },
  { id: 'good', label: 'Bom', description: '7-9h de sono reparador' },
] as const;

export function StepLifestyle({ data, onUpdate, onNext, onBack }: StepLifestyleProps) {
  const isValid = data.activityLevel && data.eatingHabits && data.sleepQuality;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground mb-2">
          Seu estilo de vida
        </h2>
        <p className="text-muted-foreground">
          Entender sua rotina nos ajuda a personalizar o tratamento
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Nível de atividade física
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {activityLevels.map((level) => (
              <Card
                key={level.id}
                className={cn(
                  "p-4 cursor-pointer text-center transition-all duration-200 hover:shadow-card-hover",
                  data.activityLevel === level.id
                    ? "border-2 border-primary bg-secondary/50"
                    : "border border-border hover:border-primary/50"
                )}
                onClick={() => onUpdate({ activityLevel: level.id })}
              >
                <h4 className="font-semibold text-sm">{level.label}</h4>
                <p className="text-xs text-muted-foreground mt-1">{level.description}</p>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary" />
            Hábitos alimentares
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {eatingHabits.map((habit) => (
              <Card
                key={habit.id}
                className={cn(
                  "p-4 cursor-pointer text-center transition-all duration-200 hover:shadow-card-hover",
                  data.eatingHabits === habit.id
                    ? "border-2 border-primary bg-secondary/50"
                    : "border border-border hover:border-primary/50"
                )}
                onClick={() => onUpdate({ eatingHabits: habit.id })}
              >
                <h4 className="font-semibold text-sm">{habit.label}</h4>
                <p className="text-xs text-muted-foreground mt-1">{habit.description}</p>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Moon className="w-5 h-5 text-primary" />
            Qualidade do sono
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sleepQualities.map((quality) => (
              <Card
                key={quality.id}
                className={cn(
                  "p-4 cursor-pointer text-center transition-all duration-200 hover:shadow-card-hover",
                  data.sleepQuality === quality.id
                    ? "border-2 border-primary bg-secondary/50"
                    : "border border-border hover:border-primary/50"
                )}
                onClick={() => onUpdate({ sleepQuality: quality.id })}
              >
                <h4 className="font-semibold text-sm">{quality.label}</h4>
                <p className="text-xs text-muted-foreground mt-1">{quality.description}</p>
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
          Ver meu plano personalizado
        </Button>
      </div>
    </div>
  );
}
