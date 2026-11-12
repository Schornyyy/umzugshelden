export type B2bLeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "follow_up"
  | "won"
  | "lost";

export type B2bLeadCategory =
  | "real_estate_agent"
  | "property_management"
  | "housing_company"
  | "senior_care";

export interface B2bLead {
  id: string;
  ownerId: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  category: B2bLeadCategory;
  status: B2bLeadStatus;
  nextFollowUpAt: number | null;
  lastContactAt: number | null;
  googleMapsUrl: string;
  source: "google_maps";
  aiOfferAngle: string;
  aiEmailReason: string;
  aiStatus: "selected" | "no_email" | "failed";
  createdAt: number;
  updatedAt: number;
}

export interface B2bEmailActivity {
  id: string;
  ownerId: string;
  leadId: string;
  to: string;
  subject: string;
  htmlContent: string;
  brevoMessageId: string;
  sentAt: number;
  channel: "brevo";
  status: "sent";
}

