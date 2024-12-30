"use client"

import React from 'react'
import ImageUploadComponent from './_components/ImageUpload'
import CompanyInfosUpdate from './_components/CompanyInfosUpdate'

const page = () => {
  return (
    <div className='flex flex-col gap-12'>
      <div className='flex flex-col gap-4'>
        <h2 className='font-semibold text-2xl'>
          Unternehmensbilder
        </h2>
        <ImageUploadComponent />
      </div>
      <div className='w-full md:w-1/2'>
      <CompanyInfosUpdate />
      </div>

    </div>
  )
}

export default page