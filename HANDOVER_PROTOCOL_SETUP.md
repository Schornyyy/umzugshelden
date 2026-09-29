# Übergabeprotokoll: Online-Unterschrift

Der öffentliche Kundenlink greift ausschließlich über serverseitige API-Routen auf Firestore zu. Dafür benötigt die Anwendung Firebase-Admin-Zugangsdaten.

## Umgebungsvariablen

Eine der folgenden Firebase-Admin-Varianten konfigurieren:

```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

Alternativ als einzelne Werte:

```env
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Zusätzlich werden die bereits vom E-Mail-Versand verwendeten SMTP-Werte benötigt:

```env
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
NEXT_PUBLIC_BASE_URL=https://umzugshelden.io
```

`NEXT_PUBLIC_BASE_URL` bestimmt die Domain im Kundenlink. Ohne diesen Wert wird die Origin des API-Aufrufs verwendet.

## Firestore

Die Tokens liegen nur gehasht in `crm_handover_protocol_access_umzugshelden`. Clientzugriff auf diese Collection sollte in den Firestore-Regeln vollständig verweigert werden; nur das Firebase Admin SDK benötigt Zugriff.

Jeder neu versendete Link ist 48 Stunden gültig. Eine Erneuerung überschreibt den Hash und macht den vorherigen Link sofort ungültig.