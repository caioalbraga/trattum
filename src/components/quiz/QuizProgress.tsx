import { cn } from "@/lib/utils";

interface QuizProgressProps {
  progress: number;
}

export function QuizProgress({ progress }: QuizProgressProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-muted-foreground">Progresso</span>
        <span className="text-sm font-medium text-foreground">{Math.round(progress)}%</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full bg-primary rounded-full transition-all duration-500 ease-out"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
