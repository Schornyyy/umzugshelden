import Link from "next/link";
import React from "react";
import { FaWhatsapp } from "react-icons/fa";

const WhatsAppBtn = () => {
  return (
    <Link
      href='https://wa.me/4915168567708'
      target='_blank'
      rel='noopener noreferrer'
      className='fixed bottom-4 right-4 z-50 p-4 rounded-full bg-green-950 shadow-lg hover:bg-green-800 transition-colors duration-300'>
      <FaWhatsapp size={40} className='text-green-400' />
    </Link>
  );
};

export default WhatsAppBtn;
