import type { CrmOfferDocument } from "@/lib/crmOfferDocument";
import type {
  CrmOrder,
  CrmOrderTask,
  CrmOrderTaskKind,
  CrmOrderTaskPhase,
  CrmOrderTaskRole,
  CrmTaskTemplate,
  CrmTaskTemplateItem,
} from "@/types/Crm";

type TaskTemplate = Pick<
  CrmOrderTask,
  | "phase"
  | "title"
  | "details"
  | "serviceType"
  | "kind"
  | "role"
  | "required"
  | "requiresEvidence"
  | "blocksOnNegative"
  | "automationKey"
  | "moduleId"
>;

function taskKey(phase: CrmOrderTaskPhase, serviceType: string, title: string) {
  return `${phase}:${serviceType}:${title
    .toLocaleLowerCase("de-DE")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

const task = (
  phase: CrmOrderTaskPhase,
  title: string,
  serviceType = "general",
  details = "",
  options: Partial<
    Pick<
      TaskTemplate,
      | "kind"
      | "role"
      | "required"
      | "requiresEvidence"
      | "blocksOnNegative"
      | "automationKey"
      | "moduleId"
    >
  > = {}
): TaskTemplate => ({
  phase,
  title,
  details,
  serviceType,
  kind: options.kind ?? "task",
  role: options.role ?? (phase === "before" ? "office" : "crewLead"),
  required: options.required ?? true,
  requiresEvidence: options.requiresEvidence ?? false,
  blocksOnNegative: options.blocksOnNegative ?? false,
  automationKey:
    options.automationKey ?? taskKey(phase, serviceType, title),
  moduleId:
    options.moduleId ?? (serviceType === "general" ? "core" : serviceType),
});

const generalTasks: TaskTemplate[] = [
  task("before", "Auftragsumfang und Termin mit dem Kunden bestätigen"),
  task("before", "Team, Fahrzeuge, Material und Zeitplan einteilen"),
  task("before", "Zufahrt, Ansprechpartner und Schlüsselübergabe klären"),
  task("during", "Team einweisen und Leistungsumfang vor Ort abgleichen"),
  task("during", "Ausgangszustand und Besonderheiten dokumentieren", "general", "", {
    requiresEvidence: true,
  }),
  task("during", "Arbeitsschutz und sichere Arbeitswege sicherstellen"),
  task("after", "Gemeinsame Endkontrolle mit dem Kunden durchführen"),
  task("after", "Arbeitsbereich sauber und vollständig übergeben"),
  task("after", "Abweichungen, Schäden und Zusatzleistungen dokumentieren"),
  task("after", "Leistungsnachweis für Rechnung und Nachkalkulation abschließen"),
];

const serviceTasks: Record<string, TaskTemplate[]> = {
  move: [
    task("before", "Route, Ladefolge und Parkmöglichkeiten planen", "move"),
    task("before", "Schutzmaterial und Ladungssicherung vorbereiten", "move"),
    task("during", "Laufwege, Böden und empfindliche Flächen schützen", "move"),
    task("during", "Inventar systematisch verladen und Ladung sichern", "move"),
    task("during", "Inventar am Zielort vollständig entladen und zuordnen", "move"),
    task("after", "Fahrzeug und Ladefläche auf zurückgebliebenes Inventar prüfen", "move"),
  ],
  seniorMove: [
    task("before", "Feste Betreuungsperson und Ruhepausen einplanen", "seniorMove"),
    task("before", "Einrichtung des Zielorts mit dem Kunden abstimmen", "seniorMove"),
    task("during", "Persönliche Gegenstände eindeutig kennzeichnen und begleiten", "seniorMove"),
    task("during", "Wichtige Alltagsgegenstände am Zielort zuerst bereitstellen", "seniorMove"),
    task("after", "Funktionsfähige und sichere Grundordnung am Zielort herstellen", "seniorMove"),
  ],
  furnitureAssembly: [
    task("before", "Möbel, Montageumfang und benötigte Werkzeuge prüfen", "furnitureAssembly"),
    task("before", "Kleinteile, Beschläge und Bauteile je Möbelstück kennzeichnen", "furnitureAssembly"),
    task("during", "Möbel fachgerecht demontieren und Bauteile schützen", "furnitureAssembly"),
    task("during", "Möbel am Zielort ausrichten und standsicher montieren", "furnitureAssembly"),
    task("after", "Funktion, Stabilität und Vollständigkeit aller Möbel prüfen", "furnitureAssembly"),
  ],
  painting: [
    task("before", "Farbtöne, Flächen, Anstriche und Materialbedarf bestätigen", "painting"),
    task("before", "Böden, Möbel, Steckdosen und nicht zu streichende Flächen abdecken", "painting"),
    task("during", "Untergrund prüfen, reinigen und Schadstellen vorbereiten", "painting"),
    task("during", "Grundierung und Anstriche mit ausreichender Trocknung ausführen", "painting"),
    task("after", "Kanten, Deckkraft und Ausbesserungsstellen bei gutem Licht prüfen", "painting"),
    task("after", "Abdeckmaterial entfernen und Farbreste fachgerecht entsorgen", "painting"),
  ],
  clearance: [
    task("before", "Räumungsumfang, Verwertbares und ausgeschlossene Gegenstände markieren", "clearance"),
    task("before", "Entsorgungswege, Container und Nachweise organisieren", "clearance"),
    task("during", "Gegenstände nach Verwertung, Spende und Entsorgung trennen", "clearance"),
    task("during", "Räume vollständig räumen und feste Einbauten wie vereinbart entfernen", "clearance"),
    task("after", "Alle Räume, Nebenflächen und Transportwege auf Restgegenstände prüfen", "clearance"),
    task("after", "Entsorgungsnachweise und verwertete Gegenstände dokumentieren", "clearance"),
  ],
  packing: [
    task("before", "Packmaterial, Beschriftungssystem und Prioritäten festlegen", "packing"),
    task("during", "Kartons nach Raum und Inhalt beschriften", "packing"),
    task("during", "Empfindliches Inventar separat schützen und kennzeichnen", "packing"),
    task("after", "Kartonzahlen und nicht verpackte Gegenstände dokumentieren", "packing"),
  ],
  storage: [
    task("before", "Lagerfläche, Laufzeit und Einlagerungsliste bestätigen", "storage"),
    task("during", "Lagergut geschützt, beschriftet und zugänglich einlagern", "storage"),
    task("after", "Einlagerungsliste und Lagerplatz an den Kunden übermitteln", "storage"),
  ],
};

function getDynamicTasks(offer: CrmOfferDocument): TaskTemplate[] {
  const planning = offer.planning;
  if (!planning) return [];

  const tasks: TaskTemplate[] = [];
  if (planning.scopeDescription?.trim()) {
    tasks.push(
      task(
        "during",
        "Individuelle Leistungsbeschreibung vollständig umsetzen",
        "extra",
        planning.scopeDescription.trim()
      )
    );
  }
  for (const extra of planning.extraServices ?? []) {
    const name = extra.name?.trim();
    if (name) {
      tasks.push(task("during", `Zusatzleistung ausführen: ${name}`, "extra"));
    }
  }
  return tasks;
}

const automatedServiceLabels: Record<string, string> = {
  move: "Umzug",
  seniorMove: "Seniorenumzug",
  clearance: "Entrümpelung",
  painting: "Streicharbeiten",
  furnitureAssembly: "De-/Montage",
  packing: "Einpackservice",
  storage: "Einlagerung",
};

type AutomationPlan = Pick<
  NonNullable<CrmOrder["automation"]>,
  "modules" | "risks"
> & {
  tasks: TaskTemplate[];
};

function hasUpperFloor(value: string | undefined, elevator: boolean | undefined) {
  const floor = value?.trim().toLocaleLowerCase("de-DE");
  return Boolean(
    floor &&
      !elevator &&
      !["0", "eg", "erdgeschoss", "parterre"].includes(floor)
  );
}

function buildOfferAutomation(
  offer: CrmOfferDocument
): AutomationPlan {
  const planning = offer.planning;
  const modules: AutomationPlan["modules"] = [];
  const risks: AutomationPlan["risks"] = [];
  const tasks: TaskTemplate[] = [];

  for (const serviceType of planning?.serviceTypes ?? []) {
    modules.push({
      id: `service:${serviceType}`,
      label: automatedServiceLabels[serviceType] ?? serviceType,
      reason: "Im angenommenen Angebot enthalten",
    });
  }

  function addRule(rule: {
    id: string;
    moduleId: string;
    moduleLabel: string;
    reason: string;
    severity: "high" | "medium" | "low";
    title: string;
    details: string;
    taskTitle: string;
    taskDetails: string;
    role?: CrmOrderTaskRole;
    kind?: CrmOrderTaskKind;
    requiresEvidence?: boolean;
    blocksOnNegative?: boolean;
  }) {
    if (!modules.some((module) => module.id === rule.moduleId)) {
      modules.push({
        id: rule.moduleId,
        label: rule.moduleLabel,
        reason: rule.reason,
      });
    }
    const automationKey = `rule:${rule.id}`;
    risks.push({
      id: rule.id,
      severity: rule.severity,
      title: rule.title,
      details: rule.details,
      taskKey: automationKey,
    });
    tasks.push(
      task("before", rule.taskTitle, "automation", rule.taskDetails, {
        automationKey,
        moduleId: rule.moduleId,
        kind: rule.kind ?? "check",
        role: rule.role ?? "projectLead",
        required: true,
        requiresEvidence: rule.requiresEvidence ?? false,
        blocksOnNegative: rule.blocksOnNegative ?? true,
      })
    );
  }

  if (!planning?.serviceTypes?.length) {
    addRule({
      id: "missing-service",
      moduleId: "clarification",
      moduleLabel: "Klärungsbedarf",
      reason: "Keine Dienstleistung ausgewählt",
      severity: "high",
      title: "Leistungsumfang nicht festgelegt",
      details: "Ohne ausgewählte Dienstleistung kann der Auftrag nicht zuverlässig geplant werden.",
      taskTitle: "Dienstleistungen und Leistungsumfang verbindlich klären",
      taskDetails: "Angebot korrigieren oder schriftlich dokumentieren, welche Leistungen ausgeführt werden.",
      role: "office",
    });
  }
  if (!planning?.date) {
    addRule({
      id: "missing-date",
      moduleId: "clarification",
      moduleLabel: "Klärungsbedarf",
      reason: "Leistungstermin ist offen",
      severity: "high",
      title: "Leistungstermin fehlt",
      details: "Personal, Fahrzeuge und Material können erst nach Terminbestätigung verbindlich disponiert werden.",
      taskTitle: "Leistungstermin mit dem Kunden verbindlich bestätigen",
      taskDetails: "Datum und Zeitfenster dokumentieren und anschließend im Angebot aktualisieren.",
      role: "office",
    });
  }

  const moveSelected = planning?.serviceTypes?.some(
    (service) => service === "move" || service === "seniorMove"
  );
  if (moveSelected && (!planning?.oldAddress?.trim() || !planning.newAddress?.trim())) {
    addRule({
      id: "missing-move-address",
      moduleId: "clarification",
      moduleLabel: "Klärungsbedarf",
      reason: "Start- oder Zieladresse fehlt",
      severity: "high",
      title: "Transportstrecke ist unvollständig",
      details: "Route, Fahrzeit, Parkraum und Fahrzeugwahl sind ohne vollständige Adressen unsicher.",
      taskTitle: "Start- und Zieladresse vollständig erfassen",
      taskDetails: "Hausnummer, PLZ, Ort sowie Zugangshinweise für beide Adressen dokumentieren.",
      role: "office",
    });
  }
  if (
    hasUpperFloor(planning?.oldFloor, planning?.oldElevator) ||
    hasUpperFloor(planning?.newFloor, planning?.newElevator)
  ) {
    addRule({
      id: "stairs-without-elevator",
      moduleId: "access",
      moduleLabel: "Erschwerter Gebäudezugang",
      reason: "Obergeschoss ohne bestätigten Aufzug",
      severity: "medium",
      title: "Treppentransport erhöht Zeit- und Personalbedarf",
      details: "Treppenbreite, Podeste, Geländer und sichere Tragetechnik müssen vor Einsatzbeginn geprüft werden.",
      taskTitle: "Treppenhaus und Transportweg vor Ort freigeben",
      taskDetails: "Engstellen, Schutzmaßnahmen und benötigte Tragehilfen dokumentieren.",
      role: "crewLead",
      requiresEvidence: true,
    });
  }

  const carryDistance = Math.max(
    planning?.carryDistanceM ?? 0,
    planning?.oldCarryDistanceM ?? 0,
    planning?.newCarryDistanceM ?? 0
  );
  if (carryDistance > 30) {
    addRule({
      id: "long-carry-distance",
      moduleId: "access",
      moduleLabel: "Erschwerter Gebäudezugang",
      reason: `Tragestrecke bis ${carryDistance} m`,
      severity: "medium",
      title: "Lange Tragestrecke eingeplant",
      details: "Zusätzliche Laufzeit, Transporthilfen und gegebenenfalls mehr Personal berücksichtigen.",
      taskTitle: "Tragestrecke und Einsatz von Transporthilfen bestätigen",
      taskDetails: `Angebotswert: bis ${carryDistance} m. Tatsächlichen Weg und Hindernisse prüfen.`,
      role: "crewLead",
      requiresEvidence: true,
    });
  }
  if (planning?.parkingRequired) {
    addRule({
      id: "parking-zone",
      moduleId: "parking",
      moduleLabel: "Halteverbotszone",
      reason: "Im Angebot als erforderlich markiert",
      severity: "medium",
      title: "Parkfläche muss vorab gesichert werden",
      details: "Fehlende Genehmigung oder Beschilderung kann den gesamten Einsatz verzögern.",
      taskTitle: "Halteverbotszone genehmigen, aufstellen und kontrollieren",
      taskDetails: "Fristen der Behörde einhalten und die korrekte Beschilderung fotografisch dokumentieren.",
      role: "office",
      requiresEvidence: true,
    });
  }
  if (planning?.furnitureLiftRequired) {
    addRule({
      id: "furniture-lift",
      moduleId: "furniture-lift",
      moduleLabel: "Möbellift",
      reason: "Im Angebot als erforderlich markiert",
      severity: "high",
      title: "Möbellifteinsatz benötigt gesicherten Aufstellort",
      details: "Untergrund, Zufahrt, Reichweite, Fensterzugang und Absperrung müssen geeignet sein.",
      taskTitle: "Möbellift, Aufstellfläche und Sicherheitsbereich freigeben",
      taskDetails: "Gerät reservieren, Tragfähigkeit und Reichweite bestätigen sowie Aufstellort dokumentieren.",
      role: "projectLead",
      requiresEvidence: true,
    });
  }
  if ((planning?.moveTrips ?? 0) > 1) {
    addRule({
      id: "multiple-trips",
      moduleId: "transport",
      moduleLabel: "Mehrfahrten",
      reason: `${planning?.moveTrips} Fahrten kalkuliert`,
      severity: "medium",
      title: "Mehrere Transportfahrten erforderlich",
      details: "Ladefolge, Zwischenzeiten und Personalverfügbarkeit müssen aufeinander abgestimmt werden.",
      taskTitle: "Lade- und Fahrtenplan für alle Touren freigeben",
      taskDetails: "Inventar je Fahrt, Reihenfolge, Fahrer und Zeitfenster festlegen.",
      role: "projectLead",
    });
  }
  if ((planning?.specialItemCount ?? 0) > 0) {
    addRule({
      id: "special-items",
      moduleId: "special-items",
      moduleLabel: "Sonder- und Schwergut",
      reason: `${planning?.specialItemCount} Sondergegenstände erfasst`,
      severity: "high",
      title: "Sondergegenstände benötigen eigenen Transportplan",
      details: "Gewicht, Maße, Tragetechnik, Demontage und Versicherungsschutz müssen geklärt sein.",
      taskTitle: "Sondergegenstände einzeln dokumentieren und Transport freigeben",
      taskDetails: "Maße, Gewicht, Zugänge, Hilfsmittel und verantwortliche Personen je Gegenstand erfassen.",
      role: "projectLead",
      requiresEvidence: true,
    });
  }
  if ((planning?.fragileItemCount ?? 0) > 0) {
    addRule({
      id: "fragile-items",
      moduleId: "fragile",
      moduleLabel: "Empfindliches Inventar",
      reason: `${planning?.fragileItemCount} empfindliche Gegenstände erfasst`,
      severity: "medium",
      title: "Erhöhter Schutz- und Dokumentationsbedarf",
      details: "Verpackung, Vorschadendokumentation und persönliche Übergabe reduzieren Transportschäden.",
      taskTitle: "Empfindliches Inventar und Schutzverpackung freigeben",
      taskDetails: "Gegenstände fotografieren, eindeutig kennzeichnen und passende Spezialverpackung kontrollieren.",
      role: "crewLead",
      requiresEvidence: true,
    });
  }
  if ((planning?.movingBoxes ?? 0) > 0) {
    addRule({
      id: "moving-boxes",
      moduleId: "packing-logistics",
      moduleLabel: "Packmittellogistik",
      reason: `${planning?.movingBoxes} Kartons vorgesehen`,
      severity: "low",
      title: "Packmittel müssen rechtzeitig verfügbar sein",
      details: "Fehlende oder verspätete Kartons gefährden den geplanten Ablauf.",
      taskTitle: `${planning?.movingBoxes} Umzugskartons bereitstellen und Übergabe bestätigen`,
      taskDetails: "Liefertermin, Menge und Rückgabe- beziehungsweise Kaufregelung dokumentieren.",
      role: "office",
      blocksOnNegative: false,
    });
  }
  if ((planning?.dismantlingHours ?? 0) > 0) {
    addRule({
      id: "assembly-work",
      moduleId: "assembly",
      moduleLabel: "De-/Montage",
      reason: `${planning?.dismantlingHours} Stunden kalkuliert`,
      severity: "low",
      title: "Montageumfang benötigt Werkzeug- und Teileplanung",
      details: "Möbel, Befestigungen und benötigte Fachkenntnisse vorab abgleichen.",
      taskTitle: "De-/Montageumfang und Werkzeugbedarf bestätigen",
      taskDetails: "Betroffene Möbel, Herstellerhinweise, Ersatzbeschläge und Wandbefestigungen erfassen.",
      role: "installer",
      blocksOnNegative: false,
    });
  }
  if (
    (planning?.repairAreaM2 ?? 0) > 0 ||
    (planning?.plasterAreaM2 ?? 0) > 0 ||
    planning?.removeOldWallpaper
  ) {
    addRule({
      id: "surface-preparation",
      moduleId: "surface-preparation",
      moduleLabel: "Untergrundvorbereitung",
      reason: "Spachtel-, Putz- oder Tapetenarbeiten kalkuliert",
      severity: "medium",
      title: "Untergrundzustand beeinflusst Aufwand und Ergebnis",
      details: "Feuchtigkeit, lose Schichten und nicht sichtbare Schäden können Zusatzarbeiten verursachen.",
      taskTitle: "Untergrund prüfen und Renovierungsaufbau freigeben",
      taskDetails: "Haftung, Feuchtigkeit, Risse und notwendige Trocknungszeiten fotografisch dokumentieren.",
      role: "painter",
      requiresEvidence: true,
    });
  }
  if ((planning?.clearanceHazardousVolumeM3 ?? 0) > 0) {
    addRule({
      id: "hazardous-waste",
      moduleId: "hazardous-waste",
      moduleLabel: "Sonderabfall",
      reason: `${planning?.clearanceHazardousVolumeM3} m³ erfasst`,
      severity: "high",
      title: "Sonderabfall erfordert getrennte und zugelassene Entsorgung",
      details: "Unklare Stoffe dürfen nicht gemeinsam mit regulärem Räumungsgut transportiert werden.",
      taskTitle: "Sonderabfall klassifizieren und Entsorgungsweg freigeben",
      taskDetails: "Stoffart, Menge, Verpackung, Transport und zugelassenen Entsorger dokumentieren.",
      role: "projectLead",
      requiresEvidence: true,
    });
  }
  if ((planning?.clearanceHeavyItems ?? 0) > 0) {
    addRule({
      id: "clearance-heavy-items",
      moduleId: "special-items",
      moduleLabel: "Sonder- und Schwergut",
      reason: `${planning?.clearanceHeavyItems} schwere Gegenstände erfasst`,
      severity: "medium",
      title: "Schwere Gegenstände erhöhen Arbeitsschutzrisiko",
      details: "Gewicht, Demontage, Trageweg und geeignete Hilfsmittel müssen geklärt sein.",
      taskTitle: "Schwergut und sichere Hebe-/Tragetechnik freigeben",
      taskDetails: "Gegenstände, Gewichte, Hilfsmittel und erforderliche Teamstärke dokumentieren.",
      role: "crewLead",
      requiresEvidence: true,
    });
  }
  if ((planning?.clearanceContainerCount ?? 0) > 0) {
    addRule({
      id: "clearance-container",
      moduleId: "container",
      moduleLabel: "Containerlogistik",
      reason: `${planning?.clearanceContainerCount} Container vorgesehen`,
      severity: "medium",
      title: "Containerstandplatz und Abholung müssen gesichert sein",
      details: "Genehmigung, Untergrund, Zufahrt und zulässige Befüllung vorab prüfen.",
      taskTitle: "Container, Standplatz, Genehmigung und Abholung bestätigen",
      taskDetails: "Liefer- und Abholzeit sowie verantwortlichen Entsorger dokumentieren.",
      role: "office",
      requiresEvidence: true,
    });
  }
  if (
    planning?.serviceTypes?.includes("storage") ||
    (planning?.storageVolumeM3 ?? 0) > 0
  ) {
    addRule({
      id: "storage-conditions",
      moduleId: "storage-conditions",
      moduleLabel: "Lagerbedingungen",
      reason: `${planning?.storageVolumeM3 ?? 0} m³ für ${planning?.storageMonths ?? 0} Monate`,
      severity: "medium",
      title: "Lagerplatz und Vertragsdaten müssen verbindlich sein",
      details: "Kapazität, Klima, Zugriff, Versicherung und Lagerdauer beeinflussen die sichere Einlagerung.",
      taskTitle: "Lagerplatz, Bestandsaufnahme und Vertragsdaten freigeben",
      taskDetails: "Lagerzone, Volumen, Laufzeit, Zugriff und Versicherungsumfang dokumentieren.",
      role: "office",
      requiresEvidence: true,
    });
  }

  return { modules, risks, tasks };
}

export function createOrderFromOffer(
  offer: CrmOfferDocument,
  orderId: string,
  acceptedAt: number
): CrmOrder {
  const serviceTypes = [...new Set(offer.planning?.serviceTypes ?? [])];
  const automationPlan = buildOfferAutomation(offer);
  const templates = [
    ...generalTasks,
    ...serviceTypes.flatMap((serviceType) => serviceTasks[serviceType] ?? []),
    ...getDynamicTasks(offer),
    ...automationPlan.tasks,
  ];
  const uniqueTemplates = templates.filter(
    (template, index) =>
      templates.findIndex(
        (candidate) =>
          candidate.phase === template.phase &&
          candidate.title.toLocaleLowerCase("de-DE") ===
            template.title.toLocaleLowerCase("de-DE")
      ) === index
  );

  return {
    id: orderId,
    offerId: offer.id,
    offerTitle: offer.title || "Auftrag",
    offerNumber: offer.offerNumber?.trim() || `ANG-${offer.id.slice(0, 8).toUpperCase()}`,
    serviceTypes,
    serviceDate: offer.planning?.date ?? "",
    status: "active",
    tasks: uniqueTemplates.map((template, index) => ({
      ...template,
      id: `${orderId}-${index + 1}`,
      completed: false,
      value: "",
      note: "",
      evidence: [],
    })),
    automation: {
      version: 1,
      generatedAt: acceptedAt,
      modules: automationPlan.modules,
      risks: automationPlan.risks,
    },
    acceptedAt,
    updatedAt: acceptedAt,
  };
}

export function synchronizeOrderWithOffer(
  order: CrmOrder,
  offer: CrmOfferDocument,
  synchronizedAt: number
): CrmOrder {
  const generatedOrder = createOrderFromOffer(
    offer,
    order.id,
    order.acceptedAt
  );
  const existingByAutomationKey = new Map(
    order.tasks
      .filter((orderTask) => orderTask.automationKey)
      .map((orderTask) => [orderTask.automationKey, orderTask])
  );
  const existingBySignature = new Map(
    order.tasks.map((orderTask) => [
      `${orderTask.phase}:${orderTask.title.toLocaleLowerCase("de-DE")}`,
      orderTask,
    ])
  );
  const generatedTasks = generatedOrder.tasks.map((generatedTask) => {
    const existingTask =
      (generatedTask.automationKey
        ? existingByAutomationKey.get(generatedTask.automationKey)
        : undefined) ??
      existingBySignature.get(
        `${generatedTask.phase}:${generatedTask.title.toLocaleLowerCase("de-DE")}`
      );
    if (!existingTask) return generatedTask;
      const synchronizedTask = normalizeCrmOrderTask({
      ...generatedTask,
      role: existingTask.role,
      completed: existingTask.completed,
        value: existingTask.value,
        note: existingTask.note,
        evidence: existingTask.evidence,
      });
      if (existingTask.completedAt !== undefined) {
        synchronizedTask.completedAt = existingTask.completedAt;
      }
      if (existingTask.answer !== undefined) {
        synchronizedTask.answer = existingTask.answer;
      }
      return synchronizedTask;
  });
  const manualTasks = order.tasks.filter(
    (orderTask) => orderTask.custom || orderTask.templateId
  );
  const tasks = [...generatedTasks, ...manualTasks].map(normalizeCrmOrderTask);

  return {
    ...order,
    offerTitle: generatedOrder.offerTitle,
    offerNumber: generatedOrder.offerNumber,
    serviceTypes: generatedOrder.serviceTypes,
    serviceDate: generatedOrder.serviceDate,
    automation: {
      ...generatedOrder.automation!,
      generatedAt: synchronizedAt,
    },
    tasks,
    status: getCrmOrderStatus(tasks),
    updatedAt: synchronizedAt,
  };
}

export const CRM_ORDER_PHASES: Array<{
  id: CrmOrderTaskPhase;
  label: string;
}> = [
  { id: "before", label: "Vor dem Auftrag" },
  { id: "during", label: "Während des Auftrags" },
  { id: "after", label: "Nach dem Auftrag" },
];

export const CRM_ORDER_SERVICE_LABELS: Record<string, string> = {
  move: "Umzug",
  seniorMove: "Seniorenumzug",
  furnitureAssembly: "De-/Montage",
  painting: "Streicharbeiten",
  clearance: "Entrümpelung",
  packing: "Einpackservice",
  storage: "Einlagerung",
  extra: "Zusatzleistung",
  general: "Allgemein",
};

export const CRM_ORDER_TASK_KIND_LABELS: Record<CrmOrderTaskKind, string> = {
  task: "Aufgabe",
  check: "Prüfung",
  measurement: "Messwert",
  evidence: "Nachweis",
  approval: "Freigabe",
};

export const CRM_ORDER_ROLE_LABELS: Record<CrmOrderTaskRole, string> = {
  office: "Büro / Disposition",
  projectLead: "Projektleitung",
  crewLead: "Teamleitung",
  driver: "Fahrer",
  installer: "Monteur",
  painter: "Maler",
  specialist: "Fachkraft",
  customer: "Kunde",
};

export function normalizeCrmOrderTask(orderTask: CrmOrderTask): CrmOrderTask {
  return {
    ...orderTask,
    kind: orderTask.kind ?? "task",
    role:
      orderTask.role ??
      (orderTask.phase === "before" ? "office" : "crewLead"),
    required: orderTask.required ?? true,
    requiresEvidence: orderTask.requiresEvidence ?? false,
    blocksOnNegative: orderTask.blocksOnNegative ?? false,
    value: orderTask.value ?? "",
    note: orderTask.note ?? "",
    evidence: orderTask.evidence ?? [],
  };
}

export function normalizeCrmOrder(order: CrmOrder): CrmOrder {
  return {
    ...order,
    tasks: (order.tasks ?? []).map(normalizeCrmOrderTask),
  };
}

export function isCrmOrderTaskComplete(orderTask: CrmOrderTask) {
  const evidenceComplete =
    !orderTask.requiresEvidence || orderTask.evidence.length > 0;
  if (!evidenceComplete) return false;

  switch (orderTask.kind) {
    case "check":
      return (
        orderTask.answer === "yes" ||
        ((orderTask.answer === "no" ||
          orderTask.answer === "notApplicable") &&
          Boolean(orderTask.note.trim()))
      );
    case "measurement":
    case "approval":
      return Boolean(orderTask.value.trim());
    case "evidence":
      return orderTask.evidence.length > 0;
    default:
      return orderTask.completed;
  }
}

export function isCrmOrderTaskBlocking(orderTask: CrmOrderTask) {
  return orderTask.blocksOnNegative && orderTask.answer === "no";
}

export function getCrmOrderStatus(tasks: CrmOrderTask[]) {
  const requiredTasks = tasks.filter((orderTask) => orderTask.required);
  return requiredTasks.length > 0 &&
    requiredTasks.every(isCrmOrderTaskComplete) &&
    !tasks.some(isCrmOrderTaskBlocking)
    ? ("completed" as const)
    : ("active" as const);
}

export type CrmOrderQualityGate = {
  id: "planning" | "ready" | "execution" | "close";
  label: string;
  complete: boolean;
  detail: string;
};

export function getCrmOrderQualityGates(order: CrmOrder): CrmOrderQualityGate[] {
  const requiredBefore = order.tasks.filter(
    (orderTask) => orderTask.required && orderTask.phase === "before"
  );
  const requiredDuring = order.tasks.filter(
    (orderTask) => orderTask.required && orderTask.phase === "during"
  );
  const requiredAfter = order.tasks.filter(
    (orderTask) => orderTask.required && orderTask.phase === "after"
  );
  const blockers = order.tasks.filter(isCrmOrderTaskBlocking);
  const openCount = (tasks: CrmOrderTask[]) =>
    tasks.filter((orderTask) => !isCrmOrderTaskComplete(orderTask)).length;
  const beforeOpen = openCount(requiredBefore);
  const duringOpen = openCount(requiredDuring);
  const afterOpen = openCount(requiredAfter);

  return [
    {
      id: "planning",
      label: "Auftrag geplant",
      complete: Boolean(order.serviceDate) && requiredBefore.length > 0,
      detail: !order.serviceDate
        ? "Leistungstermin fehlt"
        : requiredBefore.length === 0
          ? "Keine Vorbereitungsaufgaben"
          : `${requiredBefore.length} Pflichtaufgaben eingeplant`,
    },
    {
      id: "ready",
      label: "Einsatzbereit",
      complete: beforeOpen === 0 && blockers.length === 0,
      detail:
        blockers.length > 0
          ? `${blockers.length} Blocker offen`
          : beforeOpen > 0
            ? `${beforeOpen} Vorbereitungen offen`
            : "Alle Voraussetzungen erfüllt",
    },
    {
      id: "execution",
      label: "Leistung vollständig",
      complete: duringOpen === 0 && blockers.length === 0,
      detail:
        blockers.length > 0
          ? `${blockers.length} Blocker offen`
          : duringOpen > 0
            ? `${duringOpen} Arbeiten offen`
            : "Ausführung vollständig",
    },
    {
      id: "close",
      label: "Auftrag abschließbar",
      complete:
        beforeOpen === 0 &&
        duringOpen === 0 &&
        afterOpen === 0 &&
        blockers.length === 0,
      detail:
        blockers.length > 0
          ? `${blockers.length} Blocker offen`
          : afterOpen > 0
            ? `${afterOpen} Abschlussaufgaben offen`
            : "Pflichtaufgaben und Nachweise vollständig",
    },
  ];
}

const templateItem = (
  id: string,
  phase: CrmOrderTaskPhase,
  title: string,
  details: string,
  options: Partial<
    Pick<
      CrmTaskTemplateItem,
      "kind" | "role" | "required" | "requiresEvidence" | "blocksOnNegative"
    >
  > = {}
): CrmTaskTemplateItem => ({ id, phase, title, details, ...options });

export const CRM_TASK_TEMPLATE_CATALOG_VERSION = 2;

export const DEFAULT_CRM_TASK_TEMPLATES: CrmTaskTemplate[] = [
  {
    id: "default-kitchen",
    name: "Küchenmontage",
    description:
      "Prüfung von Raum, Anschlüssen, Küchenplanung und fachgerechter Montage.",
    createdAt: 0,
    updatedAt: 0,
    tasks: [
      {
        id: "kitchen-plan",
        phase: "before",
        title: "Küchenplanung und Schrankmaße vollständig prüfen",
        details: "Schrankbreiten, Hochschränke, Blenden, Arbeitsplatten und Einbaugeräte mit dem Plan abgleichen.",
      },
      {
        id: "kitchen-room",
        phase: "before",
        title: "Raummaße, Winkel, Wandverlauf und Bodenhöhe kontrollieren",
        details: "Nischenmaß, Wandabstände, Sockelhöhe und mögliche Unebenheiten vor Montagebeginn dokumentieren.",
      },
      {
        id: "kitchen-water",
        phase: "before",
        title: "Wasser- und Abwasseranschlüsse auf Position und Zustand prüfen",
        details: "Erreichbarkeit, Absperrventile, Durchmesser und Abstand zu Spüle und Geschirrspüler kontrollieren.",
        kind: "check",
        role: "installer",
        required: true,
        requiresEvidence: true,
        blocksOnNegative: true,
      },
      {
        id: "kitchen-electric",
        phase: "before",
        title: "Steckdosen und Elektroanschlüsse mit Geräteplan abgleichen",
        details: "Separate Stromkreise, Herdanschluss, Absicherung und Erreichbarkeit der Anschlüsse prüfen.",
        kind: "check",
        role: "specialist",
        required: true,
        requiresEvidence: true,
        blocksOnNegative: true,
      },
      {
        id: "kitchen-ventilation",
        phase: "before",
        title: "Dunstabzug, Abluftführung und Lüftungsart klären",
        details: "Abluftöffnung und Rohrmaß prüfen oder Umluftbetrieb samt Filtern bestätigen.",
      },
      {
        id: "kitchen-appliances",
        phase: "before",
        title: "Einbaugeräte, Ausschnittmaße und Anschlussarten kontrollieren",
        details: "Modell, Nischenmaß, Türanschlag und erforderliche Anschlüsse für jedes Gerät prüfen.",
      },
      {
        id: "kitchen-walls",
        phase: "before",
        title: "Wandbeschaffenheit und Befestigungspunkte prüfen",
        details: "Tragfähigkeit, Leitungsverlauf und passendes Befestigungsmaterial für Hängeschränke klären.",
        kind: "check",
        role: "installer",
        required: true,
        requiresEvidence: false,
        blocksOnNegative: true,
      },
      {
        id: "kitchen-access",
        phase: "before",
        title: "Transportweg und Platz für Montagearbeiten sicherstellen",
        details: "Treppenhaus, Türen, Aufzug, Zwischenlagerung und Schutz der Laufwege prüfen.",
      },
      {
        id: "kitchen-cabinets",
        phase: "during",
        title: "Schränke lot- und waagerecht ausrichten und sicher verbinden",
        details: "Montagereihenfolge, Fugenbild, Blenden und Abstände gemäß Küchenplanung einhalten.",
      },
      {
        id: "kitchen-worktop",
        phase: "during",
        title: "Arbeitsplatte und Ausschnitte passgenau herstellen",
        details: "Schnittkanten versiegeln sowie Kochfeld- und Spülenausschnitt nach Herstellerangaben ausführen.",
      },
      {
        id: "kitchen-connections",
        phase: "during",
        title: "Geräte und Anschlüsse fachgerecht herstellen lassen",
        details: "Elektro-, Gas- und sonstige Fachanschlüsse ausschließlich durch entsprechend berechtigte Fachkräfte ausführen lassen.",
        kind: "approval",
        role: "specialist",
        required: true,
        requiresEvidence: true,
        blocksOnNegative: false,
      },
      {
        id: "kitchen-sealing",
        phase: "during",
        title: "Spüle, Arbeitsplatte und Wandanschlüsse abdichten",
        details: "Alle wasserbelasteten Übergänge sauber und dauerhaft versiegeln.",
      },
      {
        id: "kitchen-leak-test",
        phase: "after",
        title: "Wasseranschlüsse auf Dichtheit prüfen",
        details: "Armatur, Siphon, Spülmaschine und alle Verbindungen unter Betriebsdruck kontrollieren.",
        kind: "check",
        role: "installer",
        required: true,
        requiresEvidence: true,
        blocksOnNegative: true,
      },
      {
        id: "kitchen-function-test",
        phase: "after",
        title: "Einbaugeräte und Dunstabzug auf Funktion prüfen",
        details: "Gemeinsam mit dem Kunden einen kurzen Funktionstest durchführen und Auffälligkeiten dokumentieren.",
        kind: "check",
        role: "installer",
        required: true,
        requiresEvidence: false,
        blocksOnNegative: true,
      },
      {
        id: "kitchen-adjustment",
        phase: "after",
        title: "Türen, Schubladen, Fronten und Fugenbild kontrollieren",
        details: "Scharniere und Auszüge einstellen sowie Kollisionsfreiheit und gleichmäßige Abstände prüfen.",
      },
      {
        id: "kitchen-handover",
        phase: "after",
        title: "Küche reinigen, dokumentieren und mit dem Kunden abnehmen",
        details: "Schutzfolien und Verpackung entfernen, Fotos erstellen und offene Punkte schriftlich festhalten.",
        kind: "approval",
        role: "customer",
        required: true,
        requiresEvidence: true,
        blocksOnNegative: false,
      },
    ],
  },
  {
    id: "default-move",
    name: "Umzug",
    description:
      "Komplette Prüfung und Durchführung eines privaten oder gewerblichen Umzugs.",
    createdAt: 0,
    updatedAt: 0,
    tasks: [
      templateItem("move-scope", "before", "Umzugsvolumen und Leistungsumfang bestätigen", "Inventarliste, Kartonanzahl, Zusatzleistungen und ausgeschlossene Arbeiten mit dem Angebot abgleichen."),
      templateItem("move-access", "before", "Zugänge an Start- und Zieladresse prüfen", "Etagen, Aufzüge, Treppen, Türbreiten, Tragestrecken und Schlüsselzugang kontrollieren.", { kind: "check", role: "crewLead", blocksOnNegative: true }),
      templateItem("move-parking", "before", "Parkflächen und Halteverbotszonen sicherstellen", "Genehmigungen, Beschilderungsfristen und Fahrzeugabstände an beiden Adressen prüfen.", { kind: "check", role: "office", blocksOnNegative: true, requiresEvidence: true }),
      templateItem("move-crew", "before", "Personal, Fahrzeuge und Zeitplan final einteilen", "Teamstärke, Fahrzeugkapazität, Fahrerlaubnisse, Pausen und voraussichtliche Fahrzeiten berücksichtigen."),
      templateItem("move-material", "before", "Schutz- und Verpackungsmaterial vollständig verladen", "Decken, Gurte, Stretchfolie, Kantenschutz, Matratzenhüllen, Werkzeug und Bodenschutz prüfen."),
      templateItem("move-briefing", "during", "Team vor Ort einweisen und Verantwortlichkeiten verteilen", "Besonderheiten, empfindliche Gegenstände, Ladefolge und Ansprechpartner gemeinsam durchgehen."),
      templateItem("move-protection", "during", "Gebäude und Laufwege schützen", "Böden, Geländer, Türen, Aufzüge und empfindliche Kanten an Start und Ziel abdecken."),
      templateItem("move-inventory", "during", "Inventar kontrolliert übernehmen und kennzeichnen", "Vorschäden dokumentieren, Raumzuordnung markieren und Vollständigkeit beim Verladen prüfen.", { kind: "evidence", role: "crewLead" }),
      templateItem("move-loading", "during", "Fahrzeug nach Ladeplan beladen und Ladung sichern", "Gewichtsverteilung, Formschluss, Zurrpunkte und Schutz empfindlicher Möbel kontrollieren."),
      templateItem("move-unloading", "during", "Inventar am Zielort vollständig und raumgerecht abstellen", "Beschriftungen beachten, Möbel nach Kundenwunsch positionieren und Laufwege freihalten."),
      templateItem("move-final-check", "after", "Startadresse, Fahrzeuge und Zieladresse vollständig kontrollieren", "Alle Räume, Keller, Dachboden, Ladeflächen und Fahrerhäuser auf Restgegenstände prüfen."),
      templateItem("move-handover", "after", "Umzug dokumentieren und mit dem Kunden abnehmen", "Schäden, Abweichungen, Zusatzzeiten und offene Arbeiten schriftlich und mit Fotos festhalten.", { kind: "approval", role: "customer", requiresEvidence: true }),
    ],
  },
  {
    id: "default-senior-move",
    name: "Seniorenumzug",
    description:
      "Sorgfältiger Umzug mit fester Betreuung, Orientierung und vollständiger Grundordnung.",
    createdAt: 0,
    updatedAt: 0,
    tasks: [
      templateItem("senior-contact", "before", "Feste Betreuungsperson und Angehörige abstimmen", "Erreichbarkeit, Entscheidungsbefugnis und Ansprechpartner für Start- und Zieladresse dokumentieren."),
      templateItem("senior-plan", "before", "Einrichtungsplan für den Zielort erstellen", "Möbelpositionen, Laufwege, benötigte Alltagsgegenstände und nicht mitziehendes Inventar festlegen."),
      templateItem("senior-medical", "before", "Wichtige persönliche und medizinische Gegenstände sichern", "Medikamente, Dokumente, Hilfsmittel und Wertsachen separat kennzeichnen und nicht verladen."),
      templateItem("senior-timing", "before", "Ausreichend Zeit, Pausen und ruhigen Ablauf einplanen", "Zeitdruck vermeiden und Belastbarkeit sowie notwendige Ruhezeiten berücksichtigen."),
      templateItem("senior-labels", "during", "Inventar eindeutig nach Zielraum und Priorität kennzeichnen", "Vertraute und sofort benötigte Gegenstände besonders markieren."),
      templateItem("senior-support", "during", "Kunden kontinuierlich informieren und betreuen", "Änderungen erklären, Rückfragen bündeln und eine feste Kontaktperson im Team beibehalten."),
      templateItem("senior-essentials", "during", "Grundausstattung am Zielort zuerst aufbauen", "Bett, Sitzmöglichkeit, Beleuchtung, Telefon, Bad und wichtige Küchengegenstände priorisieren."),
      templateItem("senior-safety", "after", "Sichere und barrierearme Laufwege herstellen", "Stolperstellen, lose Kabel, Teppichkanten und blockierte Türen beseitigen."),
      templateItem("senior-orientation", "after", "Vertraute Grundordnung und Orientierung schaffen", "Wichtige Gegenstände sichtbar und erreichbar platzieren sowie Schrankinhalte nachvollziehbar zuordnen."),
      templateItem("senior-handover", "after", "Übergabe mit Kunde oder Betreuungsperson durchführen", "Vollständigkeit, offene Punkte, Schlüssel und wichtige Unterlagen gemeinsam prüfen."),
    ],
  },
  {
    id: "default-furniture-assembly",
    name: "De-/Montage von Möbeln",
    description:
      "Sichere Demontage, Kennzeichnung, Transportvorbereitung und fachgerechte Montage.",
    createdAt: 0,
    updatedAt: 0,
    tasks: [
      templateItem("assembly-scope", "before", "Möbelstücke und vereinbarten Montageumfang erfassen", "Hersteller, Modell, Zustand, Sonderkonstruktionen und nicht demontierbare Teile dokumentieren."),
      templateItem("assembly-instructions", "before", "Montageanleitungen und benötigte Werkzeuge beschaffen", "Spezialwerkzeug, Bits, Dübel, Befestigungsmittel und Ersatzbeschläge einplanen."),
      templateItem("assembly-measure", "before", "Stellplätze und Transportwege ausmessen", "Türbreiten, Deckenhöhe, Nischen, Sockelleisten und Öffnungsbereiche prüfen.", { kind: "measurement", role: "installer", blocksOnNegative: false }),
      templateItem("assembly-parts", "during", "Bauteile und Beschläge je Möbelstück kennzeichnen", "Schrauben und Kleinteile in beschrifteten Beuteln sicher dem jeweiligen Möbel zuordnen."),
      templateItem("assembly-disassemble", "during", "Möbel materialschonend demontieren", "Bauteile nicht erzwingen, Glas und empfindliche Oberflächen separat sichern und Vorschäden festhalten."),
      templateItem("assembly-protect", "during", "Bauteile transportsicher verpacken", "Kanten, Fronten, Spiegel, Glasböden und lange Bauteile gegen Bruch und Verzug schützen."),
      templateItem("assembly-build", "during", "Möbel vollständig und nach Herstellervorgabe montieren", "Verbindungen korrekt einsetzen, Rückwände befestigen und Bauteile nicht überziehen."),
      templateItem("assembly-anchor", "during", "Kippgefährdete Möbel sicher befestigen", "Wandaufbau und Leitungsverlauf prüfen sowie geeignete Befestigungsmittel verwenden."),
      templateItem("assembly-adjust", "after", "Türen, Schubladen und Beschläge einstellen", "Fugenbild, Leichtgängigkeit, Anschläge und Kollisionsfreiheit kontrollieren."),
      templateItem("assembly-final", "after", "Stabilität, Vollständigkeit und Oberflächen prüfen", "Übrige Teile erklären, Schäden dokumentieren und Möbel mit dem Kunden abnehmen."),
    ],
  },
  {
    id: "default-painting",
    name: "Streich- und Renovierungsarbeiten",
    description:
      "Untergrundprüfung, Schutzmaßnahmen, fachgerechter Farbaufbau und Endkontrolle.",
    createdAt: 0,
    updatedAt: 0,
    tasks: [
      templateItem("paint-scope", "before", "Flächen, Farbtöne und Qualitätsstufe bestätigen", "Wände, Decken, Türen, Anzahl der Anstriche und ausgeschlossene Bereiche eindeutig festlegen."),
      templateItem("paint-surface", "before", "Untergrund auf Tragfähigkeit und Schäden prüfen", "Feuchtigkeit, Schimmel, Risse, lose Altanstriche, Nikotin und stark saugende Flächen dokumentieren.", { kind: "check", role: "painter", blocksOnNegative: true, requiresEvidence: true }),
      templateItem("paint-material", "before", "Materialmenge und Produktsystem kontrollieren", "Farbe, Grundierung, Spachtel, Dichtstoffe, Abdeckmaterial und passende Werkzeuge bereitstellen."),
      templateItem("paint-color", "before", "Farbtöne anhand Muster und Lichtverhältnissen freigeben", "Farbnummern und Zuordnung je Raum schriftlich festhalten.", { kind: "approval", role: "customer" }),
      templateItem("paint-cover", "during", "Räume und nicht zu bearbeitende Flächen vollständig schützen", "Böden, Möbel, Fenster, Schalter, Heizkörper und Einbauten sauber abdecken und abkleben."),
      templateItem("paint-prep", "during", "Untergrund reinigen und fachgerecht vorbereiten", "Löcher und Risse schließen, lose Schichten entfernen, schleifen, entstauben und grundieren."),
      templateItem("paint-application", "during", "Beschichtung gleichmäßig nach Herstellervorgabe auftragen", "Verbrauch, Temperatur, Trocknungszeiten und Nass-in-nass-Verarbeitung beachten."),
      templateItem("paint-coats", "during", "Deckkraft nach jedem Anstrich kontrollieren", "Durchschläge, Ansätze und Farbunterschiede prüfen und erforderlichen Folgeanstrich dokumentieren."),
      templateItem("paint-edges", "after", "Kanten, Anschlüsse und Oberflächen bei gutem Licht prüfen", "Läufer, Spritzer, Fehlstellen, unsaubere Linien und sichtbare Ausbesserungen nacharbeiten."),
      templateItem("paint-clean", "after", "Abdeckungen entfernen und Arbeitsbereich reinigen", "Klebebänder rechtzeitig abziehen, Beschläge säubern und Materialreste fachgerecht entsorgen."),
      templateItem("paint-handover", "after", "Farben und ausgeführte Flächen dokumentieren und abnehmen", "Restfarbe beschriften, Produktdaten festhalten und offene Punkte mit dem Kunden protokollieren."),
    ],
  },
  {
    id: "default-clearance",
    name: "Entrümpelung",
    description:
      "Systematische Räumung mit Trennung, Verwertung, Entsorgung und sauberer Übergabe.",
    createdAt: 0,
    updatedAt: 0,
    tasks: [
      templateItem("clearance-scope", "before", "Räumungsbereiche und ausgeschlossene Gegenstände markieren", "Alle Räume, Nebenflächen, Einbauten und Gegenstände mit besonderer Behandlung eindeutig festlegen."),
      templateItem("clearance-values", "before", "Wertsachen, Dokumente und zu erhaltende Gegenstände sichern", "Separate Übergabezone einrichten und Freigabe durch den Kunden dokumentieren."),
      templateItem("clearance-hazard", "before", "Sonderabfälle und Gefahrstoffe identifizieren", "Farben, Chemikalien, Batterien, Gasflaschen, Asbestverdacht und Elektrogeräte getrennt planen.", { kind: "check", role: "projectLead", blocksOnNegative: true, requiresEvidence: true }),
      templateItem("clearance-logistics", "before", "Container, Fahrzeuge und Entsorgungswege organisieren", "Standplatz, Genehmigung, Kapazität und Annahmebedingungen der Entsorger klären."),
      templateItem("clearance-separate", "during", "Gegenstände konsequent nach Stoffströmen trennen", "Verwertung, Spende, Holz, Metall, Elektro, Sperrmüll und Restabfall getrennt erfassen."),
      templateItem("clearance-dismantle", "during", "Vereinbarte Möbel und Einbauten sicher demontieren", "Versorgungsleitungen beachten und nicht beauftragte Bauteile vor Beschädigung schützen."),
      templateItem("clearance-transport", "during", "Abfälle sicher verladen und Transportwege sauber halten", "Scharfe Kanten, Staub, Flüssigkeiten und zulässige Fahrzeuglast berücksichtigen."),
      templateItem("clearance-complete", "after", "Alle Räumungsflächen auf Restgegenstände prüfen", "Schränke, Nischen, Keller, Dachboden, Außenflächen und Containerstellplatz kontrollieren."),
      templateItem("clearance-clean", "after", "Vereinbarten Reinigungszustand herstellen", "Flächen besenrein hinterlassen und grobe Verschmutzungen sowie Befestigungsreste entfernen."),
      templateItem("clearance-receipts", "after", "Entsorgungs- und Verwertungsnachweise sammeln", "Wiegescheine, Übergabebelege, Fotos und Mengen für Nachkalkulation und Kunde dokumentieren.", { kind: "evidence", role: "office" }),
      templateItem("clearance-handover", "after", "Geräumte Bereiche gemeinsam abnehmen", "Schlüssel, offene Punkte, Abweichungen und eventuell gefundene persönliche Gegenstände übergeben."),
    ],
  },
  {
    id: "default-packing",
    name: "Ein- und Auspackservice",
    description:
      "Strukturiertes Verpacken, Kennzeichnen und kontrolliertes Auspacken von Inventar.",
    createdAt: 0,
    updatedAt: 0,
    tasks: [
      templateItem("packing-scope", "before", "Packumfang und vom Kunden selbst verpackte Bereiche festlegen", "Räume, Schränke, Wertsachen, Dokumente und ausgeschlossene Gegenstände eindeutig abgrenzen."),
      templateItem("packing-material", "before", "Passendes Packmaterial in ausreichender Menge bereitstellen", "Kartons, Bücherkartons, Kleiderboxen, Seidenpapier, Luftpolster, Klebeband und Etiketten prüfen."),
      templateItem("packing-system", "before", "Beschriftungs- und Nummerierungssystem festlegen", "Zielraum, Inhalt, Priorität, Zerbrechlichkeit und Kartonnummer eindeutig kennzeichnen."),
      templateItem("packing-valuables", "before", "Wertsachen und nicht transportfähige Güter aussortieren", "Geld, Schmuck, Dokumente, Medikamente, Gefahrgut und verderbliche Waren dem Kunden übergeben."),
      templateItem("packing-room", "during", "Raumweise und nach Gegenstandsart verpacken", "Zusammengehörige Dinge beieinander halten und Kartons nicht mit unterschiedlichen Zielräumen mischen."),
      templateItem("packing-fragile", "during", "Empfindliches Inventar einzeln schützen", "Glas, Geschirr, Bilder, Elektronik und Hohlräume stoßsicher polstern und deutlich markieren."),
      templateItem("packing-weight", "during", "Kartons sicher befüllen und zulässiges Gewicht einhalten", "Schwere Gegenstände nach unten, Hohlräume füllen und Kartons vollständig verschließen."),
      templateItem("packing-count", "after", "Kartons zählen und Packliste vervollständigen", "Nummern, Sonderkartons und unverpackte Gegenstände pro Raum dokumentieren."),
      templateItem("unpacking", "after", "Inventar nach Kundenwunsch auspacken und zuordnen", "Gegenstände in vereinbarte Schränke oder Bereiche einräumen und Verpackung gesammelt ablegen."),
      templateItem("packing-waste", "after", "Packmaterial und Schäden dokumentieren", "Wiederverwendbares Material trennen, Abfall entsorgen und Bruch oder fehlende Gegenstände melden."),
    ],
  },
  {
    id: "default-storage",
    name: "Einlagerung",
    description:
      "Dokumentierte, geschützte und nachvollziehbare Einlagerung mit Bestandskontrolle.",
    createdAt: 0,
    updatedAt: 0,
    tasks: [
      templateItem("storage-contract", "before", "Lagerdauer, Zugriffsregeln und Versicherungsumfang bestätigen", "Vertragsbeginn, Verlängerung, Kündigung, Zutritt und Haftungsgrenzen mit dem Kunden klären."),
      templateItem("storage-suitability", "before", "Lagergut auf Eignung und ausgeschlossene Güter prüfen", "Keine verderblichen Waren, Gefahrstoffe, feuchten Gegenstände oder unzulässigen Wertgegenstände einlagern."),
      templateItem("storage-volume", "before", "Lagervolumen und Lagerplatz planen", "Stellfläche, Stapelhöhe, schwere Teile und benötigte Zugänglichkeit berücksichtigen."),
      templateItem("storage-inventory", "before", "Einlagerungsliste mit Zustand und Fotos erstellen", "Jedes Packstück nummerieren, Vorschäden dokumentieren und Eigentümer eindeutig zuordnen.", { kind: "evidence", role: "crewLead" }),
      templateItem("storage-pack", "during", "Lagergut trocken und langfristig schützen", "Möbel reinigen, demontieren, belüftet abdecken und empfindliche Flächen gegen Druck schützen."),
      templateItem("storage-label", "during", "Alle Packstücke dauerhaft und lesbar kennzeichnen", "Kundennummer, laufende Nummer, Inhalt, Lagehinweis und Zerbrechlichkeit anbringen."),
      templateItem("storage-place", "during", "Lagergut standsicher und nachvollziehbar einordnen", "Schwere Gegenstände unten, Laufwege frei und häufig benötigte Gegenstände zugänglich platzieren."),
      templateItem("storage-climate", "after", "Lagerbedingungen und Schutzmaßnahmen kontrollieren", "Trockenheit, Belüftung, Schädlingsschutz, Bodenabstand und sichere Abdeckung prüfen.", { kind: "check", role: "crewLead", blocksOnNegative: true, requiresEvidence: true }),
      templateItem("storage-register", "after", "Lagerregister und Stellplatz aktualisieren", "Packstücknummern, Lagerzone, Datum und Besonderheiten im Bestand dokumentieren."),
      templateItem("storage-confirmation", "after", "Einlagerungsbestätigung an den Kunden übergeben", "Bestandsliste, Fotos, Vertragsdaten, Zugangsinformationen und Ansprechpartner bereitstellen."),
    ],
  },
];
