"use client";

import { useEffect, useRef } from "react";

interface LineGraphProps {
  className?: string;
}

export default function AnimatedChart({ className = "" }: LineGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Animation parameters
    let animationTime = 0;
    const animationDuration = 10000; // 10 seconds
    let animationFrameId = 0;

    // Generate realistic price data
    const generatePriceData = (count: number): number[] => {
      const data: number[] = [];
      let price = 45000;
      for (let i = 0; i < count; i++) {
        const change = (Math.random() - 0.48) * 2000;
        const trend = Math.sin(i * 0.3) * 1000;
        price = Math.max(40000, Math.min(55000, price + change + trend));
        data.push(price);
      }
      return data;
    };

    const generateVolumeData = (count: number): number[] => {
      const data: number[] = [];
      for (let i = 0; i < count; i++) {
        data.push(Math.random() * 0.8 + 0.2);
      }
      return data;
    };

    const priceData = generatePriceData(24);
    const volumeData = generateVolumeData(24);

    const minPrice = Math.min(...priceData);
    const maxPrice = Math.max(...priceData);
    const priceRange = maxPrice - minPrice;

    const animate = (timestamp: number) => {
      animationTime = (animationTime + 16) % animationDuration;
      const progress = animationTime / animationDuration;

      const rect = canvas.getBoundingClientRect();

      // Clear canvas with dark background
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, rect.width, rect.height);

      const padding = { left: 50, right: 30, top: 20, bottom: 50 };
      const chartWidth = rect.width - padding.left - padding.right;
      const chartHeight = rect.height - padding.top - padding.bottom;
      const volumeHeight = chartHeight * 0.25;
      const priceChartHeight = chartHeight - volumeHeight - 20;

      // Draw grid lines
      ctx.strokeStyle = "rgba(161, 161, 170, 0.1)";
      ctx.lineWidth = 1;

      // Horizontal grid lines
      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (priceChartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(rect.width - padding.right, y);
        ctx.stroke();
      }

      // Vertical grid lines
      const visibleBars = Math.ceil(priceData.length * progress);
      for (let i = 0; i < visibleBars; i++) {
        const x = padding.left + (chartWidth / (priceData.length - 1)) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + priceChartHeight);
        ctx.stroke();
      }

      // Draw volume bars
      ctx.fillStyle = "rgba(34, 197, 94, 0.2)";
      for (let i = 0; i < visibleBars; i++) {
        const x = padding.left + (chartWidth / (priceData.length - 1)) * i - (chartWidth / priceData.length) * 0.35;
        const barHeight = volumeData[i] * volumeHeight;
        const y = padding.top + priceChartHeight + 20 + (volumeHeight - barHeight);
        const barWidth = (chartWidth / priceData.length) * 0.7;

        ctx.fillRect(x, y, barWidth, barHeight);
      }

      // Draw price line with gradient
      if (visibleBars > 1) {
        // Create gradient under the line
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + priceChartHeight);
        gradient.addColorStop(0, "rgba(34, 197, 94, 0.3)");
        gradient.addColorStop(1, "rgba(34, 197, 94, 0.05)");

        ctx.fillStyle = gradient;
        ctx.beginPath();

        // Start from first point
        let x = padding.left;
        let normalizedPrice = (priceData[0] - minPrice) / priceRange;
        let y = padding.top + priceChartHeight - normalizedPrice * priceChartHeight;
        ctx.moveTo(x, y);

        // Draw line to each visible point
        for (let i = 1; i < visibleBars; i++) {
          x = padding.left + (chartWidth / (priceData.length - 1)) * i;
          normalizedPrice = (priceData[i] - minPrice) / priceRange;
          y = padding.top + priceChartHeight - normalizedPrice * priceChartHeight;
          ctx.lineTo(x, y);
        }

        // Close path for gradient fill
        ctx.lineTo(x, padding.top + priceChartHeight);
        ctx.lineTo(padding.left, padding.top + priceChartHeight);
        ctx.fill();

        // Draw line stroke
        ctx.strokeStyle = "rgba(34, 197, 94, 0.8)";
        ctx.lineWidth = 2.5;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();

        x = padding.left;
        normalizedPrice = (priceData[0] - minPrice) / priceRange;
        y = padding.top + priceChartHeight - normalizedPrice * priceChartHeight;
        ctx.moveTo(x, y);

        for (let i = 1; i < visibleBars; i++) {
          x = padding.left + (chartWidth / (priceData.length - 1)) * i;
          normalizedPrice = (priceData[i] - minPrice) / priceRange;
          y = padding.top + priceChartHeight - normalizedPrice * priceChartHeight;
          ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw data point circles
        ctx.fillStyle = "rgba(34, 197, 94, 1)";
        for (let i = 0; i < visibleBars; i++) {
          x = padding.left + (chartWidth / (priceData.length - 1)) * i;
          normalizedPrice = (priceData[i] - minPrice) / priceRange;
          y = padding.top + priceChartHeight - normalizedPrice * priceChartHeight;

          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();

          // Glow
          ctx.strokeStyle = "rgba(34, 197, 94, 0.4)";
          ctx.lineWidth = 6;
          ctx.stroke();
        }
      }

      // Draw axes
      ctx.strokeStyle = "rgba(161, 161, 170, 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top);
      ctx.lineTo(padding.left, padding.top + chartHeight);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top + priceChartHeight + 20);
      ctx.lineTo(rect.width - padding.right, padding.top + priceChartHeight + 20);
      ctx.stroke();

      // Draw price labels (Y-axis)
      ctx.fillStyle = "rgba(161, 161, 170, 0.6)";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "right";

      for (let i = 0; i <= 5; i++) {
        const ratio = i / 5;
        const price = Math.round(minPrice + priceRange * (1 - ratio));
        const y = padding.top + priceChartHeight * ratio;
        ctx.fillText(`$${(price / 1000).toFixed(0)}k`, padding.left - 10, y + 4);
      }

      // Draw time labels (X-axis)
      ctx.textAlign = "center";
      const timeLabels = ["00:00", "06:00", "12:00", "18:00", "24:00"];
      for (let i = 0; i < timeLabels.length; i++) {
        const x = padding.left + (chartWidth / (timeLabels.length - 1)) * i;
        const y = padding.top + chartHeight + 30;
        ctx.fillText(timeLabels[i], x, y);
      }

      // Draw volume label
      ctx.fillStyle = "rgba(161, 161, 170, 0.5)";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Volume", padding.left + 5, padding.top + priceChartHeight + 40);

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: "block" }}
    />
  );
}
