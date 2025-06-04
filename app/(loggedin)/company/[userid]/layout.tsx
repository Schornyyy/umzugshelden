"use client";
import { redirectUser } from "@/actions/userActions";
import { CompanySideBar } from "@/components/CompanySidebar";
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
    <SidebarProvider>
      <CompanySideBar className='z-20 bg-slate-800' />
      <SidebarInset className='md:p-6 flex flex-col gap-2'>
        <div className='flex flex-col md:hidden bg-primary z-20 sticky top-0 px-4'>
          <SidebarTrigger
            className='md:hidden text-white w-fit my-2 z-20'
            color='white'></SidebarTrigger>
        </div>
        <div className='max-md:p-4'>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
