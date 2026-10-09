"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CRM_ORDER_ROLE_LABELS,
  CRM_ORDER_PHASES,
  CRM_ORDER_SERVICE_LABELS,
  CRM_ORDER_TASK_KIND_LABELS,
  getCrmOrderQualityGates,
  isCrmOrderTaskBlocking,
  isCrmOrderTaskComplete,
} from "@/lib/crmOrderTasks";
import type {
  CrmOrder,
  CrmOrderTask,
  CrmOrderTaskKind,
  CrmOrderTaskPhase,
  CrmOrderTaskRole,
  CrmTaskTemplate,
} from "@/types/Crm";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ClipboardList,
  LayoutTemplate,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import StructuredOrderTask from "./StructuredOrderTask";

type OrderTasksPanelProps = {
  orders: CrmOrder[];
  templates: CrmTaskTemplate[];
  selectedOrderId: string | null;
  isSaving: boolean;
  isSavingTemplates: boolean;
  onSelectOrder: (orderId: string) => void;
  onReanalyzeOrder: (orderId: string) => Promise<boolean>;
  onToggleTask: (orderId: string, taskId: string) => void;
  onUpdateTask: (
    orderId: string,
    taskId: string,
    updates: Partial<CrmOrderTask>
  ) => void;
  onUploadEvidence: (
    orderId: string,
    taskId: string,
    file: File
  ) => Promise<void>;
  onAddTask: (orderId: string, phase: CrmOrderTaskPhase, title: string) => void;
  onRemoveTask: (orderId: string, taskId: string) => void;
  onApplyTemplate: (orderId: string, template: CrmTaskTemplate) => void;
  onSaveTemplates: (templates: CrmTaskTemplate[]) => Promise<boolean>;
};

function formatDate(value: string | number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Termin offen";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function OrderTasksPanel({
  orders,
  templates,
  selectedOrderId,
  isSaving,
  isSavingTemplates,
  onSelectOrder,
  onReanalyzeOrder,
  onToggleTask,
  onUpdateTask,
  onUploadEvidence,
  onAddTask,
  onRemoveTask,
  onApplyTemplate,
  onSaveTemplates,
}: OrderTasksPanelProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPhase, setNewTaskPhase] =
    useState<CrmOrderTaskPhase>("before");
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templateDraft, setTemplateDraft] = useState<CrmTaskTemplate | null>(null);
  const [templateTaskTitle, setTemplateTaskTitle] = useState("");
  const [templateTaskDetails, setTemplateTaskDetails] = useState("");
  const [templateTaskPhase, setTemplateTaskPhase] =
    useState<CrmOrderTaskPhase>("before");
  const [templateTaskKind, setTemplateTaskKind] =
    useState<CrmOrderTaskKind>("task");
  const [templateTaskRole, setTemplateTaskRole] =
    useState<CrmOrderTaskRole>("crewLead");
  const [templateTaskRequired, setTemplateTaskRequired] = useState(true);
  const [templateTaskRequiresEvidence, setTemplateTaskRequiresEvidence] =
    useState(false);
  const [templateTaskBlocksOnNegative, setTemplateTaskBlocksOnNegative] =
    useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const selectedOrder =
    orders.find((order) => order.id === selectedOrderId) ?? orders[0];

  useEffect(() => {
    if (selectedOrder && selectedOrder.id !== selectedOrderId) {
      onSelectOrder(selectedOrder.id);
    }
  }, [onSelectOrder, selectedOrder, selectedOrderId]);

  if (!selectedOrder) return null;

  const completedTasks = selectedOrder.tasks.filter(isCrmOrderTaskComplete).length;
  const blockers = selectedOrder.tasks.filter(isCrmOrderTaskBlocking);
  const qualityGates = getCrmOrderQualityGates(selectedOrder);
  const automation = selectedOrder.automation;
  const openAutomationRisks =
    automation?.risks.filter((risk) => {
      const linkedTask = selectedOrder.tasks.find(
        (orderTask) => orderTask.automationKey === risk.taskKey
      );
      return !linkedTask || !isCrmOrderTaskComplete(linkedTask);
    }) ?? [];
  const progress = selectedOrder.tasks.length
    ? Math.round((completedTasks / selectedOrder.tasks.length) * 100)
    : 0;

  function addTask() {
    const title = newTaskTitle.trim();
    if (!title) return;
    onAddTask(selectedOrder.id, newTaskPhase, title);
    setNewTaskTitle("");
  }

  function startNewTemplate() {
    const now = Date.now();
    setTemplateDraft({
      id: crypto.randomUUID(),
      name: "",
      description: "",
      tasks: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  function editTemplate(template: CrmTaskTemplate) {
    setTemplateDraft({
      ...template,
      tasks: template.tasks.map((templateTask) => ({ ...templateTask })),
    });
  }

  function addTemplateTask() {
    const title = templateTaskTitle.trim();
    if (!templateDraft || !title) return;
    setTemplateDraft({
      ...templateDraft,
      tasks: [
        ...templateDraft.tasks,
        {
          id: crypto.randomUUID(),
          phase: templateTaskPhase,
          title,
          details: templateTaskDetails.trim(),
          kind: templateTaskKind,
          role: templateTaskRole,
          required: templateTaskRequired,
          requiresEvidence:
            templateTaskKind === "evidence" || templateTaskRequiresEvidence,
          blocksOnNegative:
            templateTaskKind === "check" && templateTaskBlocksOnNegative,
        },
      ],
    });
    setTemplateTaskTitle("");
    setTemplateTaskDetails("");
    setTemplateTaskKind("task");
    setTemplateTaskRole("crewLead");
    setTemplateTaskRequired(true);
    setTemplateTaskRequiresEvidence(false);
    setTemplateTaskBlocksOnNegative(false);
  }

  async function saveTemplate() {
    if (!templateDraft?.name.trim() || templateDraft.tasks.length === 0) return;
    const nextTemplate = {
      ...templateDraft,
      name: templateDraft.name.trim(),
      description: templateDraft.description.trim(),
      updatedAt: Date.now(),
    };
    const nextTemplates = templates.some(
      (template) => template.id === nextTemplate.id
    )
      ? templates.map((template) =>
          template.id === nextTemplate.id ? nextTemplate : template
        )
      : [...templates, nextTemplate];
    if (await onSaveTemplates(nextTemplates)) {
      setTemplateDraft(null);
    }
  }

  async function deleteTemplate(template: CrmTaskTemplate) {
    if (
      !window.confirm(
        `Vorlage „${template.name}“ wirklich löschen? Bereits übernommene Aufgaben bleiben im Auftrag erhalten.`
      )
    ) {
      return;
    }

    if (
      await onSaveTemplates(
        templates.filter((candidate) => candidate.id !== template.id)
      )
    ) {
      setTemplateDraft(null);
    }
  }

  async function reanalyzeOrder() {
    setIsAnalyzing(true);
    setAnalysisError("");
    try {
      if (!(await onReanalyzeOrder(selectedOrder.id))) {
        setAnalysisError(
          "Die Einsatzanalyse konnte nicht aktualisiert werden. Prüfe, ob das Angebot noch vorhanden ist."
        );
      }
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className='space-y-5 p-4 sm:p-6'>
      <section className='grid gap-4 border border-slate-200 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_260px]'>
        <div>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.14em] text-blue-700'>
                Aktiver Auftrag
              </p>
              <h3 className='mt-1 text-xl font-bold text-slate-950'>
                {selectedOrder.offerTitle}
              </h3>
              <p className='mt-1 text-sm text-slate-500'>
                {selectedOrder.offerNumber} · angenommen am{" "}
                {formatDate(selectedOrder.acceptedAt)}
              </p>
            </div>
            <span
              className={`rounded px-2 py-1 text-xs font-semibold ${
                selectedOrder.status === "completed"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              {selectedOrder.status === "completed" ? "Abgeschlossen" : "In Arbeit"}
            </span>
          </div>
          <div className='mt-4 flex flex-wrap gap-2'>
            {selectedOrder.serviceTypes.map((serviceType) => (
              <span
                key={serviceType}
                className='rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700'
              >
                {CRM_ORDER_SERVICE_LABELS[serviceType] ?? serviceType}
              </span>
            ))}
            <span className='flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700'>
              <CalendarDays size={13} />
              {selectedOrder.serviceDate
                ? formatDate(selectedOrder.serviceDate)
                : "Termin offen"}
            </span>
          </div>
        </div>
        <div className='border-l-4 border-blue-600 bg-slate-50 p-4'>
          <div className='flex items-end justify-between gap-3'>
            <span className='text-sm font-medium text-slate-600'>Fortschritt</span>
            <span className='text-2xl font-bold text-slate-950'>{progress}%</span>
          </div>
          <div className='mt-3 h-2 overflow-hidden rounded-full bg-slate-200'>
            <div
              className='h-full rounded-full bg-blue-600 transition-[width]'
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className='mt-2 text-xs text-slate-500'>
            {completedTasks} von {selectedOrder.tasks.length} Aufgaben erledigt
          </p>
        </div>
      </section>

      <section>
        <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
          <div>
            <h4 className='flex items-center gap-2 text-sm font-semibold text-slate-950'>
              <ShieldCheck size={17} />
              Qualitäts-Gates
            </h4>
            <p className='mt-1 text-xs text-slate-500'>
              Der Auftrag wird nur abgeschlossen, wenn alle Pflichtprüfungen und
              Nachweise vollständig sind.
            </p>
          </div>
          {blockers.length > 0 && (
            <span className='inline-flex items-center gap-1.5 rounded bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700'>
              <AlertTriangle size={14} />
              {blockers.length} {blockers.length === 1 ? "Blocker" : "Blocker"}
            </span>
          )}
        </div>
        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
          {qualityGates.map((gate, index) => (
            <div
              key={gate.id}
              className={`border-l-4 bg-white p-3 shadow-sm ring-1 ring-slate-200 ${
                gate.complete ? "border-emerald-500" : "border-amber-500"
              }`}
            >
              <div className='flex items-center justify-between gap-3'>
                <span className='text-[10px] font-semibold uppercase tracking-wide text-slate-400'>
                  Gate {index + 1}
                </span>
                <span
                  className={`text-[10px] font-semibold ${
                    gate.complete ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {gate.complete ? "Erfüllt" : "Offen"}
                </span>
              </div>
              <p className='mt-1 text-sm font-semibold text-slate-950'>
                {gate.label}
              </p>
              <p className='mt-1 text-xs leading-5 text-slate-500'>
                {gate.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className='border border-slate-200 bg-white'>
        <header className='flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3'>
          <div>
            <h4 className='flex items-center gap-2 text-sm font-semibold text-slate-950'>
              <Sparkles size={17} className='text-blue-600' />
              Automatische Einsatzanalyse
            </h4>
            <p className='mt-1 text-xs text-slate-500'>
              Aus Dienstleistungen, Mengen, Zugängen und Besonderheiten des
              Angebots abgeleitet.
            </p>
          </div>
          <Button
            variant='outline'
            size='sm'
            disabled={isSaving || isAnalyzing}
            onClick={() => void reanalyzeOrder()}
          >
            {isAnalyzing ? (
              <LoaderCircle className='animate-spin' />
            ) : (
              <RefreshCw />
            )}
            Angebot neu analysieren
          </Button>
        </header>
        <div className='space-y-4 p-4'>
          {automation?.modules.length ? (
            <div>
              <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                Erkannte Module
              </p>
              <div className='mt-2 flex flex-wrap gap-2'>
                {automation.modules.map((module) => (
                  <span
                    key={module.id}
                    title={module.reason}
                    className='rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700'
                  >
                    {module.label}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className='text-sm text-slate-500'>
              Noch keine automatische Analyse vorhanden.
            </p>
          )}

          {automation && (
            <div>
              <div className='flex items-center justify-between gap-3'>
                <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                  Risiken und Klärungspunkte
                </p>
                <span
                  className={`text-xs font-semibold ${
                    openAutomationRisks.length
                      ? "text-amber-700"
                      : "text-emerald-700"
                  }`}
                >
                  {openAutomationRisks.length
                    ? `${openAutomationRisks.length} offen`
                    : "Alles geklärt"}
                </span>
              </div>
              {automation.risks.length === 0 ? (
                <p className='mt-2 rounded-md bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700'>
                  Das Angebot enthält keine automatisch erkannten
                  Sondersituationen.
                </p>
              ) : (
                <div className='mt-2 grid gap-2 lg:grid-cols-2'>
                  {automation.risks.map((risk) => {
                    const linkedTask = selectedOrder.tasks.find(
                      (orderTask) => orderTask.automationKey === risk.taskKey
                    );
                    const resolved =
                      Boolean(linkedTask) &&
                      isCrmOrderTaskComplete(linkedTask!);
                    const severityClass =
                      risk.severity === "high"
                        ? "border-red-200 bg-red-50 text-red-800"
                        : risk.severity === "medium"
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : "border-slate-200 bg-slate-50 text-slate-700";
                    return (
                      <div
                        key={risk.id}
                        className={`border px-3 py-2.5 ${
                          resolved
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : severityClass
                        }`}
                      >
                        <div className='flex items-start justify-between gap-3'>
                          <p className='text-xs font-semibold'>{risk.title}</p>
                          <span className='shrink-0 text-[10px] font-semibold uppercase'>
                            {resolved
                              ? "Geklärt"
                              : risk.severity === "high"
                                ? "Hoch"
                                : risk.severity === "medium"
                                  ? "Mittel"
                                  : "Hinweis"}
                          </span>
                        </div>
                        <p className='mt-1 text-xs leading-5 opacity-80'>
                          {risk.details}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className='mt-2 text-[11px] text-slate-400'>
                Analysiert am{" "}
                {formatDate(automation.generatedAt)}
              </p>
            </div>
          )}
          {analysisError && (
            <p className='text-xs font-medium text-red-600'>{analysisError}</p>
          )}
        </div>
      </section>

      {orders.length > 1 && (
        <label className='block max-w-md text-sm font-medium text-slate-700'>
          Auftrag auswählen
          <select
            value={selectedOrder.id}
            onChange={(event) => onSelectOrder(event.target.value)}
            className='mt-1.5 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500'
          >
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.offerTitle} ({order.offerNumber})
              </option>
            ))}
          </select>
        </label>
      )}

      <section className='border border-slate-200 bg-white p-4'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <h4 className='flex items-center gap-2 text-sm font-semibold text-slate-950'>
              <LayoutTemplate size={17} />
              Situationsvorlagen
            </h4>
            <p className='mt-1 text-sm text-slate-500'>
              Ergänze den Auftrag um wiederkehrende Prüfungen, etwa für eine
              Küchenmontage.
            </p>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setTemplateDraft(null);
              setIsTemplateDialogOpen(true);
            }}
          >
            <Pencil />
            Vorlagen verwalten
          </Button>
        </div>
        {templates.length === 0 ? (
          <p className='mt-4 rounded-md border border-dashed border-slate-300 px-4 py-5 text-center text-sm text-slate-500'>
            Noch keine Situationsvorlage vorhanden.
          </p>
        ) : (
          <div className='mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
            {templates.map((template) => {
              const isApplied = selectedOrder.tasks.some(
                (orderTask) => orderTask.templateId === template.id
              );
              return (
                <div
                  key={template.id}
                  className='flex flex-col justify-between border border-slate-200 p-3'
                >
                  <div>
                    <div className='flex items-start justify-between gap-3'>
                      <p className='font-medium text-slate-950'>{template.name}</p>
                      <span className='shrink-0 text-xs text-slate-400'>
                        {template.tasks.length} Aufgaben
                      </span>
                    </div>
                    {template.description && (
                      <p className='mt-1 text-xs leading-5 text-slate-500'>
                        {template.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant={isApplied ? "outline" : "default"}
                    size='sm'
                    className='mt-3'
                    disabled={isSaving}
                    onClick={() => onApplyTemplate(selectedOrder.id, template)}
                  >
                    <Plus />
                    {isApplied ? "Aufgaben aktualisieren" : "Zum Auftrag hinzufügen"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className='grid gap-4 xl:grid-cols-3'>
        {CRM_ORDER_PHASES.map((phase) => {
          const tasks = selectedOrder.tasks.filter(
            (orderTask) => orderTask.phase === phase.id
          );
          const phaseCompleted = tasks.filter(isCrmOrderTaskComplete).length;
          return (
            <section
              key={phase.id}
              className='min-w-0 border border-slate-200 bg-white'
            >
              <header className='flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3'>
                <h4 className='flex items-center gap-2 text-sm font-semibold text-slate-950'>
                  <ClipboardList size={16} />
                  {phase.label}
                </h4>
                <span className='text-xs text-slate-500'>
                  {phaseCompleted}/{tasks.length}
                </span>
              </header>
              <div className='divide-y divide-slate-100'>
                {tasks.map((orderTask) => (
                  <StructuredOrderTask
                    key={orderTask.id}
                    task={{
                      ...orderTask,
                      serviceType:
                        orderTask.templateName ??
                        CRM_ORDER_SERVICE_LABELS[orderTask.serviceType] ??
                        orderTask.serviceType,
                    }}
                    disabled={isSaving}
                    onToggle={() =>
                      onToggleTask(selectedOrder.id, orderTask.id)
                    }
                    onUpdate={(updates) =>
                      onUpdateTask(selectedOrder.id, orderTask.id, updates)
                    }
                    onUploadEvidence={(file) =>
                      onUploadEvidence(selectedOrder.id, orderTask.id, file)
                    }
                    onRemove={() => {
                      const automaticHint = orderTask.automationKey
                        ? " Die Aufgabe kann bei einer erneuten Angebotsanalyse wieder hinzugefügt werden."
                        : "";
                      if (
                        window.confirm(
                          `Aufgabe „${orderTask.title}“ wirklich löschen?${automaticHint}`
                        )
                      ) {
                        onRemoveTask(selectedOrder.id, orderTask.id);
                      }
                    }}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <section className='border border-dashed border-slate-300 bg-white p-4'>
        <h4 className='text-sm font-semibold text-slate-950'>
          Eigene Aufgabe ergänzen
        </h4>
        <div className='mt-3 grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)_auto]'>
          <select
            value={newTaskPhase}
            onChange={(event) =>
              setNewTaskPhase(event.target.value as CrmOrderTaskPhase)
            }
            className='h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500'
          >
            {CRM_ORDER_PHASES.map((phase) => (
              <option key={phase.id} value={phase.id}>
                {phase.label}
              </option>
            ))}
          </select>
          <input
            value={newTaskTitle}
            onChange={(event) => setNewTaskTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addTask();
            }}
            placeholder='z. B. Schlüssel beim Hausmeister abholen'
            className='h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500'
          />
          <Button
            onClick={addTask}
            disabled={isSaving || !newTaskTitle.trim()}
          >
            {isSaving ? <LoaderCircle className='animate-spin' /> : <Plus />}
            Hinzufügen
          </Button>
        </div>
      </section>

      <Dialog
        open={isTemplateDialogOpen}
        onOpenChange={(open) => {
          setIsTemplateDialogOpen(open);
          if (!open) setTemplateDraft(null);
        }}
      >
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
          <DialogHeader>
            <DialogTitle>
              {templateDraft ? "Situationsvorlage bearbeiten" : "Situationsvorlagen"}
            </DialogTitle>
            <DialogDescription>
              Erstelle wiederverwendbare Prüflisten für besondere Aufträge und
              ordne jede Aufgabe einer Arbeitsphase zu.
            </DialogDescription>
          </DialogHeader>

          {templateDraft ? (
            <div className='space-y-5 py-2'>
              <div className='grid gap-3 sm:grid-cols-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Name *
                  <input
                    value={templateDraft.name}
                    onChange={(event) =>
                      setTemplateDraft({
                        ...templateDraft,
                        name: event.target.value,
                      })
                    }
                    placeholder='z. B. Küchenmontage'
                    className='mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500'
                  />
                </label>
                <label className='text-sm font-medium text-slate-700'>
                  Beschreibung
                  <input
                    value={templateDraft.description}
                    onChange={(event) =>
                      setTemplateDraft({
                        ...templateDraft,
                        description: event.target.value,
                      })
                    }
                    placeholder='Wann wird diese Vorlage verwendet?'
                    className='mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500'
                  />
                </label>
              </div>

              <div className='rounded-md border border-slate-200'>
                <div className='border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950'>
                  Aufgaben der Vorlage
                </div>
                {templateDraft.tasks.length === 0 ? (
                  <p className='px-4 py-6 text-center text-sm text-slate-500'>
                    Füge mindestens eine Aufgabe hinzu.
                  </p>
                ) : (
                  <div className='divide-y divide-slate-100'>
                    {templateDraft.tasks.map((templateTask) => (
                      <div
                        key={templateTask.id}
                        className='flex items-start gap-3 px-4 py-3'
                      >
                        <div className='min-w-0 flex-1'>
                          <p className='text-sm font-medium text-slate-800'>
                            {templateTask.title}
                          </p>
                          {templateTask.details && (
                            <p className='mt-1 text-xs leading-5 text-slate-500'>
                              {templateTask.details}
                            </p>
                          )}
                          <div className='mt-2 flex flex-wrap gap-1'>
                            <span className='rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-700'>
                              {CRM_ORDER_PHASES.find(
                                (phase) => phase.id === templateTask.phase
                              )?.label ?? templateTask.phase}
                            </span>
                            <span className='rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600'>
                              {CRM_ORDER_TASK_KIND_LABELS[
                                templateTask.kind ?? "task"
                              ]}
                            </span>
                            <span className='rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600'>
                              {CRM_ORDER_ROLE_LABELS[
                                templateTask.role ??
                                  (templateTask.phase === "before"
                                    ? "office"
                                    : "crewLead")
                              ]}
                            </span>
                            {(templateTask.required ?? true) && (
                              <span className='rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700'>
                                Pflicht
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 shrink-0'
                          title='Aufgabe aus Vorlage entfernen'
                          onClick={() =>
                            setTemplateDraft({
                              ...templateDraft,
                              tasks: templateDraft.tasks.filter(
                                (candidate) => candidate.id !== templateTask.id
                              ),
                            })
                          }
                        >
                          <Trash2 size={15} className='text-red-600' />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className='space-y-3 border border-dashed border-slate-300 p-4'>
                <p className='text-sm font-semibold text-slate-950'>
                  Aufgabe hinzufügen
                </p>
                <div className='grid gap-2 sm:grid-cols-3'>
                  <select
                    value={templateTaskPhase}
                    onChange={(event) =>
                      setTemplateTaskPhase(
                        event.target.value as CrmOrderTaskPhase
                      )
                    }
                    className='h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500'
                  >
                    {CRM_ORDER_PHASES.map((phase) => (
                      <option key={phase.id} value={phase.id}>
                        {phase.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={templateTaskKind}
                    onChange={(event) =>
                      setTemplateTaskKind(
                        event.target.value as CrmOrderTaskKind
                      )
                    }
                    className='h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500'
                  >
                    {Object.entries(CRM_ORDER_TASK_KIND_LABELS).map(
                      ([kind, label]) => (
                        <option key={kind} value={kind}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                  <select
                    value={templateTaskRole}
                    onChange={(event) =>
                      setTemplateTaskRole(
                        event.target.value as CrmOrderTaskRole
                      )
                    }
                    className='h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500'
                  >
                    {Object.entries(CRM_ORDER_ROLE_LABELS).map(
                      ([role, label]) => (
                        <option key={role} value={role}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]'>
                  <input
                    value={templateTaskTitle}
                    onChange={(event) => setTemplateTaskTitle(event.target.value)}
                    placeholder='Was muss geprüft oder erledigt werden?'
                    className='h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500'
                  />
                </div>
                <textarea
                  value={templateTaskDetails}
                  onChange={(event) => setTemplateTaskDetails(event.target.value)}
                  rows={2}
                  placeholder='Optionale Hinweise, Messwerte oder Voraussetzungen'
                  className='w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500'
                />
                <div className='flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-700'>
                  <label className='flex items-center gap-2'>
                    <input
                      type='checkbox'
                      checked={templateTaskRequired}
                      onChange={(event) =>
                        setTemplateTaskRequired(event.target.checked)
                      }
                    />
                    Pflichtaufgabe
                  </label>
                  <label className='flex items-center gap-2'>
                    <input
                      type='checkbox'
                      checked={
                        templateTaskKind === "evidence" ||
                        templateTaskRequiresEvidence
                      }
                      disabled={templateTaskKind === "evidence"}
                      onChange={(event) =>
                        setTemplateTaskRequiresEvidence(event.target.checked)
                      }
                    />
                    Foto oder Datei erforderlich
                  </label>
                  {templateTaskKind === "check" && (
                    <label className='flex items-center gap-2 text-red-700'>
                      <input
                        type='checkbox'
                        checked={templateTaskBlocksOnNegative}
                        onChange={(event) =>
                          setTemplateTaskBlocksOnNegative(event.target.checked)
                        }
                      />
                      Auftrag bei „Nein“ blockieren
                    </label>
                  )}
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={addTemplateTask}
                  disabled={!templateTaskTitle.trim()}
                >
                  <Plus />
                  Aufgabe übernehmen
                </Button>
              </div>
            </div>
          ) : (
            <div className='space-y-3 py-2'>
              {templates.map((template) => (
                <button
                  key={template.id}
                  type='button'
                  onClick={() => editTemplate(template)}
                  className='flex w-full items-center justify-between gap-4 border border-slate-200 px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50/40'
                >
                  <span>
                    <span className='block text-sm font-medium text-slate-950'>
                      {template.name}
                    </span>
                    <span className='mt-1 block text-xs text-slate-500'>
                      {template.tasks.length} Aufgaben
                      {template.description ? ` · ${template.description}` : ""}
                    </span>
                  </span>
                  <Pencil size={16} className='shrink-0 text-slate-400' />
                </button>
              ))}
              {templates.length === 0 && (
                <p className='py-6 text-center text-sm text-slate-500'>
                  Noch keine Vorlage vorhanden.
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            {templateDraft ? (
              <>
                {templates.some(
                  (template) => template.id === templateDraft.id
                ) && (
                  <Button
                    variant='destructive'
                    onClick={() => void deleteTemplate(templateDraft)}
                    disabled={isSavingTemplates}
                  >
                    <Trash2 />
                    Löschen
                  </Button>
                )}
                <Button
                  variant='outline'
                  onClick={() => setTemplateDraft(null)}
                  disabled={isSavingTemplates}
                >
                  Zurück
                </Button>
                <Button
                  onClick={() => void saveTemplate()}
                  disabled={
                    isSavingTemplates ||
                    !templateDraft.name.trim() ||
                    templateDraft.tasks.length === 0
                  }
                >
                  {isSavingTemplates ? (
                    <LoaderCircle className='animate-spin' />
                  ) : (
                    <Check />
                  )}
                  Vorlage speichern
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant='outline'
                  onClick={() => setIsTemplateDialogOpen(false)}
                >
                  Schließen
                </Button>
                <Button onClick={startNewTemplate}>
                  <Plus />
                  Neue Vorlage
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
