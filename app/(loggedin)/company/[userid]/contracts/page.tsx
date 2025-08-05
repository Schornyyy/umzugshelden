"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { findCompanyById } from "@/actions/companyActions";
import { updateCompanyCoordinates } from "@/actions/coordinateActions";
import { CompanyType } from "@/types/RegisterTypye";
import { ContractPreview } from "@/actions/contractActions";

// Components
import {
  AlertMessages,
  TabNavigation,
  ContractFilters,
  AvailableContractCard,
  PurchasedContractCard,
  EmptyState,
  LoadMoreButton,
  useContractData,
  calculateContractPrice,
  formatTimeAgo,
  calculateContractValue,
} from "./_components";

// Types
import { PurchasedContractClient } from "./_components/types";

interface CompanyContractsPageProps {
  params: Promise<{ userid: string }>;
}

const CompanyContractsPage = ({ params }: CompanyContractsPageProps) => {
  const resolvedParams = React.use(params);

  // State
  const [company, setCompany] = useState<CompanyType | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"available" | "purchased">(
    "available"
  );
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [radiusFilter, setRadiusFilter] = useState<number>(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState<string | null>(null);

  // Custom Hook für Contract-Daten
  const {
    availableContracts,
    purchasedContracts,
    loading,
    hasMore,
    loadAvailableContracts,
    loadPurchasedContracts,
  } = useContractData(company);

  // URL-Parameter für Erfolgs- und Fehlermeldungen
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    if (
      urlParams.get("success") === "true" &&
      urlParams.get("purchased") === "true"
    ) {
      setShowSuccessMessage(true);
      setActiveTab("purchased");
    } else if (urlParams.get("success") === "false") {
      const error = urlParams.get("error");
      switch (error) {
        case "payment_failed":
          setShowErrorMessage(
            "Die Zahlung ist fehlgeschlagen. Bitte versuchen Sie es erneut."
          );
          break;
        case "payment_pending":
          setShowErrorMessage(
            "Die Zahlung wird noch verarbeitet. Bitte warten Sie einen Moment."
          );
          break;
        case "processing_error":
          setShowErrorMessage(
            "Es gab einen Fehler beim Verarbeiten der Zahlung."
          );
          break;
        default:
          setShowErrorMessage("Es gab ein Problem mit der Zahlung.");
      }
    } else if (urlParams.get("canceled") === "true") {
      setShowErrorMessage("Die Zahlung wurde abgebrochen.");
    }

    if (
      urlParams.has("success") ||
      urlParams.has("canceled") ||
      urlParams.has("error")
    ) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Lade Company-Daten
  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        const companyData = await findCompanyById(resolvedParams.userid);

        if (companyData) {
          if (
            (!companyData.latitude || !companyData.longitude) &&
            companyData.zip
          ) {
            const coordinates = await updateCompanyCoordinates(
              companyData.id!,
              companyData.zip,
              companyData.city
            );

            if (coordinates) {
              companyData.latitude = coordinates.latitude;
              companyData.longitude = coordinates.longitude;
            }
          }

          if (!companyData.services || companyData.services.length === 0) {
            companyData.services = [
              "Gartengestaltung",
              "Rasenpflege",
              "Heckenschnitt",
              "Baumfällung",
            ];
          }

          setCompany(companyData);
        }
      } catch (error) {
        console.error("Fehler beim Laden der Company-Daten:", error);
      }
    };

    loadCompanyData();
  }, [resolvedParams.userid]);

  // Lade Contracts wenn Company verfügbar
  useEffect(() => {
    if (company && company.latitude && company.longitude && company.services) {
      loadAvailableContracts(serviceFilter, radiusFilter);
    }
  }, [company, serviceFilter, radiusFilter, loadAvailableContracts]);

  // Lade gekaufte Contracts
  useEffect(() => {
    if (company?.id) {
      loadPurchasedContracts();
    }
  }, [company?.id, loadPurchasedContracts]);

  // Lade gekaufte Contracts nach erfolgreichem Kauf neu
  useEffect(() => {
    if (showSuccessMessage && company?.id) {
      setTimeout(() => {
        loadPurchasedContracts();
      }, 500);
    }
  }, [showSuccessMessage, company?.id, loadPurchasedContracts]);

  // Handler
  const handlePurchaseContract = async (contract: ContractPreview) => {
    if (!company || purchasing) return;

    try {
      setPurchasing(contract.id!);

      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractPreview: contract,
          companyId: company.id,
          companyName: company.companyName,
          amount: calculateContractPrice(contract) * 100,
          currency: "EUR",
        }),
      });

      if (!response.ok) {
        throw new Error("Fehler beim Erstellen der Checkout Session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Fehler beim Kauf des Contracts:", error);
      alert("Fehler beim Erwerb des Auftrags. Bitte versuchen Sie es erneut.");
    } finally {
      setPurchasing(null);
    }
  };

  const handleDownloadInvoice = async (purchase: PurchasedContractClient) => {
    try {
      if (
        !purchase.stripePaymentIntentId ||
        purchase.stripePaymentIntentId === "pending" ||
        purchase.stripePaymentIntentId === "null"
      ) {
        alert(
          "Rechnung ist noch nicht verfügbar. Bitte warten Sie, bis die Zahlung vollständig verarbeitet wurde."
        );
        return;
      }

      const response = await fetch(
        `/api/stripe/invoice/${purchase.stripePaymentIntentId}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Fehler beim Abrufen der Rechnung");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `Rechnung_${purchase.contractTitle}_${new Date(
        purchase.purchasedAt
      )
        .toLocaleDateString("de-DE")
        .replace(/\./g, "")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Fehler beim Herunterladen der Rechnung:", error);
      alert(
        `Rechnung konnte nicht heruntergeladen werden: ${
          error instanceof Error ? error.message : "Unbekannter Fehler"
        }`
      );
    }
  };

  // Filter verfügbare Contracts (Suchfilter und bereits gekaufte ausschließen)
  const filteredAvailableContracts = availableContracts
    .filter((contract) => {
      // Filtere bereits gekaufte Aufträge heraus
      const purchasedContractIds = new Set(
        purchasedContracts.map((p) => p.contractId)
      );
      return !purchasedContractIds.has(contract.id!);
    })
    .filter((contract) => {
      // Suchfilter
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
          contract.description.toLowerCase().includes(lowerSearchTerm) ||
          contract.zip.toString().includes(searchTerm) ||
          contract.type.toLowerCase().includes(lowerSearchTerm)
        );
      }
      return true;
    });

  // Loading State
  if (loading && availableContracts.length === 0) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='flex items-center justify-center h-64'>
          <Loader2 className='h-8 w-8 animate-spin' />
          <span className='ml-2'>Aufträge werden geladen...</span>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          Auftragsvermittlung
        </h1>
        <p className='text-gray-600'>
          Verfügbare Aufträge in Ihrer Region • Umkreis: {radiusFilter}km
        </p>
      </div>

      <AlertMessages
        showSuccessMessage={showSuccessMessage}
        showErrorMessage={showErrorMessage}
        onDismissSuccess={() => setShowSuccessMessage(false)}
        onDismissError={() => setShowErrorMessage(null)}
      />

      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        availableCount={filteredAvailableContracts.length}
        purchasedCount={purchasedContracts.length}
      />

      {activeTab === "available" && (
        <ContractFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          serviceFilter={serviceFilter}
          onServiceFilterChange={setServiceFilter}
          radiusFilter={radiusFilter}
          onRadiusFilterChange={setRadiusFilter}
          services={company?.services || []}
          onApplyFilters={() =>
            loadAvailableContracts(serviceFilter, radiusFilter)
          }
        />
      )}

      {/* Contract Cards */}
      <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
        {activeTab === "available" &&
          filteredAvailableContracts.map((contract) => (
            <AvailableContractCard
              key={contract.id}
              contract={contract}
              onPurchase={handlePurchaseContract}
              purchasing={purchasing}
              calculatePrice={calculateContractPrice}
              calculateValue={calculateContractValue}
              formatTimeAgo={formatTimeAgo}
            />
          ))}

        {activeTab === "purchased" &&
          purchasedContracts.map((purchase) => (
            <PurchasedContractCard
              key={purchase.id}
              purchase={purchase}
              onDownloadInvoice={handleDownloadInvoice}
            />
          ))}
      </div>

      {activeTab === "available" && (
        <LoadMoreButton
          onLoadMore={() =>
            loadAvailableContracts(serviceFilter, radiusFilter, true)
          }
          loading={loading}
          hasMore={hasMore}
        />
      )}

      {/* Empty States */}
      {activeTab === "available" &&
        filteredAvailableContracts.length === 0 &&
        !loading && <EmptyState type='available' />}

      {activeTab === "purchased" && purchasedContracts.length === 0 && (
        <EmptyState type='purchased' />
      )}
    </div>
  );
};

export default CompanyContractsPage;
