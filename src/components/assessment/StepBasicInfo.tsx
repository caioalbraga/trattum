import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Scale, Ruler, Target } from "lucide-react";

interface StepBasicInfoProps {
  data: {
    currentWeight: number;
    height: number;
    targetWeight: number;
  };
  onUpdate: (data: Partial<StepBasicInfoProps['data']>) => void;
  onNext: () => void;
}

export function StepBasicInfo({ data, onUpdate, onNext }: StepBasicInfoProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.currentWeight || data.currentWeight < 40 || data.currentWeight > 300) {
      newErrors.currentWeight = "Peso deve estar entre 40 e 300 kg";
    }
    if (!data.height || data.height < 100 || data.height > 250) {
      newErrors.height = "Altura deve estar entre 100 e 250 cm";
    }
    if (!data.targetWeight || data.targetWeight < 40 || data.targetWeight > 300) {
      newErrors.targetWeight = "Meta de peso deve estar entre 40 e 300 kg";
    }
    if (data.targetWeight >= data.currentWeight) {
      newErrors.targetWeight = "A meta deve ser menor que o peso atual";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="animate-fade-in max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground mb-2">
          Vamos começar pelo básico
        </h2>
        <p className="text-muted-foreground">
          Essas informações nos ajudam a criar seu plano personalizado
        </p>
      </div>

      <Card className="p-6 space-y-6 card-elevated">
        <div className="space-y-2">
          <Label htmlFor="currentWeight" className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" />
            Peso atual (kg)
          </Label>
          <Input
            id="currentWeight"
            type="number"
            placeholder="Ex: 85"
            value={data.currentWeight || ""}
            onChange={(e) => onUpdate({ currentWeight: Number(e.target.value) })}
            className="h-12 text-lg"
          />
          {errors.currentWeight && (
            <p className="text-sm text-destructive">{errors.currentWeight}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="height" className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-primary" />
            Altura (cm)
          </Label>
          <Input
            id="height"
            type="number"
            placeholder="Ex: 170"
            value={data.height || ""}
            onChange={(e) => onUpdate({ height: Number(e.target.value) })}
            className="h-12 text-lg"
          />
          {errors.height && (
            <p className="text-sm text-destructive">{errors.height}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetWeight" className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Meta de peso (kg)
          </Label>
          <Input
            id="targetWeight"
            type="number"
            placeholder="Ex: 70"
            value={data.targetWeight || ""}
            onChange={(e) => onUpdate({ targetWeight: Number(e.target.value) })}
            className="h-12 text-lg"
          />
          {errors.targetWeight && (
            <p className="text-sm text-destructive">{errors.targetWeight}</p>
          )}
        </div>
      </Card>

      <div className="mt-8 flex justify-center">
        <Button variant="coral" size="lg" onClick={handleNext}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
