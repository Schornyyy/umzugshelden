import React, { Suspense } from 'react'
import CompanySearchPage from './CompanySearchPage'

export async function generateMetadata() {
  return {
    title: 'Unternehmen finden - JobSmith',
    description: 'Finden Sie den passenden Garten- & Landschaftsbauer in Ihrer Nähe mit JobSmith. Durchsuchen Sie Unternehmen nach Stadt, Postleitzahl und Service.',
    openGraph: {
      title: 'Unternehmen finden - JobSmith',
      description: 'Finden Sie den passenden Garten- & Landschaftsbauer in Ihrer Nähe mit JobSmith. Durchsuchen Sie Unternehmen nach Stadt, Postleitzahl und Service.',
      url: 'https://jobsmith.de/unternehmen-finden',
      images: [
        {
          url: '/images/Unternhemen_finden_Hero.png',
          width: 750,
          height: 350,
          alt: 'JobSmith Unternehmen finden',
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Unternehmen finden - JobSmith',
      description: 'Finden Sie den passenden Garten- & Landschaftsbauer in Ihrer Nähe mit JobSmith. Durchsuchen Sie Unternehmen nach Stadt, Postleitzahl und Service.',
      image: '/images/Unternhemen_finden_Hero.png',
    },
  };
}

const page = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
        <CompanySearchPage />
    </Suspense>
  )
}

export default page