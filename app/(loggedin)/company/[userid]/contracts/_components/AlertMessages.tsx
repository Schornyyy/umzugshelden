"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";

interface AlertMessagesProps {
  showSuccessMessage: boolean;
  showErrorMessage: string | null;
  onDismissSuccess: () => void;
  onDismissError: () => void;
}

export const AlertMessages: React.FC<AlertMessagesProps> = ({
  showSuccessMessage,
  showErrorMessage,
  onDismissSuccess,
  onDismissError,
}) => {
  return (
    <>
      {/* Erfolgsmeldung */}
      {showSuccessMessage && (
        <div className='mb-6 bg-green-50 border border-green-200 rounded-lg p-4'>
          <div className='flex items-center'>
            <CheckCircle className='h-5 w-5 text-green-600 mr-2' />
            <div>
              <h3 className='text-green-800 font-medium'>
                Auftrag erfolgreich erworben!
              </h3>
              <p className='text-green-700 text-sm'>
                Sie können den Auftrag jetzt in Ihren erworbenen Aufträgen
                einsehen.
              </p>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={onDismissSuccess}
              className='ml-auto text-green-600 hover:text-green-700'>
              ✕
            </Button>
          </div>
        </div>
      )}

      {/* Fehlermeldung */}
      {showErrorMessage && (
        <div className='mb-6 bg-red-50 border border-red-200 rounded-lg p-4'>
          <div className='flex items-center'>
            <AlertCircle className='h-5 w-5 text-red-600 mr-2' />
            <div>
              <h3 className='text-red-800 font-medium'>
                Zahlung nicht erfolgreich
              </h3>
              <p className='text-red-700 text-sm'>{showErrorMessage}</p>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={onDismissError}
              className='ml-auto text-red-600 hover:text-red-700'>
              ✕
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
