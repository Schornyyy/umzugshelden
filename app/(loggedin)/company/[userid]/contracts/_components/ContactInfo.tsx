"use client";

import React from "react";

interface ContactInfoProps {
  contact?: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
}

export const ContactInfo: React.FC<ContactInfoProps> = ({ contact }) => {
  if (!contact) return null;

  return (
    <div className='mb-4'>
      <h5 className='font-medium text-green-700 mb-2'>Kundenkontakt:</h5>
      <div className='grid grid-cols-2 gap-4 text-sm'>
        <div>
          <span className='font-medium'>Name:</span> {contact.firstName}{" "}
          {contact.lastName}
        </div>
        <div>
          <span className='font-medium'>Telefon:</span>{" "}
          <a
            href={`tel:${contact.phone}`}
            className='text-blue-600 hover:underline'>
            {contact.phone}
          </a>
        </div>
        <div className='col-span-2'>
          <span className='font-medium'>E-Mail:</span>{" "}
          <a
            href={`mailto:${contact.email}`}
            className='text-blue-600 hover:underline'>
            {contact.email}
          </a>
        </div>
      </div>
    </div>
  );
};
