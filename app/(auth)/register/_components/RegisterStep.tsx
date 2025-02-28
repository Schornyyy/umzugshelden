import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegisterData } from "@/customHooks/useRegisterData";
import { CompanyType } from "@/types/RegisterTypye";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/config/firebase";
import { createCompanyInDatabase } from "@/actions/companyActions";
import { useRouter } from "next/navigation";
import { addUserToBrevoList } from "@/actions/userActions";

// Zod-Schema
const schema = z
  .object({
    email: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein"),
    password: z
      .string()
      .min(6, "Das Passwort muss mindestens 6 Zeichen lang sein"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Die Passwörter stimmen nicht überein",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

const RegisterStep = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const navigate = useRouter();

  const { updateStep, data, updateData } = useRegisterData();
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>();

  const sendEmail = async (companyName: string, toEmail: string) => {
    try {
      if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
        console.error("Ungültige oder fehlende E-Mail-Adresse:", toEmail);
        return;
      }

      const replacements: { [key: string]: string } = {
        companyName: companyName,
      };

      console.log("Sende E-Mail an:", toEmail);

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: toEmail,
          subject: "Vielen dank für deine Registrierung!",
          replacements,
          templatePath: "RegisterEmail.html", // Pfad zum Template
        }),
      });

      if (response.ok) {
        console.log("E-Mail erfolgreich gesendet.");
      } else {
        console.error("Fehler beim Senden der E-Mail:", await response.json());
      }
    } catch (error) {
      console.error("Fehler beim Senden der E-Mail:", error);
    }
  };

  const onSubmit = async (submitData: FormData) => {
    setLoading(true);

    try {
      const d: CompanyType = {
        ...data!,
        email: submitData.email,
        public: true,
        type: "company",
      };
      updateData(d);

      await createCompanyInDatabase(d).then(async () => {
        await createUserWithEmailAndPassword(
          auth,
          submitData.email,
          submitData.password
        );
        sendEmail(data!.companyName!, submitData.email);
        setLoading(false);
        addUserToBrevoList(d.email, 4, d.companyName!);
        navigate.push("/login");
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Fehlerbehandlung
      console.error("Fehler beim Erstellen des Kontos:", error.message);

      // Rückgabe eines spezifischen Fehlercodes oder -nachricht
      if (error.code === "auth/email-already-in-use") {
        console.error("Die E-Mail wird bereits verwendet.");
        setErrorMsg("Die E-Mail wird bereits verwendet.");
      } else if (error.code === "auth/invalid-email") {
        console.error("Ungültige E-Mail-Adresse.");
        setErrorMsg("Ungültige E-Mail-Adresse.");
      } else if (error.code === "auth/weak-password") {
        console.error("Das Passwort ist zu schwach.");
        setErrorMsg("Das Passwort ist zu schwach.");
      } else {
        console.error("Unbekannter Fehler:", error.message);
        setErrorMsg(`Unbekannter Fehler: ${error.message}`);
      }
    }
  };

  const handleBack = () => {
    updateStep("service");
  };

  return (
    <div className='flex flex-col w-full justify-center items-center h-screen max-md:p-6'>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='flex flex-col gap-6  w-full md:w-1/5 p-4 border rounded-md shadow'>
        {/* Email */}
        <div className='flex flex-col'>
          <label htmlFor='email' className='font-semibold'>
            E-Mail-Adresse
          </label>
          <input
            type='email'
            id='email'
            {...register("email")}
            className='border p-2 rounded'
          />
          {errors.email && (
            <p className='text-red-500 text-sm'>{errors.email.message}</p>
          )}
        </div>

        {/* Passwort */}
        <div className='flex flex-col'>
          <label htmlFor='password' className='font-semibold'>
            Passwort
          </label>
          <input
            type='password'
            id='password'
            {...register("password")}
            className='border p-2 rounded'
          />
          {errors.password && (
            <p className='text-red-500 text-sm'>{errors.password.message}</p>
          )}
        </div>

        {/* Passwort wiederholen */}
        <div className='flex flex-col'>
          <label htmlFor='confirmPassword' className='font-semibold'>
            Passwort wiederholen
          </label>
          <input
            type='password'
            id='confirmPassword'
            {...register("confirmPassword")}
            className='border p-2 rounded'
          />
          {errors.confirmPassword && (
            <p className='text-red-500 text-sm'>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit-Button */}
        <div className='flex flex-row justify-between'>
          <button
            disabled={loading}
            className='py-2 px-4 rounded text-white bg-blue-600 disabled:bg-blue-400 hover:bg-blue-700'
            onClick={() => handleBack()}>
            Zurück
          </button>
          <button
            disabled={loading}
            type='submit'
            className='bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 disabled:bg-green-400'>
            Registrieren
          </button>
        </div>
        {errorMsg && <p className='text-red-500'>{errorMsg}</p>}
      </form>
    </div>
  );
};

export default RegisterStep;
