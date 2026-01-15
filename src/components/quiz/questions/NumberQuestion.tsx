import { useState, useEffect } from "react";
import { NumberQuestion as NumberQuestionType } from "@/types/quiz";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuizNavigation } from "../QuizNavigation";

interface NumberQuestionProps {
  question: NumberQuestionType;
  answer: number | undefined;
  onAnswer: (value: number) => void;
  onNext: (nextId: string) => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function NumberQuestion({
  question,
  answer,
  onAnswer,
  onNext,
  onBack,
  canGoBack,
}: NumberQuestionProps) {
  const [value, setValue] = useState<string>(answer?.toString() || '');

  useEffect(() => {
    setValue(answer?.toString() || '');
  }, [answer, question.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onAnswer(num);
    }
  };

  const handleNext = () => {
    onNext(question.next);
  };

  const isValid = value !== '' && !isNaN(parseFloat(value));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">{question.question}</h2>
      </div>

      <div className="space-y-2">
        <Label htmlFor="number-input">Valor ({question.unit})</Label>
        <div className="relative">
          <Input
            id="number-input"
            type="number"
            value={value}
            onChange={handleChange}
            placeholder={`Digite o valor em ${question.unit}`}
            className="pr-12 text-lg"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {question.unit}
          </span>
        </div>
      </div>

      <QuizNavigation
        onBack={onBack}
        onNext={handleNext}
        canGoBack={canGoBack}
        canGoNext={isValid}
      />
    </div>
  );
}
