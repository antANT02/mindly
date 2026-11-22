"use client";

import React, { useState } from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  Copy,
  Plus,
} from "lucide-react";
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
  const [subjectColor, setSubjectColor] = useState("#66C0F4");
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
    <ConsoleHudShell user={currentUser} ambientColor={group.bannerColor}>
      <div className="space-y-6">
        {/* Header Cinematográfico + Action Bar Integrada */}
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#121820]">
          <div
            className="h-44 w-full"
            style={{
              backgroundImage: `radial-gradient(circle at 80% 20%, ${group.bannerColor}66 0%, transparent 60%), linear-gradient(180deg, ${group.bannerColor}22 0%, #0B0F14 100%)`,
            }}
          />

          <div className="relative -mt-20 px-6 pb-5">
            <span className="font-mono text-xs uppercase tracking-wider text-[#A4D007]">
              Grupo de Estudo Colaborativo
            </span>
            <h1 className="mt-1 text-2xl font-bold capitalize tracking-tight text-[#F3F4F6] sm:text-3xl">
              {group.name}
            </h1>
            {group.description && (
              <p className="mt-1 text-sm text-[#8F98A0]">{group.description}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] bg-[#0B0F14]/70 px-6 py-3">
            <div className="flex flex-wrap items-center gap-5 font-mono text-xs tabular-nums">
              <div>
                <span className="text-[#8F98A0]">Progresso </span>
                <strong className="text-[#F3F4F6]">{progress}%</strong>
              </div>
              <div>
                <span className="text-[#8F98A0]">Tarefas </span>
                <strong className="text-[#A4D007]">
                  {completedTasksCount}/{group.tasks.length}
                </strong>
              </div>
              <div>
                <span className="text-[#8F98A0]">Membros </span>
                <strong className="text-[#F3F4F6]">
                  {group.members.length}
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyInvite}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#1A222D] px-3 py-1.5 font-mono text-xs text-[#66C0F4] transition hover:border-[#66C0F4]"
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
          <div className="rounded-xl border border-[#66C0F4]/30 bg-[#66C0F4]/10 px-4 py-2 text-xs text-[#66C0F4]">
            {feedback}
          </div>
        )}

        {/* Grid 2 Colunas */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {/* Tarefas Compartilhadas */}
            <section className="space-y-4 rounded-2xl border border-white/[0.07] bg-[#121820] p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#F3F4F6]">
                  Tarefas Compartilhadas
                </h2>
                <span className="font-mono text-xs tabular-nums text-[#8F98A0]">
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
                    className="rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4] sm:col-span-2"
                  />
                  <select
                    value={taskSubjectId}
                    onChange={(e) => setTaskSubjectId(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-xs text-[#F3F4F6]"
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
                    className="rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4] sm:col-span-2"
                  />
                  <button
                    type="submit"
                    disabled={creatingTask}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1A9FFF] px-4 py-2 text-xs font-semibold text-[#0B0F14] hover:bg-[#66C0F4]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{creatingTask ? "..." : "Adicionar"}</span>
                  </button>
                </form>
              )}

              <div className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.06] bg-[#0B0F14]/50">
                {group.tasks.length === 0 ? (
                  <p className="p-6 text-center text-xs text-[#8F98A0]">
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
                            className="text-[#8F98A0] hover:text-[#66C0F4]"
                          >
                            {task.completedByCurrentUser ? (
                              <CheckCircle2 className="h-4.5 w-4.5 text-[#A4D007]" />
                            ) : (
                              <Circle className="h-4.5 w-4.5" />
                            )}
                          </button>
                        )}
                        <div>
                          <p className="text-sm font-medium text-[#F3F4F6]">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-[#8F98A0]">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="font-mono text-xs tabular-nums text-[#8F98A0]">
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

            {/* Disciplinas em Comum */}
            <section className="space-y-4 rounded-2xl border border-white/[0.07] bg-[#121820] p-5">
              <h2 className="text-base font-bold text-[#F3F4F6]">
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
                    className="flex-1 rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
                  />
                  <input
                    type="text"
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    placeholder="Código"
                    className="w-full rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 font-mono text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4] sm:w-32"
                  />
                  <input
                    type="color"
                    value={subjectColor}
                    onChange={(e) => setSubjectColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-white/10 bg-transparent"
                  />
                  <button
                    type="submit"
                    disabled={creatingSubject}
                    className="rounded-xl border border-white/10 bg-[#1A222D] px-4 py-2 text-xs font-semibold text-[#66C0F4] hover:border-[#66C0F4]"
                  >
                    {creatingSubject ? "..." : "Nova Disciplina"}
                  </button>
                </form>
              )}

              {group.subjects.length === 0 ? (
                <p className="text-xs text-[#8F98A0]">
                  Nenhuma disciplina cadastrada no grupo.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {group.subjects.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-xl border border-white/[0.06] bg-[#0B0F14]/65 p-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: s.accentColor }}
                        />
                        <span className="font-mono text-[11px] tabular-nums text-[#8F98A0]">
                          {s.taskCount} tarefas
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-semibold capitalize text-[#F3F4F6]">
                        {s.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Lateral: Integrantes */}
          <aside className="h-fit space-y-3 rounded-2xl border border-white/[0.07] bg-[#121820] p-5 lg:col-span-4">
            <h2 className="font-mono text-xs uppercase tracking-wider text-[#8F98A0]">
              Integrantes ({group.members.length})
            </h2>
            <div className="space-y-2.5">
              {group.members.map((m) => {
                const avatar = m.avatarUrl || m.image;
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0B0F14]/65 p-3"
                  >
                    <div className="flex items-center gap-2.5">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={m.name}
                          className="h-8 w-8 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A222D] font-mono text-xs font-bold text-[#66C0F4]">
                          {m.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <div>
                        <p className="text-xs font-semibold text-[#F3F4F6]">
                          {m.name}
                        </p>
                        <p className="text-[11px] text-[#8F98A0]">
                          {m.statusText || m.email}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] uppercase text-[#66C0F4]">
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