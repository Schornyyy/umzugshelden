"use client";

import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ContractRequest } from "@/types/ContractRequest";
import { createContractRequest } from "@/actions/CompanyContractRequestAction";
import Image from "next/image";
import Headings from "@/components/Headings";
import { CompanyType } from "@/types/RegisterTypye";

export const contractRequestSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  email: z.string().email("Ungültige E-Mail"),
  phone: z.string().min(1, "Telefonnummer ist erforderlich"),
  msg: z.string().min(5, "Nachricht ist zu kurz"),
  service: z.string().min(1, "Dienstleistung ist erforderlich"),
});

export type ContractRequestFormData = z.infer<typeof contractRequestSchema>;

const CompanyContractForm = ({ company }: { company: CompanyType }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [sent, setSent] = useState<boolean>(false);

  const form = useForm<ContractRequestFormData>({
    resolver: zodResolver(contractRequestSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      msg: "",
      service: undefined,
    },
  });

  const sendUserEmail = async (toEmail: string, contractID: string) => {
    try {
      if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
        console.error("Ungültige oder fehlende E-Mail-Adresse:", toEmail);
        return;
      }

      const replacements: { [key: string]: string } = {
        contractLink: `https://landschaftshelden.io/company/${company.id}/inquiry/${contractID}`,
      };

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: toEmail,
          subject: "Neue Anfrage erhalten über | Landschaftshelden.io",
          replacements,
          templatePath: "CompanyContractEmail.html", // Pfad zum Template
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

  const onSubmit = async (data: ContractRequestFormData) => {
    setLoading(true);
    const contract: ContractRequest = {
      companyId: company.id!,
      createdAt: new Date().toISOString(),
      email: data.email,
      id: crypto.randomUUID(),
      msg: data.msg,
      name: data.name,
      phone: data.phone,
      service: data.service,
      status: "unread",
    };

    await sendUserEmail(company.email, contract.id);
    await createContractRequest(contract);

    setLoading(false);
    setSent(true);
    form.reset();
  };

  return (
    <>
      {!sent ? (
        <div className='flex flex-col gap-4'>
          <Headings level={3}>Sende jetzt eine Anfrage!</Headings>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 w-4/5'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Max Mustermann' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder='max@example.com'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input placeholder='+49 123 456789' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SELECT FIELD FOR SERVICE */}
              <FormField
                control={form.control}
                name='service'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Wähle einen Service' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {company.services!.map((service: string) => (
                          <SelectItem key={service} value={service}>
                            {service}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='msg'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nachricht</FormLabel>
                    <FormControl>
                      <Textarea placeholder='Ihre Nachricht...' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type='submit'
                className='disabled:bg-primary/75'
                disabled={loading}>
                {loading ? "Anfrage wird gesendet..." : "Anfrage senden"}
              </Button>
            </form>
          </Form>
        </div>
      ) : (
        <div className='w-full items-center justify-center flex flex-col gap-4'>
          <Headings level={3} className='text-center'>
            Deine Anfrage wurde erfolgreich gesendet!
          </Headings>
          <Image
            src={"/icons/mail_sent.svg"}
            height={756}
            width={326}
            alt='Mail sent icon'
          />
        </div>
      )}
    </>
  );
};

export default CompanyContractForm;
