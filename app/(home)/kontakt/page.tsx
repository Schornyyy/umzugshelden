import React from "react";
import ContactForm from "@/components/ContactForm";

const ContactPage = () => {
  return (
    <div className='container mx-auto py-12 px-4 max-w-2xl'>
      <h1 className='text-3xl font-bold mb-4'>Kontakt</h1>
      <p className='text-gray-600 mb-6'>
        Schreib uns eine Nachricht — wir melden uns innerhalb von 24 Stunden.
      </p>
      <ContactForm />
    </div>
  );
};

export default ContactPage;
