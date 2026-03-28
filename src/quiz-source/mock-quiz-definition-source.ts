import type { QuizDefinition, QuizDefinitionSource } from "./contracts";

const demoQuiz: QuizDefinition = {
  quizId: "demo-quiz",
  title: "Demo Vocabulary Quiz",
  questionIds: ["question-1"],
};

export class MockQuizDefinitionSource implements QuizDefinitionSource {
  private readonly quizzes = new Map<string, QuizDefinition>([
    [demoQuiz.quizId, demoQuiz],
  ]);

  async getQuizDefinition(quizId: string): Promise<QuizDefinition | null> {
    return this.quizzes.get(quizId) ?? null;
  }
}

export type { QuizDefinitionSource } from "./contracts";
