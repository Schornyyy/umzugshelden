import Image from "next/image";
import React from "react";

const logoList: string[] = [
  "/images/logos/Björnweis.png",
  "/images/logos/FutureStay.png",
  "/images/logos/Glanzkönig.png",
  "/images/logos/Glanzwerk.png",
  "/images/logos/hoxha.png",
  "/images/logos/ks.png",
  "/images/logos/TommyR.png",
];

const CustomerLogoLoop = () => {
  // Duplicate the list so the marquee can scroll seamlessly
  const logos = [...logoList, ...logoList];

  return (
    <div className='logo-marquee overflow-hidden'>
      <div className='logo-track flex items-center'>
        {logos.map((logoSrc, index) => (
          <div key={index} className='flex items-center justify-center px-6'>
            <Image
              src={logoSrc}
              alt={`Logo ${index + 1}`}
              height={124}
              width={124}
              className='h-24 w-24 object-contain'
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerLogoLoop;
