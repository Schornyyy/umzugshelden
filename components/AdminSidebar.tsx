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
import { ArrowLeft } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/config/firebase";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import { redirectUser } from "@/actions/userActions";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Einstellungen",
      url: "/",
      items: [
        {
          title: "Unternehmen",
          url: "/",
        },
        {
          title: "Importieren",
          url: "/imports",
        },
        {
          title: "Aufträge",
          url: "/contracts",
        },
        {
          title: "Partner",
          url: "/partners",
        },
        {
          title: "Städte",
          url: "/citys",
        },
        {
          title: "Statistiken",
          url: "/statistiken",
        },
      ],
    },
  ],
};

export function AdminSideBar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { companyData } = useCompanyData();

  function handleLogout() {
    signOut(auth);
    redirectUser("/login");
  }

  return (
    <Sidebar {...props} className='bg-slate-800 sticky left-0 top-0'>
      <SidebarHeader className='p-6'>
        <Image
          src={"/images/JobSmith_Logo.png"}
          alt='Reinigungshelden Logo'
          height={420}
          width={420}
          className='object-contain'
        />
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel className='text-white'>
              {item.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title} className='text-white'>
                    <SidebarMenuButton
                      asChild
                      className='hover:bg-slate-700 hover:text-white'>
                      <a
                        href={`/admin/${companyData!.id}${item.url}`}
                        className='text-white'>
                        {item.title}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        <SidebarFooter className='absolute bottom-3 left-3 z-20'>
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
