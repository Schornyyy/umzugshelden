export interface PartnerType {
  id: string;
  name: string;
  logo: string; // URL oder Pfad
  benefit: string;
  contactPerson?: string;
  website?: string;
  link?: string;
  category?: string;
  active: boolean;
  priority?: number; // für Sortierung
  createdAt?: number;
  updatedAt?: number;
  tags?: string[];
  description?: string;
  clicks?: number; // Anzahl Link-Klicks
  // Neue Statistik-Felder
  websiteClicks?: number;
  emailClicks?: number;
  phoneClicks?: number;
  views?: number;
}
