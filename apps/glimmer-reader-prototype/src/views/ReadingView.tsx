import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Clock, Menu, Check, CheckCircle, Smile, Volume2, VolumeX, Sparkles, AlertCircle, List, HelpCircle, CloudRain, Wind, Waves, Sun, Moon, MessageCircle } from "lucide-react";
import BookCover from "../components/BookCover";
import { Book } from "../data/books";
import dengTataSittingNew from "../assets/images/deng_tata_sitting_new.png";
import dengTataChatAvatar from "../assets/images/deng_tata_chat_avatar.png";
import ConfirmRangeView from "./ConfirmRangeView";
import ReadingFinishedView from "./ReadingFinishedView";
import DailySummaryView from "./DailySummaryView";
import QuestionsView from "./QuestionsView";
import FeedbackView from "./FeedbackView";
import RewardSummaryView from "./RewardSummaryView";
import {
  DEFAULT_DAILY_SUMMARY,
  DailySummary,
  requestDailySummary,
  type DailySummaryResponse,
} from "../api/dailySummary";
import {
  requestContextualAnswer,
  requestDirectQuestion,
  type ContextualAnswerResponse,
  type DirectQuestionResponse,
} from "../api/readingAssist";
import {
  DEFAULT_REVIEW_QUESTIONS,
  requestReviewQuestions,
  type ReviewQuestionsResponse,
} from "../api/reviewQuestions";
import {
  createDefaultAnswerFeedback,
  requestAnswerFeedback,
  type AnswerFeedbackResponse,
  type ReviewAnswers,
} from "../api/answerFeedback";
import {
  createAiRequestError,
  createAiRequestLoading,
  createAiRequestState,
  createAiRequestSuccess,
  type AiRequestState,
} from "../ai/aiRequestState";
import {
  createRewardSettlementRecord,
  settleReward,
  type RewardSettlementRecord,
} from "../rewards/rewardSettlement";
import { AiRequestCancelledError } from "../api/aiRequestClient";
import {
  createPendingSummaryEntry,
  type PendingSummaryEntry,
} from "../summary/pendingSummary";

// Types and Content Configurations
interface PageParagraph {
  text: string;
  paragraphIndex: number;
  startChar: number;
  endChar: number;
  isContinuation?: boolean;
}

interface CompiledPage {
  chapterTitle: string;
  paragraphs: PageParagraph[];
  isChapterStart?: boolean;
}

interface ReadingViewProps {
  onClose: () => void;
  onHome?: () => void;
  activeBook: Book;
  isDark?: boolean;
  onShowUIChange?: (show: boolean) => void;
  onCoreReadingStateChange?: (isActive: boolean) => void;
  startFromSummary?: PendingSummaryEntry | null;
  onGenerateReadLater?: (entry: PendingSummaryEntry) => void;
  onSummaryViewed?: () => void;
}

type AssistantTask = "direct_question" | "contextual_answer";
type AssistantResponse = DirectQuestionResponse | ContextualAnswerResponse;

const BOOK_CONTENTS: Record<string, { title: string, chapters: { title: string, paragraphs: string[] }[] }> = {
  "attention": {
    title: "注意力的边界",
    chapters: [
      {
        title: "简介",
        paragraphs: [
          "在这个信息极度过载、算法精准捕获眼球的时代，分心、拖延、精神内耗和无法进入深度工作状态，已经成为大多数年轻人的日常困境。",
          "当你面对堆积如山的复习资料、复杂的工程代码或是一份亟待撰写的报告时，你是否总是感到难以开始？你是否总是被手机屏幕上毫无意义的弹窗轻易打断？而在一天结束时，面对着几乎没有推进的进度条，你又是否会陷入深深的自我厌恶，责怪自己“不够自律”、“缺乏意志力”？",
          "传统的成功学 and 时间管理类书籍往往会火上浇油。它们向你兜售“自律改变人生”的鸡汤，要求你每天打卡、无休止地压榨自己的时间，仿佛只要拥有足够的意志力，人就可以像一台不知疲倦的计算机核心处理器一样，24 小时满负荷运转。",
          "《专注力的边界》旨在彻底打破这一极具破坏性、且违背人类生物学常理的误解。",
          "本书提出一个颠覆性的核心观点：专注力从来不是一种可以凭借意念无限延展的心理资源，而是一种具有明确生理机制和认知“边界”的稀缺能量。所谓的专注，绝不是咬紧牙关地死撑，而是学会识别大脑的物理限制，设计顺应认知规律的环境，并建立可持续的反馈循环。",
          "作者通过大量真实可核验的心理学实验、脑神经科学研究以及顶尖运动员的训练案例，像拆解精密仪器一样，为你硬核拆解注意力流失的每一个环节。你将在这本书中重新认识注意力的运作规律：",
          "为什么在任务开始之前，你的认知带宽就已经被“模糊性”消耗殆尽？为什么物理环境中的视觉噪音，正在无声地榨干你的流体智力？为什么缺乏“即时反馈”的刻苦，只是一种毫无意义的表演性勤奋？为什么连续几个小时的硬撑不仅无效，反而会破坏大脑的生理节律？",
          "通过本书，你将获得一套可以落地实操的专注力系统框架。你将学会降低任务的启动阻力，屏蔽环境干扰，建立被打断后的“快速存档机制”，并在疲劳与恢复的节律中找到平衡。无论你是面临繁重学业的大学生，还是需要深度处理复杂任务 of the 脑力工作者，这本书都将教你停止内耗，像系统性地训练肌肉一样，把被夺走的注意力一寸一寸地重新收回来。"
        ]
      },
      {
        title: "作者序 不要试图用纯粹的意志力对抗生物本能",
        paragraphs: [
          "1943年，第二次世界大战正处于绞肉机般的白热化阶段。英国皇家空军的将领们面临着一个令人头疼的致命难题：负责在海岸线上监控雷达屏幕的受训操作员，总是会在值班的中后段毫无理由地漏掉敌军潜艇的微弱信号。这并非因为这些年轻的士兵缺乏爱国热情，更不是因为他们玩忽职守。事实上，在开始值班的前半个小时内，他们的表现堪称完美，能够敏锐地捕捉到屏幕上任何微小的异常。",
          "为了解开这个关乎国家生外的谜团，剑桥大学心理学家诺曼·麦克沃思受命进行调查。他设计了一项极其枯燥但直击本质的心理学实验——著名的“麦克沃思时钟测试”。他让被试者坐在一个封闭的房间里，死死盯着一个只有一根黑色指针的空白表盘。指针通常每次跳动一格，但偶尔会毫无规律地跳动两格。被试者的任务，就是在这漫长、单调的观察中，准确捕捉到那些“跳动两格”的瞬间。",
          "实验产生的数据揭示了一个冷酷的生物学真相：在测试的最初三十分钟内，人们的准确率极高；但在三十分钟之后，漏报率开始呈现陡峭的上升曲线；到了两小时后，许多被试者甚至会眼睁睁地看着指针跳跃却毫无反应。麦克沃思将这种随着时间推移、注意力不可逆转地下降的现象，命名为“警觉衰退”。",
          "七十多年后的今天，战争的硝烟早已散去，我们也不再需要盯着单调的雷达屏幕去寻找敌军潜艇。然而，我们每天面对的认知挑战却有过之而无不及。当你坐在电脑前，试图攻克一个复杂的工程学方程、阅读晦涩的外语文献、梳理杂乱之章的数据，或是编写一段逻辑嵌套极深的代码时，你实际上正在经历一场现代版的、且强度成倍增加的“麦克沃思时钟测试”。",
          "在这个过程中，我们整个社会都对“专注”抱有一种极度浪漫化、甚至是有害的误解。",
          "在工业时代遗留下来的管理学惯性中，我们习惯于将人类的大脑等同于工厂里的流水线机器。我们以为，大脑就像是一块只要通上电就能无限运转的核心处理器。只要我们下定决心，喝下一杯浓缩咖啡，在心里默念三遍“我要自律”，我们就能连续高强度工作四五个小时。而一旦我们做不到，一旦我们中途拿起了手机，或者在书桌前感到烦躁不安、大脑一片空白，我们就会立刻陷入深深的自我厌恶：“我怎么这么没有意志力？”“我为什么总是管不住自己？”",
          "然而，这根本不是你的错，而是你对专注力的底层生物学机制一无所知。",
          "从进化学的角度来看，人类的大脑是一台极度渴望“节能”的器官。它只占我们体重的百分之二，却消耗着全身百分之二十的能量。而负责高级逻辑思考、抑制冲动和维持深层注意力的前额叶皮层，更是大脑中最耗能、最容易疲劳的区域。强迫前额叶皮层长时间保持高度集中，其难度不亚于让你用百米冲刺的速度去跑完一场马拉松。",
          "当你试图在健身房里突破深蹲或硬拉的生理极限时，你绝不会指望仅仅靠着一句空洞的“我要努力”就能凭空举起原本无法撼动的庞大重量。你知道你需要科学的训练周期、清晰的容量规划、对发力动作的精准拆解，以及对肌肉力竭边界的深刻认知。你会尊重肌肉的物理限制。",
          "然而，在面对同样具有物理 and 生理边界的大脑时，我们却总是试图用一种称为“硬撑”的蛮力去解决问题。",
          "更残酷的现实是，你所面对的干扰早已不再是雷达屏幕上的盲区，而是一个由世界上最聪明的头脑构建的“注意力经济”帝国。无数的算法工程师与行为心理学家在屏幕背后夜以日地工作，研究如何利用多巴胺反馈机制，精准地击穿你脆弱的心理防线，剥夺你本就稀缺的认知资源。在这样不对等的算力碾压下，单纯依靠个人的“意志力”去维持专注，无异于堂吉诃德向风车发起的冲锋。",
          "《专注力的边界》这本书的诞生，正是为了终结这种自我消耗的死循环。",
          "在接下来的章节中，我们将彻底抛弃那些空泛的成功学口号，转向对人类行为机制和神经科学的硬核拆解。我们将探讨为什么你总是卡在“开始”之前，为什么你的物理环境正在无声地榨干你的认知带宽，为什么机械的重复无法带来能力的跃升，以及如何在被打断后优雅而迅速地重新进入心流状态。",
          "专注力从来不是一种与生俱来的神秘天赋，也不是一种可以随意透支的信用额度。它是有边界的。只有当我们承认边界、尊重边界，并学会在这个边界之内搭建顺应人性的科学系统时，我们才能真正夺回对心智的掌控权。",
          "不要再试图用纯粹的意志力去对抗千万年进化而来的生物本能了。现在，让我们翻开下一页，学习如何像一个严谨的系统工程师一样，重新设计你的专注力框架。"
        ]
      },
      {
        title: "第一章 重新认识专注：为什么硬撑不起作用？",
        paragraphs: [
          "1943年，第二次世界大战正处于绞肉机般的白热化阶段。英国皇家空军的将领们面临着一个令人头疼的致命难题：负责监控雷达屏幕的受训操作员，总是会在值班的中后段毫无理由地漏掉敌军潜艇的微弱信号。这并非因为他们缺乏爱国热情或玩忽职守，事实上，在开始值班的前半个小时内，他们的表现堪称完美，能够敏锐地捕捉到任何风吹草动。",
          "为了解开这个关乎国家生外的谜团，剑桥大学心理学家诺曼·麦克沃思设计了一项极其枯燥但直击本质的心理学实验——著名的“麦克沃思时钟测试”。他让被试者坐在一个封闭房间里，盯着一个只有一根黑色指针的空白表盘。指针通常每次跳动一格，但偶尔会毫无规律地跳动两格。被试者的任务就是准确捕捉这些异常的跳动。实验数据揭示了一个冷酷的生物学真相：在最初的三十分钟内，人们的准确率极高；但在三十分钟后，漏报率开始呈现陡峭的上升曲线；到了两小时后，许多被试者甚至会眼睁睁看着指针跳飞却毫无反应。麦克沃思将这种随着时间推移、注意力不可逆转地下降的现象，命名为“警觉衰退”。",
          "【核心问题：为什么我们越是咬牙切齿地想要专注，反而越容易分心和疲惫？】在传统的自我管理叙事中，分心往往被粗暴地归结为“意志力薄弱”或“不够自律”。因此，当我们感到注意力涣散时，最本能的反应就是“硬撑”——喝下浓咖啡，咬紧牙关，强迫自己死死盯住眼前的任务。然而，麦克沃思的实验无情地证明了：硬撑，是专注力管理中最大的谎言。",
          "【行为背后的神经机制】人类大脑的前额叶皮层，主要负责抑制冲动、进行复杂逻辑思考以及维持注意力。你可以把它想象成一块容量极其有限、且极易发热的电池。高强度的注意力集中，本质上是大脑在持续地进行“神经元放电”以抑制周围无关的刺激。这种主动的“抑制”极其消耗葡萄糖和氧气。",
          "随着工作时间的延长，前额叶皮层的能量被迅速榨干，大脑的默认模式网络（负责走神和发散思维的区域）就会开始夺取控制权。这是一种大脑为了防止神经细胞因过度劳累而受损的自我保护机制。当你感到看不进书、频繁想看手机时，并不是你的道德出现了滑坡，而是你的神经递质已经耗竭，系统正在强制降频。",
          "【综合化场景的认知耗竭】想象你正在进行一项高强度的工科期末复习，比如啃一本厚重的可靠性工程学教材，或者推导复杂的威布尔分布公式，以应对价值工程的考试。在开头的四十分钟里，你的逻辑严密，公式的变形在你眼中清晰可见；但当时间来到第100分钟，哪怕是同一个你刚才推导过的公式，此刻在你眼里也开始变得像外星符号一样扭曲且难以理解。在这个临界点上继续“硬撑”，除了徒增挫败感和自我厌恶外，无法产生任何有价值的认知输出。",
          "【接纳并管理你的边界】我们必须彻底放弃对“无限意志力”的浪漫幻想，将专注力视为一种需要精打细算的稀缺资源。",
          "一是改变衡量专注的标准：停止使用“我在书桌前坐了多少个小时”来作为今日努力的衡量指标。这是一种毫无意义的“自我感动式”度量。高质量的专注只看两个硬性指标：你进入深度思考的程度，以及你最终产出的实质性成果。用成果交付来替代时长打卡。",
          "二是绘制个人的能量地形图：人的注意力不是一条平缓的直线，而是有波峰波谷的曲线。连续三天，用纸笔记录下你每天在哪些具体的时间段（如上午十点、下午三点）最容易感到烦躁、最渴望打开社交软件。这些高频的“分心时刻”具有高度的生理规律性，它们就是你当前专注力的天然边界。",
          "三是实行认知卸载与无负罪感停机：下次当你在复杂推导中感到大脑彻底停摆时，立刻停止对自己的道德批判。明确地告诉自己：“我的警觉性已经衰退，继续运转会损坏硬件。”此时，你应该果断合上书本，进行一次十五分钟的完全停机（离开座位，不看任何屏幕），让前额叶皮层重新积蓄能量。"
        ]
      },
      {
        title: "第二章 启动阻力：在开始之前，你的注意力去哪了？",
        paragraphs: [
          "早在 1927 年，柏林大学的心理学研究员布卢玛·蔡加尼克在维也纳的一家咖啡馆里观察到了一个令人费解的现象：这里的服务员能够不用任何纸笔，极其精准地记住那些还没有结账的复杂订单（包括谁点了什么咖啡、加了几块糖）；然而，只要客人一买单结账，如果你再转头去问服务员刚才那桌点了什么，他们会立刻忘得一干二净。",
          "为了验证这个现象，蔡加尼克在实验室里设计了一系列任务让被试者完成，并在中途故意打断其中一部分任务。测试结束后的回忆环节显示：人们对于那些“未完成”或“被打断”的任务，其记忆力是那些已完成任务的两倍。这种未闭环的任务在脑海中不断萦绕、持续占用认知资源的现象，被心理学界正式命名为“蔡加尼克效应”。",
          "【核心问题：为什么明明决定要学习或工作，却总是能在书桌前磨蹭半个小时以上，甚至去打扫一遍房间？】许多人在面对重要工作时，常常会陷入一种“启动瘫痪”的状态。我们并没有真正在工作，却已经感到精疲力竭。这种在正式开始前的严重消耗，往往来自两个维度的压迫：一是大脑后台堆积了大量未完成的琐事（蔡加尼克效应的耗电）；二是当前任务极度缺乏边界与清晰度，导致了巨大的心理恐慌。",
          "【行为背后的心理机制】大脑的杏仁核天生厌恶不确定性和模糊性。当你给大脑下达的指令是“我要复习这门课”或者“我要写这个软件”时，大脑并不能识别具体的行动路径。它只会将这个模糊的指令识别为一个庞大、不可控且充满威胁的怪物。为了逃避这种预期的痛苦和压力，大脑会迅速触发防御机制，指挥你转移注意力，去做那些反馈极其明确、阻力极小、能立刻带来多巴胺分泌的事情——比如刷几个短视频，或者整理一下毫无必要的桌面。",
          "【综合化场景的启动瘫痪】对于一个刚刚接触编程、自认是不懂代码的小白来说，如果试图独立开发一个基于网页的经典游戏，当遇到问题时，如果在心里给自己下达的命令是“我要修复消除和计分系统冲突”，那么大概率会陷入严重的拖延。因为“修复冲突”这个词太大了，它像一团迷雾，包含了定位相关文件、阅读之前写的旧逻辑、构思新的数据结构等无数个隐性步骤。在面对这种迷雾时，大脑的默认选择就是罢工。",
          "【降低启动成本的精准切割术】真正的高手，从不依靠爆发性的意志力来启动任务，而是依靠对任务阻力的精准外科手术式切割。",
          "其一，定义“下一步绝对物理动作”：永远不要用抽象的名词来描述任务，必须将其降维到物理层面的动词。不要写“修改计分漏洞”，而是写“打开代码编辑器，定位到核心逻辑代码文件的第四十二行，在函数前加一行测试打印测试代码”。当任务具体到“点击鼠标、敲击几个字母”这种物理动作时，大脑的恐慌警报就会解除，启动阻力瞬间趋近于零。",
          "其二，执行“外脑清空”仪式：在开始深度工作前，拿出一张完全空白的纸。把你脑子里此刻正在盘旋的所有未完成的琐事全部写下来（比如取快递、回电话、支付账单）。这一步的意义在于，通过将信息从大脑的“工作记忆区”转移到外部物理介质上，手动关闭了蔡加尼克效应带来的后台耗电，为你接下来的专注腾出宝贵的认知带宽。",
          "其三，设立“五分钟沙盒”协议：降低心理预期，骗过大脑的防御机制。告诉自己：“我现在的目标不是写完这篇报告，我只允许自己在这个任务上花五分钟，五分钟一到我就立刻停止。”通常情况下，只要你迈过了最艰难的“冷启动”门槛，进入了工作流，物理学中的惯性定律就会接管一切，推着你继续走下去。"
        ]
      },
      {
        title: "第三章 环境的锚点：人无法在真空中自律",
        paragraphs: [
          "2017 年，德克萨斯大学奥斯汀分校的艾德里安·沃德教授及其研究团队，进行了一项旨在探究智能手机如何无声地掠夺人类心智资源的经典实验。",
          "研究人员召集了数百名被试者，要求他们完成一系列极度考验流体智力和工作记忆容量的高难度认知测试。实验的关键在于分组：第一组被要求将手机屏幕朝下扣在桌面上；第二组将手机放在口袋或随身包里；第三组则必须将手机留在另一个房间。值得注意的是，所有组别的手机都被严格调至静音模式，期间没有任何通知声响。",
          "实验结果令人不寒而栗：那些把手机留在另一个房间的人，其认知测试得分大幅且显著地高于把手机放在桌面上的人。研究揭示了一个被称为“大脑流失假说”的假说：仅仅是智能手机这种“高频多巴胺源”处于你的视线范围内，你的大脑就需要持续分配一部分隐蔽的认知资源，去主动“抑制”想要拿起它的冲动。",
          "【核心问题：为什么把手机静音并扣在桌面上，我们依然无法集中精神，总是感到心浮气躁？】我们常常误以为，专注力完全是一种发生在颅骨内部的纯粹心理状态。但事实是，人类是环境的产物，你的物理环境无时无刻不在与你的工作任务争夺着极其有限的注意力资源。人是无法在真空中强行自律的。",
          "【行为背后的视觉与认知负荷】大脑的视觉皮层具有自动扫描和评估周围环境的本能。当你的书桌上堆满了未拆封的快递、杂乱的充电线、吃剩的零食包装，以及一部随时可能亮起的屏幕时，你的大脑像是在嘈杂的露天集市。每一个物品都在向大脑发送微弱的视觉线索，大脑必须不断地处理这些“视觉噪音”，并消耗能量去决定“我是否应该关注它”。这种潜意识里的信息处理，会极大地挤压你用于深度思考的工作记忆空间。",
          "【综合化场景的现实界面设计】我们可以借用现代界面设计的核心理念来理解物理环境。无论是苹果设计规范，还是强调层级分明的材料设计规范，抑或是利用半透明模糊质感来区分视觉层级、消解生硬边界的毛玻璃和拟态风格，其根本目的都在于降低用户的“视觉噪音”，通过大面积的留白和极简的元素，引导视线自然地聚焦在核心内容上。",
          "你的工作桌面，就是你现实生活的主界面。一张堆满杂物的书桌，就像是一个弹窗广告满天飞、配色混乱的劣质网页，它在潜意识里不断切割着你的注意力。",
          "【环境设计的反向工程】如果你想毫不费力地进入专注状态，就必须把环境改造成你的同盟，用物理屏障代替意志力消耗。",
          "第一，执行绝对的物理隔离（增加摩擦力）：工作时，不要把手机扣在桌面上，甚至不要放在口袋里。必须将其放在视线之外 of the 抽屉深处，或者干脆放在另一个房间。增加你获取干扰源的物理步骤（比如需要站起身、走过去、拉开抽屉），这种微小的“摩擦力”足以在冲动升起时打断你的自动驾驶模式。",
          "第二，建立严格的空间与行为锚点：心理学中的环境暗示极其强大。永远不要在床上看书或敲代码，也不要在工作椅上刷娱乐视频。你必须在物理空间与特定行为之间建立牢不可破的条件反射：当你坐到这把特定的椅子上时，大脑的唯一预期就是“深度思考”；当你躺到那张床上时，唯一的预期就是“放松睡眠”。绝不混用你的空间锚点。",
          "第三，数字环境的“静默化”处理：环境不仅仅指物理桌面，还包括你的数字桌面。在进行深度工作前，不仅要清理实体桌面，还要关闭电脑上所有非必要的后台程序和网页标签。将屏幕的显示模式调整为勿扰，切断所有邮件、聊天软件的弹窗通知权限。数字环境的无菌化，是保护认知带宽的最后一道防线。"
        ]
      }
    ]
  },
  "guarding": {
    title: "守护边界",
    chapters: [
      {
        title: "第一章 人际关系的课题分离",
        paragraphs: [
          "为什么我们在熙熙攘攘的社交网络、家庭期待或职场纠葛中，总是感到难以喘息的疲惫？答案不言自明：因为我们极其容易将属于‘他人的课题’粗暴地抗在自己柔弱的肩膀上，又或者允许‘他人’肆意跨越我们的精神红线，来插手管理我们自己的人生。",
          "阿德勒心理学提出，生命中的一切烦恼与重担皆归结于人际关系之乱。而重拾轻盈的核心智慧，就在于勇敢无畏地推行——‘课题分离’。当你向深渊探身，你需要看清：谁应当为最终的选择承担后果？这便是那一项课题的天然归宿。",
          "‘他人的情绪，是属于他人的课题，绝对不由你，也不应由你来强行买单。’学会温和却无比坚定地向不合理期待说不，优雅地守住自我边界，既不是对他人的冷眼旁观，而是对彼此心灵成熟程度的最深刻敬意。以此，我们才能在喧嚣里寻得本真的安宁。"
        ]
      },
      {
        title: "第二章 建立自我的核心护城河",
        paragraphs: [
          "课题分离并非让我们筑起一道拒绝温情与互助的冷酷高墙，而是协助我们在纷乱纠缠的心灵原野中，高标准开掘一条澄澈的护城河。这条护城河，保护着你内心最深处脆弱而真实的愿望，使其免受任何无礼的指手画脚与隐形情绪勒索。",
          "当你的护城河被建立起来，你不再需要通过迎合他人、拼命顺从外界期待来小心翼翼乞求安全的容身之所。你可以在河畔静静种下属于自己的红杉和百合，在晨曦到来时舒展生长。你会发现，那些敢于对你失望的人，最终都被隔离在河对岸，再也无法刺痛你分毫。",
          "自此，你不再为了掩饰不安和取悦过客假装忙碌。你的生命开始变得极为轻盈和充实——因为这里的每一缕空气，每一朵浪花，都毫无疑问地，完全属于你自己。"
        ]
      }
    ]
  },
  "pause": {
    title: "按下暂停键",
    chapters: [
      {
        title: "第一章 自动驾驶与进化陷阱",
        paragraphs: [
          "我们的大脑，在漫长的千百万年漫长进化深处，一直是由一套高效而又残忍的暗中‘自动驾驶’程序完全掌控的：它极度迷恋在最短时间内捕获那些高脂肪、多巴胺丰富或危机四伏的微小动态，从而在艰苦的原始环境中苟延残存。",
          "然而到了高度繁茂的信息现代文明，这些曾经庇护我们生存的主观基因本能，瞬间转变成最具掠夺性的行为陷阱。点赞的红点、不断坠落的无限卡片信息流、一击即中的短视频刺激，时刻都在诱引你的边缘系统进行高速循环重载。你在不知不觉间再次沦为脑电波的奴隶。",
          "要戳破这层裹挟着千万代基因本能的沉浸式幻象，我们需要刻意唤醒大脑皮层最顶端也最晚熟的‘理智脑’。通过在庞大的生理冲动和微小的物理手指动作之间，精准地切入一个仅有三秒的呼吸暂停键，以此终结这台野蛮惯性机械的致命狂飙。"
        ]
      },
      {
        title: "第二章 夺回专注力航船的舵盘",
        paragraphs: [
          "当你在内心深处按下这个珍贵的暂停键，那无处不在、甚嚣尘上的急切冲动瞬间开始像退潮的海潮一般渐行渐远。你站在了更高的元认知制高点上，平静而深邃地注视着刚才那个暴躁不安、口渴烦躁的本我状态，却拒绝被它无底线的索求所拖曳。",
          "这短暂的几秒空档，却给予了你的理智脑无比宝贵的思考缓冲时间：‘我此刻做出的选择，真的是符合我长远价值本心的，还是仅仅是一个被基因密码驱使的被动消费？’在这种冷静的对视下，廉价的欲望开始渐渐风化消散。",
          "你开始缓慢地握住那柄失落已久的船舵。面对浩瀚汹涌、迷雾四散的信息沧海，你不必再随波逐流在风浪的翻滚之间哭泣。你已经拥有了停靠港湾和扬起真理风帆的方向力量，在浩瀚中重新破浪安宁而归。"
        ]
      }
    ]
  }
};

// Companion quotes based on book
const COMPANION_QUOTES: Record<string, string[]> = {
  "attention": [
    "保持专注哦，灯獭獭陪你屏蔽一切干扰～",
    "每一分钟的专注，都是对生命主权的主张呢！",
    "好厉害，你已经沉浸在纸页的芳香里了～"
  ],
  "guarding": [
    "温和而坚定地划清界线，不为别人的课题和情绪买单！",
    "守护好你的心灵护城河，它是你自由居住的花园～",
    "今天也在勇敢地维护自我边界，太棒了！"
  ],
  "pause": [
    "累了就停下三秒，给你的理智脑放个假吧～",
    "我们正在驯服那只调皮的基因‘自动驾驶’小猴子哦！",
    "在冲动与冷静的选择之间，你就是自己的掌舵者～"
  ],
  "default": [
    "静享片刻的澄澈，灯獭獭一直伴你左右呢～",
    "书中自有黄金屋，慢慢看，不着急～",
    "陪伴是最长情的告白，呼吸放轻松～"
  ]
};

const getBookContent = (book: Book) => {
  const custom = BOOK_CONTENTS[book.id];
  if (custom) return custom;

  // Sane high quality fallback for custom books using chunked inputs
  const intro = book.introduction || "在寂静之中，寻回心之所向。这是一段不被时间拷问的安全时光。";
  const sentences = intro.split(/[。！？]/).filter(s => s.trim().length > 0);
  const chunkCount = Math.max(1, Math.ceil(sentences.length / 3));

  const chapters = [
    {
      title: "第一章 重迎本我之光",
      paragraphs: sentences.slice(0, chunkCount).map(s => s + "。")
    },
    {
      title: "第二章 宁静境界的艺术",
      paragraphs: sentences.slice(chunkCount).map(s => s + "。")
    }
  ].filter(c => c.paragraphs.length > 0);

  if (chapters.length < 2) {
    chapters.push({
      title: "第二章 清澈纯净的追寻",
      paragraphs: [
        "人生是一场漫长的、向着边界未知的浪漫跋涉。我们往往在追逐繁星的慌乱旅途之中，丢掉了踩在泥土上的最真实的沉稳步调。让时间停驻在呼吸最平稳的缝隙之间，是让我们重构自我的最质朴起点。",
        "当你缓缓翻动这卷微凉的篇章，不要试图去寻找那些惊心动魄的感官狂喜，只要安坐在一旁，看轻盈的水滴如何温柔地穿透内心的石头。"
      ]
    });
  }

  return {
    title: book.title,
    chapters
  };
};

let canvasInstance: HTMLCanvasElement | null = null;
let contextInstance: CanvasRenderingContext2D | null = null;

const getTextWidth = (text: string, font: string): number => {
  if (typeof document === "undefined") {
    return text.length * 15.5; // SSR fallback
  }
  if (!canvasInstance) {
    canvasInstance = document.createElement("canvas");
    contextInstance = canvasInstance.getContext("2d");
  }
  if (contextInstance) {
    contextInstance.font = font;
    return contextInstance.measureText(text).width;
  }
  return text.length * 15.5;
};

const getLinesForParagraph = (
  text: string,
  isContinuation: boolean,
  containerWidth: number,
  firstLineIndent: number,
  font: string,
  trackingEm: number
): string[] => {
  const lines: string[] = [];
  let currentIndex = 0;
  const fontSize = 15.5;
  const extraTracking = trackingEm * fontSize;

  // Forbidden characters at the start of a line (Kinsoku Shori - Chinese typesetting style)
  const forbiddenLeading = [
    "。", "，", "、", "”", "’", "）", "】", "》", "；", "：", "！", "？", "…", "—",
    ".", ",", "!", "?", ";", ":", ")", "]", ">"
  ];

  while (currentIndex < text.length) {
    const isFirstLine = lines.length === 0 && !isContinuation;
    const availableLineWidth = isFirstLine ? (containerWidth - firstLineIndent) : containerWidth;

    let low = currentIndex;
    let high = text.length;
    let bestEnd = currentIndex;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const subStr = text.slice(currentIndex, mid);
      if (subStr.length === 0) {
        low = mid + 1;
        continue;
      }

      const baseWidth = getTextWidth(subStr, font);
      const measuredWidth = baseWidth + Math.max(0, subStr.length - 1) * extraTracking;

      if (measuredWidth <= availableLineWidth) {
        bestEnd = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (bestEnd === currentIndex) {
      bestEnd = currentIndex + 1;
    }

    // If the next character would start the next line but is a forbidden leading punctuation,
    // we wrap it earlier by backing up bestEnd by 1 character so they wrap together.
    if (bestEnd < text.length && forbiddenLeading.includes(text[bestEnd])) {
      if (bestEnd - 1 > currentIndex) {
        bestEnd--;
      }
    }

    const matchedLine = text.slice(currentIndex, bestEnd);
    lines.push(matchedLine);
    currentIndex = bestEnd;
  }

  return lines;
};

const checkPaginationIntegrity = (book: Book, pages: CompiledPage[]) => {
  const raw = getBookContent(book);
  
  raw.chapters.forEach((ch) => {
    // Find all pages belonging to this chapter (excluding chapter cover pages)
    const chapterPages = pages.filter(p => p.chapterTitle === ch.title && !p.isChapterStart);
    
    // Group reconstructed text by paragraph index
    const reconParagraphMap: Record<number, string> = {};
    
    chapterPages.forEach((page) => {
      page.paragraphs.forEach((p) => {
        if (reconParagraphMap[p.paragraphIndex] === undefined) {
          reconParagraphMap[p.paragraphIndex] = "";
        }
        reconParagraphMap[p.paragraphIndex] += p.text;
      });
    });

    ch.paragraphs.forEach((originalText, idx) => {
      const originalClean = originalText;
      const reconstructedText = reconParagraphMap[idx] || "";
      const reconClean = reconstructedText;

      if (originalClean !== reconClean) {
        console.error(`[PAGINATION CHECK FAILURE] Book: "${book.title}", Chapter: "${ch.title}", Paragraph index ${idx}`);
        console.error(`Expected length: ${originalClean.length}, actual got: ${reconClean.length}`);
        
        let firstDiffIdx = 0;
        while (firstDiffIdx < originalClean.length && firstDiffIdx < reconClean.length && originalClean[firstDiffIdx] === reconClean[firstDiffIdx]) {
          firstDiffIdx++;
        }
        console.error(`First mismatch at character ${firstDiffIdx}.`);
        console.error(`Expected around context: "${originalClean.slice(Math.max(0, firstDiffIdx - 10), firstDiffIdx + 20)}"`);
        console.error(`Got around context:      "${reconClean.slice(Math.max(0, firstDiffIdx - 10), firstDiffIdx + 20)}"`);
        
        throw new Error(`Pagination integrity error in book: "${book.title}", chapter: "${ch.title}", paragraph: ${idx}. Texts matched incorrectly.`);
      }
    });
  });
  console.log(`[PAGINATION INTEGRITY CHECK PASSED] Reconstructed paragraphs for "${book.title}" matches original EXACTLY! Clean pass!`);
};

const compilePages = (book: Book): CompiledPage[] => {
  const raw = getBookContent(book);
  const pages: CompiledPage[] = [];

  raw.chapters.forEach((ch) => {
    // Add dedicated chapter start cover page
    pages.push({
      chapterTitle: ch.title,
      paragraphs: [],
      isChapterStart: true
    });

    let currentPageParagraphs: PageParagraph[] = [];
    let currentHeight = 0;
    
    let pIdx = 0;
    let cIdx = 0;

    const maxUsableHeight = 627; // pt-126 to pb-71 inside 824px inner height (824 - 126 - 71 = 627)
    const lineHeight = 28;
    const paragraphGap = 18;
    const firstLineIndent = 31; // 2em indent in pixels
    const containerWidth = 301; // 365px - 64px padding
    const calculationWidth = containerWidth - 0.5; // 0.5px sub-pixel safety buffer to prevent overflow while eliminating premature wrapping discrepancies
    const trackingEm = 0.03;
    const fontStr = "300 15.5px 'PingFang SC', 'Noto Serif CJK SC', 'Source Han Serif CJK SC', serif";

    while (pIdx < ch.paragraphs.length) {
      const pText = ch.paragraphs[pIdx];
      const remainingText = pText.slice(cIdx);

      if (remainingText.length === 0) {
        pIdx++;
        cIdx = 0;
        continue;
      }

      const isContinuation = (cIdx > 0);
      const candidateLines = getLinesForParagraph(
        remainingText,
        isContinuation,
        calculationWidth,
        firstLineIndent,
        fontStr,
        trackingEm
      );

      let fittedLinesCount = 0;
      let tempHeight = currentHeight;
      const initialParagraphsOnPage = currentPageParagraphs.length;

      for (let i = 0; i < candidateLines.length; i++) {
        const isFirstLineOfBlockOnPage = (initialParagraphsOnPage > 0) && (fittedLinesCount === 0);
        const addedHeight = isFirstLineOfBlockOnPage ? (paragraphGap + lineHeight) : lineHeight;

        if (tempHeight + addedHeight <= maxUsableHeight) {
          tempHeight += addedHeight;
          fittedLinesCount++;
        } else {
          break;
        }
      }

      if (fittedLinesCount === 0) {
        // If not even one line fits
        if (currentPageParagraphs.length === 0) {
          // Force at least 1 line to prevent infinite loop
          currentHeight += lineHeight;
          const matchedText = candidateLines[0];
          currentPageParagraphs.push({
            text: matchedText,
            paragraphIndex: pIdx,
            startChar: cIdx,
            endChar: cIdx + matchedText.length,
            isContinuation
          });
          cIdx += matchedText.length;
          if (cIdx >= pText.length) {
            pIdx++;
            cIdx = 0;
          }
        } else {
          // Finish current page and start a new one
          pages.push({
            chapterTitle: ch.title,
            paragraphs: [...currentPageParagraphs]
          });
          currentPageParagraphs = [];
          currentHeight = 0;
        }
      } else if (fittedLinesCount === candidateLines.length) {
        // Fits completely
        const addsParagraphGap = (initialParagraphsOnPage > 0);
        currentHeight += (addsParagraphGap ? paragraphGap : 0) + fittedLinesCount * lineHeight;

        currentPageParagraphs.push({
          text: remainingText,
          paragraphIndex: pIdx,
          startChar: cIdx,
          endChar: pText.length,
          isContinuation
        });

        pIdx++;
        cIdx = 0;
      } else {
        // Fits partially
        const addsParagraphGap = (initialParagraphsOnPage > 0);
        currentHeight += (addsParagraphGap ? paragraphGap : 0) + fittedLinesCount * lineHeight;

        const matchedTextLength = candidateLines.slice(0, fittedLinesCount).reduce((sum, line) => sum + line.length, 0);
        const slicedText = remainingText.slice(0, matchedTextLength);

        currentPageParagraphs.push({
          text: slicedText,
          paragraphIndex: pIdx,
          startChar: cIdx,
          endChar: cIdx + matchedTextLength,
          isContinuation
        });

        cIdx += matchedTextLength;

        // Page is full, push and start a new one
        pages.push({
          chapterTitle: ch.title,
          paragraphs: [...currentPageParagraphs]
        });
        currentPageParagraphs = [];
        currentHeight = 0;
      }
    }

    if (currentPageParagraphs.length > 0) {
      pages.push({
        chapterTitle: ch.title,
        paragraphs: currentPageParagraphs
      });
    }
  });

  // Verify accuracy of our compiled pagination algorithm
  checkPaginationIntegrity(book, pages);

  return pages;
};

export default function ReadingView({ onClose, onHome, activeBook, isDark = false, onShowUIChange, onCoreReadingStateChange, startFromSummary = null, onGenerateReadLater, onSummaryViewed }: ReadingViewProps) {
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        setFontsReady(true);
      });
    }
  }, []);

  const pages = React.useMemo(() => {
    return compilePages(activeBook);
  }, [activeBook, fontsReady]);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const sessionStartPage = React.useMemo(() => {
    return pageIndex + 1;
  }, []);
  const [lastVisibleChapterTitle, setLastVisibleChapterTitle] = useState<string>("");

  const [visitedPages, setVisitedPages] = useState<number[]>([]);
  const [isConfirmRangeOpen, setIsConfirmRangeOpen] = useState<boolean>(false);
  const [showReadingFinished, setShowReadingFinished] = useState<boolean>(false);
  const [showDailySummary, setShowDailySummary] = useState<boolean>(false);
  const [dailySummary, setDailySummary] = useState<DailySummary>(DEFAULT_DAILY_SUMMARY);

  useEffect(() => {
    if (startFromSummary) {
      const summaryRange = {
        start: startFromSummary.startPage,
        end: startFromSummary.endPage,
      };
      setRewardSettlement((current) => settleReward(current, "reading"));
      setShowDailySummary(true);
      setReadingFinishedRange(summaryRange);
      setIsConfirmRangeOpen(false);
      setShowReadingFinished(false);
      void openDailySummary(summaryRange);
    }
  }, [startFromSummary]);
  const [summaryRequestState, setSummaryRequestState] = useState<AiRequestState<DailySummaryResponse>>(
    createAiRequestState(),
  );
  const [showQuestions, setShowQuestions] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [showRewardSummary, setShowRewardSummary] = useState<boolean>(false);
  const [reviewQuestions, setReviewQuestions] = useState(DEFAULT_REVIEW_QUESTIONS);
  const [reviewAnswers, setReviewAnswers] = useState<ReviewAnswers>({
    understanding: "",
    extraction: "",
    action: "",
  });
  const [questionsRequestState, setQuestionsRequestState] = useState<AiRequestState<ReviewQuestionsResponse>>(
    createAiRequestState(),
  );
  const [feedbackRequestState, setFeedbackRequestState] = useState<AiRequestState<AnswerFeedbackResponse>>(
    createAiRequestState(),
  );
  const [rewardSettlement, setRewardSettlement] = useState<RewardSettlementRecord>(
    createRewardSettlementRecord,
  );
  const [readingFinishedRange, setReadingFinishedRange] = useState<{ start: number; end: number } | null>(null);

  useEffect(() => {
    if (onCoreReadingStateChange) {
      onCoreReadingStateChange(!(isConfirmRangeOpen || showReadingFinished || showDailySummary || showQuestions || showFeedback || showRewardSummary));
    }
  }, [isConfirmRangeOpen, showReadingFinished, showDailySummary, showQuestions, showFeedback, showRewardSummary, onCoreReadingStateChange]);

  useEffect(() => {
    const activePage = pages[pageIndex];
    if (activePage && !activePage.isChapterStart) {
      if (!visitedPages.includes(pageIndex)) {
        setVisitedPages(prev => [...prev, pageIndex]);
      }
    }
  }, [pageIndex, visitedPages, pages]);

  useEffect(() => {
    const activePage = pages[pageIndex];
    if (activePage && !activePage.isChapterStart) {
      setLastVisibleChapterTitle(activePage.chapterTitle || "");
    }
  }, [pageIndex, pages]);

  const [showUI, setShowUI] = useState<boolean>(true);

  useEffect(() => {
    onShowUIChange?.(showUI);
  }, [showUI, onShowUIChange]);
  const [direction, setDirection] = useState<number>(1); // 1 = forward, -1 = backward
  const [secondsRead, setSecondsRead] = useState<number>(0);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [showCatalog, setShowCatalog] = useState<boolean>(false);
  const [showAssistant, setShowAssistant] = useState<boolean>(false);
  const [assistantQuery, setAssistantQuery] = useState<string>("");
  const [assistantRequestState, setAssistantRequestState] = useState<
    AiRequestState<AssistantResponse, AssistantTask>
  >(createAiRequestState());
  const assistantAbortControllerRef = useRef<AbortController | null>(null);
  const assistantRequestSequenceRef = useRef(0);

  useEffect(() => {
    return () => {
      assistantAbortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    (window as any).__instantTriggerReadingConditions = () => {
      setSecondsRead(305);
    };

    return () => {
      delete (window as any).__instantTriggerReadingConditions;
    };
  }, []);

  const [showMenuDropdown, setShowMenuDropdown] = useState<boolean>(false);
  const [showReadingGuide, setShowReadingGuide] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("showReadingGuide");
      return stored !== null ? stored === "true" : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("showReadingGuide", String(showReadingGuide));
    } catch (e) {
      console.warn("Failed to save showReadingGuide to localStorage:", e);
    }
  }, [showReadingGuide]);

  // Day / Night Theme state inside reading view
  const [isReadingDark, setIsReadingDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("isReadingDark");
      if (stored !== null) {
        return stored === "true";
      }
    } catch {}
    return false; // default to off: light mode
  });

  useEffect(() => {
    try {
      localStorage.setItem("isReadingDark", String(isReadingDark));
    } catch (e) {
      console.warn("Failed to save isReadingDark to localStorage:", e);
    }
  }, [isReadingDark]);

  // Web Audio state for ambient noise in reading
  const [isAmbientPlaying, setIsAmbientPlaying] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("isAmbientPlaying");
      return stored !== null ? stored === "true" : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("isAmbientPlaying", String(isAmbientPlaying));
    } catch (e) {
      console.warn("Failed to save isAmbientPlaying to localStorage:", e);
    }
  }, [isAmbientPlaying]);

  const [ambientNoiseType, setAmbientNoiseType] = useState<"waves" | "rain" | "wind">(() => {
    try {
      const stored = localStorage.getItem("ambientNoiseType");
      return (stored as "waves" | "rain" | "wind") || "waves";
    } catch {
      return "waves";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("ambientNoiseType", ambientNoiseType);
    } catch (e) {
      console.warn("Failed to save ambientNoiseType to localStorage:", e);
    }
  }, [ambientNoiseType]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Companion avatar dialogue state
  const [bubbleMessage, setBubbleMessage] = useState<string>("");
  const [isBubbleVisible, setIsBubbleVisible] = useState<boolean>(false);
  const bubbleTimeoutRef = useRef<number | null>(null);

  const handleEndReading = () => {
    const isPagesMet = visitedPages.length >= 3;
    const isDurationMet = secondsRead >= 300;

    if (isPagesMet && isDurationMet) {
      setIsConfirmRangeOpen(true);
    } else {
      setToastMessage("您的阅读时长/篇幅较少");
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 2000);
    }
  };

  const buildDailySummaryPayload = (rangeOverride?: { start: number; end: number }) => {
    const range = rangeOverride ?? readingFinishedRange ?? { start: sessionStartPage, end: pageIndex + 1 };
    const startIndex = Math.max(0, range.start - 1);
    const endIndex = Math.min(pages.length, range.end);
    const selectedPages = pages.slice(startIndex, endIndex).filter((page) => !page.isChapterStart);
    const excerpts = selectedPages.flatMap((page) => page.paragraphs.map((paragraph) => paragraph.text));
    const chapterTitle = selectedPages[0]?.chapterTitle || lastVisibleChapterTitle || "今日阅读章节";

    return {
      task: "daily_summary" as const,
      bookId: activeBook.id,
      bookTitle: activeBook.title,
      author: activeBook.author,
      chapterTitle,
      startPage: range.start,
      endPage: range.end,
      readingMinutes: Math.max(1, Math.ceil(secondsRead / 60)),
      excerpts,
      userGoal: "今天先读 5 分钟",
      promptVersion: "daily_summary_v1" as const,
    };
  };

  const openDailySummary = async (rangeOverride?: { start: number; end: number }) => {
    setShowReadingFinished(false);
    setShowDailySummary(true);
    setSummaryRequestState(createAiRequestLoading("灯獭獭正在轻轻整理你今天读过的内容..."));

    try {
      const result = await requestDailySummary(buildDailySummaryPayload(rangeOverride));
      setDailySummary(result.summary);
      setSummaryRequestState(createAiRequestSuccess(result));
    } catch (error) {
      console.warn("Daily summary flow failed.", error);
      setSummaryRequestState(createAiRequestError("今天的总结暂时没有准备好。"));
    }
  };

  const buildContextualAnswerPayload = () => {
    const activePage = pages[pageIndex];
    const previousPage = pages[pageIndex - 1];
    const nextPage = pages[pageIndex + 1];

    return {
      task: "contextual_answer" as const,
      question: assistantQuery,
      bookId: activeBook.id,
      bookTitle: activeBook.title,
      chapterTitle: activePage?.chapterTitle || lastVisibleChapterTitle || "当前章节",
      pageNumber: pageIndex + 1,
      contextParagraphs: activePage?.paragraphs.map((paragraph) => paragraph.text) ?? [],
      previousParagraphs: previousPage?.paragraphs.map((paragraph) => paragraph.text) ?? [],
      nextParagraphs: nextPage?.paragraphs.map((paragraph) => paragraph.text) ?? [],
      promptVersion: "contextual_answer_v1" as const,
    };
  };

  const formatDirectAnswer = (result: Awaited<ReturnType<typeof requestDirectQuestion>>) => {
    return [result.answer, result.example ? `\n\n举个例子：${result.example}` : "", result.returnHint ? `\n\n${result.returnHint}` : ""]
      .filter(Boolean)
      .join("");
  };

  const formatContextualAnswer = (result: Awaited<ReturnType<typeof requestContextualAnswer>>) => {
    return [
      result.answer,
      result.citedSnippet ? `\n\n原文依据：${result.citedSnippet}` : "",
      result.returnHint ? `\n\n${result.returnHint}` : "",
    ]
      .filter(Boolean)
      .join("");
  };

  const generateDailySummaryForLater = async () => {
    setSummaryRequestState(createAiRequestLoading("灯獭獭正在轻轻整理你今天读过的内容..."));

    try {
      const result = await requestDailySummary(buildDailySummaryPayload());
      setDailySummary(result.summary);
      setSummaryRequestState(createAiRequestSuccess(result));
    } catch (error) {
      console.warn("Daily summary for later flow failed.", error);
      setSummaryRequestState(createAiRequestError("今天的总结暂时没有准备好。"));
    }
  };

  const createCurrentPendingSummary = () => {
    const range = readingFinishedRange ?? {
      start: sessionStartPage,
      end: pageIndex + 1,
    };

    return createPendingSummaryEntry({
      bookId: activeBook.id,
      startPage: range.start,
      endPage: range.end,
    });
  };

  const openReviewQuestions = async () => {
    setRewardSettlement((current) => settleReward(current, "summary"));
    onSummaryViewed?.();
    setShowDailySummary(false);
    setShowQuestions(true);
    setQuestionsRequestState(createAiRequestLoading("灯獭獭正在准备三个轻问题..."));

    try {
      const result = await requestReviewQuestions({
        task: "review_questions",
        promptVersion: "review_questions_v1",
        bookId: activeBook.id,
        bookTitle: activeBook.title,
        summary: dailySummary,
      });
      setReviewQuestions(result.questions);
      setQuestionsRequestState(createAiRequestSuccess(result));
    } catch (error) {
      console.warn("Review questions flow failed.", error);
      const fallback = {
        mode: "mock" as const,
        reason: "api_error",
        questions: DEFAULT_REVIEW_QUESTIONS,
      };
      setReviewQuestions(DEFAULT_REVIEW_QUESTIONS);
      setQuestionsRequestState(createAiRequestSuccess(fallback));
    }
  };

  const submitReviewAnswers = async () => {
    setRewardSettlement((current) => settleReward(current, "questions"));
    setShowQuestions(false);
    setShowFeedback(true);
    setFeedbackRequestState(createAiRequestLoading("灯獭獭正在轻轻整理你的想法..."));

    try {
      const result = await requestAnswerFeedback({
        task: "answer_feedback",
        promptVersion: "answer_feedback_v1",
        questions: reviewQuestions,
        answers: reviewAnswers,
      });
      setFeedbackRequestState(createAiRequestSuccess(result));
    } catch (error) {
      console.warn("Answer feedback flow failed.", error);
      const fallback: AnswerFeedbackResponse = {
        mode: "mock",
        reason: "api_error",
        feedback: createDefaultAnswerFeedback(reviewAnswers),
      };
      setFeedbackRequestState(createAiRequestSuccess(fallback));
    }
  };

  // Auto hide UI timeout
  useEffect(() => {
    if (showUI && !showMenuDropdown) {
      const timer = setTimeout(() => setShowUI(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showUI, showMenuDropdown]);

  // Handle Reading Time ticker
  useEffect(() => {
    const isSubViewOpen = isConfirmRangeOpen || showReadingFinished || showDailySummary || showQuestions || showFeedback || showRewardSummary;
    if (isSubViewOpen) return;

    const timer = setInterval(() => {
      setSecondsRead(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isConfirmRangeOpen, showReadingFinished, showDailySummary, showQuestions, showFeedback, showRewardSummary]);


  // Soft Ambient audio generator matching Atmosphere procedural node
  const startReadingAmbient = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      stopReadingAmbient();

      const bufferSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Low pass ambient noise algorithm
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        data[i] = b0 + b1 + b2 + b3 + b4 + white * 0.5;
        data[i] *= 0.06; // soft scale
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      if (ambientNoiseType === "rain") {
        filter.type = "bandpass";
        filter.frequency.value = 1000;
        filter.Q.value = 1.2;

        lfo.type = "sine";
        lfo.frequency.value = 0.5; // low modulation for rain bursts
        lfoGain.gain.value = 300;
        
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
      } else if (ambientNoiseType === "wind") {
        filter.type = "lowpass";
        filter.frequency.value = 400;
        filter.Q.value = 2.0;

        lfo.type = "sine";
        lfo.frequency.value = 0.15; // slow sweeping wind
        lfoGain.gain.value = 150;

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
      } else {
        // waves
        filter.type = "lowpass";
        filter.frequency.value = 300; // Deep comforting ocean dynamic hum

        lfo.type = "sine";
        lfo.frequency.value = 0.08; // slow dynamic breeze sweep
        lfoGain.gain.value = 160;

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
      }

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);

      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.start(0);

      noiseSourceRef.current = source;
      gainNodeRef.current = gainNode;
    } catch (e) {
      console.warn("Ambient Audio setup failed in container sandbox", e);
    }
  };

  const stopReadingAmbient = () => {
    if (noiseSourceRef.current) {
      try {
        noiseSourceRef.current.stop();
      } catch (err) {}
      noiseSourceRef.current = null;
    }
  };

  useEffect(() => {
    if (isAmbientPlaying) {
      startReadingAmbient();
    } else {
      stopReadingAmbient();
    }
    return () => stopReadingAmbient();
  }, [isAmbientPlaying, ambientNoiseType]);

  const handleToggleAmbient = () => {
    setIsAmbientPlaying(!isAmbientPlaying);
  };

  // Convert reading seconds to nice MM:SS format
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Turn page click handler with layout boundary mapping
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    const leftBoundary = width * 0.28; // first 28% width
    const rightBoundary = width * 0.72; // last 28% width

    if (clickX < leftBoundary) {
      // Prev Page turn
      if (pageIndex > 0) {
        setDirection(-1);
        setPageIndex(prev => prev - 1);
      } else {
        setToastMessage("这已经是第一页啦");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      }
    } else if (clickX > rightBoundary) {
      // Next Page turn
      if (pageIndex < pages.length - 1) {
        setDirection(1);
        setPageIndex(prev => prev + 1);
      } else {
        setToastMessage("这已经是最后一页啦");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      }
    } else {
      // Middle click: toggle system navigation HUD
      setShowUI(prev => !prev);
    }
  };

  // Trigger Otter companions quotes
  const triggerCompanionSaying = () => {
    setShowAssistant(true);
  };

  const closeAssistant = () => {
    assistantRequestSequenceRef.current += 1;
    assistantAbortControllerRef.current?.abort();
    assistantAbortControllerRef.current = null;
    setShowAssistant(false);
    setAssistantRequestState(createAiRequestState());
  };

  const handleAskAssistant = (useOriginalText: boolean) => {
    if (!assistantQuery.trim()) {
      setToastMessage("先写点什么问问灯獭獭吧～");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      return;
    }

    const task: AssistantTask = useOriginalText ? "contextual_answer" : "direct_question";
    const loadingMessage = useOriginalText
      ? "灯獭獭正在结合当前原文寻找线索..."
      : "灯獭獭正在认真理解你的问题...";
    assistantAbortControllerRef.current?.abort();
    const controller = useOriginalText ? null : new AbortController();
    assistantAbortControllerRef.current = controller;
    const requestSequence = assistantRequestSequenceRef.current + 1;
    assistantRequestSequenceRef.current = requestSequence;
    setAssistantRequestState(createAiRequestLoading(loadingMessage, task));

    void (async () => {
      try {
        if (useOriginalText) {
          const result = await requestContextualAnswer(buildContextualAnswerPayload());
          if (requestSequence !== assistantRequestSequenceRef.current) return;
          setAssistantRequestState(createAiRequestSuccess(result, task));
        } else {
          const result = await requestDirectQuestion({
            task: "direct_question",
            question: assistantQuery,
            promptVersion: "direct_question_v1",
          }, {
            signal: controller?.signal,
          });
          if (controller?.signal.aborted || requestSequence !== assistantRequestSequenceRef.current) return;
          setAssistantRequestState(createAiRequestSuccess(result, task));
        }
      } catch (error) {
        if (error instanceof AiRequestCancelledError || requestSequence !== assistantRequestSequenceRef.current) {
          return;
        }
        console.warn("Reading assistant flow failed.", error);
        setAssistantRequestState(
          createAiRequestError("灯獭獭暂时没有整理好答案，可以先继续阅读，稍后再试。", null, task),
        );
      } finally {
        if (requestSequence === assistantRequestSequenceRef.current) {
          assistantAbortControllerRef.current = null;
        }
      }
    })();
  };

  const assistantAnswer = (() => {
    const result = assistantRequestState.data;
    if (!result) return "";

    return assistantRequestState.task === "contextual_answer"
      ? formatContextualAnswer(result as ContextualAnswerResponse)
      : formatDirectAnswer(result as DirectQuestionResponse);
  })();

  const activePage: CompiledPage = pages[pageIndex] || { chapterTitle: "阅读篇章", paragraphs: [], isChapterStart: false };
  const readingProgressPct = ((pageIndex + 1) / pages.length) * 100;

  if (showRewardSummary) {
    return (
      <RewardSummaryView 
        onHome={onHome || onClose}
        settlement={rewardSettlement}
      />
    );
  }

  if (showFeedback) {
    return (
      <FeedbackView 
        onSave={() => { setShowFeedback(false); setShowRewardSummary(true); }}
        onSkip={() => { setShowFeedback(false); onClose(); }}
        onClose={() => { setShowFeedback(false); setShowQuestions(true); }}
        requestState={feedbackRequestState}
      />
    );
  }

  if (showQuestions) {
    return (
      <QuestionsView 
        onSubmit={() => { void submitReviewAnswers(); }}
        onClose={() => { setShowQuestions(false); setShowDailySummary(true); }}
        questions={reviewQuestions}
        answers={reviewAnswers}
        onAnswersChange={setReviewAnswers}
        requestState={questionsRequestState}
      />
    );
  }

  if (showDailySummary) {
    return (
      <DailySummaryView 
        onNext={() => { void openReviewQuestions(); }}
        onClose={() => { setShowDailySummary(false); setShowReadingFinished(true); }}
        onReadLater={() => {
          const entry = createCurrentPendingSummary();
          setShowDailySummary(false);
          onGenerateReadLater?.(entry);
        }}
        summary={dailySummary}
        requestState={summaryRequestState}
      />
    );
  }

  if (showReadingFinished && readingFinishedRange) {
    return (
      <ReadingFinishedView 
        readingTimeMinutes={Math.max(1, Math.ceil(secondsRead / 60))}
        startPage={readingFinishedRange.start}
        endPage={readingFinishedRange.end}
        onViewSummary={() => {
          void openDailySummary();
        }}
        onGenerateReadLater={() => {
          void (async () => {
            const entry = createCurrentPendingSummary();
            await generateDailySummaryForLater();
            if (onGenerateReadLater) {
              onGenerateReadLater(entry);
            } else {
              onClose();
            }
          })();
        }}
        onClose={() => {
          setShowReadingFinished(false);
          setIsConfirmRangeOpen(true);
        }}
      />
    );
  }

  if (isConfirmRangeOpen) {
    return (
      <ConfirmRangeView 
        onBack={() => setIsConfirmRangeOpen(false)}
        activeBook={activeBook}
        initialStartPage={sessionStartPage}
        initialEndPage={pageIndex + 1}
        totalPages={pages.length}
        pages={pages}
        onConfirm={(start, end) => {
          try {
            const recordsStored = localStorage.getItem("customReadingRecords");
            const parsed = recordsStored ? JSON.parse(recordsStored) : [];
            
            const readPages = pages.slice(start - 1, end);
            const chapters = Array.from(new Set(readPages.map(p => p.chapterTitle).filter(Boolean)));
            const sections = Array.from(new Set(readPages.map((p: any) => p.sectionTitle).filter(Boolean)));

            const newRecord = {
              id: Date.now(),
              title: `《${activeBook.title}》`,
              date: `${new Date().getMonth() + 1}月${new Date().getDate()}日 · ${Math.max(1, Math.ceil(secondsRead / 60))}分钟`,
              range: `第 ${start} 页 - 第 ${end} 页`,
              chapters,
              sections,
              pages: { start, end },
              summary: `在本次第 ${start} 页至第 ${end} 页的深度研读中，伴随脑波音频与灯獭的无间陪伴，你完成了富有成效的自立伴读之旅。对前额叶皮层的精力运作与核心期待判定等内容进行了深度的内耗排除与课题分离归纳，特此生成并保存此专属伴读里程碑。`,
              actions: [
                `本次深度伴读累计专注耗时达 ${Math.max(1, Math.ceil(secondsRead / 60))} 分钟。`,
                `已成功将第 ${start} 页至第 ${end} 页的核心成长知识同步存储。`
              ]
            };
            localStorage.setItem("customReadingRecords", JSON.stringify([newRecord, ...parsed]));
          } catch (e) {
            console.error(e);
          }
          setReadingFinishedRange({ start, end });
          setRewardSettlement((current) => settleReward(current, "reading"));
          setIsConfirmRangeOpen(false);
          setShowReadingFinished(true);
        }}
      />
    );
  }

  return (
    <div className={`absolute inset-0 z-[120] flex flex-col overflow-hidden transition-colors duration-300 ${
      isReadingDark ? "bg-zinc-950 text-zinc-100" : "bg-[#FAF8F5] text-[#191c1d]"
    }`}>
      
      {/* PERSISTENT RUNNING CHAPTER TITLE HEADER (TOP LEFT, HIDE ON CHAPTER START PAGE) */}
      <div className={`absolute top-[54px] left-8 z-30 select-none text-[12px] font-medium tracking-wide pointer-events-none transition-all duration-300 ${
        isReadingDark ? "text-zinc-500" : "text-zinc-400"
      } ${activePage.isChapterStart ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        {lastVisibleChapterTitle || activePage.chapterTitle}
      </div>

      {/* PERSISTENT RUNNING PROGRESS FOOTER (BOTTOM RIGHT, STYLED ACCORDING TO USER'S PLAIN TEXT PREFERENCE) */}
      <div className="absolute bottom-5 right-8 z-30 select-none pointer-events-none transition-all duration-300">
        <span className={`text-[11px] font-medium font-mono tracking-wider ${
          isReadingDark ? "text-zinc-500" : "text-zinc-400"
        }`}>
          {pageIndex + 1} / {pages.length}
        </span>
      </div>

      {/* HUD HEADER: Top Navigation */}
      <AnimatePresence>
        {showUI && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.22 }}
            className={`absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-5 h-[110px] pt-14 pointer-events-auto ${
              isReadingDark 
                ? "bg-gradient-to-b from-zinc-950 via-zinc-950/90 to-transparent" 
                : "bg-gradient-to-b from-[#FAF8F5] via-[#FAF8F5]/90 to-transparent"
            }`}
          >
            <div className="flex items-center w-full justify-between gap-3">
              {/* Back Button */}
              <button 
                onClick={onClose}
                className={`w-10 h-10 flex items-center justify-center -ml-2 rounded-full active:scale-95 transition-all cursor-pointer ${
                  isReadingDark
                    ? "text-zinc-300 hover:bg-zinc-800/50"
                    : "text-zinc-700 hover:bg-zinc-200/50"
                }`}
                aria-label="返回"
              >
                <ArrowLeft size={22} strokeWidth={2.5} />
              </button>

              {/* Title group */}
              <div className="flex-1 min-w-0 text-left px-1">
                <h1 className={`text-[14.5px] font-extrabold truncate block leading-tight ${
                  isReadingDark ? "text-zinc-100" : "text-[#191c1d]"
                }`}>《{activeBook.title}》</h1>
              </div>

              {/* Stats HUD (Timer and Catalog Menu on the same line) */}
              <div className="flex items-center gap-2 shrink-0 relative">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border select-none ${
                   isReadingDark
                     ? "border-zinc-800/50 bg-zinc-900/30 text-zinc-400"
                     : "border-zinc-200/50 bg-zinc-100/30 text-zinc-500"
                }`}>
                  <Clock size={11} className={isReadingDark ? "text-zinc-500" : "text-zinc-400"} />
                  <span className="text-[11px] font-medium font-mono leading-none tracking-wider">{formatTime(secondsRead)}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenuDropdown(prev => !prev);
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-sm active:scale-95 transition-all cursor-pointer ${
                    showMenuDropdown 
                      ? (isReadingDark 
                          ? "bg-zinc-800 border-zinc-700 text-white" 
                          : "bg-zinc-100 border-zinc-350 text-zinc-950")
                      : (isReadingDark
                          ? "bg-zinc-900/65 border-zinc-800/50 text-zinc-300 hover:bg-zinc-900"
                          : "bg-white/65 border-zinc-200/50 text-zinc-700 hover:bg-white")
                  }`}
                  title="阅读菜单"
                >
                  <Menu size={18} />
                </button>

                {/* Dropdown Menu block */}
                <AnimatePresence>
                  {showMenuDropdown && (
                    <>
                      {/* Invisible pointer-events backdrop of UI to close dropdown on outside clicks */}
                      <div 
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenuDropdown(false);
                        }}
                      />
                      
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute right-0 top-12 z-50 w-52 rounded-2xl border shadow-xl p-2 select-none pointer-events-auto backdrop-blur-md transition-all ${
                          isReadingDark
                            ? "bg-zinc-900/95 border-zinc-800/80 text-zinc-100 shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
                            : "bg-white/95 border-zinc-200/60 text-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
                        }`}
                      >
                        {/* Option 1: View Table of Contents */}
                        <button
                          onClick={() => {
                            setShowMenuDropdown(false);
                            setShowCatalog(true);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left active:scale-98 transition-all cursor-pointer group ${
                            isReadingDark
                              ? "text-zinc-300 hover:bg-zinc-800/85"
                              : "text-zinc-700 hover:bg-zinc-100"
                          }`}
                        >
                          <List size={16} className={`transition-colors ${isReadingDark ? "text-zinc-500 group-hover:text-zinc-300" : "text-zinc-400 group-hover:text-[#4A6070]"}`} />
                          <div className="flex flex-col">
                            <span className={`text-[13px] font-bold ${isReadingDark ? "text-zinc-100" : "text-zinc-800"}`}>书籍目录</span>
                          </div>
                        </button>

                        <div className={`h-px my-1.5 ${isReadingDark ? "bg-zinc-800/50" : "bg-zinc-200/50"}`} />

                        {/* Option 2: Reading Guide Toggle */}
                        <div className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl ${isReadingDark ? "text-zinc-300" : "text-zinc-700"}`}>
                          <div className="flex items-center gap-3">
                            <HelpCircle size={16} className={isReadingDark ? "text-zinc-500" : "text-zinc-400"} />
                            <div className="flex flex-col">
                              <span className={`text-[13px] font-bold ${isReadingDark ? "text-zinc-100" : "text-zinc-800"}`}>阅读指引</span>
                            </div>
                          </div>
                          
                          {/* Toggle Switch UI component */}
                          <button
                            onClick={() => setShowReadingGuide(prev => !prev)}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer flex items-center shrink-0 ${
                              showReadingGuide ? "bg-[#4A6070]" : (isReadingDark ? "bg-zinc-700" : "bg-zinc-200")
                            }`}
                          >
                            <span 
                              className={`w-4 h-4 bg-white rounded-full shadow-sm transform duration-200 ease-in-out ${
                                showReadingGuide ? "translate-x-4" : "translate-x-0"
                              }`} 
                            />
                          </button>
                        </div>

                        <div className={`h-px my-1.5 ${isReadingDark ? "bg-zinc-800/50" : "bg-zinc-200/50"}`} />

                        {/* Option 3: Ambient Noise Toggle & Custom Selector */}
                        <div className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl ${isReadingDark ? "text-zinc-300" : "text-zinc-700"}`}>
                          <div className="flex items-center gap-3">
                            {isAmbientPlaying ? (
                              <Volume2 size={16} className="text-[#4A6070] animate-pulse shrink-0" />
                            ) : (
                              <VolumeX size={16} className={`shrink-0 ${isReadingDark ? "text-zinc-500" : "text-zinc-400"}`} />
                            )}
                            <div className="flex flex-col">
                              <span className={`text-[13px] font-bold ${isReadingDark ? "text-zinc-100" : "text-zinc-800"}`}>背景白噪音</span>
                            </div>
                          </div>
                          
                          {/* Toggle Switch UI component */}
                           <button
                             onClick={() => {
                               setToastMessage("敬请期待~");
                               setShowToast(true);
                               setTimeout(() => setShowToast(false), 2000);
                             }}
                             className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer flex items-center shrink-0 ${
                               isAmbientPlaying ? "bg-[#4A6070]" : (isReadingDark ? "bg-zinc-700" : "bg-zinc-200")
                             }`}
                           >
                             <span 
                               className={`w-4 h-4 bg-white rounded-full shadow-sm transform duration-200 ease-in-out ${
                                 isAmbientPlaying ? "translate-x-4" : "translate-x-0"
                               }`} 
                             />
                           </button>
                        </div>

                        {/* Mini Sound choices list expander when playing */}
                        <AnimatePresence>
                          {isAmbientPlaying && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className="px-2 pb-1.5 pt-0.5 flex flex-col gap-1 overflow-hidden"
                            >
                              {[
                                { id: "waves", label: "海浪", icon: Waves },
                                { id: "rain", label: "细雨", icon: CloudRain },
                                { id: "wind", label: "微风", icon: Wind },
                              ].map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => setAmbientNoiseType(item.id as any)}
                                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left transition-all cursor-pointer ${
                                    ambientNoiseType === item.id
                                      ? (isReadingDark
                                          ? "bg-zinc-800/75 border border-zinc-700/45 shadow-[0_2px_8px_rgba(0,0,0,0.2)] text-zinc-100 font-semibold"
                                          : "bg-zinc-100/70 border border-zinc-200/40 shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-zinc-800 font-semibold")
                                      : (isReadingDark
                                          ? "border border-transparent text-zinc-400 hover:bg-zinc-800/40"
                                          : "border border-transparent text-zinc-550 hover:bg-zinc-100/40")
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 ${
                                      ambientNoiseType === item.id 
                                        ? "bg-[#4A6070] text-white shadow-sm" 
                                        : (isReadingDark ? "bg-zinc-800 text-zinc-500" : "bg-zinc-100 text-zinc-400")
                                    }`}>
                                      <item.icon size={11} />
                                    </div>
                                    <span className="text-[11.5px] leading-none">{item.label}</span>
                                  </div>
                                  {ambientNoiseType === item.id && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#4A6070] mr-0.5" />
                                  )}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className={`h-px my-1.5 ${isReadingDark ? "bg-zinc-800/50" : "bg-zinc-200/50"}`} />

                        {/* Option 4: Day/Night Mode Switch Toggle */}
                        <div className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl ${isReadingDark ? "text-zinc-300" : "text-zinc-700"}`}>
                          <div className="flex items-center gap-3">
                            {isReadingDark ? (
                              <Moon size={16} fill="currentColor" className="text-[#4A6070] shrink-0" />
                            ) : (
                              <Moon size={16} fill="none" className="text-zinc-400 shrink-0" />
                            )}
                            <div className="flex flex-col">
                              <span className={`text-[13px] font-bold ${isReadingDark ? "text-zinc-300" : "text-zinc-800"}`}>黑夜模式</span>
                            </div>
                          </div>
                          
                          {/* Toggle is Dark Mode (active when isReadingDark) */}
                          <button
                            onClick={() => setIsReadingDark(prev => !prev)}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer flex items-center shrink-0 ${
                              isReadingDark ? "bg-[#4A6070]" : "bg-zinc-200"
                            }`}
                          >
                            <span 
                              className={`w-4 h-4 bg-white rounded-full shadow-sm transform duration-200 ease-in-out ${
                                isReadingDark ? "translate-x-4" : "translate-x-0"
                              }`} 
                            />
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* MAIN READING AREA COMPONENT */}
      <div 
        onClick={handleCanvasClick}
        className="flex-1 w-full h-full flex flex-col justify-center px-8 relative pointer-events-auto cursor-pointer select-none"
        style={{ fontFamily: '"PingFang SC", "Noto Serif CJK SC", "Source Han Serif CJK SC", serif' }}
      >
        
        {/* Helper Tap Navigation Overlay Hints when UI is active */}
        <AnimatePresence>
          {showUI && showReadingGuide && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 top-[110px] bottom-[105px] pointer-events-none grid grid-cols-3 z-10 text-[12px] font-medium tracking-wide"
            >
              <div className={`border-r border-dashed flex items-center justify-start pl-4 select-none transition-all duration-300 ${
                isReadingDark 
                  ? "border-zinc-700/65 text-zinc-200" 
                  : "border-zinc-300 text-zinc-700"
              }`}>
                <span className={`px-2.5 py-1 rounded-xl backdrop-blur-md transition-colors shadow-sm tracking-wide border ${
                  isReadingDark 
                    ? "bg-black/55 text-zinc-200 border-white/5" 
                    : "bg-neutral-200/80 text-neutral-800 border-black/5"
                }`}>
                  ◀ 点击翻上页
                </span>
              </div>
              
              <div className={`flex items-center justify-center text-center select-none transition-all duration-300 ${
                isReadingDark 
                  ? "text-zinc-200" 
                  : "text-zinc-700"
              }`}>
                <span className={`px-2.5 py-1 rounded-xl backdrop-blur-md transition-colors shadow-sm tracking-wide border ${
                  isReadingDark 
                    ? "bg-black/55 text-zinc-200 border-white/5" 
                    : "bg-neutral-200/80 text-neutral-800 border-black/5"
                }`}>
                  点击开关菜单
                </span>
              </div>
              
              <div className={`border-l border-dashed flex items-center justify-end pr-4 text-right select-none transition-all duration-300 ${
                isReadingDark 
                  ? "border-zinc-700/65 text-zinc-200" 
                  : "border-zinc-300 text-zinc-700"
              }`}>
                <span className={`px-2.5 py-1 rounded-xl backdrop-blur-md transition-colors shadow-sm tracking-wide border ${
                  isReadingDark 
                    ? "bg-black/55 text-zinc-200 border-white/5" 
                    : "bg-neutral-200/80 text-neutral-800 border-black/5"
                }`}>
                  点击翻下页 ▶
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animated Page text display block with enhanced vertical padding spacing */}
        <AnimatePresence custom={direction} mode="wait">
          <motion.article
            key={pageIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 50 }}
            transition={{ type: "tween", ease: "easeOut", duration: 0.28 }}
            className="w-full flex flex-col justify-start pt-[126px] pb-[71px] h-full"
          >
            {activePage.isChapterStart ? (
              (() => {
                const titleStr = activePage.chapterTitle || "";
                const spaceIdx = titleStr.indexOf(" ");
                let chNumber = "";
                let chName = titleStr;
                if (spaceIdx > 0) {
                  chNumber = titleStr.substring(0, spaceIdx);
                  chName = titleStr.substring(spaceIdx + 1);
                }
                return (
                  <div className="flex-1 flex flex-col justify-start pt-[160px] px-4 text-left">
                    <div className="border-l-3 border-[#4A6070] pl-3">
                      {chNumber ? (
                        <div className="flex items-start gap-3">
                          <span className={`shrink-0 text-[22px] sm:text-[24px] font-bold tracking-wide leading-relaxed select-all ${
                            isReadingDark ? "text-zinc-100" : "text-zinc-800"
                          }`}>
                            {chNumber}
                          </span>
                          <h1 className={`flex-1 text-[18px] sm:text-[20px] font-bold tracking-wide leading-relaxed mt-1 select-all ${
                            isReadingDark ? "text-zinc-550" : "text-zinc-400"
                          }`}>
                            {chName}
                          </h1>
                        </div>
                      ) : (
                        <h1 className={`text-[22px] sm:text-[24px] font-bold tracking-wide leading-relaxed select-all ${
                          isReadingDark ? "text-zinc-100" : "text-zinc-800"
                        }`}>
                          {titleStr}
                        </h1>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <>
                {/* Paragraph lines styled to WeChat-Reading standards */}
                <div className={`space-y-4.5 text-[15.5px] leading-[28px] font-light tracking-[0.03em] text-justify ${
                  isReadingDark ? "text-zinc-100/95" : "text-zinc-800/95"
                }`}>
                  {activePage.paragraphs.map((p, idx) => (
                    <p 
                      key={idx} 
                      className={`${p.isContinuation ? "" : "indent-8"} antialiased selection:bg-[#4A6070]/20`}
                    >
                      {p.text}
                    </p>
                  ))}
                </div>
              </>
            )}
          </motion.article>
        </AnimatePresence>
      </div>

      {/* FLOATABLE CONTROLS FOOTER: Bottom */}
      <AnimatePresence>
        {showUI && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`absolute bottom-0 left-0 right-0 z-50 px-5 pb-8 pt-6 pointer-events-auto ${
              isReadingDark 
                ? "bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent" 
                : "bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5]/90 to-transparent"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              
              {/* Back / Done controls (Minimalist Style - Stretched & perfectly balanced) */}
              <button 
                onClick={handleEndReading}
                className={`flex-grow flex items-center justify-center gap-1.5 px-5 h-11 border text-[12.5px] font-bold rounded-full shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer select-none ${
                  isReadingDark
                    ? "bg-zinc-900/65 hover:bg-zinc-900 border-zinc-800/50 text-zinc-300"
                    : "bg-white/65 hover:bg-white border-zinc-200/50 text-zinc-700"
                }`}
              >
                <Check size={15} className={isReadingDark ? "text-zinc-550" : "text-zinc-400"} />
                <span className="tracking-wide">结束阅读</span>
              </button>

              {/* Otter Companion Trigger Buddy Button */}
              <button 
                onClick={triggerCompanionSaying}
                className={`h-11 px-3.5 rounded-full border shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shrink-0 relative overflow-hidden group ${
                  isReadingDark 
                    ? "bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-[#4A6070]" 
                    : "bg-white border-zinc-200/60 text-zinc-700 hover:border-[#4A6070]"
                }`}
                aria-label="Companion interaction button"
              >
                {/* Micro glow background on hover */}
                <span className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-r ${isReadingDark ? 'from-[#4A6070]/10 to-transparent' : 'from-[#4A6070]/5 to-transparent'}`} />

                {/* Mascot avatar container */}
                <div className="relative w-7 h-7 flex items-center justify-center bg-transparent rounded-full overflow-visible">
                  <img 
                    alt="Companion Otter Avatar" 
                    className={`w-[30px] h-[30px] min-w-[30px] min-h-[30px] object-contain transform group-hover:scale-115 group-hover:rotate-6 transition-all duration-300 ${
                      isReadingDark ? "invert" : ""
                    }`} 
                    referrerPolicy="no-referrer"
                    src={dengTataChatAvatar}
                  />
                </div>

                {/* Button texts */}
                <div className="flex items-center text-left select-none pr-0.5">
                  <span className="text-[13px] font-extrabold tracking-tight group-hover:text-[#4A6070] transition-colors flex items-center gap-1">
                    伴读问答
                    <Sparkles size={12} className="text-amber-500 animate-pulse shrink-0" />
                  </span>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Table of Contents Catalog Drawer */}
      <AnimatePresence>
        {showCatalog && (
          <>
            {/* Backdrop with elegant blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ ease: "linear", duration: 0.2 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowCatalog(false);
              }}
              className="absolute inset-0 z-[150] bg-black/35 backdrop-blur-[2px] pointer-events-auto"
            />
            
            {/* Catalog Side Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "linear", duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className={`absolute top-0 right-0 bottom-0 w-[280px] sm:w-[320px] z-[160] border-l shadow-2xl flex flex-col p-6 pt-16 overflow-y-auto pointer-events-auto ${
                isReadingDark 
                  ? "bg-zinc-950 border-zinc-800/80 text-zinc-100" 
                  : "bg-[#FAF8F5] border-zinc-200/50 text-zinc-800"
              }`}
            >
              <div className={`flex items-center justify-between mb-8 pb-3 border-b ${
                isReadingDark ? "border-zinc-800/50" : "border-zinc-200/50"
              }`}>
                <h2 className={`text-[14px] font-extrabold tracking-wider ${
                  isReadingDark ? "text-zinc-100" : "text-zinc-800"
                }`}>书籍目录</h2>
                <button 
                  onClick={() => setShowCatalog(false)}
                  className={`text-[11.5px] font-semibold tracking-wider cursor-pointer transition-all select-none ${
                    isReadingDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-650"
                  }`}
                >
                  关闭
                </button>
              </div>
              
              <div className="flex-1 flex flex-col gap-1.5">
                {getBookContent(activeBook).chapters.map((ch, idx) => {
                  const startIdx = pages.findIndex(p => p.chapterTitle === ch.title && p.isChapterStart);
                  const isActive = pages[pageIndex]?.chapterTitle === ch.title;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (startIdx !== -1) {
                          setPageIndex(startIdx);
                        }
                        setShowCatalog(false);
                      }}
                      className={`w-full text-left py-3 px-3.5 rounded-xl flex items-start gap-3 transition-all cursor-pointer select-none group border ${
                        isActive 
                          ? (isReadingDark ? 'bg-zinc-900 border-zinc-800' : 'bg-[#4A6070]/5 border-[#4A6070]/20') 
                          : `bg-transparent border-transparent ${isReadingDark ? 'hover:bg-zinc-900/30' : 'hover:bg-zinc-100/50'}`
                      }`}
                    >
                      {/* Active Status indicator dot */}
                      <div className={`w-1.5 h-1.5 rounded-full mt-[7px] shrink-0 transition-colors ${isActive ? (isReadingDark ? 'bg-zinc-100' : 'bg-[#4A6070]') : 'bg-transparent'}`} />
                      <div className="flex-1 min-w-0">
                        <span className={`block text-[12.5px] font-medium tracking-wide leading-relaxed ${
                          isActive 
                            ? (isReadingDark ? 'text-zinc-100 font-bold' : 'text-[#4A6070] font-bold') 
                            : (isReadingDark ? 'text-zinc-400 group-hover:text-zinc-250' : 'text-zinc-600 group-hover:text-zinc-800')
                        }`}>
                          {ch.title}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Interactive AI Assistant Drawer / Popup */}
      <AnimatePresence>
        {showAssistant && (
          <>
            {/* Backdrop with elegant blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                closeAssistant();
              }}
              className="absolute inset-0 z-[150] bg-black/45 backdrop-blur-[2.5px] pointer-events-auto"
            />
            
            {/* Bottom Sheet Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.2, ease: "linear" }}
              onClick={(e) => e.stopPropagation()}
              className={`absolute bottom-0 left-0 right-0 z-[160] rounded-t-[32px] border-t shadow-2xl flex flex-col p-6 pb-8 pointer-events-auto ${
                isReadingDark 
                  ? "bg-zinc-900 border-zinc-800 text-zinc-100" 
                  : "bg-white border-zinc-200/60 text-zinc-800"
              }`}
            >
              {/* Drag Handle */}
              <div className="w-full flex justify-center pb-4 pt-0.5" onClick={closeAssistant}>
                <div className={`w-12 h-1.5 rounded-full ${isReadingDark ? "bg-zinc-800" : "bg-zinc-200"}`}></div>
              </div>

              {/* Header & Mascot */}
              <div className="flex items-center justify-between mb-5 select-none relative">
                <div className="flex flex-col text-left">
                  <h2 className={`text-[20px] font-extrabold tracking-tight ${isReadingDark ? "text-zinc-100" : "text-zinc-800"}`}>
                    阅读辅助
                  </h2>
                  <p className={`text-[12px] mt-0.5 font-medium ${isReadingDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    Deng Tata 随时为您解答
                  </p>
                </div>
                
                {/* Mascot Frame */}
                <div className="relative w-23 h-23 -mt-10 flex items-center justify-center">
                  {/* Decorative Glow Behind Mascot */}
                  <div className={`absolute inset-0 rounded-full blur-xl transform scale-75 ${
                    isReadingDark ? "bg-[#eebf6a]/15" : "bg-[#eebf6a]/30"
                  }`} />
                  <img 
                    alt="Cute sea otter mascot Deng Tata holding a glowing lantern" 
                    className="relative w-23 h-23 object-contain drop-shadow-md z-10 animate-bounce [animation-duration:4s]"
                    referrerPolicy="no-referrer"
                    src={dengTataSittingNew} 
                  />
                </div>
              </div>

              {/* Chat history / QA Response section */}
              {assistantRequestState.status !== "idle" && (
                <div className={`mb-4 p-4 rounded-[20px] min-h-[90px] text-left text-[12.5px] leading-relaxed transition-all overflow-y-auto max-h-[140px] border ${
                  isReadingDark 
                    ? "bg-zinc-950/60 border-zinc-800/80 text-zinc-300" 
                    : "bg-[#F3F6F6] border-[#DDEFF7]/50 text-[#17262e]"
                }`}>
                  {assistantRequestState.status === "loading" ? (
                    <div className="flex items-center gap-2 font-medium">
                      <Sparkles size={13} className="text-[#eebf6a] animate-spin" />
                      <span>{assistantRequestState.message}</span>
                    </div>
                  ) : assistantAnswer ? (
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#DDB05C] mt-[7px] shrink-0" />
                      <div>
                        <div className="font-bold text-[11px] mb-1.5 text-[#DDB05C] tracking-wide uppercase select-none">灯獭獭的解答</div>
                        <p>{assistantAnswer}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#DDB05C] mt-[7px] shrink-0" />
                      <p>{assistantRequestState.message}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Input Area */}
              <div className={`rounded-[20px] p-2 mb-5 flex flex-col border transition-all duration-305 ${
                isReadingDark 
                  ? "bg-zinc-950/85 border-zinc-800/80 text-zinc-100 focus-within:border-[#eebf6a]/40" 
                  : "bg-[#F6F8F8] border-[#DDEFF7] text-zinc-800 focus-within:border-[#eebf6a]/50"
              }`}>
                <textarea 
                  value={assistantQuery}
                  onChange={(e) => setAssistantQuery(e.target.value)}
                  className={`w-full bg-transparent border-none outline-none focus:ring-0 resize-none text-[13px] leading-relaxed placeholder-zinc-400 p-2 min-h-[75px] max-h-[110px] hide-scrollbar focus:outline-none`} 
                  placeholder="想问些什么吗？"
                  disabled={assistantRequestState.status === "loading"}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button 
                  onClick={() => handleAskAssistant(false)}
                  disabled={assistantRequestState.status === "loading"}
                  className={`flex-1 py-3.5 px-4 rounded-full font-bold text-[12.5px] shadow-sm hover:opacity-90 active:scale-95 transition-all text-white flex justify-center items-center gap-1.5 cursor-pointer ${
                    isReadingDark 
                      ? "bg-zinc-800 border border-zinc-700/40 hover:bg-zinc-750" 
                      : "bg-[#17262e] hover:bg-[#20313a]"
                  }`}
                >
                  <MessageCircle size={15} />
                  <span>直接问</span>
                </button>
                <button 
                  onClick={() => handleAskAssistant(true)}
                  disabled={assistantRequestState.status === "loading"}
                  className={`flex-1 py-3.5 px-4 rounded-full font-bold text-[12.5px] shadow-sm hover:opacity-90 active:scale-95 transition-all text-white flex justify-center items-center gap-1.5 cursor-pointer ${
                    isReadingDark 
                      ? "bg-zinc-800 border border-zinc-700/40 hover:bg-zinc-750" 
                      : "bg-[#17262e] hover:bg-[#20313a]"
                  }`}
                >
                  <Sparkles size={15} className="text-[#eebf6a]" />
                  <span>基于原文回答</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Standard Toast Bubble Alert matching Fig 2 (icon-free black pill) */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: "-50%" }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-28 left-1/2 z-[250] pointer-events-none"
          >
            <div className="bg-zinc-900/95 dark:bg-neutral-800/95 backdrop-blur-md text-white border border-white/10 px-5 py-3 rounded-2xl flex items-center justify-center shadow-xl shadow-black/20 min-w-[200px]">
              <span className="text-[13px] font-medium tracking-wide text-center">{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
