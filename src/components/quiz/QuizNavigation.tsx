import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface QuizNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  nextLabel?: string;
  showNext?: boolean;
}

export function QuizNavigation({ 
  onBack, 
  onNext, 
  canGoBack, 
  canGoNext, 
  nextLabel = "Continuar",
  showNext = true 
}: QuizNavigationProps) {
  return (
    <div className="flex gap-3 mt-8">
      {canGoBack && (
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      )}
      
      {showNext && (
        <Button
          onClick={onNext}
          disabled={!canGoNext}
          className="flex-1 flex items-center justify-center gap-2"
        >
          {nextLabel}
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
