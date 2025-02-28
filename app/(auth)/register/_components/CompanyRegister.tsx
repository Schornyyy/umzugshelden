import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegisterData } from "@/customHooks/useRegisterData";
import { CompanyType } from "@/types/RegisterTypye";
import { fetchCoordinates } from "@/actions/userActions";

// Schema für die Validierung mit Zod
const companySchema = z.object({
  city: z.string().min(1, "Stadt ist erforderlich"),
  postalCode: z
    .string()
    .regex(/^\d{5}$/, "Postleitzahl muss 5 Ziffern enthalten"),
  companyName: z.string().min(1, "Unternehmensname ist erforderlich"),
  companyNumber: z.string().min(1, "Unternehmensnummer ist erforderlich"),
  companyEmail: z.string().email("Ungültige E-Mail-Adresse"),
  website: z.string().optional(),
});

// Typ für die Form-Daten
type CompanyFormData = z.infer<typeof companySchema>;

const CompanyRegister: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  const { updateStep, data, updateData } = useRegisterData();

  const onSubmit = async (submitData: CompanyFormData) => {
    const d: CompanyType = {
      ...data!,
      city: submitData.city,
      zip: submitData.postalCode,
      companyName: submitData.companyName,
      companyNumber: submitData.companyNumber,
      companyEmail: submitData.companyEmail,
      companyWebsite: submitData.website,
      type: "company",
    };
    await fetchCoordinates(submitData.city, submitData.postalCode).then(
      (res) => {
        if (res) {
          d.longitude = res.longitude;
          d.latitude = res.latitude;
        }
      }
    );
    updateData(d);
    updateStep("companyInfos");
  };

  return (
    <div className='flex flex-col w-full justify-center items-center h-screen max-md:p-6'>
      <div className='flex flex-col gap-6  w-full md:w-1/5 p-4 border rounded-md shadow'>
        <h2 className='text-2xl font-bold mb-4'>Unternehmen Registrieren</h2>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          {/* Stadt */}
          <div>
            <label className='block font-medium'>Stadt</label>
            <input
              type='text'
              {...register("city")}
              className='w-full p-2 border rounded'
            />
            {errors.city && (
              <p className='text-red-500'>{errors.city.message}</p>
            )}
          </div>

          {/* Postleitzahl */}
          <div>
            <label className='block font-medium'>Postleitzahl</label>
            <input
              type='text'
              {...register("postalCode")}
              className='w-full p-2 border rounded'
            />
            {errors.postalCode && (
              <p className='text-red-500'>{errors.postalCode.message}</p>
            )}
          </div>

          {/* Unternehmensname */}
          <div>
            <label className='block font-medium'>Unternehmensname</label>
            <input
              type='text'
              {...register("companyName")}
              className='w-full p-2 border rounded'
            />
            {errors.companyName && (
              <p className='text-red-500'>{errors.companyName.message}</p>
            )}
          </div>

          {/* Unternehmensnummer */}
          <div>
            <label className='block font-medium'>Unternehmensnummer</label>
            <input
              type='text'
              {...register("companyNumber")}
              className='w-full p-2 border rounded'
            />
            {errors.companyNumber && (
              <p className='text-red-500'>{errors.companyNumber.message}</p>
            )}
          </div>

          {/* Unternehmens-E-Mail */}
          <div>
            <label className='block font-medium'>Unternehmens-E-Mail</label>
            <input
              type='email'
              {...register("companyEmail")}
              className='w-full p-2 border rounded'
            />
            {errors.companyEmail && (
              <p className='text-red-500'>{errors.companyEmail.message}</p>
            )}
          </div>

          {/* Website */}
          <div>
            <label className='block font-medium'>Website (optional)</label>
            <input
              type='url'
              {...register("website")}
              className='w-full p-2 border rounded'
            />
            {errors.website && (
              <p className='text-red-500'>{errors.website.message}</p>
            )}
          </div>

          <div className='flex flex-row justify-between'>
            <button
              type='submit'
              className='px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600'>
              Weiter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyRegister;
