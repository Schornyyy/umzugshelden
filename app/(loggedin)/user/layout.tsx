"use client"

import { CompanyDataProvider } from '@/provider/CompanyDataProvider'
import React, { ReactNode } from 'react'
import Sidebar from './_components/Sidebar'
import Navbar from './_components/Navbar'

const layout = ({children} : {children: ReactNode}) => {
  return (
    <>
    <CompanyDataProvider>
    <div className="flex min-h-screen">
    <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className='max-md:mt-12 p-6'>
        {children}
        </main>
      </div>
    </div>
    </CompanyDataProvider>
    </>
  )
}

export default layout