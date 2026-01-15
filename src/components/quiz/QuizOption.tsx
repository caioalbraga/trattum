import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface QuizOptionProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  multiSelect?: boolean;
}

export function QuizOption({ label, selected, onClick, multiSelect = false }: QuizOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full p-4 text-left rounded-xl border-2 transition-all duration-200",
        "flex items-center justify-between gap-3",
        "hover:border-primary/50 hover:bg-primary/5",
        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
        selected 
          ? "border-primary bg-primary/10 text-foreground" 
          : "border-border bg-card text-foreground"
      )}
    >
      <span className="font-medium">{label}</span>
      <div 
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200",
          multiSelect && "rounded-md",
          selected 
            ? "border-primary bg-primary text-primary-foreground" 
            : "border-muted-foreground/30"
        )}
      >
        {selected && <Check className="w-4 h-4" />}
      </div>
    </button>
  );
}
