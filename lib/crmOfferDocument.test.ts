import assert from "node:assert/strict";
import test from "node:test";
import {
  createJobCenterCostDetails,
  createOfferDocumentHtml,
  isJobCenterOffer,
  type CrmOfferCostDetail,
  type CrmOfferDocument,
} from "./crmOfferDocument";

const row = (
  overrides: Partial<CrmOfferCostDetail> = {}
): CrmOfferCostDetail => ({
  id: "personal",
  label: "Umzugshelfer",
  formula: "2 Helfer × 4 Std. × 25 EUR",
  quantity: 8,
  unit: "Std.",
  unitPrice: 25,
  value: 200,
  ...overrides,
});

const offer = (
  overrides: Partial<CrmOfferDocument> = {}
): CrmOfferDocument => ({
  id: "offer-1",
  title: "Umzug",
  createdAt: 1_700_000_000_000,
  employees: 2,
  hoursPerEmployee: 4,
  acceptedPriceGross: 238,
  rates: { employeeHourlyRate: 25, vatPercent: 19 },
  planning: { serviceTypes: ["move"] },
  ...overrides,
});

test("JobCenter mode requires both the flag and a moving service", () => {
  assert.equal(isJobCenterOffer({}), false);
  assert.equal(isJobCenterOffer({ serviceTypes: ["move"] }), false);
  assert.equal(isJobCenterOffer({
    serviceTypes: ["move"], jobCenterOrder: false,
  }), false);
  assert.equal(isJobCenterOffer({
    serviceTypes: ["painting"], jobCenterOrder: true,
  }), false);
  for (const service of ["move", "seniorMove"]) {
    assert.equal(isJobCenterOffer({
      serviceTypes: [service, "packing"], jobCenterOrder: true,
    }), true);
  }
});

test("cost details preserve positions without mutating the calculation", () => {
  const rows = [row()];
  const details = createJobCenterCostDetails(rows, 200);
  assert.deepEqual(details, rows);
  assert.notEqual(details, rows);
  assert.notEqual(details[0], rows[0]);
});

test("agreed price discounts and surcharges are explicit positions", () => {
  for (const [netTotal, adjustment, label] of [
    [180, -20, "Vereinbarter Preisnachlass"],
    [225, 25, "Vereinbarter Preisaufschlag"],
  ] as const) {
    const details = createJobCenterCostDetails([row()], netTotal);
    assert.equal(details.at(-1)?.label, label);
    assert.equal(details.at(-1)?.value, adjustment);
    assert.equal(details.reduce((sum, item) => sum + item.value, 0), netTotal);
  }
});

test("displayed line amounts reconcile exactly in cents including credits", () => {
  const details = createJobCenterCostDetails([
    row({ value: 100.005 }),
    row({ id: "material", value: 33.333 }),
    row({ id: "credit", value: -5.555 }),
  ], 150.01);
  assert.equal(details.reduce(
    (sum, item) => sum + Math.round(item.value * 100), 0
  ), 15_001);
  assert.equal(details[0].value, 100.01);
});

test("invalid JobCenter prices and positions raise explicit errors", () => {
  for (const value of [NaN, Infinity, -1]) {
    assert.throws(() => createJobCenterCostDetails([row()], value), /ungültig/);
  }
  for (const field of ["quantity", "unitPrice", "value"] as const) {
    assert.throws(
      () => createJobCenterCostDetails([row({ [field]: NaN })], 200),
      /ungültig/
    );
  }
});

test("emailed JobCenter document uses persisted custom prices and full details", () => {
  const document = offer({
    acceptedPriceGross: 475.76,
    planning: {
      serviceTypes: ["move"],
      jobCenterOrder: true,
      oldAddress: "Startadresse",
      newAddress: "Zieladresse",
      vehicleSelections: [{ vehicleId: "custom-truck", quantity: 1 }],
      rooms: [{
        id: "room",
        name: "Wohnzimmer",
        items: [{ id: "item", name: "Sofa", quantity: 1, volumeM3: 2 }],
      }],
    },
    costDetails: [
      row(),
      row({
        id: "vehicle:custom-truck",
        label: "Individueller LKW",
        formula: "1 Fahrzeug × 1 Tag × 177 EUR",
        quantity: 1,
        unit: "Fahrzeugtag",
        unitPrice: 177,
        value: 177,
      }),
      row({
        id: "material",
        label: "Schutzfolie <Premium>",
        formula: "2 × Rolle",
        quantity: 2,
        unit: "Rolle",
        unitPrice: 11.4,
        value: 22.8,
      }),
    ],
  });
  const restored = JSON.parse(JSON.stringify(document)) as CrmOfferDocument;
  const html = createOfferDocumentHtml(restored, { name: "Testkunde" });
  for (const text of [
    "JobCenter auftrag", "Individueller LKW", "177,00",
    "Schutzfolie &lt;Premium&gt;", "22,80", "399,80", "75,96", "475,76",
    "Startadresse", "Zieladresse", "Packliste / Inventar", "Sofa", "8</td>",
  ]) {
    assert.ok(html.includes(text), `Missing document content: ${text}`);
  }
  assert.ok(!html.includes("Vereinbarter Preisaufschlag"));
  assert.ok(!html.includes("Vereinbarter Preisnachlass"));
});

test("JobCenter PDF does not invent a breakdown when the snapshot is missing", () => {
  assert.throws(() => createOfferDocumentHtml(offer({
    planning: { serviceTypes: ["move"], jobCenterOrder: true },
  }), { name: "Testkunde" }), /erneut speichern/);
});

test("regular offers retain their previous rendering and ignore stale flags", () => {
  for (const planning of [
    { serviceTypes: ["move"] },
    { serviceTypes: ["painting"], jobCenterOrder: true },
  ]) {
    const html = createOfferDocumentHtml(offer({
      planning,
      costDetails: [row({ label: "Snapshot only" })],
    }), { name: "Testkunde" });
    assert.ok(!html.includes("JobCenter auftrag"));
    assert.ok(!html.includes("Snapshot only"));
    assert.ok(html.includes("Umzugshelfer"));
    assert.ok(html.includes("238,00"));
  }
});
