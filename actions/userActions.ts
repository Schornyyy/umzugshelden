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