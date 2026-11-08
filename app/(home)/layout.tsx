import React, { ReactNode } from "react";
import Navbar from "./_components/Navbar";
import Footer from "./_components/Footer";
import MobileCallButton from "./_components/MobileCallButton";

const layout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <Navbar />
      {children}
      <MobileCallButton />
      <Footer />
    </>
  );
};

export default layout;
