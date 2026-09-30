"use client";

import CityServiceBlocksRenderer from "@/components/city/CityServiceBlocksRenderer";
import { getCityServiceSeoContent } from "@/lib/cityServiceSeo";
import { getNearbyCities } from "@/statics/Lists";
import type {
  CityServiceBlock,
  CityServiceKey,
} from "@/types/city/CityServicePage";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type BuilderViewport = "desktop" | "tablet" | "mobile";

type Props = {
  blocks: CityServiceBlock[];
  cityName: string;
  citySlug: string;
  serviceKey: CityServiceKey;
  serviceName: string;
  primaryKeyword: string;
  selectedBlockId: string | null;
  viewport: BuilderViewport;
  onSelectBlock: (id: string) => void;
};

const FRAME_DOCUMENT = "<!doctype html><html><head></head><body></body></html>";

const viewportWidths: Record<BuilderViewport, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 390,
};

function joinGerman(values: readonly string[]) {
  if (values.length === 0) return "weitere Orte im Einsatzgebiet";
  if (values.length === 1) return values[0];
  return `${values.slice(0, -1).join(", ")} und ${values.at(-1)}`;
}

export default function CityServiceLivePreview({
  blocks,
  cityName,
  citySlug,
  serviceKey,
  serviceName,
  primaryKeyword,
  selectedBlockId,
  viewport,
  onSelectBlock,
}: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [frameBody, setFrameBody] = useState<HTMLElement | null>(null);
  const nearbyCities = getNearbyCities(cityName);
  const localAreaBlock = blocks.find(
    (block) => block.type === "localArea" && block.enabled,
  );
  const nearbyLimit =
    localAreaBlock?.type === "localArea" ? localAreaBlock.nearbyLimit : 3;
  const localSeo = getCityServiceSeoContent({
    cityName,
    serviceKey,
    serviceName,
    primaryKeyword,
    nearbyCities,
    nearbyLimit,
  });
  const context = {
    city: cityName,
    service: serviceName,
    primaryKeyword,
    region: localSeo.regionName,
    localIntro: localSeo.introText,
    nearbyCities: joinGerman(
      nearbyCities.map((nearby) => nearby.name).slice(0, nearbyLimit),
    ),
  };

  useEffect(() => {
    if (!frameBody || !selectedBlockId) return;
    frameBody
      .querySelector(`[data-city-block-id="${CSS.escape(selectedBlockId)}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [frameBody, selectedBlockId]);

  function prepareFrame() {
    const frameDocument = frameRef.current?.contentDocument;
    if (!frameDocument) return;

    frameDocument.head.replaceChildren();
    const base = frameDocument.createElement("base");
    base.href = `${window.location.origin}/`;
    frameDocument.head.append(base);
    document.head
      .querySelectorAll('link[rel="stylesheet"], style')
      .forEach((node) => frameDocument.head.append(node.cloneNode(true)));

    frameDocument.documentElement.lang = "de";
    frameDocument.body.className = "bg-white text-slate-950";
    frameDocument.body.style.margin = "0";
    setFrameBody(frameDocument.body);
  }

  return (
    <div className='flex min-h-[760px] justify-center overflow-auto bg-slate-200 p-5'>
      <iframe
        ref={frameRef}
        title={`${viewport}-Vorschau`}
        srcDoc={FRAME_DOCUMENT}
        onLoad={prepareFrame}
        style={{ width: viewportWidths[viewport], height: 820 }}
        className='shrink-0 border-0 bg-white shadow-xl'
      />
      {frameBody &&
        createPortal(
          <div
            className='min-h-screen bg-white'
            onSubmit={(event) => event.preventDefault()}
            onClickCapture={(event) => {
              const target = event.target as HTMLElement;
              const block = target.closest<HTMLElement>("[data-city-block-id]");
              if (block?.dataset.cityBlockId) {
                onSelectBlock(block.dataset.cityBlockId);
              }
              if (target.closest("[data-builder-interactive]")) return;
              event.preventDefault();
              event.stopPropagation();
            }}>
            <CityServiceBlocksRenderer
              blocks={blocks}
              cityName={cityName}
              citySlug={citySlug}
              serviceKey={serviceKey}
              context={context}
              localSeo={localSeo}
              editorMode
              selectedBlockId={selectedBlockId}
            />
          </div>,
          frameBody,
        )}
    </div>
  );
}