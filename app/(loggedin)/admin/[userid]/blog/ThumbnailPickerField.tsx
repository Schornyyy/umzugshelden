"use client";
import React, { useState } from 'react';
import MediathekDialog from '@/components/utils/MediathekDialog';
import Image from 'next/image';

interface Props {
  name: string; // form field name
}

const ThumbnailPickerField: React.FC<Props> = ({ name }) => {
  const [url, setUrl] = useState<string | undefined>(undefined);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <label className='text-sm'>Thumbnail (optional)</label>
        <MediathekDialog
          btnName={url ? 'Ändern' : 'Aus Mediathek wählen'}
          onSelect={(u) => {
            if (typeof u === 'string') setUrl(u);
            else if (Array.isArray(u) && u.length) setUrl(u[0]);
          }}
        />
        {url && (
          <button
            type="button"
            onClick={() => setUrl(undefined)}
            className="text-xs text-red-600 hover:underline"
          >Entfernen</button>
        )}
      </div>
      {url && (
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16 rounded overflow-hidden border">
            <Image src={url} alt="Thumbnail" fill className="object-cover" />
          </div>
          <p className="text-[10px] break-all max-w-xs">{url}</p>
        </div>
      )}
      <input type="hidden" name={name} value={url || ''} />
    </div>
  );
};

export default ThumbnailPickerField;
