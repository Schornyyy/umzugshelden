"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import React, { useEffect, useRef, useState } from "react";
import CompanyLinks from "./CompanyLinks";
import { CompanyType } from "@/types/RegisterTypye";
import Image from "next/image";
import { convertFromRaw, Editor, EditorState } from "draft-js";
import ShareButtons from "@/components/ShareButtons";
import { saveClick } from "@/actions/userActions";

const CompanyInfos = ({ companyData }: { companyData: CompanyType }) => {
  const [editorStateDesc, setEditorStateDesc] = useState<EditorState | null>(
    null
  );
  const trackedRef = useRef(false);

  useEffect(() => {
    const loadEditor = () => {
      try {
        if (companyData.description && companyData.description !== "") {
          const parsedContent = JSON.parse(companyData.description);
          const contentState = convertFromRaw(parsedContent);
          setEditorStateDesc(EditorState.createWithContent(contentState));
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        console.error(
          "Invalid description format, initializing with empty editor",
          e
        );
        setEditorStateDesc(EditorState.createEmpty());
      }
    };

    loadEditor();
  }, [companyData.description]);

  // Track a profile view once per mount for this company
  useEffect(() => {
    if (!companyData?.id || trackedRef.current) return;
    trackedRef.current = true;
    void saveClick("company", companyData.id);
  }, [companyData?.id]);

  return (
    <div className='flex flex-col lg:flex-row gap-16'>
      {/* Company Image Carousel */}
      <div className='relative mx-auto lg:mx-0'>
        <Carousel className='w-80 h-80 sm:w-96 sm:h-96 max-md:mb-24'>
          <CarouselContent>
            {companyData.images?.map((image, index) => (
              <CarouselItem key={index}>
                <Image
                  alt={companyData.companyName!}
                  src={image}
                  height={512}
                  width={512}
                  className='object-cover w-full h-full'
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          {companyData.images && companyData.images.length > 1 && (
            <>
              <CarouselPrevious />
              <CarouselNext />
            </>
          )}
        </Carousel>
      </div>
      <div className='flex flex-col gap-8 w-full lg:w-2/3'>
        {/* Company Name*/}
        <h1 className='font-bold text-2xl sm:text-4xl text-center lg:text-left'>
          {companyData.companyName}
        </h1>
        {/*Company Description*/}
        {editorStateDesc ? (
          <Editor editorState={editorStateDesc} onChange={() => {}} />
        ) : (
          companyData.description && <p>{companyData.description}</p>
        )}
        {/* Links */}
        <CompanyLinks companyData={companyData} />
        {/* Dienstleistungen */}
        <div className='flex flex-col gap-4'>
          <p className='font-semibold'>Dienstleistungen:</p>
          <div className='flex flex-wrap gap-2'>
            {companyData.services ? (
              companyData.services.map((service) => (
                <p
                  key={service}
                  className='py-1 px-4 bg-green-200 rounded-xl text-sm sm:text-base'>
                  {service}
                </p>
              ))
            ) : (
              <p>Keine Dienstleistungen eingetragen.</p>
            )}
          </div>
        </div>
        <ShareButtons />
      </div>
    </div>
  );
};

export default CompanyInfos;
