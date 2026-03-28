export interface HealthPayload {
  readonly status: "ok";
  readonly service: "real-time-quiz-service";
  readonly timestamp: string;
}

export function buildHealthPayload(now: Date = new Date()): HealthPayload {
  return {
    status: "ok",
    service: "real-time-quiz-service",
    timestamp: now.toISOString(),
  };
}
