// Sends a lead notification test email using a real contract from Firestore
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, query, where, orderBy, limit, getDocs } = require('firebase/firestore');

// Load .env.local for SMTP and base URLs
(() => {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach((line) => {
        if (!line || line.trim().startsWith('#')) return;
        const idx = line.indexOf('=');
        if (idx === -1) return;
        const key = line.slice(0, idx).trim();
        let val = line.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      });
    }
  } catch (_) {}
})();

// Firebase config copied from config/firebase.ts (public web config)
const firebaseConfig = {
  apiKey: "AIzaSyA442lHya1rJ4xvG_EpFWZAXATMRalqY4Q",
  authDomain: "gym-crm-6216d.firebaseapp.com",
  databaseURL: "https://gym-crm-6216d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gym-crm-6216d",
  storageBucket: "gym-crm-6216d.appspot.com",
  messagingSenderId: "248617571191",
  appId: "1:248617571191:web:42eaad09c1da08ab2d0772"
};

// Helpers for labels
function mapContractSize(size) {
  switch (size) {
    case 'new': return 'Neuanlage';
    case 'small changes': return 'Kleine Änderungen';
    case 'request': return 'Beratung/Anfrage';
    default: return String(size || '');
  }
}
function mapProjectBegin(p) {
  switch (p) {
    case 'fast': return 'Schnellstmöglich';
    case '2weeks': return 'In ca. 2 Wochen';
    case '1month': return 'In ca. 1 Monat';
    case 'fewmonths': return 'In den nächsten Monaten';
    case 'request': return 'Nach Absprache';
    default: return String(p || '');
  }
}
function yesNo(v) { return v ? 'Ja' : 'Nein'; }

(async () => {
  try {
    const to = process.argv[2] || 'support@landschaftshelden.io';
    const argContractId = process.argv[3] || null;

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = Number(process.env.SMTP_PORT) === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const missing = [];
    if (!host) missing.push('SMTP_HOST');
    if (!user) missing.push('SMTP_USER');
    if (!pass) missing.push('SMTP_PASS');
    if (missing.length) {
      console.error('Missing env vars:', missing.join(', '));
      process.exit(2);
    }

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Resolve contract
    let contractId = argContractId;
    let contract = null;
    if (contractId) {
      const ref = doc(db, 'contracts', contractId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        contract = { id: snap.id, ...snap.data() };
      }
    }
    if (!contract) {
      // Try latest by createdAt (single-field index) and then pick first verified
      try {
        const q1 = query(collection(db, 'contracts'), orderBy('createdAt', 'desc'), limit(10));
        const qs1 = await getDocs(q1);
        const first = qs1.docs.find(d => (d.data().verified === true) || true); // prefer verified, else any
        if (first) {
          contract = { id: first.id, ...first.data() };
          contractId = first.id;
        }
      } catch (e) {
        // Fallback: get first available doc without order
        const qs2 = await getDocs(query(collection(db, 'contracts'), limit(1)));
        if (!qs2.empty) {
          const d = qs2.docs[0];
          contract = { id: d.id, ...d.data() };
          contractId = d.id;
        }
      }
    }
    if (!contract || !contractId) {
      throw new Error('Kein echter Auftrag gefunden. Bitte Contract-ID angeben.');
    }

    // Prepare tracking & landing
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')).replace(/\/$/, '');
    const companyEmail = to;
    const urlParams = `contractId=${encodeURIComponent(String(contractId))}&companyEmail=${encodeURIComponent(companyEmail)}`;
    const landingTarget = `${baseUrl}/fuer-unternehmen/auftrag/${encodeURIComponent(String(contractId))}?companyEmail=${encodeURIComponent(companyEmail)}`;
    const trackedRegistrationLink = `${baseUrl}/api/email/track/click?${urlParams}&target=${encodeURIComponent(landingTarget)}`;

    const templatePath = path.join(process.cwd(), 'emailtemplates', 'AutoProfileInviteEmail.html');
    if (!fs.existsSync(templatePath)) throw new Error('Template not found: ' + templatePath);
    let html = fs.readFileSync(templatePath, 'utf8');

    const replacements = {
      trackedRegistrationLink,
      contractTypeLabel: String(contract.type || ''),
      zip: String(contract.zip || ''),
      gardenSize: String(contract.gardenSize || ''),
      contractSizeLabel: mapContractSize(contract.contractSize),
      planningLabel: yesNo(contract.planningAvaillable),
      repeatLabel: yesNo(contract.repeatService),
      projectBeginLabel: mapProjectBegin(contract.projektBeginn),
      description: (contract.description || '').slice(0, 600),
    };
    html = html.replace(/\{\{(.*?)\}\}/g, (_, key) => (replacements[key.trim()] || `{{${key}}}`));

    if (baseUrl) {
      const pixelUrl = `${baseUrl}/api/email/track/open?${urlParams}`;
      if (html.includes('</body>')) {
        html = html.replace('</body>', `<img src="${pixelUrl}" alt="" width="1" height="1" style="display:none;" /></body>`);
      } else {
        html += `<img src="${pixelUrl}" alt="" width="1" height="1" style="display:none;" />`;
      }
    }

    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
    const info = await transporter.sendMail({
      from: `"Landschaftshelden.io" <${user}>`,
      to,
      subject: `Test: Lead-Benachrichtigung (real) – ${contract.type || ''}${contract.zip ? ' (' + contract.zip + ')' : ''}`,
      html,
    });
    console.log('Sent ok. MessageId:', info && (info.messageId || info.response || 'unknown'), 'ContractId:', contractId);
  } catch (e) {
    console.error('Send failed:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
