"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, X } from "lucide-react";
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
    badgeClass: "border-[#CBB6FF]/15 bg-[#070512] text-[#9D8EC4]",
  },
  MEDIUM: {
    label: "Média",
    badgeClass: "border-[#7E49C7]/50 bg-[#3B1C6E]/60 text-[#CBB6FF]",
  },
  HIGH: {
    label: "Alta",
    badgeClass: "border-[#7E49C7] bg-[#7E49C7]/35 text-[#F4F1FA]",
  },
  URGENT: {
    label: "Urgente",
    badgeClass: "border-[#E04F33]/60 bg-[#E04F33]/20 text-[#F4F1FA]",
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
  const [subjectColor, setSubjectColor] = useState("#7E49C7");
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
      onQuickCreateTask={() => setNewModal("TASK")}
    >
      <div className="space-y-5">
        {/* Barra de Filtros Sólida */}
        <div className="flex flex-col justify-between gap-3 rounded-[2px] border border-[#CBB6FF]/15 bg-[#1B0B3A] p-3.5 sm:flex-row sm:items-center">
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
                className={`rounded-[2px] px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                  statusFilter === tab.id
                    ? "bg-[#7E49C7] text-[#F4F1FA]"
                    : "text-[#9D8EC4] hover:bg-[#3B1C6E]/60 hover:text-[#F4F1FA]"
                }`}
              >
                {tab.label}
              </button>
            ))}

            <span className="mx-1.5 h-4 w-px bg-[#CBB6FF]/15" />

            <button
              type="button"
              onClick={() => setCoopOnly((prev) => !prev)}
              className={`rounded-[2px] border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                coopOnly
                  ? "border-[#7E49C7] bg-[#3B1C6E] text-[#CBB6FF]"
                  : "border-transparent text-[#9D8EC4] hover:bg-[#3B1C6E]/60 hover:text-[#F4F1FA]"
              }`}
            >
              Apenas Co-op
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNewModal("SUBJECT")}
              className="rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-1.5 text-xs font-medium text-[#F4F1FA] transition-colors duration-150 hover:border-[#7E49C7]"
            >
              + Disciplina
            </button>

            <button
              type="button"
              onClick={() => setNewModal("TASK")}
              className="rounded-[2px] bg-[#7E49C7] px-3.5 py-1.5 text-xs font-semibold text-[#F4F1FA] transition-colors duration-150 hover:bg-[#9361D9]"
            >
              + Nova Tarefa
            </button>
          </div>
        </div>

        {feedback && (
          <div className="rounded-[2px] border border-[#7E49C7] bg-[#3B1C6E] px-4 py-2 text-xs text-[#F4F1FA]">
            {feedback}
          </div>
        )}

        {/* Split-View: Lista (8 cols) + Inspetor (4 cols) */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="space-y-2.5 lg:col-span-8">
            <div className="flex items-center justify-between border-b border-[#CBB6FF]/15 pb-1.5 font-mono text-[11px] uppercase tracking-wider text-[#9D8EC4]">
              <span>Fila de Tarefas ({filteredTasks.length})</span>
              <span>Clique para inspecionar</span>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="rounded-[2px] border border-dashed border-[#CBB6FF]/20 bg-[#1B0B3A]/40 p-10 text-center text-sm text-[#9D8EC4]">
                Nenhuma tarefa corresponde aos filtros selecionados.
              </div>
            ) : (
              <div className="divide-y divide-[#CBB6FF]/10 rounded-[2px] border border-[#CBB6FF]/15 bg-[#1B0B3A]">
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
                      className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-3 outline-none transition-colors duration-150 ${
                        selected
                          ? "border-l-2 border-l-[#CBB6FF] bg-[#3B1C6E]"
                          : "hover:bg-[#3B1C6E]/45"
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
                          className="shrink-0 text-[#9D8EC4] hover:text-[#CBB6FF]"
                        >
                          {task.completedByCurrentUser ? (
                            <CheckCircle2 className="h-4 w-4 text-[#CBB6FF]" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <p
                            className={`truncate text-sm font-medium ${
                              task.completedByCurrentUser
                                ? "line-through text-[#9D8EC4]"
                                : "text-[#F4F1FA]"
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[11px] text-[#9D8EC4]">
                            {task.subjectName && <span>{task.subjectName}</span>}
                            {task.groupName && (
                              <span className="text-[#CBB6FF]">
                                · {task.groupName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2.5">
                        <span
                          className={`rounded-[2px] border px-2 py-0.5 font-mono text-[10px] ${priority.badgeClass}`}
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

          {/* Inspetor Fixo */}
          <aside className="lg:col-span-4">
            <div className="sticky top-16 rounded-[2px] border border-[#CBB6FF]/20 bg-[#1B0B3A] p-5">
              <div className="mb-4 border-b border-[#CBB6FF]/15 pb-2.5 font-mono text-[11px] uppercase tracking-wider text-[#CBB6FF]">
                Inspetor de Tarefa
              </div>

              {!inspectedTask ? (
                <p className="py-8 text-center text-xs text-[#9D8EC4]">
                  Nenhuma tarefa selecionada.
                </p>
              ) : (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-serif text-xl leading-snug text-[#F4F1FA]">
                      {inspectedTask.title}
                    </h2>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#9D8EC4]">
                      {inspectedTask.description ||
                        "Sem descrição adicional registrada para esta atividade."}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-mono text-[11px] uppercase text-[#9D8EC4]">
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
                      className="w-full rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-xs text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
                    >
                      <option value="TODO">A Fazer</option>
                      <option value="IN_PROGRESS">Em Progresso</option>
                      <option value="REVIEW">Em Revisão</option>
                      <option value="DONE">Concluída</option>
                    </select>
                  </div>

                  {inspectedTask.assignees.length > 0 && (
                    <div className="space-y-2">
                      <span className="block font-mono text-[11px] uppercase text-[#9D8EC4]">
                        Progresso Co-op
                      </span>
                      <div className="space-y-1.5">
                        {inspectedTask.assignees.map((a) => (
                          <div
                            key={a.userId}
                            className="flex items-center justify-between rounded-[2px] border border-[#CBB6FF]/15 bg-[#070512] px-3 py-2 text-xs"
                          >
                            <span className="text-[#F4F1FA]">{a.name}</span>
                            <span
                              className={`font-mono text-[11px] ${
                                a.completedIndividual
                                  ? "text-[#CBB6FF]"
                                  : "text-[#9D8EC4]"
                              }`}
                            >
                              {a.completedIndividual ? "Concluído" : "Pendente"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-[#CBB6FF]/15 pt-4">
                    <button
                      type="button"
                      disabled={busyId === inspectedTask.id}
                      onClick={() =>
                        handleToggleCompletion(
                          inspectedTask.id,
                          inspectedTask.completedByCurrentUser
                        )
                      }
                      className="rounded-[2px] bg-[#7E49C7] px-3.5 py-2 text-xs font-semibold text-[#F4F1FA] transition-colors duration-150 hover:bg-[#9361D9]"
                    >
                      {inspectedTask.completedByCurrentUser
                        ? "Reabrir minha parte"
                        : "Concluir (+25 XP)"}
                    </button>

                    <Link
                      href={inspectedTask.href}
                      className="font-mono text-xs text-[#CBB6FF] hover:underline"
                    >
                      Contexto →
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#070512]/85 p-4">
          {newModal === "SUBJECT" ? (
            <form
              onSubmit={handleCreateSubject}
              className="w-full max-w-md space-y-4 rounded-[2px] border border-[#CBB6FF]/25 bg-[#1B0B3A] p-6"
            >
              <div className="flex items-center justify-between border-b border-[#CBB6FF]/15 pb-3">
                <h3 className="font-serif text-xl text-[#F4F1FA]">
                  Nova Disciplina
                </h3>
                <button
                  type="button"
                  onClick={() => setNewModal(null)}
                  className="text-[#9D8EC4] hover:text-[#F4F1FA]"
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
                className="w-full rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
              />
              <div className="flex gap-3">
                <input
                  type="text"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  placeholder="Código (ex: ES-102)"
                  className="flex-1 rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 font-mono text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
                />
                <input
                  type="color"
                  value={subjectColor}
                  onChange={(e) => setSubjectColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded-[2px] border border-[#CBB6FF]/20 bg-transparent"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewModal(null)}
                  className="rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-4 py-2 text-xs text-[#9D8EC4]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingSubject}
                  className="rounded-[2px] bg-[#7E49C7] px-4 py-2 text-xs font-semibold text-[#F4F1FA]"
                >
                  {creatingSubject ? "Criando..." : "Criar"}
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleCreateTask}
              className="w-full max-w-md space-y-4 rounded-[2px] border border-[#CBB6FF]/25 bg-[#1B0B3A] p-6"
            >
              <div className="flex items-center justify-between border-b border-[#CBB6FF]/15 pb-3">
                <h3 className="font-serif text-xl text-[#F4F1FA]">
                  Nova Tarefa
                </h3>
                <button
                  type="button"
                  onClick={() => setNewModal(null)}
                  className="text-[#9D8EC4] hover:text-[#F4F1FA]"
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
                className="w-full rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={taskSubjectId}
                  onChange={(e) => setTaskSubjectId(e.target.value)}
                  className="rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-xs text-[#F4F1FA]"
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
                  className="rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-xs text-[#F4F1FA]"
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
                className="w-full rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewModal(null)}
                  className="rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-4 py-2 text-xs text-[#9D8EC4]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingTask}
                  className="rounded-[2px] bg-[#7E49C7] px-4 py-2 text-xs font-semibold text-[#F4F1FA]"
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