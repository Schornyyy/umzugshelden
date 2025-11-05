import ReferenceBlock from "@/components/blocks/ReferenceBlock";
import React from "react";

const ReferencePage = () => {
  return (
    <div className='container mx-auto py-12 flex flex-col gap-12'>
      <ReferenceBlock
        title='Bereits über 10 erfolgreiche Projekte mit Handwerksbetrieben.'
        subtext='Messbare Erfolge - statt nur Klicks'
      />
    </div>
  );
};

export default ReferencePage;
