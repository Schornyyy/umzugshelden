"use client";
import React, { useState, ReactNode } from "react";

interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

interface Props {
  tabs: TabItem[];
  initial?: string;
  className?: string;
}

export function CityAdminTabs({ tabs, initial, className }: Props) {
  const [active, setActive] = useState<string>(initial || tabs[0]?.id);
  return (
    <div className={className}>
      <div className='flex gap-2 border-b mb-4 overflow-x-auto'>
        {tabs.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              type='button'
              onClick={() => setActive(t.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 -mb-px transition-colors whitespace-nowrap ${
                selected
                  ? "border-green-600 text-green-700 bg-white"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
              aria-selected={selected}
              role='tab'>
              {t.label}
            </button>
          );
        })}
      </div>
      <div role='tabpanel'>{tabs.find((t) => t.id === active)?.content}</div>
    </div>
  );
}
