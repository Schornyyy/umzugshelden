import React, { ReactNode } from "react";
import Navbar from "./_components/Navbar";
import Footer from "./_components/Footer";
import WhatsAppBtn from "./_components/WhatsAppBtn";

const layout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <Navbar />
      {children}
      <WhatsAppBtn />
      <Footer />
    </>
  );
};

export default layout;
