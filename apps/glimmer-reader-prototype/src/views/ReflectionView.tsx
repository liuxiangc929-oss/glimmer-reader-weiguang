import React, { useState } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Quote } from "lucide-react";
import dengTataLying from "../assets/images/deng_tata_lying.png";

interface ReflectionViewProps {
  onClose: () => void;
  onComplete: () => void;
}

export default function ReflectionView({ onClose, onComplete }: ReflectionViewProps) {
  const [reflectionText, setReflectionText] = useState("");
  const [showSkipModal, setShowSkipModal] = useState(false);

  return (
    <div className="absolute inset-0 w-full h-full bg-background flex flex-col z-[200]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 w-full h-full flex flex-col pt-[60px] pb-[160px] overflow-y-auto no-scrollbar relative"
      >
        {/* Top AppBar */}
        <header className="flex items-center justify-between px-5 h-14 w-full shrink-0">
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-surface-variant/50 active:scale-95 transition-all text-primary cursor-pointer"
            aria-label="返回"
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <h1 className="text-lg font-semibold text-primary" translate="no">微尝试回顾</h1>
          <div className="w-10 h-10 -mr-2"></div> {/* Spacer for centering */}
        </header>

        {/* Main Content */}
        <main className="flex-1 px-5 flex flex-col items-center justify-center max-w-md mx-auto w-full">
          {/* Mascot Hero Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, type: "spring" }}
            className="mb-1 flex flex-col items-center relative"
          >
            {/* Speech Bubble */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="bg-white px-5 py-3 rounded-[20px] shadow-[0_8px_16px_rgba(45,60,68,0.06)] border border-border-light/40 relative mb-2"
            >
              <p className="text-[14px] text-primary relative z-10 font-medium">回顾这次小尝试，记录下你的感受吧~</p>
              {/* Bubble Tail */}
              <div className="absolute -bottom-[9px] left-[32%] -translate-x-1/2 w-[18px] h-[18px] bg-white border-b border-r border-border-light/40 transform rotate-45"></div>
            </motion.div>

            <div className="w-52 h-52 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-tertiary-fixed/20 rounded-[24px] blur-3xl animate-pulse delay-150"></div>
              <img 
                alt="灯獭獭" 
                className="w-[105%] h-[105%] object-contain relative z-10 drop-shadow-md" 
                src={dengTataLying}
              />
            </div>
          </motion.div>

          {/* Yesterday's Action Quote Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="w-full bg-surface-card rounded-[24px] p-6 mb-3 shadow-[0_12px_24px_rgba(45,60,68,0.03)] border border-border-light/60 relative overflow-hidden flex flex-col items-center"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-container"></div>
            <Quote size={24} className="text-primary-container/20 absolute top-4 left-4" />
            <p className="text-[15px] text-primary leading-relaxed text-center font-medium mt-1 relative z-10 px-4">
              “在明天的生活中尝试把这个思考应用到一件微不足道的小事中”
            </p>
          </motion.div>

          {/* Reflection Input */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="w-full flex-1 flex flex-col relative"
          >
             {/* Textarea wrapped for styling */}
            <div className="w-full flex-1 bg-[#FAFAFA] rounded-[24px] p-1 border border-border-light/50 shadow-[inset_0_4px_16px_rgba(0,0,0,0.08)] relative focus-within:ring-1 focus-within:ring-[#eebf6a]/50 focus-within:border-[#eebf6a] transition-all duration-300">
               <div className="absolute inset-0 pointer-events-none rounded-[24px] overflow-hidden">
                 {/* Lined paper effect */}
                 <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(transparent 95%, #E5E7EB 95%)', backgroundSize: '100% 28px', opacity: 0.5, marginTop: '14px' }}></div>
               </div>
               
              <textarea 
                className="w-full h-full min-h-[140px] bg-transparent text-on-surface p-4 border-none focus:outline-none focus:ring-0 placeholder:text-outline-variant resize-none text-[15px] leading-[28px] relative z-10" 
                placeholder="写下你执行的感受..."
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                style={{ caretColor: '#eebf6a' }}
              />
            </div>
          </motion.div>
        </main>
      </motion.div>

      {/* Fixed Bottom Actions Area, moved up */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute bottom-6 left-0 w-full z-[80] px-5 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]"
      >
        <div className="w-full max-w-md flex flex-col gap-3 pointer-events-auto">
          {/* Primary Action */}
          <button 
            onClick={onComplete}
            className="w-full bg-primary-container text-white py-[14px] flex items-center justify-center shadow-[0_10px_20px_rgba(45,60,68,0.15)] hover:bg-primary transition-all duration-200 rounded-full"
          >
            <span className="text-[16px] font-medium tracking-wide">已尝试</span>
          </button>
          
          {/* Secondary/Skip Action */}
          <button 
            onClick={() => setShowSkipModal(true)}
            className="w-full py-[12px] bg-white border border-border-light shadow-sm text-text-secondary hover:text-primary transition-colors flex items-center justify-center rounded-full"
          >
            <span className="text-[15px] font-medium tracking-wide">跳过此次尝试</span>
          </button>
        </div>
      </motion.div>

      {/* Skip Confirmation Modal */}
      <AnimatePresence>
        {showSkipModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
              onClick={() => setShowSkipModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="bg-surface-card w-full max-w-[320px] rounded-[24px] p-6 shadow-2xl relative z-10 flex flex-col items-center text-center"
            >
              <h3 className="text-[20px] font-semibold text-on-surface mb-3">没关系，慢慢来</h3>
              <p className="text-[14px] text-text-secondary mb-8 leading-relaxed px-2">
                休息也是为了更好的前行。<br/>今天就暂时跳过这个小行动吗？
              </p>
              <div className="w-full flex gap-3">
                <button 
                  onClick={() => setShowSkipModal(false)}
                  className="flex-1 py-3 rounded-full border border-border-light text-on-surface-variant hover:bg-surface-container-low transition-colors text-[14px] font-medium"
                >
                  再想想
                </button>
                <button 
                  onClick={() => {
                    setShowSkipModal(false);
                    onComplete();
                  }}
                  className="flex-1 py-3 rounded-full bg-surface-container-highest text-on-surface hover:bg-surface-variant transition-colors text-[14px] font-medium"
                >
                  确认跳过
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
