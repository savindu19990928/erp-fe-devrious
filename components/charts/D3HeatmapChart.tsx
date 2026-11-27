"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { resetChartSvg, truncateLabel, useContainerWidth } from "./chart-utils";

export interface HeatmapCell {
  row: string;
  col: string;
  value: number;
}

export function D3HeatmapChart({
  data,
  rows: customRows,
  cols: customCols,
  height = 240,
  formatValue = (v) => String(v),
  title = "Matrix Heatmap",
  emptyText = "No matrix data available.",
}: {
  data: HeatmapCell[];
  rows?: string[];
  cols?: string[];
  height?: number;
  formatValue?: (v: number) => string;
  title?: string;
  emptyText?: string;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const width = useContainerWidth(wrapRef, 480);

  useEffect(() => {
    const svgEl = svgRef.current;
    const tipEl = tipRef.current;
    if (!svgEl || data.length === 0) return;

    const svg = resetChartSvg(svgEl);

    const rows = customRows || Array.from(new Set(data.map((d) => d.row)));
    const cols = customCols || Array.from(new Set(data.map((d) => d.col)));
    const maxVal = d3.max(data, (d) => d.value) || 1;

    const maxRowLen = d3.max(rows, (r) => Math.min(r.length, 16)) ?? 6;
    const margin = {
      top: 32,
      right: 14,
      bottom: 14,
      left: Math.min(Math.max(maxRowLen * 6.8 + 16, 62), width * 0.35),
    };
    const innerW = Math.max(80, width - margin.left - margin.right);
    const innerH = Math.max(80, height - margin.top - margin.bottom);

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("role", "img")
      .attr("aria-label", title);
    svg.append("title").text(title);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand().domain(cols).range([0, innerW]).padding(0.08);
    const yScale = d3.scaleBand().domain(rows).range([0, innerH]).padding(0.08);

    const colorScale = d3
      .scaleSequential((t) => d3.interpolateRgb("#fee2e2", "#dc1e28")(t))
      .domain([0, maxVal]);

    const xLabels = g
      .append("g")
      .selectAll("text")
      .data(cols)
      .join("text")
      .attr("x", (c) => (xScale(c) ?? 0) + xScale.bandwidth() / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("fill", "var(--text-secondary)")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .text((c) => truncateLabel(c, 10));
    void xLabels;

    g.append("g")
      .selectAll("text")
      .data(rows)
      .join("text")
      .attr("x", -10)
      .attr("y", (r) => (yScale(r) ?? 0) + yScale.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .attr("fill", "var(--text-secondary)")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .text((r) => truncateLabel(r, 15));

    const cells = g
      .selectAll<SVGRectElement, HeatmapCell>("rect.cell")
      .data(data)
      .join("rect")
      .attr("class", "cell")
      .attr("x", (d) => xScale(d.col) ?? 0)
      .attr("y", (d) => yScale(d.row) ?? 0)
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("rx", 6)
      .attr("fill", (d) => (d.value <= 0 ? "var(--bg-muted)" : colorScale(d.value)))
      .attr("stroke", "var(--border-subtle)")
      .style("cursor", "pointer")
      .on("pointermove", (event, d) => {
        if (!tipEl || !wrapRef.current) return;
        const rect = wrapRef.current.getBoundingClientRect();
        const x = Math.min(Math.max(event.clientX - rect.left + 12, 8), Math.max(8, width - 170));
        const y = Math.max(event.clientY - rect.top - 44, 8);
        tipEl.style.opacity = "1";
        tipEl.style.transform = `translate(${x}px, ${y}px)`;
        tipEl.innerHTML = `<div class="font-semibold text-[var(--text-primary)]">${d.row} × ${d.col}</div><div class="font-mono text-xs font-bold text-[var(--brand-primary)]">${formatValue(d.value)}</div>`;
      })
      .on("pointerleave", () => {
        if (tipEl) tipEl.style.opacity = "0";
      });
    void cells;

    g.selectAll<SVGTextElement, HeatmapCell>("text.cell-val")
      .data(data)
      .join("text")
      .attr("class", "cell-val")
      .attr("x", (d) => (xScale(d.col) ?? 0) + xScale.bandwidth() / 2)
      .attr("y", (d) => (yScale(d.row) ?? 0) + yScale.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .style("pointer-events", "none")
      .style("font-size", "12px")
      .style("font-weight", "700")
      .style("font-family", "var(--font-mono)")
      .attr("fill", (d) =>
        d.value <= 0
          ? "var(--text-muted)"
          : d.value / maxVal > 0.52
            ? "#ffffff"
            : "#7f1d1d"
      )
      .text((d) => formatValue(d.value));
  }, [customCols, customRows, data, formatValue, height, title, width]);

  if (data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] px-4 text-center text-xs text-[var(--text-muted)]"
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative w-full overflow-hidden">
      <svg ref={svgRef} className="block w-full select-none" />
      <div
        ref={tipRef}
        className="pointer-events-none absolute left-0 top-0 z-20 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs opacity-0 shadow-lg transition-opacity duration-100"
      />
    </div>
  );
}
