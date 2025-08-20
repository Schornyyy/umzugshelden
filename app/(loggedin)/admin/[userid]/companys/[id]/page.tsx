"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CompanyType } from "@/types/RegisterTypye";
import {
  findCompanyById,
  updateCompanyInDatabase,
} from "@/actions/companyActions";
import { fetchCoordinates } from "@/actions/userActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import Image from "next/image";
import { storage } from "@/config/firebase";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { database } from "@/config/firebase";
import {
  collection,
  getDocs,
  getCountFromServer,
  getDoc,
  doc,
  limit as fbLimit,
  orderBy,
  query as fbQuery,
  where,
} from "firebase/firestore";
import type { ClickType, StatsType } from "@/types/StatsType";

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
  public: z.boolean().default(false),
  automatic: z.boolean().default(false),
  services: z.string().optional(), // comma-separated
});

type FormData = z.infer<typeof formSchema>;

export default function AdminCompanyEditPage() {
  const params = useParams<{ userid: string; id: string }>();
  const companyId = params.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<CompanyType | null>(null);
  const [images, setImages] = useState<(string | null)[]>([null, null, null]);
  const [uploading, setUploading] = useState<boolean[]>([false, false, false]);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  const [counts, setCounts] = useState<Record<ClickType, number> | null>(null);
  const [recentClicks, setRecentClicks] = useState<
    Array<StatsType & { id: string }>
  >([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      city: "",
      zip: "",
      description: "",
      companyName: "",
      companyNumber: "",
      companyEmail: "",
      companyWebsite: "",
      title: "",
      public: false,
      automatic: false,
      services: "",
    },
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await findCompanyById(companyId);
      if (data) {
        setCompany(data);
        form.reset({
          city: data.city ?? "",
          zip: data.zip ?? "",
          description: data.description ?? "",
          companyName: data.companyName ?? "",
          companyNumber: data.companyNumber ?? "",
          companyEmail: data.companyEmail ?? data.email ?? "",
          companyWebsite: data.companyWebsite ?? "",
          title: data.title ?? "",
          public: Boolean(data.public),
          automatic: Boolean(data.automatic),
          services: (data.services ?? []).join(", "),
        });
        const fetchedImages = data.images || [];
        setImages(
          [
            ...fetchedImages,
            ...Array(3 - fetchedImages.length).fill(null),
          ].slice(0, 3)
        );
      }
      setLoading(false);
    };
    if (companyId) load();
  }, [companyId, form]);

  useEffect(() => {
    const loadStats = async () => {
      if (!companyId) return;
      setStatsLoading(true);
      try {
        // Try aggregate doc first for cheap reads
        const aggSnap = await getDoc(doc(database, "company_stats", companyId));
        if (aggSnap.exists()) {
          const data = aggSnap.data() as Record<string, number>;
          setCounts({
            phone: (data.phone as number) || 0,
            email: (data.email as number) || 0,
            website: (data.website as number) || 0,
            adress: (data.adress as number) || 0,
            company: (data.company as number) || 0,
          });
        } else {
          // Fallback: on-the-fly counts (may require index and quota)
          const statsCol = collection(database, "stats");
          const types: ClickType[] = [
            "phone",
            "email",
            "website",
            "adress",
            "company",
          ];
          const countPromises = types.map(async (t) => {
            const q = fbQuery(
              statsCol,
              where("companyId", "==", companyId),
              where("clickType", "==", t)
            );
            const snap = await getCountFromServer(q);
            return [t, snap.data().count as number] as const;
          });
          const entries = await Promise.all(countPromises);
          const countsMap = entries.reduce((acc, [t, c]) => {
            acc[t] = c;
            return acc;
          }, {} as Record<ClickType, number>);
          setCounts(countsMap);
        }

        // Recent clicks (last 50)
        const statsCol = collection(database, "stats");
        let recentQuery;
        try {
          recentQuery = fbQuery(
            statsCol,
            where("companyId", "==", companyId),
            orderBy("timestamp", "desc"),
            fbLimit(50)
          );
        } catch {
          recentQuery = fbQuery(
            statsCol,
            where("companyId", "==", companyId),
            fbLimit(50)
          );
        }
        const recentSnap = await getDocs(recentQuery);
        const rows = recentSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as StatsType),
        }));
        rows.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setRecentClicks(rows.slice(0, 50));
      } catch (e) {
        console.error("Fehler beim Laden der Statistiken:", e);
        setCounts(null);
        setRecentClicks([]);
      } finally {
        setStatsLoading(false);
      }
    };
    loadStats();
  }, [companyId]);

  const handleFileChange = useCallback(
    async (index: number, file: File | null) => {
      if (!file || !company) return;
      const pathSafeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
      const storageRef = ref(
        storage,
        `uploads/${company.id!}/${Date.now()}-${pathSafeName}`
      );
      const uploadTask = uploadBytesResumable(storageRef, file);
      setUploading((prev) => Object.assign([], prev, { [index]: true }));
      uploadTask.on(
        "state_changed",
        null,
        (error) => {
          console.error("Upload error:", error);
          setUploading((prev) => Object.assign([], prev, { [index]: false }));
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const newImages = [...(company.images ?? [])];
          newImages[index] = downloadURL;
          const updated: CompanyType = { ...company, images: newImages };
          await updateCompanyInDatabase(updated);
          setCompany(updated);
          setImages((prev) =>
            Object.assign([], prev, { [index]: downloadURL })
          );
          setUploading((prev) => Object.assign([], prev, { [index]: false }));
        }
      );
    },
    [company]
  );

  const handleDeleteImage = useCallback(
    async (index: number) => {
      if (!company) return;
      const imageUrl = images[index];
      if (!imageUrl) return;
      const storagePath = decodeURIComponent(
        imageUrl.split("/o/")[1]?.split("?")?.[0] ?? ""
      );
      if (storagePath) {
        const imageRef = ref(storage, storagePath);
        await deleteObject(imageRef).catch((e) =>
          console.error("Error deleting image:", e)
        );
      }
      const updated: CompanyType = {
        ...company,
        images: (company.images ?? []).filter((img) => img !== imageUrl),
      };
      await updateCompanyInDatabase(updated);
      setCompany(updated);
      setImages((prev) => Object.assign([], prev, { [index]: null }));
    },
    [company, images]
  );

  const onSubmit = async (data: FormData) => {
    if (!company) return;
    setSaving(true);
    try {
      const updated: CompanyType = {
        ...company,
        city: data.city ?? "",
        zip: data.zip ?? "",
        description: data.description ?? "",
        companyName: data.companyName ?? "",
        companyNumber: data.companyNumber ?? "",
        companyEmail: data.companyEmail ?? company.email,
        companyWebsite: data.companyWebsite ?? "",
        title: data.title ?? "",
        public: Boolean(data.public),
        automatic: Boolean(data.automatic),
        services: (data.services ?? "")
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
      };

      // Update coordinates if city/zip present
      if (updated.city && updated.zip) {
        const coords = await fetchCoordinates(updated.city, updated.zip);
        if (coords) {
          updated.latitude = coords.latitude;
          updated.longitude = coords.longitude;
        }
      }

      const saved = await updateCompanyInDatabase(updated);
      if (saved) setCompany(saved);
    } catch (e) {
      console.error("Fehler beim Speichern:", e);
    } finally {
      setSaving(false);
    }
  };

  const imageTiles = useMemo(
    () =>
      images.map((image, index) => (
        <div
          key={index}
          className='relative w-64 h-64 border border-gray-300 rounded-md overflow-hidden'>
          {uploading[index] ? (
            <div className='flex items-center justify-center h-full'>
              <div className='animate-pulse text-gray-500'>Lade...</div>
            </div>
          ) : image ? (
            <div className='relative w-full h-full'>
              <Image
                src={image}
                alt={`Bild ${index + 1}`}
                height={500}
                width={500}
                className='w-full h-full object-cover'
              />
              <button
                onClick={() => handleDeleteImage(index)}
                className='absolute top-2 right-2 bg-red-500 text-white h-[32px] w-[32px] text-center rounded-full text-sm'>
                ✕
              </button>
            </div>
          ) : (
            <label className='flex items-center justify-center w-full h-full cursor-pointer bg-gray-100 text-gray-500'>
              <span>+</span>
              <input
                type='file'
                accept='image/*'
                className='hidden'
                onChange={(e) =>
                  handleFileChange(index, e.target.files?.[0] || null)
                }
              />
            </label>
          )}
        </div>
      )),
    [images, uploading, handleDeleteImage, handleFileChange]
  );

  return (
    <div className='container mx-auto px-4 py-6'>
      <h1 className='text-2xl font-semibold mb-4'>Unternehmen bearbeiten</h1>

      {loading || !company ? (
        <div className='text-sm text-gray-600'>Lade Unternehmensdaten…</div>
      ) : (
        <>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <div className='lg:col-span-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Stammdaten</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className='space-y-4'>
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <FormField
                          control={form.control}
                          name='companyName'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unternehmensname</FormLabel>
                              <FormControl>
                                <Input placeholder='Müller GmbH' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='companyNumber'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unternehmensnummer</FormLabel>
                              <FormControl>
                                <Input placeholder='HRB 12345' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='companyEmail'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unternehmens-E-Mail</FormLabel>
                              <FormControl>
                                <Input
                                  type='email'
                                  placeholder='info@firma.de'
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='companyWebsite'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website</FormLabel>
                              <FormControl>
                                <Input
                                  type='url'
                                  placeholder='https://www.firma.de'
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='city'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stadt</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='z. B. Nürnberg'
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='zip'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PLZ</FormLabel>
                              <FormControl>
                                <Input placeholder='z. B. 90402' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='title'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Titel</FormLabel>
                              <FormControl>
                                <Input placeholder='Titel' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='services'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Services (Kommagetrennt)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='gartengestaltung, baumpflege'
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name='description'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Beschreibung</FormLabel>
                            <FormControl>
                              <RichTextEditor
                                field={field}
                                defaultValue={company.description ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className='flex items-center gap-6'>
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
                        <FormField
                          control={form.control}
                          name='automatic'
                          render={({ field }) => (
                            <FormItem className='flex items-center space-x-2'>
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel>Automatisch erstellt</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className='pt-2'>
                        <Button type='submit' disabled={saving}>
                          {saving ? "Speichern…" : "Speichern"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            <div className='lg:col-span-1'>
              <Card>
                <CardHeader>
                  <CardTitle>Bilder</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex flex-col md:flex-row flex-wrap gap-6'>
                    {imageTiles}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Stats Section */}
          <div className='mt-6'>
            <Card>
              <CardHeader>
                <CardTitle>Statistiken (Klicks)</CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className='text-sm text-gray-600'>Lade Statistiken…</div>
                ) : (
                  <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                    <div className='lg:col-span-1'>
                      <div className='grid grid-cols-2 gap-3 text-sm'>
                        <div className='font-medium text-gray-700'>Telefon</div>
                        <div>{counts?.phone ?? 0}</div>
                        <div className='font-medium text-gray-700'>E-Mail</div>
                        <div>{counts?.email ?? 0}</div>
                        <div className='font-medium text-gray-700'>Website</div>
                        <div>{counts?.website ?? 0}</div>
                        <div className='font-medium text-gray-700'>Adresse</div>
                        <div>{counts?.adress ?? 0}</div>
                        <div className='font-medium text-gray-700'>Profil</div>
                        <div>{counts?.company ?? 0}</div>
                      </div>
                    </div>
                    <div className='lg:col-span-2'>
                      <div className='text-sm text-gray-700 mb-2'>
                        Letzte Klicks
                      </div>
                      {recentClicks.length === 0 ? (
                        <div className='text-sm text-gray-500'>
                          Keine Klicks vorhanden.
                        </div>
                      ) : (
                        <div className='space-y-2'>
                          {recentClicks.slice(0, 20).map((r) => (
                            <div
                              key={r.id}
                              className='rounded border p-2 text-sm flex items-center justify-between'>
                              <div className='capitalize'>{r.clickType}</div>
                              <div className='text-gray-600'>
                                {new Date(r.timestamp).toLocaleString("de-DE")}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
