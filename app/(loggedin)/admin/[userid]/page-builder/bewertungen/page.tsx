"use client";

import { ReviewCarouselContent } from "@/components/reviews/ReviewCarousel";
import { Button } from "@/components/ui/button";
import { auth } from "@/config/firebase";
import { reviewSettingsSchema, type Review } from "@/lib/reviewSettings";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import { ArrowDown, ArrowUp, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const inputClass = "w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm";

export default function ReviewsPage() {
  const { companyData } = useCompanyData();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/page-builder/reviews", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Bewertungen konnten nicht geladen werden.");
        setReviews(reviewSettingsSchema.parse(await response.json()).reviews);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Bewertungen laden fehlgeschlagen:", error);
        setError("Bewertungen konnten nicht geladen werden. Bitte erneut versuchen.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);

  function update(next: Review[]) {
    setReviews(next);
    setSaved(false);
    setError("");
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...reviews];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  }

  async function save() {
    setSaved(false);
    const parsed = reviewSettingsSchema.safeParse({ reviews });
    if (!parsed.success) {
      setError("Bitte bei jeder Karte einen Namen, einen Bewertungstext und 1 bis 5 Sterne angeben (maximal 100 Karten).");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token || !companyData?.id) throw new Error("Bitte erneut anmelden.");
      const response = await fetch("/api/page-builder/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ownerId: companyData.id, ...parsed.data }),
      });
      if (!response.ok) throw new Error("Bewertungen konnten nicht gespeichert werden. Bitte Berechtigung und Verbindung prüfen.");
      setReviews(reviewSettingsSchema.parse(await response.json()).reviews);
      setSaved(true);
    } catch (error) {
      console.error("Bewertungen speichern fehlgeschlagen:", error);
      setError(error instanceof Error ? error.message : "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p role='status' className='flex items-center gap-2 p-8'><LoaderCircle className='animate-spin' size={18} /> Bewertungen werden geladen ...</p>;
  }

  return (
    <main className='mx-auto w-full max-w-6xl space-y-6 pb-12'>
      <header>
        <p className='text-xs font-semibold uppercase tracking-wider text-blue-700'>Page-builder Elemente</p>
        <h1 className='mt-2 text-3xl font-bold text-slate-950'>Bewertungen</h1>
        <p className='mt-3 text-sm leading-6 text-slate-600'>
          Diese Karten erscheinen auf allen Seiten mit dem Element „Bewertungen“.
          Inhalt, Reihenfolge und Darstellung sind überall gleich. Änderungen werden
          nach dem Speichern beim nächsten Seitenaufruf sichtbar.
        </p>
      </header>

      {error && (
        <div role='alert' className='rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700'>
          {error}
          <button type='button' className='ml-3 underline' disabled={saving} onClick={() => setAttempt((value) => value + 1)}>Neu laden</button>
        </div>
      )}
      {saved && <p role='status' className='text-sm font-medium text-emerald-700'>Bewertungen gespeichert.</p>}

      <form onSubmit={(event) => { event.preventDefault(); void save(); }} className='space-y-4'>
        <fieldset disabled={saving || (Boolean(error) && !reviews.length)} className='space-y-4'>
          {!reviews.length && <p className='rounded bg-slate-50 p-4 text-sm text-slate-600'>Keine Bewertungskarten vorhanden. Das Element wird dann im Frontend ausgeblendet.</p>}
          {reviews.map((review, index) => (
            <section key={review.id} className='rounded-lg border border-slate-200 bg-white p-5 shadow-sm'>
              <div className='mb-4 flex items-center justify-between gap-3'>
                <h2 className='font-semibold'>Bewertung {index + 1}</h2>
                <div className='flex gap-2'>
                  <Button type='button' variant='outline' size='icon' aria-label={`Bewertung ${index + 1} nach oben`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={16} /></Button>
                  <Button type='button' variant='outline' size='icon' aria-label={`Bewertung ${index + 1} nach unten`} disabled={index === reviews.length - 1} onClick={() => move(index, 1)}><ArrowDown size={16} /></Button>
                  <Button type='button' variant='outline' size='icon' aria-label={`Bewertung ${index + 1} entfernen`} onClick={() => update(reviews.filter((item) => item.id !== review.id))}><Trash2 size={16} /></Button>
                </div>
              </div>
              <div className='grid gap-4 sm:grid-cols-[1fr_140px]'>
                <label className='space-y-1 text-sm font-medium'>Name
                  <input required maxLength={150} className={inputClass} value={review.name} onChange={(event) => update(reviews.map((item) => item.id === review.id ? { ...item, name: event.target.value } : item))} />
                </label>
                <label className='space-y-1 text-sm font-medium'>Sterne
                  <select className={inputClass} value={review.rating} onChange={(event) => update(reviews.map((item) => item.id === review.id ? { ...item, rating: Number(event.target.value) } : item))}>
                    {[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} {rating === 1 ? "Stern" : "Sterne"}</option>)}
                  </select>
                </label>
                <label className='space-y-1 text-sm font-medium sm:col-span-2'>Bewertungstext
                  <textarea required maxLength={5000} rows={4} className={inputClass} value={review.review} onChange={(event) => update(reviews.map((item) => item.id === review.id ? { ...item, review: event.target.value } : item))} />
                </label>
              </div>
            </section>
          ))}
          <div className='flex flex-wrap gap-3'>
            <Button type='button' variant='outline' disabled={reviews.length >= 100} onClick={() => update([...reviews, { id: crypto.randomUUID(), name: "", review: "", rating: 5 }])}><Plus size={16} /> Bewertung hinzufügen</Button>
            <Button type='submit' disabled={!companyData?.id}>{saving ? <LoaderCircle className='animate-spin' size={16} /> : <Save size={16} />} Speichern</Button>
          </div>
        </fieldset>
      </form>

      <section className='overflow-hidden rounded-lg border border-slate-200'>
        <h2 className='bg-white p-4 font-semibold'>Live-Vorschau (noch nicht gespeicherte Änderungen)</h2>
        <ReviewCarouselContent reviews={reviews} />
      </section>
    </main>
  );
}
