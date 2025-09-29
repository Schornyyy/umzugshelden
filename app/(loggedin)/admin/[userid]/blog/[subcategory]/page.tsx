import React from "react";
import {
  getBlogSubcategoryBySlug,
  updateBlogSubcategory,
} from "@/actions/blogSubcategoryActions";
import { notFound } from "next/navigation";
import ThumbnailPickerField from "../ThumbnailPickerField";
import BlogCreateClient from "./BlogCreateClient";
import { listBlogPagesBySubcategoryPaginated } from "@/actions/blogPageActions";
import BlogPagesListClient from "./BlogPagesListClient";
import Image from "next/image";
// slugify & client navigation handled in BlogCreateClient

interface Props {
  params: Promise<{ subcategory: string; userid: string }>;
}

export const dynamic = "force-dynamic";

export default async function SubcategoryEditPage({ params }: Props) {
  const { subcategory, userid } = await params; // await for future-proofing (Next.js dynamic params async API)
  const slug = subcategory;
  const subcat = await getBlogSubcategoryBySlug(slug);
  if (!subcat) return notFound();

  return (
    <div className='p-6 space-y-10'>
      <header className='space-y-2'>
        <h1 className='text-2xl font-semibold'>Unterkategorie bearbeiten</h1>
        <p className='text-sm text-slate-600'>Slug: {subcat.slug}</p>
      </header>
      <EditForm subcat={subcat} />
      <section className='space-y-4'>
        <h2 className='text-xl font-semibold'>Beiträge</h2>
        <BlogPageCreateForm subcategorySlug={subcat.slug} userId={userid} />
        {/* Initial server render of page 1 */}
        <BlogPagesListServer subcategorySlug={subcat.slug} />
      </section>
    </div>
  );
}

function EditForm({
  subcat,
}: {
  subcat: { id: string; name: string; thumbnailUrl?: string };
}) {
  async function action(formData: FormData) {
    "use server";
    const name = String(formData.get("name") || "").trim();
    const thumbnailUrl = String(formData.get("thumbnailUrl") || "").trim();
    await updateBlogSubcategory(subcat.id, {
      name: name || undefined,
      thumbnailUrl,
    });
  }
  return (
    <form action={action} className='space-y-4 p-4 border rounded max-w-xl'>
      <h2 className='font-medium'>Stammdaten</h2>
      <div className='flex flex-col gap-1'>
        <label className='text-sm'>Name</label>
        <input
          name='name'
          defaultValue={subcat.name}
          className='border rounded px-2 py-1'
        />
      </div>
      <div className='space-y-2'>
        <ThumbnailPickerField name='thumbnailUrl' />
        {subcat.thumbnailUrl && (
          <div className='flex items-center gap-3'>
            <div className='relative w-16 h-16 border rounded overflow-hidden'>
              <Image
                src={subcat.thumbnailUrl}
                alt={subcat.name}
                fill
                className='object-cover'
              />
            </div>
            <p className='text-[11px] break-all text-slate-500 max-w-xs'>
              {subcat.thumbnailUrl}
            </p>
          </div>
        )}
      </div>
      <button
        type='submit'
        className='bg-black text-white px-4 py-2 rounded text-sm'>
        Speichern
      </button>
    </form>
  );
}

// Placeholder implementations; real blog page logic to be added (Firestore CRUD for pages)
function BlogPageCreateForm({
  subcategorySlug,
  userId,
}: {
  subcategorySlug: string;
  userId: string;
}) {
  return (
    <div className='space-y-3 p-4 border rounded max-w-2xl'>
      <h3 className='font-medium'>Neuen Beitrag anlegen</h3>
      <BlogCreateClient subcategorySlug={subcategorySlug} userId={userId} />
    </div>
  );
}

// Server wrapper fetches first page (page=1) and hydrates client component
async function BlogPagesListServer({
  subcategorySlug,
}: {
  subcategorySlug: string;
}) {
  const pageData = await listBlogPagesBySubcategoryPaginated(
    subcategorySlug,
    1,
    12
  );
  return (
    <BlogPagesListClient initial={pageData} subcategorySlug={subcategorySlug} />
  );
}
