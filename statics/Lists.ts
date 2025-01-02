import { CardType } from "@/types/CardType";

export const bulletPointsCard: CardType[] = [
    {
        title: "Finde innerhalb 5 Minuten den perfekten Handwerker",
        description: "Suche nach einem passenden Dienstleister in deiner Umgebung.",
        iconPath: "/images/cardIcon.png",
    }, {
        title: "Vergleiche Angebote",
        description: "Erhalte Angebote von verschiedenen Dienstleistern und vergleiche diese.",
        iconPath: "/images/cardIcon.png",
    }, {
        title: "Direkter Kontakt zu Fachbetrieben",
        description: "Erhalten Sie direkten Zugriff auf Kontaktdaten und Angebote.",
        iconPath: "/images/cardIcon.png",
    }
]

export function getGalbauServices(): string[] {
    return [
      "Gartenplanung und -gestaltung",
      "Pflasterarbeiten",
      "Rasen- und Rollrasenverlegung",
      "Baum- und Gehölzpflege",
      "Teich- und Wasseranlagenbau",
      "Zaun- und Sichtschutzbau",
      "Beet- und Pflanzarbeiten",
      "Dachbegrünung",
      "Bewässerungsanlagen",
      "Terrassenbau",
      "Erdarbeiten und Bodenbearbeitung",
      "Winterdienst",
      "Natursteinmauern und Trockenmauern",
      "Beleuchtungskonzepte",
      "Spielplatzbau und -pflege"
    ];
  }