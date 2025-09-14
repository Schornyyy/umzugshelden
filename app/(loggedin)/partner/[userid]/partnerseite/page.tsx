"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  findPartnerByOwnerId,
  updatePartnerProfile,
} from "@/actions/partnerActions";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/config/firebase";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PartnerPageData {
  id: string;
  contactPerson: string;
  website?: string;
  phone?: string;
  email: string;
  images?: string[];
  texts?: string[];
}

export default function PartnerSeitePage() {
  const params = useParams<{ userid: string }>();
  const router = useRouter();
  const [data, setData] = useState<PartnerPageData | null>(null);
  const [uploading, setUploading] = useState<boolean[]>([false, false, false]);
  const [progress, setProgress] = useState<number[]>([0, 0, 0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      // Route param is the owner account ID; fetch partner by ownerid
      const partner = await findPartnerByOwnerId(params.userid);
      if (!partner) return router.push("/login");
      setData({
        id: partner.id,
        email: partner.email,
        contactPerson: partner.contactPerson,
        website: partner.website,
        phone: partner.phone,
        images: (partner as unknown as { images?: string[] }).images || [],
        texts: (partner as unknown as { texts?: string[] }).texts || [
          "",
          "",
          "",
        ],
      });
    })();
  }, [params.userid, router]);

  const handleFileChange = async (index: number, file: File) => {
    if (!data) return;
    try {
      const pathSafeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storageRef = ref(
        storage,
        `uploads/partners/${data.id}/${Date.now()}-${pathSafeName}`
      );
      const task = uploadBytesResumable(storageRef, file);

      setUploading((u) => Object.assign([], u, { [index]: true }));
      task.on(
        "state_changed",
        (snap) => {
          const pct = Math.round(
            (snap.bytesTransferred / snap.totalBytes) * 100
          );
          setProgress((p) => Object.assign([], p, { [index]: pct }));
        },
        (error) => {
          console.error("Upload error", error);
          setUploading((u) => Object.assign([], u, { [index]: false }));
          setProgress((p) => Object.assign([], p, { [index]: 0 }));
        },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          setData((d) => {
            if (!d) return d;
            const images = d.images ? [...d.images] : [];
            images[index] = url;
            return { ...d, images };
          });
          setUploading((u) => Object.assign([], u, { [index]: false }));
          setProgress((p) => Object.assign([], p, { [index]: 100 }));
        }
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteImage = async (index: number) => {
    if (!data?.images?.[index]) return;
    try {
      const url = data.images[index];
      const match = url.match(/o\/([^?]+)\?/);
      if (match) {
        const path = decodeURIComponent(match[1]);
        await deleteObject(ref(storage, path));
      }
    } catch {}
    setData((d) => {
      if (!d) return d;
      const images = [...(d.images || [])];
      images[index] = "";
      return { ...d, images };
    });
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await updatePartnerProfile(data.id, {
        contactPerson: data.contactPerson,
        website: data.website,
        phone: data.phone,
        email: data.email,
        images: data.images || [],
        texts: data.texts || ["", "", ""],
      });
      alert("Partnerseite gespeichert");
    } catch (e) {
      console.error(e);
      alert("Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    setData((d) => {
      if (!d) return d;
      const imgs = [...(d.images || ["", "", ""])];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= imgs.length) return d;
      const tmp = imgs[index];
      imgs[index] = imgs[target];
      imgs[target] = tmp;
      return { ...d, images: imgs };
    });
  };

  if (!data) return <div className='p-4'>Lädt…</div>;

  return (
    <div className='p-4 max-w-5xl'>
      <div className='flex items-center justify-between mb-4'>
        <h1 className='text-2xl font-bold'>Partnerseite</h1>
        <div className='sticky top-2'>
          <Button
            onClick={save}
            disabled={saving}
            className='bg-green-600 hover:bg-green-700'>
            {saving ? "Speichert…" : "Speichern"}
          </Button>
        </div>
      </div>

      <div className='space-y-6 mb-6'>
        <Card>
          <CardHeader>
            <CardTitle>Kontakt</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div>
              <label className='block text-sm font-medium mb-1'>
                Website URL
              </label>
              <input
                className='w-full border rounded p-2'
                placeholder='https://example.com'
                value={data.website || ""}
                onChange={(e) =>
                  setData((d) => (d ? { ...d, website: e.target.value } : d))
                }
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>
                Telefonnummer
              </label>
              <input
                className='w-full border rounded p-2'
                value={data.phone || ""}
                onChange={(e) =>
                  setData((d) => (d ? { ...d, phone: e.target.value } : d))
                }
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>E-Mail</label>
              <input
                className='w-full border rounded p-2'
                value={data.email}
                onChange={(e) =>
                  setData((d) => (d ? { ...d, email: e.target.value } : d))
                }
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>
                Ansprechpartner
              </label>
              <input
                className='w-full border rounded p-2'
                value={data.contactPerson}
                onChange={(e) =>
                  setData((d) =>
                    d ? { ...d, contactPerson: e.target.value } : d
                  )
                }
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Medien</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='max-w-2xl'>
              <p className='text-xs text-gray-500 mb-3'>
                Empfohlen: 1200x800px, max. 2MB
              </p>
              <div className='flex flex-col gap-3'>
                {[0, 1, 2].map((i) => (
                  <div key={i} className='border rounded p-2 bg-white'>
                    <div className='mb-2 font-medium flex items-center justify-between'>
                      <span>Bild {i + 1}</span>
                      <div className='flex gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => moveImage(i, "up")}
                          disabled={i === 0}>
                          ↑
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => moveImage(i, "down")}
                          disabled={i === 2}>
                          ↓
                        </Button>
                      </div>
                    </div>
                    {data.images?.[i] ? (
                      <div className='space-y-2'>
                        <div className='relative w-full aspect-[3/2] mx-auto'>
                          <Image
                            src={data.images[i]}
                            fill
                            alt={`Bild ${i + 1}`}
                            className='object-cover'
                          />
                        </div>
                        <div className='flex gap-2'>
                          <Button
                            variant='destructive'
                            size='sm'
                            onClick={() => handleDeleteImage(i)}>
                            Löschen
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <label className='flex items-center justify-center w-full aspect-[3/2] mx-auto border-2 border-dashed cursor-pointer text-gray-500'>
                        <span>Datei auswählen</span>
                        <input
                          type='file'
                          accept='image/*'
                          className='hidden'
                          onChange={(e) =>
                            e.target.files &&
                            handleFileChange(i, e.target.files[0])
                          }
                        />
                      </label>
                    )}
                    {uploading[i] && (
                      <div className='text-xs text-gray-500 mt-1'>
                        Upload… {progress[i]}%
                      </div>
                    )}

                    {/* Zugehöriger Textblock */}
                    <div className='mt-3'>
                      <div className='text-xs font-medium text-gray-700 mb-1'>
                        Text {i + 1}
                      </div>
                      <RichTextEditor
                        defaultValue={data.texts?.[i] || ""}
                        field={{
                          onChange: (val: string) =>
                            setData((d) => {
                              if (!d) return d;
                              const texts = d.texts
                                ? [...d.texts]
                                : ["", "", ""];
                              texts[i] = val;
                              return { ...d, texts };
                            }),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Texte werden jetzt direkt bei den Bildern je Block bearbeitet */}
    </div>
  );
}
