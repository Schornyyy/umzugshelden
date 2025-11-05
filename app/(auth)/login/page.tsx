"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/config/firebase";
import { v4 as uuid } from "uuid";
import {
  createUser,
  getUserByEmail,
  navigateUser,
} from "@/actions/userActions";

// Zod Schema für Validierung
const loginSchema = z.object({
  email: z.string().email("Bitte eine gültige E-Mail-Adresse eingeben"),
  password: z
    .string()
    .min(6, "Das Passwort muss mindestens 6 Zeichen lang sein"),
});

// Typen basierend auf dem Schema
type LoginFormInputs = z.infer<typeof loginSchema>;

const LoginInner: React.FC = () => {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get("prefillEmail") || undefined;

  const onSubmit = async (data: LoginFormInputs) => {
    const { email, password } = data;
    setSubmitting(true);
    setFormError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (!result) throw new Error("Auth failed");

      let account = await getUserByEmail(email);
      if (!account) {
        await createUser({ email: email, role: "company", id: uuid() });
        account = await getUserByEmail(email);
      }

      navigateUser(
        account ? account : { email: "", role: "company", id: uuid() },
        ""
      );
    } catch {
      setFormError(
        "Login fehlgeschlagen. Bitte überprüfe deine E-Mail und dein Passwort."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='min-h-[75vh] flex items-center justify-center bg-gray-100'>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='bg-white p-6 rounded shadow-md w-full max-w-sm'>
        <h1 className='text-xl font-bold mb-4'>Login</h1>

        {formError && (
          <div className='mb-4 text-red-600 text-sm' role='alert'>
            {formError}
          </div>
        )}

        <div className='mb-4'>
          <label className='block text-gray-700 mb-1'>E-Mail</label>
          <input
            type='email'
            defaultValue={prefillEmail}
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
            autoComplete='current-password'
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

        <button
          type='submit'
          disabled={submitting}
          className='w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-60'>
          {submitting ? "Wird eingeloggt…" : "Login"}
        </button>
      </form>
    </div>
  );
};

const LoginPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className='min-h-[75vh] flex items-center justify-center bg-gray-100'>
          <div className='text-gray-500'>Lädt…</div>
        </div>
      }>
      <LoginInner />
    </Suspense>
  );
};

export default LoginPage;
