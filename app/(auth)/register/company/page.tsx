"use client";

import React, { Suspense } from "react";
import { RegisterDataProvider } from "../provider/RegisterDataProviderr";
import StepHandler from "../_components/StepHandler";

const Page = () => {
  return (
    <RegisterDataProvider>
      <Suspense fallback={<div className='min-h-[60vh] flex items-center justify-center text-gray-500'>Lädt…</div>}>
        <StepHandler />
      </Suspense>
    </RegisterDataProvider>
  );
};

export default Page;
