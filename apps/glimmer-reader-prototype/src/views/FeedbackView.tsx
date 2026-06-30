import React, { useState } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Lightbulb, Brain, Sparkles, Loader2, CheckCircle2, ArrowRight, Quote, Star } from "lucide-react";
import dengTataDancing from "../assets/images/deng_tata_dancing.png";
import type { AiRequestState } from "../ai/aiRequestState";
import type { AnswerFeedbackResponse } from "../api/answerFeedback";

interface FeedbackViewProps {
  onSave: () => void;
  onSkip: () => void;
  onClose: () => void;
  requestState: AiRequestState<AnswerFeedbackResponse>;
}

const STARS_PARTICLES = [
  { id: 1, angle: 0, distance: 110, delay: 0.32, size: 14, color: "text-amber-400" },
  { id: 2, angle: 45, distance: 120, delay: 0.37, size: 18, color: "text-blue-400" },
  { id: 3, angle: 90, distance: 105, delay: 0.27, size: 12, color: "text-amber-300" },
  { id: 4, angle: 135, distance: 115, delay: 0.42, size: 16, color: "text-indigo-400" },
  { id: 5, angle: 180, distance: 110, delay: 0.34, size: 14, color: "text-amber-400" },
  { id: 6, angle: 225, distance: 125, delay: 0.30, size: 20, color: "text-blue-300" },
  { id: 7, angle: 270, distance: 100, delay: 0.40, size: 12, color: "text-pink-400" },
  { id: 8, angle: 315, distance: 120, delay: 0.44, size: 16, color: "text-amber-300" },
];

const FLOATING_BACKGROUND_STARS = [
  { id: 1, top: "2%", left: "15%", size: 16, color: "text-amber-400/80", duration: 3.2, delay: 0 },
  { id: 2, top: "8%", right: "18%", size: 12, color: "text-blue-400/70", duration: 3.6, delay: 0.5 },
  { id: 3, top: "22%", left: "8%", size: 10, color: "text-purple-400/60", duration: 2.8, delay: 0.2 },
  { id: 4, top: "28%", right: "10%", size: 14, color: "text-amber-300/70", duration: 3.4, delay: 0.4 },
  { id: 5, top: "38%", left: "22%", size: 12, color: "text-blue-300/60", duration: 4.2, delay: 0.1 },
  { id: 6, top: "42%", right: "24%", size: 15, color: "text-purple-300/70", duration: 3.8, delay: 0.7 },
  { id: 7, top: "1%", right: "44%", size: 11, color: "text-amber-400/60", duration: 3.0, delay: 0.3 },
  { id: 8, top: "15%", left: "30%", size: 13, color: "text-pink-300/50", duration: 3.5, delay: 0.8 },
  { id: 9, top: "30%", left: "45%", size: 9, color: "text-amber-400/50", duration: 2.5, delay: 0.6 },
  { id: 10, top: "25%", right: "32%", size: 11, color: "text-pink-400/60", duration: 3.1, delay: 0.9 },
  { id: 11, top: "35%", left: "5%", size: 13, color: "text-blue-400/50", duration: 4.0, delay: 0.4 },
  { id: 12, top: "12%", left: "50%", size: 10, color: "text-amber-300/60", duration: 2.9, delay: 0.2 }
];

export default function FeedbackView({ onSave, onSkip, onClose, requestState }: FeedbackViewProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const feedback = requestState.data?.feedback;
  const isFeedbackLoading = requestState.status === "loading";

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => {
        onSave();
      }, 1500);
    }, 1500);
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-[#f8f9fa] flex flex-col z-[230] overflow-hidden pt-[44px]">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[30%] bg-blue-100/40 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[40%] bg-amber-100/30 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* Top Navigation */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between px-5 h-14 shrink-0 relative z-10">
        <button 
          onClick={onClose}
          aria-label="返回" 
          className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-black/5 active:scale-95 transition-all text-[#2d3c44] cursor-pointer"
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
        <div className="w-10 h-10"></div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full max-w-md mx-auto px-5 pt-4 pb-8 flex flex-col overflow-y-auto no-scrollbar relative z-10">
        
        {/* Top Spacer to push content down slightly (minimized height to move content up) */}
        <div className="h-1 shrink-0"></div>

        {/* Hero / Mascot Section */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center gap-4 relative"
        >
          {/* Floating Background Stars (approx. 9 stars) */}
          {FLOATING_BACKGROUND_STARS.map((star) => (
            <motion.div 
              key={star.id}
              animate={{ 
                y: [0, star.id % 2 === 0 ? 8 : -8, 0], 
                opacity: [0.4, 0.9, 0.4] 
              }}
              transition={{ 
                duration: star.duration, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: star.delay 
              }}
              className={`absolute ${star.color}`}
              style={{
                top: star.top,
                ...(star.left ? { left: star.left } : { right: star.right }),
              }}
            >
              <Star size={star.size} fill="currentColor" opacity={0.6} />
            </motion.div>
          ))}
                 {/* Resized Mascot container to w-[220px] h-[220px] and mt/mb reduced to pull it up */}
          <div className="relative w-[220px] h-[220px] mb-1 flex items-center justify-center mt-2">
            {/* Pulsing glow background */}
            <div className="absolute inset-0 bg-blue-100/40 rounded-full opacity-60 blur-3xl animate-pulse"></div>
            
            {/* Combined Floating Container (Syncs mascot and speech bubble) */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-full h-full relative flex items-center justify-center"
            >
              {/* Speech Bubble above the mascot (resized and scaled smaller) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 15, x: "-50%" }}
                animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
                transition={{ type: "spring", stiffness: 260, damping: 15, delay: 0.4 }}
                className="absolute bottom-[88%] left-1/2 bg-white/60 backdrop-blur-xl px-4 py-1.5 rounded-[14px] shadow-[0_8px_24px_rgba(45,60,68,0.08),_inset_0_1.5px_2px_rgba(255,255,255,0.9)] border border-white/80 z-30 select-none pointer-events-none whitespace-nowrap"
              >
                <span className="text-[16px] font-bold text-[#2d3c44] tracking-wide flex items-center gap-1">
                  耶！✌️
                </span>
                {/* Bubble Tip */}
                <div className="absolute -bottom-1.2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white/60 backdrop-blur-xl rotate-45 border-r border-b border-white/80 shadow-[1px_1px_2px_rgba(0,0,0,0.01)]"></div>
              </motion.div>

              {/* Pop entry wrapper for mascot */}
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.15 }}
                className="w-full h-full relative flex items-center justify-center"
              >
                {/* Mascot image - enlarged slightly inside container (w-[95%] h-[95%]) */}
                <img 
                  alt="Deng Tata Mascot" 
                  className="w-[95%] h-[95%] object-contain relative z-10 drop-shadow-sm" 
                  src={dengTataDancing}
                />
              </motion.div>
            </motion.div>
          </div>

            {/* Exploding Stars Particle System (stays fixed relative to center) */}
            {STARS_PARTICLES.map((p) => {
              const rad = (p.angle * Math.PI) / 180;
              const targetX = Math.cos(rad) * p.distance;
              const targetY = Math.sin(rad) * p.distance;
              return (
                <motion.div
                  key={p.id}
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 ${p.color}`}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
                  animate={{
                    opacity: [0, 1, 0.9, 0],
                    scale: [0, 1.4, 1.1, 0],
                    x: targetX,
                    y: targetY,
                    rotate: p.angle % 2 === 0 ? 360 : -360,
                  }}
                  transition={{
                    duration: 1.1,
                    ease: [0.16, 1, 0.3, 1], // easeOutExpo
                    delay: p.delay,
                  }}
                >
                  <Star size={p.size} fill="currentColor" />
                </motion.div>
              );
            })}
                {/* Redesigned sub-title with delicate translucent capsule shape */}
          <div className="px-6 py-2 bg-[#2d3c44]/[0.03] backdrop-blur-sm rounded-full border border-black/[0.02] max-w-[90%] mx-auto mt-1 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] z-10">
            <p className="text-[13.5px] font-medium text-[#5a6a72] leading-relaxed text-left">
              {isFeedbackLoading
                ? "灯獭獭正在轻轻整理你的想法..."
                : feedback?.gentleClosing || requestState.message || "你的回答已经保存，今天的思考会被好好记住。"}
            </p>
          </div>
        </motion.section>

                        {/* Redesigned Premium Feedback Card */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, type: "spring", bounce: 0.3 }}
          className="bg-white/95 backdrop-blur-sm rounded-[26px] px-5 pt-5 pb-5.5 h-[285px] overflow-y-auto no-scrollbar shadow-[0_12px_38px_rgba(45,60,68,0.06),_0_2px_4px_rgba(45,60,68,0.02)] flex flex-col gap-3.5 relative mt-3 border border-white/80 ring-1 ring-black/[0.02]"
        >
          <div className="flex items-center gap-2.5 relative z-10">
            <motion.div 
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-amber-50 to-orange-50/80 flex items-center justify-center border border-amber-100/30"
            >
              <Lightbulb size={17} className="text-amber-500" fill="currentColor" fillOpacity={0.1} />
            </motion.div>
            <h3 className="text-[16.5px] font-extrabold text-[#2d3c44] tracking-wide">行动指南</h3>
          </div>
          
          <div className="relative z-10 pl-0.5">
            <p className="text-[14.2px] text-[#2d3c44] leading-relaxed font-bold tracking-wide">
              {isFeedbackLoading
                ? "稍等一下，不用重新填写刚才的回答。"
                : feedback?.actionRecordCandidate || "你可以先保留今天写下的理解，明天再决定要不要做一个小尝试。"}
            </p>
          </div>

          {!isFeedbackLoading && feedback?.acknowledgedPoints.map((point) => (
            <p key={point} className="relative z-10 text-[12.8px] leading-relaxed text-[#5a6a72]">
              {point}
            </p>
          ))}
          
          {/* Flex spacer to push the tips box to the bottom and fill the container */}
          <div className="flex-1"></div>

          <div className="relative z-10 bg-[#FDF9F3] border border-[#FBEEDC]/60 rounded-[15px] py-3 px-3.5 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-[0_1.5px_4px_rgba(221,176,92,0.18)] shrink-0 mt-0.5">
              <Sparkles size={11} className="text-[#DDB05C] animate-pulse" />
            </div>
            <div className="text-[12.5px] text-[#7c6947] leading-relaxed font-medium">
              <span className="font-bold mr-1">小tips:</span>
              {isFeedbackLoading
                ? "你的回答会保留在这里，反馈生成不会影响已经完成的问题奖励。"
                : feedback?.canAddOneThing || "反馈暂时没生成好，但你的回答已经保存，可以稍后再看。"}
            </div>
          </div>
        </motion.section>
 
        {/* Spacer before actions */}
        <div className="flex-1 min-h-[45px]"></div>
      </main>

      {/* Action Section fixed at the bottom */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="absolute bottom-0 left-0 w-full z-50 bg-gradient-to-t from-[#f8f9fa] via-[#f8f9fa]/90 to-transparent pt-12 pb-safe-bottom px-5 flex justify-center items-end pointer-events-none"
      >
        <div className="w-full max-w-md pb-6 mt-4 pointer-events-auto">
          <button 
            onClick={handleSave}
            disabled={isSaving || isSaved || isFeedbackLoading}
            className={`w-full bg-[#2d3c44] text-white rounded-[24px] py-[16px] flex items-center justify-center shadow-[0_8px_20px_rgba(45,60,68,0.15)] group transition-all duration-300 ${
              isSaved 
                ? 'bg-emerald-500 text-white' 
                : 'bg-[#2d3c44] hover:opacity-90 active:scale-[0.98] text-white'
            }`}
          >
            <AnimatePresence mode="wait">
              {isSaving ? (
                <motion.div 
                  key="saving"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center"
                >
                  <Loader2 size={18} className="animate-spin mr-2" />
                  <span className="text-[16px] font-medium tracking-wide">保存中...</span>
                </motion.div>
              ) : isSaved ? (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center"
                >
                  <CheckCircle2 size={18} className="mr-2" />
                  <span className="text-[16px] font-medium tracking-wide">已存为明日微尝试</span>
                </motion.div>
              ) : (
                <motion.div
                  key="default"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center"
                >
                  <span className="text-[16px] font-medium tracking-wide">存为明日微尝试</span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
