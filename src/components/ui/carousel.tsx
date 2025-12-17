"use client";

"use client";
import { IconArrowNarrowRight } from "@tabler/icons-react";
import React, { useEffect, useRef, useState, useId } from "react";

export interface SlideItem {
  title: string;
  button?: string;
  content: React.ReactNode;
}

interface SlideProps {
  slide: SlideItem;
  index: number;
  current: number;
  onClick: (index: number) => void;
}

const Slide = ({ slide, index, current, onClick }: SlideProps) => {
  const slideRef = useRef<HTMLLIElement>(null);
  const xRef = useRef(0);
  const yRef = useRef(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    const animate = () => {
      if (!slideRef.current) return;
      const x = xRef.current;
      const y = yRef.current;
      slideRef.current.style.setProperty("--x", `${x}px`);
      slideRef.current.style.setProperty("--y", `${y}px`);
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const handleMouseMove = (event: React.MouseEvent) => {
    const el = slideRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    xRef.current = event.clientX - (r.left + Math.floor(r.width / 2));
    yRef.current = event.clientY - (r.top + Math.floor(r.height / 2));
  };

  const handleMouseLeave = () => {
    xRef.current = 0;
    yRef.current = 0;
  };

  const { title, button, content } = slide;

  return (
    <div className="[perspective:1200px] [transform-style:preserve-3d]">
      <li
        ref={slideRef}
        className={`flex flex-none flex-col items-start justify-start relative text-left text-white opacity-100 w-[37vmin] h-[34vmin] mx-[2vmin] z-10 carousel-slide ${current === index ? 'active' : 'inactive'}`}
        onClick={() => onClick(index)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={`absolute top-0 left-0 w-full h-full transition-all duration-150 ease-out carousel-parallax ${current === index ? 'parallax' : ''} overflow-hidden` }
        >
          {/* Content container (no images) */}
          <div className="relative inset-0 p-2 sm:p-3 flex flex-col gap-1 h-full">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md border border-primary-foreground/20 bg-accent/50 shadow-sm">
                <h3 className="text-[12px] sm:text-sm font-medium leading-5 text-muted-foreground tracking-normal">{title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative inline-flex items-center justify-center">
                  <span className="absolute inline-flex w-2 h-2 rounded-full bg-emerald-500 opacity-60 animate-ping"></span>
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500"></span>
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">Live market data</span>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center min-h-0">
              <div className="carousel-content w-full h-full flex items-center justify-center overflow-hidden">{content}</div>
            </div>
          </div>
        </div>
      </li>
    </div>
  );
};

interface CarouselControlProps { type: "previous" | "next"; title: string; onClick: () => void }

const CarouselControl = ({ type, title, onClick }: CarouselControlProps) => (
  <button
    className={`w-11 h-11 flex items-center mx-2 justify-center bg-white/5 dark:bg-white/6 border rounded-full border-primary-foreground/20 dark:border-primary-foreground/30 shadow-[0_6px_14px_rgba(2,6,23,0.45)] hover:scale-105 active:scale-95 transform transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6D64F7] ${type === "previous" ? "rotate-180" : ""}`}
    title={title}
    onClick={onClick}
    aria-label={title}
  >
    <IconArrowNarrowRight className="text-foreground/90 dark:text-foreground" />
  </button>
);

import { createPortal } from 'react-dom';

export default function Carousel({ slides }: { slides: SlideItem[] }) {
  const [current, setCurrent] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [ctrlRect, setCtrlRect] = useState<{ left: number; top: number; width: number } | null>(null);

  const previous = () => setCurrent((c) => (c - 1 < 0 ? slides.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c + 1 === slides.length ? 0 : c + 1));
  const select = (i: number) => { if (current !== i) setCurrent(i); };

  useEffect(() => {
    const update = () => {
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const extra = 1.5 * rem; // matches w-[calc(100%+1.5rem)]
      const SHIFT_X = 12; // px — manual horizontal adjustment to move controls right
      const left = r.left - extra / 2 + window.scrollX + SHIFT_X;
      const top = r.top + r.height * 0.97 + 0.45 * rem + window.scrollY;
      const width = r.width + extra;
      setCtrlRect({ left, top, width });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { passive: true });
    const obs = new ResizeObserver(update);
    if (rootRef.current) obs.observe(rootRef.current);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update as any);
      obs.disconnect();
    };
  }, [slides.length]);

  const headingId = useId();
  return (
    <>
      <div ref={rootRef} className="relative w-[35vmin] h-[35vmin] mx-auto" aria-labelledby={headingId} role="region">
        <h2 id={headingId} className="sr-only">Carousel</h2>
        <ul className="absolute flex mx-[-2vmin] carousel-list" style={{ ['--offset' as any]: `${current * (100 / slides.length)}%` }}>
          {slides.map((slide, index) => (
            <Slide key={index} slide={slide} index={index} current={current} onClick={select} />
          ))}
        </ul>
      </div>

      {typeof document !== 'undefined' && ctrlRect && createPortal(
        <div style={{ position: 'absolute', left: `${ctrlRect.left}px`, top: `${ctrlRect.top}px`, width: `${ctrlRect.width}px`, display: 'flex', justifyContent: 'center', zIndex: 30, pointerEvents: 'auto' }}>
          <CarouselControl type="previous" title="Go to previous slide" onClick={previous} />
          <CarouselControl type="next" title="Go to next slide" onClick={next} />
        </div>,
        document.body
      )}
    </>
  );
}
