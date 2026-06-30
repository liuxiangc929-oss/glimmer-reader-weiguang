import { useState } from "react";
import { Book, ChevronDown, Bookmark, CheckSquare, Calendar, Clock, Sparkles, Trash2, Circle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function RecordsView() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [records, setRecords] = useState<any[]>(() => {
    let custom = [];
    try {
      const stored = localStorage.getItem("customReadingRecords");
      if (stored) custom = JSON.parse(stored);
    } catch {}
    
    return custom;
  });

  const toggleAccordion = (id: number) => {
    if (isEditing) {
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(selId => selId !== id));
      } else {
        setSelectedIds([...selectedIds, id]);
      }
      return;
    }
    setExpandedId(expandedId === id ? null : id);
  };

  const allRecords = [...records];

  return (
    <div className="relative flex-1 w-full h-full flex flex-col bg-background overflow-hidden">
      <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar pt-[60px] pb-[100px] px-5">
      {/* Dashboard Section */}
      <section className="mb-8 mt-2">
        <div className="flex items-center gap-1.5 mb-4">
          <h2 className="text-[25px] font-semibold text-primary tracking-tight">本周概览</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Card 1: Reading Days */}
          <div className="bg-surface-card rounded-[24px] p-5 shadow-[0_8px_30px_rgba(45,60,68,0.03)] hover:shadow-[0_12px_40px_rgba(45,60,68,0.08)] border border-border-light/60 relative overflow-hidden group transition-all duration-300">
            {/* Subtle background circles for premium design */}
            <div className="absolute right-0 bottom-0 w-20 h-20 bg-gradient-to-br from-accent-blue-tint/20 to-accent-blue-tint/60 rounded-full -mr-4 -mb-4 opacity-60 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-accent-blue-tint" />
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-[12px] font-semibold text-text-secondary tracking-wider">阅读天数</span>
              <div className="w-7 h-7 rounded-full bg-accent-blue-tint/60 flex items-center justify-center text-primary-container">
                <Calendar size={13} className="text-primary-container shrink-0" />
              </div>
            </div>
            
            <div className="flex items-baseline gap-1 relative z-10 mt-2">
              <span className="text-[36px] font-bold text-primary tracking-tight leading-none">5</span>
              <span className="text-[14px] text-text-secondary font-medium">天</span>
            </div>
            
            {/* Minimalist Day Trackers */}
            <div className="flex gap-1 mt-4 relative z-10">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <div 
                  key={day} 
                  className={`h-1 flex-1 rounded-full ${
                    day <= 5 
                      ? "bg-primary-container/80" 
                      : "bg-surface-container-high/40"
                  }`} 
                />
              ))}
            </div>
          </div>

          {/* Card 2: Accumulated Hours */}
          <div className="bg-surface-card rounded-[24px] p-5 shadow-[0_8px_30px_rgba(45,60,68,0.03)] hover:shadow-[0_12px_40px_rgba(45,60,68,0.08)] border border-border-light/60 relative overflow-hidden group transition-all duration-300">
            {/* Subtle background circles for premium design */}
            <div className="absolute right-0 bottom-0 w-20 h-20 bg-gradient-to-br from-orange-50/20 to-orange-100/40 rounded-full -mr-4 -mb-4 opacity-55 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-orange-200" />

            <div className="flex items-center justify-between mb-4">
              <span className="text-[12px] font-semibold text-text-secondary tracking-wider">累计时长</span>
              <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center text-secondary">
                <Clock size={13} className="text-secondary shrink-0" />
              </div>
            </div>
            
            <div className="flex items-baseline gap-1 relative z-10 mt-2">
              <span className="text-[36px] font-bold text-primary tracking-tight leading-none">3.2</span>
              <span className="text-[14px] text-text-secondary font-medium">小时</span>
            </div>

            {/* Simulated mini performance progress bar */}
            <div className="w-full bg-surface-container-high/40 h-1 rounded-full mt-4 relative overflow-hidden z-10">
              <div className="h-full bg-secondary-container w-[75%] rounded-full" />
            </div>
          </div>
        </div>
      </section>

        {/* Records List Section */}
        <section className="flex flex-col gap-4 pb-[80px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-semibold text-primary tracking-tight">近期记录</h2>
            {allRecords.length > 0 && (
              <div className="flex items-center">
                <AnimatePresence>
                  {isEditing && (
                    <motion.div
                      initial={{ opacity: 0, width: 0, x: 10 }}
                      animate={{ opacity: 1, width: "auto", x: 0 }}
                      exit={{ opacity: 0, width: 0, x: 10 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap mr-2"
                    >
                      <button
                        onClick={() => {
                          const newRecords = records.filter(r => !selectedIds.includes(r.id));
                          setRecords(newRecords);
                          setIsEditing(false);
                          setSelectedIds([]);
                          try {
                            const customToSave = newRecords.filter(r => r.id !== 1);
                            localStorage.setItem("customReadingRecords", JSON.stringify(customToSave));
                          } catch {}
                        }}
                        disabled={selectedIds.length === 0}
                        className={`w-[32px] h-[32px] rounded-full transition-all flex items-center justify-center border shadow-xs ${
                          selectedIds.length > 0 
                            ? "text-[#D83B3B] border-red-200/80 bg-red-50 hover:bg-red-100" 
                            : "text-text-secondary/30 border-border-light/50 bg-surface-card cursor-not-allowed opacity-70"
                        }`}
                        title="删除所选"
                      >
                        <Trash2 size={16} strokeWidth={2.5} />
                      </button>
                      
                      <button
                        onClick={() => {
                          if (selectedIds.length === allRecords.length) {
                            setSelectedIds([]);
                          } else {
                            setSelectedIds(allRecords.map(r => r.id));
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all group border shadow-xs ${
                          selectedIds.length > 0 && selectedIds.length === allRecords.length
                            ? "border-secondary/30 bg-secondary/5 hover:bg-secondary/10"
                            : "border-border-light/80 bg-surface-card hover:bg-surface-variant/40"
                        }`}
                      >
                        <div className="shrink-0 flex items-center justify-center">
                          {selectedIds.length > 0 && selectedIds.length === allRecords.length ? (
                            <CheckCircle2 size={16} className="text-secondary fill-secondary/20 transition-all" />
                          ) : (
                            <Circle size={16} className="text-border-light/80 group-hover:text-border-light transition-all" />
                          )}
                        </div>
                        <span className={`text-[13px] font-medium transition-colors ${
                          selectedIds.length > 0 && selectedIds.length === allRecords.length
                            ? "text-secondary font-semibold"
                            : "text-text-secondary"
                        }`}>
                          全选
                        </span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setSelectedIds([]);
                    if (!isEditing) setExpandedId(null);
                  }}
                  className="text-[14px] text-primary transition-colors font-medium px-3.5 py-1.5 rounded-full active:scale-95 border border-border-light/80 bg-surface-card shadow-xs hover:bg-surface-variant/40"
                >
                  {isEditing ? "完成" : "管理"}
                </button>
              </div>
            )}
          </div>
          
          {allRecords.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center opacity-50 bg-surface-card rounded-[22px] border border-border-light/50">
              <Book size={40} className="text-text-secondary mb-3 opacity-50" />
              <p className="text-[14px] text-text-secondary font-medium tracking-wide">暂无伴读记录</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[1px] before:bg-border-light/70">
          {allRecords.map((record, index) => {
            const isExpanded = expandedId === record.id;

            return (
              <div 
                key={record.id} 
                className="bg-surface-card rounded-[22px] border border-border-light/50 overflow-hidden shadow-[0_4px_20px_rgba(45,60,68,0.02)] hover:shadow-[0_8px_25px_rgba(45,60,68,0.05)] transition-all duration-300 relative z-10"
              >
                <button 
                  onClick={() => toggleAccordion(record.id)}
                  className={`w-full p-4 flex justify-between items-center transition-all duration-200 active:bg-surface-container-low/60 ${isExpanded ? "bg-accent-blue-tint/15" : ""}`}
                >
                  <div className="flex items-center">
                    <AnimatePresence initial={false}>
                      {isEditing && (
                        <motion.div 
                          initial={{ opacity: 0, width: 0, scale: 0.5 }} 
                          animate={{ opacity: 1, width: 32, scale: 1 }} 
                          exit={{ opacity: 0, width: 0, scale: 0.5 }}
                          transition={{ type: "spring", stiffness: 500, damping: 35 }}
                          className="overflow-hidden flex items-center shrink-0"
                        >
                          <div className="w-[20px] shrink-0 mr-3">
                            {selectedIds.includes(record.id) ? (
                              <CheckCircle2 size={20} className="text-secondary fill-secondary/20" />
                            ) : (
                              <Circle size={20} className="text-border-light/80" />
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <div className="flex items-center gap-3">
                      {/* Compact beautifully styled leading circle with book icon */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${
                        isExpanded 
                          ? "bg-primary-container text-white border-primary-container" 
                          : "bg-surface-container-low text-primary/70 border-border-light/40"
                      }`}>
                        <Book size={15} className={`transition-transform duration-300 ${isExpanded ? "scale-105" : ""}`} />
                      </div>
                      <div className="text-left">
                        <h3 className="text-[15px] font-medium text-primary leading-tight">{record.title}</h3>
                        <p className="text-[11px] text-text-secondary mt-0.5 font-medium">{record.date}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Subtle chevron controller */}
                  <AnimatePresence initial={false}>
                    {!isEditing && (
                      <motion.div 
                        initial={{ opacity: 0, width: 0, scale: 0.5 }}
                        animate={{ opacity: 1, width: 28, scale: 1 }}
                        exit={{ opacity: 0, width: 0, scale: 0.5 }}
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                        className="overflow-hidden flex items-center justify-center shrink-0"
                      >
                        <div className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors shrink-0 ${
                          isExpanded ? "bg-primary-container/10 text-primary-container" : "bg-surface-container-lowest text-text-secondary border border-border-light/30 shadow-xs"
                        }`}>
                          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.25, ease: "easeInOut" }}>
                            <ChevronDown size={14} className="stroke-[2.5]" />
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>

                <AnimatePresence>
                  {isExpanded && record.summary && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden bg-gradient-to-b from-accent-blue-tint/5 to-transparent"
                    >
                      <div className="p-4 space-y-4 border-t border-border-light/40">
                        {/* Reading scope indicator */}
                        <div className="flex flex-col gap-2.5 bg-accent-blue-tint/15 px-4 py-4 rounded-[20px] border border-accent-blue-tint/30 w-full shadow-md relative overflow-hidden">
                          {/* Decorative subtle glow */}
                          <div className="absolute -right-4 -top-4 w-24 h-24 bg-accent-blue-tint/30 rounded-full blur-2xl pointer-events-none"></div>
                          
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary-container/90 tracking-widest uppercase relative z-10">
                            <Bookmark size={14} className="text-primary-container/90 shrink-0" />
                            <span>阅读范围</span>
                          </div>
                          
                          <div className="flex flex-col gap-1.5 mt-0.5 relative z-10">
                            {record.chapters && record.chapters.length > 0 ? (
                              <>
                                <div className="text-[15px] font-bold text-primary leading-snug flex flex-wrap items-center gap-y-1.5">
                                  {record.chapters.map((ch: string, idx: number) => (
                                    <div key={idx} className="flex items-center">
                                      <span>{ch.split(/[ \s:：]/)[0]}</span>
                                      {idx < record.chapters.length - 1 && (
                                        <span className="mx-1.5 text-primary/30 text-[11px] font-normal">/</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {record.sections && record.sections.length > 0 && (
                                  <div className="text-[13px] text-text-secondary leading-snug flex flex-wrap items-center gap-y-1">
                                    {record.sections.map((sec: string, idx: number) => (
                                      <div key={idx} className="flex items-center">
                                        <span>{sec.split(/[ \s:：]/)[0]}</span>
                                        {idx < record.sections.length - 1 && (
                                          <span className="mx-1.5 text-text-secondary/30 text-[10px] font-normal">/</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <div className="text-[12.5px] text-primary-container/90 font-medium mt-1 bg-accent-blue-tint/10 px-3 py-1.5 rounded-xl self-start border border-accent-blue-tint/20 inline-flex items-center gap-1 shadow-sm">
                                  第 {record.pages ? record.pages.start : record.range?.match(/\d+/g)?.[0] || 1} 页
                                  <span className="text-primary-container/40 mx-0.5">-</span>
                                  第 {record.pages ? record.pages.end : record.range?.match(/\d+/g)?.[1] || 1} 页
                                </div>
                              </>
                            ) : (
                              <div className="text-[14px] font-medium text-primary">
                                {record.range}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Summary block */}
                        <div className="bg-surface-container-lowest/80 rounded-2xl p-4 border border-border-light/30 relative">
                          <p className="text-[13.5px] text-on-surface-variant leading-relaxed">
                            {record.summary}
                          </p>
                        </div>

                        {/* Completed actions block */}
                        {record.actions && (
                          <div className="pt-1.5">
                            <h4 className="text-[12px] font-semibold text-text-secondary mb-2.5 flex items-center gap-1.5 tracking-wider uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary-container" />
                              已完成行动
                            </h4>
                            <ul className="space-y-2">
                              {record.actions.map((act, idx) => (
                                <li key={idx} className="flex items-start gap-2.5 text-[13px] text-primary leading-relaxed bg-surface-container-low/40 p-2.5 rounded-xl border border-border-light/20 shadow-2xs">
                                  <CheckSquare size={14} className="text-secondary fill-secondary/10 shrink-0 mt-0.5 stroke-[2]" />
                                  <span className="font-normal">{act}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
            </div>
          )}
        </section>
      </div>


    </div>
  );
}
