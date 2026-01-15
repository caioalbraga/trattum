import { InfoScreen as InfoScreenType } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";

interface InfoScreenProps {
  screen: InfoScreenType;
  onNext: (nextId: string) => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function InfoScreen({
  screen,
  onNext,
  onBack,
  canGoBack,
}: InfoScreenProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">{screen.title}</h2>
        <p className="text-muted-foreground max-w-md mx-auto">{screen.message}</p>
      </div>

      <div className="flex flex-col gap-3 max-w-xs mx-auto">
        <Button
          onClick={() => onNext(screen.next)}
          className="w-full"
        >
          {screen.action_label}
        </Button>
        
        {canGoBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        )}
      </div>
    </div>
  );
}
