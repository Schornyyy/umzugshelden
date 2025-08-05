"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle } from "lucide-react";
import { ContactInfo } from "./ContactInfo";
import { ProjectDetails } from "./ProjectDetails";
import { ProjectFiles } from "./ProjectFiles";
import { InvoiceDownload } from "./InvoiceDownload";
import { PurchasedContractClient } from "./types";

interface PurchasedContractCardProps {
  purchase: PurchasedContractClient;
  onDownloadInvoice: (purchase: PurchasedContractClient) => Promise<void>;
}

export const PurchasedContractCard: React.FC<PurchasedContractCardProps> = ({
  purchase,
  onDownloadInvoice,
}) => {
  return (
    <Card className='border-green-200'>
      <CardHeader>
        <div className='flex justify-between items-start'>
          <CardTitle className='text-lg'>{purchase.contractTitle}</CardTitle>
          <div className='flex items-center text-sm text-green-600'>
            <CheckCircle className='h-4 w-4 mr-1' />
            Bezahlt
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div>
            <span className='font-medium'>PLZ:</span> {purchase.contractZip}
          </div>
          <div>
            <span className='font-medium'>Preis:</span> €
            {purchase.amount.toFixed(2)}
          </div>
          <div>
            <span className='font-medium'>Gekauft am:</span>{" "}
            {new Date(purchase.purchasedAt).toLocaleDateString("de-DE")}
          </div>
          <div>
            <span className='font-medium'>Status:</span>{" "}
            <span className='capitalize text-green-600'>
              {purchase.paymentStatus}
            </span>
          </div>
        </div>

        {purchase.contractData ? (
          <div className='bg-green-50 p-4 rounded-lg'>
            <h4 className='font-medium text-green-800 mb-3'>
              Vollständige Auftrag Details
            </h4>

            <ContactInfo contact={purchase.contractData.contact} />
            <ProjectDetails contractData={purchase.contractData} />
            <ProjectFiles files={purchase.contractData.files} />

            <InvoiceDownload
              stripePaymentIntentId={purchase.stripePaymentIntentId}
              stripeSessionId={purchase.stripeSessionId}
              onDownload={() => onDownloadInvoice(purchase)}
            />
          </div>
        ) : (
          <div className='bg-yellow-50 p-4 rounded-lg'>
            <div className='flex items-center text-yellow-800'>
              <AlertCircle className='h-4 w-4 mr-2' />
              <span className='text-sm'>Auftrag-Details werden geladen...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
