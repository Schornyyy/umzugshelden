# Stripe Integration Setup (OHNE Webhooks erforderlich!)

## ✅ Das System funktioniert OHNE Webhook-Konfiguration!

Diese Stripe-Integration nutzt eine **direkte API-Abfrage** nach der Zahlung, wodurch **keine Webhooks erforderlich sind**. Das macht die Einrichtung viel einfacher!

## 1. Stripe Account erstellen

1. Gehe zu https://stripe.com und erstelle einen Account
2. Bestätige deine E-Mail und vervollständige die Account-Einrichtung

## 2. API-Schlüssel abrufen

1. Gehe zum Stripe Dashboard: https://dashboard.stripe.com
2. Klicke auf "Developers" → "API keys"
3. Kopiere den "Publishable key" (beginnt mit `pk_test_`)
4. Kopiere den "Secret key" (beginnt mit `sk_test_`)

## 3. Umgebungsvariablen konfigurieren

Aktualisiere deine `.env.local` Datei:

```bash
# Stripe Configuration (nur diese beiden sind erforderlich!)
STRIPE_PUBLISHABLE_KEY=pk_test_dein_publishable_key_hier
STRIPE_SECRET_KEY=sk_test_dein_secret_key_hier

# Next.js Configuration
NEXT_PUBLIC_URL=http://localhost:3000  # Für Entwicklung
# NEXT_PUBLIC_URL=https://yourdomain.com  # Für Produktion
```

## 4. Testen

1. Starte den Development Server: `npm run dev`
2. Gehe zu den Aufträgen einer Firma
3. Klicke auf "Auftrag erwerben"
4. Du wirst zu Stripe Checkout weitergeleitet
5. Verwende Stripe Testkarten:
   - **Erfolgreiche Zahlung**: `4242 4242 4242 4242`
   - **Fehlgeschlagene Zahlung**: `4000 0000 0000 0002`
   - **Authentifizierung erforderlich**: `4000 0025 0000 3155`
6. Nach der Zahlung wirst du automatisch weitergeleitet
7. Der Auftrag erscheint sofort in "Erworbene Aufträge"

## 5. Wie es ohne Webhooks funktioniert

**Ablauf:**

1. User klickt "Auftrag erwerben" → Stripe Checkout
2. Nach Zahlung → Redirect zu `/api/stripe/success`
3. API prüft Payment-Status direkt bei Stripe
4. Firebase wird entsprechend aktualisiert
5. User wird zur Hauptseite mit Erfolgsmeldung weitergeleitet

**Vorteile:**

- ✅ Keine Webhook-Konfiguration nötig
- ✅ Einfacher Setup
- ✅ Funktioniert sofort nach Zahlung
- ✅ Klare Fehlermeldungen

## 6. Optionale Webhook-Einrichtung (für Profis)

Falls Sie zusätzlich Webhooks einrichten möchten (für bessere Zuverlässigkeit):

1. Gehe zu "Developers" → "Webhooks"
2. Klicke auf "Add endpoint"
3. URL: `https://yourdomain.com/api/stripe/webhook`
4. Events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Füge `STRIPE_WEBHOOK_SECRET=whsec_...` zu `.env.local` hinzu

**Aber:** Das System funktioniert bereits perfekt ohne Webhooks!

## 7. Produktionsumgebung

1. Aktiviere deinen Stripe Account vollständig
2. Ersetze Test-Keys durch Live-Keys (beginnen mit `pk_live_` und `sk_live_`)
3. Setze `NEXT_PUBLIC_URL` auf deine Produktions-URL

## 8. Troubleshooting

- **"Session nicht gefunden"**: Prüfe ob STRIPE_SECRET_KEY korrekt ist
- **Weiterleitung funktioniert nicht**: Prüfe NEXT_PUBLIC_URL
- **Aufträge werden nicht angezeigt**: Payment war eventuell nicht erfolgreich - prüfe Stripe Dashboard

## 9. Zahlungsflow-Status

Das System zeigt verschiedene Meldungen:

- ✅ **Grün**: "Auftrag erfolgreich erworben!" (payment_status = 'paid')
- ❌ **Rot**: "Die Zahlung ist fehlgeschlagen" (payment_status = 'unpaid')
- ⏳ **Rot**: "Die Zahlung wird noch verarbeitet" (payment_status = 'processing')
- 🚫 **Rot**: "Die Zahlung wurde abgebrochen" (User hat Cancel geklickt)

Kein Webhook-Setup erforderlich! 🎉
