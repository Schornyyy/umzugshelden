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
import { useCompanyData } from "@/provider/CompanyDataProvider";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/config/firebase";
import { useEffect, useState } from "react";
import { redirectUser } from "@/actions/userActions";
import { ContractRequest } from "@/types/ContractRequest";
import { getContractRequestsByCompanyId } from "@/actions/CompanyContractRequestAction";

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
          title: "Dienstleistungen",
          url: "/services",
        },
        {
          title: "Anfragen",
          url: "/inquiry",
        },
        {
          title: "Aufträge",
          url: "/contracts",
        },
        {
          title: "Statistiken",
          url: "/stats",
        },
      ],
    },
  ],
};

export function CompanySideBar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { companyData } = useCompanyData();
  const [contracts, setContracts] = useState<ContractRequest[]>([]);

  useEffect(() => {
    if (!companyData) return;

    async function getContracts() {
      const resp = await getContractRequestsByCompanyId(companyData!.id!);

      if (resp.length > 0) {
        setContracts(resp);
      }
    }
    getContracts();
  }, [companyData]);

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
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel className='text-white'>
              {item.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => {
                  const unreadContracts = contracts.filter(
                    (con) => con.status === "unread"
                  );

                  if (item.title === "Anfragen" && unreadContracts.length > 0) {
                    return (
                      <SidebarMenuItem key={item.title} className='text-white'>
                        <SidebarMenuButton
                          asChild
                          className='hover:bg-slate-700 hover:text-white'>
                          <a
                            href={`/company/${companyData!.id}${item.url}`}
                            className='text-white relative'>
                            {item.title}
                            <span className='text-sm h-[18px] flex items-center justify-center w-[18px] rounded-full bg-amber-500'>
                              {unreadContracts.length}
                            </span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  } else {
                    return (
                      <SidebarMenuItem key={item.title} className='text-white'>
                        <SidebarMenuButton
                          asChild
                          className='hover:bg-slate-700 hover:text-white'>
                          <a
                            href={`/company/${companyData!.id}${item.url}`}
                            className='text-white'>
                            {item.title}
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
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
