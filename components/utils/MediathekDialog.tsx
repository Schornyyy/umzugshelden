"use client";
import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "../ui/dialog";
import { useMediathek } from "@/customHooks/useMediathek";
import { Button } from "../ui/button";
import Image from "next/image";

interface MediathekDialogProps {
  btnName: string;
  onSelect?: (url: string | string[]) => void; // multi-select returns array
  showAltInput?: boolean;
  multiSelect?: boolean;
  accept?: string; // file input accept override
}

const MediathekDialog: React.FC<MediathekDialogProps> = ({
  btnName,
  onSelect,
  showAltInput = false,
  multiSelect = false,
  accept = "image/*",
}) => {
  const {
    items,
    loading,
    uploading,
    error,
    upload,
    remove,
    refresh,
    loadMore,
    hasMore,
    updateAlt,
  } = useMediathek();
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<
    "all" | "image" | "video" | "pdf" | "other"
  >("all");
  const [altDrafts, setAltDrafts] = useState<Record<string, string>>({});
  const dropRef = useRef<HTMLDivElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        if (!multiSelect) next.clear();
        next.add(id);
      }
      return next;
    });
  };

  const singleSelectedItem =
    !multiSelect && selectedIds.size === 1
      ? items.find((i) => i.id === Array.from(selectedIds)[0]) || null
      : null;

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => {
      const ct = i.contentType || "";
      if (filter === "image") return ct.startsWith("image/");
      if (filter === "video") return ct.startsWith("video/");
      if (filter === "pdf") return ct === "application/pdf";
      return (
        !ct.startsWith("image/") &&
        !ct.startsWith("video/") &&
        ct !== "application/pdf"
      );
    });
  }, [items, filter]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      for (let i = 0; i < files.length; i++) {
        await upload(files[i]);
      }
    },
    [upload]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleFiles(e.target.files);
  };

  const handleSelect = () => {
    if (!onSelect) return;
    if (multiSelect) {
      const urls = items.filter((i) => selectedIds.has(i.id)).map((i) => i.url);
      onSelect(urls);
    } else if (singleSelectedItem) {
      onSelect(singleSelectedItem.url);
    }
    setOpen(false);
  };

  const saveAlt = async (id: string) => {
    const draft = altDrafts[id];
    if (draft !== undefined) {
      await updateAlt(id, draft);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActive) setDragActive(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragActive) setDragActive(false);
  };
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    await handleFiles(e.dataTransfer.files);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' type='button'>
          {btnName}
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-5xl'>
        <DialogHeader>
          <DialogTitle>Mediathek</DialogTitle>
          <DialogDescription>
            Wähle Dateien aus oder lade neue hoch. Filtere, bearbeite Alt-Texte
            und wähle mehrere Medien bei Bedarf.
          </DialogDescription>
        </DialogHeader>
        <div className='flex flex-col gap-4'>
          <div className='flex flex-wrap gap-2 items-center text-xs'>
            <div className='flex gap-1'>
              {(["all", "image", "video", "pdf", "other"] as const).map((f) => (
                <Button
                  key={f}
                  size='sm'
                  type='button'
                  variant={filter === f ? "default" : "outline"}
                  onClick={() => setFilter(f)}>
                  {f}
                </Button>
              ))}
            </div>
            <div className='ml-auto flex gap-2'>
              <Button
                size='sm'
                variant='secondary'
                type='button'
                disabled={loading}
                onClick={() => refresh(true)}>
                Neu laden
              </Button>
              {hasMore && (
                <Button
                  size='sm'
                  variant='outline'
                  type='button'
                  disabled={loading}
                  onClick={loadMore}>
                  Mehr laden
                </Button>
              )}
            </div>
          </div>
          <div className='flex gap-4'>
            <div className='flex-1 min-h-[300px]'>
              <div
                ref={dropRef}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`mb-3 border rounded p-4 text-center text-xs transition ${
                  dragActive
                    ? "bg-green-50 border-green-400"
                    : "bg-slate-50 hover:bg-slate-100"
                }`}>
                {dragActive
                  ? "Loslassen zum Hochladen"
                  : "Dateien hierher ziehen oder unten auswählen"}
              </div>
              {loading && <p className='text-sm text-slate-500'>Lade…</p>}
              {!loading && (
                <div className='grid grid-cols-3 md:grid-cols-5 gap-3 max-h-[420px] overflow-auto pr-1'>
                  {filteredItems.map((img) => {
                    const selected = selectedIds.has(img.id);
                    return (
                      <div
                        key={img.id}
                        className={`relative group border rounded-lg p-1 cursor-pointer ${
                          selected
                            ? "ring-2 ring-green-600"
                            : "hover:ring-2 hover:ring-slate-300"
                        }`}
                        onClick={() => toggleSelect(img.id)}>
                        <div className='relative w-full aspect-square overflow-hidden rounded'>
                          <Image
                            src={img.thumbUrl || img.url}
                            alt={img.alt || img.name}
                            fill
                            className='object-cover'
                          />
                          {multiSelect && (
                            <div className='absolute top-1 left-1 bg-white/80 rounded px-1 text-[10px] font-semibold'>
                              <input
                                type='checkbox'
                                checked={selected}
                                readOnly
                              />
                            </div>
                          )}
                        </div>
                        <div
                          className='mt-1 text-[10px] truncate'
                          title={img.name}>
                          {img.name}
                        </div>
                        <div className='opacity-0 group-hover:opacity-100 transition absolute top-1 right-1 flex gap-1'>
                          <Button
                            size='icon'
                            variant='destructive'
                            className='h-6 w-6'
                            type='button'
                            onClick={(e) => {
                              e.stopPropagation();
                              remove(img.id);
                            }}>
                            ✕
                          </Button>
                        </div>
                        {showAltInput &&
                          (selected ||
                            (!multiSelect && selectedIds.has(img.id))) && (
                            <div className='mt-1'>
                              <input
                                type='text'
                                placeholder='Alt text'
                                className='w-full border rounded px-1 py-0.5 text-[10px]'
                                defaultValue={img.alt || ""}
                                onChange={(e) =>
                                  setAltDrafts((d) => ({
                                    ...d,
                                    [img.id]: e.target.value,
                                  }))
                                }
                                onBlur={() => saveAlt(img.id)}
                              />
                            </div>
                          )}
                      </div>
                    );
                  })}
                  {!filteredItems.length && (
                    <div className='col-span-full text-sm text-slate-500'>
                      Keine Dateien vorhanden.
                    </div>
                  )}
                </div>
              )}
              {error && <p className='text-xs text-red-600 mt-2'>{error}</p>}
            </div>
            <div className='w-64 space-y-4'>
              <div>
                <label className='block text-xs font-medium mb-1'>
                  Datei hochladen
                </label>
                <input
                  type='file'
                  accept={accept}
                  multiple
                  onChange={handleFileChange}
                  disabled={uploading}
                  className='text-xs'
                />
              </div>
              <div className='border rounded p-2 text-xs space-y-2'>
                <div className='flex justify-between'>
                  <span>Ausgewählt</span>
                  <span className='font-medium'>{selectedIds.size}</span>
                </div>
                {multiSelect && selectedIds.size > 0 && (
                  <ul className='max-h-40 overflow-auto list-disc ml-4 pr-1'>
                    {Array.from(selectedIds).map((id) => {
                      const it = items.find((i) => i.id === id);
                      if (!it) return null;
                      return (
                        <li key={id} className='truncate'>
                          {it.name}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {!multiSelect && singleSelectedItem && (
                  <div>
                    <div className='relative w-full aspect-square mb-2 overflow-hidden rounded'>
                      <Image
                        src={
                          singleSelectedItem.thumbUrl || singleSelectedItem.url
                        }
                        alt={singleSelectedItem.alt || singleSelectedItem.name}
                        fill
                        className='object-cover'
                      />
                    </div>
                    <p className='text-[11px] break-all mb-1'>
                      {singleSelectedItem.name}
                    </p>
                  </div>
                )}
                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    type='button'
                    onClick={() => setSelectedIds(new Set())}
                    disabled={!selectedIds.size}>
                    Reset
                  </Button>
                  <Button
                    size='sm'
                    className='flex-1'
                    type='button'
                    disabled={!selectedIds.size}
                    onClick={handleSelect}>
                    Auswählen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediathekDialog;
