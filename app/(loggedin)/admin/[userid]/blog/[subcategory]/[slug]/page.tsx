import React from "react";
import { getBlogPageBySlug } from "@/actions/blogPageActions";
import { getBlogSubcategoryBySlug } from "@/actions/blogSubcategoryActions";
import BlogPageEditorClient from "./BlogPageEditorClient";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ userid: string; subcategory: string; slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function BlogPageEditorPage({ params }: Props) {
  const { subcategory, slug } = await params;
  // Ensure subcategory exists to fetch its mainCategory
  const subcat = await getBlogSubcategoryBySlug(subcategory);
  if (!subcat) return notFound();
  const page = await getBlogPageBySlug(subcategory, slug);

  return (
    <div className='p-6 space-y-6'>
      <header className='space-y-1'>
        <h1 className='text-2xl font-semibold'>
          Blog Seite {page ? "bearbeiten" : "anlegen"}
        </h1>
        <p className='text-sm text-slate-600'>
          Subcategory: {subcat.name} ({subcat.slug}) • Slug: {slug}
        </p>
      </header>
      <BlogPageEditorClient
        initialData={page}
        subcategorySlug={subcat.slug}
        mainCategory={subcat.mainCategory}
      />
    </div>
  );
}
