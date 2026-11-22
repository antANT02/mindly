"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Check,
  CheckCircle2,
  Circle,
  Copy,
  FolderKanban,
  Plus,
  Shield,
  Users,
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

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFeedback(`Código do convite: ${group.inviteCode}`);
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
      setFeedback(res.error || "Não foi possível adicionar a disciplina.");
      return;
    }

    setSubjectName("");
    setSubjectCode("");
    setFeedback("Disciplina adicionada ao lobby.");
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setCreatingTask(true);
    setFeedback(null);

    const memberIds = group.members.map((m) => m.id);
    const res = await createCoopTaskAction({
      title: taskTitle.trim(),
      description: taskDescription.trim() || null,
      priority: "MEDIUM",
      subjectId: taskSubjectId || null,
      groupId: group.id,
      assigneeIds: memberIds,
    });

    setCreatingTask(false);
    if (!res.ok) {
      setFeedback(res.error || "Não foi possível criar a tarefa.");
      return;
    }

    setTaskTitle("");
    setTaskDescription("");
    setFeedback("Tarefa compartilhada criada para o grupo.");
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
      <div className="space-y-8">
        {/* Banner do Lobby */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#171D25]/90 p-6 shadow-xl backdrop-blur-xl"
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-30"
            style={{
              background: `linear-gradient(180deg, ${group.bannerColor} 0%, transparent 100%)`,
            }}
          />

          <div className="relative flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#A4D007]/30 bg-[#A4D007]/10 px-3 py-0.5 font-mono text-[11px] uppercase tracking-wider text-[#A4D007]">
                <Users className="h-3.5 w-3.5" />
                <span>Grupo de Estudo Colaborativo</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#F3F4F6] sm:text-3xl">
                {group.name}
              </h1>
              {group.description && (
                <p className="text-sm uppercase tracking-wide text-[#8F98A0]">
                  {group.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="rounded-xl border border-white/15 bg-[#0E141B]/90 px-3.5 py-2 font-mono text-xs text-[#8F98A0]">
                CONVITE{" "}
                <span className="ml-1.5 font-bold text-[#66C0F4]">
                  {group.inviteCode}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyInvite}
                data-console-focusable="true"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#1E2631] px-4 py-2 text-xs font-semibold text-[#F3F4F6] outline-none transition hover:border-[#66C0F4] hover:bg-[#26303E] focus-visible:ring-2 focus-visible:ring-[#66C0F4]"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-[#A4D007]" />
                    <span className="text-[#A4D007]">Código copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-[#66C0F4]" />
                    <span>Copiar código</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.section>

        {feedback && (
          <div className="rounded-xl border border-[#66C0F4]/40 bg-[#66C0F4]/10 px-4 py-2.5 text-xs font-medium text-[#66C0F4]">
            {feedback}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Coluna Principal: Tarefas Compartilhadas & Disciplinas em Comum */}
          <div className="space-y-6 lg:col-span-2">
            {/* Tarefas Compartilhadas */}
            <section className="space-y-4 rounded-2xl border border-white/10 bg-[#171D25]/90 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5 text-[#66C0F4]" />
                  <h2 className="text-lg font-bold text-[#F3F4F6]">
                    Tarefas compartilhadas
                  </h2>
                </div>
                <span className="font-mono text-xs text-[#8F98A0]">
                  {group.tasks.length} tarefas
                </span>
              </div>

              {currentUser && (
                <form
                  onSubmit={handleAddTask}
                  className="grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-[#0E141B]/75 p-4 sm:grid-cols-3"
                >
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Nova tarefa compartilhada..."
                    className="rounded-lg border border-white/10 bg-[#171D25] px-3 py-2 text-sm text-[#F3F4F6] placeholder-[#8F98A0] outline-none focus:border-[#66C0F4] sm:col-span-2"
                  />
                  <select
                    value={taskSubjectId}
                    onChange={(e) => setTaskSubjectId(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#171D25] px-3 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
                  >
                    <option value="">Sem disciplina</option>
                    {group.subjects.map((subj) => (
                      <option key={subj.id} value={subj.id}>
                        {subj.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Descrição ou critério de entrega (opcional)"
                    className="rounded-lg border border-white/10 bg-[#171D25] px-3 py-2 text-sm text-[#F3F4F6] placeholder-[#8F98A0] outline-none focus:border-[#66C0F4] sm:col-span-2"
                  />
                  <button
                    type="submit"
                    disabled={creatingTask}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1A9FFF] px-4 py-2 text-sm font-semibold text-[#0E141B] transition hover:bg-[#66C0F4] disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{creatingTask ? "Salvando..." : "Adicionar tarefa"}</span>
                  </button>
                </form>
              )}

              {group.tasks.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 bg-[#0E141B]/50 p-6 text-center text-sm text-[#8F98A0]">
                  Nenhuma tarefa cadastrada neste grupo ainda.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {group.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#1E2631]/85 p-3.5"
                    >
                      <div className="flex items-start gap-3">
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
                            className="mt-0.5 text-[#66C0F4] transition hover:scale-105 disabled:opacity-50"
                          >
                            {task.completedByCurrentUser ? (
                              <CheckCircle2 className="h-5 w-5 text-[#A4D007]" />
                            ) : (
                              <Circle className="h-5 w-5 text-[#8F98A0]" />
                            )}
                          </button>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-[#F3F4F6]">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-[#8F98A0]">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="font-mono text-xs text-[#8F98A0]">
                        {
                          task.assignees.filter((a) => a.completedIndividual)
                            .length
                        }
                        /{task.assignees.length || 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Disciplinas em Comum */}
            <section className="space-y-4 rounded-2xl border border-white/10 bg-[#171D25]/90 p-6 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#A4D007]" />
                <h2 className="text-lg font-bold text-[#F3F4F6]">
                  Disciplinas em comum
                </h2>
              </div>

              {currentUser && (
                <form
                  onSubmit={handleAddSubject}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center"
                >
                  <input
                    type="text"
                    required
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="Nome da disciplina"
                    className="flex-1 rounded-lg border border-white/10 bg-[#0E141B] px-3.5 py-2 text-sm text-[#F3F4F6] placeholder-[#8F98A0] outline-none focus:border-[#66C0F4]"
                  />
                  <input
                    type="text"
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    placeholder="Código (ex: MAT-101)"
                    className="w-full rounded-lg border border-white/10 bg-[#0E141B] px-3.5 py-2 font-mono text-sm text-[#F3F4F6] placeholder-[#8F98A0] outline-none focus:border-[#66C0F4] sm:w-36"
                  />
                  <input
                    type="color"
                    value={subjectColor}
                    onChange={(e) => setSubjectColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-white/15 bg-transparent"
                  />
                  <button
                    type="submit"
                    disabled={creatingSubject}
                    className="rounded-lg border border-[#66C0F4]/40 bg-[#1A9FFF]/20 px-4 py-2 text-sm font-semibold text-[#66C0F4] transition hover:bg-[#1A9FFF]/30 disabled:opacity-50"
                  >
                    {creatingSubject ? "Criando..." : "Nova disciplina"}
                  </button>
                </form>
              )}

              {group.subjects.length === 0 ? (
                <p className="border-t border-white/10 pt-4 text-sm text-[#8F98A0]">
                  Nenhuma disciplina cadastrada no grupo.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
                  {group.subjects.map((subj) => (
                    <div
                      key={subj.id}
                      className="rounded-xl border border-white/10 bg-[#1E2631]/85 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: subj.accentColor }}
                        />
                        <span className="font-mono text-xs text-[#8F98A0]">
                          {subj.taskCount} tarefas
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-bold text-[#F3F4F6]">
                        {subj.name}
                      </h3>
                      {subj.code && (
                        <p className="font-mono text-[11px] text-[#66C0F4]">
                          {subj.code}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Coluna Lateral: Integrantes */}
          <aside className="h-fit space-y-4 rounded-2xl border border-white/10 bg-[#171D25]/90 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#F3F4F6]">
                Integrantes
              </h2>
              <Users className="h-4 w-4 text-[#8F98A0]" />
            </div>

            <div className="space-y-3">
              {group.members.map((member) => {
                const avatar = member.avatarUrl || member.image;
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#1E2631]/80 p-3"
                  >
                    <div className="flex items-center gap-3">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={member.name}
                          className="h-9 w-9 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#26303E] font-mono text-xs font-bold text-[#66C0F4]">
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-[#F3F4F6]">
                          {member.name}
                        </p>
                        <p className="text-xs text-[#8F98A0]">
                          {member.statusText || member.email}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 rounded border border-[#66C0F4]/30 bg-[#66C0F4]/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-[#66C0F4]">
                      <Shield className="h-3 w-3" />
                      {member.role}
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