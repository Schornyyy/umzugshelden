"use client";

import { Button } from "@/components/ui/button";
import SignaturePad from "signature_pad";
import { useEffect, useRef } from "react";

type SignaturePadFieldProps = {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export default function SignaturePadField({
  label,
  value,
  disabled = false,
  onChange,
}: SignaturePadFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const onChangeRef = useRef(onChange);
  const lastValueRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signaturePad = new SignaturePad(canvas, {
      backgroundColor: "rgb(255, 255, 255)",
      penColor: "rgb(15, 23, 42)",
      minWidth: 0.8,
      maxWidth: 2.2,
    });
    signaturePadRef.current = signaturePad;

    const resize = async () => {
      const renderedValue = signaturePad.isEmpty()
        ? lastValueRef.current
        : signaturePad.toDataURL("image/png");
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const nextWidth = canvas.offsetWidth * ratio;
      const nextHeight = canvas.offsetHeight * ratio;
      if (canvas.width === nextWidth && canvas.height === nextHeight) return;

      canvas.width = nextWidth;
      canvas.height = nextHeight;
      canvas.getContext("2d")?.scale(ratio, ratio);
      signaturePad.clear();
      if (renderedValue) await signaturePad.fromDataURL(renderedValue);
    };
    const handleEnd = () => {
      const nextValue = signaturePad.toDataURL("image/png");
      lastValueRef.current = nextValue;
      onChangeRef.current(nextValue);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    void resize();
    signaturePad.addEventListener("endStroke", handleEnd);

    return () => {
      resizeObserver.disconnect();
      signaturePad.removeEventListener("endStroke", handleEnd);
      signaturePad.off();
      signaturePadRef.current = null;
    };
  }, []);

  useEffect(() => {
    const signaturePad = signaturePadRef.current;
    if (!signaturePad || value === lastValueRef.current) return;

    lastValueRef.current = value;
    signaturePad.clear();
    if (value) void signaturePad.fromDataURL(value);
  }, [value]);

  useEffect(() => {
    const signaturePad = signaturePadRef.current;
    if (!signaturePad) return;
    if (disabled) signaturePad.off();
    else signaturePad.on();
  }, [disabled]);

  function clearSignature() {
    if (disabled) return;
    signaturePadRef.current?.clear();
    lastValueRef.current = "";
    onChange("");
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearSignature}
          disabled={disabled || !value}
        >
          Löschen
        </Button>
      </div>
      <div className="overflow-hidden rounded-md border border-slate-300 bg-white">
        <canvas
          ref={canvasRef}
          className={`block h-40 w-full touch-none ${
            disabled ? "cursor-not-allowed opacity-70" : "cursor-crosshair"
          }`}
          aria-label={label}
        />
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        Mit Maus, Stift oder Finger unterschreiben.
      </p>
    </section>
  );
}
