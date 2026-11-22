"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Circle,
  FolderKanban,
  Layers,
  Plus,
  Sparkles,
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

const PRIORITY_BADGES: Record<
  ConsoleCoopTaskItem["priority"],
  { label: string; className: string }
> = {
  LOW: {
    label: "Baixa",
    className: "border-white/15 bg-white/5 text-[#8F98A0]",
  },
  MEDIUM: {
    label: "Média",
    className: "border-[#66C0F4]/30 bg-[#66C0F4]/10 text-[#66C0F4]",
  },
  HIGH: {
    label: "Alta",
    className: "border-[#E5A93C]/35 bg-[#E5A93C]/15 text-[#E5A93C]",
  },
  URGENT: {
    label: "Urgente",
    className: "border-[#D94126]/45 bg-[#D94126]/15 text-[#F3F4F6]",
  },
};

export function ConsoleLibraryDashboard({
  currentUser,
  subjects,
  groups,
  coopTasks,
  friends,
  pendingRequests,
}: ConsoleLibraryDashboardProps) {
  const [focusedColor, setFocusedColor] = useState<string>(
    subjects[0]?.accentColor || groups[0]?.bannerColor || "#1A9FFF"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [socialOpen, setSocialOpen] = useState<boolean>(false);

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
      ambientColor={focusedColor}
      pendingRequestsCount={pendingRequests.length}
      socialOverlayOpen={socialOpen}
      onToggleSocialOverlay={() => setSocialOpen((prev) => !prev)}
      onQuickCreateTask={() => setTaskModalOpen(true)}
      onQuickCreateGroup={() => setGroupModalOpen(true)}
      globalSearchQuery={searchQuery}
      onGlobalSearchChange={setSearchQuery}
    >
      <div className="space-y-10">
        {/* Cabeçalho de Console + Ações Rápidas */}
        <section className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-[#171D25]/85 p-6 backdrop-blur-xl lg:flex-row lg:items-center">
          <div>
            <div className="mb-1.5 inline-flex items-center gap-2 rounded-full border border-[#66C0F4]/30 bg-[#66C0F4]/10 px-3 py-0.5 font-mono text-[11px] uppercase tracking-wider text-[#66C0F4]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Biblioteca & Co-op Lobbies</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#F3F4F6] sm:text-3xl">
              {currentUser
                ? `Bem-vindo de volta, ${currentUser.name}`
                : "Trilhas de Estudo & Lobbies Colaborativos"}
            </h1>
            <p className="mt-1 text-sm text-[#8F98A0]">
              Clique em qualquer disciplina ou tarefa para abrir diretamente, ou use
              as setas do teclado para alternar o foco visual.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setTaskModalOpen(true)}
              data-console-focusable="true"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1A9FFF] px-4 py-2.5 text-sm font-semibold text-[#0E141B] shadow-[0_0_24px_rgba(26,159,255,0.28)] outline-none transition hover:bg-[#66C0F4] focus-visible:ring-2 focus-visible:ring-[#66C0F4]"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Tarefa Co-op</span>
            </button>

            <button
              type="button"
              onClick={() => setGroupModalOpen(true)}
              data-console-focusable="true"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#1E2631] px-4 py-2.5 text-sm font-semibold text-[#F3F4F6] outline-none transition hover:border-[#66C0F4]/50 hover:bg-[#26303E] focus-visible:ring-2 focus-visible:ring-[#66C0F4]"
            >
              <Users className="h-4 w-4 text-[#66C0F4]" />
              <span>Novo Grupo</span>
            </button>
          </div>
        </section>

        {/* Seção 1: Grade/Carrossel de Disciplinas */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BookOpen className="h-5 w-5 text-[#66C0F4]" />
              <h2 className="text-lg font-bold tracking-tight text-[#F3F4F6]">
                Disciplinas na Biblioteca
              </h2>
              <span className="rounded-md bg-[#1E2631] px-2 py-0.5 font-mono text-xs text-[#8F98A0]">
                {filteredSubjects.length}
              </span>
            </div>
            <Link
              href="/workspace"
              data-console-focusable="true"
              className="inline-flex items-center gap-1 font-mono text-xs text-[#66C0F4] hover:underline"
            >
              <span>Abrir Workspace</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {filteredSubjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-[#171D25]/60 p-8 text-center text-sm text-[#8F98A0]">
              Nenhuma disciplina encontrada com o filtro atual.
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-3 pt-1">
              {filteredSubjects.map((subject) => {
                const progress =
                  subject.totalTasks > 0
                    ? Math.round(
                        (subject.completedTasks / subject.totalTasks) * 100
                      )
                    : 0;

                return (
                  <Link
                    key={subject.id}
                    href={subject.href}
                    data-console-focusable="true"
                    onMouseEnter={() => setFocusedColor(subject.accentColor)}
                    onFocus={() => setFocusedColor(subject.accentColor)}
                    className="group relative flex min-w-[280px] max-w-[320px] shrink-0 flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#171D25] p-5 outline-none transition duration-200 hover:-translate-y-0.5 hover:scale-[1.03] hover:border-[#66C0F4] hover:shadow-[0_0_30px_rgba(102,192,244,0.25)] focus-visible:scale-[1.03] focus-visible:border-[#66C0F4] focus-visible:ring-2 focus-visible:ring-[#66C0F4] focus-visible:shadow-[0_0_30px_rgba(102,192,244,0.25)] sm:w-[300px]"
                  >
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-30 transition-opacity group-hover:opacity-55"
                      style={{
                        background: `linear-gradient(180deg, ${subject.accentColor} 0%, transparent 100%)`,
                      }}
                    />

                    <div className="relative space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-md border border-white/10 bg-[#0E141B]/80 px-2 py-0.5 font-mono text-[11px] text-[#66C0F4]">
                          {subject.code || "TRILHA"}
                        </span>
                        <span className="font-mono text-xs text-[#8F98A0]">
                          {subject.completedTasks}/{subject.totalTasks} tarefas
                        </span>
                      </div>

                      <h3 className="line-clamp-2 text-base font-bold text-[#F3F4F6] group-hover:text-white">
                        {subject.name}
                      </h3>

                      {subject.groupName && (
                        <p className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#A4D007]">
                          <Users className="h-3 w-3" />
                          <span>{subject.groupName}</span>
                        </p>
                      )}
                    </div>

                    <div className="relative mt-5 space-y-1.5">
                      <div className="flex items-center justify-between font-mono text-[11px] text-[#8F98A0]">
                        <span>Progresso</span>
                        <span className="text-[#F3F4F6]">{progress}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0E141B]">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: subject.accentColor || "#66C0F4",
                          }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Seção 2: Grupos de Estudo (Co-op Lobbies) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Layers className="h-5 w-5 text-[#A4D007]" />
              <h2 className="text-lg font-bold tracking-tight text-[#F3F4F6]">
                Grupos de Estudo (Co-op Lobbies)
              </h2>
              <span className="rounded-md bg-[#1E2631] px-2 py-0.5 font-mono text-xs text-[#8F98A0]">
                {filteredGroups.length}
              </span>
            </div>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-[#171D25]/60 p-8 text-center text-sm text-[#8F98A0]">
              Crie um lobby colaborativo para estudar com amigos e compartilhar
              disciplinas e tarefas.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredGroups.map((group) => (
                <Link
                  key={group.id}
                  href={group.href}
                  data-console-focusable="true"
                  onMouseEnter={() => setFocusedColor(group.bannerColor)}
                  onFocus={() => setFocusedColor(group.bannerColor)}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#171D25] p-5 outline-none transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-[#66C0F4] hover:shadow-[0_0_30px_rgba(102,192,244,0.22)] focus-visible:scale-[1.02] focus-visible:border-[#66C0F4] focus-visible:ring-2 focus-visible:ring-[#66C0F4]"
                >
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-20 opacity-25"
                    style={{
                      background: `linear-gradient(180deg, ${group.bannerColor} 0%, transparent 100%)`,
                    }}
                  />

                  <div className="relative space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded bg-[#0E141B]/85 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#66C0F4]">
                        {group.inviteCode}
                      </span>
                      <span className="font-mono text-xs text-[#8F98A0]">
                        {group.memberCount} membros • {group.taskCount} tarefas
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#F3F4F6]">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="line-clamp-2 text-xs text-[#8F98A0]">
                        {group.description}
                      </p>
                    )}
                  </div>

                  <div className="relative mt-5 flex items-center justify-between border-t border-white/10 pt-3">
                    <div className="flex -space-x-2">
                      {group.members.slice(0, 5).map((member) => {
                        const avatar = member.avatarUrl || member.image;
                        return avatar ? (
                          <img
                            key={member.id}
                            src={avatar}
                            alt={member.name}
                            title={member.name}
                            className="h-7 w-7 rounded-lg object-cover ring-2 ring-[#171D25]"
                          />
                        ) : (
                          <div
                            key={member.id}
                            title={member.name}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#26303E] font-mono text-[11px] font-bold text-[#66C0F4] ring-2 ring-[#171D25]"
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        );
                      })}
                    </div>

                    <span className="inline-flex items-center gap-1 font-mono text-xs text-[#66C0F4] group-hover:translate-x-0.5 transition-transform">
                      <span>Entrar no Lobby</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Seção 3: Fila de Tarefas Compartilhadas / Co-op (com navegação funcional) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FolderKanban className="h-5 w-5 text-[#66C0F4]" />
              <h2 className="text-lg font-bold tracking-tight text-[#F3F4F6]">
                Fila de Tarefas & Trabalhos Co-op
              </h2>
              <span className="rounded-md bg-[#1E2631] px-2 py-0.5 font-mono text-xs text-[#8F98A0]">
                {filteredTasks.length}
              </span>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-[#171D25]/60 p-8 text-center text-sm text-[#8F98A0]">
              Nenhuma tarefa disponível no momento. Clique em{" "}
              <span className="text-[#66C0F4]">Nova Tarefa Co-op</span> para
              criar e atribuir amigos.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const priorityStyle = PRIORITY_BADGES[task.priority];
                const doneCount = task.assignees.filter(
                  (a) => a.completedIndividual
                ).length;

                return (
                  <div
                    key={task.id}
                    data-console-focusable="true"
                    tabIndex={0}
                    className="group flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-[#171D25]/90 p-4 outline-none transition hover:border-[#66C0F4]/60 hover:bg-[#1E2631]/90 focus-visible:border-[#66C0F4] focus-visible:ring-2 focus-visible:ring-[#66C0F4] md:flex-row md:items-center"
                  >
                    <div className="flex items-start gap-3.5">
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
                          title={
                            task.completedByCurrentUser
                              ? "Marcar como pendente para mim"
                              : "Concluir minha parte (+25 XP)"
                          }
                          className="mt-0.5 rounded-lg p-1 text-[#66C0F4] transition hover:bg-white/5 disabled:opacity-50"
                        >
                          {task.completedByCurrentUser ? (
                            <CheckCircle2 className="h-5 w-5 text-[#A4D007]" />
                          ) : (
                            <Circle className="h-5 w-5 text-[#8F98A0] group-hover:text-[#66C0F4]" />
                          )}
                        </button>
                      )}

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={task.href}
                            className="text-base font-semibold text-[#F3F4F6] transition hover:text-[#66C0F4] hover:underline"
                          >
                            {task.title}
                          </Link>
                          <span
                            className={`rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${priorityStyle.className}`}
                          >
                            {priorityStyle.label}
                          </span>
                          {task.groupName && (
                            <span className="rounded bg-[#0E141B] px-2 py-0.5 font-mono text-[11px] text-[#A4D007]">
                              {task.groupName}
                            </span>
                          )}
                          {task.subjectName && (
                            <span className="rounded bg-[#0E141B] px-2 py-0.5 font-mono text-[11px] text-[#8F98A0]">
                              {task.subjectName}
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="line-clamp-1 text-xs text-[#8F98A0]">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 md:justify-end">
                      {task.assignees.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1.5">
                            {task.assignees.map((assignee) => {
                              const avatar =
                                assignee.avatarUrl || assignee.image;
                              return (
                                <span
                                  key={assignee.userId}
                                  title={`${assignee.name} — ${
                                    assignee.completedIndividual
                                      ? "Concluído"
                                      : "Pendente"
                                  }`}
                                  className={`relative inline-flex h-7 w-7 items-center justify-center rounded-lg font-mono text-[11px] font-bold ring-2 ${
                                    assignee.completedIndividual
                                      ? "ring-[#A4D007]"
                                      : "ring-[#171D25]"
                                  }`}
                                >
                                  {avatar ? (
                                    <img
                                      src={avatar}
                                      alt={assignee.name}
                                      className="h-7 w-7 rounded-lg object-cover"
                                    />
                                  ) : (
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#26303E] text-[#66C0F4]">
                                      {assignee.name.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                          <span className="font-mono text-xs text-[#8F98A0]">
                            {doneCount}/{task.assignees.length}
                          </span>
                        </div>
                      )}

                      <Link
                        href={task.href}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#1E2631] px-3 py-1.5 font-mono text-xs text-[#66C0F4] transition hover:border-[#66C0F4] hover:bg-[#26303E]"
                      >
                        <span>Abrir</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modal: Criar Novo Grupo */}
      <AnimatePresence>
        {groupModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <motion.form
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onSubmit={handleCreateGroup}
              className="w-full max-w-md rounded-2xl border border-white/15 bg-[#171D25] p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#F3F4F6]">
                  Novo Grupo de Estudo
                </h3>
                <button
                  type="button"
                  onClick={() => setGroupModalOpen(false)}
                  className="rounded-lg p-1 text-[#8F98A0] hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-[#8F98A0]">
                    Nome do Lobby
                  </label>
                  <input
                    type="text"
                    required
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Ex: Maratona Cálculo & Algoritmos"
                    className="w-full rounded-lg border border-white/10 bg-[#0E141B] px-3.5 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-[#8F98A0]">
                    Descrição
                  </label>
                  <textarea
                    rows={2}
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="Objetivo do grupo, provas ou projetos em conjunto..."
                    className="w-full rounded-lg border border-white/10 bg-[#0E141B] px-3.5 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-[#8F98A0]">
                    Cor do Ambiente (Ambient HUD)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={groupColor}
                      onChange={(e) => setGroupColor(e.target.value)}
                      className="h-9 w-14 cursor-pointer rounded border border-white/15 bg-transparent"
                    />
                    <span className="font-mono text-xs text-[#8F98A0]">
                      {groupColor}
                    </span>
                  </div>
                </div>
              </div>

              {groupError && (
                <p className="mt-3 text-xs text-[#D94126]">{groupError}</p>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGroupModalOpen(false)}
                  className="rounded-xl border border-white/10 bg-[#1E2631] px-4 py-2 text-xs font-semibold text-[#8F98A0] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={groupSubmitting}
                  className="rounded-xl bg-[#1A9FFF] px-4 py-2 text-xs font-semibold text-[#0E141B] hover:bg-[#66C0F4] disabled:opacity-50"
                >
                  {groupSubmitting ? "Criando..." : "Criar Lobby"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Nova Tarefa / Trabalho Co-op */}
      <AnimatePresence>
        {taskModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <motion.form
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onSubmit={handleCreateTask}
              className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#171D25] p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#F3F4F6]">
                  Nova Tarefa / Trabalho Compartilhado
                </h3>
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  className="rounded-lg p-1 text-[#8F98A0] hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-[#8F98A0]">
                    Título da Tarefa
                  </label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Ex: Lista de Exercícios de Grafos"
                    className="w-full rounded-lg border border-white/10 bg-[#0E141B] px-3.5 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-[#8F98A0]">
                      Prioridade
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) =>
                        setTaskPriority(
                          e.target.value as ConsoleCoopTaskItem["priority"]
                        )
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#0E141B] px-3 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
                    >
                      <option value="LOW">Baixa</option>
                      <option value="MEDIUM">Média</option>
                      <option value="HIGH">Alta</option>
                      <option value="URGENT">Urgente</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-[#8F98A0]">
                      Grupo de Estudo (opcional)
                    </label>
                    <select
                      value={taskGroupId}
                      onChange={(e) => setTaskGroupId(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#0E141B] px-3 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
                    >
                      <option value="">Tarefa Individual / Geral</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-[#8F98A0]">
                    Descrição
                  </label>
                  <textarea
                    rows={2}
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Detalhes da entrega, divisão de partes ou links de referência..."
                    className="w-full rounded-lg border border-white/10 bg-[#0E141B] px-3.5 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
                  />
                </div>

                {friends.length > 0 && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase text-[#8F98A0]">
                      Atribuir Amigos (Co-op)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {friends.map((friend) => {
                        const selected = selectedFriendIds.includes(friend.id);
                        return (
                          <button
                            key={friend.id}
                            type="button"
                            onClick={() => toggleFriendSelection(friend.id)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                              selected
                                ? "border-[#66C0F4] bg-[#1A9FFF]/20 text-[#66C0F4]"
                                : "border-white/10 bg-[#0E141B] text-[#8F98A0] hover:text-white"
                            }`}
                          >
                            {friend.name}
                            {friend.username ? ` (@${friend.username})` : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {taskError && (
                <p className="mt-3 text-xs text-[#D94126]">{taskError}</p>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  className="rounded-xl border border-white/10 bg-[#1E2631] px-4 py-2 text-xs font-semibold text-[#8F98A0] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={taskSubmitting}
                  className="rounded-xl bg-[#1A9FFF] px-4 py-2 text-xs font-semibold text-[#0E141B] hover:bg-[#66C0F4] disabled:opacity-50"
                >
                  {taskSubmitting ? "Salvando..." : "Criar Tarefa"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Steam Social Overlay (Etapa 5 já conectada) */}
      <SteamSocialOverlay
        open={socialOpen}
        onClose={() => setSocialOpen(false)}
        friends={friends}
        pendingRequests={pendingRequests}
        groups={groups}
        tasks={coopTasks}
      />
    </ConsoleHudShell>
  );
}