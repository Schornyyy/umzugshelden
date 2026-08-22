"use client";
import { redirectUser } from "@/actions/userActions";
import { AdminSideBar } from "@/components/AdminSidebar";
import MobileAdminNavigation from "@/components/MobileAdminNavigation";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import React, { ReactNode, useEffect } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  const { companyData } = useCompanyData();

  useEffect(() => {
    if (!companyData?.id) {
      redirectUser("/login");
    }
  }, [companyData]);

  return (
    <SidebarProvider className='min-h-[100dvh] bg-slate-950'>
      <AdminSideBar className='z-30 bg-slate-950' />
      <SidebarInset className='min-h-[100dvh] bg-slate-50 md:p-6'>
        <header className='sticky top-0 z-20 flex h-[calc(4rem+env(safe-area-inset-top))] items-center justify-between border-b border-slate-200 bg-white/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden'>
          <div className='flex items-center gap-3'>
            <SidebarTrigger
              className='h-10 w-10 rounded-md border border-slate-200 text-slate-900'
              title='Menü öffnen'
            />
            <div>
              <p className='text-xs font-medium uppercase tracking-[0.16em] text-slate-500'>
                Umzugshelden
              </p>
              <p className='text-sm font-semibold text-slate-950'>Adminbereich</p>
            </div>
          </div>
          <span className='flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white'>
            U
          </span>
        </header>
        <div className='min-h-0 flex-1 px-3 py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-5 md:p-0'>
          {children}
        </div>
        <MobileAdminNavigation />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
