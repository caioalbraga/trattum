import { useState, useEffect } from "react";
import { SingleQuestion as SingleQuestionType } from "@/types/quiz";
import { QuizOption } from "../QuizOption";
import { QuizNavigation } from "../QuizNavigation";

interface SingleQuestionProps {
  question: SingleQuestionType;
  answer: string | undefined;
  onAnswer: (value: string) => void;
  onNext: (nextId: string) => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function SingleQuestion({
  question,
  answer,
  onAnswer,
  onNext,
  onBack,
  canGoBack,
}: SingleQuestionProps) {
  const [selected, setSelected] = useState<string>(answer || '');

  useEffect(() => {
    setSelected(answer || '');
  }, [answer, question.id]);

  const handleSelect = (value: string) => {
    setSelected(value);
    onAnswer(value);
  };

  const handleNext = () => {
    const selectedOption = question.options.find(o => o.value === selected);
    if (selectedOption) {
      onNext(selectedOption.next);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">{question.question}</h2>
        {question.description && (
          <p className="text-muted-foreground">{question.description}</p>
        )}
      </div>

      <div className="space-y-3">
        {question.options.map((option) => (
          <QuizOption
            key={option.value}
            label={option.label}
            selected={selected === option.value}
            onClick={() => handleSelect(option.value)}
          />
        ))}
      </div>

      <QuizNavigation
        onBack={onBack}
        onNext={handleNext}
        canGoBack={canGoBack}
        canGoNext={!!selected}
      />
    </div>
  );
}
