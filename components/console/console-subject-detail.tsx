"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import {
  createCoopTaskAction,
  createLegacyDisciplinaTaskAction,
  toggleCoopTaskCompletionAction,
  toggleLegacyDisciplinaTaskAction,
} from "@/app/actions/coop.actions";
import {
  ConsoleHudShell,
  type ConsoleUserProfile,
} from "@/components/console/console-hud-shell";
import type { ConsoleCoopTaskItem } from "@/components/console/console-library-dashboard";

export interface SubjectDetailData {
  id: string;
  name: string;
  code: string | null;
  accentColor: string;
  groupName: string | null;
  isLegacy: boolean;
  tasks: ConsoleCoopTaskItem[];
}

interface ConsoleSubjectDetailProps {
  currentUser: ConsoleUserProfile | null;
  subject: SubjectDetailData;
}

export function ConsoleSubjectDetail({
  currentUser,
  subject,
}: ConsoleSubjectDetailProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const completedCount = subject.tasks.filter(
    (t) => t.completedByCurrentUser
  ).length;
  const progress =
    subject.tasks.length > 0
      ? Math.round((completedCount / subject.tasks.length) * 100)
      : 0;

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setFeedback(null);

    const res = subject.isLegacy
      ? await createLegacyDisciplinaTaskAction({
          disciplinaId: subject.id,
          titulo: title.trim(),
          descricao: description.trim() || null,
        })
      : await createCoopTaskAction({
          title: title.trim(),
          description: description.trim() || null,
          priority: "MEDIUM",
          subjectId: subject.id,
          assigneeIds: [],
        });

    setSubmitting(false);
    if (!res.ok) {
      setFeedback(res.error || "Erro ao adicionar tarefa.");
      return;
    }

    setTitle("");
    setDescription("");
    setFeedback("Tarefa vinculada à disciplina.");
    router.refresh();
  };

  const handleToggle = async (taskId: string, currentCompleted: boolean) => {
    setTogglingId(taskId);
    if (subject.isLegacy) {
      await toggleLegacyDisciplinaTaskAction(taskId, !currentCompleted);
    } else {
      await toggleCoopTaskCompletionAction(taskId, !currentCompleted);
    }
    setTogglingId(null);
    router.refresh();
  };

  return (
    <ConsoleHudShell user={currentUser}>
      <div className="space-y-6">
        {/* Cabeçalho Editorial Sólido */}
        <section className="rounded-[2px] border border-[#CBB6FF]/15 border-t-4 border-t-[#7E49C7] bg-[#1B0B3A]">
          <div className="px-6 py-6">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-2 py-0.5 text-[#CBB6FF]">
                {subject.code || "DISCIPLINA"}
              </span>
              {subject.groupName && (
                <span className="rounded-[2px] bg-[#3B1C6E] px-2 py-0.5 text-[#F4F1FA]">
                  {subject.groupName}
                </span>
              )}
            </div>
            <h1 className="mt-2 font-serif text-3xl capitalize tracking-tight text-[#F4F1FA] sm:text-4xl">
              {subject.name}
            </h1>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#CBB6FF]/15 bg-[#070512]/65 px-6 py-3">
            <div className="flex items-center gap-6 font-mono text-xs tabular-nums">
              <div>
                <span className="text-[#9D8EC4]">Progresso </span>
                <strong className="text-[#CBB6FF]">{progress}%</strong>
              </div>
              <div>
                <span className="text-[#9D8EC4]">Concluídas </span>
                <strong className="text-[#F4F1FA]">
                  {completedCount}/{subject.tasks.length}
                </strong>
              </div>
            </div>

            <div className="h-1.5 w-44 bg-[#070512]">
              <div
                className="h-full bg-[#7E49C7] transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </section>

        {feedback && (
          <div className="rounded-[2px] border border-[#7E49C7] bg-[#3B1C6E] px-4 py-2 text-xs text-[#F4F1FA]">
            {feedback}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            {currentUser && (
              <form
                onSubmit={handleAddTask}
                className="flex flex-col gap-2.5 rounded-[2px] border border-[#CBB6FF]/15 bg-[#1B0B3A] p-4 sm:flex-row"
              >
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nova atividade nesta disciplina..."
                  className="flex-1 rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7]"
                />
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nota opcional"
                  className="rounded-[2px] border border-[#CBB6FF]/20 bg-[#070512] px-3 py-2 text-sm text-[#F4F1FA] outline-none focus:border-[#7E49C7] sm:w-48"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-[2px] bg-[#7E49C7] px-4 py-2 text-xs font-semibold text-[#F4F1FA] transition-colors duration-150 hover:bg-[#9361D9] disabled:opacity-50"
                >
                  {submitting ? "Salvando..." : "+ Adicionar"}
                </button>
              </form>
            )}

            <div className="divide-y divide-[#CBB6FF]/10 rounded-[2px] border border-[#CBB6FF]/15 bg-[#1B0B3A]">
              {subject.tasks.length === 0 ? (
                <p className="p-8 text-center text-sm text-[#9D8EC4]">
                  Nenhuma tarefa cadastrada nesta disciplina ainda.
                </p>
              ) : (
                subject.tasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 px-4 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={togglingId === t.id}
                        onClick={() =>
                          handleToggle(t.id, t.completedByCurrentUser)
                        }
                        className="text-[#9D8EC4] hover:text-[#CBB6FF] disabled:opacity-50"
                      >
                        {t.completedByCurrentUser ? (
                          <CheckCircle2 className="h-4 w-4 text-[#CBB6FF]" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </button>
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            t.completedByCurrentUser
                              ? "line-through text-[#9D8EC4]"
                              : "text-[#F4F1FA]"
                          }`}
                        >
                          {t.title}
                        </p>
                        {t.description && (
                          <p className="text-xs text-[#9D8EC4]">
                            {t.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <aside className="h-fit space-y-3 rounded-[2px] border border-[#CBB6FF]/15 bg-[#1B0B3A] p-5 lg:col-span-4">
            <h2 className="border-b border-[#CBB6FF]/15 pb-2 font-mono text-xs uppercase tracking-wider text-[#CBB6FF]">
              Resumo da Trilha
            </h2>
            <div className="space-y-2 text-xs text-[#9D8EC4]">
              <div className="flex justify-between">
                <span>Total de entregas</span>
                <span className="font-mono tabular-nums text-[#F4F1FA]">
                  {subject.tasks.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Concluídas</span>
                <span className="font-mono tabular-nums text-[#CBB6FF]">
                  {completedCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pendentes</span>
                <span className="font-mono tabular-nums text-[#F4F1FA]">
                  {Math.max(0, subject.tasks.length - completedCount)}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </ConsoleHudShell>
  );
}