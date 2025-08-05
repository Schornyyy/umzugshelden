"use client";

import { useState, useCallback } from "react";
import {
  getContractPreviewsInRadius,
  ContractPreview,
} from "@/actions/contractActions";
import { CompanyType } from "@/types/RegisterTypye";
import { PurchasedContractClient, PurchasedContractData } from "./types";

export const useContractData = (company: CompanyType | null) => {
  const [availableContracts, setAvailableContracts] = useState<ContractPreview[]>([]);
  const [purchasedContracts, setPurchasedContracts] = useState<PurchasedContractClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastDocId, setLastDocId] = useState<string | undefined>();

  // Lade verfügbare Contracts
  const loadAvailableContracts = useCallback(
    async (
      serviceFilter: string,
      radiusFilter: number,
      loadMore = false
    ) => {
      if (
        !company ||
        !company.latitude ||
        !company.longitude ||
        !company.services
      ) {
        return;
      }

      try {
        setLoading(!loadMore);

        const filteredServices =
          serviceFilter === "all"
            ? company.services
            : company.services.filter((service) => service === serviceFilter);

        const result = await getContractPreviewsInRadius(
          company.latitude!,
          company.longitude!,
          radiusFilter,
          filteredServices,
          loadMore ? lastDocId : undefined,
          20
        );

        if (loadMore) {
          setAvailableContracts((prev) => [...prev, ...result.contracts]);
        } else {
          setAvailableContracts(result.contracts);
        }

        setHasMore(result.hasMore);
        setLastDocId(result.lastDocId);
      } catch (error) {
        console.error("Fehler beim Laden der verfügbaren Contracts:", error);
      } finally {
        setLoading(false);
      }
    },
    [company, lastDocId]
  );

  // Lade gekaufte Contracts aus Firebase
  const loadPurchasedContracts = useCallback(async () => {
    if (!company?.id) return;

    try {
      // Importiere die Funktion dynamisch um Circular Imports zu vermeiden
      const { getPurchasedContractsByCompany } = await import(
        "@/actions/buyedContractActions"
      );
      const contracts = await getPurchasedContractsByCompany(company.id);

      // Konvertiere die Daten zum lokalen Interface-Format
      const convertedContracts: PurchasedContractClient[] = contracts.map(
        (contract) => ({
          ...contract,
          contractData: contract.contractData as unknown as PurchasedContractData,
        })
      );

      setPurchasedContracts(convertedContracts);
    } catch (error) {
      console.error("Fehler beim Laden der gekauften Contracts:", error);
      // Fallback: Leeres Array
      setPurchasedContracts([]);
    }
  }, [company?.id]);

  return {
    availableContracts,
    purchasedContracts,
    loading,
    hasMore,
    loadAvailableContracts,
    loadPurchasedContracts,
  };
};
