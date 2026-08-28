import type { ReactNode } from "react";
import CrmNavigation from "./CrmNavigation";

export default function CrmLayout({ children }: { children: ReactNode }) {
  return (
    <div className='mx-auto w-full max-w-[1500px]'>
      <CrmNavigation />
      {children}
    </div>
  );
}