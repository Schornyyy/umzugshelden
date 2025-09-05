import React from "react";
import Link from "next/link";

export default function CityNotFound() {
  return (
    <div className='max-w-xl mx-auto py-20 px-4 text-center space-y-6'>
      <h1 className='text-3xl font-bold'>Stadt noch nicht verfügbar</h1>
      <p className='text-gray-600'>
        Diese Stadt ist noch nicht aktiv. Du kannst aber schon jetzt einen
        Auftrag einstellen – wir informieren passende Firmen sobald sie
        verfügbar sind.
      </p>
      <div className='p-4 border rounded bg-white'>
        <p className='text-sm text-gray-500 mb-2'>
          Auftragserstellung (Placeholder)
        </p>
        <Link
          href='/auftrag-erstellen'
          className='inline-block bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 text-sm'>
          Auftrag jetzt einstellen
        </Link>
      </div>
      <p className='text-xs text-gray-400'>
        Weitere Städte folgen schrittweise.
      </p>
    </div>
  );
}
