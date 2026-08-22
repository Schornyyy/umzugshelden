"use client";

import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { Button } from "./ui/button";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Calculator,
  ClipboardList,
  FileText,
  Inbox,
  MapPinned,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/config/firebase";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import { useSidebar } from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Einstellungen",
      url: "/",
      items: [
        {
          title: "Städte",
          url: "/citys",
          icon: MapPinned,
        },
        {
          title: "Blogs",
          url: "/blog",
          icon: FileText,
        },
        {
          title: "Anfragen",
          url: "/requests",
          icon: Inbox,
        },
        {
          title: "Jobs",
          url: "/jobs",
          icon: BriefcaseBusiness,
        },
        {
          title: "Bewerbungen",
          url: "/applications",
          icon: ClipboardList,
        },
        {
          title: "Kalkulator",
          url: "/offer",
          icon: Calculator,
        },
      ],
    },
  ],
};

export function AdminSideBar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { companyData } = useCompanyData();
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await signOut(auth);
    router.replace("/login");
  }

  return (
    <Sidebar {...props} className='sticky left-0 top-0 bg-slate-950 text-white'>
      <SidebarHeader className='border-b border-slate-800 px-5 py-5'>
        <Image
          src={"/images/Umzugshelden.png"}
          alt='Logo'
          height={256}
          width={256}
          className='h-auto w-40 object-contain brightness-0 invert'
        />
        <p className='mt-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-400'>
          Verwaltungsbereich
        </p>
      </SidebarHeader>
      <SidebarContent className='px-3 py-4'>
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel className='px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500'>
              {item.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className='gap-1'>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(
                        `/admin/${companyData?.id}${item.url}`
                      )}
                      className='h-11 rounded-md px-3 text-slate-300 hover:bg-slate-800 hover:text-white data-[active=true]:bg-blue-600 data-[active=true]:text-white'>
                      <Link
                        href={`/admin/${companyData?.id}${item.url}`}
                        onClick={() => setOpenMobile(false)}>
                        <item.icon className='h-5 w-5' />
                        {item.title}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className='border-t border-slate-800 p-3'>
        <Button
          variant='ghost'
          className='h-11 w-full justify-start gap-3 rounded-md px-3 text-slate-300 hover:bg-red-500/15 hover:text-red-200'
          onClick={handleLogout}>
          <ArrowLeft className='h-5 w-5' />
          Abmelden
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
