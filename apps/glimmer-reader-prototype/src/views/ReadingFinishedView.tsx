import React from 'react';
import { motion, AnimatePresence } from "motion/react";
import { Clock, BookOpen, ArrowLeft } from "lucide-react";
import dengTataLanternOnly from "../assets/images/deng_tata_lantern_only.jpg";

interface ReadingFinishedViewProps {
  readingTimeMinutes: number;
  startPage: number;
  endPage: number;
  onViewSummary: () => void;
  onGenerateReadLater: () => void;
  onClose: () => void;
}

export default function ReadingFinishedView({ 
  readingTimeMinutes, 
  startPage, 
  endPage, 
  onViewSummary, 
  onGenerateReadLater,
  onClose
}: ReadingFinishedViewProps) {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-background flex flex-col z-[200]">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
        className="flex-1 w-full h-full flex flex-col pt-[60px] pb-[160px] overflow-y-auto no-scrollbar"
      >
        <header className="flex items-center justify-between px-5 h-14 w-full shrink-0 relative z-50">
          <button 
            onClick={onClose}
            aria-label="返回" 
            className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-surface-variant/50 active:scale-95 transition-all text-primary cursor-pointer"
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <h1 className="text-lg font-semibold text-primary">阅读结束</h1>
          <div className="w-10 h-10"></div> {/* Spacer for centering */}
        </header>

        <main className="w-full max-w-md mx-auto flex-1 flex flex-col items-center justify-center px-6 pt-0 pb-12 relative text-center">
          
          {/* Mascot Info Area */}
          <div className="relative mb-6 mt-[-2vh] flex flex-col items-center">
            {/* Speech Bubble */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="bg-white px-5 py-3 rounded-[20px] shadow-[0_8px_16px_rgba(45,60,68,0.06)] border border-border-light/40 relative mb-4"
            >
              <p className="text-[14px] text-primary relative z-10 font-medium">本次阅读已记录，可以继续进行下一步啦✨</p>
              {/* Bubble Tail */}
              <div className="absolute -bottom-[9px] left-[calc(50%+40px)] -translate-x-1/2 w-[18px] h-[18px] bg-white border-b border-r border-border-light/40 transform rotate-45"></div>
            </motion.div>

            <div className="w-44 h-44 relative z-10 mx-auto p-1 bg-white rounded-[24px] shadow-[0_8px_24px_rgba(45,60,68,0.08)] border border-border-light/40">
              <div className="absolute inset-0 bg-[#eebf6a]/15 rounded-full blur-3xl animate-pulse delay-150"></div>
              <img 
                src={dengTataLanternOnly} 
                alt="灯獭獭" 
                className="object-contain w-full h-full rounded-[20px] relative z-10"
              />
            </div>
          </div>

          {/* Stats Data Card */}
          <div className="w-full bg-white rounded-[24px] border border-border-light/60 shadow-[0_8px_24px_rgba(45,60,68,0.04)] p-6 relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              
              {/* Reading Time */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-12 h-12 rounded-full bg-[#FAFAFA] border border-border-light/30 flex items-center justify-center text-[#eebf6a] mb-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]">
                  <Clock size={22} strokeWidth={2} />
                </div>
                <div className="flex items-baseline gap-1 mb-0.5">
                  <span className="text-[32px] font-bold text-primary leading-none font-sans">
                    {readingTimeMinutes}
                  </span>
                  <span className="text-[13px] text-text-secondary font-medium">分钟</span>
                </div>
                <span className="text-[12px] text-text-secondary/70">阅读时长</span>
              </div>
              
              {/* Divider */}
              <div className="w-[1px] h-20 bg-gradient-to-b from-transparent via-border-light to-transparent"></div>
              
              {/* Reading Range */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-12 h-12 rounded-full bg-[#FAFAFA] border border-border-light/30 flex items-center justify-center text-accent-blue mb-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]">
                  <BookOpen size={22} strokeWidth={2} />
                </div>
                <div className="flex items-baseline gap-1 mb-0.5">
                  <span className="text-[32px] font-bold text-primary leading-none font-sans tracking-tight">
                    {startPage}-{endPage}
                  </span>
                  <span className="text-[13px] text-text-secondary font-medium">页</span>
                </div>
                <span className="text-[12px] text-text-secondary/70">阅读范围</span>
              </div>

            </div>
          </div>
        </main>
        
        {/* Fixed Bottom Action Buttons */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background via-background to-transparent pt-12 pb-8 px-5 z-40">
          <div className="w-full max-w-md mx-auto flex flex-col gap-3">
            <button 
              onClick={onViewSummary}
              className="w-full h-14 bg-primary-container rounded-full flex items-center justify-center gap-2 text-white soft-shadow hover:opacity-95 active:scale-[0.98] transition-all duration-200 text-[15px] font-medium tracking-wide"
            >
              查看总结
            </button>
            <button 
              onClick={onGenerateReadLater}
              className="w-full h-14 bg-transparent border border-border-light hover:bg-surface-container-low active:scale-[0.98] transition-all duration-200 text-text-secondary rounded-full flex items-center justify-center text-[15px] font-medium tracking-wide"
            >
              生成稍后看
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
