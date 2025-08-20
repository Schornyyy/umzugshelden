"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

export type MetricsPoint = {
  date: string;
  views: number;
  emailClicks: number;
  purchaseAttempts: number;
};

export default function ContractMetricsChart({
  data,
}: {
  data: MetricsPoint[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      setReady(Boolean(rect && rect.width > 0 && rect.height > 0));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!data || data.length === 0) return null;
  return (
    <ChartContainer
      config={{
        views: { label: "Aufrufe", color: "#16a34a" },
        emailClicks: { label: "E-Mail Klicks", color: "#0ea5e9" },
        purchaseAttempts: { label: "Kaufversuche", color: "#f59e0b" },
      }}>
      <div ref={containerRef} className='w-full h-[280px]'>
        {!ready ? null : (
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart
              data={data}
              margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='date' tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                content={(props) => {
                  const label = props?.label ?? "";
                  const payload = (props?.payload ?? []) as unknown as Array<{
                    dataKey: string;
                    value: number;
                    color: string;
                    name?: string;
                  }>;
                  return (
                    <ChartTooltipContent
                      label={String(label)}
                      payload={payload}
                    />
                  );
                }}
              />
              <Line
                type='monotone'
                dataKey='views'
                name='Aufrufe'
                stroke='var(--color-views)'
                strokeWidth={2}
                dot={false}
              />
              <Line
                type='monotone'
                dataKey='emailClicks'
                name='E-Mail Klicks'
                stroke='var(--color-emailClicks)'
                strokeWidth={2}
                dot={false}
              />
              <Line
                type='monotone'
                dataKey='purchaseAttempts'
                name='Kaufversuche'
                stroke='var(--color-purchaseAttempts)'
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartContainer>
  );
}
