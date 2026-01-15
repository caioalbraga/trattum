import { useState, useEffect, useMemo } from "react";
import { MultipleNumbersQuestion as MultipleNumbersQuestionType } from "@/types/quiz";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuizNavigation } from "../QuizNavigation";
import { AlertCircle } from "lucide-react";

interface MultipleNumbersQuestionProps {
  question: MultipleNumbersQuestionType;
  answer: { [fieldId: string]: number } | undefined;
  onAnswer: (value: { [fieldId: string]: number }) => void;
  onNext: (nextId: string) => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function MultipleNumbersQuestion({
  question,
  answer,
  onAnswer,
  onNext,
  onBack,
  canGoBack,
}: MultipleNumbersQuestionProps) {
  const [values, setValues] = useState<{ [fieldId: string]: string }>(() => {
    const initial: { [fieldId: string]: string } = {};
    question.fields.forEach(field => {
      initial[field.id] = answer?.[field.id]?.toString() || '';
    });
    return initial;
  });

  const [errors, setErrors] = useState<{ [fieldId: string]: string }>({});

  useEffect(() => {
    const initial: { [fieldId: string]: string } = {};
    question.fields.forEach(field => {
      initial[field.id] = answer?.[field.id]?.toString() || '';
    });
    setValues(initial);
    setErrors({});
  }, [answer, question.id]);

  const handleChange = (fieldId: string, value: string) => {
    const newValues = { ...values, [fieldId]: value };
    setValues(newValues);
    
    // Convert to numbers for the answer
    const numericValues: { [fieldId: string]: number } = {};
    Object.entries(newValues).forEach(([id, val]) => {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        numericValues[id] = num;
      }
    });
    
    onAnswer(numericValues);
  };

  const validation = useMemo(() => {
    const newErrors: { [fieldId: string]: string } = {};
    let isValid = true;

    question.fields.forEach(field => {
      const val = values[field.id];
      const num = parseFloat(val);

      if (field.required && (val === '' || isNaN(num))) {
        newErrors[field.id] = 'Campo obrigatório';
        isValid = false;
      } else if (val !== '' && !isNaN(num)) {
        if (num < field.min) {
          newErrors[field.id] = `Valor mínimo: ${field.min} ${field.unit}`;
          isValid = false;
        } else if (num > field.max) {
          newErrors[field.id] = `Valor máximo: ${field.max} ${field.unit}`;
          isValid = false;
        }
      }
    });

    // BMI validation
    const altura = parseFloat(values['altura'] || '0');
    const peso = parseFloat(values['peso'] || '0');
    
    if (altura > 0 && peso > 0) {
      const bmi = peso / Math.pow(altura / 100, 2);
      if (bmi < 15) {
        newErrors['bmi'] = 'IMC muito baixo. Por favor, verifique os valores.';
        isValid = false;
      }
    }

    return { errors: newErrors, isValid };
  }, [values, question.fields]);

  const handleNext = () => {
    setErrors(validation.errors);
    if (validation.isValid) {
      onNext(question.next);
    }
  };

  // Calculate and display BMI if altura and peso are available
  const bmiInfo = useMemo(() => {
    const altura = parseFloat(values['altura'] || '0');
    const peso = parseFloat(values['peso'] || '0');
    
    if (altura >= 90 && altura <= 250 && peso > 0) {
      const bmi = peso / Math.pow(altura / 100, 2);
      return {
        value: bmi.toFixed(1),
        category: bmi < 18.5 ? 'Abaixo do peso' :
                  bmi < 25 ? 'Peso normal' :
                  bmi < 30 ? 'Sobrepeso' : 'Obesidade'
      };
    }
    return null;
  }, [values]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">{question.question}</h2>
      </div>

      <div className="space-y-4">
        {question.fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>
            <div className="relative">
              <Input
                id={field.id}
                type="number"
                value={values[field.id] || ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                className={`pr-12 text-lg ${errors[field.id] ? 'border-destructive' : ''}`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {field.unit}
              </span>
            </div>
            {errors[field.id] && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors[field.id]}
              </p>
            )}
          </div>
        ))}

        {bmiInfo && (
          <div className="p-4 bg-muted rounded-xl space-y-1">
            <p className="text-sm text-muted-foreground">Seu IMC calculado:</p>
            <p className="text-2xl font-semibold text-foreground">{bmiInfo.value}</p>
            <p className="text-sm text-muted-foreground">{bmiInfo.category}</p>
          </div>
        )}

        {errors['bmi'] && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors['bmi']}
          </p>
        )}
      </div>

      <QuizNavigation
        onBack={onBack}
        onNext={handleNext}
        canGoBack={canGoBack}
        canGoNext={true}
      />
    </div>
  );
}
