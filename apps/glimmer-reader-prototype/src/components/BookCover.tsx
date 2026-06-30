import bookCover from "../assets/images/regenerated_image_1781679921994.png";

export interface BookCoverProps {
  type: "attention" | "guarding" | "pause";
  title: string;
  className?: string;
  progress?: number;
}

export default function BookCover({ type, title, className = "w-full h-full object-cover", progress }: BookCoverProps) {
  if (type === "attention") {
    return (
      <div className="relative w-full h-full overflow-hidden">
        <img alt={title} className={className} src={bookCover} />
        {progress !== undefined && (
          /* Progress Bar Bottom */
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/25 backdrop-blur-sm">
            <div className="h-full bg-[#4A6070] rounded-r-full" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    );
  }

  if (type === "guarding") {
    return (
      <div className="relative w-full h-full bg-[#EAE5D9] overflow-hidden flex flex-col justify-center items-center shadow-inner">
        {/* Fine background abstract lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 150" fill="none">
          {/* Scribbles */}
          <path d="M-10 20 C20 -10, 40 40, 80 10 C100 -10, 110 50, 60 90 C10 130, -20 80, -10 20 Z" stroke="#3A2C1E" strokeWidth="0.12" opacity="0.35" />
          <path d="M50 -10 C90 30, 20 80, 80 120 C110 140, 40 160, 10 100 C-10 60, 20 -20, 50 -10 Z" stroke="#3A2C1E" strokeWidth="0.1" opacity="0.25" />
          <path d="M110 30 C50 60, 80 10, 20 50 C-10 80, 40 120, 90 90" stroke="#3A2C1E" strokeWidth="0.12" opacity="0.2" />
          
          {/* Small particles */}
          <circle cx="15" cy="45" r="0.6" fill="#3A2C1E" opacity="0.4" />
          <circle cx="20" cy="110" r="0.8" fill="#3A2C1E" opacity="0.3" />
          <circle cx="82" cy="75" r="0.5" fill="#3A2C1E" opacity="0.5" />
          <circle cx="78" cy="25" r="0.7" fill="#3A2C1E" opacity="0.4" />
          <circle cx="45" cy="130" r="0.5" fill="#3A2C1E" opacity="0.2" />

          {/* Main Gold Circle Frame */}
          <circle cx="50" cy="72" r="28" fill="url(#goldGradient)" stroke="#DAB686" strokeWidth="0.6" />
          
          {/* Sand Hills inside the circle */}
          <g mask="url(#circle-mask-inner)">
            {/* Dune back */}
            <path d="M20 92 C35 77, 55 87, 80 92 L80 110 L20 110 Z" fill="#E8B985" opacity="0.85" />
            {/* Dune mid */}
            <path d="M20 97 C45 82, 60 72, 80 84 L80 110 L20 110 Z" fill="#E09F5E" opacity="0.95" />
            {/* Dune front */}
            <path d="M20 103 C35 94, 55 92, 80 101 L80 110 L20 110 Z" fill="#C98443" />
            {/* Sun */}
            <circle cx="50" cy="62" r="2.2" fill="#E67E22" />
          </g>

          {/* Definitions */}
          <defs>
            <radialGradient id="goldGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF4DE" />
              <stop offset="50%" stopColor="#F9D4A1" />
              <stop offset="100%" stopColor="#E4A865" />
            </radialGradient>
            <mask id="circle-mask-inner">
              <circle cx="50" cy="72" r="27.6" fill="white" />
            </mask>
          </defs>
        </svg>

        {progress !== undefined && (
          /* Progress Bar Bottom */
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/25 backdrop-blur-sm">
            <div className="h-full bg-[#E4A865] rounded-r-full" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    );
  }

  if (type === "pause") {
    return (
      <div className="relative w-full h-full bg-[#FCFAF5] overflow-hidden flex flex-col justify-center items-center shadow-inner">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 150" fill="none">
          {/* Vertical splitting line */}
          <line x1="50" y1="0" x2="50" y2="150" stroke="#E2DEC6" strokeWidth="0.4" strokeDasharray="1.5 1.5" />
          <line x1="50" y1="0" x2="50" y2="150" stroke="#E5DAC5" strokeWidth="0.25" />

          {/* Left Side: Fine particles and bursts */}
          {/* Bezier burst streams */}
          <path d="M50 75 C30 75, 15 65, 0 50" stroke="#4F5E68" strokeWidth="0.18" opacity="0.65" />
          <path d="M50 75 C25 80, 10 95, -5 110" stroke="#4F5E68" strokeWidth="0.22" opacity="0.55" />
          <path d="M50 75 C35 70, 20 50, 5 35" stroke="#4F5E68" strokeWidth="0.15" opacity="0.45" />
          <path d="M50 75 C30 85, 15 115, 0 125" stroke="#4F5E68" strokeWidth="0.15" opacity="0.45" />
          <path d="M50 75 C20 70, 10 60, -5 55" stroke="#4F5E68" strokeWidth="0.18" opacity="0.5" />

          {/* Bursting dot particles */}
          <circle cx="40" cy="70" r="0.6" fill="#3D4A52" opacity="0.75" />
          <circle cx="35" cy="85" r="0.8" fill="#3D4A52" opacity="0.65" />
          <circle cx="28" cy="62" r="0.5" fill="#3D4A52" opacity="0.55" />
          <circle cx="22" cy="98" r="0.7" fill="#3D4A52" opacity="0.6" />
          <circle cx="15" cy="78" r="0.4" fill="#3D4A52" opacity="0.45" />
          <circle cx="12" cy="50" r="0.5" fill="#3D4A52" opacity="0.5" />
          <circle cx="8" cy="112" r="0.9" fill="#3D4A52" opacity="0.4" />
          <circle cx="5" cy="88" r="0.4" fill="#3D4A52" opacity="0.35" />

          {/* Right Side: Peaceful faint landscape hills */}
          <path d="M50 100 C62 95, 75 99, 100 90 L100 150 L50 150 Z" fill="#EFECE2" opacity="0.7" />
          <path d="M50 105 C68 98, 80 104, 100 95 L100 150 L50 150 Z" fill="#E8E4D5" opacity="0.8" />
          <path d="M50 115 C72 110, 85 116, 100 110 L100 150 L50 150 Z" fill="#DDD9C6" />

          {/* Central Pause Button */}
          <circle cx="50" cy="75" r="14.5" fill="#FCFAF5" stroke="#87959A" strokeWidth="0.4" />
          <circle cx="50" cy="75" r="13.2" fill="#FCFAF5" />
          {/* Pause symbol bars */}
          <rect x="46.2" y="69.5" width="2.3" height="11" rx="0.4" fill="#17262E" />
          <rect x="51.5" y="69.5" width="2.3" height="11" rx="0.4" fill="#17262E" />
        </svg>

        {progress !== undefined && (
          /* Progress Bar Bottom */
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/25 backdrop-blur-sm">
            <div className="h-full bg-[#87959A] rounded-r-full" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    );
  }

  return null;
}
