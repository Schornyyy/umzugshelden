"use client";

import React from "react";

interface ProjectFilesProps {
  files?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

export const ProjectFiles: React.FC<ProjectFilesProps> = ({ files }) => {
  if (!files || files.length === 0) return null;

  return (
    <div className='mb-4'>
      <h5 className='font-medium text-green-700 mb-2'>
        Projektdateien ({files.length}):
      </h5>
      <div className='space-y-1'>
        {files.map((file, index: number) => (
          <a
            key={index}
            href={file.url}
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center text-sm text-blue-600 hover:underline bg-white p-2 rounded border'>
            📎 <span className='ml-1'>{file.name}</span>
            <span className='ml-auto text-xs text-gray-500'>({file.type})</span>
          </a>
        ))}
      </div>
    </div>
  );
};
