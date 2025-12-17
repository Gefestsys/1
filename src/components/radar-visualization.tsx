import './radar-animation.css';

export default function RadarVisualization() {
  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* Radar Illustration */}
      <div className="w-full max-w-[1248px] h-[290px] relative origin-center scale-[0.85] -translate-y-6">
        <svg
          className="w-full h-full flex-shrink-0"
          viewBox="0 0 1248 624"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_radar)">
            <rect width="1248" height="624" fill="#09090B" fillOpacity="0.01" />
            
            {/* Grid Lines */}
            <path d="M16 623.501L49 623.501M624 623.502L65 623.501" stroke="#059669" strokeOpacity="0.5" />
            <path d="M1232 623.502L1199 623.502M624 623.501L1183 623.502" stroke="#059669" strokeOpacity="0.5" />
            <path d="M624 15.5015L624 48.5015M624 623.502L624 64.5015" stroke="#059669" strokeOpacity="0.5" />
            <path d="M320 96.958L336.5 125.537M624 623.502L344.5 139.393" stroke="#059669" strokeOpacity="0.5" />
            <path d="M97.4564 319.502L126.035 336.002M624 623.502L139.892 344.002" stroke="#059669" strokeOpacity="0.5" />
            <path d="M1150.54 319.502L1121.96 336.002M624 623.502L1108.11 344.002" stroke="#059669" strokeOpacity="0.5" />
            <path d="M928.001 96.959L911.501 125.538M624 623.502L903.501 139.394" stroke="#059669" strokeOpacity="0.5" />
            
            {/* Concentric Circles */}
            <g filter="url(#filter0_i_radar)">
              <circle cx="624" cy="624" r="560" fill="#09090B" fillOpacity="0.01" />
            </g>
            <circle cx="624" cy="624" r="559.5" stroke="#10b981" strokeOpacity="0.6" />

            <g filter="url(#filter1_i_radar)">
              <circle cx="624" cy="624" r="436" fill="#09090B" fillOpacity="0.01" />
            </g>
            <circle cx="624" cy="624" r="435.5" stroke="#10b981" strokeOpacity="0.7" />

            <g filter="url(#filter2_i_radar)">
              <circle cx="624" cy="624" r="312" fill="#09090B" fillOpacity="0.01" />
            </g>
            <circle cx="624" cy="624" r="311.5" stroke="#10b981" strokeOpacity="0.8" />

            <g filter="url(#filter3_i_radar)">
              <circle cx="624" cy="624" r="188" fill="#09090B" fillOpacity="0.01" />
            </g>
            <circle cx="624" cy="624" r="187.5" stroke="#10b981" strokeOpacity="1" />
            
            {/* Glow Effects */}
            <g opacity="0.8" filter="url(#filter4_f_radar)">
              <circle cx="624" cy="624" r="88" fill="#10b981" />
            </g>
            <g opacity="0.8" filter="url(#filter5_f_radar)">
              <circle cx="624" cy="624" r="312" fill="#059669" fillOpacity="0.8" />
            </g>
            

            {/* Pulsing dots on radar - only visible when beam passes */}
            <circle cx="300" cy="400" r="4" fill="#10b981" className="radar-dot-animated" style={{ "--animation-delay": "-1.83s" } as React.CSSProperties} />
            <circle cx="450" cy="250" r="4" fill="#10b981" className="radar-dot-animated" style={{ "--animation-delay": "-1.32s" } as React.CSSProperties} />
            <circle cx="550" cy="350" r="4" fill="#10b981" className="radar-dot-animated" style={{ "--animation-delay": "-1.15s" } as React.CSSProperties} />
            <circle cx="750" cy="300" r="4" fill="#10b981" className="radar-dot-animated" style={{ "--animation-delay": "-0.54s" } as React.CSSProperties} />
            <circle cx="850" cy="450" r="4" fill="#10b981" className="radar-dot-animated" style={{ "--animation-delay": "-0.015s" } as React.CSSProperties} />
            <circle cx="200" cy="550" r="4" fill="#10b981" className="radar-dot-animated" style={{ "--animation-delay": "-2.235s" } as React.CSSProperties} />

            {/* Scanning beam field - 45 degree wedge */}
            <g className="radar-sweep-line">
              <path d="M 624 624 L 624 64 A 560 560 0 0 1 1020 228 Z" fill="#10b981" fillOpacity="0.3" />
            </g>
          </g>
          
          <defs>
            <filter id="filter0_i_radar" x="64" y="64" width="1120" height="1120" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
              <feOffset />
              <feGaussianBlur stdDeviation="64" />
              <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.059 0 0 0 0 0.588 0 0 0 0 0.412 0 0 0 0.02 0" />
              <feBlend mode="normal" in2="shape" result="effect1_innerShadow_radar" />
            </filter>
            <filter id="filter1_i_radar" x="188" y="188" width="872" height="872" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
              <feOffset />
              <feGaussianBlur stdDeviation="64" />
              <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.059 0 0 0 0 0.588 0 0 0 0 0.412 0 0 0 0.05 0" />
              <feBlend mode="normal" in2="shape" result="effect1_innerShadow_radar" />
            </filter>
            <filter id="filter2_i_radar" x="312" y="312" width="624" height="624" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
              <feOffset />
              <feGaussianBlur stdDeviation="64" />
              <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.059 0 0 0 0 0.588 0 0 0 0 0.412 0 0 0 0.1 0" />
              <feBlend mode="normal" in2="shape" result="effect1_innerShadow_radar" />
            </filter>
            <filter id="filter3_i_radar" x="436" y="436" width="376" height="376" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
              <feOffset />
              <feGaussianBlur stdDeviation="64" />
              <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.059 0 0 0 0 0.588 0 0 0 0 0.412 0 0 0 0.15 0" />
              <feBlend mode="normal" in2="shape" result="effect1_innerShadow_radar" />
            </filter>
            <filter id="filter4_f_radar" x="472" y="472" width="304" height="304" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="32" result="effect1_foregroundBlur_radar" />
            </filter>
            <filter id="filter5_f_radar" x="0" y="0" width="1248" height="1248" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="156" result="effect1_foregroundBlur_radar" />
            </filter>
            <clipPath id="clip0_radar">
              <rect width="1248" height="624" fill="white" />
            </clipPath>
          </defs>
        </svg>

        {/* Center Logo */}
        <div className="absolute left-1/2 top-[250px] -translate-x-1/2 flex w-[80px] h-[80px] justify-center items-center rounded-full border border-gray-50 bg-black shadow-2xl">
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center gap-4 w-full">
        <h3 className="w-full max-w-[1248px] text-center text-[30px] font-semibold leading-12 bg-gradient-to-r from-foreground via-muted-foreground to-muted-foreground bg-clip-text text-transparent section-title-glow">
          Quality you can trust. And build on.
        </h3>
        <p className="w-full max-w-[580px] text-center text-[15px] text-muted-foreground leading-7">
          You can trust that all of the designs are taking the full advantage of newest Figma's features and that code is written following best practices out there.
        </p>
      </div>
    </div>
  );
}
