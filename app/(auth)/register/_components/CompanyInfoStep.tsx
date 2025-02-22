"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/config/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRegisterData } from "@/customHooks/useRegisterData";
import { CompanyType } from "@/types/RegisterTypye";
import { RichTextEditor } from "@/components/RichTextEditor";

// Zod-Schema für Validierung
const formSchema = z.object({
  description: z
    .string()
    .min(5, "Die Beschreibung muss mindestens 5 Zeichen lang sein."),
  images: z
    .array(z.string())
    .min(1, "Bitte lade mindestens ein Bild hoch.")
    .max(3, "Du kannst maximal 3 Bilder hochladen."),
});

type FormData = z.infer<typeof formSchema>;

const CompanyInfoStep = () => {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const { updateStep, data, updateData } = useRegisterData();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      images: [],
    },
  });

  // Funktion zum Hochladen eines Bildes
  const handleImageUpload = async (files: FileList) => {
    if (!files.length || imageUrls.length >= 3) return;

    setUploading(true);

    const filesArray = Array.from(files).slice(0, 3 - imageUrls.length); // Maximal 3 Bilder erlauben

    const uploadPromises = filesArray.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const storageRef = ref(storage, `uploads/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload-Fortschritt: ${progress}%`);
          },
          (error) => {
            console.error("Fehler beim Hochladen:", error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    });

    try {
      const uploadedUrls = await Promise.all(uploadPromises);
      setImageUrls((prev) => [...prev, ...uploadedUrls]);
      form.setValue("images", [...imageUrls, ...uploadedUrls]);
    } catch (error) {
      console.error("Fehler beim Hochladen der Bilder:", error);
    }

    setUploading(false);
  };

  // Funktion zum Löschen eines Bildes
  const handleDeleteImage = async (url: string) => {
    try {
      const imageRef = ref(storage, url);
      await deleteObject(imageRef); // Bild aus Firebase Storage löschen

      // Entferne das Bild aus der lokalen Liste
      const updatedImages = imageUrls.filter((img) => img !== url);
      setImageUrls(updatedImages);
      form.setValue("images", updatedImages);
    } catch (error) {
      console.error("Fehler beim Löschen des Bildes:", error);
    }
  };

  // Submit-Funktion
  const onSubmit: SubmitHandler<FormData> = async (formData) => {
    const companyData: CompanyType = {
      ...data!,
      images: imageUrls,
      description: formData.description,
    };
    updateData(companyData);
    updateStep("service");
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex flex-col gap-4 max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md'>
        {/* Bild-Upload */}
        <FormItem>
          <FormLabel>Bilder hochladen (max. 3)</FormLabel>
          <FormControl>
            <Input
              type='file'
              accept='image/*'
              multiple
              onChange={(e) =>
                e.target.files && handleImageUpload(e.target.files)
              }
              disabled={imageUrls.length >= 3}
            />
          </FormControl>
          {form.getFieldState("images").error && (
            <p className='text-red-500'>
              {form.getFieldState("images").error?.message}
            </p>
          )}
          {uploading && (
            <p className='text-blue-500'>Bilder werden hochgeladen...</p>
          )}
          {/* Bild-Vorschau */}
          <div className='flex gap-2 mt-4 flex-wrap'>
            {imageUrls.map((url, index) => (
              <div key={index} className='relative'>
                <Image
                  src={url}
                  alt={`Bild ${index + 1}`}
                  width={100}
                  height={50} // Max height von 50px
                  className='rounded-md object-cover max-h-[50px]'
                />
                <button
                  type='button'
                  className='absolute top-0 right-0 bg-red-500 text-white rounded-full px-2 text-xs'
                  onClick={() => handleDeleteImage(url)}>
                  X
                </button>
              </div>
            ))}
          </div>
          <FormMessage />
        </FormItem>

        {/* Beschreibung */}
        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beschreibung</FormLabel>
              <FormControl>
                <RichTextEditor field={field} defaultValue='' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Absenden */}
        <Button type='submit' className='w-full' disabled={uploading}>
          Weiter
        </Button>
      </form>
    </Form>
  );
};

export default CompanyInfoStep;
