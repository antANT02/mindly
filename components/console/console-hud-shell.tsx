"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Users } from "lucide-react";
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
  { label: string; dotClass: string; ringClass: string }
> = {
  ONLINE: {
    label: "Online",
    dotClass: "bg-[#A4D007]",
    ringClass: "ring-[#A4D007]/60",
  },
  STUDYING: {
    label: "Estudando",
    dotClass: "bg-[#66C0F4]",
    ringClass: "ring-[#66C0F4]/60",
  },
  BUSY: {
    label: "Ocupado",
    dotClass: "bg-[#E5A93C]",
    ringClass: "ring-[#E5A93C]/60",
  },
  OFFLINE: {
    label: "Offline",
    dotClass: "bg-[#8F98A0]",
    ringClass: "ring-white/15",
  },
};

export function ConsoleHudShell({
  children,
  user,
  ambientColor = "#1A9FFF",
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
    <div className="relative min-h-screen overflow-x-hidden bg-[#0B0F14] text-[#F3F4F6] selection:bg-[#66C0F4]/25 selection:text-white">
      {/* Ambient Canvas Dinâmico */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{
            background: `radial-gradient(ellipse 75% 45% at 20% 0%, ${ambientColor}24 0%, transparent 65%), radial-gradient(ellipse 55% 40% at 85% 8%, #1A9FFF14 0%, transparent 60%), #0B0F14`,
          }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="h-full w-full"
        />
      </div>

      {/* Top System Bar (Frameless estilo SteamOS) */}
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#0B0F14]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          {/* Esquerda: Wordmark MindLy + Navegação Limpa */}
          <div className="flex items-center gap-7">
            <Link
              href="/"
              data-console-focusable="true"
              className="rounded outline-none focus-visible:ring-2 focus-visible:ring-[#66C0F4]"
            >
              <MindlyWordmark size="md" />
            </Link>

            <nav className="hidden items-center gap-5 md:flex">
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
                    className={`relative py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#66C0F4] ${
                      isActive
                        ? "text-[#F3F4F6]"
                        : "text-[#8F98A0] hover:text-[#F3F4F6]"
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <motion.span
                        layoutId="activeNavTab"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 34,
                        }}
                        className="absolute inset-x-0 -bottom-[11px] h-[2px] bg-[#66C0F4]"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Centro: Campo de Busca Compacto com padding seguro para Ctrl K */}
          <div className="order-3 w-full max-w-xs sm:order-2">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#8F98A0]" />
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
                placeholder="Buscar..."
                className="w-full rounded-lg border border-white/[0.08] bg-[#121820] py-1.5 pl-8 pr-14 text-xs text-[#F3F4F6] placeholder-[#8F98A0]/80 outline-none transition focus:border-[#66C0F4] focus:ring-2 focus:ring-[#66C0F4]/25"
              />
              <kbd className="pointer-events-none absolute right-2 rounded border border-white/10 bg-[#1A222D] px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-[#8F98A0]">
                Ctrl K
              </kbd>
            </div>
          </div>

          {/* Direita: Cluster Unificado de Telemetria + Social + Perfil */}
          <div className="order-2 flex items-center rounded-xl border border-white/[0.08] bg-[#121820]/90 px-2.5 py-1 sm:order-3">
            {user && (
              <>
                <div className="hidden items-center gap-3 px-2 font-mono text-xs tabular-nums lg:flex">
                  <span className="text-[#8F98A0]">
                    <strong className="font-semibold text-[#E5A93C]">
                      {user.streakDays}d
                    </strong>
                  </span>
                  <span className="text-[#8F98A0]">
                    <strong className="font-semibold text-[#66C0F4]">
                      {user.xp}
                    </strong>{" "}
                    XP
                  </span>
                </div>
                <span className="hidden h-4 w-px bg-white/10 lg:block" />
              </>
            )}

            <div className="hidden px-2.5 font-mono text-xs tabular-nums text-[#8F98A0] sm:block">
              {clockText || "--:--"}
            </div>

            {onToggleSocialOverlay && (
              <>
                <span className="hidden h-4 w-px bg-white/10 sm:block" />
                <button
                  type="button"
                  onClick={onToggleSocialOverlay}
                  data-console-focusable="true"
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-[#66C0F4] ${
                    socialOverlayOpen
                      ? "bg-[#1A222D] text-[#66C0F4]"
                      : "text-[#8F98A0] hover:bg-[#1A222D]/70 hover:text-[#F3F4F6]"
                  }`}
                >
                  <Users className="h-3.5 w-3.5 text-[#66C0F4]" />
                  <span>Amigos</span>
                  <span className="font-mono text-[11px] tabular-nums text-[#A4D007]">
                    {onlineFriendsCount}
                  </span>
                  {pendingRequestsCount > 0 && (
                    <span className="rounded bg-[#E04F33] px-1 font-mono text-[10px] font-bold tabular-nums text-white">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>
              </>
            )}

            <span className="mx-1.5 h-4 w-px bg-white/10" />

            {user ? (
              <Link
                href="/perfil"
                data-console-focusable="true"
                className="flex items-center gap-2 rounded-lg py-0.5 pl-1 pr-1.5 outline-none transition hover:bg-[#1A222D] focus-visible:ring-2 focus-visible:ring-[#66C0F4]"
              >
                <div className="relative h-7 w-7 shrink-0">
                  {effectiveAvatar ? (
                    <img
                      src={effectiveAvatar}
                      alt={user.name}
                      className={`h-7 w-7 rounded-md object-cover ring-1 ${presenceInfo.ringClass}`}
                    />
                  ) : (
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-md bg-[#1A222D] font-mono text-xs font-bold text-[#66C0F4] ring-1 ${presenceInfo.ringClass}`}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-[#121820] ${presenceInfo.dotClass}`}
                  />
                </div>

                <div className="hidden text-left sm:block">
                  <div className="max-w-[110px] truncate text-xs font-medium leading-tight text-[#F3F4F6]">
                    {user.name}
                  </div>
                  <div className="max-w-[110px] truncate font-mono text-[10px] leading-tight text-[#8F98A0]">
                    {user.username ? `@${user.username}` : presenceInfo.label}
                  </div>
                </div>
              </Link>
            ) : (
              <Link
                href="/login"
                data-console-focusable="true"
                className="rounded-lg bg-[#1A9FFF] px-3 py-1 text-xs font-semibold text-[#0B0F14] transition hover:bg-[#66C0F4]"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Área de Conteúdo */}
      <main className="relative z-10 mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Action Bar (Rodapé Ultrafino de Navegação Espacial) */}
      <footer className="fixed bottom-0 inset-x-0 z-30 h-9 border-t border-white/[0.06] bg-[#090C10]/90 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-4 font-mono text-[11px] tabular-nums text-[#8F98A0] sm:px-6">
          <div className="flex items-center gap-4 overflow-x-auto">
            <span className="inline-flex shrink-0 items-center gap-1.5">
              <kbd className="rounded border border-white/10 bg-[#121820] px-1.5 py-0.2 text-[10px] text-[#F3F4F6]">
                ←/→
              </kbd>
              Navegar
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5">
              <kbd className="rounded border border-white/10 bg-[#121820] px-1.5 py-0.2 text-[10px] text-[#F3F4F6]">
                ENTER
              </kbd>
              Abrir
            </span>
            {onQuickCreateTask && (
              <span className="inline-flex shrink-0 items-center gap-1.5">
                <kbd className="rounded border border-white/10 bg-[#121820] px-1.5 py-0.2 text-[10px] text-[#66C0F4]">
                  N
                </kbd>
                Nova Tarefa
              </span>
            )}
            {onQuickCreateGroup && (
              <span className="inline-flex shrink-0 items-center gap-1.5">
                <kbd className="rounded border border-white/10 bg-[#121820] px-1.5 py-0.2 text-[10px] text-[#66C0F4]">
                  G
                </kbd>
                Novo Grupo
              </span>
            )}
            {onToggleSocialOverlay && (
              <span className="inline-flex shrink-0 items-center gap-1.5">
                <kbd className="rounded border border-white/10 bg-[#121820] px-1.5 py-0.2 text-[10px] text-[#A4D007]">
                  TAB
                </kbd>
                Social
              </span>
            )}
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#A4D007]" />
            <span>
              {pendingRequestsCount > 0
                ? `${pendingRequestsCount} convite(s)`
                : "Pronto"}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}