import React, { ReactNode } from 'react'
import Navbar from '../(home)/_components/Navbar'
import Footer from '../(home)/_components/Footer'

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