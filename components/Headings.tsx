import React, { JSX } from "react";

interface HeadingsProps {
  /**
   * Die Ebene der Überschrift, von 1 (h1) bis 6 (h6).
   */
  level: 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * Der Inhalt der Überschrift.
   */
  children: React.ReactNode;
  /**
   * Zusätzliche CSS-Klassen für die Überschrift.
   */
  className?: string;
}

const Headings: React.FC<HeadingsProps> = ({
  level,
  children,
  className = "",
}) => {
  // Dynamisch das passende HTML-Tag wählen (h1 - h6)
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  // Standard-Stilklassen für jede Ebene
  const baseClass = {
    1: "font-sans text-2xl font-bold md:text-8xl",
    2: "font-sans text-xl md:text-5xl font-semibold",
    3: "font-sans text-md md:text-2xl font-medium",
    4: "font-sans text-md md:text-lg ",
    5: "font-sans text-md ",
    6: "font-sans text-base",
  };

  // Kombination aus Standardklassen und zusätzlichen Klassen
  const combinedClassName = `${baseClass[level]} ${className}`.trim();

  return <Tag className={combinedClassName}>{children}</Tag>;
};

export default Headings;
