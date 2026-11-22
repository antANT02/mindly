"use client";

import React from "react";

interface MindlyWordmarkProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function MindlyWordmark({
  className = "",
  size = "md",
}: MindlyWordmarkProps) {
  const sizeClass =
    size === "sm"
      ? "text-lg"
      : size === "lg"
        ? "text-2xl sm:text-3xl"
        : "text-xl";

  return (
    <span
      className={`inline-flex items-baseline font-sans font-bold tracking-tight select-none ${sizeClass} ${className}`}
    >
      <span className="text-[#F3F4F6]">Mind</span>
      <span className="text-[#66C0F4]">Ly</span>
    </span>
  );
}