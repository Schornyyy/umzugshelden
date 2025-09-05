export const ALLOWED_CITY_SLUGS: string[] = [
  'berlin',
  'detmold',
  'frankfurt-am-main',
  'hamburg',
  'dortmund',
  'guetersloh',
  'hagen',
  'olpe',
  'muenster',
  'bielefeld',
  'bremen',
  'erftstadt',
  'duesseldorf',
  'koeln',
  'freising',
  'bonn',
  'abensberg',
  'erlangen',
  'gelsenkirchen',
  'bad-homburg-vor-der-hoehe',
  'aalen',
  'bad-neuenahr-ahrweiler',
  'garbsen'
];

// Mapping back to display names with Umlauts / spaces
export const CITY_DISPLAY_NAME: Record<string,string> = {
  'berlin':'Berlin',
  'detmold':'Detmold',
  'frankfurt-am-main':'Frankfurt am Main',
  'hamburg':'Hamburg',
  'dortmund':'Dortmund',
  'guetersloh':'Gütersloh',
  'hagen':'Hagen',
  'olpe':'Olpe',
  'muenster':'Münster',
  'bielefeld':'Bielefeld',
  'bremen':'Bremen',
  'erftstadt':'Erftstadt',
  'duesseldorf':'Düsseldorf',
  'koeln':'Köln',
  'freising':'Freising',
  'bonn':'Bonn',
  'abensberg':'Abensberg',
  'erlangen':'Erlangen',
  'gelsenkirchen':'Gelsenkirchen',
  'bad-homburg-vor-der-hoehe':'Bad Homburg vor der Höhe',
  'aalen':'Aalen',
  'bad-neuenahr-ahrweiler':'Bad Neuenahr-Ahrweiler',
  'garbsen':'Garbsen'
};

export function normalizeCityParam(raw: string){
  const decoded = decodeURIComponent(raw).toLowerCase();
  // replace umlauts to match slugs
  return decoded
    .replace(/ä/g,'ae')
    .replace(/ö/g,'oe')
    .replace(/ü/g,'ue')
    .replace(/ß/g,'ss')
    .replace(/\s+/g,'-');
}
