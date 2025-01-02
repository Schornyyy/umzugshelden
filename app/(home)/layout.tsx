import React, { ReactNode } from 'react'
import Navbar from './_components/Navbar'
import Footer from './_components/Footer'

const layout = ({children} : {children: ReactNode}) => {
  return (
    <>
    <Navbar />
    {children}
    <Footer/>
    </>
  )
}

export default layout