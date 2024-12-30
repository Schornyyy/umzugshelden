"use client";


import React from 'react'
import { RegisterDataProvider } from './provider/RegisterDataProviderr';
import StepHandler from './_components/StepHandler';

const Page = () => {

  return (
    <RegisterDataProvider>
      <StepHandler/>
    </RegisterDataProvider>
  )
}

export default Page;