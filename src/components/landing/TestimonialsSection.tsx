import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const testimonials = [
  {
    name: "Alexandre P.",
    text: "O processo foi ágil e o investimento é justo pelo que entrega. Em menos de 3 dias recebi meu tratamento em casa, com total discrição.",
    rating: 5,
  },
  {
    name: "Eduardo B.",
    text: "Minha evolução tem sido consistente. A equipe médica trata meu caso com seriedade e o acompanhamento faz toda diferença nos resultados.",
    rating: 5,
  },
  {
    name: "Marcelo F.",
    text: "Finalmente encontrei um programa que funciona. O suporte clínico é atencioso e os resultados começaram a aparecer já nas primeiras semanas.",
    rating: 5,
  },
  {
    name: "Yuri C.",
    text: "Minha rotina não permitia consultas presenciais. Aqui consegui uma avaliação completa e o tratamento chegou direto na minha porta.",
    rating: 5,
  },
  {
    name: "Silvio G.",
    text: "O diferencial está no protocolo personalizado. São tratamentos validados cientificamente com acompanhamento real. Indico sem hesitar.",
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
              Resultados que transformam vidas
            </h2>
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
