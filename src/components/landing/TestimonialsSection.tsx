import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const testimonials = [
  {
    name: "Alexandre P.",
    text: "Foi tudo muito rápido e o preço é ótimo. Em menos de 3 dias o meu tratamento já estava em casa.",
    rating: 5,
  },
  {
    name: "Eduardo B.",
    text: "Os meus resultados estão sendo muito positivos! Aqui eu sei que estou falando com profissionais que tratam seriamente o meu problema.",
    rating: 5,
  },
  {
    name: "Marcelo F.",
    text: "A Manual está resolvendo meus problemas! Muito satisfeito com o atendimento e os resultados.",
    rating: 5,
  },
  {
    name: "Yuri C.",
    text: "Eu estava sem tempo para ir ao dermatologista. Na Manual tive a oportunidade de ser avaliado e ainda recebi os medicamentos em casa.",
    rating: 5,
  },
  {
    name: "Silvio G.",
    text: "O diferencial é que tem avaliando e são tratamentos que funcionam. Recomendo a todos.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const visibleCount = 4;
  const maxIndex = Math.max(0, testimonials.length - visibleCount);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  return (
    <section className="py-24">
      <div className="container">
        <div className="flex items-start justify-between mb-12">
          <div>
            <h2 className="heading-section text-foreground mb-4">
              O que nossos clientes dizem
            </h2>
            
            {/* Reclame Aqui Badge */}
            <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg">
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 bg-primary-foreground rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium">RA 1000</span>
              </div>
              <span className="text-xs opacity-80">ReclameAQUI</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex >= maxIndex}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Testimonial Cards */}
        <div className="overflow-hidden">
          <div 
            className="flex gap-6 transition-transform duration-300"
            style={{ transform: `translateX(-${currentIndex * (100 / visibleCount)}%)` }}
          >
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/4"
              >
                <div className="bg-card rounded-2xl p-6 h-full border border-border/30 shadow-sm">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                    ))}
                  </div>

                  {/* Text */}
                  <p className="text-foreground text-sm leading-relaxed mb-6">
                    {testimonial.text}
                  </p>

                  {/* Name */}
                  <p className="font-medium text-foreground">
                    {testimonial.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {[...Array(maxIndex + 1)].map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
