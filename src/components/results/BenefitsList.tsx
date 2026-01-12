import { Heart, Smile, Apple, Target } from "lucide-react";

const benefits = [
  { icon: Heart, label: 'Saúde física em dia' },
  { icon: Smile, label: 'Mais bem-estar' },
  { icon: Apple, label: 'Uma boa alimentação' },
  { icon: Target, label: 'Resultados em poucos meses' },
];

export function BenefitsList() {
  return (
    <div className="mt-8">
      <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-4">
        O que mais você pode conquistar
      </p>
      <div className="grid grid-cols-2 gap-4">
        {benefits.map((benefit, index) => (
          <div key={index} className="flex items-center gap-2">
            <benefit.icon className="w-5 h-5 text-primary" />
            <span className="text-sm text-foreground">{benefit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
