"use client";

import React from "react";

export type MetricsPoint = {
  date: string;
  views: number;
  emailClicks: number;
  purchaseAttempts: number;
};

// Minimaler Ersatz für das entfernte Recharts-Diagramm: einfache Tabelle
export default function ContractMetricsChart({
  data,
}: {
  data: MetricsPoint[];
}) {
  if (!data || data.length === 0) return null;
  return (
    <div className='w-full overflow-x-auto border rounded-md'>
      <table className='w-full text-sm'>
        <thead className='bg-gray-50 text-gray-600 text-xs uppercase tracking-wide'>
          <tr>
            <th className='px-3 py-2 text-left'>Datum</th>
            <th className='px-3 py-2 text-right'>Aufrufe</th>
            <th className='px-3 py-2 text-right'>E-Mail Klicks</th>
            <th className='px-3 py-2 text-right'>Kaufversuche</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.date} className='border-t'>
              <td className='px-3 py-1.5 font-medium text-gray-800'>
                {row.date}
              </td>
              <td className='px-3 py-1.5 text-right tabular-nums'>
                {row.views}
              </td>
              <td className='px-3 py-1.5 text-right tabular-nums'>
                {row.emailClicks}
              </td>
              <td className='px-3 py-1.5 text-right tabular-nums'>
                {row.purchaseAttempts}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className='p-2 text-xs text-gray-500'>
        (Diagramm entfernt – vereinfachte Ansicht)
      </div>
    </div>
  );
}
