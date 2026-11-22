"use client";

import React, { useState } from "react";
import { BookOpen, CheckCircle2, Circle, Layers, Plus } from "lucide-react";
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

export function ConsoleWorkspaceView({
  currentUser,
  subjects,
  tasks,
}: ConsoleWorkspaceViewProps) {
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectColor, setSubjectColor] = useState("#66C0F4");
  const [creatingSubject, setCreatingSubject] = useState(false);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskSubjectId, setTaskSubjectId] = useState(subjects[0]?.id ?? "");
  const [creatingTask, setCreatingTask] = useState(false);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

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
    setFeedback("Disciplina adicionada ao seu Workspace.");
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setCreatingTask(true);
    setFeedback(null);

    const res = await createCoopTaskAction({
      title: taskTitle.trim(),
      description: taskDescription.trim() || null,
      priority: "MEDIUM",
      subjectId: taskSubjectId || null,
    });

    setCreatingTask(false);
    if (!res.ok) {
      setFeedback(res.error || "Erro ao criar tarefa.");
      return;
    }

    setTaskTitle("");
    setTaskDescription("");
    setFeedback("Tarefa criada no Workspace.");
  };

  const handleToggle = async (taskId: string, currentCompleted: boolean) => {
    setTogglingId(taskId);
    await toggleCoopTaskCompletionAction(taskId, !currentCompleted);
    setTogglingId(null);
  };

  return (
    <ConsoleHudShell
      user={currentUser}
      ambientColor={subjects[0]?.accentColor || "#66C0F4"}
    >
      <div className="space-y-8">
        <section className="rounded-2xl border border-white/10 bg-[#171D25]/90 p-6 backdrop-blur-xl">
          <span className="font-mono text-xs uppercase tracking-wider text-[#66C0F4]">
            Estação de Trabalho Pessoal
          </span>
          <h1 className="mt-1 text-2xl font-bold text-[#F3F4F6] sm:text-3xl">
            Suas disciplinas e fila de tarefas
          </h1>
          <p className="mt-1 text-sm text-[#8F98A0]">
            Cadastre novas disciplinas, crie tópicos/tarefas e acompanhe o seu
            progresso na interface de console.
          </p>
        </section>

        {feedback && (
          <div className="rounded-xl border border-[#66C0F4]/40 bg-[#66C0F4]/10 px-4 py-2.5 text-xs font-medium text-[#66C0F4]">
            {feedback}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Nova Disciplina */}
          <form
            onSubmit={handleCreateSubject}
            className="space-y-4 rounded-2xl border border-white/10 bg-[#171D25]/90 p-6 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#66C0F4]" />
              <h2 className="text-lg font-bold text-[#F3F4F6]">
                Nova Disciplina
              </h2>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-[#8F98A0]">
                Nome da disciplina
              </label>
              <input
                type="text"
                required
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Ex.: Engenharia de Software"
                className="w-full rounded-lg border border-white/10 bg-[#0E141B] px-3.5 py-2 text-sm text-[#F3F4F6] placeholder-[#8F98A0] outline-none focus:border-[#66C0F4]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-[#8F98A0]">
                  Código (opcional)
                </label>
                <input
                  type="text"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  placeholder="Ex.: ENG-201"
                  className="w-full rounded-lg border border-white/10 bg-[#0E141B] px-3.5 py-2 font-mono text-sm text-[#F3F4F6] placeholder-[#8F98A0] outline-none focus:border-[#66C0F4]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-[#8F98A0]">
                  Cor de destaque
                </label>
                <input
                  type="color"
                  value={subjectColor}
                  onChange={(e) => setSubjectColor(e.target.value)}
                  className="h-9 w-full cursor-pointer rounded border border-white/15 bg-[#0E141B] px-1"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingSubject}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A9FFF] px-4 py-2.5 text-sm font-semibold text-[#0E141B] transition hover:bg-[#66C0F4] disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>
                {creatingSubject ? "Adicionando..." : "Adicionar disciplina"}
              </span>
            </button>
          </form>

          {/* Nova Tarefa */}
          <form
            onSubmit={handleCreateTask}
            className="space-y-4 rounded-2xl border border-white/10 bg-[#171D25]/90 p-6 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#A4D007]" />
              <h2 className="text-lg font-bold text-[#F3F4F6]">
                Novo Tópico / Tarefa de Estudo
              </h2>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-[#8F98A0]">
                Disciplina
              </label>
              <select
                value={taskSubjectId}
                onChange={(e) => setTaskSubjectId(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0E141B] px-3.5 py-2 text-sm text-[#F3F4F6] outline-none focus:border-[#66C0F4]"
              >
                <option value="">Geral / Sem disciplina</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-[#8F98A0]">
                Título do tópico ou atividade
              </label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Ex.: Resolver exercícios de normalização SQL"
                className="w-full rounded-lg border border-white/10 bg-[#0E141B] px-3.5 py-2 text-sm text-[#F3F4F6] placeholder-[#8F98A0] outline-none focus:border-[#66C0F4]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-[#8F98A0]">
                Descrição / Notas (opcional)
              </label>
              <input
                type="text"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Resumo ou referência rápida"
                className="w-full rounded-lg border border-white/10 bg-[#0E141B] px-3.5 py-2 text-sm text-[#F3F4F6] placeholder-[#8F98A0] outline-none focus:border-[#66C0F4]"
              />
            </div>

            <button
              type="submit"
              disabled={creatingTask}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#66C0F4]/40 bg-[#1E2631] px-4 py-2.5 text-sm font-semibold text-[#66C0F4] transition hover:bg-[#26303E] disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>{creatingTask ? "Adicionando..." : "Adicionar tarefa"}</span>
            </button>
          </form>
        </div>

        {/* Lista de Disciplinas e Tarefas */}
        <section className="space-y-4 rounded-2xl border border-white/10 bg-[#171D25]/90 p-6 backdrop-blur-xl">
          <h2 className="text-lg font-bold text-[#F3F4F6]">
            Disciplinas Cadastradas ({subjects.length})
          </h2>

          {subjects.length === 0 ? (
            <p className="text-sm text-[#8F98A0]">
              Nenhuma disciplina cadastrada ainda.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subj) => (
                <div
                  key={subj.id}
                  data-console-focusable="true"
                  tabIndex={0}
                  className="rounded-xl border border-white/10 bg-[#1E2631]/90 p-4 outline-none transition hover:border-[#66C0F4] focus-visible:ring-2 focus-visible:ring-[#66C0F4]"
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
                  <h3 className="mt-2 text-base font-bold text-[#F3F4F6]">
                    {subj.name}
                  </h3>
                  {subj.code && (
                    <p className="font-mono text-xs text-[#66C0F4]">
                      {subj.code}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-white/10 pt-5">
            <h3 className="mb-3 text-base font-bold text-[#F3F4F6]">
              Tarefas ({tasks.length})
            </h3>
            {tasks.length === 0 ? (
              <p className="text-sm text-[#8F98A0]">
                Nenhuma tarefa cadastrada nesta disciplina ainda.
              </p>
            ) : (
              <div className="space-y-2.5">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-[#1E2631]/80 p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={togglingId === t.id}
                        onClick={() =>
                          handleToggle(t.id, t.completedByCurrentUser)
                        }
                        className="text-[#66C0F4]"
                      >
                        {t.completedByCurrentUser ? (
                          <CheckCircle2 className="h-5 w-5 text-[#A4D007]" />
                        ) : (
                          <Circle className="h-5 w-5 text-[#8F98A0]" />
                        )}
                      </button>
                      <div>
                        <p className="text-sm font-semibold text-[#F3F4F6]">
                          {t.title}
                        </p>
                        {t.subjectName && (
                          <p className="font-mono text-xs text-[#8F98A0]">
                            {t.subjectName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </ConsoleHudShell>
  );
}