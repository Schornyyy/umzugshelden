import Headings from "@/components/Headings";
import Image from "next/image";
import React from "react";

type BulletPointCard = {
  title: string;
  text: string;
  imagePath: string;
};

const BulletPointCards = () => {
  const points: BulletPointCard[] = [
    {
      title: "Systematisch",
      imagePath: "/icons/uil_laptop.svg",
      text: "Jede Website wird so aufgebaut, dass sie messbar Anfragen generiert.",
    },
    {
      title: "Nachhaltig",
      imagePath: "/icons/uil_laptop.svg",
      text: "Dank SEO wirst du langfristig online sichtbar – ohne Werbekosten.",
    },
    {
      title: "Einfach",
      imagePath: "/icons/uil_laptop.svg",
      text: "Du bekommst ein fertiges Tool, das funktioniert – ohne technisches Wissen.",
    },
  ];

  return (
    <div className='flex flex-row justify-between w-full gap-12'>
      {points.map((point, index) => (
        <div
          key={index}
          className='flex flex-col gap-4 items-center px-6 py-6 bg-white shadow-md rounded-md relative'>
          <div className='absolute -top-4 -left-4 bg-primary rounded-full h-12 w-12 flex items-center justify-center'>
            <p className='text-white'>{index + 1}</p>
          </div>
          <Image
            src={point.imagePath}
            alt={point.title}
            width={48}
            height={48}
            className='h-12 w-12'
          />
          <Headings level={3}>{point.title}</Headings>
          <p className='text-sm text-gray-600 text-center'>{point.text}</p>
        </div>
      ))}
    </div>
  );
};

export default BulletPointCards;
