"use client";

import { useEffect, useState } from "react";
import { interrupt, select } from "d3";

export const BIZZ_PALETTE = [
  "#dc1e28", // Bizzrious Crimson
  "#2563eb", // Royal Cobalt
  "#059669", // Emerald
  "#d97706", // Amber
  "#7c3aed", // Violet
  "#0891b2", // Cyan
  "#db2777", // Rose
  "#475569", // Slate
];

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function formatAxisNumber(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return Number.isInteger(val) ? String(val) : val.toFixed(1);
}

export function truncateLabel(label: string, maxLen = 14): string {
  if (label.length <= maxLen) return label;
  return `${label.slice(0, maxLen - 1)}…`;
}

export function interruptChartSvg(svgEl: SVGSVGElement): void {
  interrupt(svgEl);
  svgEl.querySelectorAll("*").forEach((node) => interrupt(node));
}

export function resetChartSvg(svgEl: SVGSVGElement) {
  interruptChartSvg(svgEl);
  const svg = select(svgEl);
  svg.selectAll("*").remove();
  return svg;
}

export function useContainerWidth(
  ref: React.RefObject<HTMLDivElement | null>,
  fallbackWidth = 520
): number {
  const [width, setWidth] = useState(fallbackWidth);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        if (w > 0) {
          setWidth((prev) => (prev === w ? prev : w));
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}
