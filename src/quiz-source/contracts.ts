export interface QuizDefinition {
  readonly quizId: string;
  readonly title: string;
  readonly questionIds: readonly string[];
}

export interface QuizDefinitionSource {
  getQuizDefinition(quizId: string): Promise<QuizDefinition | null>;
}
