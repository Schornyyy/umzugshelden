"use client";
import React from 'react';
import Link from 'next/link';
import { slugify } from '@/utils/slugify';

interface Props {
  subcategorySlug: string;
  userId: string;
}

export default function BlogCreateClient({ subcategorySlug, userId }: Props) {
  const [title, setTitle] = React.useState('');
  const slug = title ? slugify(title.toLowerCase()) : '';
  const href = slug ? `/admin/${userId}/blog/${subcategorySlug}/${slug}` : undefined;
  return (
    <div className='space-y-3'>
      <div className='flex flex-col gap-1'>
        <label className='text-sm'>Titel</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className='border rounded px-2 py-1'
          placeholder='Beitragstitel'
        />
        {slug && <p className='text-[11px] text-slate-500'>Slug: {slug}</p>}
      </div>
      <div>
        <Link
          href={href || '#'}
          className={`px-4 py-2 rounded text-sm text-white ${href ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-300 cursor-not-allowed'}`}
          aria-disabled={!href}
        >Blog erstellen</Link>
      </div>
    </div>
  );
}
