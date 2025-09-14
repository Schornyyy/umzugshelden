"use server";

import { database } from "@/config/firebase";
import { ClickType, StatsType } from "@/types/StatsType";
import { UserRole } from "@/types/UserType";
import { addDoc, collection, doc, setDoc, increment } from "firebase/firestore";
import { redirect } from "next/navigation";

export const fetchCoordinates = async (city: string, postalCode: string) => {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${postalCode}&city=${city}&format=json`;
  
    try {
      const response = await fetch(url, {
        headers: {
        'User-Agent': 'landschaftshelden.io/1.0 (support@landschaftshelden.io)' // Optional aber empfohlen von Nominatim
      }
      });
      console.log('Response from Nominatim:', response);
      const data = await response.json();
      console.log('Data received from Nominatim:', data);
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        console.log('Coordinates found:', { lat, lon });
        return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
      } else {
        throw new Error('Keine Koordinaten gefunden.');
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Koordinaten von Nominatim:', error);
      console.log('Versuche Open-Meteo als Fallback...');
      return await fetchCoordinatesMeteo(city, postalCode);
    }
  };


  export const fetchCoordinatesMeteo = async (city: string, postalCode: string) => {
  const query = `${postalCode} ${city}`;
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=de&format=json`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data && data.results && data.results.length > 0) {
      const { latitude, longitude } = data.results[0];
      return { latitude, longitude };
    } else {
      throw new Error('Keine Koordinaten gefunden.');
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Koordinaten:', error);
    return null;
  }
};


  export async function saveClick(type: ClickType, companyId: string) {
    const click: StatsType = {
      clickType: type,
      companyId,
      timestamp: Date.now()
    }

    await addDoc(collection(database, 'stats'), click);
    // Also increment lightweight aggregates for cheap admin reads
    try {
      const aggRef = doc(database, 'company_stats', companyId);
      await setDoc(
        aggRef,
        {
          updatedAt: Date.now(),
          total: increment(1),
          [type]: increment(1),
        },
        { merge: true }
      );
    } catch (e) {
      // Non-fatal: fallback is counting queries elsewhere
      console.warn('Failed to update aggregate stats:', e);
    }
  }

  export async function addUserToBrevoList(
    email: string,
    listid: number,
    name: string
  ): Promise<{ error: boolean; msg: string }> {
    const apiKey = process.env.BREVO_API;
  
    if (!apiKey) {
      return { error: true, msg: "Brevo API Key fehlt!" };
    }
  
    try {
      const response = await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          email: email,
          attributes: {
            FNAME: name
          },
          listIds: [listid], // Die Liste, zu der der User hinzugefügt wird
          updateEnabled: true, // Falls der User schon existiert, wird er aktualisiert
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        return { error: true, msg: errorData.message || "Fehler beim Hinzufügen des Nutzers" };
      }
  
      return { error: false, msg: "User erfolgreich hinzugefügt" };
    } catch (err) {
      return { error: true, msg: "Ein unerwarteter Fehler ist aufgetreten " + err };
    }
  }

export async function navigateUser(type: UserRole, companyid: string) {
  switch (type) {
    case "company":
      redirect(`/company/${companyid}`);
    case "admin":
      redirect(`/admin/${companyid}`);
    case "partner":
      redirect(`/partner/${companyid}`);
  
    default:
      redirect(`/user/${companyid}`);
  }
}

export async function redirectUser(route: string) {
  redirect(route);
}