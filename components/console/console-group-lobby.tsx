"use client";

import React, { useState } from "react";
import { Check, CheckCircle2, Circle, Copy } from "lucide-react";
import {
  createCoopTaskAction,
  createSubjectAction,
  toggleCoopTaskCompletionAction,
} from "@/app/actions/coop.actions";
import {
  ConsoleHudShell,
  type ConsoleUserProfile,
} from "@/components/console/console-hud-shell";
import type { ConsoleCoopTaskItem } from "@/components/console/console-library-dashboard";

export interface ConsoleGroupMemberItem {
  id: string;
  name: string;
  email: string;
  username: string | null;
  avatarUrl: string | null;
  image: string | null;
  presence: string;
  statusText: string | null;
  role: string;
}

export interface ConsoleGroupSubjectItem {
  id: string;
  name: string;
  code: string | null;
  accentColor: string;
  taskCount: number;
}

export interface ConsoleGroupDetailData {
  id: string;
  name: string;
  description: string | null;
  bannerColor: string;
  inviteCode: string;
  members: ConsoleGroupMemberItem[];
  subjects: ConsoleGroupSubjectItem[];
  tasks: ConsoleCoopTaskItem[];
}

interface ConsoleGroupLobbyProps {
  currentUser: ConsoleUserProfile | null;
  group: ConsoleGroupDetailData;
}

export function ConsoleGroupLobby({
  currentUser,
  group,
}: ConsoleGroupLobbyProps) {
  const [copied, setCopied] = useState(false);

  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectColor, setSubjectColor] = useState("#7E49C7");
  const [creatingSubject, setCreatingSubject] = useState(false);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskSubjectId, setTaskSubjectId] = useState(
    group.subjects[0]?.id ?? ""
  );
  const [creatingTask, setCreatingTask] = useState(false);

  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const completedTasksCount = group.tasks.filter(
    (t) => t.completedByCurrentUser
  ).length;
  const progress =
    group.tasks.length > 0
      ? Math.round((completedTasksCount / group.tasks.length) * 100)
      : 0;

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setFeedback(`Código: ${group.inviteCode}`);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;
    setCreatingSubject(true);
    setFeedback(null);

    const res = await createSubjectAction({
      name: subjectName.trim(),
      code: subjectCode.trim() || null,
      accentColor: subjectColor,
      groupId: group.id,
    });

    setCreatingSubject(false);
    if (!res.ok) {
      setFeedback(res.error || "Erro ao criar disciplina.");
      return;
    }

    setSubjectName("");
    setSubjectCode("");
    setFeedback("Disciplina adicionada ao grupo.");
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setCreatingTask(true);
    setFeedback(null);

    const res = await createCoopTaskAction({
      title: taskTitle.trim(),
      description: taskDescription.trim() || null,
      priority: "MEDIUM",
      subjectId: taskSubjectId || null,
      groupId: group.id,
      assigneeIds: group.members.map((m) => m.id),
    });

    setCreatingTask(false);
    if (!res.ok) {
      setFeedback(res.error || "Erro ao criar tarefa.");
      return;
    }

    setTaskTitle("");
    setTaskDescription("");
    setFeedback("Tarefa compartilhada criada.");
  };

  const handleToggleTask = async (
    taskId: string,
    currentCompleted: boolean
  ) => {
    setTogglingTaskId(taskId);
    await toggleCoopTaskCompletionAction(taskId, !currentCompleted);
    setTogglingTaskId(null);
  };

  return (
    <ConsoleHudShell user={currentUser}>
      <div className="space-y-6">
        <section className="rounded-[2px] border border-[#CBB6FF]/15 border-t-4 border-t-[#7E49C7] bg-[#1B0B3A]">
          <div className="px-6 py-6">
            <span className="font-mono text-xs uppercase tracking-wider text-[#CBB6FF]">
              Grupo de Estudo Colaborativo
            </span>
            <h1 className="mt-1 font-serif text-3xl capitalize tracking-tight text-[#F4F1FA] sm:text-4xl">
              {group.name}
            </h1>
            {group.description && (
              <p className="mt-1 text-sm text-[#9D8EC4]">{group.description}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#CBB6FF]/15 bg-[#070512]/65 px-6 py-3">
            <div className="flex flex-wrap items-center gap-5 font-mono text-xs tabular-nums">
              <div>
                <span className="text-[#9D8EC4]">Progresso </span>
                <strong className="text-[#CBB6FF]">{progress}%</strong>
              </div>
              <div>
                <span className="text-[#9D8EC4]">Tarefas </span>
                <strong className="text-[#F4F1FA]">
                  {completedTasksCount}/{group.tasks.length}
                </strong>
              </div>
              <div>
                <span className="text-[#9D8EC4]">Membros </span>
                <strong className="text-[#F4F1FA]">
                  {group.members.length}
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyInvite}
              className="inline-flex items-center gap-2 rounded-[2px] border border-[#CBB6FF]/20 bg-[#1B0B3A] px-3 py-1.5 font-mono text-xs text-[#CBB6FF] transition-colors duration-150 hover:border-[#7E49C7]"
            >
              <span>{group.inviteCode}</span>
              {copied ? (
                <Check className="h-3.5 w-3.5 text-[#A4D007]" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </section>

        {feedback && (
          <div className="rounded-[2px] border border-[#7E49C7] bg-[#3B1C6E] px-4 py-2 text-xs text-[#F4F1FA]">
            {feedback}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <section className="space-y-4 rounded-[2px] border border-[#CBB6FF]/15 bg-[#1B0B3A] p-5">
              <div className="flex items-center justify-between border-b border-[#CBB6FF]/15 pb-2">
                <h2 className="font-serif text-xl text-[#F4F1FA]">
                  Tarefas Compartilhadas
                </h2>
                <span className="font-mono text-xs tabular-nums text-[#CBB6FF]">
                  {group.tasks.length}
                </span>
              </div>

              {currentUser && (
                <form
                  onSubmit={handleAddTask}
                  className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
                >
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Nova tarefa compartilhada..."
                    className="rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7] sm:col-span-2"
                  />
                  <select
                    value={taskSubjectId}
                    onChange={(e) => setTaskSubjectId(e.target.value)}
                    className="rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-xs text-[#F4F1FA]"
                  >
                    <option value="">Sem disciplina</option>
                    {group.subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Detalhes (opcional)"
                    className="rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7] sm:col-span-2"
                  />
                  <button
                    type="submit"
                    disabled={creatingTask}
                    className="rounded-[2px] bg-[#7E49C7] px-4 py-2 text-xs font-semibold text-[#F4F1FA] hover:bg-[#9361D9]"
                  >
                    {creatingTask ? "..." : "+ Adicionar"}
                  </button>
                </form>
              )}

              <div className="divide-y divide-[#CBB6FF]/10 rounded-[2px] border border-[#CBB6FF]/15 bg-[#070512]">
                {group.tasks.length === 0 ? (
                  <p className="p-6 text-center text-xs text-[#9D8EC4]">
                    Nenhuma tarefa cadastrada neste grupo ainda.
                  </p>
                ) : (
                  group.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
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
                            className="text-[#9D8EC4] hover:text-[#CBB6FF]"
                          >
                            {task.completedByCurrentUser ? (
                              <CheckCircle2 className="h-4 w-4 text-[#CBB6FF]" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        <div>
                          <p className="text-sm font-medium text-[#F4F1FA]">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-[#9D8EC4]">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="font-mono text-xs tabular-nums text-[#CBB6FF]">
                        {
                          task.assignees.filter((a) => a.completedIndividual)
                            .length
                        }
                        /{task.assignees.length || 1}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="space-y-4 rounded-[2px] border border-[#CBB6FF]/15 bg-[#1B0B3A] p-5">
              <h2 className="border-b border-[#CBB6FF]/15 pb-2 font-serif text-xl text-[#F4F1FA]">
                Disciplinas em Comum
              </h2>

              {currentUser && (
                <form
                  onSubmit={handleAddSubject}
                  className="flex flex-col gap-2.5 sm:flex-row"
                >
                  <input
                    type="text"
                    required
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="Nome da disciplina"
                    className="flex-1 rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
                  />
                  <input
                    type="text"
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    placeholder="Código"
                    className="w-full rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 font-mono text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7] sm:w-32"
                  />
                  <input
                    type="color"
                    value={subjectColor}
                    onChange={(e) => setSubjectColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-[2px] border border-[#CBB6FF]/20 bg-transparent"
                  />
                  <button
                    type="submit"
                    disabled={creatingSubject}
                    className="rounded-[2px] border border-[#7E49C7] bg-[#3B1C6E] px-4 py-2 text-xs font-semibold text-[#F4F1FA] hover:bg-[#7E49C7]"
                  >
                    {creatingSubject ? "..." : "+ Disciplina"}
                  </button>
                </form>
              )}

              {group.subjects.length === 0 ? (
                <p className="text-xs text-[#9D8EC4]">
                  Nenhuma disciplina cadastrada no grupo.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {group.subjects.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-[2px] border border-[#CBB6FF]/15 border-l-2 border-l-[#7E49C7] bg-[#070512] p-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase text-[#CBB6FF]">
                          {s.code || "TRILHA"}
                        </span>
                        <span className="font-mono text-[11px] tabular-nums text-[#9D8EC4]">
                          {s.taskCount} tarefas
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-semibold capitalize text-[#F4F1FA]">
                        {s.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="h-fit space-y-3 rounded-[2px] border border-[#CBB6FF]/15 bg-[#1B0B3A] p-5 lg:col-span-4">
            <h2 className="border-b border-[#CBB6FF]/15 pb-2 font-mono text-xs uppercase tracking-wider text-[#CBB6FF]">
              Integrantes ({group.members.length})
            </h2>
            <div className="space-y-2.5">
              {group.members.map((m) => {
                const avatar = m.avatarUrl || m.image;
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-[2px] border border-[#CBB6FF]/15 bg-[#070512] p-3"
                  >
                    <div className="flex items-center gap-2.5">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={m.name}
                          className="h-8 w-8 rounded-[2px] border border-[#CBB6FF]/20 object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-[2px] border border-[#CBB6FF]/20 bg-[#3B1C6E] font-mono text-xs font-bold text-[#CBB6FF]">
                          {m.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <div>
                        <p className="text-xs font-semibold text-[#F4F1FA]">
                          {m.name}
                        </p>
                        <p className="text-[11px] text-[#9D8EC4]">
                          {m.statusText || m.email}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] uppercase text-[#CBB6FF]">
                      {m.role}
                    </span>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
    </ConsoleHudShell>
  );
}