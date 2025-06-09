"use client";

import { CompanyDataProvider } from "@/provider/CompanyDataProvider";
import React, { ReactNode } from "react";

const layout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <CompanyDataProvider>{children}</CompanyDataProvider>
    </>
  );
};

export default layout;
