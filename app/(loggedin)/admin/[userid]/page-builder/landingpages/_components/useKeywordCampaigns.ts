"use client";

import {
  createSeoLandingCampaign,
  deleteSeoLandingCampaign,
  listSeoLandingCampaigns,
  resumeSeoLandingCampaign,
  setSeoLandingCampaignPublished,
} from "@/actions/seoLandingPageActions";
import { getAdminIdToken } from "@/lib/adminIdToken";
import { isSeoLandingCampaignActive } from "@/lib/seoLandingPages";
import type { CityServiceKey } from "@/types/city/CityServicePage";
import type { SeoLandingCampaign } from "@/types/landingpage/SeoLandingPage";
import { useCallback, useEffect, useRef, useState } from "react";

const MAX_CONSECUTIVE_ERRORS = 5;

const getToken = getAdminIdToken;

type StepResponse = {
  success: boolean;
  pending: boolean;
  stage: SeoLandingCampaign["stage"];
  message: string;
  completedCities?: number;
  error?: string;
};

export function useKeywordCampaigns(ownerId: string | undefined) {
  const [campaigns, setCampaigns] = useState<SeoLandingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [runningId, setRunningId] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const stopRef = useRef(false);

  const load = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    const result = await listSeoLandingCampaigns({ token: await getToken(), ownerId });
    if (result.success) {
      setCampaigns(result.data);
      setError("");
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [ownerId]);

  useEffect(() => {
    void load().catch((caught) => setError(caught instanceof Error ? caught.message : String(caught)));
    return () => {
      stopRef.current = true;
    };
  }, [load]);

  const patch = (id: string, update: Partial<SeoLandingCampaign>) =>
    setCampaigns((current) =>
      current.map((campaign) => (campaign.id === id ? { ...campaign, ...update } : campaign)),
    );

  /** Arbeitet die Kampagne Schritt für Schritt ab, solange das Fenster offen ist. */
  const run = useCallback(
    async (campaignId: string) => {
      if (!ownerId) return;
      stopRef.current = false;
      setRunningId(campaignId);
      setError("");
      let consecutiveErrors = 0;
      try {
        while (!stopRef.current) {
          const response = await fetch("/api/admin/generate-landingpages", {
            method: "POST",
            headers: {
              authorization: `Bearer ${await getToken()}`,
              "content-type": "application/json",
            },
            body: JSON.stringify({ ownerId, campaignId }),
          });
          const data = (await response.json().catch(() => null)) as StepResponse | null;
          if (!data?.success) {
            consecutiveErrors += 1;
            const message = data?.error || "Arbeitsschritt fehlgeschlagen.";
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS || data?.stage === "failed") {
              throw new Error(message);
            }
            setProgress(`Fehler, neuer Versuch ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}: ${message}`);
            await new Promise((resolve) => window.setTimeout(resolve, 2_000));
            continue;
          }
          consecutiveErrors = 0;
          setProgress(data.message);
          patch(campaignId, {
            stage: data.stage,
            ...(typeof data.completedCities === "number"
              ? { completedCities: data.completedCities }
              : {}),
          });
          if (!data.pending) break;
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Generierung fehlgeschlagen.");
      } finally {
        setRunningId(null);
        setProgress("");
        await load().catch(() => undefined);
      }
    },
    [load, ownerId],
  );

  const stop = () => {
    stopRef.current = true;
  };

  const create = async (keyword: string, serviceKey: CityServiceKey) => {
    if (!ownerId) return;
    const result = await createSeoLandingCampaign({ token: await getToken(), ownerId, keyword, serviceKey });
    if (!result.success) {
      setError(result.error);
      return;
    }
    setCampaigns((current) => [result.data, ...current]);
    void run(result.data.id);
  };

  const withAction = async (action: () => Promise<{ success: boolean; error?: string }>) => {
    const result = await action();
    if (!result.success) setError(result.error ?? "Aktion fehlgeschlagen.");
    await load();
  };

  const setPublished = async (campaignId: string, published: boolean) =>
    ownerId &&
    withAction(async () =>
      setSeoLandingCampaignPublished({ token: await getToken(), ownerId, campaignId, published }),
    );

  const remove = async (campaignId: string) =>
    ownerId &&
    withAction(async () => deleteSeoLandingCampaign({ token: await getToken(), ownerId, campaignId }));

  const resume = async (campaign: SeoLandingCampaign) => {
    if (!ownerId) return;
    if (!isSeoLandingCampaignActive(campaign.stage)) {
      const result = await resumeSeoLandingCampaign({
        token: await getToken(),
        ownerId,
        campaignId: campaign.id,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
    }
    void run(campaign.id);
  };

  return {
    campaigns,
    loading,
    error,
    runningId,
    progress,
    create,
    resume,
    stop,
    setPublished,
    remove,
  };
}
