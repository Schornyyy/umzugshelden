"use client";

import { Button } from "@/components/ui/button";
import {
  CRM_ORDER_ROLE_LABELS,
  CRM_ORDER_TASK_KIND_LABELS,
  isCrmOrderTaskBlocking,
  isCrmOrderTaskComplete,
} from "@/lib/crmOrderTasks";
import type {
  CrmOrderTask,
  CrmOrderTaskAnswer,
  CrmOrderTaskRole,
} from "@/types/Crm";
import {
  AlertTriangle,
  Check,
  ExternalLink,
  FileUp,
  LoaderCircle,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type StructuredOrderTaskProps = {
  task: CrmOrderTask;
  disabled: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<CrmOrderTask>) => void;
  onUploadEvidence: (file: File) => Promise<void>;
  onRemove?: () => void;
};

const checkAnswers: Array<{
  value: CrmOrderTaskAnswer;
  label: string;
}> = [
  { value: "yes", label: "Ja" },
  { value: "no", label: "Nein" },
  { value: "notApplicable", label: "Nicht relevant" },
];

export default function StructuredOrderTask({
  task,
  disabled,
  onToggle,
  onUpdate,
  onUploadEvidence,
  onRemove,
}: StructuredOrderTaskProps) {
  const [value, setValue] = useState(task.value);
  const [note, setNote] = useState(task.note);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isComplete = isCrmOrderTaskComplete(task);
  const isBlocking = isCrmOrderTaskBlocking(task);

  useEffect(() => {
    setValue(task.value);
    setNote(task.note);
  }, [task.note, task.value]);

  async function uploadEvidence(file: File | undefined) {
    if (!file) return;
    setIsUploading(true);
    setUploadError("");
    try {
      await onUploadEvidence(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Der Nachweis konnte nicht hochgeladen werden."
      );
    } finally {
      setIsUploading(false);
    }
  }

  function saveInput() {
    onUpdate({ value: value.trim(), note: note.trim() });
  }

  return (
    <article
      className={`px-4 py-3 ${
        isBlocking
          ? "bg-red-50"
          : isComplete
            ? "bg-emerald-50/40"
            : "bg-white"
      }`}
    >
      <div className='flex items-start gap-3'>
        {task.kind === "task" ? (
          <button
            type='button'
            onClick={onToggle}
            disabled={disabled}
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
              isComplete
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-slate-300 text-transparent hover:border-emerald-500"
            }`}
            title={
              isComplete ? "Als offen markieren" : "Als erledigt markieren"
            }
          >
            <Check size={13} />
          </button>
        ) : (
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
              isBlocking
                ? "border-red-600 bg-red-600 text-white"
                : isComplete
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-300 text-transparent"
            }`}
          >
            {isBlocking ? <AlertTriangle size={12} /> : <Check size={12} />}
          </span>
        )}

        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-start justify-between gap-2'>
            <p
              className={`text-sm font-medium leading-5 text-slate-800 ${
                isComplete && !isBlocking ? "opacity-70" : ""
              }`}
            >
              {task.title}
            </p>
            <div className='flex flex-wrap justify-end gap-1'>
              {task.required && (
                <span className='rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700'>
                  Pflicht
                </span>
              )}
              <span className='rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600'>
                {CRM_ORDER_TASK_KIND_LABELS[task.kind]}
              </span>
            </div>
          </div>

          {task.details && (
            <p className='mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-500'>
              {task.details}
            </p>
          )}

          <div className='mt-2 flex flex-wrap items-center gap-2'>
            <select
              value={task.role}
              onChange={(event) =>
                onUpdate({
                  role: event.target.value as CrmOrderTaskRole,
                })
              }
              disabled={disabled}
              aria-label='Verantwortliche Rolle'
              className='h-7 rounded border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-600 outline-none focus:border-blue-500'
            >
              {Object.entries(CRM_ORDER_ROLE_LABELS).map(([role, label]) => (
                <option key={role} value={role}>
                  {label}
                </option>
              ))}
            </select>
            <span className='text-[11px] font-medium text-slate-400'>
              {task.templateName ?? task.serviceType}
            </span>
          </div>

          {task.kind === "check" && (
            <div className='mt-3 space-y-2'>
              <div className='flex flex-wrap gap-2'>
                {checkAnswers.map((answer) => (
                  <Button
                    key={answer.value}
                    type='button'
                    variant={task.answer === answer.value ? "default" : "outline"}
                    size='sm'
                    className='h-8'
                    disabled={disabled}
                    onClick={() => onUpdate({ answer: answer.value })}
                  >
                    {answer.label}
                  </Button>
                ))}
              </div>
              {(task.answer === "no" ||
                task.answer === "notApplicable" ||
                task.note) && (
                <div className='flex gap-2'>
                  <input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder={
                      task.answer === "no"
                        ? "Abweichung und erforderliche Maßnahme dokumentieren *"
                        : "Begründung festhalten *"
                    }
                    className='h-9 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-xs outline-none focus:border-blue-500'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    className='h-9 w-9'
                    title='Begründung speichern'
                    disabled={disabled || !note.trim()}
                    onClick={saveInput}
                  >
                    <Save size={14} />
                  </Button>
                </div>
              )}
            </div>
          )}

          {(task.kind === "measurement" || task.kind === "approval") && (
            <div className='mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]'>
              <input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={
                  task.kind === "measurement"
                    ? "Messwert mit Einheit eingeben, z. B. 126 cm"
                    : "Freigegeben durch: Name"
                }
                className='h-9 rounded-md border border-slate-200 px-3 text-xs outline-none focus:border-blue-500'
              />
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={disabled || !value.trim()}
                onClick={saveInput}
              >
                <Save />
                Speichern
              </Button>
            </div>
          )}

          {(task.kind === "evidence" || task.requiresEvidence) && (
            <div className='mt-3 rounded-md border border-dashed border-slate-300 p-3'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <p className='text-xs font-medium text-slate-700'>
                  Nachweis erforderlich
                </p>
                <label className='inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50'>
                  {isUploading ? (
                    <LoaderCircle size={14} className='animate-spin' />
                  ) : (
                    <FileUp size={14} />
                  )}
                  Datei oder Foto
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*,.pdf'
                    className='sr-only'
                    disabled={disabled || isUploading}
                    onChange={(event) =>
                      void uploadEvidence(event.target.files?.[0])
                    }
                  />
                </label>
              </div>
              {task.evidence.length > 0 && (
                <div className='mt-2 flex flex-wrap gap-2'>
                  {task.evidence.map((evidence) => (
                    <a
                      key={evidence.id}
                      href={evidence.url}
                      target='_blank'
                      rel='noreferrer'
                      className='inline-flex max-w-full items-center gap-1 rounded bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700 hover:underline'
                    >
                      <span className='truncate'>{evidence.name}</span>
                      <ExternalLink size={11} className='shrink-0' />
                    </a>
                  ))}
                </div>
              )}
              {uploadError && (
                <p className='mt-2 text-xs font-medium text-red-600'>
                  {uploadError}
                </p>
              )}
            </div>
          )}

          {isBlocking && (
            <div className='mt-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-100/60 px-3 py-2 text-xs font-medium text-red-700'>
              <AlertTriangle size={14} className='mt-0.5 shrink-0' />
              Dieser Prüfpunkt blockiert den Auftrag. Abweichung klären und
              Prüfung anschließend erneut bestätigen.
            </div>
          )}
        </div>

        {onRemove && (
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7 shrink-0'
            title='Aufgabe löschen'
            disabled={disabled}
            onClick={onRemove}
          >
            <Trash2 size={14} className='text-red-600' />
          </Button>
        )}
      </div>
    </article>
  );
}
