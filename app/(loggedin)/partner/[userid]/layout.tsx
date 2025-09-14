"use client";

import React from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { PartnerSidebar } from "../_components/Sidebar";

export default function PartnerUserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <PartnerSidebar />
      <SidebarInset className='md:p-6 flex flex-col gap-2 w-full'>
        <div className='flex flex-col md:hidden bg-primary z-20 sticky top-0 px-4'>
          <SidebarTrigger
            className='md:hidden text-white w-fit my-2 z-20'
            color='white'></SidebarTrigger>
        </div>
        <div className='max-md:p-4'>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
