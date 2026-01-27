import { useQuiz } from "@/hooks/useQuiz";
import { useSubmitAssessment } from "@/hooks/useSubmitAssessment";
import { SingleQuestion } from "./questions/SingleQuestion";
import { MultipleQuestion } from "./questions/MultipleQuestion";
import { NumberQuestion } from "./questions/NumberQuestion";
import { MultipleNumbersQuestion } from "./questions/MultipleNumbersQuestion";
import { TextQuestion } from "./questions/TextQuestion";
import { InfoScreen } from "./questions/InfoScreen";
import { StopScreen } from "./questions/StopScreen";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const springTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

export function QuizContainer() {
  const navigate = useNavigate();
  const { submitAssessment, isSubmitting } = useSubmitAssessment();
  const {
    currentQuestion,
    answers,
    canGoBack,
    setAnswer,
    goNext,
    goBack,
    resetQuiz,
  } = useQuiz();

  const [direction, setDirection] = useState(1);
  const [questionKey, setQuestionKey] = useState(currentQuestion?.id || "loading");

  useEffect(() => {
    if (currentQuestion) {
      setQuestionKey(currentQuestion.id);
    }
  }, [currentQuestion]);

  if (!currentQuestion) {
    return (
      <div className="text-center py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-muted animate-pulse" />
          <div className="h-4 w-48 mx-auto rounded bg-muted animate-pulse" />
          <div className="h-3 w-32 mx-auto rounded bg-muted animate-pulse" />
        </motion.div>
      </div>
    );
  }

  // Handle final_results navigation with server-side validation
  const handleNext = async (nextId: string) => {
    setDirection(1);
    if (nextId === 'final_results') {
      // Submit assessment to database (requires auth)
      const result = await submitAssessment(answers);
      if (result.success) {
        navigate('/results');
      }
      // If not successful, submitAssessment handles redirect to auth
      return;
    }
    goNext(nextId);
  };

  const handleBack = () => {
    setDirection(-1);
    goBack();
  };

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'single':
        return (
          <SingleQuestion
            question={currentQuestion}
            answer={answers[currentQuestion.id] as string | undefined}
            onAnswer={(value) => setAnswer(currentQuestion.id, value)}
            onNext={handleNext}
            onBack={handleBack}
            canGoBack={canGoBack}
          />
        );
      
      case 'multiple':
        return (
          <MultipleQuestion
            question={currentQuestion}
            answer={answers[currentQuestion.id] as string[] | undefined}
            onAnswer={(value) => setAnswer(currentQuestion.id, value)}
            onNext={handleNext}
            onBack={handleBack}
            canGoBack={canGoBack}
          />
        );
      
      case 'number':
        return (
          <NumberQuestion
            question={currentQuestion}
            answer={answers[currentQuestion.id] as number | undefined}
            onAnswer={(value) => setAnswer(currentQuestion.id, value)}
            onNext={handleNext}
            onBack={handleBack}
            canGoBack={canGoBack}
          />
        );
      
      case 'multiple_numbers':
        return (
          <MultipleNumbersQuestion
            question={currentQuestion}
            answer={answers[currentQuestion.id] as { [fieldId: string]: number } | undefined}
            onAnswer={(value) => setAnswer(currentQuestion.id, value)}
            onNext={handleNext}
            onBack={handleBack}
            canGoBack={canGoBack}
          />
        );
      
      case 'text':
        return (
          <TextQuestion
            question={currentQuestion}
            answer={answers[currentQuestion.id] as string | undefined}
            onAnswer={(value) => setAnswer(currentQuestion.id, value)}
            onNext={handleNext}
            onBack={handleBack}
            canGoBack={canGoBack}
          />
        );
      
      case 'info':
        return (
          <InfoScreen
            screen={currentQuestion}
            onNext={handleNext}
            onBack={handleBack}
            canGoBack={canGoBack}
          />
        );
      
      case 'stop':
        return (
          <StopScreen
            screen={currentQuestion}
            onRestart={resetQuiz}
            onBack={handleBack}
            canGoBack={canGoBack}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-xl mx-auto overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={questionKey}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={springTransition}
        >
          {renderQuestion()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
