import React from 'react';
import { motion } from "motion/react";
import { BookOpen, Edit3, Brain, ArrowRight, RefreshCw } from "lucide-react";
import dengTataSittingNew from "../assets/images/deng_tata_sitting_new.png";
import {
  getSettledRewards,
  type RewardKind,
  type RewardSettlementRecord,
} from "../rewards/rewardSettlement";

interface RewardSummaryViewProps {
  onHome: () => void;
  settlement: RewardSettlementRecord;
}

const REWARD_PRESENTATION: Record<RewardKind, {
  label: string;
  amount: number;
  icon: typeof BookOpen;
}> = {
  reading: { label: "阅读", amount: 10, icon: BookOpen },
  summary: { label: "总结", amount: 5, icon: Edit3 },
  questions: { label: "思考", amount: 5, icon: Brain },
  action_review: { label: "行动复盘", amount: 5, icon: RefreshCw },
};

export default function RewardSummaryView({ onHome, settlement }: RewardSummaryViewProps) {
  const settledRewards = getSettledRewards(settlement);
  const earnedEnergy = settledRewards.reduce((total, kind) => total + REWARD_PRESENTATION[kind].amount, 0);

  return (
    <div className="absolute inset-0 w-full h-full bg-background flex flex-col z-[240]">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mt-16 px-5 shrink-0"
      >
        <h1 className="text-[28px] font-semibold text-primary-container tracking-tight">奖励结算</h1>
        <p className="text-[14px] text-text-secondary mt-1 font-medium">本次阅读旅程已保存</p>
      </motion.div>

      <main className="flex-1 w-full max-w-md mx-auto px-5 flex flex-col items-center overflow-y-auto no-scrollbar pb-10">
        
        {/* Hero Mascot Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, type: "spring" }}
          className="w-full flex-1 min-h-[200px] max-h-[280px] flex flex-col items-center justify-center relative mt-4 mb-6 shrink-0"
        >
          {/* Soft Radial Glow behind the card */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 bg-secondary-fixed/30 rounded-full blur-3xl opacity-50"></div>
          </div>
          
          <motion.img 
            alt="Deng Tata Mascot" 
            className="w-52 h-[152px] object-contain relative z-10" 
            src={dengTataSittingNew}
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          {/* Main Feedback Text Wrapper with Card Frame */}
          <div className="px-5 py-2 bg-[#2d3c44]/[0.03] backdrop-blur-sm rounded-full border border-black/[0.02] shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] mt-6 relative z-10 flex items-center justify-center">
            <h2 className="text-[15.5px] font-bold text-primary-container tracking-wide leading-none">
              每一页，都在给内心充电☀️
            </h2>
          </div>
        </motion.div>

        {/* Reward Statistics - Redesigned */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full shrink-0"
        >
          <div className="bg-white/80 backdrop-blur-md border border-border-light rounded-[24px] p-5 mb-5 shadow-[0_8px_24px_rgba(45,60,68,0.06)] flex justify-center items-center relative overflow-hidden">
             {/* Decorative Background for cards */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue-tint/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

             {settledRewards.map((kind, index) => {
               const reward = REWARD_PRESENTATION[kind];
               const Icon = reward.icon;

               return (
                 <React.Fragment key={kind}>
                   {index > 0 && <div className="w-px h-12 bg-surface-variant/70 relative z-10"></div>}
                   <div className="flex flex-col items-center flex-1 relative z-10 group">
                     <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform duration-300">
                       <Icon size={18} className="text-primary-container" />
                     </div>
                     <span className="text-[12px] text-text-secondary font-medium tracking-wide">{reward.label}</span>
                     <span className="text-[20px] font-bold text-[#c89d4b] mt-0.5 leading-none">+{reward.amount}</span>
                   </div>
                 </React.Fragment>
               );
             })}
          </div>
        </motion.div>

        {/* Energy Progress Bar - Redesigned */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full shrink-0"
        >
          <div className="bg-white/80 backdrop-blur-md border border-border-light rounded-[24px] p-5 mb-8 shadow-[0_8px_24px_rgba(45,60,68,0.06)] relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-tertiary-fixed/30 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
            
            <div className="flex justify-between items-end mb-4 relative z-10">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#c89d4b]"></span>
                <span className="text-[14px] text-text-secondary font-medium tracking-wide">总能量</span>
              </div>
              <span className="text-[24px] font-bold text-primary-container leading-none">{320 + earnedEnergy}</span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-2.5 relative z-10 overflow-hidden shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "75%" }}
                transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                className="bg-gradient-to-r from-[#eebf6a] to-[#c89d4b] h-full rounded-full shadow-[0_0_8px_rgba(238,191,106,0.6)]" 
              />
            </div>
          </div>
        </motion.div>

        {/* Primary Action */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="w-full mt-auto shrink-0 pb-safe-bottom"
        >
          <button 
            onClick={onHome}
            className="w-full bg-primary-container text-white flex items-center justify-center py-4 text-[16px] font-medium shadow-[0_10px_20px_rgba(45,60,68,0.15)] hover:opacity-90 transition-opacity active:scale-[0.98] rounded-full group"
          >
            回到首页
            <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

      </main>
    </div>
  );
}
