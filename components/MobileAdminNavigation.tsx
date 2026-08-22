"use client";

import { useCompanyData } from "@/provider/CompanyDataProvider";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ClipboardList, FileText, Inbox, MapPinned } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const mobileItems = [
  { label: "Anfragen", segment: "/requests", icon: Inbox },
  { label: "Bewerbungen", segment: "/applications", icon: ClipboardList },
  { label: "Jobs", segment: "/jobs", icon: FileText },
  { label: "Städte", segment: "/citys", icon: MapPinned },
];

export default function MobileAdminNavigation() {
  const { companyData } = useCompanyData();
  const pathname = usePathname();

  if (!companyData?.id) {
    return null;
  }

  return (
    <nav
      aria-label='Admin-Navigation'
      className='fixed inset-x-0 bottom-0 z-40 grid h-[calc(4.75rem+env(safe-area-inset-bottom))] grid-cols-5 border-t border-slate-200 bg-white px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] md:hidden'>
      {mobileItems.map(({ label, segment, icon: Icon }) => {
        const href = `/admin/${companyData.id}${segment}`;
        const isActive = pathname.startsWith(href);

        return (
          <Link
            key={segment}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
              isActive ? "text-blue-700" : "text-slate-500"
            }`}>
            <Icon className='h-5 w-5' strokeWidth={isActive ? 2.5 : 2} />
            <span className='truncate'>{label}</span>
          </Link>
        );
      })}
      <div className='flex min-w-0 flex-col items-center justify-center text-[11px] font-medium text-slate-500'>
        <SidebarTrigger
          className='h-8 w-10 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-950'
          title='Weitere Bereiche öffnen'
        />
        <span>Mehr</span>
      </div>
    </nav>
  );
}