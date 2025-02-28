"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import { updateCompanyInDatabase } from "@/actions/companyActions";
import { fetchCoordinates } from "@/actions/userActions";
import { CompanyType } from "@/types/RegisterTypye";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextEditor } from "@/components/RichTextEditor";

// Zod-Schema für Validierung
const formSchema = z.object({
  city: z.string().optional(),
  zip: z.string().optional(),
  description: z.string().optional(),
  companyName: z.string().optional(),
  companyNumber: z.string().optional(),
  companyEmail: z
    .string()
    .email({ message: "Bitte eine gültige E-Mail angeben" })
    .optional(),
  companyWebsite: z.string().optional(),
  title: z.string().optional(),
  public: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

const CompanyInfosUpdate: React.FC = () => {
  const { companyData } = useCompanyData();
  const [loading, setLoading] = useState<boolean>(false);
  const [state, setState] = useState<"idle" | "success" | "error">("idle");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { ...companyData },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const companyRef: CompanyType = { ...companyData!, ...data };
      await fetchCoordinates(data.city!, data.zip!).then(async (res) => {
        if (res) {
          companyRef.longitude = res.longitude;
          companyRef.latitude = res.latitude;
          await updateCompanyInDatabase(companyRef);
          setState("success");
        }
      });
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      setState("error");
    }
    setLoading(false);
  };

  return (
    <div className=''>
      <h1 className='text-xl font-semibold mb-4'>Unternehmensformular</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          {/* Stadt */}
          <FormField
            control={form.control}
            name='city'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stadt</FormLabel>
                <FormControl>
                  <Input placeholder='Stadt eingeben' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* PLZ */}
          <FormField
            control={form.control}
            name='zip'
            render={({ field }) => (
              <FormItem>
                <FormLabel>PLZ</FormLabel>
                <FormControl>
                  <Input placeholder='PLZ eingeben' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Beschreibung */}
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Beschreibung</FormLabel>
                <FormControl>
                  <RichTextEditor
                    field={field}
                    defaultValue={companyData!.description!}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unternehmensname */}
          <FormField
            control={form.control}
            name='companyName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unternehmensname</FormLabel>
                <FormControl>
                  <Input placeholder='Unternehmensname eingeben' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unternehmensnummer */}
          <FormField
            control={form.control}
            name='companyNumber'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unternehmensnummer</FormLabel>
                <FormControl>
                  <Input placeholder='Unternehmensnummer eingeben' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unternehmens-E-Mail */}
          <FormField
            control={form.control}
            name='companyEmail'
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-Mail</FormLabel>
                <FormControl>
                  <Input
                    type='email'
                    placeholder='E-Mail eingeben'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unternehmens-Website */}
          <FormField
            control={form.control}
            name='companyWebsite'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input type='url' placeholder='Website eingeben' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Titel */}
          <FormField
            control={form.control}
            name='title'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titel</FormLabel>
                <FormControl>
                  <Input placeholder='Titel eingeben' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Öffentlich Checkbox */}
          <FormField
            control={form.control}
            name='public'
            render={({ field }) => (
              <FormItem className='flex items-center space-x-2'>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Öffentlich</FormLabel>
              </FormItem>
            )}
          />

          {/* Speichern Button */}
          <Button type='submit' className='w-full' disabled={loading}>
            {loading ? "Speichern..." : "Speichern"}
          </Button>

          {/* Statusnachrichten */}
          {state === "success" && (
            <p className='text-green-500'>Daten erfolgreich gespeichert</p>
          )}
          {state === "error" && (
            <p className='text-red-500'>Fehler beim Speichern</p>
          )}
        </form>
      </Form>
    </div>
  );
};

export default CompanyInfosUpdate;
