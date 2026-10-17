import SemanticHeading from "@/components/SemanticHeading";
import { FAQType } from "@/types/utils/FAQType";
import React from "react";
import { renderInlineMarkdown } from "@/components/utils/InlineMarkdownText";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

const FAQBlock = ({
  faqs,
  title,
  headingLevel = 3,
  renderSchema = true,
}: {
  faqs: FAQType[];
  title: string;
  headingLevel?: 2 | 3 | 4;
  renderSchema?: boolean;
}) => {
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
    <div className='mx-auto my-36 w-full max-w-7xl rounded-md bg-white p-6 shadow-md'>
      {/* Structured data for FAQ - JSON-LD */}
      {renderSchema && (
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema).replaceAll("<", "\\u003c"),
          }}
        />
      )}
      <SemanticHeading
        level={headingLevel}
        className='font-sans text-md font-medium md:text-2xl'>
        {renderInlineMarkdown(title)}
      </SemanticHeading>
      <Accordion type='single' collapsible>
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger>
              {renderInlineMarkdown(faq.question)}
            </AccordionTrigger>
            <AccordionContent>
              {renderInlineMarkdown(faq.answer)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default FAQBlock;
