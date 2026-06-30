import type { AiModelTier, AiReasoningEffort, AiTask, AiThinkingConfig } from "./types";

interface ModelRouteInput {
  task: AiTask;
  inputCharCount: number;
  text?: string;
  smallModel?: string;
  proModel?: string;
}

interface ModelRoute {
  model: string;
  tier: AiModelTier;
  thinking: AiThinkingConfig;
  reasoningEffort?: AiReasoningEffort;
}

const COMPLEX_PATTERNS = [
  /分析/,
  /比较/,
  /对比/,
  /区别/,
  /差异/,
  /关系/,
  /机制/,
  /原因/,
  /推理/,
  /权衡/,
  /为什么/,
  /如何理解/,
  /多个概念/,
  /分析/,
  /比较/,
  /对比/,
  /区别/,
  /差异/,
  /关系/,
  /机制/,
  /原因/,
  /推理/,
  /权衡/,
  /为什么/,
  /如何理解/,
  /总结.*(这些|多个|几段)/,
];

const DIRECT_QUESTION_COMPLEX_PATTERNS = [
  /影响/,
];

export function selectModelForTask(input: ModelRouteInput): ModelRoute {
  const smallModel = input.smallModel || process.env.DEEPSEEK_SMALL_MODEL || "deepseek-v4-flash";
  const proModel = input.proModel || process.env.DEEPSEEK_PRO_MODEL || "deepseek-v4-pro";
  const text = input.text || "";
  const isComplex =
    input.inputCharCount > 1_500 ||
    (input.task === "direct_question" && input.inputCharCount > 180) ||
    input.task === "answer_feedback" ||
    COMPLEX_PATTERNS.some((pattern) => pattern.test(text)) ||
    (input.task === "direct_question" && DIRECT_QUESTION_COMPLEX_PATTERNS.some((pattern) => pattern.test(text)));

  if (isComplex) {
    return {
      model: proModel,
      tier: "pro",
      thinking: { type: "enabled" },
      reasoningEffort: "high",
    };
  }

  return {
    model: smallModel,
    tier: "flash",
    thinking: { type: "disabled" },
  };
}
