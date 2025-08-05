"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  CreditCard,
  MapPin,
  Euro,
  Clock,
  Loader2,
} from "lucide-react";
import { simulateSuccessfulPayment } from "@/actions/buyedContractActions";
import { ContractPreview } from "@/actions/contractActions";

interface CheckoutPageProps {
  params: Promise<{ userid: string }>;
}

const CheckoutPage = ({ params }: CheckoutPageProps) => {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [processing, setProcessing] = useState(false);
  const [contractPreview, setContractPreview] =
    useState<ContractPreview | null>(null);

  const sessionId = searchParams.get("session_id");
  const contractId = searchParams.get("contract_id");

  useEffect(() => {
    // In einem echten System würden hier die Contract-Details geladen werden
    // Für Demo-Zwecke verwenden wir Mock-Daten
    setContractPreview({
      id: contractId || "demo-contract",
      type: "Gartenpflege",
      zip: 12345,
      gardenSize: 250,
      contractSize: "small changes",
      gardenLocation: "Hinterhof",
      projektBeginn: "2025-03-01",
      description:
        "Professionelle Gartenpflege mit Rasenmähen, Heckenschnitt und Unkrautentfernung.",
      planningAvaillable: true,
      repeatService: false,
      createdAt: new Date(),
      distance: 5.2,
    });
  }, [contractId]);

  const calculatePrice = (contract: ContractPreview): number => {
    let price = 50; // Grundpreis

    if (contract.gardenSize > 200) price += 30;
    if (contract.contractSize === "small changes") price += 10;
    if (contract.planningAvaillable) price += 25;

    return price;
  };

  const handlePayment = async () => {
    if (!sessionId || !contractPreview) return;

    setProcessing(true);
    try {
      // Simuliere Zahlungsverarbeitung
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Führe erfolgreiche Zahlung durch
      await simulateSuccessfulPayment(sessionId);

      // Weiterleitung zur Erfolgsseite
      router.push(
        `/company/${resolvedParams.userid}/contracts?success=true&purchased=true`
      );
    } catch (error) {
      console.error("Fehler bei der Zahlung:", error);
      alert("Zahlung fehlgeschlagen. Bitte versuchen Sie es erneut.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    router.push(`/company/${resolvedParams.userid}/contracts?canceled=true`);
  };

  if (!contractPreview) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='flex items-center space-x-2'>
          <Loader2 className='h-6 w-6 animate-spin' />
          <span>Lade Checkout...</span>
        </div>
      </div>
    );
  }

  const price = calculatePrice(contractPreview);

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-4xl mx-auto px-4'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Auftrag kaufen
          </h1>
          <p className='text-gray-600'>
            Schließen Sie Ihren Kauf ab, um Zugriff auf die vollständigen
            Auftragsdaten zu erhalten.
          </p>
        </div>

        <div className='grid md:grid-cols-2 gap-8'>
          {/* Auftrag Details */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <MapPin className='h-5 w-5 text-green-600' />
                Auftrag Details
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <h3 className='font-semibold text-lg'>
                  {contractPreview.type}
                </h3>
                <p className='text-gray-600 text-sm mt-1'>
                  {contractPreview.description}
                </p>
              </div>

              <Separator />

              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='text-gray-500'>PLZ:</span>
                  <p className='font-medium'>{contractPreview.zip}</p>
                </div>
                <div>
                  <span className='text-gray-500'>Gartengröße:</span>
                  <p className='font-medium'>{contractPreview.gardenSize}m²</p>
                </div>
                <div>
                  <span className='text-gray-500'>Projektumfang:</span>
                  <p className='font-medium'>{contractPreview.contractSize}</p>
                </div>
                <div>
                  <span className='text-gray-500'>Projektbeginn:</span>
                  <p className='font-medium'>{contractPreview.projektBeginn}</p>
                </div>
              </div>

              {contractPreview.planningAvaillable && (
                <div className='flex items-center gap-2 text-sm text-green-600'>
                  <CheckCircle className='h-4 w-4' />
                  <span>Planung verfügbar</span>
                </div>
              )}

              <Separator />

              <div className='flex items-center gap-2 text-sm text-gray-500'>
                <Clock className='h-4 w-4' />
                <span>Entfernung: {contractPreview.distance}km</span>
              </div>
            </CardContent>
          </Card>

          {/* Zahlung */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <CreditCard className='h-5 w-5 text-blue-600' />
                Zahlung
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='bg-gray-50 p-4 rounded-lg'>
                <div className='flex justify-between items-center mb-2'>
                  <span className='text-gray-600'>Grundpreis:</span>
                  <span className='font-medium'>50,00 €</span>
                </div>

                {contractPreview.gardenSize > 200 && (
                  <div className='flex justify-between items-center mb-2'>
                    <span className='text-gray-600'>Gartengröße-Zuschlag:</span>
                    <span className='font-medium'>30,00 €</span>
                  </div>
                )}

                {contractPreview.contractSize === "small changes" && (
                  <div className='flex justify-between items-center mb-2'>
                    <span className='text-gray-600'>Kleine Änderungen:</span>
                    <span className='font-medium'>10,00 €</span>
                  </div>
                )}

                {contractPreview.planningAvaillable && (
                  <div className='flex justify-between items-center mb-2'>
                    <span className='text-gray-600'>Planung verfügbar:</span>
                    <span className='font-medium'>25,00 €</span>
                  </div>
                )}

                <Separator className='my-3' />

                <div className='flex justify-between items-center'>
                  <span className='text-lg font-semibold'>Gesamtpreis:</span>
                  <span className='text-xl font-bold flex items-center gap-1'>
                    <Euro className='h-5 w-5' />
                    {price.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className='space-y-4'>
                <div className='bg-blue-50 border border-blue-200 p-4 rounded-lg'>
                  <h4 className='font-medium text-blue-900 mb-2'>Demo-Modus</h4>
                  <p className='text-sm text-blue-700'>
                    Dies ist eine Demo-Implementierung. In der Produktion würde
                    hier eine echte Stripe-Zahlung durchgeführt werden.
                  </p>
                </div>

                <div className='flex flex-col gap-3'>
                  <Button
                    onClick={handlePayment}
                    disabled={processing}
                    className='w-full'
                    size='lg'>
                    {processing ? (
                      <>
                        <Loader2 className='h-4 w-4 animate-spin mr-2' />
                        Zahlung wird verarbeitet...
                      </>
                    ) : (
                      <>
                        <CreditCard className='h-4 w-4 mr-2' />
                        Jetzt für {price.toFixed(2)}€ kaufen
                      </>
                    )}
                  </Button>

                  <Button
                    variant='outline'
                    onClick={handleCancel}
                    disabled={processing}
                    className='w-full'>
                    Abbrechen
                  </Button>
                </div>
              </div>

              <div className='text-xs text-gray-500 text-center'>
                Sichere Zahlung mit SSL-Verschlüsselung
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
