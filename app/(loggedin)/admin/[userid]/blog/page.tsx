import {
  listBlogSubcategories,
  createBlogSubcategory,
} from "@/actions/blogSubcategoryActions";
import type {
  BlogSubcategory,
  AdminBlogMainCategory,
} from "@/types/blog/BlogSubcategory";
import React from "react";
import SubcategoryClient from "./subcategoryClient";
import ThumbnailPickerField from "./ThumbnailPickerField";

const MAIN_CATEGORIES: AdminBlogMainCategory[] = [
  "unternehmen",
  "partner",
  "ratgeber",
  "ereignisse",
];

export const dynamic = "force-dynamic";

async function fetchAll(): Promise<BlogSubcategory[]> {
  return listBlogSubcategories();
}

export default async function BlogAdminOverview() {
  const items = await fetchAll();
  return (
    <div className='p-6 space-y-8'>
      <h1 className='text-2xl font-semibold'>Blog Kategorien Übersicht</h1>
      <CreateForm />
      <SubcategoryClient initialItems={items} />
    </div>
  );
}

function CreateForm() {
  async function action(formData: FormData) {
    "use server";
    const name = String(formData.get("name") || "").trim();
    const mainCategory = (formData.get("mainCategory") ||
      "companys") as AdminBlogMainCategory;
    const thumbnailUrl =
      String(formData.get("thumbnailUrl") || "").trim() || undefined;
    if (!name) return;
    await createBlogSubcategory({ name, mainCategory, thumbnailUrl });
  }
  return (
    <form action={action} className='space-y-4 p-4 border rounded max-w-xl'>
      <h2 className='font-medium'>Neue Unterkategorie anlegen</h2>
      <div className='flex flex-col gap-1'>
        <label className='text-sm'>Name</label>
        <input
          name='name'
          required
          className='border rounded px-2 py-1'
          placeholder='z.B. marketing'
        />
      </div>
      <div className='flex flex-col gap-1'>
        <label className='text-sm'>Hauptkategorie</label>
        <select name='mainCategory' className='border rounded px-2 py-1'>
          {MAIN_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <ThumbnailPickerField name='thumbnailUrl' />
      <button
        type='submit'
        className='bg-black text-white px-4 py-2 rounded text-sm'>
        Anlegen
      </button>
    </form>
  );
}
