"use client";

import { B2B_CATEGORIES } from "@/lib/b2bCategories";
import type { B2bLeadCategory } from "@/types/B2b";

export default function B2bCategoryPicker({
  selected,
  disabled,
  onChange,
}: {
  selected: B2bLeadCategory[];
  disabled?: boolean;
  onChange: (categories: B2bLeadCategory[]) => void;
}) {
  function toggle(category: B2bLeadCategory) {
    onChange(
      selected.includes(category)
        ? selected.filter((entry) => entry !== category)
        : [...selected, category],
    );
  }

  return (
    <div className='grid gap-3 md:grid-cols-2'>
      {B2B_CATEGORIES.map((category) => {
        const checked = selected.includes(category.value);
        return (
          <label
            key={category.value}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${
              checked ? "border-blue-300 bg-blue-50" : "border-slate-200"
            }`}>
            <input
              type='checkbox'
              checked={checked}
              disabled={disabled}
              onChange={() => toggle(category.value)}
              className='mt-1 h-4 w-4'
            />
            <span>
              <span className='block font-semibold text-slate-950'>{category.label}</span>
              <span className='mt-1 block text-xs text-slate-500'>
                {category.description} · Suche: {category.queries.join(", ")}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
