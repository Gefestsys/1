import Link from "next/link";
import IPhoneMockup from "@/components/iphone-mockup";
import TrainingDashboard from "@/components/training-dashboard";
import LaserFlow from "@/components/laser-flow";
import ClientHeroSection from "@/components/client-hero-section";
import ClientNavHeader from "@/components/client-nav-header";
import ClientRobotViewer from "@/components/client-robot-viewer";
import RadarVisualization from "@/components/radar-visualization";
import BentoGridSecondDemo from "@/components/bento-grid-demo-2";
import CarouselDemo from '@/components/carousel-demo';
import RobotsAnimation from "@/components/robots-animation";
import CryptoIconsPanel from "@/components/crypto-icons-panel";
import LightRays from "@/components/light-rays";
import AnimatedMeshBackground from "@/components/animated-mesh-background";
import FloatingLines from "@/components/floating-lines";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <ClientNavHeader />

      <main className="flex-1">
        <ClientHeroSection iPhoneMockup={<IPhoneMockup />} laserFlow={<LaserFlow className="w-full h-full" color="#22c55e" horizontalSizing={0.5} verticalSizing={3} wispDensity={1} wispSpeed={15} wispIntensity={5} flowSpeed={0.35} flowStrength={0.25} fogIntensity={0.85} fogScale={0.22} fogFallSpeed={0.6} decay={3} falloffStart={1.2} horizontalBeamOffset={0.18} verticalBeamOffset={0.12} coreScale={1.5} mouseSmoothTime={0.15} mouseTiltStrength={0.03} />} />

        <section id="features" className="border-t border-primary-foreground/20 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <LightRays
              raysOrigin="top-center"
              raysColor="#10b981"
              raysSpeed={0.8}
              lightSpread={2}
              rayLength={1.5}
              fadeDistance={0.8}
              saturation={0.6}
              mouseInfluence={0.15}
            />
          </div>
          <div className="mx-auto max-w-7xl relative z-10" style={{ padding: '85px 32px' }}>
            <div className="mb-[85px] sm:mb-[85px] flex flex-col items-center">
              <div className="text-[48px] font-bold leading-[48px] text-center bg-gradient-to-r from-foreground via-muted-foreground to-muted-foreground bg-clip-text text-transparent section-title-glow">Features</div>
              <p className="text-xl text-muted-foreground text-center mt-2 leading-7 max-w-[62ch]">
                Essential building blocks for rapid prototyping: cards, grids, and CTAs. Everything built with Tailwind, no inline styles.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              <div className="w-full">
                <RadarVisualization />
              </div>
              <div className="w-full">
                <BentoGridSecondDemo />
              </div>
            </div>
            <div className="mt-[64px] flex justify-center">
              <button className="px-5 py-[10.8px] mb-[15px] text-base font-medium rounded-md bg-gradient-to-b from-primary to-primary-foreground/80 text-primary shadow-sm hover:shadow-md transition-all">
                Launch
              </button>
            </div>
          </div>
        </section>

        <section id="robots" className="border-t border-primary-foreground/20 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <AnimatedMeshBackground
              primaryColor="#4b5563"
              secondaryColor="#6b7280"
              meshDensity={0.35}
              animationSpeed={0.5}
              noiseScale={1.5}
            />
          </div>
          <div className="mx-auto max-w-7xl relative z-10 px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <div className="mb-[85px] sm:mb-[85px] flex flex-col items-center">
              <div className="in-dev-badge mb-3">
                <span className="inline-block px-3 py-1 text-[13px] font-medium rounded-full border border-primary-foreground/10 bg-gradient-to-b from-primary-foreground/5 to-transparent text-muted-foreground/70 backdrop-blur-md shadow-sm tracking-wide">IN DEVELOPMENT</span>
              </div>

              <div className="text-[48px] font-bold leading-[48px] text-center bg-gradient-to-r from-foreground via-muted-foreground to-muted-foreground bg-clip-text text-transparent section-title-glow" style={{ paddingTop: '30px' }}>Trading robots under development</div>
              <p className="text-xl text-muted-foreground text-center mt-2 leading-7 max-w-[62ch]">
                We develop intelligent solutions for automated trading. Stay tuned for updates.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-stretch">
              <div className="w-full h-80 sm:h-96 lg:h-[480px] relative overflow-hidden">
                <div className="absolute inset-0 opacity-40 pointer-events-none">
                  <RobotsAnimation />
                </div>
                <div className="absolute inset-0">
                  <CryptoIconsPanel />
                </div>
                <div className="relative z-10 h-full">
                  <ClientRobotViewer className="h-full" />
                </div>
              </div>

              <div className="w-full flex flex-col justify-start gap-4 p-0 mt-6">
                <div className="space-y-4 -mt-6">
                  {/* Algorithm development */}
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-white/20 bg-black/80 backdrop-blur-sm shadow-lg hover:border-white/30 hover:bg-black/60 hover:shadow-xl transition">
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-primary-foreground/10">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary-foreground">
                        <path d="M8 9l-4 3 4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M16 9l4 3-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-muted-foreground">Algorithm development</div>
                      <div className="mt-2 h-2 w-[109%] bg-white/6 rounded-full overflow-hidden">
                        <div className="h-2 rounded-full w-[60%] progress-fill" />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground progress-label">60%</div>
                  </div>

                  {/* Risk management system */}
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-white/20 bg-black/80 backdrop-blur-sm shadow-lg hover:border-white/30 hover:bg-black/60 hover:shadow-xl transition">
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-primary-foreground/10">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary-foreground">
                        <path d="M12 2l8 4v6c0 5-3.58 9.74-8 11-4.42-1.26-8-6-8-11V6l8-4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-muted-foreground">Risk management system</div>
                      <div className="mt-2 h-2 w-[109%] bg-white/6 rounded-full overflow-hidden">
                        <div className="h-2 rounded-full w-[45%] progress-fill" />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground progress-label">45%</div>
                  </div>

                  {/* Perfomance optimization */}
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-white/20 bg-black/80 backdrop-blur-sm shadow-lg hover:border-white/30 hover:bg-black/60 hover:shadow-xl transition">
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-primary-foreground/10">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary-foreground">
                        <path d="M3 12h3l3-6 4 12 3-8 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-muted-foreground">Perfomance optimization</div>
                      <div className="mt-2 h-2 w-[109%] bg-white/6 rounded-full overflow-hidden">
                        <div className="h-2 rounded-full w-[15%] progress-fill" />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground progress-label">15%</div>
                  </div>

                  {/* Backtesting & Valitation */}
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-white/20 bg-black/80 backdrop-blur-sm shadow-lg hover:border-white/30 hover:bg-black/60 hover:shadow-xl transition">
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-primary-foreground/10">
                      <svg width="20" height="20" viewBox="0 0 24 24" className="text-primary-foreground" xmlns="http://www.w3.org/2000/svg">
                        <polyline points="4,16 9,11 13,14 19,8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="9" cy="11" r="1" fill="currentColor" />
                        <circle cx="13" cy="14" r="1" fill="currentColor" />
                        <circle cx="19" cy="8" r="1" fill="currentColor" />
                        <line x1="3" y1="20" x2="23" y2="20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                        <line x1="23" y1="4" x2="23" y2="20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-muted-foreground">Backtesting &amp; Valitation</div>
                      <div className="mt-2 h-2 w-[109%] bg-white/6 rounded-full overflow-hidden">
                        <div className="h-2 rounded-full w-[25%] progress-fill" />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground progress-label">25%</div>
                  </div>
                </div>

                {/* Carousel under the 4 cards */}
                <div className="mt-2 md:-mt-12 w-full">
                  <div className="w-full flex items-center justify-center">
                    <div className="w-full max-w-[640px] relative z-20">
                      <CarouselDemo />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        <div className="border-t border-primary-foreground/20 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <FloatingLines
              linesGradient={['#e947f5', '#2f4ba2']}
              enabledWaves={['top', 'middle', 'bottom']}
              lineCount={[4, 5, 6]}
              lineDistance={[8, 6, 4]}
              animationSpeed={0.8}
              interactive={true}
              bendRadius={3.0}
              bendStrength={-0.8}
              parallax={true}
              mixBlendMode="screen"
            />
          </div>

        <section id="ai-trading" className="relative z-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <div className="flex flex-col items-center gap-8 w-full">
              <div className="in-dev-badge mb-3">
                <span className="inline-block px-3 py-1 text-[13px] font-medium rounded-full border border-primary-foreground/10 bg-gradient-to-b from-primary-foreground/5 to-transparent text-muted-foreground/70 backdrop-blur-md shadow-sm tracking-wide">NEXT STEP</span>
              </div>
              <h1 className="text-5xl font-bold text-center text-foreground leading-none bg-gradient-to-r from-foreground via-muted-foreground to-muted-foreground bg-clip-text text-transparent" style={{textShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'}}>
                AI trading
              </h1>
              <p className="text-xl text-muted-foreground text-center max-w-[578px] leading-7">
                Launch UI makes it easy to build an unforgettable website that resonates with professional design-centric audiences.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              <div className="group relative rounded-xl border border-primary-foreground/10 p-7 bg-gradient-to-b from-primary-foreground/5 to-primary-foreground/1 hover:border-primary-foreground/20 hover:bg-gradient-to-b hover:from-primary-foreground/8 hover:to-primary-foreground/3 transition-all duration-300 backdrop-blur-md overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary-foreground/0 via-transparent to-primary-foreground/0 opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"></div>
                <div className="relative z-10 flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-foreground/12 to-primary-foreground/6 flex items-center justify-center group-hover:from-primary-foreground/16 group-hover:to-primary-foreground/10 transition-all duration-300">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary-foreground/70">
                      <path d="M3 3h18v18H3z" stroke="currentColor" strokeWidth="1.4"/>
                      <path d="M6 12l3-4 3 4 4-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  </div>
                </div>
                <h3 className="relative z-10 text-base font-semibold text-foreground mb-2">Predictive Analytics</h3>
                <p className="relative z-10 text-sm text-muted-foreground leading-6 mb-5">AI models for accurate price movement prediction</p>
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/50 group-hover:bg-emerald-500/80 transition-colors"></span>
                    LSTM Networks
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/50 group-hover:bg-emerald-500/80 transition-colors"></span>
                    Time Series Analysis
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/50 group-hover:bg-emerald-500/80 transition-colors"></span>
                    Pattern Recognition
                  </div>
                </div>
              </div>

              <div className="group relative rounded-xl border border-primary-foreground/10 p-7 bg-gradient-to-b from-primary-foreground/5 to-primary-foreground/1 hover:border-primary-foreground/20 hover:bg-gradient-to-b hover:from-primary-foreground/8 hover:to-primary-foreground/3 transition-all duration-300 backdrop-blur-md overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary-foreground/0 via-transparent to-primary-foreground/0 opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"></div>
                <div className="relative z-10 flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-foreground/12 to-primary-foreground/6 flex items-center justify-center group-hover:from-primary-foreground/16 group-hover:to-primary-foreground/10 transition-all duration-300">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary-foreground/70">
                      <path d="M4 6h16v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V6z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="4" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      <line x1="8" y1="14" x2="12" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      <line x1="8" y1="17" x2="16" y2="17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
                <h3 className="relative z-10 text-base font-semibold text-foreground mb-2">Sentiment Analysis</h3>
                <p className="relative z-10 text-sm text-muted-foreground leading-6 mb-5">Real-time market sentiment and news analysis</p>
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/50 group-hover:bg-emerald-500/80 transition-colors"></span>
                    NLP Processing
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/50 group-hover:bg-emerald-500/80 transition-colors"></span>
                    Social Media Analysis
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/50 group-hover:bg-emerald-500/80 transition-colors"></span>
                    News Sentiment
                  </div>
                </div>
              </div>

              <div className="group relative rounded-xl border border-primary-foreground/10 p-7 bg-gradient-to-b from-primary-foreground/5 to-primary-foreground/1 hover:border-primary-foreground/20 hover:bg-gradient-to-b hover:from-primary-foreground/8 hover:to-primary-foreground/3 transition-all duration-300 backdrop-blur-md overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary-foreground/0 via-transparent to-primary-foreground/0 opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"></div>
                <div className="relative z-10 flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-foreground/12 to-primary-foreground/6 flex items-center justify-center group-hover:from-primary-foreground/16 group-hover:to-primary-foreground/10 transition-all duration-300">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary-foreground/70">
                      <path d="M8 6h8v2H8V6z" fill="currentColor" opacity="0.3"/>
                      <path d="M3 8h18v10c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V8z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      <path d="M8 6h8c1.1 0 2 .9 2 2v0c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v0c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      <line x1="9" y1="12" x2="9" y2="16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      <line x1="15" y1="12" x2="15" y2="16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
                <h3 className="relative z-10 text-base font-semibold text-foreground mb-2">Portfolio Optimization</h3>
                <p className="relative z-10 text-sm text-muted-foreground leading-6 mb-5">Automatic portfolio optimization and rebalancing</p>
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/50 group-hover:bg-emerald-500/80 transition-colors"></span>
                    Risk Assessment
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/50 group-hover:bg-emerald-500/80 transition-colors"></span>
                    Portfolio Balancing
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/50 group-hover:bg-emerald-500/80 transition-colors"></span>
                    Dynamic Allocation
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        <section id="cases" className="relative z-10 pt-0 pb-20 px-8">
          <div className="max-w-[1312px] mx-auto flex flex-col items-center gap-24">
            <div className="flex justify-center items-center w-full">
              {/* Illustration */}
              <div className="flex min-w-[240px] p-0 flex-col items-stretch gap-0 flex-1 aspect-[180/101] min-h-[134.668px] h-[482px] relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute -left-[217px] -top-[285px] w-[859px] h-[482px]">
                  <svg width="859" height="482" viewBox="0 0 859 482" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_glow)">
                      <g filter="url(#filter0_f_glow)" />
                      <g filter="url(#filter1_f_glow)">
                        <ellipse cx="445" cy="124" rx="255" ry="74" fill="#FDBA74"/>
                      </g>
                    </g>
                    <defs>
                      <filter id="filter0_f_glow" x="-122" y="-267" width="1134" height="913" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                        <feGaussianBlur stdDeviation="156" result="effect1_foregroundBlur_glow"/>
                      </filter>
                      <filter id="filter1_f_glow" x="126" y="-14" width="638" height="276" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                        <feGaussianBlur stdDeviation="32" result="effect1_foregroundBlur_glow"/>
                      </filter>
                      <clipPath id="clip0_glow">
                        <rect width="1260" height="1069" fill="white" transform="translate(-185 -253)"/>
                      </clipPath>
                    </defs>
                  </svg>
                </div>

                {/* Frame */}
                <div className="flex w-full max-w-none p-0 flex-col items-stretch gap-0 relative z-10 h-full">
                  <div className="h-full w-full overflow-hidden">
                    <TrainingDashboard />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        </div>

        <section id="contacts" className="border-t border-primary-foreground/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <div className="rounded-2xl border border-primary-foreground/20 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-accent">
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Ready to start?</h3>
                <p className="text-sm text-muted-foreground mt-1">Contact us or start building right away.</p>
              </div>
              <button className="px-6 py-3 text-sm font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                Get started
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-primary-foreground/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">© 2025 SpikeTrading</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
