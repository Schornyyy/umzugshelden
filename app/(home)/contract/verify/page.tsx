"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { verifyContract } from "@/actions/contractActions";
import Link from "next/link";

const ContractVerifyContent = () => {
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyContractAsync = async () => {
      const contractId = searchParams.get("id");
      const token = searchParams.get("token");

      if (!contractId || !token) {
        setStatus("error");
        setMessage(
          "Ungültige Verifikations-URL. Bitte überprüfen Sie den Link in Ihrer E-Mail."
        );
        return;
      }

      try {
        const success = await verifyContract(contractId, token);

        if (success) {
          setStatus("success");
          setMessage(
            "Ihr Auftrag wurde erfolgreich bestätigt! Passende Unternehmen wurden benachrichtigt und werden sich bei Ihnen melden."
          );
        } else {
          setStatus("error");
          setMessage(
            "Die Verifikation ist fehlgeschlagen. Bitte überprüfen Sie den Link oder kontaktieren Sie uns."
          );
        }
      } catch (error) {
        console.error("Verifikationsfehler:", error);
        setStatus("error");
        setMessage(
          "Es gab einen Fehler bei der Verifikation. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns."
        );
      }
    };

    verifyContractAsync();
  }, [searchParams]);

  return (
    <div className=' bg-gray-50 py-24'>
      <div className='container mx-auto px-4 max-w-2xl'>
        <Card>
          <CardHeader className='text-center'>
            <CardTitle className='flex items-center justify-center gap-2 text-2xl'>
              {status === "loading" && (
                <>
                  <Loader2 className='h-6 w-6 animate-spin' />
                  E-Mail wird bestätigt...
                </>
              )}
              {status === "success" && (
                <>
                  <CheckCircle className='h-6 w-6 text-green-500' />
                  E-Mail erfolgreich bestätigt!
                </>
              )}
              {status === "error" && (
                <>
                  <XCircle className='h-6 w-6 text-red-500' />
                  Bestätigung fehlgeschlagen
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className='text-center space-y-4'>
            <p className='text-gray-600'>{message}</p>

            {status === "success" && (
              <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                <h4 className='font-semibold text-green-900 mb-2'>
                  Was passiert als nächstes?
                </h4>
                <ul className='list-disc list-inside text-green-800 space-y-1 text-sm'>
                  <li>
                    Passende Unternehmen in Ihrer Region wurden über Ihren
                    Auftrag informiert
                  </li>
                  <li>Sie erhalten Angebote direkt per E-Mail</li>
                  <li>
                    Vergleichen Sie die Angebote und wählen Sie das beste aus
                  </li>
                  <li>Kontaktieren Sie das Unternehmen Ihrer Wahl direkt</li>
                </ul>
              </div>
            )}

            {status === "error" && (
              <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                <p className='text-red-800 text-sm'>
                  Falls das Problem weiterhin besteht, kontaktieren Sie uns
                  unter{" "}
                  <a
                    href='mailto:support@landschaftshelden.io'
                    className='underline'>
                    support@landschaftshelden.io
                  </a>
                </p>
              </div>
            )}

            <div className='pt-4'>
              <Link href='/'>
                <Button variant='outline'>Zurück zur Startseite</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ContractVerifyPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContractVerifyContent />
    </Suspense>
  );
};

export default ContractVerifyPage;
