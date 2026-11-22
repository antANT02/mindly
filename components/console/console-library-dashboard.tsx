"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Circle,
  Copy,
  Plus,
  Users,
  X,
} from "lucide-react";
import {
  createCoopTaskAction,
  createStudyGroupAction,
  toggleCoopTaskCompletionAction,
} from "@/app/actions/coop.actions";
import {
  ConsoleHudShell,
  type ConsoleUserProfile,
} from "@/components/console/console-hud-shell";
import { SteamSocialOverlay } from "@/components/console/steam-social-overlay";

export interface ConsoleLibrarySubjectCard {
  id: string;
  name: string;
  code: string | null;
  accentColor: string;
  coverImage: string | null;
  groupId: string | null;
  groupName: string | null;
  totalTasks: number;
  completedTasks: number;
  nextTaskTitle?: string | null;
  href: string;
}

export interface ConsoleLibraryGroupCard {
  id: string;
  name: string;
  description: string | null;
  bannerColor: string;
  inviteCode: string;
  memberCount: number;
  taskCount: number;
  members: Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
    image: string | null;
    presence: string;
  }>;
  href: string;
}

export interface ConsoleCoopTaskItem {
  id: string;
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  subjectName: string | null;
  groupName: string | null;
  dueDate?: string | null;
  href: string;
  completedByCurrentUser: boolean;
  assignees: Array<{
    userId: string;
    name: string;
    avatarUrl: string | null;
    image: string | null;
    completedIndividual: boolean;
  }>;
}

export interface ConsoleFriendOption {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  image: string | null;
  presence: string;
  statusText: string | null;
  xp: number;
  streakDays: number;
}

export interface ConsolePendingRequest {
  id: string;
  requester: {
    id: string;
    name: string;
    username: string | null;
    avatarUrl: string | null;
    image: string | null;
    presence: string;
  };
}

interface ConsoleLibraryDashboardProps {
  currentUser: ConsoleUserProfile | null;
  subjects: ConsoleLibrarySubjectCard[];
  groups: ConsoleLibraryGroupCard[];
  coopTasks: ConsoleCoopTaskItem[];
  friends: ConsoleFriendOption[];
  pendingRequests: ConsolePendingRequest[];
}

type SpotlightTarget =
  | {
      kind: "SUBJECT";
      id: string;
      title: string;
      tag: string;
      subtitle: string;
      accentColor: string;
      href: string;
      progress: number;
      completedTasks: number;
      totalTasks: number;
      nextTaskTitle: string | null;
      members: Array<{
        id: string;
        name: string;
        avatarUrl: string | null;
        image: string | null;
      }>;
    }
  | {
      kind: "GROUP";
      id: string;
      title: string;
      tag: string;
      subtitle: string;
      accentColor: string;
      href: string;
      progress: number;
      completedTasks: number;
      totalTasks: number;
      nextTaskTitle: string | null;
      members: Array<{
        id: string;
        name: string;
        avatarUrl: string | null;
        image: string | null;
      }>;
    };

const PRIORITY_STYLES: Record<
  ConsoleCoopTaskItem["priority"],
  { label: string; className: string }
> = {
  LOW: {
    label: "Baixa",
    className: "text-[#8F98A0] border-white/10 bg-white/[0.03]",
  },
  MEDIUM: {
    label: "Média",
    className: "text-[#66C0F4] border-[#66C0F4]/25 bg-[#66C0F4]/10",
  },
  HIGH: {
    label: "Alta",
    className: "text-[#E5A93C] border-[#E5A93C]/30 bg-[#E5A93C]/10",
  },
  URGENT: {
    label: "Urgente",
    className: "text-[#E04F33] border-[#E04F33]/35 bg-[#E04F33]/10",
  },
};

function formatTitle(raw: string): string {
  if (!raw) return "";
  return raw
    .trim()
    .split(/\s+/)
    .map((word) =>
      word.length <= 2
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

function getMonogram(raw: string): string {
  const words = raw.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "ML";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function ConsoleLibraryDashboard({
  currentUser,
  subjects,
  groups,
  coopTasks,
  friends,
  pendingRequests,
}: ConsoleLibraryDashboardProps) {
  const initialSpotlight: SpotlightTarget | null = useMemo(() => {
    if (subjects.length > 0) {
      const s = subjects[0];
      const progress =
        s.totalTasks > 0
          ? Math.round((s.completedTasks / s.totalTasks) * 100)
          : 0;
      return {
        kind: "SUBJECT",
        id: s.id,
        title: formatTitle(s.name),
        tag: s.code || "DISCIPLINA",
        subtitle: s.groupName
          ? `Vinculada ao grupo ${formatTitle(s.groupName)}`
          : "Trilha individual de estudo",
        accentColor: s.accentColor || "#66C0F4",
        href: s.href,
        progress,
        completedTasks: s.completedTasks,
        totalTasks: s.totalTasks,
        nextTaskTitle: s.nextTaskTitle ?? null,
        members: [],
      };
    }

    if (groups.length > 0) {
      const g = groups[0];
      return {
        kind: "GROUP",
        id: g.id,
        title: formatTitle(g.name),
        tag: g.inviteCode,
        subtitle: g.description || "Lobby colaborativo de estudos",
        accentColor: g.bannerColor || "#1A9FFF",
        href: g.href,
        progress: 0,
        completedTasks: 0,
        totalTasks: g.taskCount,
        nextTaskTitle: null,
        members: g.members,
      };
    }

    return null;
  }, [subjects, groups]);

  const [spotlight, setSpotlight] = useState<SpotlightTarget | null>(
    initialSpotlight
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [socialOpen, setSocialOpen] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [groupModalOpen, setGroupModalOpen] = useState<boolean>(false);
  const [groupName, setGroupName] = useState<string>("");
  const [groupDescription, setGroupDescription] = useState<string>("");
  const [groupColor, setGroupColor] = useState<string>("#1A9FFF");
  const [groupSubmitting, setGroupSubmitting] = useState<boolean>(false);
  const [groupError, setGroupError] = useState<string | null>(null);

  const [taskModalOpen, setTaskModalOpen] = useState<boolean>(false);
  const [taskTitle, setTaskTitle] = useState<string>("");
  const [taskDescription, setTaskDescription] = useState<string>("");
  const [taskPriority, setTaskPriority] =
    useState<ConsoleCoopTaskItem["priority"]>("MEDIUM");
  const [taskGroupId, setTaskGroupId] = useState<string>(groups[0]?.id ?? "");
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [taskSubmitting, setTaskSubmitting] = useState<boolean>(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);

  const onlineFriendsCount = useMemo(
    () => friends.filter((f) => f.presence !== "OFFLINE").length,
    [friends]
  );

  const filteredSubjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.groupName && s.groupName.toLowerCase().includes(q))
    );
  }, [subjects, searchQuery]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q)) ||
        g.inviteCode.toLowerCase().includes(q)
    );
  }, [groups, searchQuery]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return coopTasks;
    return coopTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.subjectName && t.subjectName.toLowerCase().includes(q)) ||
        (t.groupName && t.groupName.toLowerCase().includes(q))
    );
  }, [coopTasks, searchQuery]);

  const focusSubject = (subject: ConsoleLibrarySubjectCard) => {
    const progress =
      subject.totalTasks > 0
        ? Math.round((subject.completedTasks / subject.totalTasks) * 100)
        : 0;
    const pendingTask = coopTasks.find(
      (t) =>
        !t.completedByCurrentUser &&
        t.subjectName?.toLowerCase() === subject.name.toLowerCase()
    );

    setSpotlight({
      kind: "SUBJECT",
      id: subject.id,
      title: formatTitle(subject.name),
      tag: subject.code || "DISCIPLINA",
      subtitle: subject.groupName
        ? `Lobby ${formatTitle(subject.groupName)}`
        : "Trilha de estudo na biblioteca",
      accentColor: subject.accentColor || "#66C0F4",
      href: subject.href,
      progress,
      completedTasks: subject.completedTasks,
      totalTasks: subject.totalTasks,
      nextTaskTitle: pendingTask?.title ?? subject.nextTaskTitle ?? null,
      members: [],
    });
  };

  const focusGroup = (group: ConsoleLibraryGroupCard) => {
    const pendingTask = coopTasks.find(
      (t) =>
        !t.completedByCurrentUser &&
        t.groupName?.toLowerCase() === group.name.toLowerCase()
    );

    setSpotlight({
      kind: "GROUP",
      id: group.id,
      title: formatTitle(group.name),
      tag: group.inviteCode,
      subtitle: group.description || "Grupo de estudo colaborativo",
      accentColor: group.bannerColor || "#1A9FFF",
      href: group.href,
      progress: 0,
      completedTasks: 0,
      totalTasks: group.taskCount,
      nextTaskTitle: pendingTask?.title ?? null,
      members: group.members,
    });
  };

  const handleCopyInviteCode = async (
    e: React.MouseEvent,
    code: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1800);
    } catch {
      // ignora erro de clipboard
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setGroupSubmitting(true);
    setGroupError(null);

    const res = await createStudyGroupAction({
      name: groupName,
      description: groupDescription || null,
      bannerColor: groupColor,
    });

    setGroupSubmitting(false);
    if (!res.ok) {
      setGroupError(res.error || "Erro ao criar grupo.");
      return;
    }

    setGroupName("");
    setGroupDescription("");
    setGroupModalOpen(false);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskSubmitting(true);
    setTaskError(null);

    const res = await createCoopTaskAction({
      title: taskTitle,
      description: taskDescription || null,
      priority: taskPriority,
      groupId: taskGroupId || null,
      assigneeIds: selectedFriendIds,
    });

    setTaskSubmitting(false);
    if (!res.ok) {
      setTaskError(res.error || "Erro ao criar tarefa.");
      return;
    }

    setTaskTitle("");
    setTaskDescription("");
    setSelectedFriendIds([]);
    setTaskModalOpen(false);
  };

  const handleToggleTask = async (
    taskId: string,
    currentCompleted: boolean
  ) => {
    setTogglingTaskId(taskId);
    await toggleCoopTaskCompletionAction(taskId, !currentCompleted);
    setTogglingTaskId(null);
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const activeAccent = spotlight?.accentColor || "#1A9FFF";

  return (
    <ConsoleHudShell
      user={currentUser}
      ambientColor={activeAccent}
      pendingRequestsCount={pendingRequests.length}
      onlineFriendsCount={onlineFriendsCount}
      socialOverlayOpen={socialOpen}
      onToggleSocialOverlay={() => setSocialOpen((prev) => !prev)}
      onQuickCreateTask={() => setTaskModalOpen(true)}
      onQuickCreateGroup={() => setGroupModalOpen(true)}
      globalSearchQuery={searchQuery}
      onGlobalSearchChange={setSearchQuery}
    >
      <div className="space-y-10">
        {/* 1. Hero Spotlight Dinâmico */}
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#121820]/90 p-6 sm:p-7">
          {/* Malha geométrica e iluminação reativa à cor do item em foco */}
          <div
            className="pointer-events-none absolute inset-0 opacity-30 transition-all duration-500"
            style={{
              backgroundImage: `radial-gradient(circle at 85% 25%, ${activeAccent}55 0%, transparent 55%), linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)`,
              backgroundSize: "100% 100%, 28px 28px, 28px 28px",
            }}
          />

          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl space-y-3">
              <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: activeAccent }}
                />
                <span className="uppercase tracking-wider text-[#66C0F4]">
                  {spotlight
                    ? spotlight.kind === "GROUP"
                      ? `Lobby · ${spotlight.tag}`
                      : `Em Foco · ${spotlight.tag}`
                    : "Biblioteca"}
                </span>
                {spotlight && spotlight.totalTasks > 0 && (
                  <span className="tabular-nums text-[#8F98A0]">
                    · {spotlight.completedTasks}/{spotlight.totalTasks}{" "}
                    concluídas
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-[#F3F4F6] sm:text-3xl">
                {spotlight
                  ? spotlight.title
                  : "Organize suas disciplinas e lobbies de estudo"}
              </h1>

              <p className="text-sm text-[#8F98A0]">
                {spotlight
                  ? spotlight.subtitle
                  : "Crie uma disciplina ou grupo colaborativo para começar."}
              </p>

              {spotlight?.nextTaskTitle && (
                <div className="inline-flex items-center gap-2 rounded-lg border border-white/[0.07] bg-[#0B0F14]/80 px-3 py-1.5 text-xs text-[#F3F4F6]">
                  <span className="font-mono text-[11px] uppercase text-[#E5A93C]">
                    Próxima:
                  </span>
                  <span className="truncate max-w-md">
                    {spotlight.nextTaskTitle}
                  </span>
                </div>
              )}

              {spotlight && spotlight.kind === "SUBJECT" && (
                <div className="max-w-md pt-1">
                  <div className="mb-1 flex justify-between font-mono text-[11px] tabular-nums text-[#8F98A0]">
                    <span>Progresso da trilha</span>
                    <span className="text-[#F3F4F6]">{spotlight.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0B0F14]">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${spotlight.progress}%`,
                        backgroundColor: activeAccent,
                      }}
                    />
                  </div>
                </div>
              )}

              {spotlight &&
                spotlight.kind === "GROUP" &&
                spotlight.members.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex -space-x-1.5">
                      {spotlight.members.slice(0, 6).map((m) => {
                        const avatar = m.avatarUrl || m.image;
                        return avatar ? (
                          <img
                            key={m.id}
                            src={avatar}
                            alt={m.name}
                            title={m.name}
                            className="h-7 w-7 rounded-md object-cover ring-2 ring-[#121820]"
                          />
                        ) : (
                          <span
                            key={m.id}
                            title={m.name}
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1A222D] font-mono text-[10px] font-bold text-[#66C0F4] ring-2 ring-[#121820]"
                          >
                            {m.name.charAt(0).toUpperCase()}
                          </span>
                        );
                      })}
                    </div>
                    <span className="font-mono text-xs tabular-nums text-[#8F98A0]">
                      {spotlight.members.length} integrante(s)
                    </span>
                  </div>
                )}
            </div>

            {/* Ações Imediatas */}
            <div className="flex flex-wrap items-center gap-2.5">
              {spotlight && (
                <Link
                  href={spotlight.href}
                  data-console-focusable="true"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1A9FFF] px-4 py-2.5 text-sm font-semibold text-[#0B0F14] outline-none transition hover:bg-[#66C0F4] focus-visible:ring-2 focus-visible:ring-[#66C0F4]"
                >
                  <span>
                    {spotlight.kind === "GROUP"
                      ? "Abrir Grupo"
                      : "Abrir Disciplina"}
                  </span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              )}

              <button
                type="button"
                onClick={() => setTaskModalOpen(true)}
                data-console-focusable="true"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#1A222D] px-3.5 py-2.5 text-sm font-medium text-[#F3F4F6] outline-none transition hover:border-[#66C0F4]/60 hover:bg-[#222C3A] focus-visible:ring-2 focus-visible:ring-[#66C0F4]"
              >
                <Plus className="h-4 w-4 text-[#66C0F4]" />
                <span>Nova Tarefa</span>
              </button>

              <button
                type="button"
                onClick={() => setGroupModalOpen(true)}
                data-console-focusable="true"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#1A222D] px-3.5 py-2.5 text-sm font-medium text-[#F3F4F6] outline-none transition hover:border-[#66C0F4]/60 hover:bg-[#222C3A] focus-visible:ring-2 focus-visible:ring-[#66C0F4]"
              >
                <Users className="h-4 w-4 text-[#A4D007]" />
                <span>Novo Grupo</span>
              </button>
            </div>
          </div>
        </section>

        {/* 2. Estante de Disciplinas (Steam Capsule Grid com Capas Procedurais) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2.5">
              <h2 className="text-base font-bold tracking-tight text-[#F3F4F6]">
                Disciplinas
              </h2>
              <span className="font-mono text-xs tabular-nums text-[#8F98A0]">
                {filteredSubjects.length}
              </span>
            </div>
            <Link
              href="/workspace"
              data-console-focusable="true"
              className="font-mono text-xs text-[#66C0F4] hover:underline"
            >
              Gerenciar no Workspace →
            </Link>
          </div>

          {filteredSubjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#121820]/50 p-8 text-center text-sm text-[#8F98A0]">
              Nenhuma disciplina encontrada.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredSubjects.map((subject) => {
                const progress =
                  subject.totalTasks > 0
                    ? Math.round(
                        (subject.completedTasks / subject.totalTasks) * 100
                      )
                    : 0;
                const displayName = formatTitle(subject.name);
                const monogram = getMonogram(subject.name);
                const isSelected =
                  spotlight?.kind === "SUBJECT" && spotlight.id === subject.id;

                return (
                  <Link
                    key={subject.id}
                    href={subject.href}
                    data-console-focusable="true"
                    onMouseEnter={() => focusSubject(subject)}
                    onFocus={() => focusSubject(subject)}
                    className={`group relative flex aspect-[16/10] flex-col justify-between overflow-hidden rounded-xl border bg-[#121820] outline-none transition duration-200 hover:scale-[1.02] hover:ring-2 hover:ring-[#66C0F4] hover:shadow-[0_0_28px_rgba(102,192,244,0.22)] focus-visible:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[#66C0F4] focus-visible:shadow-[0_0_28px_rgba(102,192,244,0.22)] ${
                      isSelected
                        ? "border-[#66C0F4]/60"
                        : "border-white/[0.07]"
                    }`}
                  >
                    {/* Arte de Capa Procedural */}
                    {subject.coverImage ? (
                      <img
                        src={subject.coverImage}
                        alt={displayName}
                        className="absolute inset-0 h-full w-full object-cover opacity-55 transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="absolute inset-0 opacity-90 transition duration-300 group-hover:scale-105"
                        style={{
                          backgroundImage: `radial-gradient(circle at 80% 15%, ${subject.accentColor}4D 0%, transparent 62%), linear-gradient(135deg, ${subject.accentColor}22 0%, #121820 75%), radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)`,
                          backgroundSize: "100% 100%, 100% 100%, 14px 14px",
                        }}
                      />
                    )}

                    {/* Monograma Tipográfico de Fundo */}
                    <span className="pointer-events-none absolute -bottom-3 right-3 select-none font-sans text-6xl font-extrabold tracking-tighter text-white/[0.05]">
                      {monogram}
                    </span>

                    {/* Gradiente de legibilidade */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0F14] via-[#0B0F14]/45 to-transparent" />

                    {/* Topo da Cápsula */}
                    <div className="relative flex items-center justify-between p-3.5">
                      <span className="rounded bg-[#0B0F14]/80 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-[#F3F4F6]/90 backdrop-blur-sm">
                        {subject.code || "TRILHA"}
                      </span>
                      {subject.groupName && (
                        <span className="max-w-[140px] truncate rounded bg-[#0B0F14]/80 px-2 py-0.5 font-mono text-[10px] text-[#A4D007] backdrop-blur-sm">
                          {formatTitle(subject.groupName)}
                        </span>
                      )}
                    </div>

                    {/* Rodapé da Cápsula + Barra de Progresso Integrada */}
                    <div className="relative space-y-2 p-3.5 pb-3">
                      <h3 className="line-clamp-2 text-base font-bold leading-snug tracking-tight text-[#F3F4F6] group-hover:text-white">
                        {displayName}
                      </h3>
                      <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-[#8F98A0]">
                        <span>
                          {subject.completedTasks}/{subject.totalTasks}{" "}
                          concluídas
                        </span>
                        <span className="text-[#F3F4F6]">{progress}%</span>
                      </div>
                    </div>

                    <div className="relative h-1 w-full bg-[#0B0F14]">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: subject.accentColor || "#66C0F4",
                        }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* 3. Estante de Grupos de Estudo (Co-op Hubs) */}
        <section className="space-y-4">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-base font-bold tracking-tight text-[#F3F4F6]">
              Grupos de Estudo
            </h2>
            <span className="font-mono text-xs tabular-nums text-[#8F98A0]">
              {filteredGroups.length}
            </span>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#121820]/50 p-6 text-center text-sm text-[#8F98A0]">
              Nenhum grupo ativo. Clique em <strong className="text-[#F3F4F6]">Novo Grupo</strong> para abrir um lobby colaborativo.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
              {filteredGroups.map((group) => {
                const displayName = formatTitle(group.name);
                return (
                  <Link
                    key={group.id}
                    href={group.href}
                    data-console-focusable="true"
                    onMouseEnter={() => focusGroup(group)}
                    onFocus={() => focusGroup(group)}
                    className="group relative flex overflow-hidden rounded-xl border border-white/[0.07] bg-[#121820] outline-none transition duration-200 hover:scale-[1.01] hover:ring-2 hover:ring-[#66C0F4] hover:shadow-[0_0_28px_rgba(102,192,244,0.2)] focus-visible:scale-[1.01] focus-visible:ring-2 focus-visible:ring-[#66C0F4]"
                  >
                    {/* Faixa lateral na cor do grupo */}
                    <div
                      className="w-1.5 shrink-0"
                      style={{ backgroundColor: group.bannerColor }}
                    />

                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="truncate text-base font-bold tracking-tight text-[#F3F4F6]">
                            {displayName}
                          </h3>
                          <button
                            type="button"
                            onClick={(e) =>
                              handleCopyInviteCode(e, group.inviteCode)
                            }
                            title="Copiar código de convite"
                            className="inline-flex shrink-0 items-center gap-1 rounded border border-white/10 bg-[#0B0F14] px-2 py-0.5 font-mono text-[11px] tabular-nums text-[#66C0F4] transition hover:border-[#66C0F4]"
                          >
                            <span>{group.inviteCode}</span>
                            {copiedCode === group.inviteCode ? (
                              <Check className="h-3 w-3 text-[#A4D007]" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>

                        {group.description && (
                          <p className="line-clamp-1 text-xs text-[#8F98A0]">
                            {group.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
                        <div className="flex -space-x-1.5">
                          {group.members.slice(0, 5).map((member) => {
                            const avatar = member.avatarUrl || member.image;
                            return avatar ? (
                              <img
                                key={member.id}
                                src={avatar}
                                alt={member.name}
                                title={member.name}
                                className="h-6 w-6 rounded-md object-cover ring-2 ring-[#121820]"
                              />
                            ) : (
                              <span
                                key={member.id}
                                title={member.name}
                                className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1A222D] font-mono text-[10px] font-bold text-[#66C0F4] ring-2 ring-[#121820]"
                              >
                                {member.name.charAt(0).toUpperCase()}
                              </span>
                            );
                          })}
                        </div>

                        <span className="font-mono text-[11px] tabular-nums text-[#8F98A0]">
                          {group.memberCount} membros · {group.taskCount}{" "}
                          tarefas
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* 4. Fila de Próximas Entregas */}
        <section className="space-y-3">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-base font-bold tracking-tight text-[#F3F4F6]">
              Próximas Entregas
            </h2>
            <span className="font-mono text-xs tabular-nums text-[#8F98A0]">
              {filteredTasks.length}
            </span>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#121820]/50 p-6 text-center text-sm text-[#8F98A0]">
              Nenhuma tarefa pendente na fila.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.07] bg-[#121820]">
              {filteredTasks.map((task) => {
                const priorityMeta = PRIORITY_STYLES[task.priority];
                const doneCount = task.assignees.filter(
                  (a) => a.completedIndividual
                ).length;

                return (
                  <div
                    key={task.id}
                    data-console-focusable="true"
                    tabIndex={0}
                    className="flex flex-col justify-between gap-3 px-4 py-3 outline-none transition hover:bg-[#1A222D]/65 focus-visible:bg-[#1A222D] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#66C0F4] sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {currentUser && (
                        <button
                          type="button"
                          disabled={togglingTaskId === task.id}
                          onClick={() =>
                            handleToggleTask(
                              task.id,
                              task.completedByCurrentUser
                            )
                          }
                          className="shrink-0 text-[#8F98A0] transition hover:text-[#66C0F4] disabled:opacity-50"
                        >
                          {task.completedByCurrentUser ? (
                            <CheckCircle2 className="h-4.5 w-4.5 text-[#A4D007]" />
                          ) : (
                            <Circle className="h-4.5 w-4.5" />
                          )}
                        </button>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={task.href}
                            className={`truncate text-sm font-medium transition hover:text-[#66C0F4] ${
                              task.completedByCurrentUser
                                ? "line-through text-[#8F98A0]"
                                : "text-[#F3F4F6]"
                            }`}
                          >
                            {task.title}
                          </Link>
                          <span
                            className={`rounded border px-1.5 py-0.2 font-mono text-[10px] ${priorityMeta.className}`}
                          >
                            {priorityMeta.label}
                          </span>
                          {task.subjectName && (
                            <span className="font-mono text-[11px] text-[#8F98A0]">
                              · {formatTitle(task.subjectName)}
                            </span>
                          )}
                          {task.groupName && (
                            <span className="font-mono text-[11px] text-[#A4D007]">
                              · {formatTitle(task.groupName)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 shrink-0">
                      {task.assignees.length > 0 && (
                        <span className="font-mono text-[11px] tabular-nums text-[#8F98A0]">
                          {doneCount}/{task.assignees.length}
                        </span>
                      )}
                      <Link
                        href={task.href}
                        className="font-mono text-xs text-[#66C0F4] hover:underline"
                      >
                        Abrir
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modal: Novo Grupo */}
      <AnimatePresence>
        {groupModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <motion.form
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              onSubmit={handleCreateGroup}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121820] p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-[#F3F4F6]">
                  Novo Grupo de Estudo
                </h3>
                <button
                  type="button"
                  onClick={() => setGroupModalOpen(false)}
                  className="rounded-lg p-1 text-[#8F98A0] hover:bg-[#1A222D] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#8F98A0]">
                    Nome do Grupo
                  </label>
                  <input
                    type="text"
                    required
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Ex.: Maratona Cálculo I"
                    className="w-full rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#8F98A0]">
                    Objetivo / Descrição
                  </label>
                  <textarea
                    rows={2}
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="Provas, listas ou projetos compartilhados..."
                    className="w-full rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#8F98A0]">
                    Cor de Identificação
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={groupColor}
                      onChange={(e) => setGroupColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded border border-white/10 bg-transparent"
                    />
                    <span className="font-mono text-xs text-[#8F98A0]">
                      {groupColor}
                    </span>
                  </div>
                </div>
              </div>

              {groupError && (
                <p className="mt-3 text-xs text-[#E04F33]">{groupError}</p>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGroupModalOpen(false)}
                  className="rounded-xl border border-white/10 bg-[#1A222D] px-4 py-2 text-xs font-medium text-[#8F98A0] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={groupSubmitting}
                  className="rounded-xl bg-[#1A9FFF] px-4 py-2 text-xs font-semibold text-[#0B0F14] hover:bg-[#66C0F4] disabled:opacity-50"
                >
                  {groupSubmitting ? "Criando..." : "Criar Grupo"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Nova Tarefa */}
      <AnimatePresence>
        {taskModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <motion.form
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              onSubmit={handleCreateTask}
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#121820] p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-[#F3F4F6]">
                  Nova Tarefa
                </h3>
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  className="rounded-lg p-1 text-[#8F98A0] hover:bg-[#1A222D] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#8F98A0]">
                    Título
                  </label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Ex.: Resolver exercícios de Grafos"
                    className="w-full rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#8F98A0]">
                      Prioridade
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) =>
                        setTaskPriority(
                          e.target.value as ConsoleCoopTaskItem["priority"]
                        )
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
                    >
                      <option value="LOW">Baixa</option>
                      <option value="MEDIUM">Média</option>
                      <option value="HIGH">Alta</option>
                      <option value="URGENT">Urgente</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#8F98A0]">
                      Grupo (opcional)
                    </label>
                    <select
                      value={taskGroupId}
                      onChange={(e) => setTaskGroupId(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
                    >
                      <option value="">Individual / Geral</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {formatTitle(g.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#8F98A0]">
                    Descrição
                  </label>
                  <textarea
                    rows={2}
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Notas, links ou divisão de tarefas..."
                    className="w-full rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
                  />
                </div>

                {friends.length > 0 && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#8F98A0]">
                      Atribuir Amigos
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {friends.map((friend) => {
                        const selected = selectedFriendIds.includes(friend.id);
                        return (
                          <button
                            key={friend.id}
                            type="button"
                            onClick={() => toggleFriendSelection(friend.id)}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                              selected
                                ? "border-[#66C0F4] bg-[#1A9FFF]/20 text-[#66C0F4]"
                                : "border-white/10 bg-[#0B0F14] text-[#8F98A0] hover:text-white"
                            }`}
                          >
                            {friend.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {taskError && (
                <p className="mt-3 text-xs text-[#E04F33]">{taskError}</p>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  className="rounded-xl border border-white/10 bg-[#1A222D] px-4 py-2 text-xs font-medium text-[#8F98A0] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={taskSubmitting}
                  className="rounded-xl bg-[#1A9FFF] px-4 py-2 text-xs font-semibold text-[#0B0F14] hover:bg-[#66C0F4] disabled:opacity-50"
                >
                  {taskSubmitting ? "Criando..." : "Criar Tarefa"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Steam Social Overlay */}
      <SteamSocialOverlay
        open={socialOpen}
        onClose={() => setSocialOpen(false)}
        currentPresence={currentUser?.presence ?? "ONLINE"}
        friends={friends}
        pendingRequests={pendingRequests}
        groups={groups}
        tasks={coopTasks}
      />
    </ConsoleHudShell>
  );
}