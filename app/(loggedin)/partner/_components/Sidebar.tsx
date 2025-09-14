"use client";

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
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/config/firebase";
import { signOut } from "firebase/auth";
import { redirectUser } from "@/actions/userActions";
import { useParams } from "next/navigation";
const nav = [
  { title: "Übersicht", url: "" },
  { title: "Kampagnen", url: "campaigns" },
  { title: "Leads", url: "leads" },
  { title: "Einstellungen", url: "/partner/settings" },
  { title: "Partnerseite", url: "/partner/partnerseite" },
];

export function PartnerSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const params = useParams<{ userid?: string }>();
  function handleLogout() {
    signOut(auth);
    redirectUser("/login");
  }

  function handleStartNavigation() {
    redirectUser("/");
  }

  return (
    <Sidebar {...props} className='bg-slate-800 sticky left-0 top-0 z-50'>
      <SidebarHeader className='p-6'>
        <Image
          src={"/images/JobSmith_Logo.png"}
          alt='Landschaftshelden Logo'
          height={420}
          width={420}
          className='object-contain'
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className='text-white'>
            Partner-Portal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.title} className='text-white'>
                  <SidebarMenuButton
                    asChild
                    className='hover:bg-slate-700 hover:text-white'>
                    <a
                      href={
                        item.url.startsWith("/")
                          ? `/partner/${params.userid}${item.url.replace(
                              "/partner",
                              ""
                            )}`
                          : `/partner/${params.userid}/${item.url}`
                      }
                      className='text-white'>
                      {item.title}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarFooter className='absolute bottom-3 left-3 z-20'>
          <Button
            className='flex flex-row gap-2 bg-blue-500'
            onClick={handleStartNavigation}>
            <ArrowLeft color='white' height={18} width={18} />
            Hauptseite
          </Button>
          <Button
            className='flex flex-row gap-2 bg-red-500'
            onClick={handleLogout}>
            <ArrowLeft color='white' height={18} width={18} />
            Logout
          </Button>
        </SidebarFooter>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
