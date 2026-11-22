"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Plus,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  createCoopTaskAction,
  createSubjectAction,
  toggleCoopTaskCompletionAction,
  updateTaskStatusAction,
} from "@/app/actions/coop.actions";
import {
  ConsoleHudShell,
  type ConsoleUserProfile,
} from "@/components/console/console-hud-shell";
import type { ConsoleCoopTaskItem } from "@/components/console/console-library-dashboard";

export interface WorkspaceSubjectItem {
  id: string;
  name: string;
  code: string | null;
  accentColor: string;
  taskCount: number;
}

interface ConsoleWorkspaceViewProps {
  currentUser: ConsoleUserProfile | null;
  subjects: WorkspaceSubjectItem[];
  tasks: ConsoleCoopTaskItem[];
}

type StatusFilter = "ALL" | "TODO" | "IN_PROGRESS" | "DONE";

const PRIORITY_META: Record<
  ConsoleCoopTaskItem["priority"],
  { label: string; badgeClass: string }
> = {
  LOW: {
    label: "Baixa",
    badgeClass: "border-white/10 bg-white/[0.03] text-[#8F98A0]",
  },
  MEDIUM: {
    label: "Média",
    badgeClass: "border-[#66C0F4]/25 bg-[#66C0F4]/10 text-[#66C0F4]",
  },
  HIGH: {
    label: "Alta",
    badgeClass: "border-[#E5A93C]/30 bg-[#E5A93C]/10 text-[#E5A93C]",
  },
  URGENT: {
    label: "Urgente",
    badgeClass: "border-[#E04F33]/35 bg-[#E04F33]/10 text-[#E04F33]",
  },
};

export function ConsoleWorkspaceView({
  currentUser,
  subjects,
  tasks,
}: ConsoleWorkspaceViewProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [coopOnly, setCoopOnly] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    tasks[0]?.id ?? null
  );

  const [newModal, setNewModal] = useState<"TASK" | "SUBJECT" | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectColor, setSubjectColor] = useState("#66C0F4");
  const [creatingSubject, setCreatingSubject] = useState(false);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] =
    useState<ConsoleCoopTaskItem["priority"]>("MEDIUM");
  const [taskSubjectId, setTaskSubjectId] = useState(subjects[0]?.id ?? "");
  const [creatingTask, setCreatingTask] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (coopOnly && t.assignees.length <= 1 && !t.groupName) return false;
      if (statusFilter === "TODO") return t.status === "TODO";
      if (statusFilter === "IN_PROGRESS")
        return t.status === "IN_PROGRESS" || t.status === "REVIEW";
      if (statusFilter === "DONE") return t.status === "DONE";
      return true;
    });
  }, [tasks, statusFilter, coopOnly]);

  const inspectedTask = useMemo(
    () =>
      filteredTasks.find((t) => t.id === selectedTaskId) ??
      filteredTasks[0] ??
      null,
    [filteredTasks, selectedTaskId]
  );

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;
    setCreatingSubject(true);
    setFeedback(null);

    const res = await createSubjectAction({
      name: subjectName.trim(),
      code: subjectCode.trim() || null,
      accentColor: subjectColor,
    });

    setCreatingSubject(false);
    if (!res.ok) {
      setFeedback(res.error || "Erro ao criar disciplina.");
      return;
    }

    setSubjectName("");
    setSubjectCode("");
    setNewModal(null);
    setFeedback("Disciplina criada.");
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setCreatingTask(true);
    setFeedback(null);

    const res = await createCoopTaskAction({
      title: taskTitle.trim(),
      description: taskDescription.trim() || null,
      priority: taskPriority,
      subjectId: taskSubjectId || null,
      assigneeIds: [],
    });

    setCreatingTask(false);
    if (!res.ok) {
      setFeedback(res.error || "Erro ao criar tarefa.");
      return;
    }

    setTaskTitle("");
    setTaskDescription("");
    setNewModal(null);
    setFeedback("Tarefa adicionada.");
  };

  const handleToggleCompletion = async (
    taskId: string,
    currentCompleted: boolean
  ) => {
    setBusyId(taskId);
    await toggleCoopTaskCompletionAction(taskId, !currentCompleted);
    setBusyId(null);
  };

  const handleStatusChange = async (
    taskId: string,
    nextStatus: ConsoleCoopTaskItem["status"]
  ) => {
    setBusyId(taskId);
    await updateTaskStatusAction(taskId, nextStatus);
    setBusyId(null);
  };

  return (
    <ConsoleHudShell
      user={currentUser}
      ambientColor={subjects[0]?.accentColor || "#66C0F4"}
      onQuickCreateTask={() => setNewModal("TASK")}
    >
      <div className="space-y-6">
        {/* Barra de Filtros Superior */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/[0.07] bg-[#121820] p-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: "ALL", label: "Todas" },
                { id: "TODO", label: "A Fazer" },
                { id: "IN_PROGRESS", label: "Em Progresso" },
                { id: "DONE", label: "Concluídas" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  statusFilter === tab.id
                    ? "bg-[#1A222D] text-[#F3F4F6] ring-1 ring-[#66C0F4]/40"
                    : "text-[#8F98A0] hover:bg-[#1A222D]/50 hover:text-[#F3F4F6]"
                }`}
              >
                {tab.label}
              </button>
            ))}

            <span className="mx-1.5 h-4 w-px bg-white/10" />

            <button
              type="button"
              onClick={() => setCoopOnly((prev) => !prev)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                coopOnly
                  ? "bg-[#66C0F4]/15 text-[#66C0F4] ring-1 ring-[#66C0F4]/40"
                  : "text-[#8F98A0] hover:bg-[#1A222D]/50 hover:text-[#F3F4F6]"
              }`}
            >
              Apenas Co-op
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNewModal("SUBJECT")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#1A222D] px-3 py-2 text-xs font-medium text-[#F3F4F6] transition hover:border-[#66C0F4]/50"
            >
              <Plus className="h-3.5 w-3.5 text-[#66C0F4]" />
              <span>Disciplina</span>
            </button>

            <button
              type="button"
              onClick={() => setNewModal("TASK")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1A9FFF] px-3.5 py-2 text-xs font-semibold text-[#0B0F14] transition hover:bg-[#66C0F4]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nova Tarefa</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div className="rounded-xl border border-[#66C0F4]/30 bg-[#66C0F4]/10 px-4 py-2 text-xs text-[#66C0F4]">
            {feedback}
          </div>
        )}

        {/* Split-View: 65% Lista / 35% Inspetor Fixo */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Coluna Esquerda (65% -> 8 cols) */}
          <div className="space-y-3 lg:col-span-8">
            <div className="flex items-center justify-between px-1">
              <span className="font-mono text-xs uppercase tracking-wider text-[#8F98A0]">
                Fila Tática ({filteredTasks.length})
              </span>
              <span className="font-mono text-[11px] text-[#8F98A0]">
                Selecione para inspecionar
              </span>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#121820]/60 p-10 text-center text-sm text-[#8F98A0]">
                Nenhuma tarefa corresponde aos filtros selecionados.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#121820]">
                {filteredTasks.map((task) => {
                  const selected = inspectedTask?.id === task.id;
                  const priority = PRIORITY_META[task.priority];

                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedTaskId(task.id);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5 outline-none transition ${
                        selected
                          ? "bg-[#1A222D] ring-1 ring-inset ring-[#66C0F4]/60"
                          : "hover:bg-[#1A222D]/55"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <button
                          type="button"
                          disabled={busyId === task.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleCompletion(
                              task.id,
                              task.completedByCurrentUser
                            );
                          }}
                          className="shrink-0 text-[#8F98A0] transition hover:text-[#66C0F4]"
                        >
                          {task.completedByCurrentUser ? (
                            <CheckCircle2 className="h-4.5 w-4.5 text-[#A4D007]" />
                          ) : (
                            <Circle className="h-4.5 w-4.5" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <p
                            className={`truncate text-sm font-medium ${
                              task.completedByCurrentUser
                                ? "line-through text-[#8F98A0]"
                                : "text-[#F3F4F6]"
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[11px] text-[#8F98A0]">
                            {task.subjectName && <span>{task.subjectName}</span>}
                            {task.groupName && (
                              <span className="text-[#A4D007]">
                                · {task.groupName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2.5">
                        {task.assignees.length > 0 && (
                          <div className="flex -space-x-1.5">
                            {task.assignees.slice(0, 3).map((a) => {
                              const avatar = a.avatarUrl || a.image;
                              return avatar ? (
                                <img
                                  key={a.userId}
                                  src={avatar}
                                  alt={a.name}
                                  className="h-6 w-6 rounded-md object-cover ring-2 ring-[#121820]"
                                />
                              ) : (
                                <span
                                  key={a.userId}
                                  className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0B0F14] font-mono text-[10px] font-bold text-[#66C0F4] ring-2 ring-[#121820]"
                                >
                                  {a.name.charAt(0).toUpperCase()}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        <span
                          className={`rounded border px-2 py-0.5 font-mono text-[10px] ${priority.badgeClass}`}
                        >
                          {priority.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Coluna Direita (35% -> 4 cols — Painel Inspetor Fixo) */}
          <aside className="lg:col-span-4">
            <div className="sticky top-20 rounded-2xl border border-white/[0.07] bg-[#121820] p-5">
              <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#66C0F4]">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Inspetor de Tarefa</span>
                </div>
              </div>

              {!inspectedTask ? (
                <p className="py-8 text-center text-xs text-[#8F98A0]">
                  Nenhuma tarefa selecionada.
                </p>
              ) : (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-base font-bold leading-snug text-[#F3F4F6]">
                      {inspectedTask.title}
                    </h2>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#8F98A0]">
                      {inspectedTask.description ||
                        "Sem descrição adicional registrada para esta atividade."}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-mono text-[11px] uppercase text-[#8F98A0]">
                      Estado no Quadro
                    </label>
                    <select
                      value={inspectedTask.status}
                      disabled={busyId === inspectedTask.id}
                      onChange={(e) =>
                        handleStatusChange(
                          inspectedTask.id,
                          e.target.value as ConsoleCoopTaskItem["status"]
                        )
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-xs text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
                    >
                      <option value="TODO">A Fazer</option>
                      <option value="IN_PROGRESS">Em Progresso</option>
                      <option value="REVIEW">Em Revisão</option>
                      <option value="DONE">Concluída</option>
                    </select>
                  </div>

                  {inspectedTask.assignees.length > 0 && (
                    <div className="space-y-2">
                      <span className="block font-mono text-[11px] uppercase text-[#8F98A0]">
                        Progresso Co-op
                      </span>
                      <div className="space-y-1.5">
                        {inspectedTask.assignees.map((a) => (
                          <div
                            key={a.userId}
                            className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#0B0F14]/75 px-3 py-2 text-xs"
                          >
                            <span className="text-[#F3F4F6]">{a.name}</span>
                            <span
                              className={`font-mono text-[11px] ${
                                a.completedIndividual
                                  ? "text-[#A4D007]"
                                  : "text-[#8F98A0]"
                              }`}
                            >
                              {a.completedIndividual ? "Concluído" : "Pendente"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
                    <button
                      type="button"
                      disabled={busyId === inspectedTask.id}
                      onClick={() =>
                        handleToggleCompletion(
                          inspectedTask.id,
                          inspectedTask.completedByCurrentUser
                        )
                      }
                      className="rounded-xl bg-[#1A9FFF] px-3.5 py-2 text-xs font-semibold text-[#0B0F14] transition hover:bg-[#66C0F4]"
                    >
                      {inspectedTask.completedByCurrentUser
                        ? "Reabrir minha parte"
                        : "Concluir (+25 XP)"}
                    </button>

                    <Link
                      href={inspectedTask.href}
                      className="font-mono text-xs text-[#66C0F4] hover:underline"
                    >
                      Abrir contexto →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Modal Rápido */}
      {newModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          {newModal === "SUBJECT" ? (
            <form
              onSubmit={handleCreateSubject}
              className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-[#121820] p-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#F3F4F6]">
                  Nova Disciplina
                </h3>
                <button
                  type="button"
                  onClick={() => setNewModal(null)}
                  className="text-[#8F98A0] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <input
                type="text"
                required
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Nome da disciplina"
                className="w-full rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
              />
              <div className="flex gap-3">
                <input
                  type="text"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  placeholder="Código (ex: ES-102)"
                  className="flex-1 rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 font-mono text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
                />
                <input
                  type="color"
                  value={subjectColor}
                  onChange={(e) => setSubjectColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-white/10 bg-transparent"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewModal(null)}
                  className="rounded-xl bg-[#1A222D] px-4 py-2 text-xs text-[#8F98A0]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingSubject}
                  className="rounded-xl bg-[#1A9FFF] px-4 py-2 text-xs font-semibold text-[#0B0F14]"
                >
                  {creatingSubject ? "Criando..." : "Criar"}
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleCreateTask}
              className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-[#121820] p-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#F3F4F6]">
                  Nova Tarefa
                </h3>
                <button
                  type="button"
                  onClick={() => setNewModal(null)}
                  className="text-[#8F98A0] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Título da tarefa"
                className="w-full rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={taskSubjectId}
                  onChange={(e) => setTaskSubjectId(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-xs text-[#F3F4F6]"
                >
                  <option value="">Sem disciplina</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <select
                  value={taskPriority}
                  onChange={(e) =>
                    setTaskPriority(
                      e.target.value as ConsoleCoopTaskItem["priority"]
                    )
                  }
                  className="rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-xs text-[#F3F4F6]"
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>
              <textarea
                rows={2}
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Descrição (opcional)"
                className="w-full rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewModal(null)}
                  className="rounded-xl bg-[#1A222D] px-4 py-2 text-xs text-[#8F98A0]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingTask}
                  className="rounded-xl bg-[#1A9FFF] px-4 py-2 text-xs font-semibold text-[#0B0F14]"
                >
                  {creatingTask ? "Criando..." : "Criar Tarefa"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </ConsoleHudShell>
  );
}