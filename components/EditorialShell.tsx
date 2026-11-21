"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Layers,
  Users,
  UserCheck,
  Plus,
  Check,
  Copy,
  ArrowUpRight,
  Menu,
  X,
} from "lucide-react";
import { EditorialAvatar } from "@/components/EditorialAvatar";
import {
  createStudyGroupAction,
  joinStudyGroupByCodeAction,
} from "@/app/actions/mindly";

export interface ShellGroupItem {
  id: string;
  name: string;
  inviteCode: string;
  role: "OWNER" | "MEMBER";
  memberCount: number;
}

export interface ShellUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface EditorialShellProps {
  user: ShellUser | null;
  groups: ShellGroupItem[];
  pageTitle: string;
  pageEyebrow?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export function EditorialShell({
  user,
  groups,
  pageTitle,
  pageEyebrow = "MINDLY · CADERNO DE ESTUDOS",
  headerActions,
  children,
}: EditorialShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [inviteInput, setInviteInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    const res = await createStudyGroupAction({
      name: groupName,
      description: groupDesc,
    });
    setSubmitting(false);
    if (!res.ok) {
      setFeedback(res.error);
      return;
    }
    setGroupName("");
    setGroupDesc("");
    setShowGroupModal(false);
  }

  async function handleJoinGroup(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    const res = await joinStudyGroupByCodeAction(inviteInput);
    setSubmitting(false);
    if (!res.ok) {
      setFeedback(res.error);
      return;
    }
    setInviteInput("");
    setShowGroupModal(false);
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-paper px-4 py-6">
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-xs bg-olive" />
            <span className="font-serif text-xl font-medium tracking-tight text-ink">
              Mindly
            </span>
          </Link>
          <span className="border border-line bg-surface px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ink-muted rounded-xs">
            Ed. I
          </span>
        </div>

        <nav className="space-y-1">
          <p className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            Espaço
          </p>
          <Link
            href="/"
            className={`editorial-transition flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm ${
              pathname === "/"
                ? "bg-surface font-medium text-ink border border-line"
                : "text-ink-muted hover:bg-surface/70 hover:text-ink border border-transparent"
            }`}
          >
            <BookOpen className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>Catálogo</span>
          </Link>

          <Link
            href="/workspace"
            className={`editorial-transition flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm ${
              pathname === "/workspace"
                ? "bg-surface font-medium text-ink border border-line"
                : "text-ink-muted hover:bg-surface/70 hover:text-ink border border-transparent"
            }`}
          >
            <Layers className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>Meu Espaço Pessoal</span>
          </Link>

          <Link
            href="/perfil"
            className={`editorial-transition flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm ${
              pathname === "/perfil"
                ? "bg-surface font-medium text-ink border border-line"
                : "text-ink-muted hover:bg-surface/70 hover:text-ink border border-transparent"
            }`}
          >
            <UserCheck className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>Perfil e Estatísticas</span>
          </Link>
        </nav>

        <div className="space-y-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
              Grupos de Estudo
            </span>
            {user && (
              <button
                type="button"
                onClick={() => {
                  setFeedback(null);
                  setShowGroupModal(true);
                }}
                title="Criar ou entrar em grupo"
                className="editorial-transition flex h-6 w-6 items-center justify-center rounded-sm border border-line bg-surface text-ink hover:border-olive hover:text-olive"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            )}
          </div>

          {groups.length === 0 ? (
            <p className="px-2.5 py-2 text-xs leading-relaxed text-ink-subtle">
              Nenhum grupo ativo. Crie um ou entre via código de convite.
            </p>
          ) : (
            <div className="space-y-1">
              {groups.map((g) => {
                const href = `/grupos/${g.id}`;
                const active = pathname === href;
                return (
                  <Link
                    key={g.id}
                    href={href}
                    className={`editorial-transition flex items-center justify-between rounded-md px-2.5 py-2 text-sm ${
                      active
                        ? "bg-surface font-medium text-ink border border-line"
                        : "text-ink-muted hover:bg-surface/70 hover:text-ink border border-transparent"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Users className="h-3.5 w-3.5 shrink-0 text-olive" strokeWidth={1.5} />
                      <span className="truncate">{g.name}</span>
                    </span>
                    <span className="ml-2 shrink-0 text-[11px] text-ink-subtle">
                      {g.memberCount}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-line pt-4">
        {user ? (
          <Link
            href="/perfil"
            className="editorial-transition flex items-center gap-3 rounded-md p-2 hover:bg-surface"
          >
            <EditorialAvatar
              src={user.image}
              name={user.name}
              email={user.email}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-ink">{user.name}</p>
              <p className="truncate text-[11px] text-ink-muted">{user.email}</p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center justify-between px-2">
            <Link
              href="/login"
              className="text-xs font-medium text-ink-muted hover:text-ink"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="editorial-transition rounded-md bg-olive px-3 py-1.5 text-xs font-medium text-surface hover:bg-olive-deep"
            >
              Criar conta
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="hidden w-64 shrink-0 border-r border-line md:block">
          {sidebarContent}
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div className="w-72 border-r border-line bg-paper">
              {sidebarContent}
            </div>
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setMobileOpen(false)}
              className="flex-1 bg-ink/20"
            />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur-xs">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5 sm:px-10">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  aria-label="Abrir menu"
                  onClick={() => setMobileOpen(true)}
                  className="editorial-transition flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface text-ink md:hidden"
                >
                  {mobileOpen ? (
                    <X className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <Menu className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </button>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted">
                    {pageEyebrow}
                  </p>
                  <h1 className="truncate font-serif text-2xl font-normal tracking-tight text-ink sm:text-3xl">
                    {pageTitle}
                  </h1>
                </div>
              </div>

              {headerActions && (
                <div className="flex shrink-0 items-center gap-2.5">
                  {headerActions}
                </div>
              )}
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 sm:px-10 sm:py-10">
            {children}
          </main>
        </div>
      </div>

      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4">
          <div className="w-full max-w-lg rounded-lg border border-line bg-surface p-6 sm:p-8">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                  COLABORAÇÃO
                </p>
                <h2 className="mt-1 font-serif text-2xl text-ink">
                  Grupos de Estudo
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowGroupModal(false)}
                className="rounded-sm p-1 text-ink-muted hover:text-ink"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>

            {feedback && (
              <div className="mb-5 rounded-md border border-line bg-paper px-3.5 py-2.5 text-xs text-ink">
                {feedback}
              </div>
            )}

            <div className="grid gap-8 sm:grid-cols-2">
              <form onSubmit={handleCreateGroup} className="space-y-3.5">
                <p className="text-xs font-medium uppercase tracking-wider text-olive">
                  Criar novo grupo
                </p>
                <div>
                  <label className="mb-1 block text-xs text-ink-muted">
                    Nome do grupo
                  </label>
                  <input
                    type="text"
                    required
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Ex: Cálculo & Álgebra"
                    className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-olive focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-ink-muted">
                    Descrição (opcional)
                  </label>
                  <input
                    type="text"
                    value={groupDesc}
                    onChange={(e) => setGroupDesc(e.target.value)}
                    placeholder="Listas semanais e revisão"
                    className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-olive focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="editorial-transition w-full rounded-md bg-olive px-4 py-2 text-xs font-medium text-surface hover:bg-olive-deep disabled:opacity-50"
                >
                  Criar grupo
                </button>
              </form>

              <form
                onSubmit={handleJoinGroup}
                className="space-y-3.5 border-t border-line pt-6 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                  Entrar com código
                </p>
                <div>
                  <label className="mb-1 block text-xs text-ink-muted">
                    Código de convite
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteInput}
                    onChange={(e) => setInviteInput(e.target.value.toUpperCase())}
                    placeholder="EX: 7K9M2P"
                    className="w-full rounded-md border border-line bg-paper px-3 py-2 font-mono text-sm uppercase text-ink focus:border-olive focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="editorial-transition w-full rounded-md border border-line bg-surface px-4 py-2 text-xs font-medium text-ink hover:border-olive hover:text-olive disabled:opacity-50"
                >
                  Entrar no grupo
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}