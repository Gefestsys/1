"use client";

import { useEffect, useRef, ReactNode } from "react";

export default function ClientHeroSection({
  iPhoneMockup,
  laserFlow,
}: {
  iPhoneMockup: ReactNode;
  laserFlow: ReactNode;
}) {
  const revealImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const el = revealImgRef.current;
      if (!el) return;
      const ir = el.getBoundingClientRect();
      const x = e.clientX - ir.left;
      const y = e.clientY - ir.top;
      if (x >= 0 && y >= 0 && x <= ir.width && y <= ir.height) {
        el.style.setProperty('--mx', `${x}px`);
        el.style.setProperty('--my', `${y}px`);
      } else {
        el.style.setProperty('--mx', `-9999px`);
        el.style.setProperty('--my', `-9999px`);
      }
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 pt-20 sm:pt-25 pb-0 flex flex-col items-center gap-[45px]">
        <div className="flex flex-col items-center gap-[32px] w-[87%] mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-semibold leading-none text-center self-start max-w-[623px] bg-gradient-to-r from-foreground via-muted-foreground to-muted-foreground bg-clip-text text-transparent" style={{textShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'}}>
            Get the Edge in the Market
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground text-center max-w-xl leading-relaxed mr-auto ml-[20px]">
            Landing page kit template with React, Shadcn/ui and Tailwind that you can copy/paste into your project.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 self-start w-full max-w-[623px] ml-[20px]">
            <button className="px-4 py-2 text-sm font-medium rounded-md bg-gradient-to-b from-primary to-primary-foreground/80 text-primary shadow-sm hover:shadow-md transition-all">
              Get started
            </button>
            <button className="px-4 py-2 text-sm font-medium rounded-md border border-primary-foreground/20 bg-gradient-to-b from-primary-foreground/5 to-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition-all">
              Github
            </button>
          </div>
        </div>

        <div className="relative w-full max-w-5xl">
          <div className="relative rounded-2xl bg-primary p-2 sm:p-2 z-10"
               style={{
                 boxShadow: `
                   0 0 100px rgba(34, 197, 94, 0.4),
                   0 0 200px rgba(34, 197, 94, 0.3),
                   0 0 300px rgba(34, 197, 94, 0.2),
                   0 0 400px rgba(34, 197, 94, 0.1)
                 `
               }}>
            <div className="absolute -inset-8 rounded-3xl pointer-events-none"
                 style={{
                   background: `radial-gradient(ellipse at center, rgba(34, 197, 94, 0.15) 0%, transparent 70%)`,
                   filter: 'blur(20px)'
                 }}></div>

            <div className="relative rounded-xl border border-white/20 overflow-hidden bg-primary">
              <img
                src="/images/Dashboard.png"
                alt="Dashboard mockup showing analytics interface"
                className="w-full h-auto aspect-[607/371] object-cover opacity-90"
              />

              <div className="absolute bottom-2 right-2 z-20 w-[clamp(72px,24.2%,242px)] aspect-[391/800]">
                {iPhoneMockup}
              </div>
            </div>

            <div className="absolute inset-2 rounded-xl bg-gradient-to-b from-transparent from-0% via-transparent via-60% to-background/95 to-100% pointer-events-none"></div>
          </div>

          <div className="pointer-events-none absolute -top-[120%] right-[2%] h-[316%] w-[110%] z-0">
            {laserFlow}
          </div>

          <div className="absolute top-[-980px] right-[2%] left-[-32px] h-[216%] w-[1625px] z-20 pointer-events-none">
            <img
              ref={revealImgRef}
              src="/images/graph.webp"
              alt="Reveal reference"
              className="laser-reveal-small" style={{ transform: 'translateX(calc(-50% - 280px))' }}
            />
          </div>

          <div className="absolute left-1/4 top-1/4 w-32 h-32 rounded-full bg-green-400/20 blur-3xl pointer-events-none"></div>
          <div className="absolute right-1/4 top-1/3 w-24 h-24 rounded-full bg-green-300/25 blur-2xl pointer-events-none"></div>
          <div className="absolute left-1/3 bottom-1/4 w-40 h-20 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none"></div>
        </div>
      </div>
    </section>
  );
}
