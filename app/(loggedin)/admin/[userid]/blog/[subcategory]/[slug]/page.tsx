import React from "react";
import { getBlogPageBySlug, listAllBlogPages } from "@/actions/blogPageActions";
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
  const allPages = await listAllBlogPages();

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
        requestedSlug={slug}
        availableParents={allPages
          .filter((item) => item.id !== page?.id)
          .map((item) => ({ id: item.id, titel: item.titel, path: item.path || item.slug }))}
      />
    </div>
  );
}
