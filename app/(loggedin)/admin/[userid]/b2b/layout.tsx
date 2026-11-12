import { Building2, LayoutDashboard, Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export default async function B2bLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ userid: string }>;
}) {
  const { userid } = await params;
  const base = `/admin/${userid}/b2b`;

  return (
    <div className='mx-auto w-full max-w-[1500px] space-y-5'>
      <nav className='flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm'>
        <Link
          href={`${base}/dashboard`}
          className='flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100'>
          <LayoutDashboard className='h-4 w-4' />
          Dashboard
        </Link>
        <Link
          href={`${base}/crm`}
          className='flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100'>
          <Building2 className='h-4 w-4' />
          B2B CRM
        </Link>
        <Link
          href={`${base}/recherche`}
          className='flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100'>
          <Search className='h-4 w-4' />
          Lead-Recherche
        </Link>
      </nav>
      {children}
    </div>
  );
}
