import { ContractPreview } from "@/actions/contractActions";

// Erweiterte Contract-Daten für gekaufte Verträge
export interface PurchasedContractData extends ContractPreview {
  contact?: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  files?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

// Hauptschnittstelle für gekaufte Contracts
export interface PurchasedContractClient {
  id?: string;
  contractId: string;
  companyId: string;
  companyName: string;
  contractTitle: string;
  contractType: string;
  contractZip: number;
  amount: number;
  currency: string;
  stripePaymentIntentId: string;
  stripeSessionId?: string;
  paymentStatus: "pending" | "succeeded" | "failed" | "canceled";
  purchasedAt: Date;
  accessGrantedAt?: Date;
  contractData?: PurchasedContractData;
  createdAt: Date;
  updatedAt: Date;
}
