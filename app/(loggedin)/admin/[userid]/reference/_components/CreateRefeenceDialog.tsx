"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MediathekDialog from "@/components/utils/MediathekDialog";
import { createReference } from "@/actions/referenceActions";

type FormState = {
  comanyName: string;
  website: string;
  companyBranch: string;
  logoUrl: string;
  thumbnailUrl: string;
  description: string;
  public: boolean;
};

const CreateRefeenceDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    comanyName: "",
    website: "",
    companyBranch: "",
    logoUrl: "",
    thumbnailUrl: "",
    description: "",
    public: false,
  });

  function onSelectLogo(url: string | string[] | undefined) {
    if (!url) return;
    const u = Array.isArray(url) ? url[0] : url;
    setForm((s) => ({ ...s, logoUrl: u }));
  }

  function onSelectThumb(url: string | string[] | undefined) {
    if (!url) return;
    const u = Array.isArray(url) ? url[0] : url;
    setForm((s) => ({ ...s, thumbnailUrl: u }));
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.comanyName) return setError("Firma ist erforderlich");
    setLoading(true);
    try {
      const res = await createReference({ ...form, public: false });
      setSuccess(`Referenz erstellt (id: ${res})`);
      // reset form
      setForm({
        comanyName: "",
        website: "",
        companyBranch: "",
        logoUrl: "",
        thumbnailUrl: "",
        description: "",
        public: false,
      });
      // close after short delay
      setTimeout(() => setOpen(false), 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type='button' className='w-fit'>
          Neue Referenz erstellen
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Neue Referenz anlegen</DialogTitle>
          <DialogDescription>
            Fülle die Felder aus und wähle Logo / Thumbnail aus der Mediathek.
            Die Referenz wird zunächst nicht veröffentlicht.
          </DialogDescription>
        </DialogHeader>

        <form className='flex flex-col gap-3 mt-4' onSubmit={handleSubmit}>
          <label className='text-xs'>Firmenname</label>
          <Input
            value={form.comanyName}
            onChange={(e) =>
              setForm({ ...form, comanyName: e.currentTarget.value })
            }
            placeholder='Firmenname'
          />

          <label className='text-xs'>Website (URL)</label>
          <Input
            value={form.website}
            onChange={(e) =>
              setForm({ ...form, website: e.currentTarget.value })
            }
            placeholder='https://...'
          />

          <label className='text-xs'>Branche</label>
          <Input
            value={form.companyBranch}
            onChange={(e) =>
              setForm({ ...form, companyBranch: e.currentTarget.value })
            }
            placeholder='z.B. Garten- und Landschaftsbau'
          />

          <label className='text-xs'>Logo</label>
          <div className='flex items-center gap-2'>
            <MediathekDialog
              btnName={form.logoUrl ? "Logo ändern" : "Logo wählen"}
              onSelect={onSelectLogo}
            />
            {form.logoUrl && (
              <a
                href={form.logoUrl}
                target='_blank'
                rel='noreferrer'
                className='text-xs underline'>
                Vorschau
              </a>
            )}
          </div>

          <label className='text-xs'>Thumbnail</label>
          <div className='flex items-center gap-2'>
            <MediathekDialog
              btnName={
                form.thumbnailUrl ? "Thumbnail ändern" : "Thumbnail wählen"
              }
              onSelect={onSelectThumb}
            />
            {form.thumbnailUrl && (
              <a
                href={form.thumbnailUrl}
                target='_blank'
                rel='noreferrer'
                className='text-xs underline'>
                Vorschau
              </a>
            )}
          </div>

          <label className='text-xs'>Beschreibung</label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.currentTarget.value })
            }
            className='border rounded p-2 text-sm min-h-[100px]'
            placeholder='Kurzbeschreibung'
          />

          {error && <div className='text-sm text-red-600'>{error}</div>}
          {success && <div className='text-sm text-green-600'>{success}</div>}

          <div className='flex gap-2 mt-2'>
            <Button
              type='submit'
              disabled={loading}
              className='bg-primary text-white'>
              {loading ? "Speichere..." : "Speichern"}
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRefeenceDialog;
