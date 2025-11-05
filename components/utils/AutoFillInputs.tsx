"use client";
import { useEffect } from "react";

type Props = {
  targetId?: string;
  values?: string[];
  typingSpeed?: number; // ms per char
  pauseBetween?: number; // ms pause after each field
  loop?: boolean;
  showElementId?: string; // element to show after full run
  showDuration?: number; // ms to show the element
};

export default function AutoFillInputs({
  targetId = "autofill-form",
  values = [
    "Max Mustermann",
    "0123 456789",
    "max@example.com",
    "Gartenpflege",
    "Bitte Rückruf am Nachmittag",
  ],
  typingSpeed = 60,
  pauseBetween = 700,
  loop = true,
  showElementId,
  showDuration = 5000,
}: Props) {
  useEffect(() => {
    const container = document.getElementById(targetId);
    if (!container) return;

    const inputs = Array.from(
      container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input, textarea"
      )
    );
    if (!inputs.length) return;

    let stopped = false;
    let current = 0;
    let timer: number | null = null;
    let showTimer: number | null = null;

    function dispatchInput(el: Element) {
      const ev = new Event("input", { bubbles: true });
      el.dispatchEvent(ev);
    }

    function typeInto(
      el: HTMLInputElement | HTMLTextAreaElement,
      text: string,
      pos = 0
    ) {
      if (stopped) return;
      if (pos <= text.length) {
        // avoid calling focus continuously — do not steal user scroll/focus
        el.value = text.slice(0, pos);
        dispatchInput(el);
        timer = window.setTimeout(
          () => typeInto(el, text, pos + 1),
          typingSpeed
        );
      } else {
        // finished this field
        timer = window.setTimeout(() => {
          current += 1;
          if (current >= inputs.length) {
            // full run finished
            const doneElId = showElementId ?? `${targetId}-done`;
            const doneEl = document.getElementById(doneElId);
            if (loop) {
              if (doneEl) {
                // show the element for showDuration, then clear and restart
                doneEl.style.display = "block";
                showTimer = window.setTimeout(() => {
                  doneEl.style.display = "none";
                  // clear inputs and restart
                  inputs.forEach((i) => {
                    i.value = "";
                    dispatchInput(i);
                  });
                  current = 0;
                  timer = window.setTimeout(run, pauseBetween);
                }, showDuration);
              } else {
                // no element to show, behave as before
                inputs.forEach((i) => {
                  i.value = "";
                  dispatchInput(i);
                });
                current = 0;
                timer = window.setTimeout(run, pauseBetween);
              }
            }
          } else {
            run();
          }
        }, pauseBetween);
      }
    }

    function run() {
      if (stopped) return;
      const el = inputs[current] as HTMLInputElement | HTMLTextAreaElement;
      const text = values[current] ?? "";
      typeInto(el, text, 0);
    }

    // start
    timer = window.setTimeout(run, 300);

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      if (showTimer) clearTimeout(showTimer);
    };
  }, [
    targetId,
    values,
    typingSpeed,
    pauseBetween,
    loop,
    showElementId,
    showDuration,
  ]);

  return null;
}
