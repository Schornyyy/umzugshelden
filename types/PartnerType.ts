
export interface PartnerType {
  id: string
  contact: {
    person: string;
    email: string;
    phone: string;
  };
  company: {
    name: string;
    street?: string;
    zip?: string;
    city?: string;
  };
  infos: {
    website: string,
    logoPath?: string
  };
  siteInfos?: PartnerSiteInfo[],
  companyBenefits: string;
  shortDescription?: string;
  category?: string;
  createdAt: number;
  updatedAt: number;
  active: boolean;
  priority?: number; // für Sortierung
  // Metriken (aggregierte Zähler)
  clicks?: number; // Gesamt (falls historisch genutzt)
  websiteClicks?: number;
  emailClicks?: number;
  phoneClicks?: number;
  views?: number;
}


export interface PartnerSiteInfo {
  headline: string,
  text: string,
  image?: string
}

export interface PartnerStats {
  type: "website" | "email" | "phone" | "view";
  count: number;
  updatedAt: number; // Unix ms
}