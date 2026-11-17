"use client";
import React, { useState } from 'react';
import ImagePickerField from '@/components/utils/ImagePickerField';

interface Props {
  name: string; // form field name
}

/** Thumbnail-Auswahl für unkontrollierte Formulare (Wert landet im Hidden-Input). */
const ThumbnailPickerField: React.FC<Props> = ({ name }) => {
  const [url, setUrl] = useState('');

  return (
    <div className="flex flex-col gap-2">
      <ImagePickerField label="Thumbnail (optional)" value={url} onChange={setUrl} />
      <input type="hidden" name={name} value={url} />
    </div>
  );
};

export default ThumbnailPickerField;
