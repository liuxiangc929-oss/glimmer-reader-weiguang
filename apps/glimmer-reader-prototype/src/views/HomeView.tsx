import { Flame, RotateCcw, ArrowRight, BookOpen, Sparkles, Feather } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { TodoItem } from "../App";
import dengTataHomeLogo from "../assets/images/deng_tata_home_logo_360.png?inline";

interface HomeViewProps {
  todos: TodoItem[];
  onStartReading: () => void;
  onGoToReflection: () => void;
  onGoToSummary: () => void;
  isOverlayOpen?: boolean;
}

export default function HomeView({ 
  todos, 
  onStartReading, 
  onGoToReflection, 
  onGoToSummary,
  isOverlayOpen = false
}: HomeViewProps) {
  const [activeTodoIndex, setActiveTodoIndex] = useState(0);

  const safeIndex = todos.length > 0 ? activeTodoIndex % todos.length : 0;
  const activeTodo = todos[safeIndex];

  return (
    <motion.div 
      animate={{
        scale: isOverlayOpen ? 0.98 : 1,
        opacity: isOverlayOpen ? 0.7 : 1,
      }}
      transition={{
        duration: 0.25,
        ease: "easeInOut"
      }}
      className="flex-1 w-full h-full overflow-y-auto no-scrollbar pt-[60px] pb-[80px] px-5 flex flex-col transform-gpu"
    >
      {/* Header */}
      <header className="flex items-center justify-between w-full mt-2">
        <h1 className="text-xl font-semibold text-primary">微光伴读</h1>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container/60 backdrop-blur-md border border-border-light/30 shadow-sm cursor-pointer hover:opacity-90 transition-all">
          <Flame size={16} className="text-primary-container fill-primary-container" />
          <span className="text-xs text-primary-container font-semibold tracking-tight">12</span>
        </div>
      </header>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col justify-center pt-20 pb-8">
        {/* Mascot Area */}
        <div className="w-full flex justify-center mb-6">
          <div className="relative">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-48 h-48 relative rounded-[24px] bg-surface-card shadow-[0_16px_48px_rgba(45,60,68,0.18)] border border-border-light/60 overflow-hidden"
            >
              <img
                src={dengTataHomeLogo}
                alt="Deng Tata"
                className="absolute inset-0 z-10 w-full h-full object-cover"
              />
            </motion.div>
            
            {/* Dialogue bubble */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute -top-12 -right-4 z-10"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="bg-surface-card border border-border-light rounded-2xl p-3 shadow-sm relative"
              >
                <p className="text-[13px] font-medium text-on-surface-variant whitespace-nowrap">今天状态怎么样？</p>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-surface-card border-b border-r border-border-light rotate-45" />
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Central Goal Statement */}
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-center mb-10">
          <h2 className="text-[28px] font-semibold text-primary mb-1 tracking-tight leading-tight">今天先读 5 分钟</h2>
          <p className="text-[14px] text-text-secondary">放下压力，轻松开始</p>
        </motion.div>

        {/* Task Card Section */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.3 }} 
          className="w-[calc(100%+16px)] -mx-2 bg-surface-card rounded-[24px] p-4 shadow-[0_8px_30px_rgba(45,60,68,0.06)] border border-border-light/60 relative overflow-hidden min-h-[92px] flex flex-col justify-between"
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-bl from-accent-blue-tint/80 to-transparent rounded-full blur-2xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
          
          <AnimatePresence mode="wait">
            {todos.length > 0 ? (
              <div key="has-todos" className="w-full flex flex-col justify-between flex-1">
                {/* Sliding Item */}
                <motion.div 
                  key={activeTodo.id}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(e, info) => {
                    const swipeThreshold = 30;
                    if (info.offset.x < -swipeThreshold) {
                      setActiveTodoIndex((prev) => (prev + 1) % todos.length);
                    } else if (info.offset.x > swipeThreshold) {
                      setActiveTodoIndex((prev) => (prev - 1 + todos.length) % todos.length);
                    }
                  }}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center justify-between gap-2 relative z-10 w-full cursor-grab active:cursor-grabbing select-none"
                >
                  <div className="flex items-center gap-3 min-w-0 pointer-events-none">
                    <div className="w-11 h-11 rounded-[14px] bg-accent-blue-tint/50 flex items-center justify-center text-primary shrink-0 border border-border-light/50 shadow-sm">
                      {activeTodo.type === "reflection" && <RotateCcw size={18} />}
                      {activeTodo.type === "reading" && <ArrowRight size={18} />}
                      {activeTodo.type === "summary" && <BookOpen size={18} />}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="text-[15px] font-semibold text-primary mb-0.5 tracking-tight truncate">
                        {activeTodo.title}
                      </h3>
                      <p className="text-[12px] text-text-secondary leading-snug truncate mt-0">
                        {activeTodo.subtitle}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      if (activeTodo.type === "reflection") onGoToReflection();
                      if (activeTodo.type === "reading") onStartReading();
                      if (activeTodo.type === "summary") onGoToSummary();
                    }}
                    className="shrink-0 text-on-primary bg-primary-container px-4 h-[36px] rounded-full text-[14px] font-medium hover:bg-primary active:scale-95 transition-all shadow-md flex items-center justify-center relative z-20 cursor-pointer"
                  >
                    {activeTodo.btnText}
                  </button>
                </motion.div>

                {/* Slider Dots */}
                {todos.length > 1 && (
                  <div className="flex gap-1.5 justify-center mt-3.5 relative z-10">
                    {todos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveTodoIndex(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                          i === safeIndex ? "bg-primary-container scale-125" : "bg-surface-variant/70"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Completed State Static Pattern Card
              <motion.div 
                key="all-completed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center relative z-10 w-full flex-1 overflow-hidden"
              >
                {/* 静态图案：角落的极简同心圆弧线（涟漪/年轮意象） */}
                <div className="absolute -right-8 -top-12 opacity-[0.04] text-text-secondary pointer-events-none z-0">
                  <svg width="140" height="140" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="1" />
                    <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="1" />
                    <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="1" />
                  </svg>
                </div>
                <div className="absolute -left-12 -bottom-16 opacity-[0.03] text-text-secondary pointer-events-none z-0">
                  <svg width="160" height="160" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="0.8" />
                    <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="0.8" />
                    <circle cx="50" cy="50" r="28" stroke="currentColor" strokeWidth="0.8" />
                  </svg>
                </div>

                {/* 静态图案组合：徽章式图标与极简菱形 */}
                <div className="flex items-center gap-3 mb-1.5 relative z-10">
                  <div className="w-6 border-b border-text-secondary/15"></div>
                  <div className="w-1 h-1 bg-text-secondary/20 rotate-45 transform-gpu"></div>
                  
                  {/* 略微倾斜的背景垫片，增加图形丰富度 */}
                  <div className="relative mx-1">
                    <div className="absolute inset-0 bg-primary/5 rounded-[10px] rotate-6 transform-gpu"></div>
                    <div className="w-8 h-8 rounded-[10px] bg-surface-variant/50 border border-border-light/60 flex items-center justify-center relative backdrop-blur-sm shadow-sm">
                      <Feather size={14} strokeWidth={1.5} className="text-text-secondary/70" />
                    </div>
                  </div>

                  <div className="w-1 h-1 bg-text-secondary/20 rotate-45 transform-gpu"></div>
                  <div className="w-6 border-b border-text-secondary/15"></div>
                </div>
                
                <h3 className="text-[13px] font-medium text-text-secondary/80 tracking-[0.15em] relative z-10">
                  无待办
                </h3>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* FAB - Start Reading */}
      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="mt-auto mb-9 pt-4 px-2">
        <button 
          onClick={onStartReading}
          className="w-full bg-primary-container text-on-primary rounded-full py-3.5 flex items-center justify-center gap-2 hover:bg-primary active:scale-95 transition-all shadow-lg shadow-primary-container/20 cursor-pointer"
        >
          <span className="text-[14px] font-medium tracking-wide">开始阅读</span>
          <ArrowRight size={16} />
        </button>
      </motion.div>
    </motion.div>
  );
}
