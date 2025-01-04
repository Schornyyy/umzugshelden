import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCompanyData } from '@/provider/CompanyDataProvider';
import { updateCompanyInDatabase } from '@/actions/companyActions';
import { CompanyType } from '@/types/RegisterTypye';
import { fetchCoordinates } from '@/actions/userActions';

// Zod Schema für die Validierung
const formSchema = z.object({
  city: z.string().optional(),
  zip: z.string().optional(),
  description: z.string().optional(),
  companyName: z.string().optional(),
  companyNumber: z.string().optional(),
  companyEmail: z.string().email({ message: 'Bitte eine gültige E-Mail angeben' }).optional(),
  companyWebsite: z.string().optional(),
  title: z.string().optional(),
  public: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

const CompanyInfosUpdate: React.FC = () => {
  const { companyData } = useCompanyData(); // Daten von useCompanyData
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {...companyData}, // Standardwerte aus useCompanyData
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [state, setState] = useState<"idle" | "success" | "error">("idle")

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const companyRef: CompanyType = {...companyData!, ...data}
      await fetchCoordinates(data.city!, data.zip!).then(async (res) => {
        if(res) {
          companyRef.longitude = res.longitude;
          companyRef.latitude = res.latitude;
          await updateCompanyInDatabase(companyRef);
          setState("success")
           // Daten speichern
        }
      }); // Koordinaten abrufen
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setState("error")
    }
    setLoading(false);
  };

  const isPublic = watch('public'); // Für Echtzeit-Überwachung von "public"

  return (
    <>
      <h1 className="text-xl font-semibold mb-4">Unternehmensformular</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* City */}
        <div>
          <label className="block text-sm font-medium">Stadt</label>
          <input
            {...register('city')}
            type="text"
            className="w-full p-2 border rounded-md"
            placeholder="Stadt eingeben"
          />
          {errors.city && <p className="text-red-500 text-sm">{errors.city.message}</p>}
        </div>

        {/* ZIP */}
        <div>
          <label className="block text-sm font-medium">PLZ</label>
          <input
            {...register('zip')}
            type="text"
            className="w-full p-2 border rounded-md"
            placeholder="PLZ eingeben"
          />
          {errors.zip && <p className="text-red-500 text-sm">{errors.zip.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium">Beschreibung</label>
          <textarea
            {...register('description')}
            className="w-full p-2 border rounded-md"
            placeholder="Beschreibung eingeben"
          />
          {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium">Unternehmensname</label>
          <input
            {...register('companyName')}
            type="text"
            className="w-full p-2 border rounded-md"
            placeholder="Unternehmensname eingeben"
          />
          {errors.companyName && <p className="text-red-500 text-sm">{errors.companyName.message}</p>}
        </div>

        {/* Company Number */}
        <div>
          <label className="block text-sm font-medium">Unternehmensnummer</label>
          <input
            {...register('companyNumber')}
            type="text"
            className="w-full p-2 border rounded-md"
            placeholder="Unternehmensnummer eingeben"
          />
          {errors.companyNumber && <p className="text-red-500 text-sm">{errors.companyNumber.message}</p>}
        </div>

        {/* Company Email */}
        <div>
          <label className="block text-sm font-medium">E-Mail</label>
          <input
            {...register('companyEmail')}
            type="email"
            className="w-full p-2 border rounded-md"
            placeholder="E-Mail eingeben"
          />
          {errors.companyEmail && <p className="text-red-500 text-sm">{errors.companyEmail.message}</p>}
        </div>

        {/* Company Website */}
        <div>
          <label className="block text-sm font-medium">Website</label>
          <input
            {...register('companyWebsite')}
            type="url"
            className="w-full p-2 border rounded-md"
            placeholder="Website eingeben"
          />
          {errors.companyWebsite && <p className="text-red-500 text-sm">{errors.companyWebsite.message}</p>}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium">Titel</label>
          <input
            {...register('title')}
            type="text"
            className="w-full p-2 border rounded-md"
            placeholder="Titel eingeben"
          />
          {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
        </div>

        {/* Public Slider */}
        <div className="flex items-center space-x-2">
          <label className="block text-sm font-medium">Öffentlich</label>
          <input
            {...register('public')}
            type="checkbox"
            className="w-6 h-6"
          />
          <span>{isPublic ? 'Ja' : 'Nein'}</span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 text-white p-2 rounded-md hover:bg-green-600 disabled:opacity-50"
        >
          Speichern
        </button>
        {state === "success" && <p className="text-green-500">Daten erfolgreich gespeichert</p>}
        {state === "error" && <p className="text-red-500">Fehler beim Speichern</p>}
      </form>
    
    </>
  );
};

export default CompanyInfosUpdate;
