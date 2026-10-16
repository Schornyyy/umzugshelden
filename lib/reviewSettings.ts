import { z } from "zod";

export const reviewSchema = z.object({
  id: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1, "Bitte einen Namen eingeben.").max(150),
  review: z.string().trim().min(1, "Bitte einen Bewertungstext eingeben.").max(5000),
  rating: z.number().int().min(1).max(5),
});

export const reviewSettingsSchema = z.object({
  reviews: z.array(reviewSchema).max(100).refine(
    (reviews) => new Set(reviews.map((review) => review.id)).size === reviews.length,
    "Bewertungen müssen eindeutige IDs haben.",
  ),
});

export type Review = z.infer<typeof reviewSchema>;
export type ReviewSettings = z.infer<typeof reviewSettingsSchema>;

export const defaultReviewSettings: ReviewSettings = {
  reviews: [
    {
      id: "oliver",
      name: "Oliver W.",
      review:
        "In einer persönlichen Notsituation hat Herr Weiß sehr spontan seine Hilfe zugesagt und hat mir innerhalb von 15 Minuten ausgeholfen. Unaufgeregt, sehr freundlich und fair kann ich diesen Hausmeisterservice nur empfehlen und weiß, wo ich mich wieder einmal melden werde, wenn etwas (auch größeres) anliegt. Vielen Dank!",
      rating: 5,
    },
    {
      id: "ahmet",
      name: "Ahmet D.",
      review:
        "Einen besseren Service Dienstleister kenne ich echt nicht! Top Arbeit geleistet und vor allem alles sauber hinterlassen. Sehr freundlich und zuvorkommen, absolut fairer Preisleistung! Empfehlenswert…..",
      rating: 5,
    },
    {
      id: "anke",
      name: "Anke R.",
      review: "Nettes Team, dass sauber arbeitet.",
      rating: 5,
    },
  ],
};
