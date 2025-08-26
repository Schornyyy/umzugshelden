export interface PartnerType {
  id: string;
  name: string;
  logo: string; // URL oder Pfad
  benefit: string;
  link?: string;
  category?: string;
  active: boolean;
  priority?: number; // für Sortierung
  createdAt?: number;
  updatedAt?: number;
  tags?: string[];
  description?: string;
  clicks?: number; // Anzahl Link-Klicks
}
