export interface QuizQuestionDefinition {
  readonly questionId: string;
  readonly acceptedAnswer: string;
}

export interface QuizDefinition {
  readonly quizId: string;
  readonly title: string;
  readonly questionIds: readonly string[];
  readonly questions: readonly QuizQuestionDefinition[];
}

export interface QuizDefinitionSource {
  getQuizDefinition(quizId: string): Promise<QuizDefinition | null>;
}
