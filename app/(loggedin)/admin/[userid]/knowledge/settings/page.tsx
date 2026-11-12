"use client";

import { Button } from "@/components/ui/button";
import { auth, storage } from "@/config/firebase";
import {
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_CATEGORY_LABELS,
  KNOWLEDGE_LIMITS,
  knowledgeCreatorSchema,
  knowledgeSourceSchema,
  type KnowledgeCategory,
  type KnowledgeCreator,
  type KnowledgeSource,
  type KnowledgeSourceType,
} from "@/lib/knowledgeSettings";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import {
  BookOpen,
  CheckCircle2,
  FileAudio,
  FileText,
  Globe2,
  LoaderCircle,
  Plus,
  Upload,
  UserRoundPlus,
  XCircle,
} from "lucide-react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";

const creatorsResponseSchema = z.object({
  creators: z.array(knowledgeCreatorSchema),
});
const sourcesResponseSchema = z.object({
  sources: z.array(knowledgeSourceSchema),
});

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function KnowledgeSettingsPage() {
  const { companyData } = useCompanyData();
  const [creators, setCreators] = useState<KnowledgeCreator[]>([]);
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [creatorName, setCreatorName] = useState("");
  const [creatorId, setCreatorId] = useState("");
  const [category, setCategory] = useState<KnowledgeCategory>("marketing");
  const [type, setType] = useState<KnowledgeSourceType>("website");
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingCreator, setAddingCreator] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const authorizedFetch = useCallback(
    async (url: string, init?: RequestInit) => {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Bitte erneut anmelden.");
      return fetch(url, {
        ...init,
        headers: {
          ...init?.headers,
          Authorization: `Bearer ${token}`,
        },
      });
    },
    [],
  );

  const loadData = useCallback(async () => {
    if (!companyData?.id) return;
    setLoading(true);
    setError("");
    try {
      const ownerId = encodeURIComponent(companyData.id);
      const [creatorResponse, sourceResponse] = await Promise.all([
        authorizedFetch(`/api/admin/knowledge/creators?ownerId=${ownerId}`, {
          cache: "no-store",
        }),
        authorizedFetch(`/api/admin/knowledge/sources?ownerId=${ownerId}`, {
          cache: "no-store",
        }),
      ]);
      if (!creatorResponse.ok || !sourceResponse.ok) {
        throw new Error("Wissensdaten konnten nicht geladen werden.");
      }
      const creatorResult = creatorsResponseSchema.parse(
        await creatorResponse.json(),
      );
      const sourceResult = sourcesResponseSchema.parse(
        await sourceResponse.json(),
      );
      setCreators(creatorResult.creators);
      setSources(sourceResult.sources);
      setCreatorId((current) => current || creatorResult.creators[0]?.id || "");
    } catch (caughtError) {
      console.error("Wissensdaten laden fehlgeschlagen:", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Wissensdaten konnten nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, companyData?.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function addCreator(event: React.FormEvent) {
    event.preventDefault();
    if (!companyData?.id || !creatorName.trim()) return;
    setAddingCreator(true);
    setError("");
    setSuccess("");
    try {
      const response = await authorizedFetch(
        "/api/admin/knowledge/creators",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerId: companyData.id,
            name: creatorName.trim(),
          }),
        },
      );
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(readError(result, "Ersteller konnte nicht angelegt werden."));
      }
      const creator = knowledgeCreatorSchema.parse(result);
      setCreators((current) =>
        [...current, creator].sort((first, second) =>
          first.name.localeCompare(second.name, "de"),
        ),
      );
      setCreatorId(creator.id);
      setCreatorName("");
      setSuccess(`Ersteller „${creator.name}“ wurde hinzugefügt.`);
    } catch (caughtError) {
      console.error("Ersteller anlegen fehlgeschlagen:", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Ersteller konnte nicht angelegt werden.",
      );
    } finally {
      setAddingCreator(false);
    }
  }

  async function uploadPdf(ownerId: string): Promise<string> {
    if (!pdfFile) throw new Error("Bitte eine PDF-Datei auswählen.");
    if (pdfFile.type !== "application/pdf") {
      throw new Error("Es werden ausschließlich PDF-Dateien unterstützt.");
    }
    if (pdfFile.size > KNOWLEDGE_LIMITS.pdfBytes) {
      throw new Error("Die PDF darf maximal 100 MB groß sein.");
    }
    const safeName = pdfFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageRef = ref(
      storage,
      `knowledge/${ownerId}/${crypto.randomUUID()}-${safeName}`,
    );
    await uploadBytes(storageRef, pdfFile, { contentType: "application/pdf" });
    return getDownloadURL(storageRef);
  }

  async function addSource(event: React.FormEvent) {
    event.preventDefault();
    if (!companyData?.id) return;
    if (!creatorId) {
      setError("Bitte zuerst einen Ersteller hinzufügen und auswählen.");
      return;
    }
    setProcessing(true);
    setError("");
    setSuccess("");
    try {
      const pdfUrl =
        type === "pdf" ? await uploadPdf(companyData.id) : undefined;
      const sourceUrls =
        type === "spotify"
          ? parseSpotifyLinks(sourceUrl)
          : [type === "pdf" ? "" : sourceUrl.trim()];
      if (type === "spotify" && sourceUrls.length === 0) {
        throw new Error("Bitte mindestens einen Spotify-Episodenlink eingeben.");
      }

      const completed: KnowledgeSource[] = [];
      const failures: Array<{ url: string; error: string }> = [];
      for (const [index, currentUrl] of sourceUrls.entries()) {
        setProcessingProgress({
          current: index + 1,
          total: sourceUrls.length,
        });
        try {
          const response = await authorizedFetch(
            "/api/admin/knowledge/sources",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ownerId: companyData.id,
                creatorId,
                category,
                type,
                title:
                  title.trim() ||
                  pdfFile?.name ||
                  (type === "spotify"
                    ? "Spotify-Episode"
                    : "Wissensquelle"),
                sourceUrl: type === "pdf" ? undefined : currentUrl,
                contentUrl: type === "pdf" ? pdfUrl : undefined,
                fileName: type === "pdf" ? pdfFile?.name : undefined,
              }),
            },
          );
          const result: unknown = await response.json().catch(() => null);
          if (!response.ok) {
            throw new Error(
              readError(result, "Quelle konnte nicht verarbeitet werden."),
            );
          }
          completed.push(knowledgeSourceSchema.parse(result));
        } catch (sourceError) {
          if (type !== "spotify") throw sourceError;
          failures.push({
            url: currentUrl,
            error:
              sourceError instanceof Error
                ? sourceError.message
                : "Quelle konnte nicht verarbeitet werden.",
          });
        }
      }

      await loadData();
      if (completed.length > 0) {
        const vectorCount = completed.reduce(
          (sum, source) => sum + source.chunkCount,
          0,
        );
        setSuccess(
          type === "spotify"
            ? `${completed.length} von ${sourceUrls.length} Spotify-Episoden wurden mit insgesamt ${vectorCount} Vektoren in Pinecone gespeichert.`
            : `„${completed[0].title}“ wurde in ${vectorCount} Abschnitte aufgeteilt und in Pinecone gespeichert.`,
        );
      }
      if (failures.length > 0) {
        setError(
          `${failures.length} Spotify-Episode${failures.length === 1 ? "" : "n"} konnte${failures.length === 1 ? "" : "n"} nicht verarbeitet werden: ${failures
            .slice(0, 3)
            .map((failure) => failure.error)
            .join(" | ")}`,
        );
        setSourceUrl(failures.map((failure) => failure.url).join("\n"));
      } else {
        setTitle("");
        setSourceUrl("");
        setPdfFile(null);
      }
    } catch (caughtError) {
      console.error("Wissensquelle verarbeiten fehlgeschlagen:", caughtError);
      await loadData();
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Quelle konnte nicht verarbeitet werden.",
      );
    } finally {
      setProcessing(false);
      setProcessingProgress(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 pb-12">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
          Wissen
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Wissens-Einstellungen
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Ordnen Sie Websites, PDF-Dokumente und Podcast-Episoden einem Ersteller
          und Fachbereich zu. Die Inhalte werden sinnvoll aufgeteilt, mit Gemini
          vektorisiert und im konfigurierten Pinecone-Index gespeichert.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          {success}
        </p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-blue-50 p-2 text-blue-700">
            <UserRoundPlus size={22} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Ersteller verwalten
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Zum Beispiel Alex Hormozi, ein Autor oder eine Organisation.
            </p>
          </div>
        </div>
        <form
          onSubmit={(event) => void addCreator(event)}
          className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="flex-1 text-sm font-medium text-slate-800">
            Name des Erstellers
            <input
              required
              maxLength={150}
              value={creatorName}
              onChange={(event) => setCreatorName(event.target.value)}
              placeholder="z. B. Alex Hormozi"
              className={`${inputClass} mt-1.5`}
            />
          </label>
          <Button
            type="submit"
            disabled={addingCreator}
            className="sm:mt-7">
            {addingCreator ? (
              <LoaderCircle className="animate-spin" size={16} />
            ) : (
              <Plus size={16} />
            )}
            Hinzufügen
          </Button>
        </form>
        {creators.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {creators.map((creator) => (
              <span
                key={creator.id}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                {creator.name}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-orange-50 p-2 text-primary">
            <BookOpen size={22} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Daten vektorisieren
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Beliebig viele Quellen; pro Quelle gelten 500 PDF-Seiten, 100 MB
              PDF beziehungsweise 4 Stunden und 200 MB Audio.
            </p>
          </div>
        </div>

        <form
          onSubmit={(event) => void addSource(event)}
          className="mt-6 grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-800">
              Ersteller
              <select
                required
                value={creatorId}
                onChange={(event) => setCreatorId(event.target.value)}
                className={`${inputClass} mt-1.5`}>
                <option value="">Bitte auswählen</option>
                {creators.map((creator) => (
                  <option key={creator.id} value={creator.id}>
                    {creator.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-800">
              Bereich
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as KnowledgeCategory)
                }
                className={`${inputClass} mt-1.5`}>
                {KNOWLEDGE_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {KNOWLEDGE_CATEGORY_LABELS[item]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-slate-800">
              Quelltyp
            </legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {[
                { value: "website", label: "Website", icon: Globe2 },
                { value: "pdf", label: "PDF", icon: FileText },
                { value: "spotify", label: "Spotify / Podcast", icon: FileAudio },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value as KnowledgeSourceType)}
                  className={`flex items-center gap-3 rounded-lg border-2 p-4 text-left transition ${
                    type === value
                      ? "border-blue-600 bg-blue-50 text-blue-950"
                      : "border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}>
                  <Icon size={20} />
                  <span className="font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <label className="text-sm font-medium text-slate-800">
            Titel
            <input
              required={type === "website"}
              maxLength={300}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={
                type === "pdf"
                  ? "Optional – sonst wird der Dateiname verwendet"
                  : type === "spotify"
                    ? "Optional – wird automatisch von Spotify übernommen"
                  : "Titel der Wissensquelle"
              }
              className={`${inputClass} mt-1.5`}
            />
          </label>

          {type === "website" && (
            <label className="text-sm font-medium text-slate-800">
              Website-URL
              <input
                required
                type="url"
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="https://example.com/artikel"
                className={`${inputClass} mt-1.5`}
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">
                Es wird ausschließlich diese einzelne Seite verarbeitet.
              </span>
            </label>
          )}

          {type === "pdf" && (
            <label className="text-sm font-medium text-slate-800">
              PDF-Datei
              <input
                required
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)}
                className={`${inputClass} mt-1.5 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:font-medium`}
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">
                Jede Seite wird separat extrahiert und anschließend in
                überlappende Textabschnitte zerlegt.
              </span>
            </label>
          )}

          {type === "spotify" && (
            <label className="text-sm font-medium text-slate-800">
              Spotify-Episodenlinks
              <textarea
                required
                rows={6}
                maxLength={50_000}
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder={"https://open.spotify.com/episode/...\nhttps://open.spotify.com/episode/..."}
                className={`${inputClass} mt-1.5`}
              />
              <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">
                Einen Link pro Zeile eingeben. Die Episoden werden nacheinander
                verarbeitet. Der Episodentitel wird über Spotify erkannt und die
                öffentliche Original-Audioquelle automatisch gesucht.
              </span>
            </label>
          )}

          <Button
            type="submit"
            disabled={processing || loading || !creators.length}
            className="w-full sm:w-fit">
            {processing ? (
              <LoaderCircle className="animate-spin" size={16} />
            ) : (
              <Upload size={16} />
            )}
            {processing
              ? processingProgress && processingProgress.total > 1
                ? `Episode ${processingProgress.current} von ${processingProgress.total} wird verarbeitet ...`
                : "Quelle wird verarbeitet ..."
              : "Extrahieren und vektorisieren"}
          </Button>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-950">
            Verarbeitete Quellen
          </h2>
          <span className="text-sm text-slate-500">{sources.length} Quellen</span>
        </div>
        {loading ? (
          <p role="status" className="flex items-center gap-2 py-8 text-slate-600">
            <LoaderCircle className="animate-spin" size={18} />
            Wissensquellen werden geladen ...
          </p>
        ) : sources.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
            Noch keine Wissensquelle vorhanden.
          </p>
        ) : (
          <div className="grid gap-3">
            {sources.map((source) => (
              <article
                key={source.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-950">
                        {source.title}
                      </h3>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {KNOWLEDGE_CATEGORY_LABELS[source.category]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {source.creatorName} · {sourceTypeLabel(source.type)}
                      {source.pageCount ? ` · ${source.pageCount} Seiten` : ""}
                      {source.status === "ready"
                        ? ` · ${source.chunkCount} Vektoren`
                        : ""}
                    </p>
                    {source.error && (
                      <p className="mt-2 text-sm text-red-700">{source.error}</p>
                    )}
                  </div>
                  <SourceStatus status={source.status} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function readError(value: unknown, fallback: string) {
  return value && typeof value === "object" && "error" in value
    ? String(value.error)
    : fallback;
}

function parseSpotifyLinks(value: string) {
  return [
    ...new Set(
      value
        .split(/[\s,;]+/)
        .map((url) => url.trim())
        .filter(Boolean),
    ),
  ];
}

function sourceTypeLabel(type: KnowledgeSourceType) {
  if (type === "website") return "Website";
  if (type === "pdf") return "PDF";
  return "Spotify / Podcast";
}

function SourceStatus({ status }: { status: KnowledgeSource["status"] }) {
  if (status === "ready") {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
        <CheckCircle2 size={16} /> Bereit
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-red-700">
        <XCircle size={16} /> Fehler
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-700">
      <LoaderCircle className="animate-spin" size={16} /> Verarbeitung
    </span>
  );
}
