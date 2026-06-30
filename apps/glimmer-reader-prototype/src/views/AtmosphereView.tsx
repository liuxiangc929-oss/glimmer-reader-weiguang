import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ChevronRight, CloudRain, Wind, Waves, Volume2, VolumeX, Pause, Play, Brain, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import BookCover from "../components/BookCover";
import { Book } from "../data/books";
import dengTataLying from "../assets/images/deng_tata_lying.png";

type NoiseType = "rain" | "wind" | "waves" | "none";

interface AtmosphereViewProps {
  onClose: () => void;
  onEnterReading: () => void;
  activeBook: Book;
}

export default function AtmosphereView({ onClose, onEnterReading, activeBook }: AtmosphereViewProps) {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("此书暂时无法阅读");
  const toastTimeoutRef = useRef<any>(null);

  const triggerToast = (message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    setShowToast(true);
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  const handleCompanionClick = () => {
    triggerToast("敬请期待~");
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const [selectedNoise, setSelectedNoise] = useState<NoiseType>(() => {
    try {
      const stored = localStorage.getItem("ambientNoiseType");
      return (stored as NoiseType) || "waves";
    } catch {
      return "waves";
    }
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("isAmbientPlaying");
      return stored !== null ? stored === "true" : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("ambientNoiseType", selectedNoise);
    } catch (e) {
      console.warn("Failed to save ambientNoiseType:", e);
    }
  }, [selectedNoise]);

  useEffect(() => {
    try {
      localStorage.setItem("isAmbientPlaying", String(isPlaying));
    } catch (e) {
      console.warn("Failed to save isAmbientPlaying:", e);
    }
  }, [isPlaying]);
  
  // Audios refs for Web Audio synth if no physical assets, or standard custom audio
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Filter & Synth setup for procedural white noise
  const startProceduralNoise = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Stop previous noise
      stopProceduralNoise();

      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Simple Pink Noise generation algorithm for pleasant listening
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; // rescale
        b6 = white * 0.115926;
      }

      const whiteNoiseSource = ctx.createBufferSource();
      whiteNoiseSource.buffer = noiseBuffer;
      whiteNoiseSource.loop = true;

      // Filter settings depending on the noise type selected
      const filter = ctx.createBiquadFilter();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      if (selectedNoise === "rain") {
        // High frequency wash with modulation
        filter.type = "bandpass";
        filter.frequency.value = 1000;
        filter.Q.value = 1.2;

        lfo.type = "sine";
        lfo.frequency.value = 0.5; // low modulation for rain bursts
        lfoGain.gain.value = 300;
        
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
      } else if (selectedNoise === "wind") {
        // Low pitch, heavy sweep filter
        filter.type = "lowpass";
        filter.frequency.value = 400;
        filter.Q.value = 2.0;

        lfo.type = "sine";
        lfo.frequency.value = 0.15; // slow sweeping wind
        lfoGain.gain.value = 150;

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
      } else if (selectedNoise === "waves") {
        // Sweeping ocean wave breaker
        filter.type = "lowpass";
        filter.frequency.value = 350;
        filter.Q.value = 1.0;

        lfo.type = "sine";
        lfo.frequency.value = 0.08; // extremely slow tide sweep (12 seconds)
        lfoGain.gain.value = 250;

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
      }

      const gainNode = ctx.createGain();
      // Set peaceful default volume
      gainNode.gain.setValueAtTime(0.12, ctx.currentTime);

      whiteNoiseSource.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      whiteNoiseSource.start(0);

      noiseSourceRef.current = whiteNoiseSource as any;
      gainNodeRef.current = gainNode;
    } catch (e) {
      console.warn("Web Audio is restricted or unsupported by browser sandbox", e);
    }
  };

  const stopProceduralNoise = () => {
    if (noiseSourceRef.current) {
      try {
        (noiseSourceRef.current as any).stop();
      } catch (err) {}
      noiseSourceRef.current = null;
    }
  };

  useEffect(() => {
    if (isPlaying && selectedNoise !== "none") {
      startProceduralNoise();
    } else {
      stopProceduralNoise();
    }
    return () => {
      stopProceduralNoise();
    };
  }, [isPlaying, selectedNoise]);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleEnterReading = () => {
    if (activeBook.id === "guarding" || activeBook.id === "pause") {
      triggerToast("此书暂时无法阅读");
    } else {
      stopProceduralNoise();
      onEnterReading();
    }
  };

  return (
    <div className="flex-1 w-full h-full overflow-hidden bg-background flex flex-col relative" id="atmosphere-view-root">
      <AnimatePresence mode="wait">
        <motion.div
          key="settings"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="flex-1 w-full h-full flex flex-col pt-[60px] pb-[100px] overflow-y-auto no-scrollbar"
        >
          {/* Top AppBar */}
          <header className="flex items-center justify-between px-5 h-14 w-full shrink-0">
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-surface-variant/50 active:scale-95 transition-all text-primary cursor-pointer"
              aria-label="返回"
            >
              <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
            <h1 className="text-lg font-semibold text-primary">氛围设置</h1>
            <div className="w-10 h-10"></div> {/* Spacer for centering */}
          </header>

          {/* Custom Content area */}
          <div className="flex-1 px-5 flex flex-col gap-6 pt-2">
            {/* Book Cover Section */}
            <section className="flex flex-col items-center mt-2 relative">
              {/* Decorative background glow using the theme color */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent-blue-tint rounded-full blur-3xl opacity-50 -z-10"></div>
              <div className="w-36 h-48 rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(45,60,68,0.3)] border border-border-light relative group bg-surface-card transition-transform duration-500 hover:scale-105">
                <BookCover 
                  type={activeBook.coverType} 
                  title={activeBook.title} 
                />
              </div>
              <div className="mt-4 text-center">
                <h2 className="text-[20px] font-bold text-primary">《{activeBook.title}》</h2>
                <p className="text-[13px] text-text-secondary mt-1">{activeBook.author}</p>
              </div>
            </section>

            {/* Companion Section */}
            <section 
              onClick={handleCompanionClick}
              className="bg-surface-card rounded-[22px] p-4 shadow-[0_10px_20px_rgba(45,60,68,0.04)] border border-border-light/60 flex items-center justify-between hover:bg-neutral-50/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-[52px] h-[52px] flex items-center justify-center overflow-visible shrink-0 relative z-20">
                  <img 
                    alt="Deng Tata Avatar" 
                    className="w-full h-full object-contain opacity-95 filter drop-shadow-[0_6px_12px_rgba(45,60,68,0.12)] scale-[1.4] origin-center translate-y-[2px]" 
                    src={dengTataLying} 
                  />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-primary">当前陪伴</h3>
                  <p className="text-[12px] text-text-secondary mt-0.5">灯獭獭</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-text-secondary/60" />
            </section>

            {/* White Noise Selection */}
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[14px] font-semibold text-primary">环境白噪音</h3>
                {selectedNoise !== "none" && (
                  <button 
                    onClick={() => triggerToast("敬请期待~")}
                    className={`flex items-center gap-2 text-[13px] font-semibold px-4 py-1.5 rounded-full border transition-all duration-300 transform active:scale-95 cursor-pointer shadow-sm ${
                      isPlaying 
                        ? "bg-[#4A6070] border-[#4A6070] text-white hover:bg-[#3D5260]" 
                        : "bg-white border-zinc-200 text-zinc-700 hover:text-[#4A6070] hover:border-[#4A6070]"
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Pause size={12} className="fill-current" />
                        <span>暂停</span>
                      </>
                    ) : (
                      <>
                        <Play size={12} className="fill-current" />
                        <span>播放</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {/* Ocean Waves */}
                <button 
                  onClick={() => triggerToast("敬请期待~")}
                  className={`bg-surface-card rounded-[20px] p-3 flex flex-col items-center justify-center gap-2 h-24 border transition-all soft-shadow relative overflow-hidden active:scale-95 duration-200 ${
                    selectedNoise === "waves" 
                      ? "border-[#4A6070] bg-accent-blue-tint/30 shadow-[0_8px_20px_rgba(74,96,112,0.1)]" 
                      : "border-transparent hover:bg-neutral-50"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    selectedNoise === "waves" ? "bg-[#4A6070] text-white" : "bg-surface-container text-text-secondary"
                  }`}>
                    <Waves size={18} />
                  </div>
                  <span className={`text-[12px] font-medium transition-colors ${
                    selectedNoise === "waves" ? "text-primary" : "text-text-secondary"
                  }`}>海浪</span>
                </button>

                {/* Rain */}
                <button 
                  onClick={() => triggerToast("敬请期待~")}
                  className={`bg-surface-card rounded-[20px] p-3 flex flex-col items-center justify-center gap-2 h-24 border transition-all soft-shadow relative overflow-hidden active:scale-95 duration-200 ${
                    selectedNoise === "rain" 
                      ? "border-[#4A6070] bg-accent-blue-tint/30 shadow-[0_8px_20px_rgba(74,96,112,0.1)]" 
                      : "border-transparent hover:bg-neutral-50"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    selectedNoise === "rain" ? "bg-[#4A6070] text-white" : "bg-surface-container text-text-secondary"
                  }`}>
                    <CloudRain size={18} />
                  </div>
                  <span className={`text-[12px] font-medium transition-colors ${
                    selectedNoise === "rain" ? "text-primary" : "text-text-secondary"
                  }`}>细雨</span>
                </button>

                {/* Wind */}
                <button 
                  onClick={() => triggerToast("敬请期待~")}
                  className={`bg-surface-card rounded-[20px] p-3 flex flex-col items-center justify-center gap-2 h-24 border transition-all soft-shadow relative overflow-hidden active:scale-95 duration-200 ${
                    selectedNoise === "wind" 
                      ? "border-[#4A6070] bg-accent-blue-tint/30 shadow-[0_8px_20px_rgba(74,96,112,0.1)]" 
                      : "border-transparent hover:bg-neutral-50"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    selectedNoise === "wind" ? "bg-[#4A6070] text-white" : "bg-surface-container text-text-secondary"
                  }`}>
                    <Wind size={18} />
                  </div>
                  <span className={`text-[12px] font-medium transition-colors ${
                    selectedNoise === "wind" ? "text-primary" : "text-text-secondary"
                  }`}>微风</span>
                </button>
              </div>
            </section>
          </div>

          {/* Fixed Bottom Action Button */}
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background via-background to-transparent pt-12 pb-8 px-5 z-40">
            <div className="w-full">
              <button 
                onClick={handleEnterReading}
                className="w-full h-14 bg-primary-container rounded-full flex items-center justify-center text-white soft-shadow hover:opacity-95 active:scale-[0.98] transition-all duration-200"
              >
                <span className="text-[15px] font-medium tracking-wide">进入阅读</span>
              </button>
            </div>
          </div>
        </motion.div>
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
              <span className="text-[13px] font-medium tracking-wide">{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
