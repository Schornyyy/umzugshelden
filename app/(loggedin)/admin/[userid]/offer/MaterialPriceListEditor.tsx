"use client";

import { Button } from "@/components/ui/button";
import {
  Boxes,
  LoaderCircle,
  PackagePlus,
  Paintbrush,
  Save,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import {
  getDefaultMaterialWidthM,
  getMaterialUnitOptions,
  materialTypeUsesAreaWidth,
  materialTypeOptions,
  type MaterialCatalogItem,
  type MaterialService,
  type MaterialType,
  type MaterialUnit,
} from "./materialCatalog";

type MaterialPriceListEditorProps = {
  catalog: MaterialCatalogItem[];
  isSaving: boolean;
  onChange: (catalog: MaterialCatalogItem[]) => void;
  onSave: () => void;
};

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

const materialTypeDefaults: Record<
  MaterialType,
  Pick<
    MaterialCatalogItem,
    "service" | "calculationBasis" | "unit" | "packageSize" | "widthM" | "packageLabel"
  >
> = {
  wallPaint: { service: "painting", calculationBasis: "coatedAreaM2", unit: "l", packageSize: 12.5, widthM: 1, packageLabel: "Eimer" },
  primer: { service: "painting", calculationBasis: "surfaceAreaM2", unit: "l", packageSize: 10, widthM: 1, packageLabel: "Kanister" },
  protectionFleece: { service: "painting", calculationBasis: "protectionAreaM2", unit: "m²", packageSize: 50, widthM: 1, packageLabel: "Rolle" },
  maskingTape: { service: "painting", calculationBasis: "surfaceAreaM2", unit: "m", packageSize: 50, widthM: 1, packageLabel: "Rolle" },
  coveringFilm: { service: "painting", calculationBasis: "protectionAreaM2", unit: "m²", packageSize: 100, widthM: 2, packageLabel: "Rolle" },
  paintingTools: { service: "painting", calculationBasis: "surfaceAreaM2", unit: "Set", packageSize: 1, widthM: 1, packageLabel: "Set" },
  filler: { service: "painting", calculationBasis: "repairAreaM2", unit: "kg", packageSize: 25, widthM: 1, packageLabel: "Sack" },
  wallpaper: { service: "painting", calculationBasis: "wallpaperAreaM2", unit: "m²", packageSize: 5.33, widthM: 0.53, packageLabel: "Rolle" },
  packingBox: { service: "packing", calculationBasis: "packingBoxCount", unit: "Stk.", packageSize: 1, widthM: 1, packageLabel: "Karton" },
  packingMaterial: { service: "packing", calculationBasis: "packingBoxCount", unit: "Stk.", packageSize: 1, widthM: 1, packageLabel: "Gebinde" },
  other: { service: "painting", calculationBasis: "fixed", unit: "Stk.", packageSize: 1, widthM: 1, packageLabel: "Gebinde" },
};

const serviceSections: Array<{
  id: MaterialService;
  label: string;
  description: string;
  icon: typeof Paintbrush;
  defaultType: MaterialType;
}> = [
  {
    id: "painting",
    label: "Anstricharbeiten",
    description: "Farben, Grundierung, Abdeckung, Werkzeug und Tapeten",
    icon: Paintbrush,
    defaultType: "wallPaint",
  },
  {
    id: "packing",
    label: "Packservice",
    description: "Kartons und Verpackungsmaterial für Umzüge",
    icon: Boxes,
    defaultType: "packingBox",
  },
];

export default function MaterialPriceListEditor({
  catalog,
  isSaving,
  onChange,
  onSave,
}: MaterialPriceListEditorProps) {
  const [activeService, setActiveService] =
    useState<MaterialService>("painting");
  const activeSection =
    serviceSections.find((section) => section.id === activeService) ??
    serviceSections[0];
  const activeTypeOptions = materialTypeOptions.filter(
    (option) => materialTypeDefaults[option.value].service === activeService
  );

  function addMaterial(service: MaterialService) {
    const section =
      serviceSections.find((item) => item.id === service) ?? serviceSections[0];
    const materialType = section.defaultType;
    onChange([
      ...catalog,
      {
        id: crypto.randomUUID(),
        name:
          service === "packing" ? "Neues Verpackungsmaterial" : "Neue Wandfarbe",
        materialType,
        ...materialTypeDefaults[materialType],
        netPrice: 0,
        enabled: true,
      },
    ]);
  }

  function updateMaterial(
    id: string,
    patch: Partial<MaterialCatalogItem>
  ) {
    onChange(
      catalog.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      )
    );
  }

  function removeMaterial(id: string) {
    onChange(catalog.filter((item) => item.id !== id));
  }

  function updateMaterialType(id: string, materialType: MaterialType) {
    updateMaterial(id, {
      materialType,
      ...materialTypeDefaults[materialType],
    });
  }

  function updateMaterialUnit(id: string, unit: MaterialUnit) {
    const item = catalog.find((catalogItem) => catalogItem.id === id);
    if (!item) return;

    const widthM = item.widthM || getDefaultMaterialWidthM(item.materialType);
    let packageSize = item.packageSize;
    if (materialTypeUsesAreaWidth(item.materialType)) {
      if (item.unit === "m²" && unit === "m") {
        packageSize = item.packageSize / widthM;
      } else if (item.unit === "m" && unit === "m²") {
        packageSize = item.packageSize * widthM;
      }
    }

    updateMaterial(id, {
      unit,
      widthM,
      packageSize: Math.round(packageSize * 100) / 100,
    });
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-col justify-between gap-3 sm:flex-row sm:items-start'>
        <div>
          <p className='text-sm font-semibold text-slate-950'>Eigene Material-Preisliste</p>
          <p className='mt-1 max-w-3xl text-sm leading-6 text-slate-600'>
            Alle Preise sind Nettopreise je Gebinde. Der Bedarf wird beim
            Erstellen eines Angebots automatisch ermittelt und auf volle
            Gebinde aufgerundet. Die Materialart bestimmt automatisch, welche
            Angebotsfläche verwendet wird.
          </p>
        </div>
      </div>

      <div
        role='tablist'
        aria-label='Dienstleistung auswählen'
        className='grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-1 sm:grid-cols-2'>
        {serviceSections.map((section) => {
          const Icon = section.icon;
          const itemCount = catalog.filter(
            (item) => item.service === section.id
          ).length;
          const isActive = activeService === section.id;
          return (
            <button
              key={section.id}
              type='button'
              role='tab'
              aria-selected={isActive}
              onClick={() => setActiveService(section.id)}
              className={`flex min-h-16 items-center gap-3 rounded-md px-4 py-3 text-left transition ${
                isActive
                  ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:bg-white/70 hover:text-slate-950"
              }`}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${isActive ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                <Icon size={18} />
              </span>
              <span className='min-w-0 flex-1'>
                <span className='flex items-center justify-between gap-3'>
                  <strong className='text-sm'>{section.label}</strong>
                  <span className='rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-600'>{itemCount}</span>
                </span>
                <span className='mt-0.5 block truncate text-xs text-slate-500'>{section.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div role='tabpanel' className='space-y-5'>
        <div className='flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center'>
          <div>
            <h2 className='text-base font-semibold text-slate-950'>{activeSection.label}</h2>
            <p className='mt-1 text-sm text-slate-600'>{activeSection.description}</p>
          </div>
          <Button type='button' variant='outline' onClick={() => addMaterial(activeService)}>
            <PackagePlus /> Material hinzufügen
          </Button>
        </div>

        {activeTypeOptions.map((typeOption) => {
          const items = catalog.filter(
            (item) =>
              item.service === activeService &&
              item.materialType === typeOption.value
          );
          if (items.length === 0) return null;

          return (
            <section key={typeOption.value} aria-labelledby={`material-group-${typeOption.value}`}>
              <div className='mb-2 flex items-center justify-between gap-3'>
                <h3 id={`material-group-${typeOption.value}`} className='text-xs font-semibold uppercase text-slate-500'>{typeOption.label}</h3>
                <span className='text-xs tabular-nums text-slate-400'>{items.length} {items.length === 1 ? "Position" : "Positionen"}</span>
              </div>
              <div className='space-y-2'>
                {items.map((item) => (
                  <div key={item.id} className='rounded-md border border-slate-200 bg-white p-3'>
                    <div className='grid gap-3 lg:grid-cols-[36px_minmax(190px,1.4fr)_180px_130px_100px_100px_110px_120px_36px] lg:items-end'>
              <label className='flex h-10 items-center justify-center' title='Material verwenden'>
                <input
                  type='checkbox'
                  checked={item.enabled}
                  onChange={(event) =>
                    updateMaterial(item.id, { enabled: event.target.checked })
                  }
                  className='h-4 w-4 accent-blue-600'
                  aria-label={`${item.name} verwenden`}
                />
              </label>
              <label className='flex flex-col gap-1 text-xs font-medium text-slate-600'>
                Material
                <input
                  value={item.name}
                  onChange={(event) =>
                    updateMaterial(item.id, { name: event.target.value })
                  }
                  className='h-10 min-w-0 rounded-md border border-slate-200 px-2 text-sm text-slate-950 outline-none focus:border-blue-500'
                />
              </label>
              <label className='flex flex-col gap-1 text-xs font-medium text-slate-600'>
                Materialart
                <select
                  value={item.materialType}
                  onChange={(event) =>
                    updateMaterialType(item.id, event.target.value as MaterialType)
                  }
                  className='h-10 rounded-md border border-slate-200 px-2 text-sm text-slate-950 outline-none focus:border-blue-500'>
                  {activeTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className='flex flex-col gap-1 text-xs font-medium text-slate-600'>
                Einheit
                <select value={item.unit} onChange={(event) => updateMaterialUnit(item.id, event.target.value as MaterialUnit)} className='h-10 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-950 outline-none focus:border-blue-500'>
                  {getMaterialUnitOptions(item.materialType).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className='flex flex-col gap-1 text-xs font-medium text-slate-600'>
                {item.unit === "m" ? "Länge" : "Inhalt"}
                <input type='number' min='0' step='0.01' value={item.packageSize} onChange={(event) => updateMaterial(item.id, { packageSize: toNumber(event.target.value) })} className='h-10 rounded-md border border-slate-200 px-2 text-sm text-slate-950 outline-none focus:border-blue-500' />
              </label>
              {item.unit === "m" && materialTypeUsesAreaWidth(item.materialType) ? (
                <label className='flex flex-col gap-1 text-xs font-medium text-slate-600' title='Länge mal Breite ergibt die Fläche des Gebindes'>
                  Breite (m)
                  <input type='number' min='0.01' step='0.01' value={item.widthM ?? getDefaultMaterialWidthM(item.materialType)} onChange={(event) => updateMaterial(item.id, { widthM: toNumber(event.target.value) })} className='h-10 rounded-md border border-slate-200 px-2 text-sm text-slate-950 outline-none focus:border-blue-500' />
                </label>
              ) : (
                <div className='hidden lg:block' aria-hidden='true' />
              )}
              <label className='flex flex-col gap-1 text-xs font-medium text-slate-600'>
                Gebinde
                <input value={item.packageLabel} onChange={(event) => updateMaterial(item.id, { packageLabel: event.target.value })} className='h-10 rounded-md border border-slate-200 px-2 text-sm text-slate-950 outline-none focus:border-blue-500' />
              </label>
              <label className='flex flex-col gap-1 text-xs font-medium text-slate-600'>
                Netto/Gebinde
                <div className='relative'>
                  <input type='number' min='0' step='0.01' value={item.netPrice} onChange={(event) => updateMaterial(item.id, { netPrice: toNumber(event.target.value) })} className='h-10 w-full rounded-md border border-slate-200 px-2 pr-9 text-sm text-slate-950 outline-none focus:border-blue-500' />
                  <span className='pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-slate-500'>EUR</span>
                </div>
              </label>
              <Button type='button' variant='ghost' size='icon' title='Material löschen' onClick={() => removeMaterial(item.id)} className='text-red-600'>
                <Trash2 size={16} />
              </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {catalog.every((item) => item.service !== activeService) && (
          <div className='rounded-md border border-dashed border-slate-300 px-4 py-10 text-center'>
            <p className='text-sm font-medium text-slate-700'>Noch keine Materialien für {activeSection.label}</p>
            <p className='mt-1 text-sm text-slate-500'>Lege die erste Position an, damit sie automatisch in Angeboten berücksichtigt wird.</p>
            <Button type='button' className='mt-4' onClick={() => addMaterial(activeService)}>
              <PackagePlus /> Erstes Material hinzufügen
            </Button>
          </div>
        )}
            </div>

      <div className='flex justify-end border-t border-slate-200 pt-4'>
        <Button type='button' onClick={onSave} disabled={isSaving}>
          {isSaving ? <LoaderCircle className='animate-spin' /> : <Save />}
          Preisliste speichern
        </Button>
      </div>
    </div>
  );
}