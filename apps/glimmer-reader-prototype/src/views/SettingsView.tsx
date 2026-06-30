import { useState } from "react";
import { ArrowLeft, Moon, Sun } from "lucide-react";

interface SettingsViewProps {
  onClose: () => void;
  isDark: boolean;
  setIsDark: (val: boolean) => void;
}

export default function SettingsView({ onClose, isDark, setIsDark }: SettingsViewProps) {
  const [skipProtection, setSkipProtection] = useState(true);

  // Reusable custom toggle component
  const CustomToggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <div 
      onClick={onChange}
      className={`relative w-[44px] h-[24px] rounded-full cursor-pointer transition-colors duration-300 ease-in-out flex items-center px-[2px] shadow-inner ${checked ? "bg-primary-container" : "bg-outline-variant"}`}
    >
      <div 
        className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ease-in-out ${checked ? "translate-x-5" : "translate-x-0"}`} 
      />
    </div>
  );

  return (
    <div className="w-full h-full bg-background absolute inset-0 z-50 flex flex-col font-sans">
      
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-[55px] pb-4 bg-background z-10 sticky top-0 border-b border-border-light/20">
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-surface-variant/50 active:scale-95 transition-all text-primary"
          aria-label="返回"
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
        <h1 className="text-[18px] font-semibold text-primary absolute left-1/2 -translate-x-1/2">
          设置
        </h1>
        <div className="w-10" />
      </header>

      {/* Main Content */}
      <div className="flex-1 px-5 pt-6 pb-12 overflow-y-auto w-full flex flex-col gap-5">
        
        {/* Setup Toggles Card */}
        <div className="bg-surface-card rounded-[24px] shadow-sm border border-border-light/50 flex flex-col transition-all duration-300 overflow-hidden text-on-surface">
          
          {/* Skip Protection */}
          <div className="p-5 border-b border-surface-variant flex flex-col gap-3">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-[16px] font-semibold text-primary">跳过保护</h2>
              <CustomToggle checked={skipProtection} onChange={() => setSkipProtection(!skipProtection)} />
            </div>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              开启后，在记录页会保留误触跳过总结或问题后的继续入口，给改变主意留一点余地。
            </p>
          </div>

          {/* Dark Mode Toggle */}
          <div className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {isDark ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-primary" />}
                <h2 className="text-[16px] font-semibold text-primary">深色模式</h2>
              </div>
              <CustomToggle checked={isDark} onChange={() => setIsDark(!isDark)} />
            </div>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              开启深色模式以减轻夜间查阅记录时的眼部疲劳，享受静谧的阅读体验。
            </p>
          </div>

        </div>

        {/* Informational item */}
        <div className="px-2 pt-4">
           <div className="text-center text-[12px] text-text-secondary opacity-60">
              当前版本 V1.0.0<br/>微光伴读
           </div>
        </div>
      </div>
    </div>
  );
}
