"use client";

import { useState, useEffect } from "react";

interface Point {
  x: number;
  y: number;
}

interface MAData {
  pathData: string;
  maxY: number;
  minY: number;
}

function generateRandomMovingAverage(): MAData {
  const points: Point[] = [];
  const baseY = 440;
  const amplitude = 60;
  const frequency = 0.3;

  for (let i = 0; i <= 12; i++) {
    const x = (i / 12) * 800;
    const randomWave = Math.sin(i * frequency + Math.random() * Math.PI) * amplitude;
    const randomNoise = (Math.random() - 0.5) * 20;
    const y = baseY - randomWave - randomNoise;
    points.push({ x, y });
  }

  const yValues = points.map(p => p.y);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  let pathData = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathData += ` L ${points[i].x} ${points[i].y}`;
  }

  return { pathData, maxY, minY };
}

const ANIMATION_DURATION = 5000;

export default function RobotsAnimation() {
  const [maData, setMAData] = useState<MAData>({ pathData: "", maxY: 0, minY: 0 });
  const [animationKey, setAnimationKey] = useState<number>(0);

  useEffect(() => {
    const generateAndSchedule = () => {
      const newMAData = generateRandomMovingAverage();
      setMAData(newMAData);
      setAnimationKey(prev => prev + 1);
    };

    generateAndSchedule();

    const timer = setInterval(() => {
      generateAndSchedule();
    }, ANIMATION_DURATION);

    return () => clearInterval(timer);
  }, []);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="fadeGreen" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#22c55e', stopOpacity: 0 }} />
          <stop offset="50%" style={{ stopColor: '#22c55e', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#22c55e', stopOpacity: 0 }} />
        </linearGradient>

        <linearGradient id="dataFlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.8 }} />
          <stop offset="50%" style={{ stopColor: '#22c55e', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#f59e0b', stopOpacity: 0.6 }} />
        </linearGradient>

        <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: '#22c55e', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#22c55e', stopOpacity: 0 }} />
        </radialGradient>

        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id="glowStrong" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a202c" strokeWidth="0.8" />
        </pattern>

        <pattern id="scanlines" width="800" height="4" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="800" height="2" fill="rgba(34, 197, 94, 0.09)" />
        </pattern>
      </defs>

      <style>{`
        .spin-slow { transform-origin: center; animation: spin 20s linear infinite; }
        .spin-fast { transform-origin: center; animation: spin 10s linear infinite reverse; }
        .spin-med { transform-origin: center; animation: spin 15s linear infinite; }
        .pulse { transform-origin: center; animation: pulse 3s ease-in-out infinite; }
        .pulse-fast { transform-origin: center; animation: pulseFast 1.5s ease-in-out infinite; }
        .dash-anim { stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: dash 5000ms linear 1; }
        .scan-line { animation: scanMove 3s linear infinite; }
        .blink-fast { animation: blink 0.8s infinite; }

        @keyframes pulse { 0% { opacity: 0.43; transform: scale(0.95); } 50% { opacity: 0.72; transform: scale(1.05); } 100% { opacity: 0.43; transform: scale(0.95); } }
        @keyframes pulseFast { 0% { opacity: 0.2; } 50% { opacity: 0.9; } 100% { opacity: 0.2; } }
        @keyframes dash { to { stroke-dashoffset: 0; } }
        @keyframes blink { 0%, 100% { opacity: 0.32; } 50% { opacity: 1; } }
        @keyframes scanMove { 0% { transform: translateY(-600px); } 100% { transform: translateY(600px); } }
      `}</style>

      {/* Grid Background */}
      <rect width="100%" height="100%" fill="url(#grid)" opacity="0.52" />

      {/* Scanlines Effect */}
      <rect width="100%" height="100%" fill="url(#scanlines)" />

      {/* Corner Brackets (Top-Left) */}
      <g opacity="0.6">
        <path d="M 20 20 L 20 60 M 20 20 L 60 20" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Corner Brackets (Top-Right) */}
      <g opacity="0.6">
        <path d="M 780 20 L 780 60 M 780 20 L 740 20" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Corner Brackets (Bottom-Left) */}
      <g opacity="0.6">
        <path d="M 20 580 L 20 540 M 20 580 L 60 580" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Corner Brackets (Bottom-Right) */}
      <g opacity="0.6">
        <path d="M 780 580 L 780 540 M 780 580 L 740 580" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Horizontal Status Line Top */}
      <line x1="100" y1="45" x2="700" y2="45" stroke="#22c55e" strokeWidth="1" opacity="0.4" />

      {/* Horizontal Status Line Bottom */}
      <line x1="100" y1="555" x2="700" y2="555" stroke="#22c55e" strokeWidth="1" opacity="0.4" />

      {/* Vertical Lines Left */}
      <line x1="40" y1="100" x2="40" y2="500" stroke="#22c55e" strokeWidth="0.8" opacity="0.3" strokeDasharray="5,5" />

      {/* Vertical Lines Right */}
      <line x1="760" y1="100" x2="760" y2="500" stroke="#22c55e" strokeWidth="0.8" opacity="0.3" strokeDasharray="5,5" />

      {/* Status Indicator - Online */}
      <g transform="translate(110, 30)">
        <circle cx="0" cy="0" r="4" fill="#22c55e" opacity="0.8" className="pulse-fast" />
        <circle cx="0" cy="0" r="6" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.4" className="pulse-fast" />
        <text x="12" y="4" fontSize="11" fill="#22c55e" opacity="0.9">ONLINE</text>
      </g>

      {/* Status Indicator - Processing */}
      <g transform="translate(240, 30)">
        <circle cx="0" cy="0" r="4" fill="#06b6d4" opacity="0.8" className="blink-fast" />
        <circle cx="0" cy="0" r="6" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.4" className="blink-fast" />
        <text x="12" y="4" fontSize="11" fill="#06b6d4" opacity="0.9">PROCESSING</text>
      </g>

      {/* Status Indicator - Trading */}
      <g transform="translate(410, 30)">
        <circle cx="0" cy="0" r="4" fill="#f59e0b" opacity="0.8" className="pulse-fast" />
        <circle cx="0" cy="0" r="6" fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.4" className="pulse-fast" />
        <text x="12" y="4" fontSize="11" fill="#f59e0b" opacity="0.9">TRADING</text>
      </g>

      {/* Central Radar/Target */}
      <g transform="translate(400, 300)">
        {/* Inner Ring - Pulse */}
        <circle
          cx="0"
          cy="0"
          r="120"
          fill="none"
          stroke="#22c55e"
          strokeWidth="1.2"
          opacity="0.43"
          className="pulse"
        />

        {/* Core Circle */}
        <circle
          cx="0"
          cy="0"
          r="60"
          fill="url(#coreGlow)"
          opacity="0.4"
        />

        {/* Crosshair Vertical */}
        <line x1="0" y1="-180" x2="0" y2="180" stroke="#22c55e" strokeWidth="1" opacity="0.3" strokeDasharray="10,5" />

        {/* Crosshair Horizontal */}
        <line x1="-180" y1="0" x2="180" y2="0" stroke="#22c55e" strokeWidth="1" opacity="0.3" strokeDasharray="10,5" />

        {/* Side Sensors Left */}
        <path
          d="M -180 -20 L -200 -20 L -200 20 L -180 20"
          fill="none"
          stroke="#22c55e"
          strokeWidth="2.4"
          opacity="0.72"
          className="pulse-fast"
        />

        {/* Side Sensors Right */}
        <path
          d="M 180 -20 L 200 -20 L 200 20 L 180 20"
          fill="none"
          stroke="#22c55e"
          strokeWidth="2.4"
          opacity="0.72"
          className="pulse-fast"
        />

        {/* Diagonal Data Streams */}
        <line x1="-100" y1="-100" x2="100" y2="100" stroke="#06b6d4" strokeWidth="1" opacity="0.3" className="dash-anim" />
        <line x1="100" y1="-100" x2="-100" y2="100" stroke="#06b6d4" strokeWidth="1" opacity="0.3" className="dash-anim" />
      </g>

      {/* Trading Chart Area */}

      {/* Resistance Level Line - at MA minimum */}
      <line x1="0" y1={maData.minY} x2="800" y2={maData.minY} stroke="#3b82f6" strokeWidth="1.5" opacity="0.5" strokeDasharray="8,4" />
      <text x="680" y={maData.minY - 8} fontSize="9" fill="#3b82f6" opacity="0.7" fontWeight="bold">RESISTANCE</text>

      {/* Support Level Line - at MA maximum */}
      <line x1="0" y1={maData.maxY} x2="800" y2={maData.maxY} stroke="#ef4444" strokeWidth="1.5" opacity="0.5" strokeDasharray="8,4" />
      <text x="680" y={maData.maxY + 12} fontSize="9" fill="#ef4444" opacity="0.7" fontWeight="bold">SUPPORT</text>

      {/* Moving Average Line - Cyan with Dynamic Random Pattern */}
      {maData.pathData && (
        <path
          key={animationKey}
          d={maData.pathData}
          fill="none"
          stroke="#06b6d4"
          strokeWidth="2"
          opacity="0.6"
          className="dash-anim"
        />
      )}


      {/* Scan Line Effect */}
      <g className="scan-line" opacity="0.12">
        <line x1="0" y1="0" x2="800" y2="0" stroke="#22c55e" strokeWidth="3" />
      </g>

      {/* Bottom Data Readout */}
      <g transform="translate(0, 560)">
        <text x="30" y="15" fontSize="9" fill="#22c55e" opacity="0.9" fontFamily="monospace">TRADING METRICS</text>
        <line x1="20" y1="5" x2="150" y2="5" stroke="#22c55e" strokeWidth="0.8" opacity="0.4" />
      </g>

      <g transform="translate(650, 560)">
        <text x="0" y="15" fontSize="9" fill="#22c55e" opacity="0.9" fontFamily="monospace">SYS: ACTIVE</text>
        <line x1="0" y1="5" x2="70" y2="5" stroke="#22c55e" strokeWidth="0.8" opacity="0.4" />
      </g>
    </svg>
  );
}
