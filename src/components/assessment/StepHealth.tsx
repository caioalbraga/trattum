import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface StepHealthProps {
  data: {
    hasTriedDiets: boolean;
    hasMedicalConditions: boolean;
    medicalConditions: string[];
    takesMedication: boolean;
  };
  onUpdate: (data: Partial<StepHealthProps['data']>) => void;
  onNext: () => void;
  onBack: () => void;
}

const conditions = [
  { id: 'diabetes', label: 'Diabetes tipo 2' },
  { id: 'hypertension', label: 'Hipertensão' },
  { id: 'cholesterol', label: 'Colesterol alto' },
  { id: 'thyroid', label: 'Problemas de tireoide' },
  { id: 'sleep_apnea', label: 'Apneia do sono' },
  { id: 'heart', label: 'Problemas cardíacos' },
];

export function StepHealth({ data, onUpdate, onNext, onBack }: StepHealthProps) {
  const toggleCondition = (conditionId: string) => {
    const current = data.medicalConditions || [];
    const updated = current.includes(conditionId)
      ? current.filter((c) => c !== conditionId)
      : [...current, conditionId];
    onUpdate({ medicalConditions: updated });
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground mb-2">
          Sobre sua saúde
        </h2>
        <p className="text-muted-foreground">
          Essas informações são essenciais para a avaliação médica
        </p>
      </div>

      <div className="space-y-6">
        <Card className="p-6 card-elevated">
          <h3 className="font-medium mb-4">Você já tentou outras dietas ou tratamentos antes?</h3>
          <div className="flex gap-4">
            <Button
              variant={data.hasTriedDiets ? "default" : "outline"}
              onClick={() => onUpdate({ hasTriedDiets: true })}
            >
              Sim
            </Button>
            <Button
              variant={data.hasTriedDiets === false ? "default" : "outline"}
              onClick={() => onUpdate({ hasTriedDiets: false })}
            >
              Não
            </Button>
          </div>
        </Card>

        <Card className="p-6 card-elevated">
          <h3 className="font-medium mb-4">Você possui alguma condição de saúde?</h3>
          <div className="flex gap-4 mb-4">
            <Button
              variant={data.hasMedicalConditions ? "default" : "outline"}
              onClick={() => onUpdate({ hasMedicalConditions: true })}
            >
              Sim
            </Button>
            <Button
              variant={data.hasMedicalConditions === false ? "default" : "outline"}
              onClick={() => onUpdate({ hasMedicalConditions: false })}
            >
              Não
            </Button>
          </div>

          {data.hasMedicalConditions && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">Selecione as que se aplicam:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {conditions.map((condition) => (
                  <div key={condition.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={condition.id}
                      checked={data.medicalConditions?.includes(condition.id)}
                      onCheckedChange={() => toggleCondition(condition.id)}
                    />
                    <Label htmlFor={condition.id} className="cursor-pointer">
                      {condition.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6 card-elevated">
          <h3 className="font-medium mb-4">Você toma alguma medicação regularmente?</h3>
          <div className="flex gap-4">
            <Button
              variant={data.takesMedication ? "default" : "outline"}
              onClick={() => onUpdate({ takesMedication: true })}
            >
              Sim
            </Button>
            <Button
              variant={data.takesMedication === false ? "default" : "outline"}
              onClick={() => onUpdate({ takesMedication: false })}
            >
              Não
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Voltar
        </Button>
        <Button variant="coral" size="lg" onClick={onNext}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
