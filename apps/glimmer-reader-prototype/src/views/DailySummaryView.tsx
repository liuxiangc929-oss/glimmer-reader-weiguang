import React from 'react';
import { motion } from "motion/react";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { DEFAULT_DAILY_SUMMARY, DailySummary, type DailySummaryResponse } from "../api/dailySummary";
import type { AiRequestState } from "../ai/aiRequestState";

interface DailySummaryViewProps {
  onNext: () => void;
  onClose: () => void;
  onReadLater: () => void;
  summary?: DailySummary;
  requestState: AiRequestState<DailySummaryResponse>;
}

export default function DailySummaryView({ 
  onNext, 
  onClose, 
  onReadLater, 
  summary = DEFAULT_DAILY_SUMMARY,
  requestState,
}: DailySummaryViewProps) {
  const summaryItems = summary.items.length > 0 ? summary.items : DEFAULT_DAILY_SUMMARY.items;
  const isLoading = requestState.status === "loading";
  const mode = requestState.data?.mode ?? "mock";

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col z-[210] bg-[#fcfdfd] overflow-hidden pt-[44px]">
      {/* Top Navigation */}
      <header className="flex items-center justify-between px-5 h-14 shrink-0 w-full max-w-md mx-auto relative z-40 bg-[#fcfdfd]">
        <button 
          onClick={onClose}
          aria-label="返回" 
          className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-black/5 active:scale-95 transition-all text-[#2d3c44] cursor-pointer"
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
        <h1 className="text-[17px] font-bold text-[#2d3c44] absolute left-1/2 -translate-x-1/2">阅读总结</h1>
        <div className="w-10 h-10"></div>
      </header>

      <div className="flex-1 w-full overflow-y-auto no-scrollbar">
        {/* Main Content Canvas */}
        <main className="w-full max-w-md mx-auto flex-1 px-5 pt-2 pb-[160px] flex flex-col items-center">

          {/* Quote Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="w-full bg-gradient-to-br from-[#ffffff] to-[#faf7ee] rounded-[24px] p-8 pt-9 pb-8 mt-2 mb-10 shadow-[0_8px_24px_rgba(238,191,106,0.12)] border border-[#f7f0e1] relative"
          >
             {/* Date Pill inside card */}
             <div className="absolute top-6 left-6 inline-flex items-center px-4 py-1.5 rounded-full bg-white shadow-[0_4px_12px_rgba(238,191,106,0.1)] border border-border-light/40">
                <span className="text-[13px] font-semibold text-[#c89d4b] tracking-wide">
                  {new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                </span>
             </div>
             
             <div className="relative z-10 w-full mb-1 mt-7">
               <p className="text-[16px] text-primary/80 leading-[1.9] font-medium text-left pr-2">
                 {isLoading ? "灯獭獭正在轻轻整理你今天读过的内容..." : summary.quote}
               </p>
               <p className="text-[13px] text-text-secondary font-medium text-right mt-8">
                 ——— {mode === "live" ? "AI 今日总结" : "微光伴读"}
               </p>
             </div>
          </motion.div>

          {/* Section Heading */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full flex items-center mb-6 pl-1"
          >
            <div className="w-10 h-10 rounded-full bg-white shadow-[0_2px_12px_rgba(45,60,68,0.04)] border border-border-light/30 flex items-center justify-center mr-3">
              {isLoading ? (
                <Loader2 size={18} className="text-[#e8c88c] animate-spin" />
              ) : (
                <BookOpen size={18} className="text-[#e8c88c]" />
              )}
            </div>
            <h3 className="text-[17px] font-bold text-primary tracking-wide">今日要点</h3>
          </motion.div>
          
          {/* List Items */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full flex-1 flex flex-col mb-8 px-1"
          >
            <ul className="space-y-4">
              {summaryItems.map((item, index) => (
                <li key={`${index}-${item}`} className="flex items-start bg-white p-5 rounded-[20px] shadow-[0_2px_12px_rgba(45,60,68,0.02)]">
                  <div className="w-[26px] h-[26px] rounded-full bg-[#f0f2f5] flex items-center justify-center mr-4 shrink-0 mt-0.5">
                    <span className="text-[13px] font-bold text-text-secondary">{index + 1}</span>
                  </div>
                  <p className="text-[14px] leading-[1.7] text-primary/80 font-medium tracking-wide">{isLoading ? "正在生成温和的小结，请稍等一下。" : item}</p>
                </li>
              ))}
            </ul>
          </motion.section>

        </main>
      </div>

      {/* Bottom Action Area */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="absolute bottom-0 left-0 w-full z-50 bg-gradient-to-t from-[#fcfdfd] via-[#fcfdfd]/90 to-transparent pt-12 pb-safe-bottom px-5 flex justify-center items-end pointer-events-none"
      >
        <div className="w-full max-w-md pb-6 mt-4 pointer-events-auto flex flex-row gap-3">
          <button 
            onClick={onReadLater}
            className="flex-1 py-[15px] rounded-[24px] border border-border-light/80 text-text-secondary flex items-center justify-center bg-transparent hover:bg-surface-variant/30 active:scale-[0.98] transition-all duration-200"
          >
            <span className="text-[15px] font-medium tracking-wide whitespace-nowrap">
              稍后再看
            </span>
          </button>
          <button 
            onClick={onNext}
            disabled={isLoading}
            aria-disabled={isLoading}
            className="flex-1 py-[16px] rounded-[24px] bg-[#2d3c44] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(45,60,68,0.15)] hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <span className="text-[16px] font-medium tracking-wide whitespace-nowrap">
              {isLoading ? "准备中" : "进一步理解"}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
