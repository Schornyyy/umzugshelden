"use server";

import { database } from "@/config/firebase";
import { ClickType, StatsType } from "@/types/StatsType";
import { addDoc, collection } from "firebase/firestore";

export const fetchCoordinates = async (city: string, postalCode: string) => {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${postalCode}&city=${city}&format=json`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
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