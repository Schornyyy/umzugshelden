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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { Button } from "./ui/button";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Calculator,
  ChevronDown,
  ClipboardList,
  FileText,
  Factory,
  Inbox,
  ListChecks,
  LayoutTemplate,
  MapPinned,
  MessageSquareQuote,
  MessagesSquare,
  PackageCheck,
  PackagePlus,
  Search,
  Settings,
  Trash2,
  UsersRound,
  Wrench,
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
          title: "CRM",
          url: "/crm",
          icon: UsersRound,
          exact: true,
        },
        {
          title: "Termin-Checklisten",
          url: "/crm/checklists",
          icon: ListChecks,
        },
        {
          title: "Städte",
          url: "/citys",
          icon: MapPinned,
          collapsible: "cities",
          children: [
            {
              title: "Übersicht",
              url: "/citys",
              icon: MapPinned,
              exact: true,
            },
            {
              title: "Freigaben",
              url: "/citys/freigaben",
              icon: ListChecks,
              exact: true,
            },
          ],
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
          url: "/crm/calculator",
          icon: Calculator,
          collapsible: "calculator",
          children: [
            {
              title: "Übersicht",
              url: "/crm/calculator",
              icon: Calculator,
              exact: true,
            },
            {
              title: "Umzugspreisberechnung",
              url: "/crm/calculator/pricing",
              icon: Calculator,
              exact: true,
            },
            {
              title: "Entrümpelungskalkulation",
              url: "/crm/calculator/clearance",
              icon: Trash2,
              exact: true,
            },
            {
              title: "Entrümpelungspreise",
              url: "/crm/calculator/clearance/pricing",
              icon: Calculator,
              exact: true,
            },
            {
              title: "Möbelmontage kalkulieren",
              url: "/crm/calculator/furniture-assembly",
              icon: Wrench,
              exact: true,
            },
            {
              title: "Möbelmontagepreise",
              url: "/crm/calculator/furniture-assembly/pricing",
              icon: Calculator,
              exact: true,
            },
            {
              title: "Ein-/Auspacken kalkulieren",
              url: "/crm/calculator/packing",
              icon: PackagePlus,
              exact: true,
            },
            {
              title: "Ein-/Auspackpreise",
              url: "/crm/calculator/packing/pricing",
              icon: Calculator,
              exact: true,
            },
          ],
        },
        {
          title: "Material-Preisliste",
          url: "/material-preisliste",
          icon: PackageCheck,
        },
      ],
    },
    {
      title: "Page-builder Elemente",
      url: "/page-builder",
      items: [
        {
          title: "Bewertungen",
          url: "/page-builder/bewertungen",
          icon: MessageSquareQuote,
        },
        {
          title: "Landingpages",
          url: "/page-builder/landingpages",
          icon: LayoutTemplate,
        },
      ],
    },
    {
      title: "Wissen",
      url: "/knowledge",
      items: [
        {
          title: "Chat",
          url: "/knowledge/chat",
          icon: MessagesSquare,
        },
        {
          title: "Firmenwissen",
          url: "/knowledge/company",
          icon: Factory,
        },
        {
          title: "Einstellungen",
          url: "/knowledge/settings",
          icon: Settings,
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
  const [b2bOpen, setB2bOpen] = React.useState(pathname.includes("/b2b"));
  const [citiesOpen, setCitiesOpen] = React.useState(
    pathname.includes("/citys"),
  );
  const [calculatorOpen, setCalculatorOpen] = React.useState(
    pathname.includes("/crm/calculator"),
  );

  React.useEffect(() => {
    if (pathname.includes("/b2b")) setB2bOpen(true);
    if (pathname.includes("/citys")) setCitiesOpen(true);
    if (pathname.includes("/crm/calculator")) setCalculatorOpen(true);
  }, [pathname]);

  async function handleLogout() {
    await signOut(auth);
    router.replace("/login");
  }

  return (
    <Sidebar
      {...props}
      collapsible='icon'
      className='sticky left-0 top-0 bg-slate-950 text-white'>
      <SidebarHeader className='border-b border-slate-800 px-3 py-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2'>
        <div className='flex w-full items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center'>
          <Image
            src={"/images/Umzugshelden.png"}
            alt='Umzugshelden'
            height={256}
            width={256}
            className='h-auto w-36 object-contain brightness-0 invert group-data-[collapsible=icon]:hidden'
          />
          <SidebarTrigger
            title='Seitenleiste ein- oder ausklappen (Strg+B)'
            className='h-9 w-9 shrink-0 text-slate-300 hover:bg-slate-800 hover:text-white'
          />
        </div>
        <p className='mt-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400 group-data-[collapsible=icon]:hidden'>
          Verwaltungsbereich
        </p>
      </SidebarHeader>
      <SidebarContent className='px-3 py-4 group-data-[collapsible=icon]:px-2'>
        <SidebarGroup>
          <SidebarGroupLabel className='px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500'>
            Vertrieb
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className='gap-1'>
              <SidebarMenuItem>
                <SidebarMenuButton
                  type='button'
                  tooltip='B2B'
                  isActive={pathname.includes(`/admin/${companyData?.id}/b2b`)}
                  aria-expanded={b2bOpen}
                  onClick={() => setB2bOpen((current) => !current)}
                  className='h-11 rounded-md px-3 text-slate-300 hover:bg-slate-800 hover:text-white data-[active=true]:bg-blue-600 data-[active=true]:text-white'>
                  <Building2 className='h-5 w-5' />
                  <span>B2B</span>
                  <ChevronDown
                    className={`ml-auto h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden ${
                      b2bOpen ? "rotate-180" : ""
                    }`}
                  />
                </SidebarMenuButton>
                {b2bOpen && (
                  <SidebarMenu className='mt-1 gap-1 group-data-[collapsible=icon]:hidden'>
                    {[
                      { title: "CRM", url: "/b2b/crm", icon: UsersRound },
                      {
                        title: "Lead-Recherche",
                        url: "/b2b/recherche",
                        icon: Search,
                      },
                    ].map((item) => {
                      const href = `/admin/${companyData?.id}${item.url}`;
                      return (
                        <SidebarMenuItem key={item.url}>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname.startsWith(href)}
                            className='ml-5 h-10 w-[calc(100%-1.25rem)] rounded-md px-3 text-xs text-slate-300 hover:bg-slate-800 hover:text-white data-[active=true]:bg-blue-600 data-[active=true]:text-white'>
                            <Link href={href} onClick={() => setOpenMobile(false)}>
                              <item.icon className='h-4 w-4' />
                              {item.title}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel className='px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500'>
              {item.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className='gap-1'>
                {item.items.map((item) => {
                  if ("children" in item && item.children) {
                    const children = item.children;
                    const isOpen =
                      item.collapsible === "cities"
                        ? citiesOpen
                        : calculatorOpen;
                    const setIsOpen =
                      item.collapsible === "cities"
                        ? setCitiesOpen
                        : setCalculatorOpen;
                    const parentHref = `/admin/${companyData?.id}${item.url}`;

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          type='button'
                          tooltip={item.title}
                          isActive={pathname.startsWith(parentHref)}
                          aria-expanded={isOpen}
                          onClick={() => setIsOpen((current) => !current)}
                          className='h-11 rounded-md px-3 text-slate-300 hover:bg-slate-800 hover:text-white data-[active=true]:bg-blue-600 data-[active=true]:text-white'>
                          <item.icon className='h-5 w-5' />
                          <span>{item.title}</span>
                          <ChevronDown
                            className={`ml-auto h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </SidebarMenuButton>
                        {isOpen && (
                          <SidebarMenu className='mt-1 gap-1 group-data-[collapsible=icon]:hidden'>
                            {children.map((child) => {
                              const href = `/admin/${companyData?.id}${child.url}`;
                              const isActive = child.exact
                                ? pathname === href
                                : pathname.startsWith(href);
                              return (
                                <SidebarMenuItem key={child.url}>
                                  <SidebarMenuButton
                                    asChild
                                    isActive={isActive}
                                    className='ml-5 h-10 w-[calc(100%-1.25rem)] rounded-md px-3 text-xs text-slate-300 hover:bg-slate-800 hover:text-white data-[active=true]:bg-blue-600 data-[active=true]:text-white'>
                                    <Link
                                      href={href}
                                      onClick={() => setOpenMobile(false)}>
                                      <child.icon className='h-4 w-4' />
                                      {child.title}
                                    </Link>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              );
                            })}
                          </SidebarMenu>
                        )}
                      </SidebarMenuItem>
                    );
                  }

                  const href = `/admin/${companyData?.id}${item.url}`;
                  const isActive =
                    "exact" in item && item.exact
                      ? pathname === href
                      : pathname.startsWith(href);

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={isActive}
                        className='h-11 rounded-md px-3 text-slate-300 hover:bg-slate-800 hover:text-white data-[active=true]:bg-blue-600 data-[active=true]:text-white'>
                        <Link
                          href={href}
                          onClick={() => setOpenMobile(false)}>
                          <item.icon className='h-5 w-5' />
                          {item.title}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className='border-t border-slate-800 p-3 group-data-[collapsible=icon]:p-2'>
        <Button
          variant='ghost'
          title='Abmelden'
          className='h-11 w-full justify-start gap-3 rounded-md px-3 text-slate-300 hover:bg-red-500/15 hover:text-red-200 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0'
          onClick={handleLogout}>
          <ArrowLeft className='h-5 w-5' />
          <span className='group-data-[collapsible=icon]:hidden'>Abmelden</span>
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
