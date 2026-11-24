"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  Circle,
  Copy,
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
    className: "text-[#9D8EC4] border-[#CBB6FF]/15 bg-[#070512]",
  },
  MEDIUM: {
    label: "Média",
    className: "text-[#CBB6FF] border-[#7E49C7]/50 bg-[#3B1C6E]/60",
  },
  HIGH: {
    label: "Alta",
    className: "text-[#F4F1FA] border-[#7E49C7] bg-[#7E49C7]/35",
  },
  URGENT: {
    label: "Urgente",
    className: "text-[#F4F1FA] border-[#E04F33]/60 bg-[#E04F33]/20",
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
  const [groupColor, setGroupColor] = useState<string>("#7E49C7");
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

  return (
    <ConsoleHudShell
      user={currentUser}
      pendingRequestsCount={pendingRequests.length}
      onlineFriendsCount={onlineFriendsCount}
      socialOverlayOpen={socialOpen}
      onToggleSocialOverlay={() => setSocialOpen((prev) => !prev)}
      onQuickCreateTask={() => setTaskModalOpen(true)}
      onQuickCreateGroup={() => setGroupModalOpen(true)}
      globalSearchQuery={searchQuery}
      onGlobalSearchChange={setSearchQuery}
    >
      <div className="space-y-8">
        {/* 1. Painel Editorial Assimétrico (Sem Hero Centralizado Genérico) */}
        <section className="grid grid-cols-1 border border-[#CBB6FF]/15 bg-[#1B0B3A] lg:grid-cols-12">
          <div className="flex flex-col justify-between p-6 lg:col-span-8 lg:border-r lg:border-[#CBB6FF]/15">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wider">
                <span className="border border-[#7E49C7] bg-[#3B1C6E] px-2 py-0.5 text-[#CBB6FF]">
                  {spotlight
                    ? spotlight.kind === "GROUP"
                      ? `Lobby · ${spotlight.tag}`
                      : `Em Foco · ${spotlight.tag}`
                    : "Biblioteca"}
                </span>
                {spotlight && spotlight.totalTasks > 0 && (
                  <span className="tabular-nums text-[#9D8EC4]">
                    {spotlight.completedTasks}/{spotlight.totalTasks} entregas
                    concluídas
                  </span>
                )}
              </div>

              <h1 className="font-serif text-3xl tracking-tight text-[#F4F1FA] sm:text-4xl">
                {spotlight
                  ? spotlight.title
                  : "Caderno de Disciplinas e Lobbies"}
              </h1>

              <p className="max-w-2xl text-sm text-[#9D8EC4]">
                {spotlight
                  ? spotlight.subtitle
                  : "Selecione uma disciplina abaixo ou abra uma nova tarefa na fila."}
              </p>
            </div>

            {spotlight?.nextTaskTitle && (
              <div className="mt-5 flex items-center gap-2.5 border-t border-[#CBB6FF]/10 pt-3.5 text-xs">
                <span className="font-mono text-[11px] uppercase text-[#CBB6FF]">
                  Próxima entrega:
                </span>
                <span className="truncate font-medium text-[#F4F1FA]">
                  {spotlight.nextTaskTitle}
                </span>
              </div>
            )}
          </div>

          {/* Coluna Direita: Progresso e Comandos Diretos */}
          <div className="flex flex-col justify-between bg-[#070512]/55 p-6 lg:col-span-4">
            <div className="space-y-3">
              {spotlight && spotlight.kind === "SUBJECT" ? (
                <div>
                  <div className="mb-1.5 flex justify-between font-mono text-xs tabular-nums">
                    <span className="text-[#9D8EC4]">Conclusão da trilha</span>
                    <span className="font-semibold text-[#CBB6FF]">
                      {spotlight.progress}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#070512]">
                    <div
                      className="h-full bg-[#7E49C7] transition-all duration-150"
                      style={{ width: `${spotlight.progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="font-mono text-xs text-[#9D8EC4]">
                  {spotlight?.members.length
                    ? `${spotlight.members.length} integrante(s) ativos no grupo`
                    : `${subjects.length} disciplinas · ${groups.length} grupos`}
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              {spotlight && (
                <Link
                  href={spotlight.href}
                  data-console-focusable="true"
                  className="flex items-center justify-between rounded-[2px] bg-[#7E49C7] px-4 py-2 text-xs font-semibold text-[#F4F1FA] outline-none transition-colors duration-150 hover:bg-[#9361D9] focus-visible:ring-1 focus-visible:ring-[#CBB6FF]"
                >
                  <span>
                    {spotlight.kind === "GROUP"
                      ? "Abrir Grupo"
                      : "Abrir Disciplina"}
                  </span>
                  <span className="font-mono">→</span>
                </Link>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(true)}
                  data-console-focusable="true"
                  className="rounded-[2px] border border-[#CBB6FF]/20 bg-[#1B0B3A] px-3 py-2 text-xs font-medium text-[#F4F1FA] outline-none transition-colors duration-150 hover:border-[#7E49C7] hover:bg-[#3B1C6E] focus-visible:ring-1 focus-visible:ring-[#CBB6FF]"
                >
                  + Tarefa
                </button>

                <button
                  type="button"
                  onClick={() => setGroupModalOpen(true)}
                  data-console-focusable="true"
                  className="rounded-[2px] border border-[#CBB6FF]/20 bg-[#1B0B3A] px-3 py-2 text-xs font-medium text-[#F4F1FA] outline-none transition-colors duration-150 hover:border-[#7E49C7] hover:bg-[#3B1C6E] focus-visible:ring-1 focus-visible:ring-[#CBB6FF]"
                >
                  + Grupo
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Estante de Disciplinas (Cápsulas Sólidas Violeta Galáxia) */}
        <section className="space-y-3.5">
          <div className="flex items-baseline justify-between border-b border-[#CBB6FF]/15 pb-2">
            <div className="flex items-baseline gap-2.5">
              <h2 className="font-serif text-2xl text-[#F4F1FA]">
                Disciplinas
              </h2>
              <span className="font-mono text-xs tabular-nums text-[#CBB6FF]">
                [{filteredSubjects.length}]
              </span>
            </div>
            <Link
              href="/workspace"
              data-console-focusable="true"
              className="font-mono text-xs text-[#CBB6FF] hover:underline"
            >
              Workspace →
            </Link>
          </div>

          {filteredSubjects.length === 0 ? (
            <div className="rounded-[2px] border border-dashed border-[#CBB6FF]/20 bg-[#1B0B3A]/40 p-8 text-center text-sm text-[#9D8EC4]">
              Nenhuma disciplina encontrada.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                    className={`group relative flex aspect-[16/10] flex-col justify-between overflow-hidden rounded-[2px] border bg-[#1B0B3A] outline-none transition-colors duration-150 focus-visible:ring-1 focus-visible:ring-[#CBB6FF] ${
                      isSelected
                        ? "border-[#7E49C7] bg-[#3B1C6E]/70"
                        : "border-[#CBB6FF]/15 hover:border-[#7E49C7] hover:bg-[#3B1C6E]/45"
                    }`}
                  >
                    {/* Faixa Superior de Identificação */}
                    <div
                      className="h-1 w-full"
                      style={{
                        backgroundColor: isSelected ? "#CBB6FF" : "#7E49C7",
                      }}
                    />

                    {/* Monograma Estrutural */}
                    <span className="pointer-events-none absolute -bottom-2 right-3 select-none font-serif text-6xl text-[#CBB6FF]/[0.08]">
                      {monogram}
                    </span>

                    <div className="relative flex items-center justify-between px-3.5 pt-2.5">
                      <span className="rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#CBB6FF]">
                        {subject.code || "TRILHA"}
                      </span>
                      {subject.groupName && (
                        <span className="max-w-[140px] truncate rounded-[2px] bg-[#3B1C6E] px-2 py-0.5 font-mono text-[10px] text-[#F4F1FA]">
                          {formatTitle(subject.groupName)}
                        </span>
                      )}
                    </div>

                    <div className="relative space-y-2 px-3.5 pb-3">
                      <h3 className="line-clamp-2 text-base font-semibold leading-snug text-[#F4F1FA]">
                        {displayName}
                      </h3>
                      <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-[#9D8EC4]">
                        <span>
                          {subject.completedTasks}/{subject.totalTasks}{" "}
                          concluídas
                        </span>
                        <span className="text-[#CBB6FF]">{progress}%</span>
                      </div>
                    </div>

                    <div className="relative h-1 w-full bg-[#070512]">
                      <div
                        className="h-full bg-[#7E49C7] transition-all duration-150"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* 3. Grupos de Estudo + Fila de Entregas (Layout Assimétrico 5 / 7) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Coluna Esquerda: Grupos de Estudo */}
          <section className="space-y-3.5 lg:col-span-5">
            <div className="flex items-baseline justify-between border-b border-[#CBB6FF]/15 pb-2">
              <div className="flex items-baseline gap-2">
                <h2 className="font-serif text-2xl text-[#F4F1FA]">
                  Grupos de Estudo
                </h2>
                <span className="font-mono text-xs tabular-nums text-[#CBB6FF]">
                  [{filteredGroups.length}]
                </span>
              </div>
            </div>

            {filteredGroups.length === 0 ? (
              <div className="rounded-[2px] border border-dashed border-[#CBB6FF]/20 bg-[#1B0B3A]/40 p-6 text-xs text-[#9D8EC4]">
                Nenhum grupo ativo. Clique em <strong>+ Grupo</strong> para
                abrir um lobby colaborativo.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredGroups.map((group) => {
                  const displayName = formatTitle(group.name);
                  return (
                    <Link
                      key={group.id}
                      href={group.href}
                      data-console-focusable="true"
                      onMouseEnter={() => focusGroup(group)}
                      onFocus={() => focusGroup(group)}
                      className="flex flex-col justify-between rounded-[2px] border border-[#CBB6FF]/15 border-l-4 border-l-[#7E49C7] bg-[#1B0B3A] p-3.5 outline-none transition-colors duration-150 hover:border-[#7E49C7] hover:bg-[#3B1C6E]/45 focus-visible:ring-1 focus-visible:ring-[#CBB6FF]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate text-sm font-semibold text-[#F4F1FA]">
                          {displayName}
                        </h3>
                        <button
                          type="button"
                          onClick={(e) =>
                            handleCopyInviteCode(e, group.inviteCode)
                          }
                          title="Copiar código de convite"
                          className="inline-flex shrink-0 items-center gap-1 rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-2 py-0.5 font-mono text-[11px] tabular-nums text-[#CBB6FF] hover:border-[#7E49C7]"
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
                        <p className="mt-1 line-clamp-1 text-xs text-[#9D8EC4]">
                          {group.description}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between border-t border-[#CBB6FF]/10 pt-2.5 font-mono text-[11px] tabular-nums text-[#9D8EC4]">
                        <span>{group.memberCount} membros</span>
                        <span className="text-[#CBB6FF]">
                          {group.taskCount} tarefas
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Coluna Direita: Fila de Próximas Entregas */}
          <section className="space-y-3.5 lg:col-span-7">
            <div className="flex items-baseline justify-between border-b border-[#CBB6FF]/15 pb-2">
              <div className="flex items-baseline gap-2">
                <h2 className="font-serif text-2xl text-[#F4F1FA]">
                  Próximas Entregas
                </h2>
                <span className="font-mono text-xs tabular-nums text-[#CBB6FF]">
                  [{filteredTasks.length}]
                </span>
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="rounded-[2px] border border-dashed border-[#CBB6FF]/20 bg-[#1B0B3A]/40 p-6 text-xs text-[#9D8EC4]">
                Nenhuma tarefa pendente na fila.
              </div>
            ) : (
              <div className="divide-y divide-[#CBB6FF]/10 rounded-[2px] border border-[#CBB6FF]/15 bg-[#1B0B3A]">
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
                      className="flex flex-col justify-between gap-2.5 px-4 py-3 outline-none transition-colors duration-150 hover:bg-[#3B1C6E]/45 focus-visible:bg-[#3B1C6E]/60 sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 items-center gap-3">
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
                            aria-label="Alternar conclusão"
                            className="shrink-0 text-[#9D8EC4] transition-colors duration-150 hover:text-[#CBB6FF] disabled:opacity-50"
                          >
                            {task.completedByCurrentUser ? (
                              <CheckCircle2 className="h-4 w-4 text-[#CBB6FF]" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </button>
                        )}

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={task.href}
                              className={`truncate text-sm font-medium transition-colors duration-150 hover:text-[#CBB6FF] ${
                                task.completedByCurrentUser
                                  ? "line-through text-[#9D8EC4]"
                                  : "text-[#F4F1FA]"
                              }`}
                            >
                              {task.title}
                            </Link>
                            <span
                              className={`rounded-[2px] border px-1.5 py-0.2 font-mono text-[10px] ${priorityMeta.className}`}
                            >
                              {priorityMeta.label}
                            </span>
                          </div>
                          {(task.subjectName || task.groupName) && (
                            <div className="mt-0.5 font-mono text-[11px] text-[#9D8EC4]">
                              {task.subjectName && formatTitle(task.subjectName)}
                              {task.subjectName && task.groupName && " · "}
                              {task.groupName && (
                                <span className="text-[#CBB6FF]">
                                  {formatTitle(task.groupName)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center justify-end gap-3">
                        {task.assignees.length > 0 && (
                          <span className="font-mono text-[11px] tabular-nums text-[#9D8EC4]">
                            {doneCount}/{task.assignees.length}
                          </span>
                        )}
                        <Link
                          href={task.href}
                          className="font-mono text-xs text-[#CBB6FF] hover:underline"
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
      </div>

      {/* Modal: Novo Grupo */}
      {groupModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#070512]/85 p-4">
          <form
            onSubmit={handleCreateGroup}
            className="w-full max-w-md rounded-[2px] border border-[#CBB6FF]/25 bg-[#1B0B3A] p-6"
          >
            <div className="mb-4 flex items-center justify-between border-b border-[#CBB6FF]/15 pb-3">
              <h3 className="font-serif text-xl text-[#F4F1FA]">
                Novo Grupo de Estudo
              </h3>
              <button
                type="button"
                onClick={() => setGroupModalOpen(false)}
                className="text-[#9D8EC4] hover:text-[#F4F1FA]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase text-[#9D8EC4]">
                  Nome do Grupo
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ex.: Algoritmos e Estruturas de Dados"
                  className="w-full rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase text-[#9D8EC4]">
                  Escopo / Descrição
                </label>
                <textarea
                  rows={2}
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Listas, seminários ou preparação para avaliações..."
                  className="w-full rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase text-[#9D8EC4]">
                  Marcador Cromático
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={groupColor}
                    onChange={(e) => setGroupColor(e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded-[2px] border border-[#CBB6FF]/20 bg-transparent"
                  />
                  <span className="font-mono text-xs text-[#9D8EC4]">
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
                className="rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-4 py-2 text-xs font-medium text-[#9D8EC4] hover:text-[#F4F1FA]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={groupSubmitting}
                className="rounded-[2px] bg-[#7E49C7] px-4 py-2 text-xs font-semibold text-[#F4F1FA] hover:bg-[#9361D9] disabled:opacity-50"
              >
                {groupSubmitting ? "Criando..." : "Criar Grupo"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Nova Tarefa */}
      {taskModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#070512]/85 p-4">
          <form
            onSubmit={handleCreateTask}
            className="w-full max-w-lg rounded-[2px] border border-[#CBB6FF]/25 bg-[#1B0B3A] p-6"
          >
            <div className="mb-4 flex items-center justify-between border-b border-[#CBB6FF]/15 pb-3">
              <h3 className="font-serif text-xl text-[#F4F1FA]">Nova Tarefa</h3>
              <button
                type="button"
                onClick={() => setTaskModalOpen(false)}
                className="text-[#9D8EC4] hover:text-[#F4F1FA]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase text-[#9D8EC4]">
                  Título
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Ex.: Implementar árvore AVL em C"
                  className="w-full rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-mono text-[11px] uppercase text-[#9D8EC4]">
                    Prioridade
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) =>
                      setTaskPriority(
                        e.target.value as ConsoleCoopTaskItem["priority"]
                      )
                    }
                    className="w-full rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
                  >
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-mono text-[11px] uppercase text-[#9D8EC4]">
                    Grupo (opcional)
                  </label>
                  <select
                    value={taskGroupId}
                    onChange={(e) => setTaskGroupId(e.target.value)}
                    className="w-full rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
                  >
                    <option value="">Individual</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {formatTitle(g.name)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase text-[#9D8EC4]">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Requisitos, bibliografia ou divisão de entrega..."
                  className="w-full rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
                />
              </div>

              {friends.length > 0 && (
                <div>
                  <label className="mb-1.5 block font-mono text-[11px] uppercase text-[#9D8EC4]">
                    Atribuir Integrantes
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {friends.map((friend) => {
                      const selected = selectedFriendIds.includes(friend.id);
                      return (
                        <button
                          key={friend.id}
                          type="button"
                          onClick={() => toggleFriendSelection(friend.id)}
                          className={`rounded-[2px] border px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${
                            selected
                              ? "border-[#7E49C7] bg-[#3B1C6E] text-[#F4F1FA]"
                              : "border-[#CBB6FF]/15 bg-[#070512] text-[#9D8EC4] hover:text-[#F4F1FA]"
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
                className="rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-4 py-2 text-xs font-medium text-[#9D8EC4] hover:text-[#F4F1FA]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={taskSubmitting}
                className="rounded-[2px] bg-[#7E49C7] px-4 py-2 text-xs font-semibold text-[#F4F1FA] hover:bg-[#9361D9] disabled:opacity-50"
              >
                {taskSubmitting ? "Criando..." : "Criar Tarefa"}
              </button>
            </div>
          </form>
        </div>
      )}

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