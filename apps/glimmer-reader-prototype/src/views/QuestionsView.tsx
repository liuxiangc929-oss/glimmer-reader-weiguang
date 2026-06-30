import React, { useState } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Lightbulb, Filter, Activity, ArrowRight, Sparkles, Compass, Maximize2, Minimize2 } from "lucide-react";
import dengTataLying from "../assets/images/deng_tata_lying.png";
import type { AiRequestState } from "../ai/aiRequestState";
import type { ReviewAnswers } from "../api/answerFeedback";
import type { ReviewQuestions, ReviewQuestionsResponse } from "../api/reviewQuestions";

interface QuestionsViewProps {
  onSubmit: () => void;
  onClose: () => void;
  questions: ReviewQuestions;
  answers: ReviewAnswers;
  onAnswersChange: (answers: ReviewAnswers) => void;
  requestState: AiRequestState<ReviewQuestionsResponse>;
}

export default function QuestionsView({
  onSubmit,
  onClose,
  questions,
  answers,
  onAnswersChange,
  requestState,
}: QuestionsViewProps) {
  const [showPetIntro, setShowPetIntro] = useState(true);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({
    q1: false,
    q2: false,
    q3: false,
  });

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div 
      className="absolute inset-0 w-full h-full flex flex-col z-[220] bg-[#f8f9fa] overflow-hidden pt-[44px]"
      onClick={() => {
        if (showPetIntro) setShowPetIntro(false);
      }}
    >
      {/* Top AppBar */}
      <header className="flex items-center justify-between px-5 h-14 shrink-0 w-full max-w-md mx-auto relative z-40 bg-[#f8f9fa]">
        <button 
          onClick={onClose}
          aria-label="返回"
          className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-black/5 active:scale-95 transition-all text-[#2d3c44] cursor-pointer"
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
        <h1 className="text-[17px] font-bold text-[#2d3c44] absolute left-1/2 -translate-x-1/2">
          记录你的感悟
        </h1>
        <div className="w-10 h-10"></div>
      </header>

      <div className="flex-1 w-full overflow-y-auto no-scrollbar">
        {/* Main Content Canvas */}
        <main className="w-full max-w-md mx-auto px-5 pt-2 pb-[110px] relative z-10 flex flex-col justify-center">
        {requestState.status === "loading" && (
          <p className="mb-4 text-center text-[13px] text-[#5a6a72]">灯獭獭正在准备三个轻问题...</p>
        )}
        {requestState.status === "error" && (
          <p className="mb-4 rounded-[16px] bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-800">
            {requestState.message}
          </p>
        )}
        {/* Questions List */}
        <div className="w-full flex-col gap-5 flex pb-2">
          
          {/* Question 1: 理解 (Understand) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full bg-white rounded-[24px] p-5 shadow-[0_4px_24px_rgba(45,60,68,0.04)] border border-black/[0.02]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                  <Lightbulb size={18} className="text-blue-500" />
                </div>
                <span className="text-[16px] font-bold text-[#2d3c44]">理解</span>
              </div>
            </div>
            <p className="mb-3 text-[14px] leading-relaxed text-[#5a6a72]">{questions.understanding.question}</p>
            <div className="relative">
              <textarea 
                className={`w-full bg-[#f8f9fa] rounded-[16px] px-4 py-3.5 pb-8 no-scrollbar text-[14px] text-[#2d3c44] placeholder:text-gray-400 border border-transparent focus:border-blue-500/30 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-300 resize-none ${expanded.q1 ? 'h-[180px]' : 'h-[100px]'}`} 
                placeholder={questions.understanding.placeholder}
                value={answers.understanding}
                onChange={(event) => onAnswersChange({ ...answers, understanding: event.target.value })}
                disabled={requestState.status === "loading"}
                style={{ caretColor: '#3b82f6' }}
              />
              <button
                onClick={(e) => { e.stopPropagation(); toggleExpand('q1'); }}
                className="absolute right-2 bottom-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={expanded.q1 ? "缩小输入框" : "展开输入框"}
              >
                {expanded.q1 ? <Minimize2 size={18} className="opacity-80" /> : <Maximize2 size={18} className="opacity-80" />}
              </button>
            </div>
          </motion.div>

          {/* Question 2: 提炼 (Refine) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full bg-white rounded-[24px] p-5 shadow-[0_4px_24px_rgba(45,60,68,0.04)] border border-black/[0.02]"
          >
             <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
                  <Filter size={18} className="text-amber-500" />
                </div>
                <span className="text-[16px] font-bold text-[#2d3c44]">提炼</span>
              </div>
            </div>
            <p className="mb-3 text-[14px] leading-relaxed text-[#5a6a72]">{questions.extraction.question}</p>
            <div className="relative">
              <textarea 
                className={`w-full bg-[#f8f9fa] rounded-[16px] px-4 py-3.5 pb-8 no-scrollbar text-[14px] text-[#2d3c44] placeholder:text-gray-400 border border-transparent focus:border-amber-500/30 focus:bg-white focus:ring-4 focus:ring-amber-500/10 focus:outline-none transition-all duration-300 resize-none ${expanded.q2 ? 'h-[180px]' : 'h-[100px]'}`} 
                placeholder={questions.extraction.placeholder}
                value={answers.extraction}
                onChange={(event) => onAnswersChange({ ...answers, extraction: event.target.value })}
                disabled={requestState.status === "loading"}
                style={{ caretColor: '#f59e0b' }}
              />
              <button
                onClick={(e) => { e.stopPropagation(); toggleExpand('q2'); }}
                className="absolute right-2 bottom-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={expanded.q2 ? "缩小输入框" : "展开输入框"}
              >
                {expanded.q2 ? <Minimize2 size={18} className="opacity-80" /> : <Maximize2 size={18} className="opacity-80" />}
              </button>
            </div>
          </motion.div>

          {/* Question 3: 行动 (Action) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full bg-white rounded-[24px] p-5 shadow-[0_4px_24px_rgba(45,60,68,0.04)] border border-black/[0.02]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Compass size={18} className="text-emerald-500" />
                </div>
                <span className="text-[16px] font-bold text-[#2d3c44]">行动</span>
              </div>
            </div>
            <p className="mb-3 text-[14px] leading-relaxed text-[#5a6a72]">{questions.action.question}</p>
            <div className="relative">
              <textarea 
                className={`w-full bg-[#f8f9fa] rounded-[16px] px-4 py-3.5 pb-8 no-scrollbar text-[14px] text-[#2d3c44] placeholder:text-gray-400 border border-transparent focus:border-emerald-500/30 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all duration-300 resize-none ${expanded.q3 ? 'h-[180px]' : 'h-[100px]'}`} 
                placeholder={questions.action.placeholder}
                value={answers.action}
                onChange={(event) => onAnswersChange({ ...answers, action: event.target.value })}
                disabled={requestState.status === "loading"}
                style={{ caretColor: '#10b981' }}
              />
              <button
                onClick={(e) => { e.stopPropagation(); toggleExpand('q3'); }}
                className="absolute right-2 bottom-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={expanded.q3 ? "缩小输入框" : "展开输入框"}
              >
                {expanded.q3 ? <Minimize2 size={18} className="opacity-80" /> : <Maximize2 size={18} className="opacity-80" />}
              </button>
            </div>
          </motion.div>
        </div>
      </main>
      </div>

      {/* Floating Pet (Deng Tata) & Speech Bubble */}
      <AnimatePresence>
        {showPetIntro && (
          <>
            {/* Background Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-[55] backdrop-blur-[4px] bg-white/30 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowPetIntro(false);
              }}
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="absolute left-6 bottom-[180px] z-[60] flex flex-col items-start pointer-events-auto cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowPetIntro(false);
              }}
            >
              {/* Speech Bubble */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10, transformOrigin: "bottom left" }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4, type: "spring" }}
                className="bg-white rounded-[20px] px-5 py-4 shadow-[0_8px_24px_rgba(45,60,68,0.12)] border border-black/5 mb-3 relative max-w-[240px] ml-6"
              >
                <p className="text-[15px] text-[#2d3c44] font-medium leading-relaxed tracking-wide">
                  不用写多，只是留下此刻的想法就好~
                </p>
                <div className="absolute -bottom-[8px] left-[20px] w-4 h-4 bg-white border-b border-r border-black/5 transform rotate-45"></div>
              </motion.div>
 
              {/* Pet Image */}
              <motion.img 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                alt="Deng Tata" 
                className="w-[176px] h-[176px] object-contain drop-shadow-2xl -translate-x-1 rounded-[20px]" 
                src={dengTataLying}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Action Area */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute bottom-0 left-0 w-full z-50 bg-gradient-to-t from-[#f8f9fa] via-[#f8f9fa]/90 to-transparent pt-12 pb-safe-bottom px-5 flex justify-center items-end pointer-events-none"
      >
        <div className="w-full max-w-md pb-6 mt-4 pointer-events-auto">
          <button 
            onClick={onSubmit}
            disabled={requestState.status === "loading"}
            className="w-full bg-[#2d3c44] text-white rounded-[24px] py-[16px] flex items-center justify-center shadow-[0_8px_20px_rgba(45,60,68,0.15)] hover:opacity-90 active:scale-[0.98] transition-all duration-200"
          >
            <span className="text-[16px] font-medium tracking-wide">
              {requestState.status === "loading" ? "问题准备中..." : "记录完毕"}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
