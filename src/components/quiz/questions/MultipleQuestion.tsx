import { useState, useEffect } from "react";
import { MultipleQuestion as MultipleQuestionType } from "@/types/quiz";
import { QuizOption } from "../QuizOption";
import { QuizNavigation } from "../QuizNavigation";
import { motion } from "framer-motion";

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
        <p className="text-sm text-muted-foreground">Selecione uma ou mais opções</p>
      </motion.div>

      <div className="space-y-3">
        {question.options.map((option, index) => (
          <QuizOption
            key={option.value}
            label={option.label}
            selected={selected.includes(option.value)}
            onClick={() => handleToggle(option.value)}
            multiSelect
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
          canGoNext={selected.length > 0}
        />
      </motion.div>
    </div>
  );
}
