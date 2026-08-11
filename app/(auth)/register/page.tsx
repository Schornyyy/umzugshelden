"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/config/firebase";
import { v4 as uuid } from "uuid";
import {
  createUser,
  getUserByEmail,
  navigateUser,
} from "@/actions/userActions";
import Link from "next/link";

const registerSchema = z
  .object({
    email: z.string().email("Bitte eine gültige E-Mail-Adresse eingeben"),
    password: z
      .string()
      .min(6, "Das Passwort muss mindestens 6 Zeichen lang sein"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Die Passwörter stimmen nicht überein",
    path: ["confirmPassword"],
  });

type RegisterFormInputs = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    setSubmitting(true);
    setFormError(null);
    try {
      await createUserWithEmailAndPassword(auth, data.email, data.password);

      const existing = await getUserByEmail(data.email);
      let account = existing;
      if (!account) {
        const id = uuid();
        await createUser({ email: data.email, role: "company", id });
        account = await getUserByEmail(data.email);
      }

      navigateUser(
        account ?? { email: data.email, role: "company", id: uuid() },
        "requests",
      );
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/email-already-in-use") {
        setFormError("Diese E-Mail-Adresse ist bereits registriert.");
      } else {
        setFormError("Registrierung fehlgeschlagen. Bitte versuche es erneut.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='min-h-[75vh] flex items-center justify-center bg-gray-100'>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='bg-white p-6 rounded shadow-md w-full max-w-sm'>
        <h1 className='text-xl font-bold mb-4'>Konto erstellen</h1>

        {formError && (
          <div className='mb-4 text-red-600 text-sm' role='alert'>
            {formError}
          </div>
        )}

        <div className='mb-4'>
          <label className='block text-gray-700 mb-1'>E-Mail</label>
          <input
            type='email'
            {...register("email")}
            autoComplete='email'
            autoCapitalize='none'
            autoCorrect='off'
            inputMode='email'
            className={`w-full px-3 py-2 border rounded ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.email && (
            <p className='text-red-500 text-sm mt-1'>{errors.email.message}</p>
          )}
        </div>

        <div className='mb-4'>
          <label className='block text-gray-700 mb-1'>Passwort</label>
          <input
            type='password'
            {...register("password")}
            autoComplete='new-password'
            className={`w-full px-3 py-2 border rounded ${
              errors.password ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.password && (
            <p className='text-red-500 text-sm mt-1'>
              {errors.password.message}
            </p>
          )}
        </div>

        <div className='mb-6'>
          <label className='block text-gray-700 mb-1'>
            Passwort bestätigen
          </label>
          <input
            type='password'
            {...register("confirmPassword")}
            autoComplete='new-password'
            className={`w-full px-3 py-2 border rounded ${
              errors.confirmPassword ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.confirmPassword && (
            <p className='text-red-500 text-sm mt-1'>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type='submit'
          disabled={submitting}
          className='w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-60'>
          {submitting ? "Wird registriert…" : "Registrieren"}
        </button>

        <p className='text-sm text-gray-500 text-center mt-4'>
          Bereits ein Konto?{" "}
          <Link href='/login' className='text-green-600 hover:underline'>
            Einloggen
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
