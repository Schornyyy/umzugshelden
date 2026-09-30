import type {
  CityServiceBlock,
  CityServiceKey,
  CityServiceTemplate,
} from "@/types/city/CityServicePage";

type ServiceContent = {
  name: string;
  title: string;
  description: string;
  intro: string;
  primaryKeyword: string;
  keywordVariants: readonly string[];
  image: string;
  imageAlt: string;
  overviewHeading: string;
  overviewText: readonly [string, string];
  details: readonly { title: string; text: string }[];
  features: readonly string[];
  useCasesHeading: string;
  useCases: readonly { title: string; text: string }[];
  tips: readonly string[];
  process: readonly string[];
  priceHeading: string;
  priceText: string;
  priceFactors: readonly string[];
  benefits: readonly string[];
  faqs: readonly { question: string; answer: string }[];
  additionalFaqs: readonly { question: string; answer: string }[];
  metaPromise: string;
};

const serviceContent = {
  umzugsservice: {
    name: "Umzugsservice",
    title: "Professioneller Umzugsservice",
    description:
      "Wohnungs-, Firmen- und Regionalumzug – zuverlässig, termingerecht und zu fairen Festpreisen.",
    intro:
      "Ein Umzug soll ein guter Start sein, nicht eine zusätzliche Belastung. Wir planen Ihren Umzug in {city} gemeinsam mit Ihnen und übernehmen auf Wunsch Verpackung, Transport, Möbelmontage und die Koordination am Umzugstag.",
    primaryKeyword: "Umzugsunternehmen",
    keywordVariants: [
      "Umzug",
      "Umzugsfirma",
      "Umzugsservice",
      "Privatumzug",
      "Firmenumzug",
      "Umzugskosten",
    ],
    image: "/images/Umzugsunternhemen_olpe.png",
    imageAlt: "Umzugsunternehmen für einen professionellen Umzug in {city}",
    overviewHeading: "Umzugsunternehmen in {city} für Privat- und Firmenumzüge",
    overviewText: [
      "Sie suchen ein zuverlässiges Umzugsunternehmen in {city}? Wir organisieren private Umzüge, Firmenumzüge und Wohnungswechsel mit einem festen Ansprechpartner. Nach der Besichtigung planen wir Personal, Fahrzeug, Verpackungsmaterial und Montage passend zu Ihrem Umzug.",
      "Unser Umzugsservice in {city} kann einzelne Arbeiten oder den kompletten Ablauf übernehmen: Kartons liefern, Hausrat verpacken, Möbel abbauen, sicher transportieren und am Ziel wieder aufbauen. Dadurch bleiben Termine, Zuständigkeiten und Umzugskosten für Sie nachvollziehbar.",
    ],
    details: [
      {
        title: "Privat- und Firmenumzüge",
        text: "Wir planen Wohnungs-, Haus- und Büroumzüge in {city} passend zu Ihrem Umfang, Ihrem Zeitplan und den örtlichen Gegebenheiten.",
      },
      {
        title: "Verpackung und Schutz",
        text: "Auf Wunsch bringen wir Kartons, Packmaterial und Möbeldecken mit und verpacken empfindliche Gegenstände fachgerecht.",
      },
      {
        title: "Möbelmontage und Einrichtung",
        text: "Wir bauen Möbel ab, sichern sie für den Transport und montieren sie am Zielort wieder, damit Sie schneller ankommen.",
      },
    ],
    features: [
      "Privatumzug",
      "Firmenumzug",
      "Verpackungsservice",
      "Möbelmontage",
      "Schwertransporte",
      "Kurzfristige Umzüge",
    ],
    useCasesHeading: "Umzüge in {city} passend zu Ihrer Situation",
    useCases: [
      {
        title: "Privatumzug und Wohnungswechsel",
        text: "Für Wohnungen und Häuser planen wir Tragewege, Etagen, Halteflächen, Möbelvolumen und den gewünschten Umzugstermin im Voraus.",
      },
      {
        title: "Firmen- und Büroumzug",
        text: "Arbeitsplätze, Akten und Büromöbel ziehen strukturiert um, damit Ausfallzeiten und Unterbrechungen möglichst kurz bleiben.",
      },
      {
        title: "Nahumzug und Fernumzug",
        text: "Ob innerhalb von {city} oder überregional: Wir koordinieren Beladung, Transport, Entladung und Zusatzleistungen aus einer Hand.",
      },
    ],
    tips: [
      "Den gewünschten Umzugstermin möglichst früh mitteilen, besonders zum Monatsende.",
      "Stockwerke, Aufzüge, Parksituation und enge Zugänge vorab nennen.",
      "Wertgegenstände, Dokumente und Medikamente separat und griffbereit halten.",
    ],
    process: [
      "Kostenlose Beratung und Besichtigung",
      "Verbindliches Festpreisangebot",
      "Vorbereitung, Verpackung und Möbelmontage",
      "Sicherer Transport und Aufbau am Zielort",
    ],
    priceHeading: "Was kostet ein Umzug in {city}?",
    priceText:
      "Seriöse Umzugskosten richten sich nach dem tatsächlichen Aufwand. Deshalb klären wir die wichtigsten Eckdaten vorab und erstellen ein nachvollziehbares Festpreisangebot statt einer unklaren Pauschalschätzung.",
    priceFactors: [
      "Wohnungsgröße und Menge des Umzugsguts",
      "Entfernung, Etagen, Aufzug und Tragewege",
      "Möbelabbau, Möbelaufbau und Verpackungsservice",
      "Halteverbotszone, Sondertransporte und Wunschtermin",
    ],
    benefits: [
      "Festes Preisangebot – keine versteckten Kosten",
      "Erfahrenes und freundliches Team",
      "Moderne Fahrzeuge & professionelles Equipment",
      "Flexibel bei Terminen, auch am Wochenende",
      "Komplett-Service aus einer Hand",
    ],
    faqs: [
      {
        question: "Was kostet ein Umzug in {city}?",
        answer:
          "Der Preis richtet sich nach Umfang, Entfernung, Stockwerken und gewünschten Zusatzleistungen. Nach der Beratung erhalten Sie ein verbindliches Festpreisangebot.",
      },
      {
        question: "Übernehmen Sie auch das Verpacken?",
        answer:
          "Ja. Wir verpacken Ihren Hausrat auf Wunsch mit professionellem Material und schützen Möbel sowie empfindliche Gegenstände für den Transport.",
      },
      {
        question: "Wie kurzfristig ist ein Termin möglich?",
        answer:
          "Wir versuchen auch bei kurzfristigen Umzügen in {city} eine Lösung zu finden. Je früher Sie anfragen, desto besser können wir Ihren Wunschtermin berücksichtigen.",
      },
    ],
    additionalFaqs: [
      {
        question: "Bieten Sie auch komplette Umzüge in {city} an?",
        answer:
          "Ja. Sie können Transport, Verpackung, Möbelmontage und weitere abgestimmte Leistungen als Komplettumzug beauftragen oder nur einzelne Arbeiten auswählen.",
      },
      {
        question: "Wie erhalte ich ein Festpreisangebot für meinen Umzug?",
        answer:
          "Senden Sie uns die wichtigsten Angaben zu Adressen, Wohnungsgröße, Etagen, Termin und gewünschten Zusatzleistungen. Bei Bedarf vereinbaren wir eine kostenlose Besichtigung in {city}.",
      },
    ],
    metaPromise:
      "Privat- und Firmenumzüge mit fester Planung und transparentem Angebot",
  },
  anstricharbeiten: {
    name: "Anstricharbeiten",
    title: "Anstricharbeiten für die Wohnungsübergabe",
    description:
      "Streichen, Tapezieren und Schönheitsreparaturen – wir bereiten Ihre Wohnung termingerecht für die Übergabe vor.",
    intro:
      "Eine Wohnungsübergabe in {city} steht bevor? Wir übernehmen die Renovierung sorgfältig und mit einem klaren Plan. Von kleinen Ausbesserungen bis zum kompletten Neuanstrich erhalten Sie alles aus einer Hand.",
    primaryKeyword: "Anstricharbeiten",
    keywordVariants: [
      "Anstricharbeiten",
      "Wohnung streichen",
      "Renovierung",
      "Tapezierarbeiten",
      "Schönheitsreparaturen",
      "Wohnungsübergabe",
    ],
    image: "/images/anstricharbeiten.webp",
    imageAlt: "Professionelle Anstricharbeiten in {city}",
    overviewHeading: "Anstricharbeiten in {city}",
    overviewText: [
      "Für Anstricharbeiten in {city} übernehmen wir die Vorbereitung und Ausführung von Wänden und Decken. Dazu gehören je nach Zustand Abkleben, Spachteln, Schleifen, Grundieren und ein gleichmäßiger Anstrich mit abgestimmten Materialien.",
      "Besonders bei Auszug, Einzug oder Wohnungsübergabe ist ein verlässlicher Fertigstellungstermin wichtig. Wir stimmen die Anstricharbeiten in {city} mit Ihrem Zeitplan ab und führen Material sowie vereinbarte Nebenarbeiten transparent im Angebot auf.",
    ],
    details: [
      {
        title: "Wände und Decken",
        text: "Wir streichen Wände und Decken deckend und sauber in der gewünschten Farbe. Für Übergaben sind neutrale Farbtöne besonders sinnvoll.",
      },
      {
        title: "Ausbesserungen vor dem Anstrich",
        text: "Dübellöcher, kleine Risse und Gebrauchsspuren bereiten wir sorgfältig vor, damit ein gleichmäßiges Ergebnis entsteht.",
      },
      {
        title: "Tapeten und Lackierarbeiten",
        text: "Auch Tapeten entfernen, Türen, Leisten oder Heizkörper lackieren wir nach vorheriger Abstimmung in {city}.",
      },
    ],
    features: [
      "Wände streichen",
      "Decken renovieren",
      "Tapezieren",
      "Lackierarbeiten",
      "Schönheitsreparaturen",
      "Spachteln & Schleifen",
    ],
    useCasesHeading: "Renovierung in {city} für Wohnung, Haus und Gewerbe",
    useCases: [
      {
        title: "Wohnung streichen bei Auszug",
        text: "Wir beseitigen übliche Gebrauchsspuren und bereiten Wände und Decken für eine ordentliche Wohnungsübergabe vor.",
      },
      {
        title: "Renovierung vor dem Einzug",
        text: "Leere Räume lassen sich effizient streichen, tapezieren und in der gewünschten Farbgestaltung fertigstellen.",
      },
      {
        title: "Büro- und Gewerberäume",
        text: "Anstriche für kleinere Gewerbeflächen planen wir so, dass Termine und betriebliche Abläufe berücksichtigt werden.",
      },
    ],
    tips: [
      "Übergabetermin und gewünschtes Fertigstellungsdatum direkt bei der Anfrage nennen.",
      "Fotos von Räumen, Schäden oder auffälligen Flächen helfen bei der ersten Einschätzung.",
      "Mietvertrag oder Abnahmeprotokoll bereithalten, falls konkrete Renovierungsanforderungen bestehen.",
    ],
    process: [
      "Kostenlose Besichtigung vor Ort",
      "Festpreisangebot und Terminabstimmung",
      "Abkleben, Spachteln und fachgerechter Anstrich",
      "Gemeinsame Abnahme zur übergabefertigen Wohnung",
    ],
    priceHeading: "Kosten für Anstricharbeiten in {city}",
    priceText:
      "Die Kosten für Anstricharbeiten hängen nicht nur von der Quadratmeterzahl ab. Untergrund, gewünschte Farbe, Abdeckaufwand und notwendige Vorarbeiten entscheiden darüber, wie viel Material und Arbeitszeit benötigt werden.",
    priceFactors: [
      "Größe und Anzahl der zu streichenden Flächen",
      "Zustand von Wänden, Decken und Untergrund",
      "Spachtel-, Schleif-, Grundier- und Tapezierarbeiten",
      "Materialqualität, Farbauswahl und Fertigstellungstermin",
    ],
    benefits: [
      "Termingerecht zur Wohnungsübergabe",
      "Hochwertige Materialien inklusive",
      "Saubere und ordentliche Arbeitsweise",
      "Faire Festpreise ohne Überraschungen",
      "Erfahrene Handwerker",
    ],
    faqs: [
      {
        question: "Wie schnell sind Anstricharbeiten in {city} erledigt?",
        answer:
          "Ein Standardauftrag dauert je nach Wohnungsgröße und Zustand häufig ein bis drei Tage. Bei engen Übergabeterminen stimmen wir den Ablauf frühzeitig mit Ihnen ab.",
      },
      {
        question: "Sind Farben und Material im Angebot enthalten?",
        answer:
          "Das passende Material wird im Festpreisangebot transparent aufgeführt. So wissen Sie vorab, welche Leistungen und Materialien enthalten sind.",
      },
      {
        question: "Können Sie auch Löcher und Risse ausbessern?",
        answer:
          "Ja. Kleine Beschädigungen, Dübellöcher und Risse werden vor dem Anstrich verspachtelt und geschliffen.",
      },
    ],
    additionalFaqs: [
      {
        question: "Streichen Sie komplette Wohnungen in {city}?",
        answer:
          "Ja. Wir übernehmen einzelne Räume ebenso wie komplette Wohnungen oder Häuser und stimmen den Leistungsumfang vor Beginn eindeutig mit Ihnen ab.",
      },
      {
        question: "Sind Anstricharbeiten vor einer Wohnungsübergabe möglich?",
        answer:
          "Ja. Teilen Sie uns den Übergabetermin möglichst früh mit. Wir prüfen den Zustand, planen notwendige Vorarbeiten und richten die Fertigstellung danach aus.",
      },
    ],
    metaPromise:
      "Renovierung, Streichen und Schönheitsreparaturen zum klar vereinbarten Termin",
  },
  "moebel-service": {
    name: "Möbel Ab- & Aufbau",
    title: "Möbel Ab- und Aufbauservice",
    description:
      "Von IKEA bis zur Einbauküche – wir demontieren und montieren Ihre Möbel schnell, sicher und ohne Kratzer.",
    intro:
      "Ob einzelnes Möbelstück oder komplette Einrichtung: Unser Montageteam kommt zu Ihnen nach {city} und bringt das passende Werkzeug direkt mit. Fotos helfen uns, den Aufwand bereits vorab realistisch einzuschätzen.",
    primaryKeyword: "Möbelmontage",
    keywordVariants: [
      "Möbelaufbau",
      "Möbelabbau",
      "Montageservice",
      "IKEA Montageservice",
      "Schrank aufbauen",
      "Küchenmontage",
    ],
    image: "/images/möbel aufbau service.webp",
    imageAlt: "Möbelmontage und Möbelaufbau in {city}",
    overviewHeading: "Möbelmontage und Möbelaufbau in {city}",
    overviewText: [
      "Unser Montageservice in {city} unterstützt Sie beim fachgerechten Aufbau und Abbau von Schränken, Betten, Regalen, Büromöbeln und vielen gängigen Möbelsystemen. Werkzeug und benötigtes Montagematerial stimmen wir vor dem Termin mit Ihnen ab.",
      "Wenn die Möbelmontage Teil eines Umzugs ist, koordinieren wir Demontage, sicheren Transport und Wiederaufbau in einem Ablauf. Auch einzelne Montageaufträge in {city} sind möglich, etwa nach einer Möbellieferung oder bei einer neuen Raumaufteilung.",
    ],
    details: [
      {
        title: "Schränke, Regale und Betten",
        text: "Von der PAX-Kombination bis zum Bettgestell demontieren und montieren wir gängige Möbel sorgfältig und passend zum neuen Raum.",
      },
      {
        title: "Küchen und komplexe Möbel",
        text: "Einbauküchen, große Schrankwände und besondere Möbel stimmen wir vorab detailliert ab. Fotos oder Anleitungen sind dabei hilfreich.",
      },
      {
        title: "Montage mit eigenem Werkzeug",
        text: "Unser Team kommt in {city} mit professionellem Werkzeug und achtet auf einen schonenden Umgang mit allen Möbelteilen.",
      },
    ],
    features: [
      "IKEA & Möbelhaus-Möbel",
      "Einbauküchen",
      "Schrankwände & Regale",
      "Betten & Matratzen",
      "Büromöbel",
      "Sonstige Möbel",
    ],
    useCasesHeading: "Montageservice in {city} für unterschiedliche Möbel",
    useCases: [
      {
        title: "Schränke, Betten und Regale",
        text: "Wir montieren gängige Möbel sorgfältig, richten Bauteile aus und kontrollieren Stabilität und Funktion.",
      },
      {
        title: "IKEA- und Systemmöbel",
        text: "Modulare Möbel und größere Kombinationen werden nach Anleitung oder anhand der vorhandenen Bauteile aufgebaut.",
      },
      {
        title: "Büromöbel und Umzugsmontage",
        text: "Schreibtische, Regale und Schränke demontieren wir für den Transport und bauen sie am neuen Standort wieder auf.",
      },
    ],
    tips: [
      "Fotos oder vorhandene Montageanleitungen vorab teilen, besonders bei Küchen und großen Schränken.",
      "Zugangswege, Stockwerke und Parksituation am Einsatzort nennen.",
      "Entscheiden, ob Möbel abgebaut, aufgebaut oder beides erledigt werden soll.",
    ],
    process: [
      "Möbel und Zugangswege kurz abstimmen",
      "Verbindliches Angebot zum Festpreis",
      "Sorgfältiger Ab- oder Aufbau mit eigenem Werkzeug",
      "Kontrolle auf Stabilität und Vollständigkeit",
    ],
    priceHeading: "Kosten für Möbelmontage in {city}",
    priceText:
      "Für ein passendes Angebot benötigen wir Informationen zu Art, Anzahl und Zustand der Möbel. Fotos, Produktlinks oder Montageanleitungen helfen dabei, Arbeitszeit und benötigte Werkzeuge realistisch zu kalkulieren.",
    priceFactors: [
      "Anzahl, Größe und Bauart der Möbel",
      "Vorhandene Anleitung und Vollständigkeit der Beschläge",
      "Abbau, Transport und Wiederaufbau",
      "Wandbefestigung, Anpassungen und Zugänglichkeit",
    ],
    benefits: [
      "Kein Stress beim Umziehen",
      "Erfahrenes Montageteam",
      "Kein Werkzeug nötig – wir bringen alles mit",
      "Schonender Umgang mit Ihren Möbeln",
      "Kombination mit Umzugsservice möglich",
    ],
    faqs: [
      {
        question: "Welche Möbel montieren Sie in {city}?",
        answer:
          "Wir übernehmen die Montage und Demontage von gängigen Möbeln wie Schränken, Betten, Regalen, Büromöbeln und vielen IKEA-Systemen.",
      },
      {
        question: "Brauche ich die Originalanleitung?",
        answer:
          "Eine Anleitung ist hilfreich, aber nicht immer nötig. Fotos vom aufgebauten Zustand oder Informationen zu Marke und Modell erleichtern die Planung.",
      },
      {
        question: "Lässt sich Möbelmontage mit einem Umzug kombinieren?",
        answer:
          "Ja. Wir können Transport, Abbau und Aufbau in einem abgestimmten Termin bündeln.",
      },
    ],
    additionalFaqs: [
      {
        question: "Bieten Sie Möbelaufbau als einzelnen Auftrag in {city} an?",
        answer:
          "Ja. Unser Montageservice kann unabhängig von einem Umzug gebucht werden. Senden Sie uns dafür am besten Fotos oder Produktinformationen der Möbel.",
      },
      {
        question: "Können große Schränke für einen Umzug abgebaut werden?",
        answer:
          "Ja. Wir demontieren geeignete Schränke transportsicher und bauen sie am Zielort nach Absprache wieder auf.",
      },
    ],
    metaPromise:
      "Möbelabbau und Möbelaufbau mit passendem Werkzeug und klarer Kalkulation",
  },
  "senior-umzug": {
    name: "Seniorenumzug",
    title: "Einfühlsamer Seniorenumzug",
    description:
      "Wir begleiten Senioren und Angehörige mit Geduld und Sorgfalt beim Umzug in eine neue Wohnung, ins betreute Wohnen oder ins Pflegeheim.",
    intro:
      "Ein Umzug im Alter braucht Zeit, Vertrauen und eine gute Planung. In {city} begleiten wir Sie oder Ihre Angehörigen persönlich – vom ersten Gespräch bis zur Einrichtung des neuen Zuhauses.",
    primaryKeyword: "Seniorenumzug",
    keywordVariants: [
      "Umzug im Alter",
      "Seniorenumzugsservice",
      "Umzug ins Pflegeheim",
      "Umzug ins betreute Wohnen",
      "Umzugshilfe für Senioren",
      "Haushaltsverkleinerung",
    ],
    image: "/images/senioren_umzüge.webp",
    imageAlt: "Persönlich begleiteter Seniorenumzug in {city}",
    overviewHeading: "Seniorenumzug in {city} mit persönlicher Begleitung",
    overviewText: [
      "Ein Seniorenumzug in {city} erfordert neben guter Logistik vor allem Ruhe, klare Absprachen und Rücksicht auf persönliche Bedürfnisse. Wir planen den Wohnungswechsel gemeinsam mit der umziehenden Person, Angehörigen oder einer betreuenden Einrichtung.",
      "Unser Seniorenumzugsservice kann Verpackung, Möbelabbau, Transport, Aufbau und das Einräumen im neuen Zuhause verbinden. Bei einem Umzug ins Pflegeheim oder betreute Wohnen in {city} berücksichtigen wir Zeitfenster, Raumplanung und wichtige Erinnerungsstücke besonders sorgfältig.",
    ],
    details: [
      {
        title: "Umzug mit persönlicher Begleitung",
        text: "Wir nehmen uns Zeit für eine ruhige Planung und richten den Ablauf in {city} nach den Bedürfnissen der umziehenden Person und ihrer Angehörigen aus.",
      },
      {
        title: "Pflegeheim und betreutes Wohnen",
        text: "Beim Umzug in eine Einrichtung stimmen wir uns auf Wunsch mit Angehörigen und Ansprechpartnern vor Ort ab.",
      },
      {
        title: "Haushaltsauflösung als Ergänzung",
        text: "Nicht benötigter Hausrat kann geordnet entrümpelt, verwertet oder fachgerecht entsorgt werden.",
      },
    ],
    features: [
      "Umzug in Wohnung, betreutes Wohnen oder Pflegeheim",
      "Sorgfältiges Ein- und Auspacken",
      "Möbelabbau und Aufbau im neuen Zuhause",
      "Koordination mit Angehörigen und Einrichtungen",
      "Haushaltsauflösung und Entrümpelung auf Wunsch",
      "Persönliche Begleitung am Umzugstag",
    ],
    useCasesHeading: "Umzugshilfe für Senioren in {city}",
    useCases: [
      {
        title: "Umzug ins betreute Wohnen",
        text: "Wir stimmen Möbel, Platzbedarf und Termin mit Bewohnern, Angehörigen und der neuen Einrichtung ab.",
      },
      {
        title: "Umzug ins Pflegeheim",
        text: "Persönliche Gegenstände werden sorgfältig ausgewählt, verpackt und im neuen Zimmer nach Wunsch eingerichtet.",
      },
      {
        title: "Wohnung verkleinern",
        text: "Beim Wechsel in ein kleineres Zuhause verbinden wir Umzug, Möbelmontage und auf Wunsch die geordnete Haushaltsauflösung.",
      },
    ],
    tips: [
      "Wichtige Medikamente, Dokumente und persönliche Erinnerungsstücke separat vorbereiten.",
      "Grundriss oder Fotos des neuen Zuhauses helfen bei der Einrichtungsplanung.",
      "Angehörige und Einrichtung frühzeitig in die Terminabstimmung einbeziehen.",
    ],
    process: [
      "Kostenlose Beratung mit Ihnen und Ihren Angehörigen",
      "Ruhige Planung aller Schritte und Termine",
      "Sicheres Verpacken, Transportieren und Aufbauen",
      "Einrichten des neuen Zuhauses nach Ihren Wünschen",
    ],
    priceHeading: "Kosten für einen Seniorenumzug in {city}",
    priceText:
      "Der Preis richtet sich nach Haushaltsumfang und gewünschter Unterstützung. Ein persönliches Gespräch oder eine Besichtigung schafft Klarheit darüber, welche Möbel mitziehen und welche zusätzlichen Arbeiten sinnvoll sind.",
    priceFactors: [
      "Umfang des Hausrats und Größe des neuen Zuhauses",
      "Einpacken, Auspacken und Einräumen",
      "Möbelmontage und Koordination mit der Einrichtung",
      "Entrümpelung oder Haushaltsauflösung als Ergänzung",
    ],
    benefits: [
      "Einfühlsames Team mit Zeit für Ihre Situation",
      "Ein fester Ansprechpartner für Angehörige",
      "Sorgfältiger Umgang mit Erinnerungsstücken",
      "Planbarer Festpreis ohne Überraschungen",
      "Komplettservice aus einer Hand",
    ],
    faqs: [
      {
        question: "Führen Sie auch Umzüge ins Pflegeheim in {city} durch?",
        answer:
          "Ja. Wir organisieren den Umzug in betreutes Wohnen, Seniorenresidenzen oder Pflegeeinrichtungen und stimmen Details gern mit Angehörigen ab.",
      },
      {
        question: "Helfen Sie beim Ein- und Auspacken?",
        answer:
          "Auf Wunsch übernehmen wir das sorgfältige Verpacken, Auspacken und Einräumen, damit das neue Zuhause schneller vertraut wird.",
      },
      {
        question: "Wie viel Vorlauf ist sinnvoll?",
        answer:
          "Für eine entspannte Planung empfehlen wir mehrere Wochen Vorlauf. Bei dringenden Situationen prüfen wir selbstverständlich kurzfristige Möglichkeiten.",
      },
    ],
    additionalFaqs: [
      {
        question: "Können Angehörige den Seniorenumzug aus der Ferne organisieren?",
        answer:
          "Ja. Wir vereinbaren einen festen Ansprechpartner und stimmen Besichtigung, Leistungsumfang und Termine telefonisch oder digital mit den Angehörigen ab.",
      },
      {
        question: "Richten Sie das neue Zuhause in {city} auch ein?",
        answer:
          "Nach Absprache bauen wir Möbel auf, stellen sie nach Plan und helfen beim Auspacken, damit wichtige Dinge direkt erreichbar sind.",
      },
    ],
    metaPromise:
      "Persönlich begleitete Umzüge mit festen Ansprechpartnern und planbarem Ablauf",
  },
  entruempelung: {
    name: "Entrümpelung",
    title: "Entrümpelung und Haushaltsauflösung",
    description:
      "Wohnungen, Häuser, Keller und Gewerberäume räumen wir diskret, fachgerecht und besenrein – inklusive umweltgerechter Entsorgung.",
    intro:
      "Bei einer Entrümpelung in {city} zählen klare Absprachen und ein respektvoller Umgang mit dem Hausrat. Nach einer kostenlosen Besichtigung erhalten Sie ein transparentes Festpreisangebot inklusive Entsorgung.",
    primaryKeyword: "Entrümpelung",
    keywordVariants: [
      "Entrümpelungsfirma",
      "Haushaltsauflösung",
      "Wohnungsauflösung",
      "Kellerentrümpelung",
      "Hausentrümpelung",
      "besenreine Räumung",
    ],
    image: "/images/entrümpelung.webp",
    imageAlt: "Entrümpelung und Haushaltsauflösung in {city}",
    overviewHeading: "Entrümpelung und Haushaltsauflösung in {city}",
    overviewText: [
      "Als Entrümpelungsfirma für {city} räumen wir Wohnungen, Häuser, Keller, Dachböden, Garagen und kleinere Gewerbeflächen. Vor Beginn klären wir, was erhalten, verwertet, gespendet oder fachgerecht entsorgt werden soll.",
      "Bei einer Haushaltsauflösung in {city} erhalten Sie nach der Besichtigung ein transparentes Angebot inklusive der vereinbarten Räumungs- und Entsorgungsleistungen. Verwertbare Gegenstände können nach Prüfung angerechnet werden; auf Wunsch übergeben wir die Räume besenrein.",
    ],
    details: [
      {
        title: "Wohnungen, Häuser und Nebenräume",
        text: "Wir räumen einzelne Zimmer, komplette Wohnungen, Häuser, Keller, Dachböden und Garagen in {city} zuverlässig leer.",
      },
      {
        title: "Haushaltsauflösungen mit Respekt",
        text: "Bei Nachlässen und sensiblen Situationen gehen wir diskret vor und besprechen den Umgang mit wichtigen Gegenständen vor Beginn der Arbeiten.",
      },
      {
        title: "Verwertung und Entsorgung",
        text: "Verwertbare Gegenstände berücksichtigen wir bei der Wertanrechnung. Der übrige Hausrat wird sortiert und fachgerecht entsorgt.",
      },
    ],
    features: [
      "Wohnungs- und Hausentrümpelung",
      "Haushaltsauflösungen mit Diskretion",
      "Keller-, Dachboden- und Garagenräumung",
      "Gewerbe- und Büroentrümpelung",
      "Wertanrechnung für verwertbare Gegenstände",
      "Besenreine Übergabe und fachgerechte Entsorgung",
    ],
    useCasesHeading: "Räumungen in {city} für jeden Umfang",
    useCases: [
      {
        title: "Wohnungs- und Hausentrümpelung",
        text: "Von einzelnen Räumen bis zum vollständigen Objekt planen wir Personal, Fahrzeuge und Entsorgungswege passend zum Umfang.",
      },
      {
        title: "Haushalts- und Nachlassauflösung",
        text: "In sensiblen Situationen arbeiten wir diskret und halten wichtige Dokumente oder Erinnerungsstücke gesondert zurück.",
      },
      {
        title: "Keller, Garage und Gewerbe",
        text: "Auch Nebenräume, Lager und kleinere Gewerbeflächen werden strukturiert geräumt und vereinbarungsgemäß übergeben.",
      },
    ],
    tips: [
      "Fotos der Räume oder Gegenstände geben uns vorab einen guten ersten Überblick.",
      "Besondere Gegenstände wie Wertstücke, Elektrogeräte oder Sondermüll direkt ansprechen.",
      "Bei einer Wohnungsübergabe den gewünschten Räumungs- und Abnahmetermin nennen.",
    ],
    process: [
      "Kostenlose Besichtigung und Aufwandseinschätzung",
      "Verbindliches Angebot inklusive Entsorgungskosten",
      "Strukturierte Räumung durch unser Team",
      "Verwertung, Entsorgung und besenreine Übergabe",
    ],
    priceHeading: "Was kostet eine Entrümpelung in {city}?",
    priceText:
      "Eine belastbare Kalkulation berücksichtigt Menge, Materialarten, Zugänglichkeit und Entsorgungskosten. Nach einer Besichtigung können wir den Aufwand einschätzen und ein verbindliches Angebot für die Räumung erstellen.",
    priceFactors: [
      "Menge und Art des zu räumenden Hausrats",
      "Etagen, Laufwege, Aufzug und Parksituation",
      "Entsorgungsgebühren und besondere Materialien",
      "Wertanrechnung und gewünschter Übergabezustand",
    ],
    benefits: [
      "Kostenlose Besichtigung und verbindlicher Festpreis",
      "Schnelle Termine, auch bei Zeitdruck",
      "Respektvoller Umgang bei sensiblen Situationen",
      "Wertanrechnung und nachhaltige Verwertung",
      "Besenreine Übergabe auf Wunsch",
    ],
    faqs: [
      {
        question: "Was kostet eine Entrümpelung in {city}?",
        answer:
          "Kosten und Dauer hängen von Menge, Zugänglichkeit und Art der Gegenstände ab. Nach der kostenlosen Besichtigung erhalten Sie einen verbindlichen Festpreis.",
      },
      {
        question: "Werden verwertbare Gegenstände angerechnet?",
        answer:
          "Gut erhaltene Möbel, Metalle oder andere verwertbare Gegenstände können nach Prüfung den Entrümpelungspreis reduzieren.",
      },
      {
        question: "Ist eine besenreine Übergabe möglich?",
        answer:
          "Ja. Nach der Räumung hinterlassen wir die vereinbarten Räume besenrein und bereit für die weitere Übergabe oder Nutzung.",
      },
    ],
    additionalFaqs: [
      {
        question: "Übernehmen Sie komplette Haushaltsauflösungen in {city}?",
        answer:
          "Ja. Wir räumen den vereinbarten Hausrat, berücksichtigen verwertbare Gegenstände und übergeben Wohnung oder Haus auf Wunsch besenrein.",
      },
      {
        question: "Kann eine Entrümpelung kurzfristig durchgeführt werden?",
        answer:
          "Bei dringenden Übergabe- oder Verkaufsterminen prüfen wir kurzfristige Kapazitäten. Fotos und vollständige Angaben helfen uns bei einer schnellen Einschätzung.",
      },
    ],
    metaPromise:
      "Entrümpelung und Haushaltsauflösung mit Besichtigung und verbindlichem Angebot",
  },
} satisfies Record<CityServiceKey, ServiceContent>;

function copyCards(items: readonly { title: string; text: string }[]) {
  return items.map((item) => ({ ...item }));
}

export function createDefaultCityServiceTemplate(
  serviceKey: CityServiceKey,
  ownerId: string,
  timestamp = Date.now(),
): CityServiceTemplate {
  const content = serviceContent[serviceKey];
  const blocks: CityServiceBlock[] = [
    {
      id: "hero",
      type: "hero",
      enabled: true,
      tone: "navy",
      title: "{primaryKeyword} in {city}",
      description: `${content.title}: ${content.description}`,
      image: content.image,
      imageAlt: content.imageAlt,
      formTitle: "Angebot für {service} anfordern",
      formText:
        "In wenigen Schritten zu Ihrem unverbindlichen Angebot für {city}.",
    },
    {
      id: "intro",
      type: "intro",
      enabled: true,
      tone: "white",
      heading:
        "{primaryKeyword} in {city}: regional und verbindlich geplant",
      text: `${content.intro} {localIntro}`,
    },
    {
      id: "overview",
      type: "imageText",
      enabled: true,
      tone: "muted",
      eyebrow: "Persönlich vor Ort in {city}",
      heading: content.overviewHeading,
      paragraphs: [...content.overviewText],
      image: "/images/Umzugsunternehmen_Olpe.png",
      imageAlt: "{primaryKeyword} in {city} mit den Umzugshelden",
      imagePosition: "left",
      ctaLabel: "Leistung kostenlos anfragen",
      ctaUrl: "#kontakt",
    },
    {
      id: "local-area",
      type: "localArea",
      enabled: true,
      tone: "accent",
      eyebrow: "Regionaler Einsatz im {region}",
      heading: "{service} in {city} und der direkten Umgebung",
      nearbyLimit: 3,
      showFacts: true,
    },
    {
      id: "details",
      type: "cardGrid",
      enabled: true,
      tone: "white",
      heading: "Leistungen für {service} in {city}",
      intro:
        "Wir stimmen den Umfang mit Ihnen ab und erstellen daraus ein klares Angebot.",
      cards: copyCards(content.details),
      columns: 3,
      numbered: false,
    },
    {
      id: "features",
      type: "checkList",
      enabled: true,
      tone: "muted",
      heading: "Unser Leistungsumfang für {service} in {city}",
      items: [...content.features],
      columns: 3,
    },
    {
      id: "use-cases",
      type: "cardGrid",
      enabled: true,
      tone: "white",
      eyebrow: "Für private und gewerbliche Aufträge",
      heading: content.useCasesHeading,
      cards: copyCards(content.useCases),
      columns: 3,
      numbered: true,
    },
    {
      id: "tips",
      type: "checkList",
      enabled: true,
      tone: "muted",
      heading: "Auftrag in {city} gut vorbereiten",
      intro: "Diese Informationen helfen uns, Ihren Auftrag präzise zu planen.",
      items: [...content.tips],
      columns: 3,
    },
    {
      id: "process",
      type: "process",
      enabled: true,
      tone: "white",
      heading: "So läuft {service} in {city} ab",
      intro: "Transparent geplant und auf Ihren Termin abgestimmt.",
      steps: [...content.process],
    },
    {
      id: "pricing",
      type: "pricing",
      enabled: true,
      tone: "accent",
      eyebrow: "Transparent kalkuliert",
      heading: content.priceHeading,
      text: content.priceText,
      factors: [...content.priceFactors],
      ctaTitle: "Kostenlos und unverbindlich kalkulieren lassen",
      ctaText:
        "Beschreiben Sie Ihren Auftrag in {city}. Wir prüfen die Angaben und melden uns mit den nächsten Schritten für ein passendes Angebot.",
      ctaLabel: "Angebot anfordern",
    },
    {
      id: "benefits",
      type: "checkList",
      enabled: true,
      tone: "navy",
      heading: "Ihre Vorteile mit Umzugshelden in {city}",
      items: [...content.benefits],
      columns: 2,
    },
    {
      id: "faq",
      type: "faq",
      enabled: true,
      tone: "white",
      heading: "Häufige Fragen zu {service} in {city}",
      items: [...content.faqs, ...content.additionalFaqs].map((item) => ({
        ...item,
      })),
      includeLocalQuestion: true,
    },
    {
      id: "contact",
      type: "contact",
      enabled: true,
      tone: "white",
      heading: "Kostenloses Angebot für {service} in {city}",
      text: "Wir melden uns innerhalb von 24 Stunden mit einem unverbindlichen Angebot bei Ihnen.",
      showPhone: true,
      showEmail: true,
      showForm: true,
    },
    {
      id: "nearby-cities",
      type: "nearbyCities",
      enabled: true,
      tone: "muted",
      heading: "{service} im Umkreis von {city}",
      intro:
        "Wir sind auch in diesen Städten rund um {city} für Sie im Einsatz – sortiert nach Entfernung.",
      limit: 12,
      radiusKm: 50,
      showDistance: true,
    },
    {
      id: "other-services",
      type: "otherServices",
      enabled: true,
      tone: "muted",
      heading: "Weitere Leistungen in {city}",
    },
  ];

  return {
    id: serviceKey,
    ownerId,
    serviceKey,
    serviceName: content.name,
    primaryKeyword: content.primaryKeyword,
    blocks,
    seo: {
      title: "{primaryKeyword} {city} | Umzugshelden",
      description: `{primaryKeyword} in {city}, {region}: ${content.metaPromise}. Kostenlos und unverbindlich anfragen.`,
      image: content.image,
      imageAlt: content.imageAlt,
      schemaDescription: `{primaryKeyword} in {city}: ${content.metaPromise}. Einsatzgebiet {region}.`,
      keywords: [content.primaryKeyword, ...content.keywordVariants],
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    version: 1,
  };
}

export function createDefaultCityServiceTemplates(
  ownerId: string,
  timestamp = Date.now(),
) {
  return (
    [
      "umzugsservice",
      "anstricharbeiten",
      "moebel-service",
      "senior-umzug",
      "entruempelung",
    ] as const
  ).map((serviceKey) =>
    createDefaultCityServiceTemplate(serviceKey, ownerId, timestamp),
  );
}

export function getDefaultCityServiceName(serviceKey: CityServiceKey) {
  return serviceContent[serviceKey].name;
}

export function getDefaultCityServiceSummary(serviceKey: CityServiceKey) {
  const content = serviceContent[serviceKey];
  return {
    name: content.name,
    description: content.description,
    image: content.image,
  };
}