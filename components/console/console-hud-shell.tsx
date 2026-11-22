"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Clock,
  Flame,
  Gamepad2,
  Search,
  Sparkles,
  User as UserIcon,
  Users,
} from "lucide-react";

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
  socialOverlayOpen?: boolean;
  onToggleSocialOverlay?: () => void;
  onQuickCreateTask?: () => void;
  onQuickCreateGroup?: () => void;
  globalSearchQuery?: string;
  onGlobalSearchChange?: (value: string) => void;
}

const PRESENCE_META: Record<
  ConsolePresence,
  { label: string; dotClass: string; badgeClass: string }
> = {
  ONLINE: {
    label: "Online",
    dotClass: "bg-[#A4D007] shadow-[0_0_8px_#A4D007]",
    badgeClass: "text-[#A4D007] border-[#A4D007]/30 bg-[#A4D007]/10",
  },
  STUDYING: {
    label: "Em Sessão",
    dotClass: "bg-[#66C0F4] shadow-[0_0_8px_#66C0F4]",
    badgeClass: "text-[#66C0F4] border-[#66C0F4]/30 bg-[#66C0F4]/10",
  },
  BUSY: {
    label: "Ocupado",
    dotClass: "bg-[#E5A93C] shadow-[0_0_8px_#E5A93C]",
    badgeClass: "text-[#E5A93C] border-[#E5A93C]/30 bg-[#E5A93C]/10",
  },
  OFFLINE: {
    label: "Offline",
    dotClass: "bg-[#8F98A0]",
    badgeClass: "text-[#8F98A0] border-[#8F98A0]/30 bg-[#8F98A0]/10",
  },
};

export function ConsoleHudShell({
  children,
  user,
  ambientColor = "#1A9FFF",
  pendingRequestsCount = 0,
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
          document.querySelectorAll<HTMLElement>("[data-console-focusable='true']")
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

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0E141B] text-[#F3F4F6] selection:bg-[#66C0F4]/30 selection:text-white">
      {/* Ambient Background Dinâmico */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{
            background: `radial-gradient(circle at 18% 12%, ${ambientColor}33 0%, transparent 52%), radial-gradient(circle at 85% 20%, #1A9FFF1F 0%, transparent 48%), linear-gradient(180deg, #0E141B 0%, #0A0E14 100%)`,
          }}
          transition={{ type: "spring", stiffness: 180, damping: 28 }}
          className="h-full w-full"
        />
        <div className="absolute inset-0 bg-[#0E141B]/45 backdrop-blur-3xl" />
      </div>

      {/* Top System Bar (HUD Superior) */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#171D25]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Marca + Navegação */}
          <div className="flex items-center gap-5">
            <Link
              href="/"
              data-console-focusable="true"
              className="group flex items-center gap-2.5 rounded-lg px-2 py-1 outline-none transition focus-visible:ring-2 focus-visible:ring-[#66C0F4]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#1A9FFF] to-[#66C0F4] text-[#0E141B] shadow-[0_0_20px_rgba(102,192,244,0.35)]">
                <Gamepad2 className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-[#F3F4F6]">
                    Mindly
                  </span>
                  <span className="rounded bg-[#66C0F4]/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#66C0F4]">
                    HUD OS
                  </span>
                </div>
                <p className="text-[11px] text-[#8F98A0]">
                  Biblioteca & Co-op Lobby
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {[
                { href: "/", label: "Biblioteca" },
                { href: "/workspace", label: "Workspace" },
                { href: "/perfil", label: "Perfil & Avatar" },
              ].map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-console-focusable="true"
                    className={`relative rounded-lg px-3 py-1.5 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-[#66C0F4] ${
                      active
                        ? "text-[#F3F4F6]"
                        : "text-[#8F98A0] hover:bg-[#1E2631] hover:text-[#F3F4F6]"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="hudNavActive"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        className="absolute inset-0 -z-10 rounded-lg border border-[#66C0F4]/40 bg-[#1E2631]"
                      />
                    )}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Busca Rápida Global (Ctrl + K) */}
          <div className="order-3 w-full sm:order-2 sm:w-72 lg:w-80">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-[#8F98A0]" />
              <input
                ref={searchInputRef}
                type="text"
                value={globalSearchQuery}
                onChange={(e) => onGlobalSearchChange?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !onGlobalSearchChange && globalSearchQuery.trim()) {
                    router.push(`/?q=${encodeURIComponent(globalSearchQuery.trim())}`);
                  }
                }}
                placeholder="Buscar disciplina, grupo ou @amigo..."
                className="w-full rounded-lg border border-white/10 bg-[#0E141B]/80 py-1.5 pl-9 pr-14 text-sm text-[#F3F4F6] placeholder-[#8F98A0] outline-none transition focus:border-[#66C0F4] focus:ring-2 focus:ring-[#66C0F4]/30"
              />
              <kbd className="pointer-events-none absolute right-2.5 rounded border border-white/15 bg-[#1E2631] px-1.5 py-0.5 font-mono text-[10px] text-[#8F98A0]">
                Ctrl+K
              </kbd>
            </div>
          </div>

          {/* Telemetria, Overlay Social e Pill de Perfil */}
          <div className="order-2 flex items-center gap-2.5 sm:order-3">
            {user && (
              <div className="hidden items-center gap-2 xl:flex">
                <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1E2631]/90 px-2.5 py-1 font-mono text-xs text-[#E5A93C]">
                  <Flame className="h-3.5 w-3.5" />
                  <span>{user.streakDays}d</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1E2631]/90 px-2.5 py-1 font-mono text-xs text-[#66C0F4]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{user.xp} XP</span>
                </div>
              </div>
            )}

            <div className="hidden items-center gap-1.5 rounded-lg border border-white/10 bg-[#1E2631]/70 px-2.5 py-1 font-mono text-xs text-[#8F98A0] sm:flex">
              <Clock className="h-3.5 w-3.5 text-[#66C0F4]" />
              <span>{clockText || "--:--"}</span>
            </div>

            {onToggleSocialOverlay && (
              <button
                type="button"
                onClick={onToggleSocialOverlay}
                data-console-focusable="true"
                className={`relative flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#66C0F4] ${
                  socialOverlayOpen
                    ? "border-[#66C0F4] bg-[#1A9FFF]/20 text-[#66C0F4]"
                    : "border-white/10 bg-[#1E2631] text-[#F3F4F6] hover:bg-[#26303E]"
                }`}
              >
                <Users className="h-4 w-4 text-[#66C0F4]" />
                <span className="hidden sm:inline">Social</span>
                {pendingRequestsCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D94126] px-1 font-mono text-[10px] font-bold text-white">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>
            )}

            {user ? (
              <Link
                href="/perfil"
                data-console-focusable="true"
                className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#1E2631] py-1 pl-1.5 pr-3 outline-none transition hover:border-[#66C0F4]/60 hover:bg-[#26303E] focus-visible:ring-2 focus-visible:ring-[#66C0F4]"
              >
                <div className="relative h-8 w-8 shrink-0">
                  {effectiveAvatar ? (
                    <img
                      src={effectiveAvatar}
                      alt={user.name}
                      className="h-8 w-8 rounded-lg object-cover ring-1 ring-white/20"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#26303E] text-xs font-bold text-[#66C0F4]">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#1E2631] ${presenceInfo.dotClass}`}
                  />
                </div>
                <div className="hidden text-left sm:block">
                  <div className="flex items-center gap-1.5">
                    <span className="max-w-[120px] truncate text-xs font-semibold text-[#F3F4F6]">
                      {user.name}
                    </span>
                    <span
                      className={`rounded border px-1.5 py-0.2 font-mono text-[10px] ${presenceInfo.badgeClass}`}
                    >
                      {presenceInfo.label}
                    </span>
                  </div>
                  <p className="max-w-[180px] truncate text-[11px] text-[#8F98A0]">
                    {user.statusText ||
                      (user.username ? `@${user.username}` : "Pronto para estudar")}
                  </p>
                </div>
              </Link>
            ) : (
              <Link
                href="/login"
                data-console-focusable="true"
                className="flex items-center gap-2 rounded-lg bg-[#1A9FFF] px-3.5 py-1.5 text-xs font-semibold text-[#0E141B] shadow-[0_0_20px_rgba(26,159,255,0.3)] transition hover:bg-[#66C0F4]"
              >
                <UserIcon className="h-3.5 w-3.5" />
                <span>Entrar</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="relative z-10 mx-auto max-w-[1440px] px-4 pb-20 pt-6 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Action Bar (Rodapé de Atalhos estilo Console) */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#171D25]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 px-4 py-2 font-mono text-[11px] text-[#8F98A0] sm:px-6">
          <div className="flex flex-wrap items-center gap-4">
            <span>
              <kbd className="rounded border border-white/15 bg-[#1E2631] px-1.5 py-0.5 text-[#F3F4F6]">
                ← / →
              </kbd>{" "}
              Navegar Foco
            </span>
            <span>
              <kbd className="rounded border border-white/15 bg-[#1E2631] px-1.5 py-0.5 text-[#F3F4F6]">
                ENTER
              </kbd>{" "}
              Acessar
            </span>
            {onQuickCreateTask && (
              <span>
                <kbd className="rounded border border-white/15 bg-[#1E2631] px-1.5 py-0.5 text-[#66C0F4]">
                  N
                </kbd>{" "}
                Nova Tarefa
              </span>
            )}
            {onQuickCreateGroup && (
              <span>
                <kbd className="rounded border border-white/15 bg-[#1E2631] px-1.5 py-0.5 text-[#66C0F4]">
                  G
                </kbd>{" "}
                Novo Grupo
              </span>
            )}
            {onToggleSocialOverlay && (
              <span>
                <kbd className="rounded border border-white/15 bg-[#1E2631] px-1.5 py-0.5 text-[#A4D007]">
                  TAB
                </kbd>{" "}
                Social Overlay
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[#8F98A0]">
            <Bell className="h-3.5 w-3.5 text-[#66C0F4]" />
            <span>
              {pendingRequestsCount > 0
                ? `${pendingRequestsCount} convite(s) pendente(s)`
                : "Sistema sincronizado"}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}