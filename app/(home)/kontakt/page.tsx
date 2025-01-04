"use client"
// app/kontakt/page.tsx (oder der entsprechende Pfad)

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

// Zod-Schema für die Formularvalidierung
const ContactSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  email: z.string().email('Bitte gib eine gültige E-Mail-Adresse ein'),
  phone: z.string().optional(),
  message: z.string().min(1, 'Nachricht ist erforderlich'),
})

// Typen für die Formularfelder
type ContactFormData = z.infer<typeof ContactSchema>


const page = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  // eslint-disable-next-line react-hooks/rules-of-hooks
  } = useForm<ContactFormData>({
    resolver: zodResolver(ContactSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    try {
      const response = await fetch('https://formspree.io/f/xdkkpezj', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setFormStatus('success')
        reset() // Formular zurücksetzen
      } else {
        throw new Error('Fehler beim Senden der Nachricht.')
      }
    } catch (error) {
      console.error('Error:', error)
      setFormStatus('error')
    }
  }

  return (
    <div className="container mx-auto px-4 my-12 max-w-2xl">
      <h1 className="text-3xl font-bold text-center mb-8">Kontaktieren Sie uns</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6 bg-white p-6 rounded-lg shadow-lg"
      >
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            className={`mt-1 p-2 block w-full border ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm`}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            E-Mail
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className={`mt-1 p-2 block w-full border ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm`}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Telefonnummer */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Telefonnummer
          </label>
          <input
            id="phone"
            type="text"
            {...register('phone')}
            className={`mt-1 p-2 block w-full border ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm`}
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>

        {/* Nachricht */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">
            Nachricht
          </label>
          <textarea
            id="message"
            {...register('message')}
            rows={5}
            className={`mt-1 p-2 block w-full border ${
              errors.message ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm`}
          />
          {errors.message && (
            <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>
          )}
        </div>

        {/* Absenden */}
        <button
          type="submit"
          className="py-2 px-4 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          Nachricht senden
        </button>

        {/* Erfolgs- und Fehlermeldungen */}
        {formStatus === 'success' && (
          <p className="text-green-500 text-sm mt-2">Vielen Dank! Ihre Nachricht wurde gesendet.</p>
        )}
        {formStatus === 'error' && (
          <p className="text-red-500 text-sm mt-2">
            Etwas ist schiefgelaufen. Bitte versuchen Sie es später erneut.
          </p>
        )}
      </form>
    </div>
  )
}

export default page
