"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Disable scrolling when the mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMenuOpen]);

  // Function to handle link click
  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-green-600">
          <Image alt="JobSmith Logo" src={"/images/JobSmith_Logo_Green.png"} height={128} width={256} className="object-cover"/>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-6">
          <Link href="/" className="text-gray-600 hover:text-green-600">
            Startseite
          </Link>
          <Link href="/fuer-unternehmen" className="text-gray-600 hover:text-green-600">
            Für Unternehmen
          </Link>
          <Link href="/unternehmen-finden" className="text-gray-600 hover:text-green-600">
            Unternehmen finden
          </Link>
          <Link href="/kontakt" className="text-gray-600 hover:text-green-600">
            Kontakt
          </Link>
        </div>

        {/* Call-to-Action Button */}
        <div className="hidden md:block">
          <Link
            href="/unternehmen-finden"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Jetzt Handwerker finden
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-600 focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16m-7 6h7"
            ></path>
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center animate-fadeIn gap-6">
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 text-gray-600 focus:outline-none"
            onClick={() => setIsMenuOpen(false)}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>

          <Link
            href="/"
            className="text-2xl text-gray-600 hover:text-green-600 transition-opacity delay-100"
            onClick={handleLinkClick}
          >
            Startseite
          </Link>
          <Link
            href="/fuer-unternehmen"
            className="text-2xl text-gray-600 hover:text-green-600 transition-opacity delay-200"
            onClick={handleLinkClick}
          >
            Für Unternehmen
          </Link>
          <Link
            href="/unternehmen-finden"
            className="text-2xl text-gray-600 hover:text-green-600 transition-opacity delay-300"
            onClick={handleLinkClick}
          >
            Unternehmen finden
          </Link>
          <Link
            href="/kontakt"
            className="text-2xl text-gray-600 hover:text-green-600 transition-opacity delay-400"
            onClick={handleLinkClick}
          >
            Kontakt
          </Link>
          <Link
            href="/unternehmen-finden"
            className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 transition-opacity delay-500"
            onClick={handleLinkClick}
          >
            Jetzt Handwerker finden
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
