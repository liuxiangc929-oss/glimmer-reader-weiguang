import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, ChevronUp, ChevronDown, Sparkles, X } from "lucide-react";
import { Book } from "../data/books";
import BookCover from "../components/BookCover";

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

interface ConfirmRangeViewProps {
  onBack: () => void;
  onConfirm: (startPage: number, endPage: number) => void;
  activeBook: Book;
  initialStartPage?: number;
  initialEndPage?: number;
  totalPages?: number;
  pages?: CompiledPage[];
}

const AnimatedNumber = ({ value, direction, className = "" }: { value: string | number, direction: number, className?: string }) => {
  const numberVariants = {
    initial: (dir: number) => ({ y: dir * 15, opacity: 0 }),
    animate: { y: 0, opacity: 1 },
    exit: (dir: number) => ({ y: dir * -15, opacity: 0 }),
  };

  return (
    <span className={`relative inline-flex items-center justify-center ${className}`}>
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.span
          key={value}
          custom={direction}
          variants={numberVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.25, type: "spring", bounce: 0 }}
          className="absolute"
        >
          {value}
        </motion.span>
      </AnimatePresence>
      <span className="invisible">{value}</span>
    </span>
  );
};

export default function ConfirmRangeView({ 
  onBack, 
  onConfirm, 
  activeBook,
  initialStartPage = 45,
  initialEndPage = 60,
  totalPages = 100,
  pages = []
}: ConfirmRangeViewProps) {
  const [startPage, setStartPage] = useState<number>(initialStartPage);
  const [endPage, setEndPage] = useState<number>(initialEndPage);
  const [startDir, setStartDir] = useState<number>(1);
  const [endDir, setEndDir] = useState<number>(1);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [startParagraphIndex, setStartParagraphIndex] = useState<number>(0);
  const [endParagraphIndex, setEndParagraphIndex] = useState<number>(-1);
  const [isStartParagraphModalOpen, setIsStartParagraphModalOpen] = useState(false);
  const [isEndParagraphModalOpen, setIsEndParagraphModalOpen] = useState(false);

  useEffect(() => {
    setStartParagraphIndex(0);
  }, [startPage]);

  useEffect(() => {
    const endPageParas = pages[endPage - 1]?.paragraphs;
    if (endPageParas && endPageParas.length > 0) {
      setEndParagraphIndex(endPageParas.length - 1);
    } else {
      setEndParagraphIndex(0);
    }
  }, [endPage, pages]);

  const handleIncrementStart = () => {
    if (startPage < endPage - 1) {
      setStartDir(1);
      setStartPage(prev => prev + 1);
    }
  };

  const handleDecrementStart = () => {
    if (startPage > 1) {
      setStartDir(-1);
      setStartPage(prev => prev - 1);
    }
  };

  const handleIncrementEnd = () => {
    if (endPage < totalPages) {
      setEndDir(1);
      setEndPage(prev => prev + 1);
    }
  };

  const handleDecrementEnd = () => {
    if (endPage > startPage + 1) {
      setEndDir(-1);
      setEndPage(prev => prev - 1);
    }
  };

  const handleConfirmClick = () => {
    const pagesCount = endPage - startPage + 1;
    if (pagesCount < 3) {
      setValidationError("选择的阅读范围需要至少包含3页");
      setTimeout(() => setValidationError(null), 2500);
      return;
    }
    onConfirm(startPage, endPage);
  };

  // Calculate dynamic progress % matching the selected endPage exactly
  const calculatedProgress = Math.min(100, Math.max(0, Math.round((endPage / totalPages) * 100)));

  return (
    <div className="w-full h-full bg-background text-on-background relative flex flex-col pt-[54px] select-none overflow-hidden pb-4">
      {/* Top Bar matching original provided HTML header design */}
      <header className="w-full z-40 bg-background pb-2">
        <div className="flex items-center px-5 h-16 w-full max-w-md mx-auto justify-between">
          <button 
            aria-label="返回" 
            className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-surface-variant/50 active:scale-95 transition-all text-primary cursor-pointer" 
            onClick={onBack}
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          
          <h1 className="text-[18px] font-semibold text-primary flex-1 text-center tracking-tight">
            确认阅读范围
          </h1>

          <div className="w-10"></div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-md mx-auto px-5 pt-4 flex-grow flex flex-col gap-4 relative z-10 overflow-y-auto no-scrollbar">
        
        {/* Book Info Card with glassmorphism / light touch */}
        <div className="bg-surface-card rounded-[24px] p-4 border border-border-light flex gap-4 items-center shadow-[0_10px_30px_rgba(45,60,68,0.04)]">
          <div className="w-[60px] h-[84px] rounded-lg overflow-hidden shrink-0 bg-surface-container shadow-[0_4px_10px_rgba(0,0,0,0.06)] relative border-none">
            <BookCover type={activeBook.coverType} title={activeBook.title} />
            {/* Elegant book spine effect */}
            <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-r from-black/[0.08] to-transparent pointer-events-none" />
            <div className="absolute inset-0 border border-black/[0.02] rounded-lg pointer-events-none" />
          </div>
          
          <div className="flex flex-col gap-1 overflow-hidden flex-1">
            <h3 className="text-[16px] font-semibold text-primary truncate">
              {activeBook.title}
            </h3>
            
            <p className="text-[12px] text-text-secondary">
              {activeBook.author}
            </p>

            <div className="flex items-center gap-3 w-full mt-2">
              <div className="flex-1 h-[6px] bg-surface-container-highest rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-container rounded-full transition-all duration-500" 
                  style={{ width: `${calculatedProgress}%` }} 
                />
              </div>
              <span className="text-[11px] font-semibold text-text-secondary shrink-0">
                {calculatedProgress}%
              </span>
            </div>
          </div>
        </div>

        {/* Range Picker Area */}
        <section className="flex flex-col gap-4 items-center justify-center relative mt-0">
          <div className="flex w-full justify-between items-center relative z-10 px-2">
            
            {/* Start Page Picker Container */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <span className="text-[12px] font-semibold text-text-secondary tracking-wider">起始页</span>
              
              <div className="bg-surface-card w-24 h-[116px] rounded-2xl border border-border-light shadow-[0_8px_24px_rgba(45,60,68,0.03)] relative overflow-hidden flex flex-col justify-between p-2 items-center">
                {/* Decrement Button / Prev Page show */}
                <button 
                  onClick={handleDecrementStart}
                  disabled={startPage <= 1}
                  className="w-full text-center text-zinc-400 disabled:opacity-20 hover:text-primary transition-colors flex flex-col items-center group cursor-pointer"
                >
                  <ChevronUp size={14} className="group-hover:translate-y-[-1px] transition-transform mb-0.5" />
                  <AnimatedNumber 
                    value={startPage > 1 ? startPage - 1 : "-"} 
                    direction={startDir} 
                    className="text-[12px] font-medium opacity-40 select-none"
                  />
                </button>

                {/* Selected Center Value */}
                <div className="h-10 flex items-center justify-center relative">
                  <AnimatedNumber 
                    value={startPage} 
                    direction={startDir} 
                    className="text-[26px] font-bold text-primary tracking-tight"
                  />
                </div>

                {/* Increment Button / Next Page show */}
                <button 
                  onClick={handleIncrementStart}
                  disabled={startPage >= endPage - 1}
                  className="w-full text-center text-zinc-400 disabled:opacity-20 hover:text-primary transition-colors flex flex-col items-center group cursor-pointer"
                >
                  <AnimatedNumber 
                    value={startPage < endPage - 1 ? startPage + 1 : "-"} 
                    direction={startDir} 
                    className="text-[12px] font-medium opacity-40 select-none"
                  />
                  <ChevronDown size={14} className="group-hover:translate-y-[1px] transition-transform mt-0.5" />
                </button>

                {/* Middle line marker (purely cosmetic) */}
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-accent-blue-tint/25 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Connecting Arrow Indicator */}
            <div className="flex items-center justify-center px-1">
              <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center animate-pulse">
                <ArrowRight className="text-text-secondary" size={16} />
              </div>
            </div>

            {/* End Page Picker Container */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <span className="text-[12px] font-semibold text-text-secondary tracking-wider">结束页</span>
              
              <div className="bg-surface-card w-24 h-[116px] rounded-2xl border border-border-light shadow-[0_8px_24px_rgba(45,60,68,0.03)] relative overflow-hidden flex flex-col justify-between p-2 items-center">
                {/* Decrement Button / Prev Page show */}
                <button 
                  onClick={handleDecrementEnd}
                  disabled={endPage <= startPage + 1}
                  className="w-full text-center text-zinc-400 disabled:opacity-20 hover:text-primary transition-colors flex flex-col items-center group cursor-pointer"
                >
                  <ChevronUp size={14} className="group-hover:translate-y-[-1px] transition-transform mb-0.5" />
                  <AnimatedNumber 
                    value={endPage > startPage + 1 ? endPage - 1 : "-"} 
                    direction={endDir} 
                    className="text-[12px] font-medium opacity-40 select-none"
                  />
                </button>

                {/* Selected Center Value */}
                <div className="h-10 flex items-center justify-center relative">
                  <AnimatedNumber 
                    value={endPage} 
                    direction={endDir} 
                    className="text-[26px] font-bold text-primary tracking-tight"
                  />
                </div>

                {/* Increment Button / Next Page show */}
                <button 
                  onClick={handleIncrementEnd}
                  disabled={endPage >= totalPages}
                  className="w-full text-center text-zinc-400 disabled:opacity-20 hover:text-primary transition-colors flex flex-col items-center group cursor-pointer"
                >
                  <AnimatedNumber 
                    value={endPage < totalPages ? endPage + 1 : "-"} 
                    direction={endDir} 
                    className="text-[12px] font-medium opacity-40 select-none"
                  />
                  <ChevronDown size={14} className="group-hover:translate-y-[1px] transition-transform mt-0.5" />
                </button>

                {/* Middle line marker (purely cosmetic) */}
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-accent-blue-tint/25 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

          </div>

          <div className="flex w-full justify-between items-center relative z-10 px-2 mt-3 -top-1">
            <div className="flex-1 flex flex-col items-center">
              <button 
                onClick={() => setIsStartParagraphModalOpen(true)}
                className="w-28 py-[9px] bg-white border border-border-light/80 shadow-[0_2px_12px_rgba(45,60,68,0.04)] hover:shadow-[0_4px_16px_rgba(45,60,68,0.08)] rounded-full text-primary hover:text-accent-blue text-[11.5px] font-medium transition-all active:scale-95"
              >
                起始段落选择
              </button>
            </div>
            
            <div className="flex items-center justify-center px-1">
              <div className="w-8 h-8 opacity-0"></div>
            </div>

            <div className="flex-1 flex flex-col items-center">
              <button 
                onClick={() => setIsEndParagraphModalOpen(true)}
                className="w-28 py-[9px] bg-white border border-border-light/80 shadow-[0_2px_12px_rgba(45,60,68,0.04)] hover:shadow-[0_4px_16px_rgba(45,60,68,0.08)] rounded-full text-primary hover:text-accent-blue text-[11.5px] font-medium transition-all active:scale-95"
              >
                结束段落选择
              </button>
            </div>
          </div>
        </section>

        {/* Text Preview Area */}
        <section className="px-6 mt-4 w-full max-w-md mx-auto relative z-10 flex-1 flex flex-col pb-4">
          <div className="bg-surface-card w-full rounded-[24px] border border-border-light shadow-[0_4px_16px_rgba(45,60,68,0.03)] p-6 relative overflow-hidden flex flex-col justify-between flex-1 min-h-[180px]">
            <div className="text-[13px] text-primary/80 leading-[1.8] font-medium text-justify">
              {(pages[startPage - 1]?.paragraphs[startParagraphIndex]?.text || "").substring(0, 24)}
              <span className="text-primary/40 ml-0.5 font-normal">...</span>
            </div>
            
            {/* Blurry gradient middle */}
            <div className="absolute inset-x-0 top-[38%] bottom-[38%] bg-gradient-to-b from-surface-card/0 via-surface-card/95 to-surface-card/0 flex items-center justify-center backdrop-blur-[1.5px] z-10">
              <span className="text-[12px] text-text-secondary/40 tracking-[0.2em] font-mono">.......</span>
            </div>

            <div className="mt-auto text-[13px] text-primary/80 leading-[1.8] font-medium text-justify">
              <span className="text-primary/40 mr-0.5 font-normal">...</span>
              {(pages[endPage - 1]?.paragraphs[endParagraphIndex]?.text || "").slice(-24)}
            </div>
          </div>
        </section>
      </main>

      {/* Confirm Action Button */}
      <div className="w-full bg-gradient-to-t from-background via-background to-transparent pb-6 pt-4 px-7 mt-auto z-40 max-w-md mx-auto">
        <button 
          onClick={handleConfirmClick}
          className="w-full h-13 bg-primary-container text-on-primary rounded-full flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(45,60,68,0.15)] hover:bg-[#1a252d] active:scale-98 transition-all duration-200 cursor-pointer text-[14px] font-medium tracking-wide"
        >
          确认范围
        </button>
      </div>

      {/* Toast Alert */}
      <AnimatePresence>
        {validationError && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[200] pointer-events-none bg-zinc-900/95 text-white border border-white/10 px-4 py-2.5 rounded-xl shadow-xl min-w-[220px] text-center text-[12px]"
          >
            {validationError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Blur Background Graphics */}
      <div className="absolute top-20 right-0 w-48 h-48 bg-accent-blue-tint/30 rounded-full blur-[60px] pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-0 w-36 h-36 bg-surface-variant/20 rounded-full blur-[50px] pointer-events-none -z-10" />

      {/* Modal for Start Paragraph Selection */}
      <AnimatePresence>
        {isStartParagraphModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100]"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsStartParagraphModalOpen(false)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 w-full h-[75%] bg-surface-card rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden"
            >
              <div className="w-full flex justify-center py-3 shrink-0">
                <div className="w-10 h-1 bg-border-light rounded-full" />
              </div>
              <div className="px-6 py-2 shrink-0 flex justify-between items-center">
                <h3 className="text-[18px] font-semibold text-primary">选择起始段落</h3>
                <button onClick={() => setIsStartParagraphModalOpen(false)} className="p-2 -mr-2 text-text-secondary hover:text-primary">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-20 mt-2 space-y-4 pr-3 mr-2">
                {(pages[startPage - 1]?.paragraphs || []).map((p, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => { setStartParagraphIndex(idx); setIsStartParagraphModalOpen(false); }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      startParagraphIndex === idx 
                        ? "border-primary bg-primary/5 shadow-sm" 
                        : "border-border-light bg-surface hover:bg-surface-container/50"
                    }`}
                  >
                    <p className="text-[14px] leading-relaxed text-primary/90">{p.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal for End Paragraph Selection */}
      <AnimatePresence>
        {isEndParagraphModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100]"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEndParagraphModalOpen(false)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 w-full h-[75%] bg-surface-card rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden"
            >
              <div className="w-full flex justify-center py-3 shrink-0">
                <div className="w-10 h-1 bg-border-light rounded-full" />
              </div>
              <div className="px-6 py-2 shrink-0 flex justify-between items-center">
                <h3 className="text-[18px] font-semibold text-primary">选择结束段落</h3>
                <button onClick={() => setIsEndParagraphModalOpen(false)} className="p-2 -mr-2 text-text-secondary hover:text-primary">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-20 mt-2 space-y-4 pr-3 mr-2">
                {(pages[endPage - 1]?.paragraphs || []).map((p, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => { setEndParagraphIndex(idx); setIsEndParagraphModalOpen(false); }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      endParagraphIndex === idx 
                        ? "border-primary bg-primary/5 shadow-sm" 
                        : "border-border-light bg-surface hover:bg-surface-container/50"
                    }`}
                  >
                    <p className="text-[14px] leading-relaxed text-primary/90">{p.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
