"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  getPartnerProfile,
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

interface PartnerData {
  id: string;
  contactPerson: string;
  website?: string;
  phone?: string;
  email: string;
  images?: string[];
  texts?: string[]; // three text blocks
}

export default function PartnerSettingsPage() {
  const params = useParams<{ userid: string }>();
  const router = useRouter();
  const [data, setData] = useState<PartnerData | null>(null);
  const [uploading, setUploading] = useState<boolean[]>([false, false, false]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      // Route param entspricht direkt der Partner-ID im neuen Schema
      const partner = await getPartnerProfile(params.userid);
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
        undefined,
        (error) => {
          console.error("Upload error", error);
          setUploading((u) => Object.assign([], u, { [index]: false }));
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
      const match = url.match(/o\/([^?]+)\?/); // crude extraction; optional
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
        // Persist images/texts into partner doc
        ...(data.images ? { images: data.images } : {}),
        ...(data.texts ? { texts: data.texts } : {}),
      });
      alert("Einstellungen gespeichert");
    } catch (e) {
      console.error(e);
      alert("Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  if (!data) return <div className='p-4'>Lädt…</div>;

  return (
    <div className='p-4 max-w-3xl'>
      <h1 className='text-2xl font-bold mb-4'>Einstellungen</h1>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        {[0, 1, 2].map((i) => (
          <div key={i} className='border rounded p-3 bg-white'>
            <div className='mb-2 font-medium'>Bild {i + 1}</div>
            {data.images?.[i] ? (
              <div className='space-y-2'>
                <div className='relative w-full h-32'>
                  <Image
                    src={data.images[i]}
                    fill
                    alt={`Bild ${i + 1}`}
                    className='object-cover rounded'
                  />
                </div>
                <button
                  className='text-sm text-red-600'
                  onClick={() => handleDeleteImage(i)}>
                  Löschen
                </button>
              </div>
            ) : (
              <input
                type='file'
                accept='image/*'
                onChange={(e) =>
                  e.target.files && handleFileChange(i, e.target.files[0])
                }
              />
            )}
            {uploading[i] && (
              <div className='text-xs text-gray-500 mt-1'>Upload…</div>
            )}
          </div>
        ))}
      </div>

      <div className='grid grid-cols-1 gap-4 mb-6'>
        {[0, 1, 2].map((i) => (
          <div key={i} className='bg-white p-3 rounded border'>
            <label className='block text-sm font-medium mb-2'>
              Textblock {i + 1}
            </label>
            <RichTextEditor
              defaultValue={data.texts?.[i] || ""}
              field={{
                onChange: (val: string) =>
                  setData((d) => {
                    if (!d) return d;
                    const texts = d.texts ? [...d.texts] : ["", "", ""];
                    texts[i] = val;
                    return { ...d, texts };
                  }),
              }}
            />
          </div>
        ))}
      </div>

      <div className='bg-white p-4 rounded border space-y-3'>
        <div>
          <label className='block text-sm font-medium mb-1'>Website URL</label>
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
              setData((d) => (d ? { ...d, contactPerson: e.target.value } : d))
            }
          />
        </div>
      </div>

      <div className='mt-6'>
        <button
          onClick={save}
          disabled={saving}
          className='bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60'>
          {saving ? "Speichert…" : "Speichern"}
        </button>
      </div>
    </div>
  );
}
