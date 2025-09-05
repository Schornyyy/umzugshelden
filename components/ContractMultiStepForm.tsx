"use client";
import React, { useState, useEffect } from "react";
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
import { createContract } from "@/actions/contractActions";
import { validateContractFiles, formatFileSize } from "@/utils/fileValidation";
import { ChevronLeft, ChevronRight, Upload, X, Loader2 } from "lucide-react";
import {
  Contract,
  ContractSize,
  GardenLocation,
  Projectbegin,
} from "@/types/Contract";
import { Service } from "@/types/ServiceType";
import { getAllServices } from "@/types/ServiceType";
import {
  getAllContractSize,
  getAllGardenLocations,
  getAllProjectBegins,
} from "@/types/Contract";

interface Props {
  variant?: "full" | "embedded";
  prefilledService?: string;
  prefilledCity?: string; // could be used later for analytics
  showHeader?: boolean;
  compact?: boolean;
  onSuccessRedirect?: (contractId: string) => string; // override default redirect
}

const STEPS = [
  { id: 1, title: "Service", description: "Art der Dienstleistung" },
  { id: 2, title: "Projektdetails", description: "Größe und Umfang" },
  { id: 3, title: "Standort", description: "Ort & Bereich" },
  { id: 4, title: "Zeitrahmen", description: "Start & Planung" },
  { id: 5, title: "Beschreibung", description: "Details & Dateien" },
  { id: 6, title: "Kontakt", description: "Rückmeldung" },
];

export default function ContractMultiStepForm({
  variant = "full",
  prefilledService,
  prefilledCity,
  showHeader = true,
  compact = false,
  onSuccessRedirect,
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Contract>>({
    type: undefined,
    zip: 0,
    planningAvaillable: false,
    gardenSize: 0,
    repeatService: false,
    contractSize: undefined,
    gardenLocation: undefined,
    projektBeginn: undefined,
    files: [],
    description: "",
    contact: { email: "", phone: 0, firstName: "", lastName: "" },
  });

  const services = getAllServices();
  const contractSizes = getAllContractSize();
  const gardenLocations = getAllGardenLocations();
  const projectBegins = getAllProjectBegins();

  // Pre-Fill Logic
  useEffect(() => {
    const serviceParam = prefilledService || searchParams.get("service");
    if (serviceParam && services.includes(serviceParam as Service)) {
      setFormData((prev) => ({ ...prev, type: serviceParam as Service }));
    } else {
      const searchParam = searchParams.get("search");
      if (searchParam) {
        const m = services.find((s) =>
          s.toLowerCase().includes(searchParam.toLowerCase())
        );
        if (m) setFormData((prev) => ({ ...prev, type: m }));
      }
    }
  }, [searchParams, prefilledService, services]);

  const updateFormData = (field: keyof Contract, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const updateContactData = (
    field: keyof Contract["contact"],
    value: unknown
  ) => {
    setFormData((prev) => ({
      ...prev,
      contact: { ...prev.contact!, [field]: value },
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const arr = Array.from(files);
    const validation = validateContractFiles([...uploadedFiles, ...arr]);
    if (!validation.valid) {
      alert(`Datei-Fehler:\n${validation.errors.join("\n")}`);
      return;
    }
    setUploadedFiles((prev) => [...prev, ...arr]);
  };
  const removeFile = (i: number) =>
    setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i));

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.type;
      case 2:
        return formData.contractSize && (formData.gardenSize || 0) > 0;
      case 3:
        return formData.gardenLocation && (formData.zip || 0) > 0;
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

  const nextStep = () => {
    if (currentStep < STEPS.length && isStepValid())
      setCurrentStep((s) => s + 1);
  };
  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
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
        alert("Bitte alle Pflichtfelder ausfüllen.");
        return;
      }
      if (uploadedFiles.length) {
        const validation = validateContractFiles(uploadedFiles);
        if (!validation.valid) {
          alert(`Datei-Fehler:\n${validation.errors.join("\n")}`);
          return;
        }
      }
      const contractData: Omit<Contract, "verified"> = {
        type: formData.type,
        zip: formData.zip || 0,
        planningAvaillable: formData.planningAvaillable || false,
        gardenSize: formData.gardenSize || 0,
        repeatService: formData.repeatService || false,
        contractSize: formData.contractSize,
        gardenLocation: formData.gardenLocation,
        projektBeginn: formData.projektBeginn,
        files: [],
        description: formData.description!,
        contact: {
          email: formData.contact!.email,
          phone: formData.contact!.phone || 0,
          firstName: formData.contact!.firstName,
          lastName: formData.contact!.lastName,
        },
      };
      const id = await createContract(contractData, uploadedFiles);
      const redirect = onSuccessRedirect
        ? onSuccessRedirect(id)
        : `/auftrag-bestaetigung?contractId=${id}`;
      router.push(redirect);
    } catch (e) {
      console.error("Fehler beim Erstellen des Auftrags:", e);
      alert("Fehler beim Erstellen. Bitte erneut versuchen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;
  const containerClass =
    variant === "embedded" ? "w-full" : "container mx-auto px-4 max-w-4xl";

  return (
    <div className={containerClass} data-city={prefilledCity || undefined}>
      {showHeader && (
        <div className={`text-center mb-6 ${variant === "embedded" ? "" : ""}`}>
          <h2 className='text-2xl font-bold text-gray-900 mb-1'>
            Kostenlos Anfrage stellen
          </h2>
          <p className='text-gray-600 text-sm'>
            In <strong>2 Minuten</strong> mehrere Garten- & Landschaftsbauer
            erreichen
          </p>
        </div>
      )}
      <div className='mb-4'>
        <div className='flex justify-between items-center mb-1'>
          <span className='text-xs text-gray-600'>
            Schritt {currentStep} / {STEPS.length}
          </span>
          <span className='text-xs text-gray-600'>
            {Math.round(progress)}% abgeschlossen
          </span>
        </div>
        <Progress value={progress} className='h-1.5' />
      </div>
      <Card className={compact ? "shadow-sm" : ""}>
        <CardHeader className='py-3'>
          <CardTitle className='text-base'>
            {STEPS[currentStep - 1].title}
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {currentStep === 1 && (
            <div className='space-y-3'>
              <Label htmlFor='service'>Dienstleistung</Label>
              <Select
                value={formData.type || ""}
                onValueChange={(v) => updateFormData("type", v as Service)}>
                <SelectTrigger>
                  <SelectValue placeholder='Service wählen' />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {currentStep === 2 && (
            <div className='space-y-4'>
              <div>
                <Label htmlFor='contractSize'>Projektumfang</Label>
                <Select
                  value={formData.contractSize || ""}
                  onValueChange={(v) =>
                    updateFormData("contractSize", v as ContractSize)
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder='Umfang wählen' />
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
                <Label htmlFor='gardenSize'>Gartengröße (m²)</Label>
                <Input
                  id='gardenSize'
                  type='number'
                  value={formData.gardenSize || ""}
                  onChange={(e) =>
                    updateFormData("gardenSize", parseInt(e.target.value) || 0)
                  }
                  placeholder='z.B. 120'
                />
              </div>
              <div className='flex flex-col gap-2'>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='planning'
                    checked={formData.planningAvaillable}
                    onCheckedChange={(c) =>
                      updateFormData("planningAvaillable", c)
                    }
                  />
                  <Label htmlFor='planning'>Planung/Design gewünscht</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='repeat'
                    checked={formData.repeatService}
                    onCheckedChange={(c) => updateFormData("repeatService", c)}
                  />
                  <Label htmlFor='repeat'>Regelmäßige Pflege gewünscht</Label>
                </div>
              </div>
            </div>
          )}
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
                  onValueChange={(v) =>
                    updateFormData("gardenLocation", v as GardenLocation)
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder='Bereich wählen' />
                  </SelectTrigger>
                  <SelectContent>
                    {gardenLocations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc === "front" && "Vorgarten"}
                        {loc === "back" && "Hintergarten"}
                        {loc === "side" && "Seitengarten"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          {currentStep === 4 && (
            <div className='space-y-4'>
              <div>
                <Label htmlFor='projektBeginn'>Projektbeginn</Label>
                <Select
                  value={formData.projektBeginn || ""}
                  onValueChange={(v) =>
                    updateFormData("projektBeginn", v as Projectbegin)
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder='Zeitrahmen wählen' />
                  </SelectTrigger>
                  <SelectContent>
                    {projectBegins.map((begin) => (
                      <SelectItem key={begin} value={begin}>
                        {begin === "fast" && "So schnell wie möglich"}
                        {begin === "2weeks" && "In den nächsten 2 Wochen"}
                        {begin === "1month" && "In den nächsten 4 Wochen"}
                        {begin === "fewmonths" && "In den nächsten Monaten"}
                        {begin === "request" &&
                          "Nur Beratung / Kostenvoranschlag"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          {currentStep === 5 && (
            <div className='space-y-4'>
              <div>
                <Label htmlFor='description'>Projektbeschreibung</Label>
                <Textarea
                  id='description'
                  rows={6}
                  value={formData.description || ""}
                  onChange={(e) =>
                    updateFormData("description", e.target.value)
                  }
                  placeholder='Beschreiben Sie Ihr Projekt (Material, Fläche, Zustand, Ziele)...'
                />
                <p className='text-xs text-gray-500 mt-1'>
                  Mindestens 10 Zeichen. Gute Details erhöhen Antwortquote.
                </p>
              </div>
              <div>
                <Label>Dateien hochladen (optional)</Label>
                <div className='border-2 border-dashed border-gray-300 rounded-lg p-5 text-center'>
                  <Upload className='h-6 w-6 mx-auto mb-2 text-gray-400' />
                  <p className='text-xs text-gray-600 mb-2'>
                    Bilder / PDFs hinzufügen (max. 5 Dateien, jeweils bis 10MB)
                  </p>
                  <input
                    type='file'
                    multiple
                    accept='.jpg,.jpeg,.png,.webp,.pdf,.doc,.docx'
                    onChange={handleFileUpload}
                    className='hidden'
                    id='file-upload-multi'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      document.getElementById("file-upload-multi")?.click()
                    }
                    className='mb-2'>
                    Dateien wählen
                  </Button>
                  <p className='text-[10px] text-gray-400'>
                    Erhöht Angebotsgenauigkeit
                  </p>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className='mt-3 space-y-2'>
                    <Label className='text-xs'>
                      Dateien ({uploadedFiles.length}/5)
                    </Label>
                    {uploadedFiles.map((f, i) => (
                      <div
                        key={i}
                        className='flex items-center justify-between p-2 bg-gray-50 rounded border'>
                        <div className='flex items-center gap-2'>
                          <div className='w-8 h-8 bg-blue-100 rounded flex items-center justify-center'>
                            <Upload className='h-4 w-4 text-blue-600' />
                          </div>
                          <div>
                            <p className='text-xs font-medium text-gray-900 truncate max-w-40'>
                              {f.name}
                            </p>
                            <p className='text-[10px] text-gray-500'>
                              {formatFileSize(f.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => removeFile(i)}
                          className='text-red-500 hover:text-red-700 p-1'>
                          <X className='h-4 w-4' />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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
                    placeholder='Max'
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
                    placeholder='Mustermann'
                  />
                </div>
              </div>
              <div>
                <Label htmlFor='email'>E-Mail</Label>
                <Input
                  id='email'
                  type='email'
                  value={formData.contact?.email || ""}
                  onChange={(e) => updateContactData("email", e.target.value)}
                  placeholder='you@mail.de'
                />
              </div>
              <div>
                <Label htmlFor='phone'>
                  Telefon (optional für schnellere Rückfragen)
                </Label>
                <Input
                  id='phone'
                  type='tel'
                  value={formData.contact?.phone || ""}
                  onChange={(e) =>
                    updateContactData("phone", parseInt(e.target.value) || 0)
                  }
                  placeholder='z.B. 0176123456'
                />
              </div>
            </div>
          )}
          <div className='flex items-center justify-between pt-2'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={prevStep}
              disabled={currentStep === 1}>
              {" "}
              <ChevronLeft className='h-4 w-4 mr-1' /> Zurück
            </Button>
            {currentStep < STEPS.length && (
              <Button
                type='button'
                onClick={nextStep}
                disabled={!isStepValid()}
                size='sm'>
                Weiter <ChevronRight className='h-4 w-4 ml-1' />
              </Button>
            )}
            {currentStep === STEPS.length && (
              <Button
                type='button'
                onClick={handleSubmit}
                disabled={isSubmitting || !isStepValid()}
                size='sm'
                className='bg-green-600 hover:bg-green-700'>
                {isSubmitting && (
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                )}
                Anfrage absenden
              </Button>
            )}
          </div>
          <p className='text-[10px] text-gray-400 mt-2'>
            Mit Absenden stimmen Sie der Verarbeitung Ihrer Angaben zur
            Angebotserstellung zu. Keine Werbung. DSGVO-konform.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
