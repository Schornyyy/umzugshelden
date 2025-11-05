"use client";
import { useEffect } from "react";

export default function StickySections() {
  useEffect(() => {
    const navSelector = "nav, header[role='navigation'], header";

    function getNavHeight() {
      const nav = document.querySelector<HTMLElement>(navSelector);
      return nav ? Math.round(nav.getBoundingClientRect().height) : 0;
    }

    // Collect system points and their cards
    const points = Array.from(
      document.querySelectorAll<HTMLElement>(".system-point")
    );
    type Item = {
      point: HTMLElement;
      card: HTMLElement;
      placeholder?: HTMLElement | null;
      pinned: boolean;
      index: number;
      original: {
        position: string;
        top: string;
        left: string;
        width: string;
        zIndex: string;
      };
    };

    const items: Item[] = [];

    points.forEach((pt, idx) => {
      const card =
        (pt.querySelector<HTMLElement>(".sticky-card") as HTMLElement) ||
        (pt.firstElementChild as HTMLElement);
      if (!card) return;
      const style = card.style;
      items.push({
        point: pt,
        card,
        pinned: false,
        index: idx,
        placeholder: null,
        original: {
          position: style.position || "",
          top: style.top || "",
          left: style.left || "",
          width: style.width || "",
          zIndex: style.zIndex || "",
        },
      });
    });

    if (items.length === 0) return;

    let rafId = 0;

    function update() {
      const navH = getNavHeight();

      items.forEach((it) => {
        const ptRect = it.point.getBoundingClientRect();
        const cardRect = it.card.getBoundingClientRect();

        // compute card offset: try CSS var --card-offset, fallback to index*48
        const cs = getComputedStyle(it.point);
        const varOffset = cs.getPropertyValue("--card-offset");
        let offset = it.index * 48;
        if (varOffset) {
          const parsed = parseInt(varOffset.trim().replace("px", ""));
          if (!Number.isNaN(parsed)) offset = parsed;
        }

        const targetTop = navH + offset;

        // Pin condition: top has passed targetTop AND there's still room before the bottom of the point
        if (
          ptRect.top <= targetTop &&
          ptRect.bottom - cardRect.height >= targetTop
        ) {
          if (!it.pinned) {
            // create placeholder to avoid layout jump
            const placeholder = document.createElement("div");
            placeholder.className = "fixed-placeholder";
            placeholder.style.height = `${cardRect.height}px`;
            placeholder.style.width = `${cardRect.width}px`;
            // insert placeholder where the card was
            it.point.insertBefore(placeholder, it.card);
            it.placeholder = placeholder;

            // apply fixed positioning
            it.card.style.position = "fixed";
            it.card.style.top = `${targetTop}px`;
            it.card.style.left = `${cardRect.left}px`;
            it.card.style.width = `${cardRect.width}px`;
            it.card.style.zIndex = String(1000 + it.index);
            it.card.classList.add("fixed-card");
            it.pinned = true;
          } else {
            // update position while pinned (resize/scroll)
            it.card.style.top = `${targetTop}px`;
            it.card.style.left = `${cardRect.left}px`;
          }
        } else if (it.pinned) {
          // unpin and restore
          if (it.placeholder && it.placeholder.parentNode)
            it.placeholder.parentNode.removeChild(it.placeholder);
          it.placeholder = null;
          it.card.style.position = it.original.position || "";
          it.card.style.top = it.original.top || "";
          it.card.style.left = it.original.left || "";
          it.card.style.width = it.original.width || "";
          it.card.style.zIndex = it.original.zIndex || "";
          it.card.classList.remove("fixed-card");
          it.pinned = false;
        }
      });
    }

    function loop() {
      rafId = requestAnimationFrame(loop);
      update();
    }

    loop();

    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("orientationchange", update);

    // ensure an initial run after fonts/load settle
    window.addEventListener("load", () => setTimeout(update, 50));

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("load", () => setTimeout(update, 50));
      // cleanup any placeholders and restore originals
      items.forEach((it) => {
        if (it.placeholder && it.placeholder.parentNode)
          it.placeholder.parentNode.removeChild(it.placeholder);
        it.card.style.position = it.original.position || "";
        it.card.style.top = it.original.top || "";
        it.card.style.left = it.original.left || "";
        it.card.style.width = it.original.width || "";
        it.card.style.zIndex = it.original.zIndex || "";
        it.card.classList.remove("fixed-card");
      });
    };
  }, []);

  return null;
}
