import { Home, Book, NotebookPen, User } from "lucide-react";
import { motion } from "motion/react";

interface TabBarProps {
  currentTab: string;
  onChange: (tab: string) => void;
}

export default function TabBar({ currentTab, onChange }: TabBarProps) {
  const tabs = [
    { id: "home", label: "首页", icon: Home },
    { id: "bookshelf", label: "书架", icon: Book },
    { id: "records", label: "记录", icon: NotebookPen },
    { id: "mine", label: "我的", icon: User },
  ];

  return (
    <nav className="absolute bottom-0 w-full rounded-t-3xl bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-40 flex justify-around items-center px-4 pb-[24px] pt-2 text-[11px] font-medium border-t border-border-light/20 select-none">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex flex-col items-center justify-center w-16 group outline-none relative h-12"
          >
            <motion.div 
              layout
              className={`px-3 py-1 rounded-full flex flex-col items-center pointer-events-none transition-colors ${!isActive && "group-hover:bg-accent-blue-tint/50"}`}
            >
               <motion.div
                 layout
                 initial={false}
                 animate={{
                   y: isActive ? -2 : 0,
                   scale: isActive ? 1.05 : 1,
                 }}
                 transition={{ type: "spring", stiffness: 400, damping: 25 }}
               >
                 <Icon size={22} className={`transition-colors duration-300 ${isActive ? "fill-primary text-primary" : "text-text-secondary"}`} />
               </motion.div>
               <motion.span 
                 layout
                 initial={false}
                 animate={{
                   y: isActive ? -2 : 0,
                   opacity: isActive ? 1 : 0.8,
                 }}
                 transition={{ type: "spring", stiffness: 400, damping: 25 }}
                 className={`mt-0.5 transition-colors duration-300 transform-gpu ${isActive ? "text-primary font-bold" : "text-text-secondary font-medium"}`}
                 style={{ 
                   WebkitTextStroke: isActive ? "0.2px currentColor" : "0px",
                 }}
               >
                 {tab.label}
               </motion.span>
               {/* Optional pill background for active state? The user didn't ask but maybe nice. We just stick to fixing jump */}
            </motion.div>
          </button>
        );
      })}
    </nav>
  );
}
