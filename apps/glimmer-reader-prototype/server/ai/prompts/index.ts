import type { AiTask } from "../types";

export type PromptVersion =
  | "daily_summary_v1"
  | "direct_question_v1"
  | "contextual_answer_v1"
  | "review_questions_v1"
  | "answer_feedback_v1";

export interface PromptDefinition<TInput = unknown, TFallback = unknown> {
  task: AiTask;
  promptVersion: PromptVersion;
  systemPrompt: string;
  buildUserPrompt: (input: TInput) => string;
  responseFormat: { type: "json_object" };
  fallback: (input: TInput) => TFallback;
}

interface DailySummaryPromptInput {
  bookTitle: string;
  author: string;
  chapterTitle: string;
  startPage: number;
  endPage: number;
  readingMinutes: number;
  excerpts: string[];
  userGoal: string;
}

interface DirectQuestionPromptInput {
  question: string;
}

interface ContextualAnswerPromptInput {
  question: string;
  bookTitle: string;
  chapterTitle: string;
  pageNumber: number;
  contextParagraphs: string[];
}

interface AnswerFeedbackPromptInput {
  answers: {
    understanding: string;
    extraction: string;
    action: string;
  };
}

const responseFormat = { type: "json_object" } as const;

function buildReadableExcerptPoint(excerpts: string[]): string {
  const firstExcerpt = excerpts.find((excerpt) => excerpt.trim().length > 0)?.replace(/\s+/g, " ").trim();

  if (!firstExcerpt) {
    return "今天的阅读内容可以先收成一个小线索，明天再慢慢接上。";
  }

  const firstSentence = firstExcerpt.match(/^.{12,90}?[。！？；]/)?.[0];
  const readable = firstSentence || firstExcerpt.slice(0, 72).replace(/[，、：；,.!?！？。]*$/, "");
  return `本次内容较长，先轻轻收束一点：${readable}`;
}

const promptDefinitions: PromptDefinition[] = [
  {
    task: "daily_summary",
    promptVersion: "daily_summary_v1",
    systemPrompt: [
      "你是微光伴读的读后复盘助手。",
      "你只基于用户本次确认的阅读范围生成今日总结，不总结整本书，不扩展到未提供内容。",
      "输出一句温和 quote 和三个今日要点，不生成三道问题，不评价用户，不制造行动压力。",
      "语气温和、清楚、低压力。",
      "输出必须只包含一个合法 JSON object，不要 Markdown，不要代码块，不要解释文字，不要额外字段。",
      "JSON object 必须完全符合：{\"quote\":\"...\",\"items\":[\"...\",\"...\",\"...\"]}。",
      "quote 必须是字符串；items 必须正好 3 条，每条都是完整中文句子。",
    ].join("\n"),
    buildUserPrompt: (input: DailySummaryPromptInput) =>
      [
        `书名：${input.bookTitle}`,
        `作者：${input.author}`,
        `章节：${input.chapterTitle}`,
        `阅读范围：第 ${input.startPage} 页至第 ${input.endPage} 页`,
        `阅读时长：${input.readingMinutes} 分钟`,
        `用户目标：${input.userGoal}`,
        "",
        "本次确认阅读范围内的完整内容：",
        input.excerpts.map((excerpt, index) => `${index + 1}. ${excerpt}`).join("\n"),
        "",
        "请输出 JSON：",
        "只返回 JSON object 本身，不要添加任何 JSON 之外的文字。",
        JSON.stringify({
          quote: "一句温和鼓励，18-38 个中文字符",
          items: [
            "今天读到的核心内容，不超过 100 个中文字符",
            "一个关键理解，不超过 100 个中文字符",
            "一个轻量带走点，不超过 100 个中文字符",
          ],
        }),
      ].join("\n"),
    responseFormat,
    fallback: (input: DailySummaryPromptInput) => ({
      quote: "微光已经亮起，今天先读到这里也很好。",
      items: [
        `你今天读到了《${input.bookTitle}》第 ${input.startPage} 页至第 ${input.endPage} 页，先开始这件事本身就值得被记录。`,
        buildReadableExcerptPoint(input.excerpts),
        "如果还想继续复盘，可以等看完总结后再选择下一步问题。",
      ],
    }),
  },
  {
    task: "direct_question",
    promptVersion: "direct_question_v1",
    systemPrompt: [
      "你是微光伴读的阅读辅助 AI。",
      "当前任务是直接问：用户会问一个不带原文上下文的问题。",
      "不要假装看过用户当前阅读的原文，不要引用当前页、当前段落或作者这句话。",
      "回答要短、清楚、温和，可以给一个生活化例子，并轻轻引导回阅读。",
      "输出必须是 JSON object。",
    ].join("\n"),
    buildUserPrompt: (input: DirectQuestionPromptInput) =>
      [
        `用户问题：${input.question}`,
        "",
        "请输出 JSON：",
        JSON.stringify({
          answer: "直接回答用户问题，简短清楚",
          example: "一个帮助理解的例子；不需要时为空字符串",
          returnHint: "一句温和提示，引导用户回到阅读或使用基于原文回答",
          needsContext: false,
          suggestContextMode: false,
        }),
      ].join("\n"),
    responseFormat,
    fallback: () => ({
      answer: "先给你一版轻量解释：这个问题可以先从概念本身理解，不必急着一次弄得很完整。",
      example: "",
      returnHint: "如果你是在当前段落里看到这个词，可以用“基于原文回答”再看它在那里的具体意思。",
      needsContext: false,
      suggestContextMode: false,
    }),
  },
  {
    task: "contextual_answer",
    promptVersion: "contextual_answer_v1",
    systemPrompt: [
      "你是微光伴读的阅读辅助 AI。",
      "当前任务是基于原文回答：只基于提供的当前页与邻近段落解释用户问题。",
      "不要使用整本书知识，不要猜测未提供章节，不要把回答扩展成整书总结。",
      "回答要简短、清楚、温和，并给出一个来自输入上下文的原文依据。",
      "输出必须是 JSON object。",
    ].join("\n"),
    buildUserPrompt: (input: ContextualAnswerPromptInput) =>
      [
        `书名：${input.bookTitle}`,
        `章节：${input.chapterTitle}`,
        `当前页：${input.pageNumber}`,
        `用户问题：${input.question}`,
        "",
        "可使用的原文上下文：",
        input.contextParagraphs.map((paragraph, index) => `${index + 1}. ${paragraph}`).join("\n"),
        "",
        "请输出 JSON：",
        JSON.stringify({
          answer: "基于原文上下文的简短解释",
          citedSnippet: "最能支持回答的一小段原文",
          returnHint: "一句温和提示，引导用户回到原文继续读",
        }),
      ].join("\n"),
    responseFormat,
    fallback: () => ({
      answer: "这段内容可以先理解为：作者正在围绕当前原文里的关键概念做解释。可以不用急着一次全懂，先抓住这一个点就好。",
      citedSnippet: "",
      returnHint: "可以回到这一页继续往下读，后面的句子可能会帮你把关系连起来。",
    }),
  },
  {
    task: "review_questions",
    promptVersion: "review_questions_v1",
    systemPrompt: "预留：生成理解、提炼、行动三道低压力问题。",
    buildUserPrompt: () => "预留接口，本批仍使用 mock。",
    responseFormat,
    fallback: () => ({
      understanding: {
        id: "understanding",
        title: "理解",
        question: "今天的阅读内容主要讲了什么？",
        placeholder: "不用写很多，先留下你的理解。",
      },
      extraction: {
        id: "extraction",
        title: "提炼",
        question: "今天最值得带走的一点是什么？",
        placeholder: "试着收成一句自己的话。",
      },
      action: {
        id: "action",
        title: "行动",
        question: "明天可以尝试哪一个小行动？",
        placeholder: "写下一个足够轻的小尝试。",
      },
    }),
  },
  {
    task: "answer_feedback",
    promptVersion: "answer_feedback_v1",
    systemPrompt: "预留：生成温和答案反馈。",
    buildUserPrompt: () => "预留接口，本批仍使用 mock。",
    responseFormat,
    fallback: (input: AnswerFeedbackPromptInput) => ({
      acknowledgedPoints: [
        input.answers.understanding.trim()
          ? "你已经用自己的话留下了对今天内容的理解。"
          : "你愿意停下来想一想，已经是在整理今天的阅读。",
        input.answers.extraction.trim()
          ? "你也提炼出了一个想带走的重点。"
          : "重点不必一次说得完整，先保留一个模糊方向也可以。",
      ],
      canAddOneThing: "如果还想补一点，可以加上一个让你产生这个理解的原文细节或生活例子。",
      actionRecordCandidate: input.answers.action.trim(),
      gentleClosing: "先留下这些就很好，不用一次把所有想法都整理完整。",
    }),
  },
];

export function getPromptDefinition<TInput = unknown, TFallback = unknown>(
  task: AiTask,
  promptVersion: PromptVersion,
): PromptDefinition<TInput, TFallback> {
  const definition = promptDefinitions.find((item) => item.task === task && item.promptVersion === promptVersion);

  if (!definition) {
    throw new Error(`Unknown prompt definition: ${task}/${promptVersion}`);
  }

  return definition as PromptDefinition<TInput, TFallback>;
}
