import React from "react";

interface MindlyWordmarkProps {
  size?: "sm" | "md" | "lg";
}

export function MindlyWordmark({ size = "md" }: MindlyWordmarkProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  }[size];

  return (
    <span
      className={`inline-flex items-baseline font-sans font-bold tracking-[-0.03em] text-[#F4F1FA] select-none ${sizeClasses}`}
    >
      <span>Mind</span>
      <span className="text-[#CBB6FF]">Ly</span>
      <span className="ml-1 inline-block h-1.5 w-1.5 bg-[#7E49C7]" />
    </span>
  );
}