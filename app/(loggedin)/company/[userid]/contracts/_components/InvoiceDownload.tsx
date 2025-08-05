"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface InvoiceDownloadProps {
  stripePaymentIntentId: string;
  stripeSessionId?: string;
  onDownload: () => void;
}

export const InvoiceDownload: React.FC<InvoiceDownloadProps> = ({
  stripePaymentIntentId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  stripeSessionId,
  onDownload,
}) => {
  const isInvoiceAvailable =
    stripePaymentIntentId &&
    stripePaymentIntentId !== "pending" &&
    stripePaymentIntentId !== "null";

  return (
    <div className='border-t pt-4 mt-4'>
      <div className='flex justify-between items-center'>
        <div className='text-sm text-gray-600'></div>
        {isInvoiceAvailable ? (
          <Button
            onClick={onDownload}
            variant='outline'
            size='sm'
            className='flex items-center space-x-2'>
            <svg
              className='h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
            <span>Rechnung herunterladen</span>
          </Button>
        ) : (
          <div className='text-sm text-gray-500 italic'>
            Rechnung wird nach Zahlungsabschluss verfügbar
          </div>
        )}
      </div>
    </div>
  );
};
