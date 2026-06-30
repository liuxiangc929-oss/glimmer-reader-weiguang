import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import TabBar from "./TabBar";

interface PhoneFrameProps {
  children: ReactNode;
  isDark: boolean;
  currentTab: string;
  onTabChange: (tab: any) => void;
  showTabBar?: boolean;
  showStatusBar?: boolean;
  showHomeIndicator?: boolean;
}

export default function PhoneFrame({ 
  children, 
  isDark, 
  currentTab, 
  onTabChange, 
  showTabBar = true,
  showStatusBar = true,
  showHomeIndicator = true
}: PhoneFrameProps) {
  const [frameScale, setFrameScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const availableWidth = window.innerWidth - 24;
      const availableHeight = window.innerHeight - 24;
      setFrameScale(Math.min(1, availableWidth / 393, availableHeight / 852));
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div className="min-h-[100svh] w-full bg-neutral-900 px-3 py-3 selection:bg-accent-blue-tint overflow-auto flex items-start justify-center">
      <div
        style={{
          width: 393 * frameScale,
          height: 852 * frameScale,
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          style={{
            transform: `scale(${frameScale})`,
            transformOrigin: "top center",
          }}
          className={`relative w-[393px] h-[852px] rounded-[55px] border-[14px] border-zinc-800 bg-background text-on-surface overflow-hidden shadow-2xl flex flex-col font-sans ${isDark ? "dark" : ""}`}
        >
          {/* Hardware details - buttons */}
          <div className="absolute top-[120px] -left-[16px] w-[3px] h-[30px] bg-zinc-800 rounded-l-md" /> {/* Action / Mute button */}
          <div className="absolute top-[170px] -left-[16px] w-[3px] h-[60px] bg-zinc-800 rounded-l-md" /> {/* Vol up */}
          <div className="absolute top-[240px] -left-[16px] w-[3px] h-[60px] bg-zinc-800 rounded-l-md" /> {/* Vol down */}
          <div className="absolute top-[190px] -right-[16px] w-[3px] h-[90px] bg-zinc-800 rounded-r-md" /> {/* Power */}
   
          {/* Dynamic Island and Status Bar Layer (Always stays on top of content views) */}
          <div className="absolute top-0 left-0 w-full h-[54px] z-[999] pointer-events-none flex items-center justify-between px-7 pt-3 select-none">
            {/* Time (Fully matching real iOS clock layout bound to 18:12) */}
            <span className={`text-[14px] font-semibold text-primary ml-1 mt-1 tracking-tight transition-all duration-305 ${showStatusBar ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
              18:12
            </span>
            
            {/* Dynamic Island */}
            <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-[110px] h-[30px] bg-black rounded-full shadow-[inset_0_-1px_3px_rgba(255,255,255,0.15)] flex items-center justify-end px-3">
              <div className="w-2.5 h-2.5 bg-white/10 rounded-full flex items-center justify-center mr-1">
                <div className="w-1 h-1 bg-black rounded-full animate-pulse" />
              </div>
            </div>

            {/* High Fidelity iOS Status Bar Indicators */}
            <div className={`flex items-center gap-1.5 mt-1 -mr-1 text-primary transition-all duration-305 ${showStatusBar ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
              {/* Cellular Signal Strength */}
              <svg width="17" height="11" viewBox="0 0 17 11" fill="none" className="text-current shrink-0">
                <rect x="0.5" y="8" width="2.5" height="2.5" rx="0.5" fill="currentColor" />
                <rect x="4.5" y="5.5" width="2.5" height="5" rx="0.5" fill="currentColor" />
                <rect x="8.5" y="3" width="2.5" height="7.5" rx="0.5" fill="currentColor" />
                <rect x="12.5" y="0.5" width="2.5" height="10" rx="0.5" fill="currentColor" />
              </svg>

              {/* Battery Indicator with Outline, Nub & Fill */}
              <div className="relative w-[23px] h-[11.5px] border border-current rounded-[3.5px] p-[1.5px] flex items-center justify-start shrink-0">
                <div className="h-full w-full bg-current rounded-[1.5px]" />
                <div className="absolute -right-[2.5px] top-[3.2px] w-[1.2px] h-[3.8px] bg-current rounded-r-[0.8px]" />
              </div>
            </div>
          </div>

          {/* App Content container */}
          <div className="flex-1 w-full relative overflow-hidden flex flex-col z-0">
            {children}
          </div>

          {/* Persistent Tab Bar in Layout shell */}
          <AnimatePresence>
            {showTabBar && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute bottom-0 w-full z-40 pointer-events-auto"
              >
                <TabBar 
                  currentTab={currentTab} 
                  onChange={onTabChange} 
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Home Indicator bar */}
          <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-primary/25 dark:bg-primary/50 backdrop-blur-md rounded-full z-[999] pointer-events-none transition-all duration-305 ${showHomeIndicator ? "opacity-100" : "opacity-0 translate-y-1"}`} />
        </motion.div>
      </div>
    </div>
  );
}
