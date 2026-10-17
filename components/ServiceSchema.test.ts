import assert from "node:assert/strict";
import test from "node:test";
import { buildServiceSchema } from "./ServiceSchema";

test("service schema includes local service areas, FAQs and backend reviews", () => {
  const schema = buildServiceSchema({
    name: "Umzugsservice in Olpe",
    description: "Professioneller Umzugsservice.",
    path: "/stadt/olpe/umzugsservice",
    serviceType: "Umzugsservice",
    city: "Olpe",
    region: "Kreis Olpe",
    areaServed: ["Attendorn"],
    faqs: [
      {
        question: "Wie läuft der Umzug ab?",
        answer: "Wir planen den Ablauf persönlich.",
      },
    ],
    reviews: [
      {
        id: "review-1",
        name: "Erika M.",
        review: "Sehr guter Service.",
        rating: 5,
      },
      {
        id: "review-2",
        name: "Max M.",
        review: "Zuverlässig und freundlich.",
        rating: 4,
      },
    ],
  });

  const graph: Record<string, unknown>[] = schema["@graph"];
  const service = graph.find((entry) => entry["@type"] === "Service");
  assert.ok(service);
  const serviceAreas = service["areaServed"];
  assert.ok(Array.isArray(serviceAreas));
  assert.deepEqual(
    serviceAreas.map((area) => {
      assert.ok(area && typeof area === "object" && "name" in area);
      return area.name;
    }),
    ["Olpe", "Attendorn", "Kreis Olpe"],
  );

  const faq = graph.find((entry) => entry["@type"] === "FAQPage");
  assert.ok(faq);
  const faqEntities = faq["mainEntity"];
  assert.ok(Array.isArray(faqEntities));
  assert.ok(
    faqEntities[0] &&
      typeof faqEntities[0] === "object" &&
      "name" in faqEntities[0],
  );
  assert.equal(faqEntities[0].name, "Wie läuft der Umzug ab?");

  const business = graph.find(
    (entry) =>
      Array.isArray(entry["@type"]) &&
      entry["@type"].includes("MovingCompany"),
  );
  assert.ok(business);
  assert.deepEqual(business["aggregateRating"], {
    "@type": "AggregateRating",
    ratingValue: 4.5,
    reviewCount: 2,
    bestRating: 5,
    worstRating: 1,
  });
  assert.equal(
    graph.filter((entry) => entry["@type"] === "Review").length,
    2,
  );
});

test("service schema omits empty FAQ and rating data", () => {
  const schema = buildServiceSchema({
    name: "Umzugsservice",
    description: "Umzugsservice.",
    path: "/umzugsservice",
    serviceType: "Umzugsservice",
    faqs: [],
    reviews: [],
  });

  assert.equal(
    schema["@graph"].some((entry) => entry["@type"] === "FAQPage"),
    false,
  );
  const graph: Record<string, unknown>[] = schema["@graph"];
  const business = graph.find(
    (entry) =>
      Array.isArray(entry["@type"]) &&
      entry["@type"].includes("MovingCompany"),
  );
  assert.ok(business);
  assert.equal("aggregateRating" in business, false);
  assert.equal("review" in business, false);
});
