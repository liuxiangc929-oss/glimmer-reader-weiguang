import { useState } from "react";
import { Search, ArrowRight, MoreHorizontal, Filter, PlusCircle, X, Sparkles, Cpu, BookOpen, AlertCircle, Check, UploadCloud, Wifi, Cloud, Loader2, CheckCircle2, AlertTriangle, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import BookCover from "../components/BookCover";
import { Book } from "../data/books";

interface BookshelfViewProps {
  onOpenDetail?: () => void;
  onContinueReading?: () => void;
  books: Book[];
  selectedBookId: string;
  onSelectBook: (id: string) => void;
  onAddBook?: (book: Book) => void;
  isImportOpen?: boolean;
  onImportOpenChange?: (open: boolean) => void;
}

export default function BookshelfView({ 
  onOpenDetail, 
  onContinueReading,
  books,
  selectedBookId,
  onSelectBook,
  onAddBook,
  isImportOpen = false,
  onImportOpenChange
}: BookshelfViewProps) {
  // Find currently selected book to render at top
  const selectedBook = books.find(b => b.id === selectedBookId) || books[0];

  const [showToast, setShowToast] = useState(false);

  const handleContinueReading = () => {
    if (selectedBook.id === "guarding" || selectedBook.id === "pause") {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } else {
      onContinueReading?.();
    }
  };

  // Map local isModalOpen to the lifted state
  const isModalOpen = isImportOpen;
  const setIsModalOpen = (open: boolean) => {
    onImportOpenChange?.(open);
  };

  // File Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseSuccess, setParseSuccess] = useState(false);
  const [parseError, setParseError] = useState("");

  // Extracted Book Metadata State
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [coverType, setCoverType] = useState<"attention" | "guarding" | "pause">("guarding");

  const parseEpubFileName = (name: string) => {
    const cleanName = name.replace(/\.epub$/i, "").trim();
    
    // Pattern 1: 《书名》作者 或 《书名》 - 作者
    const bracketMatch = cleanName.match(/《([^》]+)》\s*-?\s*(.*)/);
    if (bracketMatch) {
      const parsedTitle = bracketMatch[1].trim();
      const parsedAuthor = bracketMatch[2].trim() || "未知作者";
      return { title: parsedTitle, author: parsedAuthor };
    }

    // Pattern 2: 书名 - 作者
    if (cleanName.includes("-")) {
      const parts = cleanName.split("-");
      const parsedTitle = parts[0].trim();
      const parsedAuthor = parts.slice(1).join("-").trim() || "未知作者";
      return { title: parsedTitle, author: parsedAuthor };
    }

    // Pattern 3: 书名_作者
    if (cleanName.includes("_")) {
      const parts = cleanName.split("_");
      const parsedTitle = parts[0].trim();
      const parsedAuthor = parts.slice(1).join("_").trim() || "未知作者";
      return { title: parsedTitle, author: parsedAuthor };
    }

    return { title: cleanName, author: "本地导入" };
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".epub")) {
      setParseError("仅支持导入 .epub 格式的电子书文件！");
      setSelectedFile(null);
      setParseSuccess(false);
      return;
    }

    setParseError("");
    setSelectedFile(file);
    setIsParsing(true);
    setParseSuccess(false);

    // Simulate EPUB parsing delay for a satisfying micro-interaction
    setTimeout(() => {
      const metadata = parseEpubFileName(file.name);
      setTitle(metadata.title);
      setAuthor(metadata.author);
      setIntroduction(`此书成功从本地 EPUB 文件 [${file.name}] 导入。排版结构完整，支持分章沉浸式阅读及心流环境配对。`);
      
      const types: ("attention" | "guarding" | "pause")[] = ["attention", "guarding", "pause"];
      const randomType = types[Math.floor(Math.random() * types.length)];
      setCoverType(randomType);

      setIsParsing(false);
      setParseSuccess(true);
    }, 1200);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setIsParsing(false);
    setParseSuccess(false);
    setParseError("");
    setTitle("");
    setAuthor("");
    setIntroduction("");
    setCoverType("guarding");
  };

  const handleImport = () => {
    if (!title.trim()) return;

    const newBook: Book = {
      id: `imported_${Date.now()}`,
      title: title.trim(),
      author: author.trim() || "佚名",
      coverType: coverType,
      progress: 0,
      introduction: introduction.trim() || "暂无此书简介内容。"
    };

    if (onAddBook) {
      onAddBook(newBook);
    }

    handleReset();
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar pt-[60px] pb-[100px] px-5">
      {/* Header */}
      <header className="flex justify-between items-center w-full mb-6 mt-2">
        <h1 className="text-[27px] font-bold text-primary tracking-tight select-none">我的书架</h1>
        <button className="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center text-primary transition-colors">
          <Search size={22} />
        </button>
      </header>

      {/* Featured Book Section */}
      <section className="flex flex-col gap-4 mb-10">
        <h2 className="text-[20px] font-semibold text-primary md:hidden">在读</h2>
        
        <div className="relative w-full rounded-3xl bg-surface-card p-4 shadow-lg shadow-surface-variant/20 flex flex-col items-center gap-5 group border border-border-light/50">
          
          {/* Book Cover */}
          <div className="w-40 aspect-[2/3] rounded-lg overflow-hidden flex-shrink-0 relative shadow-[0_20px_40px_rgba(45,60,68,0.3)] mt-2 border border-border-light/35">
            <BookCover 
              type={selectedBook.coverType} 
              title={selectedBook.title} 
              progress={selectedBook.progress}
            />
          </div>

          {/* Details */}
          <div className="flex flex-col flex-1 text-center items-center w-full">
            <h3 className="text-[24px] font-semibold text-primary mb-1 select-none">{selectedBook.title}</h3>
            <p className="text-[14px] text-text-secondary mb-6 select-none">{selectedBook.author}</p>
            
            {/* Action Bar */}
            <div className="flex w-full gap-3 justify-center items-center">
              <button 
                onClick={handleContinueReading}
                className="flex-1 py-3.5 bg-primary-container text-on-primary rounded-full text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-primary transition-colors active:scale-95 shadow-md shadow-primary-container/20"
              >
                继续阅读
                <ArrowRight size={18} />
              </button>
              <button 
                onClick={onOpenDetail}
                className="h-[48px] w-[54px] bg-white border border-border-light rounded-full flex items-center justify-center hover:bg-neutral-50 transition-colors active:scale-95 shadow-md shadow-surface-variant/10 shrink-0"
                aria-label="Book detail info"
              >
                <MoreHorizontal size={20} className="text-neutral-800" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Bookshelf Grid */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-[20px] font-semibold text-primary">藏书</h2>
          <button className="text-[13px] text-text-secondary hover:text-primary flex items-center gap-1 transition-colors">
            筛选 <Filter size={14} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-x-4 gap-y-6">
          {books.map((book) => {
            const isSelected = book.id === selectedBookId;
            return (
              <div 
                key={book.id} 
                onClick={() => onSelectBook(book.id)}
                className="flex flex-col group cursor-pointer active:scale-95 transition-all duration-200"
              >
                <div className={`relative w-full aspect-[2/3] rounded-lg overflow-hidden mb-2 shadow-sm border transition-all duration-300 ${
                  isSelected 
                    ? "border-primary-container ring-2 ring-primary-container/20 scale-102 shadow-md" 
                    : "border-border-light/50 hover:border-neutral-300"
                }`}>
                  <BookCover type={book.coverType} title={book.title} />
                  
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-[#2D3C44] text-white rounded-full w-[22px] h-[22px] flex items-center justify-center shadow-md animate-in fade-in zoom-in-75 duration-200">
                      <svg className="w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <h4 className={`text-[13px] font-medium truncate leading-tight transition-colors ${
                  isSelected ? "text-primary font-semibold" : "text-primary/90"
                }`}>{book.title}</h4>
                <p className="text-[11px] text-text-secondary truncate mt-0.5">{book.author}</p>
              </div>
            );
          })}

          {/* Add New Book Placeholder */}
          <div 
            onClick={() => setIsModalOpen(true)}
            className="flex flex-col group cursor-pointer active:scale-95 transition-transform animate-in fade-in duration-300"
          >
            <div className="relative w-full aspect-[2/3] rounded-lg border-2 border-dashed border-border-light hover:bg-accent-blue-tint/30 transition-colors mb-2 flex items-center justify-center bg-transparent">
              <PlusCircle size={28} className="text-primary/30" />
            </div>
            <h4 className="text-[13px] font-medium text-primary text-center leading-tight">添加书籍</h4>
          </div>
        </div>
      </section>

      {/* Book Import Dialog */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="absolute inset-0 z-[110] overflow-hidden flex flex-col justify-end pointer-events-none">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                handleReset();
                setIsModalOpen(false);
              }}
              className="absolute inset-0 bg-black/30 backdrop-blur-[3.5px] pointer-events-auto cursor-pointer"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", ease: "linear", duration: 0.18 }}
              className={`relative w-full ${parseSuccess ? "h-[82%]" : "h-[42%]"} bg-background text-on-surface rounded-t-[32px] shadow-2xl border-t border-border-light flex flex-col pointer-events-auto overflow-hidden transition-[height] duration-300`}
            >
              {/* Drawer handle */}
              <div className="w-12 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full mx-auto my-3 shrink-0" />

              {/* Modal Header */}
              <div className="px-5 pb-3 flex items-center justify-between border-b border-border-light shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-accent-blue-tint/60 text-[#4A6070] dark:text-sky-400">
                    <BookOpen size={18} />
                  </div>
                  <span className="text-[16px] font-bold text-primary tracking-tight">导入书籍</span>
                </div>
                <button 
                  onClick={() => {
                    handleReset();
                    setIsModalOpen(false);
                  }}
                  className="w-7 h-7 rounded-full bg-surface-variant hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-primary/70 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar pb-10">
                <div className="space-y-4">
                  {/* Drag and Drop Zone */}
                  {!parseSuccess && !isParsing && (
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleFileSelect(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => {
                        const fileInput = document.getElementById("epub-file-input");
                        fileInput?.click();
                      }}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                        isDragging 
                          ? "border-[#4A6070] bg-accent-blue-tint/40" 
                          : "border-border-light/80 hover:border-[#4A6070]/40 bg-surface-card"
                      }`}
                    >
                      <input 
                        type="file" 
                        id="epub-file-input" 
                        accept=".epub" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileSelect(e.target.files[0]);
                          }
                        }}
                      />
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-accent-blue-tint/50 flex items-center justify-center text-[#4A6070]">
                          <UploadCloud size={24} />
                        </div>
                        <span className="text-[13px] font-semibold text-primary">点击或拖拽文件到这里</span>
                        <span className="text-[11px] text-text-secondary">仅支持导入 .epub 格式的图书文件</span>
                      </div>
                    </div>
                  )}

                  {/* Error message */}
                  {parseError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl flex items-center gap-2 text-red-500 animate-in fade-in duration-200">
                      <AlertTriangle size={16} className="shrink-0" />
                      <span className="text-[11.5px] font-medium leading-tight">{parseError}</span>
                    </div>
                  )}

                  {/* Parsing Loading indicator */}
                  {isParsing && (
                    <div className="bg-surface-card border border-border-light/60 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 shadow-xs animate-in fade-in duration-200">
                      <Loader2 className="w-8 h-8 text-[#4A6070] animate-spin" />
                      <span className="text-[13px] font-semibold text-primary">正在解析 EPUB 文件...</span>
                      <span className="text-[11px] text-text-secondary">提取书籍元数据中</span>
                    </div>
                  )}

                  {/* Parsing Success Form preview */}
                  {parseSuccess && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                      <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-xl flex items-center gap-2 text-green-600">
                        <CheckCircle2 size={16} className="shrink-0" />
                        <span className="text-[11.5px] font-semibold">EPUB 文件解析成功</span>
                      </div>
                      
                      {/* Extracted Form */}
                      <div className="space-y-3.5 pt-1 font-sans">
                        <div className="grid grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-text-secondary mb-1">书籍名称</label>
                            <input 
                              type="text" 
                              value={title} 
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder="书籍名称"
                              className="w-full bg-surface-card border border-border-light/60 dark:border-zinc-800 rounded-xl px-3 py-2 text-[12px] text-primary focus:outline-none focus:ring-1 focus:ring-[#4A6070] transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-text-secondary mb-1">作者</label>
                            <input 
                              type="text" 
                              value={author} 
                              onChange={(e) => setAuthor(e.target.value)}
                              placeholder="作者姓名"
                              className="w-full bg-surface-card border border-border-light/60 dark:border-zinc-800 rounded-xl px-3 py-2 text-[12px] text-primary focus:outline-none focus:ring-1 focus:ring-[#4A6070] transition-colors"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-text-secondary mb-1">书籍简介</label>
                          <textarea 
                            value={introduction} 
                            onChange={(e) => setIntroduction(e.target.value)}
                            placeholder="编辑此书简介..."
                            className="w-full h-16 bg-surface-card border border-border-light/60 dark:border-zinc-800 rounded-xl px-3 py-2 text-[12px] text-primary focus:outline-none focus:ring-1 focus:ring-[#4A6070] transition-colors resize-none leading-relaxed"
                          />
                        </div>

                        {/* Artwork / Theme Choice WITH Live Multi-Previews */}
                        <div className="space-y-2">
                          <label className="block text-[11px] font-semibold text-text-secondary">配对封面视觉主题：</label>
                          
                          <div className="grid grid-cols-3 gap-2.5">
                            {(["guarding", "attention", "pause"] as const).map((type) => {
                              const isSelected = coverType === type;
                              const label = type === "guarding" ? "温暖大地" : type === "attention" ? "极简秩序" : "静止悬点";
                              const color = type === "guarding" ? "#E4A865" : type === "attention" ? "#4A6070" : "#87959A";
                              return (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => setCoverType(type)}
                                  className={`p-2 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                                    isSelected 
                                      ? "bg-surface-card text-primary border-[#4A6070] ring-1 ring-[#4A6070]/20 shadow-md scale-[1.02]" 
                                      : "bg-surface-card/45 hover:bg-surface-card text-neutral-600 border-border-light/60"
                                  }`}
                                >
                                  <div className="w-[42px] h-[58px] rounded-md overflow-hidden shadow-sm shrink-0 border border-border-light/30">
                                    <BookCover type={type} title="" />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: color }} />
                                    <span className="text-[10px] font-semibold leading-none">{label}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Inner Form Actions */}
                        <div className="pt-4 flex gap-3">
                          <button 
                            type="button"
                            onClick={() => {
                              handleReset();
                              setIsModalOpen(false);
                            }}
                            className="flex-1 py-3 bg-neutral-100 dark:bg-zinc-805 text-text-secondary hover:text-primary rounded-xl text-[13px] font-semibold transition-all cursor-pointer text-center border border-neutral-200/20"
                          >
                            取消
                          </button>
                          <button 
                            type="button"
                            onClick={handleImport}
                            disabled={!title.trim()}
                            className="flex-1 py-3 bg-[#4A6070] text-white rounded-xl text-[13px] font-semibold hover:bg-opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[#4A6070]/10 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            确认导入
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unavailable Alert Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 z-[200] pointer-events-none"
          >
            <div className="bg-zinc-900/95 dark:bg-neutral-800/95 backdrop-blur-md text-white border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-2.5 shadow-xl shadow-black/20 min-w-[200px] justify-center">
              <span className="text-[13px] font-medium tracking-wide">此书暂时无法阅读</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
