"use client";

import React, { useEffect, useId, useRef } from "react";
import * as d3 from "d3";
import {
  formatAxisNumber,
  interruptChartSvg,
  prefersReducedMotion,
  resetChartSvg,
  truncateLabel,
  useContainerWidth,
} from "./chart-utils";

export interface TrendPoint {
  label: string;
  value: number;
  secondary?: string;
}

export function D3TrendAreaChart({
  data,
  height = 250,
  color = "#dc1e28",
  formatValue = (v) => v.toLocaleString("en-US", { maximumFractionDigits: 2 }),
  referenceBand,
  title = "Trend Chart",
  emptyText = "No time-series data available.",
}: {
  data: TrendPoint[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
  referenceBand?: { min: number; max: number; label?: string };
  title?: string;
  emptyText?: string;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const width = useContainerWidth(wrapRef, 520);
  const gradId = useId().replace(/:/g, "");

  const cleanData = data.filter((d) => Number.isFinite(d.value));

  useEffect(() => {
    const svgEl = svgRef.current;
    const tipEl = tipRef.current;
    if (!svgEl || cleanData.length === 0) return;

    const svg = resetChartSvg(svgEl);

    const reduced = prefersReducedMotion();
    const margin = { top: 18, right: 18, bottom: 38, left: 52 };
    const innerW = Math.max(80, width - margin.left - margin.right);
    const innerH = Math.max(80, height - margin.top - margin.bottom);

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("role", "img")
      .attr("aria-label", title);
    svg.append("title").text(title);

    const defs = svg.append("defs");
    const grad = defs
      .append("linearGradient")
      .attr("id", `area-${gradId}`)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    grad.append("stop").attr("offset", "0%").attr("stop-color", color).attr("stop-opacity", 0.28);
    grad.append("stop").attr("offset", "100%").attr("stop-color", color).attr("stop-opacity", 0.02);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scalePoint()
      .domain(cleanData.map((d) => d.label))
      .range([0, innerW])
      .padding(0.25);

    const rawMin = d3.min(cleanData, (d) => d.value) ?? 0;
    const rawMax = d3.max(cleanData, (d) => d.value) ?? 1;
    const domainMin = referenceBand ? Math.min(rawMin, referenceBand.min) : Math.min(0, rawMin);
    const domainMax = referenceBand ? Math.max(rawMax, referenceBand.max) : Math.max(0, rawMax);

    const yScale = d3
      .scaleLinear()
      .domain([domainMin, domainMax === domainMin ? domainMin + 1 : domainMax])
      .nice()
      .range([innerH, 0]);

    if (referenceBand) {
      const yTop = yScale(referenceBand.max);
      const yBot = yScale(referenceBand.min);
      g.append("rect")
        .attr("x", 0)
        .attr("y", yTop)
        .attr("width", innerW)
        .attr("height", Math.max(1, yBot - yTop))
        .attr("fill", "#10b981")
        .attr("fill-opacity", 0.12);
      if (referenceBand.label) {
        g.append("text")
          .attr("x", innerW - 4)
          .attr("y", yTop + 12)
          .attr("text-anchor", "end")
          .attr("fill", "#059669")
          .style("font-size", "10px")
          .text(referenceBand.label);
      }
    }

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

    const maxTicks = width < 440 ? 4 : 7;
    const step = Math.max(1, Math.ceil(cleanData.length / maxTicks));
    const xTicks = cleanData.filter((_, i) => i % step === 0).map((d) => d.label);

    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickValues(xTicks)
          .tickFormat((d) => truncateLabel(String(d), 12))
      );
    xAxis.select(".domain").attr("stroke", "var(--border-subtle)");
    xAxis.selectAll("text").attr("fill", "var(--text-secondary)").style("font-size", "10px");

    const areaGen = d3
      .area<TrendPoint>()
      .x((d) => xScale(d.label) ?? 0)
      .y0(innerH)
      .y1((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    const lineGen = d3
      .line<TrendPoint>()
      .x((d) => xScale(d.label) ?? 0)
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    g.append("path").datum(cleanData).attr("fill", `url(#area-${gradId})`).attr("d", areaGen);

    const linePath = g
      .append("path")
      .datum(cleanData)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2.5)
      .attr("d", lineGen);

    if (!reduced) {
      const len = linePath.node()?.getTotalLength() || 0;
      if (len > 0) {
        linePath
          .attr("stroke-dasharray", `${len} ${len}`)
          .attr("stroke-dashoffset", len)
          .transition()
          .duration(550)
          .attr("stroke-dashoffset", 0);
      }
    }

    g.selectAll<SVGCircleElement, TrendPoint>("circle.pt")
      .data(cleanData)
      .join("circle")
      .attr("class", "pt")
      .attr("cx", (d) => xScale(d.label) ?? 0)
      .attr("cy", (d) => yScale(d.value))
      .attr("r", cleanData.length > 24 ? 3 : 4.5)
      .attr("fill", color)
      .attr("stroke", "var(--bg-surface)")
      .attr("stroke-width", 1.8)
      .style("cursor", "pointer")
      .on("pointermove", (event, d) => {
        if (!tipEl || !wrapRef.current) return;
        const rect = wrapRef.current.getBoundingClientRect();
        const x = Math.min(Math.max(event.clientX - rect.left + 12, 8), Math.max(8, width - 170));
        const y = Math.max(event.clientY - rect.top - 48, 8);
        tipEl.style.opacity = "1";
        tipEl.style.transform = `translate(${x}px, ${y}px)`;
        tipEl.innerHTML = `<div class="font-semibold text-[var(--text-primary)]">${d.label}</div><div class="font-mono text-xs font-bold" style="color:${color}">${formatValue(d.value)}</div>${d.secondary ? `<div class="text-[10px] text-[var(--text-muted)]">${d.secondary}</div>` : ""}`;
      })
      .on("pointerleave", () => {
        if (tipEl) tipEl.style.opacity = "0";
      });

    return () => interruptChartSvg(svgEl);
  }, [cleanData, color, formatValue, gradId, height, referenceBand, title, width]);

  if (cleanData.length === 0) {
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
