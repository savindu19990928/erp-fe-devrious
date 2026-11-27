"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import {
  formatAxisNumber,
  interruptChartSvg,
  prefersReducedMotion,
  resetChartSvg,
  truncateLabel,
  useContainerWidth,
} from "./chart-utils";

export interface SeriesConfig {
  key: string;
  label: string;
  color: string;
}

export function D3StackedBarChart({
  data,
  categoryKey,
  series,
  mode = "stacked",
  height = 280,
  formatValue = (v) => v.toLocaleString("en-US", { maximumFractionDigits: 2 }),
  title = "Comparison Chart",
  emptyText = "No comparative data available.",
}: {
  data: Array<Record<string, string | number>>;
  categoryKey: string;
  series: SeriesConfig[];
  mode?: "stacked" | "grouped";
  height?: number;
  formatValue?: (v: number) => string;
  title?: string;
  emptyText?: string;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const width = useContainerWidth(wrapRef, 560);

  useEffect(() => {
    const svgEl = svgRef.current;
    const tipEl = tipRef.current;
    if (!svgEl || data.length === 0 || series.length === 0) return;

    const svg = resetChartSvg(svgEl);

    const reduced = prefersReducedMotion();
    const duration = reduced ? 0 : 400;
    const rotateX = width < 520 || data.length > 6;
    const margin = {
      top: 16,
      right: 16,
      bottom: rotateX ? 58 : 34,
      left: 54,
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

    const categories = data.map((d) => String(d[categoryKey] ?? ""));
    const x0 = d3.scaleBand().domain(categories).range([0, innerW]).padding(0.24);

    const keys = series.map((s) => s.key);
    const maxVal =
      mode === "stacked"
        ? d3.max(data, (row) =>
            series.reduce((sum, s) => sum + (Number(row[s.key]) || 0), 0)
          ) ?? 1
        : d3.max(data, (row) =>
            d3.max(series, (s) => Number(row[s.key]) || 0) ?? 0
          ) ?? 1;

    const yScale = d3
      .scaleLinear()
      .domain([0, maxVal > 0 ? maxVal : 1])
      .nice()
      .range([innerH, 0]);

    g.append("g")
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickSize(-innerW)
          .tickFormat(() => "")
      )
      .call((axis) => axis.select(".domain").remove())
      .selectAll("line")
      .attr("stroke", "var(--border-subtle)")
      .attr("stroke-dasharray", "3,3");

    const yAxis = g
      .append("g")
      .call(d3.axisLeft(yScale).ticks(5).tickFormat((d) => formatAxisNumber(Number(d))));
    yAxis.select(".domain").remove();
    yAxis.selectAll("text").attr("fill", "var(--text-muted)").style("font-size", "10px");

    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x0).tickFormat((d) => truncateLabel(String(d), rotateX ? 11 : 15)));
    xAxis.select(".domain").attr("stroke", "var(--border-subtle)");
    xAxis
      .selectAll("text")
      .attr("fill", "var(--text-secondary)")
      .style("font-size", "11px")
      .attr("transform", rotateX ? "rotate(-28)" : null)
      .style("text-anchor", rotateX ? "end" : "middle");

    const showTip = (
      event: PointerEvent,
      cat: string,
      s: SeriesConfig,
      val: number
    ) => {
      if (!tipEl || !wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      const x = Math.min(Math.max(event.clientX - rect.left + 12, 8), Math.max(8, width - 190));
      const y = Math.max(event.clientY - rect.top - 48, 8);
      tipEl.style.opacity = "1";
      tipEl.style.transform = `translate(${x}px, ${y}px)`;
      tipEl.innerHTML = `<div class="font-semibold text-[var(--text-primary)]">${cat}</div><div class="text-[11px] text-[var(--text-secondary)]">${s.label}: <span class="font-mono font-bold text-[var(--brand-primary)]">${formatValue(val)}</span></div>`;
    };
    const hideTip = () => {
      if (tipEl) tipEl.style.opacity = "0";
    };

    if (mode === "grouped") {
      const x1 = d3.scaleBand().domain(keys).range([0, x0.bandwidth()]).padding(0.1);
      const groups = g
        .selectAll("g.cat-group")
        .data(data)
        .join("g")
        .attr("class", "cat-group")
        .attr("transform", (d) => `translate(${x0(String(d[categoryKey] ?? "")) ?? 0},0)`);

      groups
        .selectAll("rect")
        .data((row) =>
          series.map((s) => ({
            cat: String(row[categoryKey] ?? ""),
            s,
            val: Number(row[s.key]) || 0,
          }))
        )
        .join("rect")
        .attr("x", (d) => x1(d.s.key) ?? 0)
        .attr("width", x1.bandwidth())
        .attr("rx", 3)
        .attr("fill", (d) => d.s.color)
        .attr("y", innerH)
        .attr("height", 0)
        .style("cursor", "pointer")
        .on("pointermove", (event, d) => showTip(event, d.cat, d.s, d.val))
        .on("pointerleave", hideTip)
        .transition()
        .duration(duration)
        .attr("y", (d) => yScale(Math.max(0, d.val)))
        .attr("height", (d) => Math.max(0, innerH - yScale(Math.max(0, d.val))));
      return () => interruptChartSvg(svgEl);
    }

    // Stacked mode
    const numericRows = data.map((row) => {
      const rec: Record<string, number> = {};
      for (const k of keys) rec[k] = Math.max(0, Number(row[k]) || 0);
      return rec;
    });

    const stacked = d3.stack<Record<string, number>>().keys(keys)(numericRows);

    g.selectAll("g.series")
      .data(stacked)
      .join("g")
      .attr("class", "series")
      .attr("fill", (d) => series.find((s) => s.key === d.key)?.color || "#dc1e28")
      .selectAll("rect")
      .data((layer) =>
        layer.map((seg, idx) => ({
          seg,
          cat: categories[idx],
          s: series.find((x) => x.key === layer.key)!,
        }))
      )
      .join("rect")
      .attr("x", (d) => x0(d.cat) ?? 0)
      .attr("width", x0.bandwidth())
      .attr("rx", 2)
      .attr("y", innerH)
      .attr("height", 0)
      .style("cursor", "pointer")
      .on("pointermove", (event, d) =>
        showTip(event, d.cat, d.s, d.seg[1] - d.seg[0])
      )
      .on("pointerleave", hideTip)
      .transition()
      .duration(duration)
      .attr("y", (d) => yScale(d.seg[1]))
      .attr("height", (d) => Math.max(0, yScale(d.seg[0]) - yScale(d.seg[1])));

    return () => interruptChartSvg(svgEl);
  }, [categoryKey, data, formatValue, height, mode, series, title, width]);

  if (data.length === 0 || series.length === 0) {
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
    <div ref={wrapRef} className="relative space-y-2.5">
      <div className="flex flex-wrap items-center gap-3 px-1">
        {series.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <svg ref={svgRef} className="block w-full select-none" />
      <div
        ref={tipRef}
        className="pointer-events-none absolute left-0 top-0 z-20 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs opacity-0 shadow-lg transition-opacity duration-100"
      />
    </div>
  );
}
