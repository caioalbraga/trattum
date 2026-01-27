import { useState, useEffect } from "react";
import { SingleQuestion as SingleQuestionType } from "@/types/quiz";
import { QuizOption } from "../QuizOption";
import { QuizNavigation } from "../QuizNavigation";
import { motion } from "framer-motion";

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
    <div className="space-y-6">
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <h2 className="text-2xl font-semibold text-foreground">{question.question}</h2>
        {question.description && (
          <p className="text-muted-foreground">{question.description}</p>
        )}
      </motion.div>

      <div className="space-y-3">
        {question.options.map((option, index) => (
          <QuizOption
            key={option.value}
            label={option.label}
            selected={selected === option.value}
            onClick={() => handleSelect(option.value)}
            index={index}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: question.options.length * 0.08 + 0.2 }}
      >
        <QuizNavigation
          onBack={onBack}
          onNext={handleNext}
          canGoBack={canGoBack}
          canGoNext={!!selected}
        />
      </motion.div>
    </div>
  );
}
