"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/config/firebase";
import {
  findCompanyByEmail,
  findCompanyByOwnerId,
  updateCompanyInDatabase,
} from "@/actions/companyActions";
import { navigateUser } from "@/actions/userActions";
import {
  createAccountInDatabase,
  findAccountByEmail,
} from "@/actions/AccountActions";
import { Account } from "@/types/AccountType";
import { v4 as uuid } from "uuid";

// Zod Schema für Validierung
const loginSchema = z.object({
  email: z.string().email("Bitte eine gültige E-Mail-Adresse eingeben"),
  password: z
    .string()
    .min(6, "Das Passwort muss mindestens 6 Zeichen lang sein"),
});

// Typen basierend auf dem Schema
type LoginFormInputs = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const createAccount = async (email: string) => {
    const account: Account = {
      id: uuid(),
      email: email,
      role: "company",
    };
    createAccountInDatabase(account);
    return account;
  };

  const onSubmit = async (data: LoginFormInputs) => {
    const { email, password } = data;

    try {
      await signInWithEmailAndPassword(auth, email, password).then(
        async (res) => {
          if (res) {
            let account = await findAccountByEmail(email);
            if (!account) {
              account = await createAccount(email);
            }

            await findCompanyByOwnerId(account.id).then(async (res) => {
              console.log("Company found:", res);
              if (!res) {
                await findCompanyByEmail(email).then((company) => {
                  console.log("Company by email found:", company);
                  if (company) {
                    if (
                      company.type === "company" ||
                      company.type == undefined
                    ) {
                      updateCompanyInDatabase({
                        ...company,
                        ownerid: account.id,
                      });
                    }
                    navigateUser(company.type, company.id!);
                  }

                  if (company?.type === "admin") {
                    navigateUser("admin", company.id!);
                  }
                });
              } else {
                navigateUser(res.type, res.id!);
              }
            });
          }
        }
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Login fehlgeschlagen:", error.message);
      alert("Login fehlgeschlagen. Bitte überprüfe deine Zugangsdaten.");
    }
  };

  return (
    <div className='min-h-[75vh] flex items-center justify-center bg-gray-100'>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='bg-white p-6 rounded shadow-md w-full max-w-sm'>
        <h1 className='text-xl font-bold mb-4'>Login</h1>

        <div className='mb-4'>
          <label className='block text-gray-700 mb-1'>E-Mail</label>
          <input
            type='email'
            {...register("email")}
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
          className='w-full bg-green-500 text-white py-2 rounded hover:bg-green-600'>
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
