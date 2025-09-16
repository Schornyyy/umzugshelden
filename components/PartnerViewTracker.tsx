"use client";

import { useEffect, useRef, useState } from "react";

export function PartnerViewTracker({ partnerId }: { partnerId: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!ref.current || sent) return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !sent) {
          // Fire and forget; ignore errors
          fetch(`/api/partner-view/${partnerId}`, { method: "GET", cache: "no-store" }).catch(() => {});
          setSent(true);
          obs.disconnect();
        }
      },
      { rootMargin: "0px", threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [partnerId, sent]);

  return <div ref={ref} style={{ width: 1, height: 1, overflow: "hidden" }} aria-hidden />;
}
