import { useState, useEffect } from "react";
import { MultipleQuestion as MultipleQuestionType } from "@/types/quiz";
import { QuizOption } from "../QuizOption";
import { QuizNavigation } from "../QuizNavigation";

interface MultipleQuestionProps {
  question: MultipleQuestionType;
  answer: string[] | undefined;
  onAnswer: (value: string[]) => void;
  onNext: (nextId: string) => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function MultipleQuestion({
  question,
  answer,
  onAnswer,
  onNext,
  onBack,
  canGoBack,
}: MultipleQuestionProps) {
  const [selected, setSelected] = useState<string[]>(answer || []);

  useEffect(() => {
    setSelected(answer || []);
  }, [answer, question.id]);

  const handleToggle = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value];
    
    setSelected(newSelected);
    onAnswer(newSelected);
  };

  const handleNext = () => {
    // Use the first selected option's next value
    const firstOption = question.options.find(o => selected.includes(o.value));
    if (firstOption) {
      onNext(firstOption.next);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">{question.question}</h2>
        {question.description && (
          <p className="text-muted-foreground">{question.description}</p>
        )}
        <p className="text-sm text-muted-foreground">Selecione uma ou mais opções</p>
      </div>

      <div className="space-y-3">
        {question.options.map((option) => (
          <QuizOption
            key={option.value}
            label={option.label}
            selected={selected.includes(option.value)}
            onClick={() => handleToggle(option.value)}
            multiSelect
          />
        ))}
      </div>

      <QuizNavigation
        onBack={onBack}
        onNext={handleNext}
        canGoBack={canGoBack}
        canGoNext={selected.length > 0}
      />
    </div>
  );
}
