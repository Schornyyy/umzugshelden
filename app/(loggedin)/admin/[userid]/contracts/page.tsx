"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { database } from "@/config/firebase";
import { Contract } from "@/types/Contract";
import { getAllServices } from "@/types/ServiceType";

interface ExtendedContract extends Contract {
  id: string;
  createdAt: Date;
  status?: "pending" | "verified" | "completed" | "cancelled";
}

const AdminContractsPage = () => {
  const [contracts, setContracts] = useState<ExtendedContract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<
    ExtendedContract[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [selectedContract, setSelectedContract] =
    useState<ExtendedContract | null>(null);

  // Alle verfügbaren Services für Filter
  const services = getAllServices();

  const filterAndSortContracts = React.useCallback(() => {
    let filtered = [...contracts];

    // Text-Suche
    if (searchTerm) {
      filtered = filtered.filter(
        (contract) =>
          contract.contact.firstName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          contract.contact.lastName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          contract.contact.email
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          contract.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          contract.contact.phone.toString().includes(searchTerm) ||
          contract.zip.toString().includes(searchTerm)
      );
    }

    // Status-Filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (contract) => (contract.status || "pending") === statusFilter
      );
    }

    // Service-Filter
    if (serviceFilter !== "all") {
      filtered = filtered.filter((contract) => contract.type === serviceFilter);
    }

    // Sortierung
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
      case "name":
        filtered.sort((a, b) =>
          a.contact.firstName.localeCompare(b.contact.firstName)
        );
        break;
      case "status":
        filtered.sort((a, b) =>
          (a.status || "pending").localeCompare(b.status || "pending")
        );
        break;
      case "zip":
        filtered.sort((a, b) => a.zip - b.zip);
        break;
    }

    setFilteredContracts(filtered);
  }, [contracts, searchTerm, statusFilter, serviceFilter, sortBy]);

  // Contracts laden
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const contractsQuery = query(
          collection(database, "contracts"),
          orderBy("createdAt", "desc")
        );
        const contractsSnapshot = await getDocs(contractsQuery);

        const contractsData = contractsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as ExtendedContract;
        });

        setContracts(contractsData);
      } catch (error) {
        console.error("Fehler beim Laden der Contracts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  // Filter anwenden wenn sich Daten ändern
  useEffect(() => {
    filterAndSortContracts();
  }, [filterAndSortContracts]);

  const updateContractStatus = async (
    contractId: string,
    newStatus: string
  ) => {
    try {
      const contractRef = doc(database, "contracts", contractId);
      await updateDoc(contractRef, { status: newStatus });

      // Update local state
      setContracts((prev) =>
        prev.map((contract) =>
          contract.id === contractId
            ? { ...contract, status: newStatus as ExtendedContract["status"] }
            : contract
        )
      );

      // Update selected contract if it's the same one
      if (selectedContract?.id === contractId) {
        setSelectedContract((prev) =>
          prev
            ? { ...prev, status: newStatus as ExtendedContract["status"] }
            : null
        );
      }
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Status:", error);
      alert(
        "Fehler beim Aktualisieren des Status. Bitte versuchen Sie es erneut."
      );
    }
  };

  const deleteContract = async (contractId: string) => {
    if (!confirm("Sind Sie sicher, dass Sie diesen Auftrag löschen möchten?")) {
      return;
    }

    try {
      await deleteDoc(doc(database, "contracts", contractId));
      setContracts((prev) =>
        prev.filter((contract) => contract.id !== contractId)
      );
      setSelectedContract(null);
    } catch (error) {
      console.error("Fehler beim Löschen des Auftrags:", error);
    }
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "verified":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case "pending":
        return "Ausstehend";
      case "verified":
        return "Verifiziert";
      case "completed":
        return "Abgeschlossen";
      case "cancelled":
        return "Abgebrochen";
      default:
        return "Ausstehend";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
      return `vor ${diffInMinutes} Min.`;
    } else if (diffInHours < 24) {
      return `vor ${diffInHours} Std.`;
    } else {
      return `vor ${diffInDays} Tag${diffInDays !== 1 ? "en" : ""}`;
    }
  };

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-lg'>Aufträge werden geladen...</div>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          Auftragsverwaltung
        </h1>
        <p className='text-gray-600'>
          Verwalten Sie alle Aufträge in der Plattform
        </p>
      </div>

      {/* Filter und Suche */}
      <Card className='mb-6'>
        <CardContent className='p-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
            {/* Suchfeld */}
            <div className='lg:col-span-2'>
              <Input
                placeholder='Suche nach Name, E-Mail, PLZ...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full'
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Alle Status</SelectItem>
                <SelectItem value='pending'>Ausstehend</SelectItem>
                <SelectItem value='verified'>Verifiziert</SelectItem>
                <SelectItem value='completed'>Abgeschlossen</SelectItem>
                <SelectItem value='cancelled'>Abgebrochen</SelectItem>
              </SelectContent>
            </Select>

            {/* Service Filter */}
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger>
                <SelectValue placeholder='Service' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Alle Services</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sortierung */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder='Sortieren' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='newest'>Neueste zuerst</SelectItem>
                <SelectItem value='oldest'>Älteste zuerst</SelectItem>
                <SelectItem value='name'>Nach Name</SelectItem>
                <SelectItem value='status'>Nach Status</SelectItem>
                <SelectItem value='zip'>Nach PLZ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Statistiken */}
          <div className='mt-6 grid grid-cols-2 md:grid-cols-5 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-gray-900'>
                {contracts.length}
              </div>
              <div className='text-sm text-gray-600'>Gesamt</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-yellow-600'>
                {
                  contracts.filter((c) => (c.status || "pending") === "pending")
                    .length
                }
              </div>
              <div className='text-sm text-gray-600'>Ausstehend</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {contracts.filter((c) => c.status === "verified").length}
              </div>
              <div className='text-sm text-gray-600'>Verifiziert</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {contracts.filter((c) => c.status === "completed").length}
              </div>
              <div className='text-sm text-gray-600'>Abgeschlossen</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-red-600'>
                {contracts.filter((c) => c.status === "cancelled").length}
              </div>
              <div className='text-sm text-gray-600'>Abgebrochen</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aufträge Liste */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2'>
          <div className='space-y-4'>
            {filteredContracts.length === 0 ? (
              <Card>
                <CardContent className='p-8 text-center'>
                  <p className='text-gray-500'>Keine Aufträge gefunden.</p>
                </CardContent>
              </Card>
            ) : (
              filteredContracts.map((contract) => (
                <Card
                  key={contract.id}
                  className={`cursor-pointer transition-all ${
                    selectedContract?.id === contract.id
                      ? "ring-2 ring-green-500"
                      : "hover:shadow-md"
                  }`}
                  onClick={() => setSelectedContract(contract)}>
                  <CardContent className='p-4'>
                    <div className='flex justify-between items-start mb-3'>
                      <div>
                        <h3 className='font-semibold text-lg'>
                          {contract.contact.firstName}{" "}
                          {contract.contact.lastName}
                        </h3>
                        <p className='text-sm text-gray-600'>
                          {contract.contact.email}
                        </p>
                        <p className='text-sm text-gray-600'>
                          {contract.contact.phone}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                          contract.status
                        )}`}>
                        {getStatusText(contract.status)}
                      </span>
                    </div>

                    <div className='grid grid-cols-2 gap-4 text-sm'>
                      <div>
                        <span className='font-medium'>Service:</span>{" "}
                        {contract.type}
                      </div>
                      <div>
                        <span className='font-medium'>PLZ:</span> {contract.zip}
                      </div>
                      <div>
                        <span className='font-medium'>Gartengröße:</span>{" "}
                        {contract.gardenSize}m²
                      </div>
                      <div>
                        <span className='font-medium'>Erstellt:</span>{" "}
                        {formatTimeAgo(contract.createdAt)}
                      </div>
                    </div>

                    <p className='text-sm text-gray-700 mt-3 line-clamp-2'>
                      {contract.description}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Detail-Seite */}
        <div className='lg:col-span-1'>
          {selectedContract ? (
            <Card className='sticky top-4'>
              <CardHeader>
                <CardTitle>Auftrag Details</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <h4 className='font-semibold mb-2'>Kunde</h4>
                  <p className='text-sm'>
                    <strong>Name:</strong> {selectedContract.contact.firstName}{" "}
                    {selectedContract.contact.lastName}
                  </p>
                  <p className='text-sm'>
                    <strong>E-Mail:</strong> {selectedContract.contact.email}
                  </p>
                  <p className='text-sm'>
                    <strong>Telefon:</strong> {selectedContract.contact.phone}
                  </p>
                  <p className='text-sm'>
                    <strong>PLZ:</strong> {selectedContract.zip}
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className='font-semibold mb-2'>Projekt</h4>
                  <p className='text-sm'>
                    <strong>Service:</strong> {selectedContract.type}
                  </p>
                  <p className='text-sm'>
                    <strong>Gartengröße:</strong> {selectedContract.gardenSize}
                    m²
                  </p>
                  <p className='text-sm'>
                    <strong>Projektumfang:</strong>{" "}
                    {selectedContract.contractSize}
                  </p>
                  <p className='text-sm'>
                    <strong>Gartenbereich:</strong>{" "}
                    {selectedContract.gardenLocation}
                  </p>
                  <p className='text-sm'>
                    <strong>Projektbeginn:</strong>{" "}
                    {selectedContract.projektBeginn}
                  </p>
                  <p className='text-sm'>
                    <strong>Wiederholungsservice:</strong>{" "}
                    {selectedContract.repeatService ? "Ja" : "Nein"}
                  </p>
                  <p className='text-sm'>
                    <strong>Planung verfügbar:</strong>{" "}
                    {selectedContract.planningAvaillable ? "Ja" : "Nein"}
                  </p>
                  <p className='text-sm'>
                    <strong>Verifiziert:</strong>{" "}
                    {selectedContract.verified ? "Ja" : "Nein"}
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className='font-semibold mb-2'>Beschreibung</h4>
                  <p className='text-sm'>{selectedContract.description}</p>
                </div>

                {selectedContract.files &&
                  selectedContract.files.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className='font-semibold mb-2'>
                          Dateien ({selectedContract.files.length})
                        </h4>
                        <div className='space-y-2'>
                          {selectedContract.files.map((fileUrl, index) => (
                            <a
                              key={index}
                              href={fileUrl}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='block text-sm text-blue-600 hover:underline'>
                              📎 Datei {index + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                <Separator />

                <div>
                  <h4 className='font-semibold mb-2'>Status ändern</h4>
                  <Select
                    value={selectedContract.status || "pending"}
                    onValueChange={(value) =>
                      updateContractStatus(selectedContract.id, value)
                    }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='pending'>Ausstehend</SelectItem>
                      <SelectItem value='verified'>Verifiziert</SelectItem>
                      <SelectItem value='completed'>Abgeschlossen</SelectItem>
                      <SelectItem value='cancelled'>Abgebrochen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className='space-y-2'>
                  <Button
                    variant='destructive'
                    className='w-full'
                    onClick={() => deleteContract(selectedContract.id)}>
                    Auftrag löschen
                  </Button>
                </div>

                <div className='text-xs text-gray-500'>
                  <p>
                    <strong>ID:</strong> {selectedContract.id}
                  </p>
                  <p>
                    <strong>Erstellt:</strong>{" "}
                    {selectedContract.createdAt.toLocaleString("de-DE")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className='p-8 text-center'>
                <p className='text-gray-500'>
                  Wählen Sie einen Auftrag aus, um Details zu sehen.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminContractsPage;
