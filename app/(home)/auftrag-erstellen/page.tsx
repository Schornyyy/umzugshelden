"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Contract,
  ContractSize,
  GardenLocation,
  Projectbegin,
  getAllContractSize,
  getAllGardenLocations,
  getAllProjectBegins,
} from "@/types/Contract";
import { Service, getAllServices } from "@/types/ServiceType";
import { createContract } from "@/actions/contractActions";
import { validateContractFiles, formatFileSize } from "@/utils/fileValidation";
import { ChevronLeft, ChevronRight, Upload, X, Loader2 } from "lucide-react";

const STEPS = [
  { id: 1, title: "Service", description: "Art der Dienstleistung" },
  { id: 2, title: "Projektdetails", description: "Größe und Umfang" },
  { id: 3, title: "Standort", description: "Ort und Zugänglichkeit" },
  { id: 4, title: "Zeitrahmen", description: "Wann soll begonnen werden" },
  { id: 5, title: "Beschreibung", description: "Details und Dateien" },
  { id: 6, title: "Kontakt", description: "Ihre Kontaktdaten" },
];

const AuftragErstellenContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Contract>>({
    type: (searchParams.get("service") as Service) || undefined,
    zip: 0,
    planningAvaillable: false,
    gardenSize: 0,
    repeatService: false,
    contractSize: undefined,
    gardenLocation: undefined,
    projektBeginn: undefined,
    files: [],
    description: "",
    contact: {
      email: "",
      phone: 0,
      firstName: "",
      lastName: "",
    },
  });

  const services = getAllServices();
  const contractSizes = getAllContractSize();
  const gardenLocations = getAllGardenLocations();
  const projectBegins = getAllProjectBegins();

  useEffect(() => {
    // Vorausfüllen mit Service aus URL-Parameter
    const serviceParam = searchParams.get("service");
    const searchParam = searchParams.get("search");
    const allServices = getAllServices(); // Lokale Kopie verwenden

    if (serviceParam && allServices.includes(serviceParam as Service)) {
      setFormData((prev) => ({
        ...prev,
        type: serviceParam as Service,
      }));
    } else if (searchParam) {
      // Wenn kein exakter Service gefunden, versuche passenden Service zu finden
      const matchingService = allServices.find((service) =>
        service.toLowerCase().includes(searchParam.toLowerCase())
      );
      if (matchingService) {
        setFormData((prev) => ({
          ...prev,
          type: matchingService,
        }));
      }
    }
  }, [searchParams]); // services aus den Dependencies entfernt

  const updateFormData = (field: keyof Contract, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateContactData = (
    field: keyof Contract["contact"],
    value: unknown
  ) => {
    setFormData((prev) => ({
      ...prev,
      contact: {
        ...prev.contact!,
        [field]: value,
      },
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    const validation = validateContractFiles([...uploadedFiles, ...fileArray]);

    if (!validation.valid) {
      alert(`Datei-Fehler:\n${validation.errors.join("\n")}`);
      return;
    }

    setUploadedFiles((prev) => [...prev, ...fileArray]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.type;
      case 2:
        return formData.contractSize && formData.gardenSize! > 0;
      case 3:
        return formData.gardenLocation && formData.zip! > 0;
      case 4:
        return formData.projektBeginn;
      case 5:
        return formData.description && formData.description.trim().length > 10;
      case 6:
        return (
          formData.contact?.email &&
          formData.contact?.firstName &&
          formData.contact?.lastName &&
          formData.contact?.phone
        );
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Validiere alle erforderlichen Felder
      if (
        !formData.type ||
        !formData.contractSize ||
        !formData.gardenLocation ||
        !formData.projektBeginn ||
        !formData.description ||
        !formData.contact?.email ||
        !formData.contact?.firstName ||
        !formData.contact?.lastName
      ) {
        alert("Bitte füllen Sie alle erforderlichen Felder aus.");
        return;
      }

      // Validiere hochgeladene Dateien
      if (uploadedFiles.length > 0) {
        const validation = validateContractFiles(uploadedFiles);
        if (!validation.valid) {
          alert(`Datei-Fehler:\n${validation.errors.join("\n")}`);
          return;
        }
      }

      // Erstelle Contract-Objekt ohne 'verified' Feld (wird in contractActions behandelt)
      const contractData: Omit<Contract, "verified"> = {
        type: formData.type,
        zip: formData.zip || 0,
        planningAvaillable: formData.planningAvaillable || false,
        gardenSize: formData.gardenSize || 0,
        repeatService: formData.repeatService || false,
        contractSize: formData.contractSize,
        gardenLocation: formData.gardenLocation,
        projektBeginn: formData.projektBeginn,
        files: [], // Wird durch Firebase Storage URLs ersetzt
        description: formData.description,
        contact: {
          email: formData.contact.email,
          phone: formData.contact.phone || 0,
          firstName: formData.contact.firstName,
          lastName: formData.contact.lastName,
        },
      };

      console.log("Erstelle Auftrag:", contractData);
      console.log("Hochgeladene Dateien:", uploadedFiles.length);

      // Erstelle Contract in Firebase mit Dateien
      const contractId = await createContract(contractData, uploadedFiles);

      console.log("Auftrag erfolgreich erstellt mit ID:", contractId);

      // Starte E-Mail-Benachrichtigungen im Hintergrund (fire-and-forget)
      setTimeout(async () => {
        try {
          console.log("Starte automatische E-Mail-Benachrichtigungen...");
          const response = await fetch("/api/notify-companies", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ contractId }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log("E-Mail-Benachrichtigungen erfolgreich:", result);
          } else {
            console.error(
              "Fehler bei E-Mail-Benachrichtigungen:",
              response.status
            );
          }
        } catch (error) {
          console.error(
            "Fehler beim Senden der E-Mail-Benachrichtigungen:",
            error
          );
        }
      }, 100); // Nach 100ms starten, damit User nicht warten muss

      // Weiterleitung zur Bestätigungsseite mit Contract-ID
      router.push(`/auftrag-bestaetigung?contractId=${contractId}`);
    } catch (error) {
      console.error("Fehler beim Erstellen des Auftrags:", error);
      alert(
        "Es gab einen Fehler beim Erstellen Ihres Auftrags. Bitte versuchen Sie es erneut."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='container mx-auto px-4 max-w-4xl'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Auftrag erstellen
          </h1>
          <p className='text-gray-600'>
            Erstellen Sie Ihren Auftrag in wenigen einfachen Schritten
          </p>
        </div>

        {/* Progress Bar */}
        <div className='mb-8'>
          <div className='flex justify-between items-center mb-2'>
            <span className='text-sm text-gray-600'>
              Schritt {currentStep} von {STEPS.length}
            </span>
            <span className='text-sm text-gray-600'>
              {Math.round(progress)}% abgeschlossen
            </span>
          </div>
          <Progress value={progress} className='h-2' />
        </div>

        {/* Steps Navigation */}
        <div className='flex justify-center mb-8 overflow-x-auto'>
          <div className='flex space-x-4'>
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center min-w-0 ${
                  step.id === currentStep
                    ? "text-primary"
                    : step.id < currentStep
                    ? "text-green-600"
                    : "text-gray-400"
                }`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1 ${
                    step.id === currentStep
                      ? "bg-primary text-white"
                      : step.id < currentStep
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}>
                  {step.id}
                </div>
                <div className='text-xs text-center'>
                  <div className='font-medium'>{step.title}</div>
                  <div className='text-gray-500'>{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Step 1: Service */}
            {currentStep === 1 && (
              <div className='space-y-4'>
                <Label htmlFor='service'>
                  Welche Dienstleistung benötigen Sie?
                </Label>
                <Select
                  value={formData.type || ""}
                  onValueChange={(value) =>
                    updateFormData("type", value as Service)
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder='Service auswählen' />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service} value={service}>
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Step 2: Projektdetails */}
            {currentStep === 2 && (
              <div className='space-y-4'>
                <div>
                  <Label htmlFor='contractSize'>Projektumfang</Label>
                  <Select
                    value={formData.contractSize || ""}
                    onValueChange={(value) =>
                      updateFormData("contractSize", value as ContractSize)
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder='Projektumfang auswählen' />
                    </SelectTrigger>
                    <SelectContent>
                      {contractSizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size === "small changes" && "Kleine Änderungen"}
                          {size === "new" && "Neuprojekt"}
                          {size === "request" && "Beratung/Anfrage"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor='gardenSize'>Gartengröße (in m²)</Label>
                  <Input
                    id='gardenSize'
                    type='number'
                    value={formData.gardenSize || ""}
                    onChange={(e) =>
                      updateFormData(
                        "gardenSize",
                        parseInt(e.target.value) || 0
                      )
                    }
                    placeholder='z.B. 100'
                  />
                </div>

                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='planning'
                    checked={formData.planningAvaillable}
                    onCheckedChange={(checked) =>
                      updateFormData("planningAvaillable", checked)
                    }
                  />
                  <Label htmlFor='planning'>Planung/Design gewünscht</Label>
                </div>

                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='repeat'
                    checked={formData.repeatService}
                    onCheckedChange={(checked) =>
                      updateFormData("repeatService", checked)
                    }
                  />
                  <Label htmlFor='repeat'>
                    Regelmäßige Dienstleistung (z.B. Gartenpflege)
                  </Label>
                </div>
              </div>
            )}

            {/* Step 3: Standort */}
            {currentStep === 3 && (
              <div className='space-y-4'>
                <div>
                  <Label htmlFor='zip'>Postleitzahl</Label>
                  <Input
                    id='zip'
                    type='number'
                    value={formData.zip || ""}
                    onChange={(e) =>
                      updateFormData("zip", parseInt(e.target.value) || 0)
                    }
                    placeholder='z.B. 12345'
                  />
                </div>

                <div>
                  <Label htmlFor='gardenLocation'>Bereich des Gartens</Label>
                  <Select
                    value={formData.gardenLocation || ""}
                    onValueChange={(value) =>
                      updateFormData("gardenLocation", value as GardenLocation)
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder='Gartenbereich auswählen' />
                    </SelectTrigger>
                    <SelectContent>
                      {gardenLocations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location === "front" && "Vorgarten"}
                          {location === "back" && "Hintergarten"}
                          {location === "side" && "Seitengarten"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 4: Zeitrahmen */}
            {currentStep === 4 && (
              <div className='space-y-4'>
                <div>
                  <Label htmlFor='projektBeginn'>
                    Wann soll das Projekt beginnen?
                  </Label>
                  <Select
                    value={formData.projektBeginn || ""}
                    onValueChange={(value) =>
                      updateFormData("projektBeginn", value as Projectbegin)
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder='Zeitrahmen auswählen' />
                    </SelectTrigger>
                    <SelectContent>
                      {projectBegins.map((begin) => (
                        <SelectItem key={begin} value={begin}>
                          {begin === "fast" && "So schnell wie möglich"}
                          {begin === "2weeks" && "In den nächsten 2 Wochen"}
                          {begin === "1month" && "In den nächsten 4 Wochen"}
                          {begin === "fewmonths" && "In den nächsten Monaten"}
                          {begin === "request" &&
                            "Nur Beratung/Kostenvoranschlag"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 5: Beschreibung */}
            {currentStep === 5 && (
              <div className='space-y-4'>
                <div>
                  <Label htmlFor='description'>Projektbeschreibung</Label>
                  <Textarea
                    id='description'
                    value={formData.description || ""}
                    onChange={(e) =>
                      updateFormData("description", e.target.value)
                    }
                    placeholder='Beschreiben Sie Ihr Projekt im Detail...'
                    rows={6}
                  />
                  <p className='text-sm text-gray-500 mt-1'>
                    Mindestens 10 Zeichen erforderlich
                  </p>
                </div>

                <div>
                  <Label>Dateien hochladen (optional)</Label>
                  <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                    <Upload className='h-8 w-8 mx-auto mb-2 text-gray-400' />
                    <p className='text-sm text-gray-600 mb-2'>
                      Ziehen Sie Dateien hierher oder klicken Sie zum Auswählen
                    </p>
                    <input
                      type='file'
                      multiple
                      accept='.jpg,.jpeg,.png,.webp,.pdf,.doc,.docx'
                      onChange={handleFileUpload}
                      className='hidden'
                      id='file-upload'
                    />
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                      className='mb-2'>
                      Dateien auswählen
                    </Button>
                    <p className='text-xs text-gray-500'>
                      Bilder (JPG, PNG, WebP), PDFs, Word-Dokumente bis 10MB
                      <br />
                      Maximal 5 Dateien
                    </p>
                  </div>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className='mt-4 space-y-2'>
                      <Label>
                        Hochgeladene Dateien ({uploadedFiles.length}/5)
                      </Label>
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className='flex items-center justify-between p-2 bg-gray-50 rounded border'>
                          <div className='flex items-center gap-2'>
                            <div className='w-8 h-8 bg-blue-100 rounded flex items-center justify-center'>
                              <Upload className='h-4 w-4 text-blue-600' />
                            </div>
                            <div>
                              <p className='text-sm font-medium text-gray-900 truncate max-w-48'>
                                {file.name}
                              </p>
                              <p className='text-xs text-gray-500'>
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={() => removeFile(index)}
                            className='text-red-500 hover:text-red-700'>
                            <X className='h-4 w-4' />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Kontakt */}
            {currentStep === 6 && (
              <div className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='firstName'>Vorname</Label>
                    <Input
                      id='firstName'
                      value={formData.contact?.firstName || ""}
                      onChange={(e) =>
                        updateContactData("firstName", e.target.value)
                      }
                      placeholder='Ihr Vorname'
                    />
                  </div>
                  <div>
                    <Label htmlFor='lastName'>Nachname</Label>
                    <Input
                      id='lastName'
                      value={formData.contact?.lastName || ""}
                      onChange={(e) =>
                        updateContactData("lastName", e.target.value)
                      }
                      placeholder='Ihr Nachname'
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor='email'>E-Mail-Adresse</Label>
                  <Input
                    id='email'
                    type='email'
                    value={formData.contact?.email || ""}
                    onChange={(e) => updateContactData("email", e.target.value)}
                    placeholder='ihre.email@beispiel.de'
                  />
                </div>

                <div>
                  <Label htmlFor='phone'>Telefonnummer</Label>
                  <Input
                    id='phone'
                    type='tel'
                    value={formData.contact?.phone || ""}
                    onChange={(e) =>
                      updateContactData("phone", parseInt(e.target.value) || 0)
                    }
                    placeholder='0123 456789'
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className='flex justify-between mt-8'>
          <Button
            variant='outline'
            onClick={prevStep}
            disabled={currentStep === 1}
            className='flex items-center gap-2'>
            <ChevronLeft className='h-4 w-4' />
            Zurück
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              onClick={nextStep}
              disabled={!isStepValid()}
              className='flex items-center gap-2'>
              Weiter
              <ChevronRight className='h-4 w-4' />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isStepValid() || isSubmitting}
              className='flex items-center gap-2 bg-green-600 hover:bg-green-700'>
              {isSubmitting ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Auftrag wird erstellt...
                </>
              ) : (
                "Auftrag erstellen"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const AuftragErstellenPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuftragErstellenContent />
    </Suspense>
  );
};

export default AuftragErstellenPage;
