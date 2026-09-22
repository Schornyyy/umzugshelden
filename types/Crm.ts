export type CrmCustomerStatus =
  | "lead"
  | "qualified"
  | "offer"
  | "customer"
  | "inactive";

export type CrmAppointmentType = "call" | "visit" | "move" | "task";

export interface CrmNote {
  id: string;
  text: string;
  createdAt: number;
}

export interface CrmAppointment {
  id: string;
  title: string;
  startAt: string;
  endAt?: string;
  type: CrmAppointmentType;
  details: string;
  completed: boolean;
  createdAt: number;
}

export interface CrmCustomer {
  id: string;
  ownerId: string;
  customerNumber?: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  status: CrmCustomerStatus;
  source: string;
  tags: string[];
  notes: CrmNote[];
  appointments: CrmAppointment[];
  createdAt: number;
  updatedAt: number;
}

export type CrmInvoiceStatus = "draft" | "sent" | "paid" | "cancelled";
export type CrmInvoiceType = "full" | "installment" | "final";

export interface CrmInvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface CrmInvoiceIssuer {
  companyName: string;
  proprietor: string;
  legalForm: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  taxNumber: string;
  vatId: string;
  bankName: string;
  accountHolder: string;
  iban: string;
  bic: string;
}

export interface CrmInvoiceSettings {
  ownerId: string;
  issuer: CrmInvoiceIssuer;
  invoicePrefix: string;
  paymentTermDays: number;
  nextNumberByYear: Record<string, number>;
  updatedAt: number;
}

export interface CrmInvoiceReminder {
  id: string;
  level: number;
  label: string;
  issueDate: string;
  paymentDeadline: string;
  fee: number;
  interestRatePercent: number;
  interestAmount: number;
  overdueDays: number;
  note: string;
  createdAt: number;
}

export interface CrmInvoice {
  id: string;
  ownerId: string;
  customerId: string;
  customerNumber?: string;
  offerId: string;
  invoiceNumber: string;
  sequenceNumber?: number;
  invoiceType?: CrmInvoiceType;
  installmentGross?: number;
  relatedInstallmentId?: string;
  relatedInstallmentNumber?: string;
  installmentCreditGross?: number;
  status: CrmInvoiceStatus;
  issueDate: string;
  serviceDate: string;
  dueDate: string;
  customerName: string;
  customerCompany: string;
  customerEmail: string;
  customerAddress: string;
  lineItems: CrmInvoiceLine[];
  vatPercent: number;
  taxNote?: string;
  issuer?: CrmInvoiceIssuer;
  notes: string;
  reminders?: CrmInvoiceReminder[];
  finalizedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export type CrmHandoverProtocolStatus = "draft" | "finalized";

export type CrmHandoverIssueType =
  | "preexisting"
  | "transportDamage"
  | "propertyDamage"
  | "missing"
  | "other";

export type CrmHandoverPhotoCategory =
  | "pickup"
  | "delivery"
  | "damage"
  | "other";

export type CrmHandoverObservation =
  | "notRecorded"
  | "confirmed"
  | "notConfirmed"
  | "notApplicable";

export interface CrmHandoverIssue {
  id: string;
  type: CrmHandoverIssueType;
  subject: string;
  description: string;
  actionTaken: string;
}

export interface CrmHandoverPhoto {
  id: string;
  url: string;
  category: CrmHandoverPhotoCategory;
  caption: string;
}

export interface CrmHandoverSignature {
  name: string;
  signedAt: string;
  dataUrl: string;
}

export interface CrmHandoverContractor {
  companyName: string;
  proprietor: string;
  legalForm: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  email: string;
  phone: string;
}

export interface CrmHandoverProtocol {
  id: string;
  ownerId: string;
  customerId: string;
  customerNumber: string;
  offerId: string;
  protocolNumber: string;
  status: CrmHandoverProtocolStatus;
  serviceType: "move" | "seniorMove";
  moveDate: string;
  handoverAt: string;
  customerName: string;
  customerCompany: string;
  customerAddress: string;
  customerEmail: string;
  contractor: CrmHandoverContractor;
  pickupAddress: string;
  deliveryAddress: string;
  crewLeader: string;
  servicesCompleted: CrmHandoverObservation;
  inventoryDelivered: CrmHandoverObservation;
  visibleInspectionCompleted: CrmHandoverObservation;
  keysReturned: CrmHandoverObservation;
  siteLeftClean: CrmHandoverObservation;
  reservations: string;
  notes: string;
  issues: CrmHandoverIssue[];
  photos: CrmHandoverPhoto[];
  accuracyConfirmed: boolean;
  customerSignature: CrmHandoverSignature;
  contractorSignature: CrmHandoverSignature;
  finalizedAt?: number;
  createdAt: number;
  updatedAt: number;
}