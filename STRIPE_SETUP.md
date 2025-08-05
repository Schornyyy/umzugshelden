# Stripe Integration Setup

## 1. Stripe Account erstellen

1. Gehe zu https://stripe.com und erstelle einen Account
2. Bestätige deine E-Mail und vervollständige die Account-Einrichtung

## 2. API-Schlüssel abrufen

1. Gehe zum Stripe Dashboard: https://dashboard.stripe.com
2. Klicke auf "Developers" → "API keys"
3. Kopiere den "Publishable key" (beginnt mit `pk_test_`)
4. Kopiere den "Secret key" (beginnt mit `sk_test_`)

## 3. Webhook einrichten

1. Gehe zu "Developers" → "Webhooks"
2. Klicke auf "Add endpoint"
3. URL: `https://yourdomain.com/api/stripe/webhook` (ersetze mit deiner Domain)
4. Wähle folgende Events aus:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Klicke auf "Add endpoint"
6. Kopiere den "Signing secret" (beginnt mit `whsec_`)

## 4. Umgebungsvariablen konfigurieren

Erstelle/aktualisiere deine `.env.local` Datei:

```bash
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_dein_publishable_key_hier
STRIPE_SECRET_KEY=sk_test_dein_secret_key_hier
STRIPE_WEBHOOK_SECRET=whsec_dein_webhook_secret_hier

# Next.js Configuration
NEXT_PUBLIC_URL=http://localhost:3000  # Für Entwicklung
# NEXT_PUBLIC_URL=https://yourdomain.com  # Für Produktion
```

## 5. Testen

1. Starte den Development Server: `npm run dev`
2. Gehe zu den Aufträgen einer Firma
3. Klicke auf "Auftrag erwerben"
4. Du wirst zu Stripe Checkout weitergeleitet
5. Verwende Stripe Testkarten:
   - **Erfolgreiche Zahlung**: `4242 4242 4242 4242`
   - **Fehlgeschlagene Zahlung**: `4000 0000 0000 0002`
   - **Authentifizierung erforderlich**: `4000 0025 0000 3155`

## 6. Produktionsumgebung

Für die Produktion:

1. Aktiviere deinen Stripe Account vollständig
2. Ersetze Test-Keys durch Live-Keys (beginnen mit `pk_live_` und `sk_live_`)
3. Aktualisiere die Webhook-URL auf deine Produktions-Domain
4. Setze `NEXT_PUBLIC_URL` auf deine Produktions-URL

## 7. Wichtige Hinweise

- **Nie Secret Keys im Frontend verwenden!**
- Webhook-Endpunkt muss öffentlich erreichbar sein
- Für lokale Entwicklung kannst du Stripe CLI verwenden: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Teste immer mit Stripe Test-Karten
- Überwache Transaktionen im Stripe Dashboard

## 8. Troubleshooting

- **Webhook funktioniert nicht**: Prüfe ob die URL erreichbar ist
- **Zahlung wird nicht erkannt**: Prüfe Webhook-Events und Logs
- **CORS-Fehler**: Stripe Checkout läuft auf Stripe-Servern, keine CORS-Probleme
- **Kein Redirect nach Zahlung**: Prüfe success_url und cancel_url
