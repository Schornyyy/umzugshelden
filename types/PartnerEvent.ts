export interface PartnerEvent {
  id: string;
  // Arten von Ereignissen: Website-Klick, E-Mail-Klick, Telefon-Klick, Seitenaufruf
  type: 'website_click' | 'email_click' | 'phone_click' | 'view';
  createdAt: number; // Unix ms
  // Optional: zusätzliche Information, z. B. Ziel-URL, E-Mail-Adresse oder Telefonnummer
  target?: string;
}