"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const services = [
  { label: "Umzugsservice", href: "/umzugsservice" },
  { label: "Anstricharbeiten", href: "/anstricharbeiten" },
  { label: "Möbel Ab- & Aufbau", href: "/moebel-service" },
  { label: "Seniorenumzug", href: "/senior-umzug" },
  { label: "Entrümpelung", href: "/entruempelung" },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setServicesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMenuOpen]);

  const handleLinkClick = () => {
    setIsMenuOpen(false);
    setServicesOpen(false);
  };

  return (
    <nav
      className={`bg-white z-50 sticky top-0 w-full transition-shadow duration-300 ${
        scrolled ? "shadow-md" : "shadow-sm"
      }`}>
      <div className='container mx-auto px-4 py-4 flex items-center justify-between'>
        {/* Logo */}
        <Link href='/' className='font-sans font-bold text-2xl text-navy'>
          Umzugshelden
        </Link>

        {/* Desktop Navigation */}
        <div className='hidden xl:flex items-center space-x-8'>
          <Link
            href='/#einsatzgebiet'
            className='font-body text-gray-600 hover:text-primary transition-colors'>
            Einsatzgebiet
          </Link>

          {/* Dienstleistungen dropdown */}
          <div className='relative' ref={dropdownRef}>
            <button
              onClick={() => setServicesOpen(!servicesOpen)}
              className='font-body text-gray-600 hover:text-primary transition-colors flex items-center gap-1'>
              Dienstleistungen
              <svg
                className={`w-4 h-4 transition-transform ${servicesOpen ? "rotate-180" : ""}`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M19 9l-7 7-7-7'
                />
              </svg>
            </button>
            {servicesOpen && (
              <div className='absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50'>
                {services.map((s) => (
                  <Link
                    key={s.href}
                    href={s.href}
                    onClick={handleLinkClick}
                    className='block px-4 py-2.5 font-body text-sm text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors'>
                    {s.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href='/kontakt'
            className='font-body text-gray-600 hover:text-primary transition-colors'>
            Kontakt
          </Link>
          <Link
            href='/#anfrage'
            className='font-sans bg-primary text-white px-5 py-2.5 rounded font-medium hover:bg-primary/90 transition-colors text-sm'>
            Kostenloses Angebot anfordern!
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className='xl:hidden text-gray-700 focus:outline-none'
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label='Menü öffnen'>
          <svg
            className='w-6 h-6'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M4 6h16M4 12h16m-7 6h7'
            />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className='fixed inset-0 bg-white z-50 flex flex-col items-center justify-center gap-6 overflow-y-auto py-16'>
          <button
            className='absolute top-5 right-5 text-gray-600 focus:outline-none'
            onClick={() => setIsMenuOpen(false)}
            aria-label='Menü schließen'>
            <svg
              className='w-8 h-8'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
          <Link
            href='/'
            onClick={handleLinkClick}
            className='font-sans font-bold text-2xl text-navy'>
            Umzugshelden
          </Link>
          <Link
            href='/#einsatzgebiet'
            onClick={handleLinkClick}
            className='font-body text-gray-700 text-lg hover:text-primary'>
            Einsatzgebiet
          </Link>
          {/* Mobile service links */}
          <div className='flex flex-col items-center gap-3'>
            <p className='font-sans font-semibold text-navy text-sm uppercase tracking-wider'>
              Dienstleistungen
            </p>
            {services.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                onClick={handleLinkClick}
                className='font-body text-gray-700 text-base hover:text-primary'>
                {s.label}
              </Link>
            ))}
          </div>
          <Link
            href='/kontakt'
            onClick={handleLinkClick}
            className='font-body text-gray-700 text-lg hover:text-primary'>
            Kontakt
          </Link>
          <Link
            href='/#anfrage'
            onClick={handleLinkClick}
            className='font-sans bg-primary text-white px-6 py-3 rounded font-medium hover:bg-primary/90 transition-colors'>
            Kostenloses Angebot anfordern!
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
