"use client";

import { useCompanyData } from "@/provider/CompanyDataProvider";
import { Calculator, ClipboardCheck, LayoutDashboard, ReceiptText, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Dashboard", segment: "/crm", icon: LayoutDashboard, exact: true },
  { label: "Kunden", segment: "/crm/customers", icon: UsersRound },
  { label: "Rechnungen", segment: "/crm/invoices", icon: ReceiptText },
  { label: "Übergaben", segment: "/crm/protocols", icon: ClipboardCheck },
  { label: "Kalkulator", segment: "/crm/calculator", icon: Calculator },
];

export default function CrmNavigation() {
  const { companyData } = useCompanyData();
  const pathname = usePathname();
  const basePath = `/admin/${companyData?.id}`;

  return (
    <nav className='mb-5 flex gap-1 overflow-x-auto border-b border-slate-200' aria-label='CRM Bereiche'>
      {tabs.map(({ label, segment, icon: Icon, exact }) => {
        const href = `${basePath}${segment}`;
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={segment}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-medium transition ${
              active
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-950"
            }`}>
            <Icon size={17} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}