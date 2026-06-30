import type { ReviewQuestions } from "./reviewQuestions";

export interface ReviewAnswers {
  understanding: string;
  extraction: string;
  action: string;
}

export interface AnswerFeedback {
  acknowledgedPoints: string[];
  canAddOneThing: string;
  actionRecordCandidate: string;
  gentleClosing: string;
}

export interface AnswerFeedbackRequest {
  task: "answer_feedback";
  promptVersion: "answer_feedback_v1";
  questions: ReviewQuestions;
  answers: ReviewAnswers;
}

export interface AnswerFeedbackResponse {
  mode: "live" | "mock";
  reason?: string;
  feedback: AnswerFeedback;
}

export function createDefaultAnswerFeedback(answers: ReviewAnswers): AnswerFeedback {
  return {
    acknowledgedPoints: [
      answers.understanding.trim()
        ? "你已经用自己的话留下了对今天内容的理解。"
        : "你愿意停下来想一想，已经是在整理今天的阅读。",
      answers.extraction.trim()
        ? "你也提炼出了一个想带走的重点。"
        : "重点不必一次说得完整，先保留一个模糊方向也可以。",
    ],
    canAddOneThing: "如果还想补一点，可以加上一个让你产生这个理解的原文细节或生活例子。",
    actionRecordCandidate: answers.action.trim(),
    gentleClosing: "先留下这些就很好，不用一次把所有想法都整理完整。",
  };
}

export async function requestAnswerFeedback(payload: AnswerFeedbackRequest): Promise<AnswerFeedbackResponse> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch("/api/answer-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Answer feedback request failed with ${response.status}`);
    }

    return (await response.json()) as AnswerFeedbackResponse;
  } catch (error) {
    console.warn("Answer feedback request failed, using local fallback.", error);
    return {
      mode: "mock",
      reason: "api_error",
      feedback: createDefaultAnswerFeedback(payload.answers),
    };
  } finally {
    window.clearTimeout(timeout);
  }
}
