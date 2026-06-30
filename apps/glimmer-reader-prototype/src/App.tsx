import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";
import PhoneFrame from "./components/PhoneFrame";

// Views
import HomeView from "./views/HomeView";
import BookshelfView from "./views/BookshelfView";
import RecordsView from "./views/RecordsView";
import MineView from "./views/MineView";
import SettingsView from "./views/SettingsView";
import BookDetailView from "./views/BookDetailView";
import AtmosphereView from "./views/AtmosphereView";
import ReadingView from "./views/ReadingView";
import ReflectionView from "./views/ReflectionView";
import type { PendingSummaryEntry } from "./summary/pendingSummary";

// Books data
import { BOOKS, Book } from "./data/books";

export type TabType = "home" | "bookshelf" | "records" | "mine";

export interface TodoItem {
  id: string;
  title: string;
  subtitle: string;
  btnText: string;
  type: "reflection" | "reading" | "summary";
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>("home");
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [readingStartFromSummary, setReadingStartFromSummary] = useState<PendingSummaryEntry | null>(null);
  const [pendingSummary, setPendingSummary] = useState<PendingSummaryEntry | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([
    {
      id: "reflection",
      title: "回顾微尝试",
      subtitle: "花 1 分钟记录昨天的感悟吧",
      btnText: "去看看",
      type: "reflection"
    }
  ]);
  const [isBookDetailOpen, setIsBookDetailOpen] = useState<boolean>(false);
  const [isAtmosphereOpen, setIsAtmosphereOpen] = useState<boolean>(false);
  const [isReadingOpen, setIsReadingOpen] = useState<boolean>(false);
  const [isReflectionOpen, setIsReflectionOpen] = useState<boolean>(false);
  const [isCoreReadingActive, setIsCoreReadingActive] = useState<boolean>(true);
  const [readingShowUI, setReadingShowUI] = useState<boolean>(true);
  const [books, setBooks] = useState<Book[]>(BOOKS);
  const [selectedBookId, setSelectedBookId] = useState<string>("attention");
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [skipExitAnim, setSkipExitAnim] = useState<boolean>(false);

  // Current selected book object
  const activeBook = books.find(b => b.id === selectedBookId) || books[0];

  const isAnyOverlayOpen = isSettingsOpen || isBookDetailOpen || isAtmosphereOpen || isReadingOpen || isReflectionOpen || isImportOpen;

  // Tab View Dispatcher
  const renderTab = () => {
    switch (currentTab) {
      case "home":
        return (
          <HomeView 
            todos={todos}
            isOverlayOpen={isAnyOverlayOpen}
            onStartReading={() => {
              // 开启阅读时，移去今日先读的 todo
              setTodos(prev => prev.filter(t => t.id !== "reading"));
              setIsAtmosphereOpen(true);
            }} 
            onGoToReflection={() => setIsReflectionOpen(true)}
            onGoToSummary={() => {
              if (!pendingSummary) return;
              setSelectedBookId(pendingSummary.bookId);
              setReadingStartFromSummary(pendingSummary);
              setIsReadingOpen(true);
            }}
          />
        );
      case "bookshelf":
        return (
          <BookshelfView 
            onOpenDetail={() => setIsBookDetailOpen(true)} 
            onContinueReading={() => setIsAtmosphereOpen(true)} 
            books={books}
            selectedBookId={selectedBookId}
            onSelectBook={setSelectedBookId}
            onAddBook={(newBook) => {
              setBooks([...books, newBook]);
              setSelectedBookId(newBook.id); // auto-select newly imported book!
            }}
            isImportOpen={isImportOpen}
            onImportOpenChange={setIsImportOpen}
          />
        );
      case "records":
        return <RecordsView />;
      case "mine":
        return <MineView onOpenSettings={() => setIsSettingsOpen(true)} />;
      default:
        return (
          <HomeView
            todos={todos}
            isOverlayOpen={isAnyOverlayOpen}
            onStartReading={() => setIsAtmosphereOpen(true)}
            onGoToReflection={() => setIsReflectionOpen(true)}
            onGoToSummary={() => {
              if (!pendingSummary) return;
              setSelectedBookId(pendingSummary.bookId);
              setReadingStartFromSummary(pendingSummary);
              setIsReadingOpen(true);
            }}
          />
        );
    }
  };

  return (
    <>
      <PhoneFrame 
        isDark={isDark}
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab as TabType)}
        showTabBar={!isSettingsOpen && !isBookDetailOpen && !isAtmosphereOpen && !isReadingOpen && !isReflectionOpen && !isImportOpen}
        showStatusBar={!isReadingOpen || !isCoreReadingActive || readingShowUI}
        showHomeIndicator={!isReadingOpen || !isCoreReadingActive || readingShowUI}
      >
        {/* 
          Main tab content container 
          AnimatePresence manages smooth entry/exit between tabs.
        */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="w-full h-full absolute inset-0"
            >
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Settings Overlay */}
        <AnimatePresence>
          {isSettingsOpen && (
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0 z-50 pointer-events-auto"
            >
              <SettingsView 
                onClose={() => setIsSettingsOpen(false)} 
                isDark={isDark} 
                setIsDark={setIsDark} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Book Detail Overlay */}
        <AnimatePresence>
          {isBookDetailOpen && (
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={skipExitAnim ? undefined : { opacity: 0, x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0 z-50 pointer-events-auto"
            >
              <BookDetailView 
                onClose={() => setIsBookDetailOpen(false)} 
                activeBook={activeBook}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Atmosphere Setting Overlay */}
        <AnimatePresence>
          {isAtmosphereOpen && (
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={skipExitAnim ? undefined : { opacity: 0, x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0 z-50 pointer-events-auto"
            >
              <AtmosphereView 
                onClose={() => setIsAtmosphereOpen(false)} 
                onEnterReading={() => {
                  setIsReadingOpen(true);
                }}
                activeBook={activeBook}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reading View Overlay */}
        <AnimatePresence>
          {isReadingOpen && (
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="absolute inset-0 z-[120] pointer-events-auto"
            >
              <ReadingView 
                onClose={() => {
                  setIsReadingOpen(false);
                  setIsAtmosphereOpen(true);
                  setIsCoreReadingActive(false);
                  setReadingStartFromSummary(null);
                }}
                onHome={() => {
                  // 允许播放平滑的向下滑动退出动画，不再生硬硬切
                  setIsReadingOpen(false);
                  setIsAtmosphereOpen(false);
                  setIsBookDetailOpen(false);
                  setIsCoreReadingActive(false);
                  setReadingStartFromSummary(null);
                }}
                activeBook={activeBook}
                isDark={isDark}
                onShowUIChange={setReadingShowUI}
                onCoreReadingStateChange={setIsCoreReadingActive}
                startFromSummary={readingStartFromSummary}
                onGenerateReadLater={(entry) => {
                  setPendingSummary(entry);
                  setReadingStartFromSummary(null);
                  setTodos(prev => {
                    if (prev.some(t => t.id === "summary")) return prev;
                    return [
                      ...prev,
                      {
                        id: "summary",
                        title: "待查看阅读总结",
                        subtitle: "点击查看刚刚阅读的《注意力的边界》总结",
                        btnText: "去查看",
                        type: "summary"
                      }
                    ];
                  });
                  setIsReadingOpen(false);
                  setIsAtmosphereOpen(false);
                  setIsBookDetailOpen(false);
                  setIsCoreReadingActive(false);
                  setCurrentTab("home");
                }}
                onSummaryViewed={() => {
                  setPendingSummary(null);
                  setReadingStartFromSummary(null);
                  setTodos(prev => prev.filter(t => t.id !== "summary"));
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reflection View Overlay */}
        <AnimatePresence>
          {isReflectionOpen && (
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="absolute inset-0 z-[110] pointer-events-auto"
            >
              <ReflectionView 
                onClose={() => {
                  setIsReflectionOpen(false);
                }} 
                onComplete={() => {
                  setTodos(prev => prev.filter(t => t.id !== "reflection"));
                  setIsReflectionOpen(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </PhoneFrame>

      {/* Webpage-level elegant floating test helper panel (not inside "mobile screen") */}
      <AnimatePresence>
        {isReadingOpen && isCoreReadingActive && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="fixed bottom-6 right-6 z-[9999] bg-zinc-950/90 backdrop-blur-md text-white border border-zinc-800/80 p-3 rounded-2xl shadow-xl w-48 select-none flex flex-col gap-2.5 font-sans"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-400 tracking-wider">测试助手</span>
            </div>
            
            <button 
              onClick={() => {
                if (typeof (window as any).__instantTriggerReadingConditions === "function") {
                  (window as any).__instantTriggerReadingConditions();
                }
              }}
              className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30 text-amber-400 border border-amber-500/25 text-[11px] font-bold rounded-xl shadow-inner cursor-pointer transition-all active:scale-95 text-center"
            >
              注入 5 分钟
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
