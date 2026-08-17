"use client";

import React, { useState } from "react";
import {
  ArmchairIcon,
  CalendarIcon,
  HomeIcon,
  ImagePlusIcon,
  PaintRollerIcon,
  Trash2Icon,
  TruckIcon,
  XIcon,
} from "lucide-react";
import { createRequest } from "@/actions/requestsActions";
import { storage } from "@/config/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const inputBase =
  "font-body w-full px-4 py-3 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary";
const inputDark = `${inputBase} bg-white/90 text-gray-800 placeholder-gray-500`;
const inputLight = `${inputBase} bg-white border border-gray-200 text-gray-800 placeholder-gray-400`;
const maxImageCount = 5;
const maxImageSize = 8 * 1024 * 1024;

const services = [
  {
    id: "umzugsservice",
    name: "Umzugsservice",
    icon: TruckIcon,
    needsAddresses: true,
  },
  {
    id: "seniorenumzug",
    name: "Seniorenumzug",
    icon: HomeIcon,
    needsAddresses: true,
  },
  {
    id: "entruempelung",
    name: "Entrümpelung",
    icon: Trash2Icon,
    needsAddresses: false,
  },
  {
    id: "anstricharbeiten",
    name: "Anstricharbeiten",
    icon: PaintRollerIcon,
    needsAddresses: false,
  },
  {
    id: "moebelservice",
    name: "Möbel Ab- & Aufbau",
    icon: ArmchairIcon,
    needsAddresses: false,
  },
] as const;

type ServiceId = (typeof services)[number]["id"];

const ContactForm = ({ dark = false }: { dark?: boolean }) => {
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState<ServiceId | null>(null);
  const [preferredDate, setPreferredDate] = useState("");
  const [oldAddress, setOldAddress] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(
    null,
  );

  const inputClass = dark ? inputDark : inputLight;
  const selectedService = services.find((service) => service.id === serviceId);
  const buttonClass =
    "font-sans bg-primary hover:bg-primary/90 text-white py-3 px-5 rounded text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60";
  const secondaryButtonClass = dark
    ? "font-sans border border-white/30 text-white hover:bg-white/10 py-3 px-5 rounded text-sm font-semibold"
    : "font-sans border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-5 rounded text-sm font-semibold";

  function showError(msg: string) {
    setStatus({ ok: false, msg });
  }

  function goToDetails() {
    if (!selectedService) {
      showError("Bitte wählen Sie eine Dienstleistung aus.");
      return;
    }
    setStatus(null);
    setStep(2);
  }

  function goToContact() {
    if (!preferredDate) {
      showError("Bitte wählen Sie Ihren Wunschtermin aus.");
      return;
    }
    if (selectedService?.needsAddresses && (!oldAddress || !newAddress)) {
      showError("Bitte geben Sie Auszugs- und Einzugsadresse an.");
      return;
    }
    setStatus(null);
    setStep(3);
  }

  function resetForm() {
    setStep(1);
    setServiceId(null);
    setPreferredDate("");
    setOldAddress("");
    setNewAddress("");
    setName("");
    setPhone("");
    setEmail("");
    setMessage("");
    setImages([]);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedImages = Array.from(e.target.files ?? []);
    const allImages = [...images, ...selectedImages];

    if (allImages.length > maxImageCount) {
      showError(`Bitte wählen Sie maximal ${maxImageCount} Bilder aus.`);
      e.target.value = "";
      return;
    }
    if (selectedImages.some((image) => !image.type.startsWith("image/"))) {
      showError("Bitte wählen Sie nur Bilddateien aus.");
      e.target.value = "";
      return;
    }
    if (selectedImages.some((image) => image.size > maxImageSize)) {
      showError("Jedes Bild darf maximal 8 MB groß sein.");
      e.target.value = "";
      return;
    }

    setImages(allImages);
    setStatus(null);
    e.target.value = "";
  }

  async function uploadImages(): Promise<string[]> {
    const uploadGroupId = crypto.randomUUID();
    return Promise.all(
      images.map(async (image, index) => {
        const safeFileName = image.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const imageRef = ref(
          storage,
          `requests/${uploadGroupId}/${Date.now()}-${index}-${safeFileName}`,
        );
        const snapshot = await uploadBytes(imageRef, image);
        return getDownloadURL(snapshot.ref);
      }),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    if (!selectedService || !preferredDate) {
      showError("Bitte vervollständigen Sie die Anfrage in den vorherigen Schritten.");
      return;
    }
    if (!name || !email || !phone) {
      showError("Bitte füllen Sie Name, E-Mail und Telefonnummer aus.");
      return;
    }
    if (selectedService.needsAddresses && (!oldAddress || !newAddress)) {
      showError("Bitte geben Sie Auszugs- und Einzugsadresse an.");
      return;
    }

    setLoading(true);
    try {
      const ownerId = process.env.NEXT_PUBLIC_OWNERID;
      if (!ownerId) throw new Error("Owner-ID nicht konfiguriert.");

      const requestMessage = [
        `Dienstleistung: ${selectedService.name}`,
        `Wunschtermin: ${preferredDate.split("-").reverse().join(".")}`,
        ...(selectedService.needsAddresses
          ? [
              `Auszugsadresse: ${oldAddress}`,
              `Einzugsadresse: ${newAddress}`,
            ]
          : []),
        ...(message ? ["", `Zusätzliche Hinweise: ${message}`] : []),
      ].join("\n");

      const imageUrls = await uploadImages();

      const [emailRes] = await Promise.all([
        fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: "info@umzugshelden.io",
            subject: `${selectedService.name}: Anfrage von ${name}`,
            replacements: { name, phone, email, message: requestMessage },
            templatePath: "ContactEmailTemplate.html",
            tracking: false,
          }),
        }),
        createRequest(ownerId, {
          name,
          email,
          phone,
          message: requestMessage,
          imageUrls,
        }),
      ]);

      const emailData = await emailRes.json();

      if (emailRes.ok && !emailData.error) {
        setStatus({
          ok: true,
          msg: "Danke — Anfrage erfasst und E-Mail gesendet.",
        });
        resetForm();
      } else {
        setStatus({
          ok: false,
          msg: `Anfrage gespeichert, aber E-Mail fehlgeschlagen: ${emailData.error || "Unbekannter Fehler"}`,
        });
      }
    } catch (err) {
      console.error(err);
      setStatus({
        ok: false,
        msg: "Netzwerkfehler. Bitte versuchen Sie es später erneut.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4 w-full'>
      <div className='flex items-center gap-2' aria-label={`Schritt ${step} von 3`}>
        {[1, 2, 3].map((stepNumber) => (
          <span
            key={stepNumber}
            className={`h-1 flex-1 rounded ${stepNumber <= step ? "bg-primary" : dark ? "bg-white/25" : "bg-gray-200"}`}
          />
        ))}
      </div>

      {step === 1 && (
        <>
          <div>
            <h3 className={`font-sans text-base font-semibold ${dark ? "text-white" : "text-navy"}`}>
              Wobei dürfen wir helfen?
            </h3>
            <p className={`font-body mt-1 text-sm ${dark ? "text-gray-300" : "text-gray-600"}`}>
              Wählen Sie die Leistung für Ihr unverbindliches Angebot.
            </p>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            {services.map((service) => {
              const Icon = service.icon;
              const isSelected = service.id === serviceId;
              return (
                <button
                  key={service.id}
                  type='button'
                  onClick={() => {
                    setServiceId(service.id);
                    setStatus(null);
                  }}
                  aria-pressed={isSelected}
                  className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded border px-3 py-4 text-center text-sm font-semibold transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                      : dark
                        ? "border-white/20 bg-white/5 text-white hover:bg-white/10"
                        : "border-gray-200 bg-white text-gray-800 hover:border-primary/50"
                  }`}>
                  <Icon size={26} aria-hidden='true' />
                  <span>{service.name}</span>
                </button>
              );
            })}
          </div>
          <button type='button' onClick={goToDetails} className={buttonClass}>
            Weiter
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div>
            <h3 className={`font-sans text-base font-semibold ${dark ? "text-white" : "text-navy"}`}>
              {selectedService?.needsAddresses ? "Wo und wann findet der Umzug statt?" : "Wann soll die Leistung stattfinden?"}
            </h3>
            <p className={`font-body mt-1 text-sm ${dark ? "text-gray-300" : "text-gray-600"}`}>
              {selectedService?.needsAddresses
                ? "Mit beiden Adressen können wir Aufwand und Strecke besser einschätzen."
                : "Ein Wunschtermin genügt für die erste Einschätzung."}
            </p>
          </div>
          {selectedService?.needsAddresses && (
            <>
              <input
                type='text'
                value={oldAddress}
                onChange={(e) => setOldAddress(e.target.value)}
                placeholder='Auszugsadresse (Straße, PLZ Ort)'
                autoComplete='street-address'
                className={inputClass}
              />
              <input
                type='text'
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder='Einzugsadresse (Straße, PLZ Ort)'
                className={inputClass}
              />
            </>
          )}
          <label className={`flex flex-col gap-2 font-body text-sm ${dark ? "text-gray-200" : "text-gray-700"}`}>
            Wunschtermin
            <span className='relative'>
              <CalendarIcon className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary' size={18} aria-hidden='true' />
              <input
                type='date'
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className={`${inputClass} pl-11`}
              />
            </span>
          </label>
          <div className='grid grid-cols-2 gap-3'>
            <button type='button' onClick={() => { setStatus(null); setStep(1); }} className={secondaryButtonClass}>
              Zurück
            </button>
            <button type='button' onClick={goToContact} className={buttonClass}>
              Weiter
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div>
            <h3 className={`font-sans text-base font-semibold ${dark ? "text-white" : "text-navy"}`}>
              Wie können wir Sie erreichen?
            </h3>
            <p className={`font-body mt-1 text-sm ${dark ? "text-gray-300" : "text-gray-600"}`}>
              Wir melden uns innerhalb von 24 Stunden bei Ihnen.
            </p>
          </div>
          <input
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Name'
            autoComplete='name'
            className={inputClass}
          />
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='E-Mail'
            autoComplete='email'
            inputMode='email'
            className={inputClass}
          />
          <input
            type='tel'
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder='Telefonnummer'
            autoComplete='tel'
            inputMode='tel'
            className={inputClass}
          />
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='Zusätzliche Hinweise (optional)'
            className={`${inputClass} resize-none`}
          />
          <div className='flex flex-col gap-2'>
            <label
              className={`flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed px-4 py-3 text-sm font-semibold transition-colors ${
                dark
                  ? "border-white/30 text-white hover:bg-white/10"
                  : "border-gray-300 text-gray-700 hover:border-primary hover:text-primary"
              }`}>
              <ImagePlusIcon size={18} aria-hidden='true' />
              Bilder hinzufügen (optional)
              <input
                type='file'
                accept='image/jpeg,image/png,image/webp'
                multiple
                onChange={handleImageChange}
                className='sr-only'
                disabled={loading}
              />
            </label>
            <p className={`font-body text-xs ${dark ? "text-gray-300" : "text-gray-500"}`}>
              Maximal {maxImageCount} Bilder, je 8 MB. JPG, PNG oder WebP.
            </p>
            {images.length > 0 && (
              <ul className='flex flex-col gap-1'>
                {images.map((image, index) => (
                  <li
                    key={`${image.name}-${index}`}
                    className={`flex items-center justify-between gap-3 text-xs ${dark ? "text-gray-200" : "text-gray-600"}`}>
                    <span className='truncate'>{image.name}</span>
                    <button
                      type='button'
                      onClick={() => setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}
                      className='flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-black/10'
                      aria-label={`${image.name} entfernen`}>
                      <XIcon size={15} aria-hidden='true' />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <button type='button' onClick={() => { setStatus(null); setStep(2); }} className={secondaryButtonClass}>
              Zurück
            </button>
            <button type='submit' disabled={loading} className={buttonClass}>
              {loading ? "Senden…" : "Angebot anfordern"}
            </button>
          </div>
        </>
      )}
      {status && (
        <p
          className={`text-sm text-center ${status.ok ? "text-green-600" : "text-red-500"}`}>
          {status.msg}
        </p>
      )}
    </form>
  );
};

export default ContactForm;
