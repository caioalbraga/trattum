export function BodySilhouette() {
  return (
    <div className="relative w-full max-w-[200px] mx-auto">
      <svg viewBox="0 0 200 400" className="w-full h-auto text-primary/20">
        {/* Head */}
        <circle cx="100" cy="35" r="25" fill="currentColor" />
        {/* Neck */}
        <rect x="90" y="58" width="20" height="15" fill="currentColor" rx="4" />
        {/* Torso */}
        <path d="M60 73 Q50 73 48 85 L42 180 Q40 195 55 200 L80 205 Q100 208 120 205 L145 200 Q160 195 158 180 L152 85 Q150 73 140 73 Z" fill="currentColor" />
        {/* Left arm */}
        <path d="M48 85 Q30 90 25 120 L20 175 Q18 185 25 187 L32 187 Q38 185 38 175 L42 130 Q44 115 48 105" fill="currentColor" />
        {/* Right arm */}
        <path d="M152 85 Q170 90 175 120 L180 175 Q182 185 175 187 L168 187 Q162 185 162 175 L158 130 Q156 115 152 105" fill="currentColor" />
        {/* Left leg */}
        <path d="M65 200 L55 300 Q53 330 50 360 Q48 375 55 378 L68 378 Q75 375 73 360 L80 280 Q82 250 85 205" fill="currentColor" />
        {/* Right leg */}
        <path d="M135 200 L145 300 Q147 330 150 360 Q152 375 145 378 L132 378 Q125 375 127 360 L120 280 Q118 250 115 205" fill="currentColor" />
      </svg>

      {/* Measurement point indicators */}
      <div className="absolute top-[28%] left-[5%] flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <span className="text-[10px] font-medium text-primary">Braço</span>
      </div>
      <div className="absolute top-[25%] right-[5%] flex items-center gap-1">
        <span className="text-[10px] font-medium text-primary">Tórax</span>
        <div className="w-2 h-2 rounded-full bg-primary" />
      </div>
      <div className="absolute top-[42%] left-[5%] flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <span className="text-[10px] font-medium text-primary">Cintura</span>
      </div>
      <div className="absolute top-[50%] right-[5%] flex items-center gap-1">
        <span className="text-[10px] font-medium text-primary">Quadril</span>
        <div className="w-2 h-2 rounded-full bg-primary" />
      </div>
      <div className="absolute top-[72%] left-[10%] flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <span className="text-[10px] font-medium text-primary">Perna</span>
      </div>
    </div>
  );
}
