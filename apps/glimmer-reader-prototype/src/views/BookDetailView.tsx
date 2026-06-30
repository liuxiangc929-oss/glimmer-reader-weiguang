import { useState } from "react";
import { ArrowLeft, Quote, ChevronDown, ChevronUp, Brain } from "lucide-react";
import { motion } from "motion/react";
import BookCover from "../components/BookCover";
import { Book } from "../data/books";

interface BookDetailViewProps {
  onClose: () => void;
  activeBook: Book;
}

export default function BookDetailView({ onClose, activeBook }: BookDetailViewProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Dynamic progress-bar theme color
  const getThemeColor = (type: string) => {
    switch (type) {
      case "attention":
        return "#4A6070";
      case "guarding":
        return "#E4A865";
      case "pause":
        return "#87959A";
      default:
        return "#4A6070";
    }
  };

  const themeColor = getThemeColor(activeBook.coverType);

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col z-[210] bg-background overflow-hidden pt-[44px]">
      {/* Top Navigation */}
      <header className="flex items-center justify-between px-5 h-14 shrink-0 w-full max-w-md mx-auto relative z-40 bg-background">
        <button 
          onClick={onClose}
          aria-label="返回" 
          className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-black/5 active:scale-95 transition-all text-primary cursor-pointer"
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
        <h1 className="text-[17px] font-bold text-primary absolute left-1/2 -translate-x-1/2">微光伴读</h1>
        <div className="w-10 h-10"></div>
      </header>

      <div className="flex-1 w-full overflow-y-auto no-scrollbar">
        <main className="w-full max-w-md mx-auto flex-1 px-5 pt-4 pb-[100px] flex flex-col">
          {/* Book Cover & Author Section */}
          <section className="flex flex-col items-center mb-8 relative">
        {/* Ambient Glow behind book */}
        <div className="absolute top-10 w-48 h-64 bg-accent-blue-tint rounded-full blur-3xl opacity-60 -z-10"></div>
        <div className="w-40 h-56 rounded-lg overflow-hidden shadow-[0_20px_40px_rgba(45,60,68,0.35)] mb-4 relative border border-border-light/40 bg-surface-card transition-transform duration-500 hover:scale-105">
          <BookCover 
            type={activeBook.coverType} 
            title={activeBook.title} 
            progress={activeBook.progress}
          />
        </div>
        <h2 className="text-[28px] font-semibold text-primary text-center mb-1 leading-tight">{activeBook.title}</h2>
        <p className="text-[14px] text-text-secondary text-center mb-1.5">{activeBook.author}</p>
        
        <div className="flex items-center gap-2 mt-2 text-[12px] text-text-secondary bg-surface-card/90 backdrop-blur-sm shadow-sm px-4 py-1.5 rounded-full border border-border-light/60">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: themeColor }} />
          <span className="font-semibold text-primary leading-none">已读 {activeBook.progress}%</span>
        </div>
      </section>

      {/* Introduction Card */}
      <section className="mb-8">
        <div className="bg-surface-card rounded-[24px] p-5 shadow-[0_10px_30px_-10px_rgba(45,60,68,0.08)] border border-border-light/50 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary-container/25 group-hover:bg-primary-container/45 transition-colors"></div>
          <div className="flex items-start gap-2.5 mb-3">
            <Quote size={20} className="text-on-primary-container fill-on-primary-container shrink-0 mt-0.5" />
            <h3 className="text-[16px] text-primary font-medium">书籍简介</h3>
          </div>
          
          <motion.div 
            layout
            className="text-[14px] text-on-surface-variant leading-relaxed px-1 transition-all duration-300"
          >
            {isExpanded ? (
              activeBook.introduction
            ) : (
              <span>
                {activeBook.introduction.length > 120 
                  ? `${activeBook.introduction.slice(0, 115)}...` 
                  : activeBook.introduction}
              </span>
            )}
          </motion.div>

          <div className="mt-4 px-1 flex justify-end">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[12px] font-medium text-[#4A6070] hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
            >
              {isExpanded ? (
                <>
                  收起 <ChevronUp size={14} className="mt-0.5" />
                </>
              ) : (
                <>
                  阅读更多 <ChevronDown size={14} className="mt-0.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Reading Journey Status Cards */}
      <section className="mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-card rounded-[24px] p-5 shadow-[0_10px_30px_-10px_rgba(45,60,68,0.08)] border border-border-light/50 flex flex-col justify-between aspect-square">
            <div className="w-10 h-10 rounded-full bg-accent-blue-tint flex items-center justify-center mb-4">
              <Brain size={20} className="text-primary-container" />
            </div>
            <div>
              <div className="text-[20px] font-semibold text-primary mb-1">
                {activeBook.coverType === "attention" ? "3" : activeBook.coverType === "guarding" ? "2" : "1"} 个
              </div>
              <div className="text-[12px] text-text-secondary">总结</div>
            </div>
          </div>
        </div>
      </section>
        </main>
      </div>
    </div>
  );
}
