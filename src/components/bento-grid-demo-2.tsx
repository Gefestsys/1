import React from "react";
import { cn } from "@/lib/utils";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import {
  IconClipboardCopy,
  IconFileBroken,
  IconSignature,
  IconTableColumn,
} from "@tabler/icons-react";

export default function BentoGridSecondDemo(): JSX.Element {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Top row with custom template */}
      <div className="grid grid-cols-1 gap-2 md:auto-rows-[14rem] md:[grid-template-columns:1.5fr_1fr_1fr]">
        {items.slice(0, 2).map((item, i) => (
          <BentoGridItem
            key={i}
            title={item.title}
            description={item.description}
            header={item.header}
            className={item.className}
            icon={item.icon}
          />
        ))}
      </div>

      {/* Bottom row with custom template: make right column 15% wider and position second item to column 3 */}
      <div className="mt-2 grid grid-cols-1 gap-2 md:auto-rows-[14rem] md:[grid-template-columns:1fr_1fr_1.15fr]">
        {items.slice(2).map((item, i) => (
          <BentoGridItem
            key={i}
            title={item.title}
            description={item.description}
            header={item.header}
            className={cn(item.className, i === 1 ? "md:col-start-3" : "")}
            icon={item.icon}
          />
        ))}
      </div>
    </div>
  );
}
const GlobeIllustration = () => (
  <div className="flex items-center justify-center w-full h-full overflow-visible relative -translate-y-7">
    <svg
      className="w-[340px] md:w-[190px] h-[300px] md:h-[190px]"
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="paint0_linear_globe_1" x1="265.895" y1="19.1145" x2="131.544" y2="80.6328" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FAFAFA"/>
          <stop offset="1" stopColor="#6EE7B7" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="paint0_linear_globe_2" x1="300.56" y1="18.1731" x2="164.156" y2="6.417" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FAFAFA" stopOpacity="0.7"/>
          <stop offset="0.395" stopColor="#6EE7B7" stopOpacity="0.1"/>
          <stop offset="1" stopColor="#6EE7B7" stopOpacity="0"/>
        </linearGradient>
        <filter id="filter0_d_globe_1" x="0" y="0" width="500" height="500" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset/>
          <feGaussianBlur stdDeviation="4"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0.831373 0 0 0 0 0.831373 0 0 0 0 0.847059 0 0 0 0.1 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_globe_1"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_globe_1" result="shape"/>
        </filter>
      </defs>

      <g filter="url(#filter0_d_globe_1)">
        <ellipse
          cx="240"
          cy="270"
          rx="118.704"
          ry="243.335"
          transform="rotate(-45 250 250)"
          stroke="url(#paint0_linear_globe_1)"
          strokeWidth="2"
          shapeRendering="crispEdges"
        />
      </g>

      <g filter="url(#filter0_d_globe_1)">
        <ellipse
          cx="230"
          cy="245"
          rx="86.5749"
          ry="216.161"
          transform="rotate(-105 250 250)"
          stroke="url(#paint0_linear_globe_2)"
          strokeWidth="2"
          shapeRendering="crispEdges"
        />
      </g>

      <image
        href="/images/Globe.png"
        x="73.5"
        y="73.5"
        width="353"
        height="353"
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  </div>
);

const RippleIllustration = () => (
  <div className="flex items-center justify-center w-full h-full relative overflow-visible transform scale-50 origin-center translate-y-3">
    <div className="relative z-10 flex items-center justify-center w-full h-full">
      {[...Array(11)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: `${128 + i * 17}px`,
            height: `${128 + i * 17}px`,
            borderColor: `rgba(250, 250, 250, ${0.5 - i * 0.042})`,
            borderWidth: '1px'
          }}
        />
      ))}
      <div className="absolute w-32 h-32 rounded-full bg-gradient-to-b from-emerald-600/60 to-emerald-600/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] flex items-center justify-center">
        <div className="w-full h-full rounded-full border border-black/10 bg-gradient-to-t from-foreground/5 to-foreground/20 shadow-[0_0_8px_0_rgba(110,231,183,0.4),0_0_32px_0_rgba(5,150,105,0.3),0_0_48px_0_rgba(5,150,105,0.2),0_0_64px_0_rgba(5,150,105,0.1)]" />
      </div>
    </div>
  </div>
);

const TilesIllustration = () => {
  const tileCount = 12;

  // Start indices for each column within the 0..11 sequence
  const startIndexMap: Record<number, number> = { 1: 0, 2: 2, 3: 5, 4: 7, 5: 10 };

  return (
    <div className="flex items-center justify-center w-full h-full relative overflow-visible transform scale-50 origin-center">
      <div
        className={cn(
          "relative z-10 grid gap-4 p-8",
          "[grid-template-columns:repeat(5,_1fr)]",
          "[grid-auto-rows:80px]",
          "[grid-auto-flow:dense]",
          "[mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,_black_50%,_transparent_100%)]",
          "[-webkit-mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,_black_50%,_transparent_100%)]",
        )}
      >
        {[...Array(tileCount)].map((_, i) => {
          const gridCol = i <= 1 ? 1 : i <= 4 ? 2 : i <= 6 ? 3 : i <= 9 ? 4 : 5;
          const isStaggeredColumn = gridCol === 2 || gridCol === 4;
          const positionInCol = i - startIndexMap[gridCol] + 1; // 1-based

          // Activation rules per column:
          const isActive =
            (gridCol === 1 && positionInCol === 2) ||
            (gridCol === 2 && positionInCol === 2) ||
            (gridCol === 3 && (positionInCol === 1 || positionInCol === 2)) ||
            (gridCol === 4 && positionInCol === 2) ||
            (gridCol === 5 && positionInCol === 2);

          return (
            <div
              key={i}
              className={cn(
                "tile-cell w-20 h-20 rounded-lg border-4 border-background/20",
                // Background: base for non-active, brighter green for active (only one set applied at a time)
                !isActive && "bg-gradient-to-t from-transparent to-foreground/5",
                isActive && "bg-gradient-to-t from-transparent to-emerald-600/15",
                // Place into columns 1..5 using arbitrary property utility
                gridCol === 1 && "[grid-column:1]",
                gridCol === 2 && "[grid-column:2]",
                gridCol === 3 && "[grid-column:3]",
                gridCol === 4 && "[grid-column:4]",
                gridCol === 5 && "[grid-column:5]",
                // Stagger specific columns upwards by 42px
                isStaggeredColumn ? "-translate-y-[42px]" : "",
                // Activated visual effect: keep border width, change border color and faint glow
                isActive &&
                  "tile-active border-emerald-500/15 shadow-[0_0_4px_0_rgba(16,185,129,0.08)]",
              )}
            />
          );
        })}
      </div>
    </div>
  );
};

const ChatIllustration = () => (
  <div className="flex items-center justify-center w-full h-full relative overflow-visible transform scale-75 -translate-y-6 origin-center">
    <svg
      className="w-[390px] md:w-[240px] h-[330px] md:h-[240px]"
      viewBox="0 0 320 270"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="guide_drop" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="6" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.02 0 0 0 0 0.06 0 0 0 0 0.04 0 0 0 0.25 0" />
        </filter>
      </defs>

      {/* soft outline glow */}
      <g filter="url(#guide_drop)">
        <ellipse cx="160" cy="135" rx="140" ry="115" stroke="rgba(110,231,183,0.12)" strokeWidth="1.6" fill="none" />
      </g>

      <g strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* open guide / manual - outlines only */}
        <g transform="translate(50,38)">
          <rect x="0" y="0" width="200" height="140" rx="10" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" fill="none" />
          <rect x="8" y="10" width="184" height="120" rx="6" stroke="rgba(110,231,183,0.55)" strokeWidth="1.4" fill="none" />

          {/* page lines (white) */}
          <g stroke="rgba(255,255,255,0.75)" strokeWidth="1.4">
            <line x1="20" y1="26" x2="150" y2="26" />
            <line x1="20" y1="44" x2="150" y2="44" />
            <line x1="20" y1="62" x2="150" y2="62" />
            <line x1="20" y1="80" x2="150" y2="80" />
            <line x1="20" y1="98" x2="150" y2="98" />
            <line x1="20" y1="116" x2="150" y2="116" />
          </g>

          {/* checklist box on the right (green lines) */}
          <g transform="translate(126,12)">
            <rect x="0" y="0" width="64" height="112" rx="6" stroke="rgba(110,231,183,0.6)" strokeWidth="1.4" fill="none" />
            <g stroke="rgba(110,231,183,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="10,22 20,32 44,8" fill="none" />
              <polyline points="10,56 20,66 44,42" fill="none" />
              <polyline points="10,90 20,100 44,76" fill="none" />
            </g>
          </g>

          {/* spine (white hint) */}
          <rect x="-6" y="8" width="6" height="120" rx="2" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" fill="none" />
        </g>

        {/* cursor model (mouse pointer) - outline and subtle click ring */}
        <g transform="translate(255,170) rotate(-15)" aria-hidden="true">
          {/* larger cursor image, moved lower */}
          <image
            href="/images/cursor.webp"
            width="55"
            height="50"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          />
        </g>

      </g>
    </svg>
  </div>
);

const items = [
  {
    title: "The Art of Design",
    description: "Discover the beauty of thoughtful and functional design.",
    header: <GlobeIllustration />,
    className: "md:col-span-1",
    icon: <IconSignature className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "The Power of Communication",
    description:
      "Understand the impact of effective communication in our lives.",
    header: <RippleIllustration />,
    className: "md:col-span-2",
    icon: <IconTableColumn className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "The Dawn of Innovation",
    description: "Explore the birth of groundbreaking ideas and inventions.",
    header: <TilesIllustration />,
    className: "md:col-span-2",
    icon: <IconClipboardCopy className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "The Digital Revolution",
    description: "Dive into the transformative power of technology.",
    header: <ChatIllustration />,
    className: "md:col-span-1",
    icon: <IconFileBroken className="h-4 w-4 text-neutral-500" />,
  },
];
