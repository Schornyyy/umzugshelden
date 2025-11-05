import { FAQType } from "@/types/utils/FAQType";
import React from "react";
import Headings from "../Headings";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

const FAQBlock = ({ faqs, title }: { faqs: FAQType[]; title: string }) => {
  // Generate JSON-LD FAQ schema from the provided faqs
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
  return (
    <div className='max-w-7xl bg-white shadow-md p-6 rounded-md self-center w-full'>
      {/* Structured data for FAQ - JSON-LD */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Headings level={3}>{title}</Headings>
      <Accordion type='single' collapsible>
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default FAQBlock;
