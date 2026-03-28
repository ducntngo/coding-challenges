/** Minimal question data needed by the current scoring and progression flow. */
export interface QuizQuestionDefinition {
  readonly questionId: string;
  // acceptedAnswer is the authoritative correctness key for the challenge implementation.
  readonly acceptedAnswer: string;
}

/**
 * Quiz definition preserves questionIds separately so progression can rely on
 * a stable order without searching the question objects for sequence.
 */
export interface QuizDefinition {
  readonly quizId: string;
  readonly title: string;
  readonly questionIds: readonly string[];
  readonly questions: readonly QuizQuestionDefinition[];
}

/** Replaceable boundary for seeded quiz content versus a future real content service. */
export interface QuizDefinitionSource {
  getQuizDefinition(quizId: string): Promise<QuizDefinition | null>;
}
