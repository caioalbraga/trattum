import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Scale, Ruler, Target, Activity } from "lucide-react";
import { calculateBMI, getBMICategory } from "@/lib/assessment-logic";

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

  const bmi = useMemo(() => {
    if (data.currentWeight && data.height) {
      return calculateBMI(data.currentWeight, data.height);
    }
    return 0;
  }, [data.currentWeight, data.height]);

  const bmiInfo = useMemo(() => {
    if (bmi > 0) {
      return getBMICategory(bmi);
    }
    return null;
  }, [bmi]);

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
      <div className="text-center mb-10">
        <h2 className="heading-section mb-3">
          Vamos começar pelo básico
        </h2>
        <p className="text-body-lg">
          Essas informações nos ajudam a criar seu plano personalizado
        </p>
      </div>

      <Card className="p-8 space-y-6 card-elevated">
        {/* Weight Input */}
        <div className="space-y-2">
          <Label htmlFor="currentWeight" className="flex items-center gap-2 text-sm font-medium">
            <Scale className="w-4 h-4 text-teal" />
            Peso atual (kg)
          </Label>
          <Input
            id="currentWeight"
            type="number"
            placeholder="Ex: 85"
            value={data.currentWeight || ""}
            onChange={(e) => onUpdate({ currentWeight: Number(e.target.value) })}
            className="h-14 text-lg bg-background"
          />
          {errors.currentWeight && (
            <p className="text-sm text-destructive">{errors.currentWeight}</p>
          )}
        </div>

        {/* Height Input */}
        <div className="space-y-2">
          <Label htmlFor="height" className="flex items-center gap-2 text-sm font-medium">
            <Ruler className="w-4 h-4 text-teal" />
            Altura (cm)
          </Label>
          <Input
            id="height"
            type="number"
            placeholder="Ex: 170"
            value={data.height || ""}
            onChange={(e) => onUpdate({ height: Number(e.target.value) })}
            className="h-14 text-lg bg-background"
          />
          {errors.height && (
            <p className="text-sm text-destructive">{errors.height}</p>
          )}
        </div>

        {/* BMI Display */}
        {bmi > 0 && bmiInfo && (
          <div className="bg-secondary/50 rounded-xl p-4 border border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal" />
                <span className="text-sm font-medium">Seu IMC</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{bmi.toFixed(1)}</span>
                <p className={`text-sm font-medium ${bmiInfo.color}`}>
                  {bmiInfo.category}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Target Weight Input */}
        <div className="space-y-2">
          <Label htmlFor="targetWeight" className="flex items-center gap-2 text-sm font-medium">
            <Target className="w-4 h-4 text-teal" />
            Meta de peso (kg)
          </Label>
          <Input
            id="targetWeight"
            type="number"
            placeholder="Ex: 70"
            value={data.targetWeight || ""}
            onChange={(e) => onUpdate({ targetWeight: Number(e.target.value) })}
            className="h-14 text-lg bg-background"
          />
          {errors.targetWeight && (
            <p className="text-sm text-destructive">{errors.targetWeight}</p>
          )}
          {data.currentWeight && data.targetWeight && data.targetWeight < data.currentWeight && (
            <p className="text-sm text-muted-foreground">
              Perda de {data.currentWeight - data.targetWeight}kg ({((data.currentWeight - data.targetWeight) / data.currentWeight * 100).toFixed(1)}% do peso atual)
            </p>
          )}
        </div>
      </Card>

      <div className="mt-10 flex justify-center">
        <Button 
          variant="coral" 
          size="lg" 
          onClick={handleNext}
          className="min-w-[200px]"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
