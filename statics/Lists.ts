

export function getServices(): string[] {
    return [
      "hausmeisterservice",
      "gebäudereinigung",
      "grunstückspflege"
    ];
  }



// Original Rohliste (Duplikate möglich) – interne Konstante
export const rawCities = [
  // === Mülheim an der Ruhr und direkter Umkreis (0-10km) ===
  'Mülheim an der Ruhr',
  'Speldorf', 'Heißen', 'Saarn', 'Dümpten', 'Styrum',
  'Broich', 'Winkhausen', 'Menden', 'Selbeck', 'Eppinghofen',
  
  // === Oberhausen und Umgebung (5-10km) ===
  'Oberhausen', 'Osterfeld', 'Sterkrade', 'Rheinhausen', 'Buschhausen',
  'Lipphardt', 'Tackenberg', 'Königshardt', 'Schlad', 'Göbel',
  
  // === Duisburg und Umgebung (5-15km) ===
  'Duisburg', 'Neudorf', 'Meiderich', 'Homberg', 'Hamborn',
  'Beeck', 'Friemersheim', 'Neumühl', 'Baerl', 'Buchholz',
  'Rheinhausen-Süd', 'Marxloh', 'Kaßlerfeld', 'Wanheimerort',
  
  // === Essen und südliches Umland (10-20km) ===
  'Essen', 'Kettwig', 'Werden', 'Steele', 'Kupferdreh',
  'Fischlaken', 'Bredeney', 'Schuir', 'Schonnebeck', 'Karnap',
  'Katernberg', 'Stoppenberg', 'Altenessen', 'Südviertel',
  
  // === Gelsenkirchen und Umgebung (12-20km) ===
  'Gelsenkirchen', 'Bismarck', 'Buer', 'Horst', 'Rotthausen',
  'Feldmark', 'Ückendorf', 'Scholven', 'Erle', 'Crange',
  'Hüsten', 'Resse', 'Beckhausen', 'Heßler',
  
  // === Bottrop und Umgebung (10-20km) ===
  'Bottrop', 'Eigen', 'Vonderort', 'Kirchhellen', 'Ebel',
  'Grafenwald', 'Frentrenberg', 'Fuhlenbrock', 'Jagstfeld',
  
  // === Moers und Umgebung (8-18km) ===
  'Moers', 'Rheinfels', 'Asberg', 'Vinn', 'Meerbeck',
  'Eick', 'Citadellenring', 'Utfort', 'Hochstadenring',
  
  // === Dinslaken und Umgebung (10-20km) ===
  'Dinslaken', 'Lohberg', 'Averbusch', 'Voßheide', 'Hiesfeld',
  'Hasbergen', 'Eickhoff', 'Mackeroth',
  
  // === Voerde (Niederrhein) und Umgebung (15-22km) ===
  'Voerde', 'Bergheim', 'Emmelsum', 'Orsoy', 'Blumenkamp',
  
  // === Hamm und östliches Umland (18-25km) ===
  'Hamm', 'Bockum-Hövel', 'Pelkum', 'Herringen', 'Rhynern',
  'Selbecke', 'Päschen', 'Walstedde', 'Uentrop',
  
  // === Hattingen und südliches Umland (15-22km) ===
  'Hattingen', 'Blankenstein', 'Niederbonsfeld', 'Elbschethal',
  'Holthausen', 'Bredeney', 'Winzen',
  
  // === Bochum und östliches Ruhrgebiet (15-23km) ===
  'Bochum', 'Langendreer', 'Dahlhausen', 'Gerthe', 'Linden',
  'Wattenscheid', 'Stiepel', 'Querenburg', 'Weitmar',
  
  // === Castrop-Rauxel und Umgebung (18-25km) ===
  'Castrop-Rauxel', 'Behringhausen', 'Deininghausen', 'Natrop',
  
  // === Wanne-Eickel / Herne (15-22km) ===
  'Herne', 'Eickel', 'Wanne-Süd', 'Teutoburgia',
  
  // === Recklinghausen und Umgebung (20-25km) ===
  'Recklinghausen', 'Süd', 'Hillen', 'Hochlar', 'Dorstfeld',
  
  // === Weitere Städte und Gemeinden im 25km Umkreis ===
  'Gladbeck', 'Zweckel', 'Rentrop', 'Üfterstraße',
  'Datteln', 'Lünen', 'Selm', 'Nordkirchen',
  'Waltrop', 'Marl', 'Dreieckskump', 'Sinsen',
  'Emmerich', 'Kleve', 'Goch', 'Kevelaer', 'Kervenheim',
  'Sonsbeck', 'Uedem', 'Geldern', 'Straelen',
  'Wesel', 'Bislich', 'Feldkirchen', 'Ginderich', 'Bliesendorf',
  'Xanten', 'Lüttingen', 'Wardt',
  'Bergisch Gladbach', 'Paffrath', 'Herrenstrunden', 'Much',
  'Leverkusen', 'Wiesdorf', 'Steinbüchel', 'Alkenrath',
  'Köln', 'Nippes', 'Chorweiler', 'Ossendorf', 'Mülheim',
  'Kalk', 'Poll', 'Zündorf', 'Porz',
  'Solingen', 'Ohligs', 'Höhscheid', 'Gräfrath',
  'Wuppertal', 'Elberfeld', 'Barmen', 'Ronsdorf', 'Vohwinkel',
  'Remscheid', 'Lüttringhausen', 'Lennep',
  'Iserlohn', 'Henkhausen', 'Sümmern', 'Letmathe',
  'Hagen', 'Wehringhausen', 'Elsey', 'Dahl',
  'Lüdenscheid', 'Breitscheid', 'Auf der Höhe',
  'Werdohl', 'Herkinghausen',
  'Meinerzhagen', 'Valbert', 'Außenborn',
  'Siegen', 'Geisweid', 'Eisnach',
  'Arnsberg', 'Menden', 'Balve', 'Hönnetal',
  'Unna', 'Kamen', 'Nordkamen', 'Bergkamen',
  'Bad Oeynhausen', 'Rehme', 'Dehme',
  'Löhne', 'Gohfeld', 'Rickert',
  'Herford', 'Schwarzenmoor', 'Hiddenhausen',
  'Bielefeld', 'Gadderbaum', 'Senne',
  'Gütersloh', 'Spexard', 'Sundern',
  'Warendorf', 'Beelen', 'Sassenberg',
  'Münster', 'Albachten', 'Gievenbeck', 'Nienberge',
  'Steinfurt', 'Borghorst', 'Altenberge',
  'Rheine', 'Hauenhorst', 'Altenrheine',
  'Osnabrück', 'Nahne', 'Voxtrup',
  'Bad Iburg', 'Glane', 'Hiltern',
  'Dortmund', 'Eving', 'Broich', 'Crange',
];

// Export: eindeutige Städte (Reihenfolge der ersten Vorkommen bleibt erhalten)
export const cities: string[] = Array.from(new Set(rawCities));

