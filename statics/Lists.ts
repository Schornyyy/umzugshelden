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

export const bulletPointsCompanyyCard: CardType[] = [
    {
        title: "Erhalten Sie Aufträge direkt in Ihrer Nähe",
        description: "Werden Sie von potenziellen Kunden gefunden und kontaktiert.",
        iconPath: "/icons/chartIcon.svg",
    }, {
        title: "Steigern Sie Ihre Bekanntheit",
        description: "Erhalten Sie mehr Reichweite für Ihr Unternehmen.",
        iconPath: "/icons/EyeIcon.svg",
    }, {
        title: "Komplett kostenlos",
        description: "Erhalten Sie alle Vorteile ohne versteckte Kosten.",
        iconPath: "/icons/handshakeIcon.svg",
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
      "Spielplatzbau und -pflege",
      "Terrassenüberdachungen",
      "Pool Bau",
      "Rasenmähen und Grünpflege"
    ];
  }