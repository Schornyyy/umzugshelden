"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<string, { label?: string; color?: string }>;

export function ChartContainer({
  children,
  className,
  config,
}: {
  children: React.ReactNode;
  className?: string;
  config?: ChartConfig;
}) {
  // Map series colors to CSS variables --color-<key>
  const style: React.CSSProperties = {};
  if (config) {
    for (const [key, value] of Object.entries(config)) {
      if (value?.color) {
        // @ts-expect-error custom CSS var for theming
        style[`--color-${key}`] = value.color;
      }
    }
  }
  return (
    <div className={cn("w-full h-[280px]", className)} style={style}>
      {children}
    </div>
  );
}

export function ChartLegend({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600",
        className
      )}>
      {children}
    </div>
  );
}

export function ChartLegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className='flex items-center gap-2'>
      <span
        className='inline-block h-3 w-3 rounded'
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  );
}

export function ChartTooltipContent({
  label,
  payload,
}: {
  label?: string;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
    name?: string;
  }>;
}) {
  if (!payload?.length) return null;
  return (
    <div className='rounded border bg-white p-2 shadow-sm'>
      {label && <div className='mb-1 text-xs text-gray-500'>{label}</div>}
      <div className='space-y-1'>
        {payload.map((p, idx) => (
          <div
            key={idx}
            className='flex items-center justify-between gap-6 text-sm'>
            <div className='flex items-center gap-2'>
              <span
                className='inline-block h-2.5 w-2.5 rounded'
                style={{ backgroundColor: p.color }}
              />
              <span className='capitalize'>{p.name || p.dataKey}</span>
            </div>
            <span className='font-medium tabular-nums'>{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
