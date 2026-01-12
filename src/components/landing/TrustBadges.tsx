import { Shield, Truck, RefreshCw, Stethoscope } from "lucide-react";

const badges = [
  {
    icon: Shield,
    title: "Tratamentos elaborados e vendidos por farmácias de manipulação",
    highlight: "autorizadas pela Anvisa",
  },
  {
    icon: Truck,
    title: "Entrega",
    highlight: "rápida e gratuita",
  },
  {
    icon: RefreshCw,
    title: "Planos flexíveis.",
    highlight: "Cancele quando quiser.",
  },
  {
    icon: Stethoscope,
    title: "Acompanhamento",
    highlight: "clínico",
  },
];

export function TrustBadges() {
  return (
    <section className="py-16 border-y border-border/50">
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {badges.map((badge, index) => (
            <div key={index} className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/60 flex items-center justify-center">
                <badge.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {badge.title}{" "}
                <span className="font-medium text-foreground">{badge.highlight}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
