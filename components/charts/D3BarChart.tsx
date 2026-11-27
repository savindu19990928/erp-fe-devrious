"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import {
  BIZZ_PALETTE,
  formatAxisNumber,
  interruptChartSvg,
  prefersReducedMotion,
  resetChartSvg,
  truncateLabel,
  useContainerWidth,
} from "./chart-utils";

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
  subtitle?: string;
}

export function D3BarChart({
  data,
  height = 260,
  orientation = "vertical",
  formatValue = (v) => v.toLocaleString("en-US", { maximumFractionDigits: 2 }),
  title = "Bar Chart",
  emptyText = "No chart data available.",
}: {
  data: BarDatum[];
  height?: number;
  orientation?: "vertical" | "horizontal";
  formatValue?: (v: number) => string;
  title?: string;
  emptyText?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const width = useContainerWidth(containerRef, 520);

  const cleanData = data.filter((d) => Number.isFinite(d.value));

  useEffect(() => {
    const svgEl = svgRef.current;
    const tipEl = tooltipRef.current;
    if (!svgEl || cleanData.length === 0) return;

    const svg = resetChartSvg(svgEl);

    const reduced = prefersReducedMotion();
    const duration = reduced ? 0 : 450;

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("role", "img")
      .attr("aria-label", title);
    svg.append("title").text(title);

    const showTip = (event: PointerEvent, d: BarDatum) => {
      if (!tipEl || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.min(Math.max(event.clientX - rect.left + 12, 8), Math.max(8, width - 190));
      const y = Math.max(event.clientY - rect.top - 48, 8);
      tipEl.style.opacity = "1";
      tipEl.style.transform = `translate(${x}px, ${y}px)`;
      tipEl.innerHTML = `<div class="font-semibold text-[var(--text-primary)]">${d.label}</div><div class="font-mono text-xs font-bold text-[var(--brand-primary)]">${formatValue(d.value)}</div>${d.subtitle ? `<div class="text-[10px] text-[var(--text-muted)]">${d.subtitle}</div>` : ""}`;
    };

    const hideTip = () => {
      if (tipEl) tipEl.style.opacity = "0";
    };

    if (orientation === "horizontal") {
      const maxLabelLen = d3.max(cleanData, (d) => Math.min(d.label.length, 20)) ?? 8;
      const margin = {
        top: 12,
        right: 72,
        bottom: 28,
        left: Math.min(Math.max(maxLabelLen * 6.8 + 16, 76), width * 0.42),
      };
      const innerW = Math.max(80, width - margin.left - margin.right);
      const innerH = Math.max(60, height - margin.top - margin.bottom);

      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      const minV = Math.min(0, d3.min(cleanData, (d) => d.value) ?? 0);
      const maxV = Math.max(0, d3.max(cleanData, (d) => d.value) ?? 1);
      const xScale = d3
        .scaleLinear()
        .domain([minV, maxV === minV ? minV + 1 : maxV])
        .nice()
        .range([0, innerW]);

      const yScale = d3
        .scaleBand()
        .domain(cleanData.map((d) => d.label))
        .range([0, innerH])
        .padding(0.28);

      g.append("g")
        .attr("class", "grid")
        .call(
          d3
            .axisBottom(xScale)
            .ticks(4)
            .tickSize(innerH)
            .tickFormat(() => "")
        )
        .call((axis) => axis.select(".domain").remove())
        .selectAll("line")
        .attr("stroke", "var(--border-subtle)")
        .attr("stroke-dasharray", "3,3");

      const xAxis = g
        .append("g")
        .attr("transform", `translate(0,${innerH})`)
        .call(d3.axisBottom(xScale).ticks(4).tickFormat((d) => formatAxisNumber(Number(d))));
      xAxis.select(".domain").attr("stroke", "var(--border-subtle)");
      xAxis.selectAll("text").attr("fill", "var(--text-muted)").style("font-size", "10px");

      const yAxis = g
        .append("g")
        .call(d3.axisLeft(yScale).tickFormat((d) => truncateLabel(String(d), 18)));
      yAxis.select(".domain").attr("stroke", "var(--border-subtle)");
      yAxis.selectAll("text").attr("fill", "var(--text-secondary)").style("font-size", "11px");

      const zeroX = xScale(0);
      const bars = g
        .selectAll<SVGRectElement, BarDatum>("rect.bar")
        .data(cleanData)
        .join("rect")
        .attr("class", "bar")
        .attr("y", (d) => yScale(d.label) ?? 0)
        .attr("height", yScale.bandwidth())
        .attr("rx", 4)
        .attr("fill", (d, i) => d.color || BIZZ_PALETTE[i % BIZZ_PALETTE.length])
        .attr("x", zeroX)
        .attr("width", 0)
        .style("cursor", "pointer")
        .on("pointermove", (event, d) => showTip(event, d))
        .on("pointerleave", hideTip);

      bars
        .transition()
        .duration(duration)
        .attr("x", (d) => (d.value >= 0 ? zeroX : xScale(d.value)))
        .attr("width", (d) => Math.max(2, Math.abs(xScale(d.value) - zeroX)));

      g.selectAll<SVGTextElement, BarDatum>("text.val-lbl")
        .data(cleanData)
        .join("text")
        .attr("class", "val-lbl")
        .attr("x", (d) => Math.max(zeroX, xScale(d.value)) + 6)
        .attr("y", (d) => (yScale(d.label) ?? 0) + yScale.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("fill", "var(--text-secondary)")
        .style("font-size", "10px")
        .style("font-family", "var(--font-mono)")
        .text((d) => formatAxisNumber(d.value));
      return () => interruptChartSvg(svgEl);
    }

    // Vertical orientation
    const rotateX = width < 480 || cleanData.length > 6;
    const margin = {
      top: 16,
      right: 16,
      bottom: rotateX ? 58 : 34,
      left: 52,
    };
    const innerW = Math.max(80, width - margin.left - margin.right);
    const innerH = Math.max(80, height - margin.top - margin.bottom);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleBand()
      .domain(cleanData.map((d) => d.label))
      .range([0, innerW])
      .padding(0.28);

    const minV = Math.min(0, d3.min(cleanData, (d) => d.value) ?? 0);
    const maxV = Math.max(0, d3.max(cleanData, (d) => d.value) ?? 1);
    const yScale = d3
      .scaleLinear()
      .domain([minV, maxV === minV ? minV + 1 : maxV])
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
    yAxis
      .selectAll("text")
      .attr("fill", "var(--text-muted)")
      .style("font-size", "10px")
      .style("font-family", "var(--font-mono)");

    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).tickFormat((d) => truncateLabel(String(d), rotateX ? 12 : 16)));
    xAxis.select(".domain").attr("stroke", "var(--border-subtle)");
    xAxis
      .selectAll("text")
      .attr("fill", "var(--text-secondary)")
      .style("font-size", "11px")
      .attr("transform", rotateX ? "rotate(-28)" : null)
      .style("text-anchor", rotateX ? "end" : "middle");

    const zeroY = yScale(0);
    if (minV < 0) {
      g.append("line")
        .attr("x1", 0)
        .attr("x2", innerW)
        .attr("y1", zeroY)
        .attr("y2", zeroY)
        .attr("stroke", "var(--border-strong)");
    }

    const bars = g
      .selectAll<SVGRectElement, BarDatum>("rect.bar")
      .data(cleanData)
      .join("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.label) ?? 0)
      .attr("width", xScale.bandwidth())
      .attr("rx", 5)
      .attr("fill", (d, i) => d.color || BIZZ_PALETTE[i % BIZZ_PALETTE.length])
      .attr("y", zeroY)
      .attr("height", 0)
      .style("cursor", "pointer")
      .on("pointermove", (event, d) => showTip(event, d))
      .on("pointerleave", hideTip);

    bars
      .transition()
      .duration(duration)
      .attr("y", (d) => (d.value >= 0 ? yScale(d.value) : zeroY))
      .attr("height", (d) => Math.max(2, Math.abs(zeroY - yScale(d.value))));

    return () => interruptChartSvg(svgEl);
  }, [cleanData, formatValue, height, orientation, title, width]);

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
    <div ref={containerRef} className="relative w-full overflow-hidden">
      <svg ref={svgRef} className="block w-full select-none" />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute left-0 top-0 z-20 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs opacity-0 shadow-lg transition-opacity duration-100"
      />
    </div>
  );
}
