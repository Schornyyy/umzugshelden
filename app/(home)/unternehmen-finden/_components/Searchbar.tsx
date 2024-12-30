import React, { useState } from 'react';
import { collection, query, getDocs, startAfter, limit } from 'firebase/firestore';
import geolib from 'geolib'; // Geolocation-Bibliothek
import { fetchCoordinates } from '@/actions/userActions';
import { database } from '@/config/firebase';
import { CompanyType } from '@/types/RegisterTypye';

const SearchBar: React.FC = () => {
  const [service, setService] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [radius, setRadius] = useState(10); // Radius in km
  const [results, setResults] = useState<CompanyType[]>([]); // Gesamte Ergebnisse
  const [displayedResults, setDisplayedResults] = useState<CompanyType[]>([]); // Aktuelle Seite
  const [currentPage, setCurrentPage] = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lastDoc, setLastDoc] = useState<any>(null); // Letztes Dokument aus Firestore
  const [loading, setLoading] = useState(false);

  const RESULTS_PER_PAGE = 24;
  const QUERY_LIMIT = 100;

  const handleSearch = async () => {
    try {
      if (!city || !zip) {
        alert('Bitte Stadt und Postleitzahl angeben!');
        return;
      }
  
      setLoading(true);
  
      // Schritt 1: Zentrum der Suche bestimmen
      const centerCoordinates = await fetchCoordinates(city, zip);
  
      // Schritt 2: Erste Datenbankabfrage
      const querySnapshot = await fetchCompaniesFromFirestore();
  
      const companies: CompanyType[] = querySnapshot.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as CompanyType[];
  
      // Schritt 3: Radius-Filterung durchführen
      const filteredCompanies = filterCompaniesByRadius(companies, centerCoordinates!);
  
      // Schritt 4: Ergebnisse nach Entfernung sortieren
      const sortedCompanies = filteredCompanies.sort((a, b) => {
        const distanceA = geolib.getDistance(
          { latitude: a.latitude!, longitude: a.longitude! },
          centerCoordinates!
        );
        const distanceB = geolib.getDistance(
          { latitude: b.latitude!, longitude: b.longitude! },
          centerCoordinates!
        );
        return distanceA - distanceB; // Aufsteigend nach Entfernung
      });
  
      setResults(sortedCompanies);
  
      // Schritt 5: Initiale Seite anzeigen
      updateDisplayedResults(sortedCompanies, 1);
  
      setLoading(false);
    } catch (error) {
      console.error('Fehler bei der Suche:', error);
      setLoading(false);
    }
  };
  

  const fetchCompaniesFromFirestore = async (next = false) => {
    const ref = collection(database, 'users');
    let q;

    if (next && lastDoc) {
      q = query(ref, startAfter(lastDoc), limit(QUERY_LIMIT));
    } else {
      q = query(ref, limit(QUERY_LIMIT));
    }

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]); // Letzten Dokumentzeiger speichern
    }

    return querySnapshot.docs;
  };

  const filterCompaniesByRadius = (companies: CompanyType[], centerCoordinates: { latitude: number; longitude: number }) => {
    return companies.filter((company) => {
      if (!company.latitude || !company.longitude) return false;
      return geolib.isPointWithinRadius(
        { latitude: company.latitude, longitude: company.longitude },
        centerCoordinates,
        radius * 1000
      );
    });
  };

  const updateDisplayedResults = (companies: CompanyType[], page: number) => {
    const startIndex = (page - 1) * RESULTS_PER_PAGE;
    const endIndex = startIndex + RESULTS_PER_PAGE;
    const pageResults = companies.slice(startIndex, endIndex);
    setDisplayedResults(pageResults);
    setCurrentPage(page);
  };

  const handleNextPage = async () => {
    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * RESULTS_PER_PAGE;

    if (startIndex >= results.length) {
      // Neue Einträge laden
      setLoading(true);
      const querySnapshot = await fetchCompaniesFromFirestore(true);

      const companies: CompanyType[] = querySnapshot.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as CompanyType[];

      const filteredCompanies = filterCompaniesByRadius(companies, {
        latitude: results[0]?.latitude || 0,
        longitude: results[0]?.longitude || 0,
      });

      setResults((prev) => [...prev, ...filteredCompanies]);
      setLoading(false);
    }

    updateDisplayedResults(results, nextPage);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      updateDisplayedResults(results, prevPage);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white shadow-md p-4 rounded-md">
        <h2 className="text-lg font-bold mb-4">Unternehmenssuche</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Dienstleistung */}
          <div>
            <label className="block text-sm font-medium">Dienstleistung</label>
            <input
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="Dienstleistung eingeben"
              className="w-full p-2 border rounded-md"
            />
          </div>

          {/* Stadt */}
          <div>
            <label className="block text-sm font-medium">Stadt</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Stadt eingeben"
              className="w-full p-2 border rounded-md"
            />
          </div>

          {/* Postleitzahl */}
          <div>
            <label className="block text-sm font-medium">Postleitzahl</label>
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="PLZ eingeben"
              className="w-full p-2 border rounded-md"
            />
          </div>

          {/* Radius */}
          <div>
            <label className="block text-sm font-medium">Radius (km)</label>
            <input
              type="number"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              placeholder="Radius eingeben"
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>

        <button
          onClick={handleSearch}
          className="w-full mt-4 bg-green-500 text-white p-2 rounded-md hover:bg-green-600"
        >
          Suchen
        </button>
      </div>

      {/* Suchergebnisse */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Ergebnisse</h3>
        {loading ? (
          <p>Lade Ergebnisse...</p>
        ) : (
          <ul className="space-y-2">
            {displayedResults.map((company) => (
              <li key={company.id} className="p-4 border rounded-md">
                <h4 className="font-bold">{company.companyName}</h4>
                <p>
                  {company.city}, {company.zip}
                </p>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        <div className="mt-4 flex justify-between">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className={`px-4 py-2 border rounded-md ${
              currentPage === 1 ? 'bg-gray-200' : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            Zurück
          </button>
          <span>Seite {currentPage}</span>
          <button
            onClick={handleNextPage}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white border rounded-md"
          >
            Weiter
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
