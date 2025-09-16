"use client";
import { useEffect, useState } from "react";

type CompanyPreview = {
  id: string | null;
  companyName: string | null;
  email: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
};

type ApiResult = {
  success: boolean;
  center?: { latitude: number; longitude: number };
  centerSource?: string;
  preferStored?: boolean;
  contractId?: string;
  contractZip?: number | null;
  contractStored?: { latitude: number | null; longitude: number | null };
  radiusKm?: number;
  count?: number;
  companies?: CompanyPreview[];
  error?: string;
};

export default function NotifyTestPage() {
  const [contractId, setContractId] = useState<string>("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const res = await fetch(
        `/api/companies-in-radius?contractId=${encodeURIComponent(
          contractId
        )}&radiusKm=50`,
        { cache: "no-store" }
      );
      const data: ApiResult = await res.json();
      setResult(data);
      // WICHTIG: Console-Log im Browser wie gewünscht
      console.log("Companies within 50km:", data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Fehler beim Test";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Optional: auto-run when contractId in URL
    const params = new URLSearchParams(window.location.search);
    const cid = params.get("contractId");
    if (cid) {
      setContractId(cid);
      // do not auto-run to avoid noise; user can click
    }
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 20 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>
        Test: Unternehmen im 50km-Umkreis (ohne E-Mail)
      </h1>
      <p>
        Geben Sie eine Contract-ID ein und starten Sie den Test. Die Unternehmen
        werden im Browser-Console-Log ausgegeben, es werden keine E-Mails
        gesendet.
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input
          type='text'
          placeholder='Contract ID'
          value={contractId}
          onChange={(e) => setContractId(e.target.value)}
          style={{
            flex: 1,
            padding: 10,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
          }}
        />
        <button
          onClick={runTest}
          disabled={!contractId || loading}
          style={{
            padding: "10px 16px",
            background: "#059669",
            color: "white",
            borderRadius: 8,
          }}>
          {loading ? "Lädt…" : "Test starten"}
        </button>
      </div>
      {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}
      {result && (
        <div style={{ marginTop: 16 }}>
          <div>
            <strong>Ergebnis:</strong>{" "}
            {result.success ? `${result.count} Unternehmen gefunden` : "Fehler"}
          </div>
          <div style={{ color: "#6b7280", fontSize: 14 }}>
            <div>centerSource: {result.centerSource || "n/a"}</div>
            <div>preferStored: {String(result.preferStored)}</div>
            <div>contractId: {result.contractId || "n/a"}</div>
            <div>contractZip: {result.contractZip ?? "n/a"}</div>
            {result.contractStored && (
              <div>
                contractStored: lat {result.contractStored.latitude ?? "n/a"},
                lng {result.contractStored.longitude ?? "n/a"}
              </div>
            )}
          </div>
          {result?.center && (
            <div style={{ color: "#6b7280", fontSize: 14 }}>
              Center: {result.center.latitude}, {result.center.longitude} |
              Radius: {result.radiusKm}km
            </div>
          )}
          <ol style={{ marginTop: 12 }}>
            {result?.companies?.slice(0, 10).map((c: CompanyPreview) => (
              <li key={c.id || Math.random()}>
                {c.companyName || "Unbenannt"} – {c.city || ""} ({c.distanceKm}{" "}
                km)
              </li>
            ))}
          </ol>
          <p style={{ color: "#6b7280", fontSize: 12 }}>
            Vollständige Liste und Objekte siehe Console-Log.
          </p>
        </div>
      )}
    </div>
  );
}
