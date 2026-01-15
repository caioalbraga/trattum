import { useState } from "react";
import { StopScreen as StopScreenType } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { XCircle, RotateCcw, ArrowLeft } from "lucide-react";

interface StopScreenProps {
  screen: StopScreenType;
  onRestart: () => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function StopScreen({
  screen,
  onRestart,
  onBack,
  canGoBack,
}: StopScreenProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
        <XCircle className="w-8 h-8 text-destructive" />
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">{screen.title}</h2>
        <p className="text-muted-foreground max-w-md mx-auto">{screen.message}</p>
      </div>

      {screen.checkbox && (
        <div className="flex items-center justify-center gap-2">
          <Checkbox
            id="agree-checkbox"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
          />
          <Label htmlFor="agree-checkbox" className="text-sm text-muted-foreground">
            {screen.checkbox}
          </Label>
        </div>
      )}

      <div className="flex flex-col gap-3 max-w-xs mx-auto">
        {canGoBack && (
          <Button
            variant="outline"
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {screen.action_label}
          </Button>
        )}
        
        <Button
          variant="ghost"
          onClick={onRestart}
          className="flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Recomeçar do início
        </Button>
      </div>
    </div>
  );
}
