"use client";


import React, { useState } from 'react'
import { RegisterDataProvider } from './provider/RegisterDataProviderr';
import StepHandler from './_components/StepHandler';

const Page = () => {
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <RegisterDataProvider>
      <StepHandler/>
    </RegisterDataProvider>
  )
}

export default Page;