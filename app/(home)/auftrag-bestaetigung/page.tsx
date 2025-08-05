"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, ArrowLeft, Copy } from "lucide-react";
import Link from "next/link";

const AuftragBestaetigungContent = () => {
  const searchParams = useSearchParams();
  const contractId = searchParams.get("contractId");

  const copyContractId = () => {
    if (contractId) {
      navigator.clipboard.writeText(contractId);
      alert("Auftragsnummer in die Zwischenablage kopiert!");
    }
  };

  return (
    <div className='py-32 bg-gray-50'>
      <div className='container mx-auto px-4 max-w-2xl'>
        <div className='text-center mb-8'>
          <div className='flex justify-center mb-4'>
            <CheckCircle className='h-16 w-16 text-green-500' />
          </div>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Auftrag erfolgreich erstellt!
          </h1>
          <p className='text-gray-600'>
            Ihr Auftrag wurde erfolgreich übermittelt und passende Unternehmen
            in Ihrem 50km Umkreis werden automatisch benachrichtigt.
          </p>
        </div>

        {contractId && (
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <CheckCircle className='h-5 w-5 text-green-500' />
                Ihre Auftragsnummer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-center justify-between bg-gray-50 border rounded-lg p-3'>
                <code className='text-sm font-mono text-gray-700'>
                  {contractId}
                </code>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={copyContractId}
                  className='flex items-center gap-2'>
                  <Copy className='h-4 w-4' />
                  Kopieren
                </Button>
              </div>
              <p className='text-sm text-gray-500 mt-2'>
                Notieren Sie sich diese Nummer für Ihre Unterlagen.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className='mb-8'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Mail className='h-5 w-5' />
              Automatische Benachrichtigungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-gray-600 mb-4'>
              Sie erhalten in Kürze eine Bestätigungs-E-Mail mit den Details
              Ihres Auftrags. Gleichzeitig werden alle passenden Unternehmen in
              Ihrem 50km Umkreis automatisch über Ihren neuen Auftrag
              benachrichtigt.
            </p>
            <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-4'>
              <h4 className='font-semibold text-green-900 mb-2'>
                ✅ Automatisch erledigt:
              </h4>
              <ul className='list-disc list-inside text-green-800 space-y-1'>
                <li>
                  E-Mail-Benachrichtigungen an passende Unternehmen (50km
                  Umkreis)
                </li>
                <li>Filterung nach Ihrem gewünschten Service</li>
                <li>Sofortige Verfügbarkeit für interessierte Unternehmen</li>
              </ul>
            </div>
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <h4 className='font-semibold text-blue-900 mb-2'>
                📋 Nächste Schritte:
              </h4>
              <ul className='list-disc list-inside text-blue-800 space-y-1'>
                <li>E-Mail-Bestätigung über den Link in Ihrer E-Mail</li>
                <li>Warten auf Angebote von interessierten Unternehmen</li>
                <li>Sie erhalten Angebote direkt per E-Mail</li>
                <li>Wählen Sie das beste Angebot für Ihr Projekt aus</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className='text-center space-y-4'>
          <Link href='/'>
            <Button variant='outline' className='flex items-center gap-2'>
              <ArrowLeft className='h-4 w-4' />
              Zurück zur Startseite
            </Button>
          </Link>

          <div className='text-sm text-gray-500'>
            <p>
              Haben Sie Fragen? Kontaktieren Sie uns unter{" "}
              <a
                href='mailto:support@landschaftshelden.io'
                className='text-primary hover:underline'>
                support@landschaftshelden.io
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuftragBestaetigungPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuftragBestaetigungContent />
    </Suspense>
  );
};

export default AuftragBestaetigungPage;
