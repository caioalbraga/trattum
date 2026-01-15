import { useState, useEffect } from "react";
import { TextQuestion as TextQuestionType } from "@/types/quiz";
import { Textarea } from "@/components/ui/textarea";
import { QuizNavigation } from "../QuizNavigation";

interface TextQuestionProps {
  question: TextQuestionType;
  answer: string | undefined;
  onAnswer: (value: string) => void;
  onNext: (nextId: string) => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function TextQuestion({
  question,
  answer,
  onAnswer,
  onNext,
  onBack,
  canGoBack,
}: TextQuestionProps) {
  const [value, setValue] = useState<string>(answer || '');

  useEffect(() => {
    setValue(answer || '');
  }, [answer, question.id]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    onAnswer(e.target.value);
  };

  const handleNext = () => {
    onNext(question.next);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">{question.question}</h2>
      </div>

      <Textarea
        value={value}
        onChange={handleChange}
        placeholder={question.placeholder}
        rows={4}
        className="text-lg resize-none"
      />

      <QuizNavigation
        onBack={onBack}
        onNext={handleNext}
        canGoBack={canGoBack}
        canGoNext={value.trim().length > 0}
      />
    </div>
  );
}
