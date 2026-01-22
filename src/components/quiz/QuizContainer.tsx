import { useQuiz } from "@/hooks/useQuiz";
import { useSubmitAssessment } from "@/hooks/useSubmitAssessment";
import { QuizProgress } from "./QuizProgress";
import { SingleQuestion } from "./questions/SingleQuestion";
import { MultipleQuestion } from "./questions/MultipleQuestion";
import { NumberQuestion } from "./questions/NumberQuestion";
import { MultipleNumbersQuestion } from "./questions/MultipleNumbersQuestion";
import { TextQuestion } from "./questions/TextQuestion";
import { InfoScreen } from "./questions/InfoScreen";
import { StopScreen } from "./questions/StopScreen";
import { useNavigate } from "react-router-dom";

export function QuizContainer() {
  const navigate = useNavigate();
  const { submitAssessment, isSubmitting } = useSubmitAssessment();
  const {
    currentQuestion,
    answers,
    progress,
    canGoBack,
    setAnswer,
    goNext,
    goBack,
    resetQuiz,
  } = useQuiz();

  if (!currentQuestion) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Carregando questionário...</p>
      </div>
    );
  }

  // Handle final_results navigation with server-side validation
  const handleNext = async (nextId: string) => {
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

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'single':
        return (
          <SingleQuestion
            question={currentQuestion}
            answer={answers[currentQuestion.id] as string | undefined}
            onAnswer={(value) => setAnswer(currentQuestion.id, value)}
            onNext={handleNext}
            onBack={goBack}
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
            onBack={goBack}
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
            onBack={goBack}
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
            onBack={goBack}
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
            onBack={goBack}
            canGoBack={canGoBack}
          />
        );
      
      case 'info':
        return (
          <InfoScreen
            screen={currentQuestion}
            onNext={handleNext}
            onBack={goBack}
            canGoBack={canGoBack}
          />
        );
      
      case 'stop':
        return (
          <StopScreen
            screen={currentQuestion}
            onRestart={resetQuiz}
            onBack={goBack}
            canGoBack={canGoBack}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      {currentQuestion.type !== 'stop' && currentQuestion.type !== 'info' && (
        <QuizProgress progress={progress} />
      )}
      {renderQuestion()}
    </div>
  );
}
