"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import {
  BIZZ_PALETTE,
  interruptChartSvg,
  prefersReducedMotion,
  resetChartSvg,
  useContainerWidth,
} from "./chart-utils";

export interface DonutDatum {
  label: string;
  value: number;
  color?: string;
}

export function D3DonutChart({
  data,
  size = 210,
  centerLabel,
  centerValue,
  formatValue = (v) => v.toLocaleString("en-US", { maximumFractionDigits: 2 }),
  title = "Distribution Chart",
  emptyText = "No distribution data available.",
}: {
  data: DonutDatum[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
  formatValue?: (v: number) => string;
  title?: string;
  emptyText?: string;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const width = useContainerWidth(wrapRef, 360);

  const cleanData = data.filter((d) => Number.isFinite(d.value) && d.value > 0);
  const total = cleanData.reduce((acc, d) => acc + d.value, 0);
  const effectiveSize = Math.min(size, Math.max(160, width - 32));

  useEffect(() => {
    const svgEl = svgRef.current;
    const tipEl = tipRef.current;
    if (!svgEl || cleanData.length === 0) return;

    const svg = resetChartSvg(svgEl);

    const reduced = prefersReducedMotion();
    const radius = effectiveSize / 2 - 10;
    const innerRadius = radius * 0.58;

    svg
      .attr("width", effectiveSize)
      .attr("height", effectiveSize)
      .attr("role", "img")
      .attr("aria-label", title);
    svg.append("title").text(title);

    const g = svg
      .append("g")
      .attr("transform", `translate(${effectiveSize / 2},${effectiveSize / 2})`);

    const pie = d3
      .pie<DonutDatum>()
      .value((d) => d.value)
      .sort(null)
      .padAngle(0.025);

    const arc = d3
      .arc<d3.PieArcDatum<DonutDatum>>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(4);

    const arcHover = d3
      .arc<d3.PieArcDatum<DonutDatum>>()
      .innerRadius(innerRadius)
      .outerRadius(radius + 6)
      .cornerRadius(4);

    const slices = g
      .selectAll<SVGPathElement, d3.PieArcDatum<DonutDatum>>("path.slice")
      .data(pie(cleanData))
      .join("path")
      .attr("class", "slice")
      .attr("fill", (d, i) => d.data.color || BIZZ_PALETTE[i % BIZZ_PALETTE.length])
      .attr("stroke", "var(--bg-surface)")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("pointerenter", function (event, d) {
        d3.select(this)
          .transition()
          .duration(reduced ? 0 : 150)
          .attr("d", arcHover(d) || "");
        if (tipEl && wrapRef.current) {
          const rect = wrapRef.current.getBoundingClientRect();
          const pct = total > 0 ? ((d.data.value / total) * 100).toFixed(1) : "0.0";
          const x = Math.min(Math.max(event.clientX - rect.left + 12, 8), Math.max(8, width - 170));
          const y = Math.max(event.clientY - rect.top - 40, 8);
          tipEl.style.opacity = "1";
          tipEl.style.transform = `translate(${x}px, ${y}px)`;
          tipEl.innerHTML = `<div class="font-semibold text-[var(--text-primary)]">${d.data.label}</div><div class="font-mono text-xs font-bold text-[var(--brand-primary)]">${formatValue(d.data.value)} (${pct}%)</div>`;
        }
      })
      .on("pointerleave", function (_, d) {
        d3.select(this)
          .transition()
          .duration(reduced ? 0 : 150)
          .attr("d", arc(d) || "");
        if (tipEl) tipEl.style.opacity = "0";
      });

    if (reduced) {
      slices.attr("d", (d) => arc(d) || "");
    } else {
      slices
        .transition()
        .duration(450)
        .attrTween("d", function (d) {
          const interp = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
          return (t) => arc(interp(t)) || "";
        });
    }

    if (centerValue || centerLabel) {
      if (centerLabel) {
        g.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", centerValue ? "-0.35em" : "0.35em")
          .attr("fill", "var(--text-muted)")
          .style("font-size", "10px")
          .style("text-transform", "uppercase")
          .text(centerLabel);
      }
      if (centerValue) {
        g.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", centerLabel ? "1.0em" : "0.35em")
          .attr("fill", "var(--text-primary)")
          .style("font-size", "13px")
          .style("font-weight", "700")
          .style("font-family", "var(--font-mono)")
          .text(centerValue);
      }
    }

    return () => interruptChartSvg(svgEl);
  }, [centerLabel, centerValue, cleanData, effectiveSize, formatValue, title, total, width]);

  if (cleanData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] px-4 text-center text-xs text-[var(--text-muted)]">
        {emptyText}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg ref={svgRef} className="shrink-0 select-none" />
      <div className="w-full min-w-0 flex-1 space-y-2">
        {cleanData.map((d, i) => {
          const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0.0";
          const color = d.color || BIZZ_PALETTE[i % BIZZ_PALETTE.length];
          return (
            <div key={d.label} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate text-[var(--text-secondary)]">{d.label}</span>
              </div>
              <div className="shrink-0 font-mono tabular-nums">
                <span className="font-semibold text-[var(--text-primary)]">
                  {formatValue(d.value)}
                </span>{" "}
                <span className="text-[11px] text-[var(--text-muted)]">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
      <div
        ref={tipRef}
        className="pointer-events-none absolute left-0 top-0 z-20 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs opacity-0 shadow-lg transition-opacity duration-100"
      />
    </div>
  );
}
