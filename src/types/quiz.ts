export type QuestionType = 'single' | 'multiple' | 'number' | 'multiple_numbers' | 'text' | 'info' | 'stop' | 'logic';

export interface QuestionOption {
  label: string;
  value: string;
  next: string;
}

export interface NumberField {
  id: string;
  label: string;
  unit: string;
  placeholder: string;
  min: number;
  max: number;
  required: boolean;
}

export interface BaseQuestion {
  id: string;
  step: number;
  type: QuestionType;
}

export interface SingleQuestion extends BaseQuestion {
  type: 'single';
  question: string;
  description?: string;
  options: QuestionOption[];
}

export interface MultipleQuestion extends BaseQuestion {
  type: 'multiple';
  question: string;
  description?: string;
  options: QuestionOption[];
}

export interface NumberQuestion extends BaseQuestion {
  type: 'number';
  question: string;
  unit: string;
  next: string;
}

export interface MultipleNumbersQuestion extends BaseQuestion {
  type: 'multiple_numbers';
  question: string;
  fields: NumberField[];
  next: string;
}

export interface TextQuestion extends BaseQuestion {
  type: 'text';
  question: string;
  placeholder: string;
  next: string;
}

export interface InfoScreen extends BaseQuestion {
  type: 'info';
  title: string;
  message: string;
  action_label: string;
  next: string;
}

export interface StopScreen extends BaseQuestion {
  type: 'stop';
  title: string;
  message: string;
  checkbox?: string;
  action_label: string;
}

export interface LogicQuestion extends BaseQuestion {
  type: 'logic';
  condition: string;
  if_true: string;
  if_false: string;
}

export type Question = 
  | SingleQuestion 
  | MultipleQuestion 
  | NumberQuestion 
  | MultipleNumbersQuestion 
  | TextQuestion 
  | InfoScreen 
  | StopScreen 
  | LogicQuestion;

export interface QuizAnswers {
  [questionId: string]: string | string[] | number | boolean | null | { [fieldId: string]: number | string };
}
