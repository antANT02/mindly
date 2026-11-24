"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { MindlyWordmark } from "@/components/brand/mindly-wordmark";

export type ConsolePresence = "ONLINE" | "STUDYING" | "BUSY" | "OFFLINE";

export interface ConsoleUserProfile {
  id: string;
  name: string;
  username: string | null;
  email: string;
  avatarUrl: string | null;
  image: string | null;
  bio: string | null;
  statusText: string | null;
  presence: ConsolePresence;
  xp: number;
  streakDays: number;
  metaDiariaMinutos: number;
}

interface ConsoleHudShellProps {
  children: React.ReactNode;
  user: ConsoleUserProfile | null;
  ambientColor?: string;
  pendingRequestsCount?: number;
  onlineFriendsCount?: number;
  socialOverlayOpen?: boolean;
  onToggleSocialOverlay?: () => void;
  onQuickCreateTask?: () => void;
  onQuickCreateGroup?: () => void;
  globalSearchQuery?: string;
  onGlobalSearchChange?: (value: string) => void;
}

const PRESENCE_META: Record<
  ConsolePresence,
  { label: string; dotClass: string }
> = {
  ONLINE: {
    label: "Online",
    dotClass: "bg-[#A4D007]",
  },
  STUDYING: {
    label: "Estudando",
    dotClass: "bg-[#CBB6FF]",
  },
  BUSY: {
    label: "Ocupado",
    dotClass: "bg-[#E5A93C]",
  },
  OFFLINE: {
    label: "Offline",
    dotClass: "bg-[#9D8EC4]",
  },
};

export function ConsoleHudShell({
  children,
  user,
  pendingRequestsCount = 0,
  onlineFriendsCount = 0,
  socialOverlayOpen = false,
  onToggleSocialOverlay,
  onQuickCreateTask,
  onQuickCreateGroup,
  globalSearchQuery = "",
  onGlobalSearchChange,
}: ConsoleHudShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [clockText, setClockText] = useState<string>("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClockText(
        now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (e.key === "Tab" && onToggleSocialOverlay) {
        e.preventDefault();
        onToggleSocialOverlay();
        return;
      }

      if (isTyping) return;

      if (e.key.toLowerCase() === "n" && onQuickCreateTask) {
        e.preventDefault();
        onQuickCreateTask();
      } else if (e.key.toLowerCase() === "g" && onQuickCreateGroup) {
        e.preventDefault();
        onQuickCreateGroup();
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const focusables = Array.from(
          document.querySelectorAll<HTMLElement>(
            "[data-console-focusable='true']"
          )
        );
        if (focusables.length > 0) {
          const currentIdx = focusables.findIndex(
            (el) => el === document.activeElement
          );
          const delta = e.key === "ArrowRight" ? 1 : -1;
          const nextIdx =
            currentIdx === -1
              ? 0
              : (currentIdx + delta + focusables.length) % focusables.length;
          focusables[nextIdx]?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onQuickCreateGroup, onQuickCreateTask, onToggleSocialOverlay]);

  const effectiveAvatar = user?.avatarUrl || user?.image || null;
  const presenceInfo =
    PRESENCE_META[user?.presence ?? "ONLINE"] ?? PRESENCE_META.ONLINE;

  const navItems = [
    { href: "/", label: "Biblioteca" },
    { href: "/workspace", label: "Workspace" },
    { href: "/perfil", label: "Perfil" },
  ];

  return (
    <div className="min-h-screen bg-[#070512] text-[#F4F1FA]">
      {/* Top Bar Sólida de 1px (Sem Glassmorphism / Sem Glow) */}
      <header className="sticky top-0 z-30 border-b border-[#CBB6FF]/15 bg-[#070512]">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          {/* Esquerda: Wordmark + Navegação */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              data-console-focusable="true"
              className="rounded-[2px] outline-none focus-visible:ring-1 focus-visible:ring-[#CBB6FF]"
            >
              <MindlyWordmark size="md" />
            </Link>

            <nav className="hidden items-center gap-6 md:flex">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-console-focusable="true"
                    className={`relative py-1 text-xs font-medium tracking-wide outline-none transition-colors duration-150 focus-visible:ring-1 focus-visible:ring-[#CBB6FF] ${
                      isActive
                        ? "text-[#F4F1FA]"
                        : "text-[#9D8EC4] hover:text-[#CBB6FF]"
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute inset-x-0 -bottom-[11px] h-[2px] bg-[#7E49C7]" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Centro: Busca Técnica */}
          <div className="order-3 w-full max-w-xs sm:order-2">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#9D8EC4]" />
              <input
                ref={searchInputRef}
                type="text"
                value={globalSearchQuery}
                onChange={(e) => onGlobalSearchChange?.(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !onGlobalSearchChange &&
                    globalSearchQuery.trim()
                  ) {
                    router.push(
                      `/?q=${encodeURIComponent(globalSearchQuery.trim())}`
                    );
                  }
                }}
                placeholder="Filtrar biblioteca..."
                className="w-full rounded-[2px] border border-[#CBB6FF]/15 bg-[#1B0B3A]/70 py-1.5 pl-8 pr-14 text-xs text-[#F4F1FA] placeholder-[#9D8EC4]/70 outline-none transition-colors duration-150 focus:border-[#7E49C7] focus:bg-[#1B0B3A]"
              />
              <kbd className="pointer-events-none absolute right-2 rounded-[2px] border border-[#CBB6FF]/15 bg-[#070512] px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-[#9D8EC4]">
                Ctrl K
              </kbd>
            </div>
          </div>

          {/* Direita: Telemetria + Social + Identidade */}
          <div className="order-2 flex items-center rounded-[2px] border border-[#CBB6FF]/15 bg-[#1B0B3A] px-2.5 py-1 sm:order-3">
            {user && (
              <>
                <div className="hidden items-center gap-3.5 px-2 font-mono text-xs tabular-nums lg:flex">
                  <span className="text-[#9D8EC4]">
                    Ofensiva{" "}
                    <strong className="font-semibold text-[#CBB6FF]">
                      {user.streakDays}d
                    </strong>
                  </span>
                  <span className="text-[#9D8EC4]">
                    <strong className="font-semibold text-[#F4F1FA]">
                      {user.xp}
                    </strong>{" "}
                    XP
                  </span>
                </div>
                <span className="hidden h-4 w-px bg-[#CBB6FF]/15 lg:block" />
              </>
            )}

            <div className="hidden px-2.5 font-mono text-xs tabular-nums text-[#9D8EC4] sm:block">
              {clockText || "--:--"}
            </div>

            {onToggleSocialOverlay && (
              <>
                <span className="hidden h-4 w-px bg-[#CBB6FF]/15 sm:block" />
                <button
                  type="button"
                  onClick={onToggleSocialOverlay}
                  data-console-focusable="true"
                  className={`flex items-center gap-1.5 rounded-[2px] px-2.5 py-1 text-xs font-medium outline-none transition-colors duration-150 focus-visible:ring-1 focus-visible:ring-[#CBB6FF] ${
                    socialOverlayOpen
                      ? "bg-[#3B1C6E] text-[#F4F1FA]"
                      : "text-[#9D8EC4] hover:bg-[#3B1C6E]/60 hover:text-[#F4F1FA]"
                  }`}
                >
                  <span>Amigos</span>
                  <span className="font-mono text-[11px] tabular-nums text-[#CBB6FF]">
                    {onlineFriendsCount}
                  </span>
                  {pendingRequestsCount > 0 && (
                    <span className="rounded-[2px] bg-[#7E49C7] px-1.5 font-mono text-[10px] font-bold tabular-nums text-[#F4F1FA]">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>
              </>
            )}

            <span className="mx-1.5 h-4 w-px bg-[#CBB6FF]/15" />

            {user ? (
              <Link
                href="/perfil"
                data-console-focusable="true"
                className="flex items-center gap-2 rounded-[2px] py-0.5 pl-1 pr-1.5 outline-none transition-colors duration-150 hover:bg-[#3B1C6E] focus-visible:ring-1 focus-visible:ring-[#CBB6FF]"
              >
                <div className="relative h-6 w-6 shrink-0">
                  {effectiveAvatar ? (
                    <img
                      src={effectiveAvatar}
                      alt={user.name}
                      className="h-6 w-6 rounded-[2px] border border-[#CBB6FF]/25 object-cover"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-[2px] border border-[#CBB6FF]/25 bg-[#3B1C6E] font-mono text-[11px] font-bold text-[#CBB6FF]">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-1 ring-[#1B0B3A] ${presenceInfo.dotClass}`}
                  />
                </div>

                <div className="hidden text-left sm:block">
                  <div className="max-w-[110px] truncate text-xs font-medium leading-tight text-[#F4F1FA]">
                    {user.name}
                  </div>
                  <div className="max-w-[110px] truncate font-mono text-[10px] leading-tight text-[#9D8EC4]">
                    {user.username ? `@${user.username}` : presenceInfo.label}
                  </div>
                </div>
              </Link>
            ) : (
              <Link
                href="/login"
                data-console-focusable="true"
                className="rounded-[2px] bg-[#7E49C7] px-3 py-1 text-xs font-semibold text-[#F4F1FA] transition-colors duration-150 hover:bg-[#9361D9]"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="mx-auto max-w-[1440px] px-4 pb-14 pt-6 sm:px-6">
        {children}
      </main>

      {/* Barra de Atalhos Sólida */}
      <footer className="fixed inset-x-0 bottom-0 z-30 h-8 border-t border-[#CBB6FF]/15 bg-[#070512]">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-4 font-mono text-[11px] tabular-nums text-[#9D8EC4] sm:px-6">
          <div className="flex items-center gap-4 overflow-x-auto">
            <span className="inline-flex shrink-0 items-center gap-1.5">
              <kbd className="rounded-[2px] border border-[#CBB6FF]/20 bg-[#1B0B3A] px-1 text-[10px] text-[#CBB6FF]">
                ←/→
              </kbd>
              Navegar
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5">
              <kbd className="rounded-[2px] border border-[#CBB6FF]/20 bg-[#1B0B3A] px-1 text-[10px] text-[#CBB6FF]">
                ENTER
              </kbd>
              Abrir
            </span>
            {onQuickCreateTask && (
              <span className="inline-flex shrink-0 items-center gap-1.5">
                <kbd className="rounded-[2px] border border-[#CBB6FF]/20 bg-[#1B0B3A] px-1 text-[10px] text-[#CBB6FF]">
                  N
                </kbd>
                Nova Tarefa
              </span>
            )}
            {onQuickCreateGroup && (
              <span className="inline-flex shrink-0 items-center gap-1.5">
                <kbd className="rounded-[2px] border border-[#CBB6FF]/20 bg-[#1B0B3A] px-1 text-[10px] text-[#CBB6FF]">
                  G
                </kbd>
                Novo Grupo
              </span>
            )}
            {onToggleSocialOverlay && (
              <span className="inline-flex shrink-0 items-center gap-1.5">
                <kbd className="rounded-[2px] border border-[#CBB6FF]/20 bg-[#1B0B3A] px-1 text-[10px] text-[#CBB6FF]">
                  TAB
                </kbd>
                Social
              </span>
            )}
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-1.5 w-1.5 bg-[#7E49C7]" />
            <span>
              {pendingRequestsCount > 0
                ? `${pendingRequestsCount} solicitação(ões)`
                : "Sistema ativo"}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}