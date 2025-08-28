"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, Euro, Loader2 } from "lucide-react";
import { ContractPreview } from "@/actions/contractActions";

interface AvailableContractCardProps {
  contract: ContractPreview;
  onPurchase: (contract: ContractPreview) => void;
  purchasing: string | null;
  calculatePrice: (contract: ContractPreview) => number;
  calculateValue: (contract: ContractPreview) => string;
  formatTimeAgo: (timestamp: Date | undefined) => string;
  freeEligible?: boolean;
}

export const AvailableContractCard: React.FC<AvailableContractCardProps> = ({
  contract,
  onPurchase,
  purchasing,
  calculatePrice,
  calculateValue,
  formatTimeAgo,
  freeEligible = false,
}) => {
  const contractValue = calculateValue(contract);

  const locationMap: Record<string, string> = {
    front: "Vordergarten",
    back: "Hintergarten",
    side: "Seitengarten",
  };

  const projectTypeMap: Record<string, string> = {
    "small changes": "Kleine Änderungen",
    "large changes": "Große Änderungen",
    new: "Neubau",
    request: "Auf Anfrage",
  };

  return (
    <Card className='hover:shadow-lg transition-shadow'>
      <CardHeader>
        <div className='flex justify-between items-start'>
          <CardTitle className='text-lg'>{contract.type}</CardTitle>
          <div className='flex items-center text-sm text-gray-500'>
            <MapPin className='h-4 w-4 mr-1' />
            {contract.distance && `${contract.distance}km`}
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div>
            <span className='font-medium'>PLZ:</span> {contract.zip}
          </div>
          <div>
            <span className='font-medium'>Gartengröße:</span>{" "}
            {contract.gardenSize}m²
          </div>
          <div>
            <span className='font-medium'>Umfang:</span>{" "}
            {projectTypeMap[contract.contractSize] || contract.contractSize}
          </div>
          <div>
            <span className='font-medium'>Bereich:</span>{" "}
            {locationMap[contract.gardenLocation] || contract.gardenLocation}
          </div>
        </div>

        <div>
          <span className='font-medium'>Projektbeschreibung:</span>
          <p className='text-sm text-gray-700 mt-1 line-clamp-3'>
            {contract.description}
          </p>
        </div>

        <div className='flex items-center justify-between text-sm'>
          <div className='flex items-center text-gray-500'>
            <Clock className='h-4 w-4 mr-1' />
            {formatTimeAgo(contract.createdAt)}
          </div>
          <div
            className={`px-2 py-1 rounded text-xs font-medium ${
              contractValue === "Hoch"
                ? "bg-green-100 text-green-800"
                : contractValue === "Mittel"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}>
            {contractValue} Wert
          </div>
        </div>

        <Separator />

        <div className='flex justify-between items-center'>
          <div className='flex items-center text-green-600 font-semibold'>
            <Euro className='h-4 w-4 mr-1' />€
            {calculatePrice(contract).toFixed(2)}
          </div>
          <Button
            onClick={() => onPurchase(contract)}
            disabled={purchasing === contract.id}
            size='sm'>
            {purchasing === contract.id ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin mr-2' />
                Erwirbt...
              </>
            ) : freeEligible ? (
              "Jetzt kostenlos sichern"
            ) : (
              "Auftrag erwerben"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
