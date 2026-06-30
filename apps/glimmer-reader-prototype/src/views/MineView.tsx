import { Leaf, Calendar, Clock, BookOpen, History, Heart, Settings, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import userAvatar from "../assets/images/regenerated_image_1781680049481.png";
import dengTataLying from "../assets/images/deng_tata_lying.png";

interface MineViewProps {
  onOpenSettings: () => void;
}

export default function MineView({ onOpenSettings }: MineViewProps) {
  return (
    <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar pt-[60px] pb-[100px] px-5 bg-background">


      {/* User Profile */}
      <section className="flex items-center gap-4 mt-2">
        <div className="relative w-[76px] h-[76px] rounded-full bg-surface-container shadow-md border-[3px] border-surface-card overflow-hidden shrink-0">
          <img 
            alt="用户头像" 
            className="w-full h-full object-cover scale-[1.35]" 
            src={userAvatar} 
          />
        </div>
        <div className="flex flex-col justify-center">
          <h2 className="text-[24px] font-semibold text-primary tracking-tight leading-none">微光01</h2>
        </div>
      </section>

      {/* Deng Tata Energy Level Card */}
      <section className="bg-surface-card rounded-[24px] pt-3 pb-3.5 px-4 mt-8 shadow-sm border border-border-light relative overflow-hidden group">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-accent-blue-tint rounded-full blur-2xl opacity-60 pointer-events-none" />
        
        <div className="flex items-center justify-between mb-1 relative z-10">
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-[82px] h-[56px] flex items-center justify-center overflow-visible shrink-0 -ml-1 -mt-1 -mb-1 relative z-20"
            >
              <img 
                src={dengTataLying} 
                alt="Deng Tata" 
                className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(45,60,68,0.14)] scale-[1.35] origin-center translate-y-[3px] translate-x-[2px]" 
              />
            </motion.div>
            <h3 className="text-[17px] font-extrabold text-primary tracking-tight -ml-1">灯獭獭</h3>
          </div>
          <span className="text-[11px] font-semibold text-white bg-[#2D3C44] px-2.5 py-1 rounded-full">Lv.4 依恋期</span>
        </div>

        <div className="relative z-10 w-full">
          <div className="h-[9px] w-full bg-surface-container-low rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-gradient-to-r from-tertiary-fixed-dim/75 to-tertiary-fixed/70 w-[75%] rounded-full" />
          </div>
          <p className="text-[11px] font-medium text-text-secondary mt-2">750 / 1000</p>
        </div>
      </section>

      {/* Reading Stats Grid */}
      <section className="grid grid-cols-2 gap-3 mt-4">
        {/* Days Box */}
        <div className="bg-accent-blue-tint/80 rounded-[22px] p-4 flex flex-col justify-between aspect-square active:scale-[0.98] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-primary/80">阅读天数</span>
            <Calendar size={18} className="text-primary/30" />
          </div>
          <div className="flex items-baseline gap-1 mt-auto">
            <span className="text-[32px] font-semibold text-primary leading-none">128</span>
            <span className="text-[12px] text-primary/60 font-medium">天</span>
          </div>
        </div>

        {/* Minutes Box */}
        <div className="bg-surface-card border border-border-light rounded-[22px] p-4 flex flex-col justify-between aspect-square active:scale-[0.98] transition-transform shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-primary/80">沉浸时长</span>
            <Clock size={18} className="text-primary/30" />
          </div>
          <div className="flex items-baseline gap-1 mt-auto">
            <span className="text-[32px] font-semibold text-primary leading-none">1,340</span>
            <span className="text-[12px] text-text-secondary font-medium">分钟</span>
          </div>
        </div>

        {/* Knowledge Box full width */}
        <div className="bg-surface-card border border-border-light rounded-[22px] p-4 col-span-2 relative shadow-sm active:scale-[0.98] transition-transform flex flex-col overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-bl from-accent-blue-tint/50 to-transparent rounded-full blur-2xl pointer-events-none opacity-60 translate-x-1/2 -translate-y-1/2" />
          
          <div className="flex items-center justify-between relative z-10 mb-4 px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-accent-blue-tint/50 flex items-center justify-center">
                <BookOpen size={15} className="text-primary" />
              </div>
              <span className="text-[14px] font-semibold text-primary tracking-tight">知识沉淀</span>
            </div>
            <ChevronRight size={18} className="text-outline-variant/60" />
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-10">
            <div className="bg-background/80 rounded-[14px] p-3.5 flex flex-col gap-1 border border-border-light/50">
              <span className="text-[11px] text-text-secondary pl-1">总结笔记</span>
              <div className="flex items-baseline gap-1 pl-1">
                <span className="text-[24px] font-bold text-primary leading-none">32</span>
                <span className="text-[11px] font-medium text-text-secondary">篇</span>
              </div>
            </div>
            <div className="bg-background/80 rounded-[14px] p-3.5 flex flex-col gap-1 border border-border-light/50">
              <span className="text-[11px] text-text-secondary pl-1">实践行动</span>
              <div className="flex items-baseline gap-1 pl-1">
                <span className="text-[24px] font-bold text-primary leading-none">15</span>
                <span className="text-[11px] font-medium text-text-secondary">次</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Utilities List */}
      <section className="bg-surface-card rounded-[24px] mt-4 shadow-sm border border-border-light overflow-hidden mb-4">
        
        <button className="w-full flex items-center justify-between p-4 border-b border-surface-variant/50 hover:bg-surface-container-lowest active:bg-surface-variant/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-blue-tint/70 flex items-center justify-center">
              <History size={16} className="text-primary" />
            </div>
            <span className="text-[15px] font-medium text-on-surface">阅读档案</span>
          </div>
          <ChevronRight size={18} className="text-outline-variant" />
        </button>

        <button className="w-full flex items-center justify-between p-4 border-b border-surface-variant/50 hover:bg-surface-container-lowest active:bg-surface-variant/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-blue-tint/70 flex items-center justify-center">
              <Heart size={16} className="text-primary" />
            </div>
            <span className="text-[15px] font-medium text-on-surface">我的收藏</span>
          </div>
          <ChevronRight size={18} className="text-outline-variant" />
        </button>

        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between p-4 hover:bg-surface-container-lowest active:bg-surface-variant/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
              <Settings size={16} className="text-on-surface-variant" />
            </div>
            <span className="text-[15px] font-medium text-on-surface">偏好设置</span>
          </div>
          <ChevronRight size={18} className="text-outline-variant" />
        </button>

      </section>
    </div>
  );
}
