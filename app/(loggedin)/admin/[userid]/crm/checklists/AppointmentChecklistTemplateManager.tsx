"use client";

import { Button } from "@/components/ui/button";
import {
  CRM_APPOINTMENT_PHASE_LABELS,
  CRM_APPOINTMENT_PHASES,
} from "@/lib/crmAppointmentWorkflow";
import {
  saveAppointmentTemplates,
  subscribeAppointmentTemplates,
} from "@/lib/crmAppointmentStore";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import type {
  CrmAppointmentChecklistTemplate,
  CrmAppointmentChecklistTemplateItem,
  CrmAppointmentPhase,
} from "@/types/Crm";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  ListChecks,
  LoaderCircle,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

function createTemplate(): CrmAppointmentChecklistTemplate {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    items: [],
    createdAt: now,
    updatedAt: now,
  };
}

export default function AppointmentChecklistTemplateManager() {
  const { companyData } = useCompanyData();
  const [templates, setTemplates] = useState<
    CrmAppointmentChecklistTemplate[]
  >([]);
  const [draft, setDraft] =
    useState<CrmAppointmentChecklistTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!companyData?.id) return;
    setIsLoading(true);
    return subscribeAppointmentTemplates(
      companyData.id,
      (nextTemplates) => {
        setTemplates(nextTemplates);
        setIsLoading(false);
      },
      (caughtError) => {
        console.error("Checklisten-Vorlagen konnten nicht geladen werden.", caughtError);
        setError("Die Checklisten-Vorlagen konnten nicht geladen werden.");
        setIsLoading(false);
      },
    );
  }, [companyData?.id]);

  function editTemplate(template: CrmAppointmentChecklistTemplate) {
    setDraft({
      ...template,
      items: template.items.map((item) => ({ ...item })),
    });
    setError("");
    setFeedback("");
  }

  function duplicateTemplate(template: CrmAppointmentChecklistTemplate) {
    const now = Date.now();
    setDraft({
      ...template,
      id: crypto.randomUUID(),
      name: `${template.name} (Kopie)`,
      items: template.items.map((item) => ({
        ...item,
        id: crypto.randomUUID(),
      })),
      createdAt: now,
      updatedAt: now,
    });
    setError("");
    setFeedback("");
  }

  function addItem(phase: CrmAppointmentPhase) {
    if (!draft) return;
    setDraft({
      ...draft,
      items: [
        ...draft.items,
        {
          id: crypto.randomUUID(),
          phase,
          title: "",
          details: "",
          required: false,
        },
      ],
    });
  }

  function updateItem(
    itemId: string,
    updates: Partial<CrmAppointmentChecklistTemplateItem>,
  ) {
    if (!draft) return;
    setDraft({
      ...draft,
      items: draft.items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item,
      ),
    });
  }

  function removeItem(itemId: string) {
    if (!draft) return;
    setDraft({
      ...draft,
      items: draft.items.filter((item) => item.id !== itemId),
    });
  }

  function moveItem(itemId: string, direction: -1 | 1) {
    if (!draft) return;
    const item = draft.items.find((candidate) => candidate.id === itemId);
    if (!item) return;
    const phaseItems = draft.items.filter(
      (candidate) => candidate.phase === item.phase,
    );
    const index = phaseItems.findIndex((candidate) => candidate.id === itemId);
    const target = phaseItems[index + direction];
    if (!target) return;
    const nextItems = [...draft.items];
    const sourceIndex = nextItems.findIndex(
      (candidate) => candidate.id === itemId,
    );
    const targetIndex = nextItems.findIndex(
      (candidate) => candidate.id === target.id,
    );
    [nextItems[sourceIndex], nextItems[targetIndex]] = [
      nextItems[targetIndex],
      nextItems[sourceIndex],
    ];
    setDraft({ ...draft, items: nextItems });
  }

  async function persist(nextTemplates: CrmAppointmentChecklistTemplate[]) {
    if (!companyData?.id) return false;
    setIsSaving(true);
    setError("");
    setFeedback("");
    try {
      await saveAppointmentTemplates(companyData.id, nextTemplates);
      setTemplates(nextTemplates);
      return true;
    } catch (caughtError) {
      console.error("Checklisten-Vorlagen konnten nicht gespeichert werden.", caughtError);
      setError("Die Checklisten-Vorlagen konnten nicht gespeichert werden.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function saveDraft() {
    if (!draft) return;
    const name = draft.name.trim();
    const items = draft.items
      .filter((item) => item.title.trim())
      .map((item) => ({
        ...item,
        title: item.title.trim(),
        details: item.details.trim(),
      }));
    if (!name) {
      setError("Bitte gib der Vorlage einen Namen.");
      return;
    }
    if (items.length === 0) {
      setError("Bitte füge mindestens einen Checklistenpunkt hinzu.");
      return;
    }
    const savedDraft = {
      ...draft,
      name,
      description: draft.description.trim(),
      items,
      updatedAt: Date.now(),
    };
    const nextTemplates = templates.some(
      (template) => template.id === savedDraft.id,
    )
      ? templates.map((template) =>
          template.id === savedDraft.id ? savedDraft : template,
        )
      : [...templates, savedDraft];
    if (await persist(nextTemplates)) {
      setDraft(null);
      setFeedback("Vorlage wurde gespeichert.");
    }
  }

  async function deleteTemplate(template: CrmAppointmentChecklistTemplate) {
    if (
      !window.confirm(
        `Vorlage „${template.name}“ löschen? Bereits kopierte Termin-Checklisten bleiben erhalten.`,
      )
    ) {
      return;
    }
    if (
      await persist(
        templates.filter((candidate) => candidate.id !== template.id),
      )
    ) {
      if (draft?.id === template.id) setDraft(null);
      setFeedback("Vorlage wurde gelöscht.");
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-72 items-center justify-center text-slate-500">
        <LoaderCircle className="mr-2 animate-spin" /> Vorlagen werden geladen ...
      </div>
    );
  }

  return (
    <main className="space-y-5 pb-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-700">
            CRM
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">
            Termin-Checklisten
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Erstelle wiederverwendbare Abläufe für alle Terminarten.
          </p>
        </div>
        <Button onClick={() => setDraft(createTemplate())}>
          <Plus /> Neue Vorlage
        </Button>
      </header>

      {feedback && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          {feedback}
        </p>
      )}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="h-fit rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="font-semibold text-slate-950">Vorlagen</h2>
          </div>
          {templates.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <ListChecks className="mx-auto text-slate-400" />
              <p className="mt-3 text-sm text-slate-500">
                Noch keine Vorlage vorhanden.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {templates.map((template) => (
                <div key={template.id} className="p-4">
                  <p className="font-medium text-slate-950">{template.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {template.items.length} Punkte
                  </p>
                  <div className="mt-3 flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editTemplate(template)}>
                      <Pencil /> Bearbeiten
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Duplizieren"
                      onClick={() => duplicateTemplate(template)}>
                      <Copy />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Löschen"
                      onClick={() => void deleteTemplate(template)}>
                      <Trash2 className="text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
          {!draft ? (
            <div className="flex min-h-72 items-center justify-center text-center text-sm text-slate-500">
              Wähle eine Vorlage oder erstelle eine neue.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                  Name *
                  <input
                    value={draft.name}
                    onChange={(event) =>
                      setDraft({ ...draft, name: event.target.value })
                    }
                    className="h-10 rounded-md border border-slate-200 px-3"
                    placeholder="z. B. Standard-Umzug"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                  Beschreibung
                  <textarea
                    value={draft.description}
                    onChange={(event) =>
                      setDraft({ ...draft, description: event.target.value })
                    }
                    rows={2}
                    className="rounded-md border border-slate-200 px-3 py-2"
                  />
                </label>
              </div>

              {CRM_APPOINTMENT_PHASES.map((phase) => {
                const phaseItems = draft.items.filter(
                  (item) => item.phase === phase,
                );
                return (
                  <div
                    key={phase}
                    className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-slate-950">
                        {CRM_APPOINTMENT_PHASE_LABELS[phase]}
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addItem(phase)}>
                        <Plus /> Punkt
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {phaseItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="rounded-md border border-slate-200 bg-white p-3">
                          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                            <div className="grid gap-2">
                              <input
                                value={item.title}
                                onChange={(event) =>
                                  updateItem(item.id, {
                                    title: event.target.value,
                                  })
                                }
                                className="h-9 rounded-md border border-slate-200 px-2 text-sm"
                                placeholder="Aufgabe"
                              />
                              <input
                                value={item.details}
                                onChange={(event) =>
                                  updateItem(item.id, {
                                    details: event.target.value,
                                  })
                                }
                                className="h-9 rounded-md border border-slate-200 px-2 text-sm"
                                placeholder="Hinweis (optional)"
                              />
                              <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={item.required}
                                  onChange={(event) =>
                                    updateItem(item.id, {
                                      required: event.target.checked,
                                    })
                                  }
                                />
                                Pflichtpunkt
                              </label>
                            </div>
                            <div className="flex sm:flex-col">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Nach oben"
                                disabled={index === 0}
                                onClick={() => moveItem(item.id, -1)}>
                                <ArrowUp />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Nach unten"
                                disabled={index === phaseItems.length - 1}
                                onClick={() => moveItem(item.id, 1)}>
                                <ArrowDown />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Löschen"
                                onClick={() => removeItem(item.id)}>
                                <Trash2 className="text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {phaseItems.length === 0 && (
                        <p className="py-3 text-center text-xs text-slate-500">
                          Noch keine Punkte.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <Button variant="outline" onClick={() => setDraft(null)}>
                  Abbrechen
                </Button>
                <Button
                  onClick={() => void saveDraft()}
                  disabled={isSaving}>
                  {isSaving ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <Save />
                  )}
                  Vorlage speichern
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
