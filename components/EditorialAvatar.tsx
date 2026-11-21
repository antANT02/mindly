"use client";

import { getInitials } from "@/lib/avatar-utils";

interface EditorialAvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: "sm" | "md" | "lg";
}

export function EditorialAvatar({
  src,
  name,
  email,
  size = "md",
}: EditorialAvatarProps) {
  const dimensions =
    size === "sm"
      ? "h-7 w-7 text-[11px]"
      : size === "lg"
      ? "h-20 w-20 text-lg"
      : "h-9 w-9 text-xs";

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Avatar do usuário"}
        className={`${dimensions} aspect-square shrink-0 rounded-md border border-line object-cover`}
      />
    );
  }

  return (
    <div
      aria-label={name || "Iniciais do usuário"}
      className={`${dimensions} aspect-square shrink-0 flex items-center justify-center rounded-md border border-line bg-olive-soft font-medium tracking-tight text-olive-deep`}
    >
      {getInitials(name, email)}
    </div>
  );
}